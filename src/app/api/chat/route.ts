import { config } from 'dotenv';

// Add this at the top
config({ path: '.env.local' });

import { NextRequest, NextResponse } from 'next/server';
import { Index } from '@upstash/vector';
import Groq from 'groq-sdk';
import { Client } from 'pg';

// Simple in-memory rate limiting (use Redis for production)
const RATE_LIMIT = new Map();

const index = new Index({
  url: process.env.UPSTASH_VECTOR_REST_URL!,
  token: process.env.UPSTASH_VECTOR_REST_TOKEN!,
});

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY!,
});

const getDbClient = () => new Client({
  connectionString: process.env.DATABASE_URL,
});

export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const ip = (request as NextRequest & { ip?: string }).ip || request.headers.get('x-forwarded-for') || 'unknown';
    const now = Date.now();
    const windowMs = 60 * 1000; // 1 minute
    const maxRequests = 10;

    if (!RATE_LIMIT.has(ip)) {
      RATE_LIMIT.set(ip, []);
    }

    const requests = RATE_LIMIT.get(ip);
    const validRequests = requests.filter((time: number) => now - time < windowMs);
    
    if (validRequests.length >= maxRequests) {
      return NextResponse.json(
        { error: 'Too many requests. Please wait a minute.' },
        { status: 429 }
      );
    }

    validRequests.push(now);
    RATE_LIMIT.set(ip, validRequests);

    // Input validation
    const body = await request.json();
    
    if (!body.message || typeof body.message !== 'string') {
      return NextResponse.json(
        { error: 'Message is required and must be a string' },
        { status: 400 }
      );
    }

    if (body.message.length > 1000) {
      return NextResponse.json(
        { error: 'Message too long (max 1000 characters)' },
        { status: 400 }
      );
    }

    const message = body.message.trim();
    const sessionId = body.sessionId;

    console.log('🔍 User inquiry:', message);

    // STEP 0.5: Detect if user wants to send inquiry/contact Louis
    const contactKeywords = /\b(contact|email|reach out|get in touch|send message|inquiry|inquire|hire|hiring|job|opportunity|work with|work together|collaborate|collaboration|partnership|consult|consulting|freelance|available|availability|discuss|talk about|interested in working)\b/i;
    const isContactIntent = contactKeywords.test(message.toLowerCase());
    
    if (isContactIntent) {
      console.log('📧 Contact intent detected - will provide contact guidance');
    }

    // STEP 1: Get conversation history for context
    let conversationHistory: Array<{role: string, content: string}> = [];
    if (sessionId) {
      try {
        const client = getDbClient();
        await client.connect();
        
        const historyResult = await client.query(
          `SELECT message, role FROM chat_messages 
           WHERE session_id = $1 
           ORDER BY created_at ASC 
           LIMIT 10`,
          [sessionId]
        );
        
        conversationHistory = historyResult.rows.map(row => ({
          role: row.role,
          content: row.message,
        }));
        
        await client.end();
        console.log(`💭 Loaded ${conversationHistory.length} previous messages`);
      } catch (error) {
        console.error('Error loading conversation history:', error);
      }
    }

    // STEP 1: AI translates user inquiry into better vector search query
    console.log('🧠 Step 1: Translating user query for vector search...');
    const searchQueryCompletion = await groq.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: `You are a query optimizer for a professional portfolio vector database. Transform user questions into clear, specific search terms that will find relevant professional information.

Examples:
- "What do you know?" → "skills experience projects education background"
- "Tell me about your work" → "work experience professional jobs companies"
- "What projects?" → "projects applications software development"
- "Your skills?" → "programming skills technologies languages frameworks"
- "AI experience?" → "artificial intelligence machine learning AI projects"

Transform the user's question into 3-5 key search terms that will find the most relevant professional information. Return only the search terms.`
        },
        {
          role: 'user',
          content: message
        }
      ],
      model: 'llama-3.1-8b-instant', // Updated to available model
      temperature: 0.3,
      max_tokens: 50,
      stream: false,
    });

    const optimizedQuery = searchQueryCompletion.choices[0]?.message?.content || message;
    console.log('🎯 Optimized search query:', optimizedQuery);

    // STEP 2: Get professional profile (always include for contact info)
    console.log('📊 Step 2: Fetching professional profile...');
    let profileContext = '';
    try {
      const dbClient = getDbClient();
      await dbClient.connect();
      const profileResult = await dbClient.query('SELECT * FROM professionals LIMIT 1');
      await dbClient.end();
      
      if (profileResult.rows.length > 0) {
        const profile = profileResult.rows[0];
        profileContext = `PROFESSIONAL PROFILE:
Name: ${profile.name}
Title: ${profile.title}
Location: ${profile.location}
Email: ${profile.email}
LinkedIn: ${profile.linkedin_url || 'Not provided'}
GitHub: ${profile.github_url || 'Not provided'}
Website: ${profile.website_url || 'Not provided'}
Summary: ${profile.summary}

`;
        console.log('✅ Profile loaded');
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    }

    // STEP 3: Search vector database with optimized query
    console.log('� Step 3: Searching vector database...');
    const searchResults = await index.query({
      data: optimizedQuery,
      topK: 5,
      includeMetadata: true,
      includeData: true,
    });

    console.log(`📋 Found ${searchResults.length} relevant matches`);

    // STEP 4: Extract relevant context from search results
    const vectorContext = searchResults
      .filter(result => result.score > 0.6)
      .map(result => {
        // Always prefer the data field which contains the actual content
        if (result.data && typeof result.data === 'string') {
          return result.data;
        }
        
        // Only fall back to metadata if data is missing
        const metadata = result.metadata || {};
        switch (metadata.type) {
          case 'skill':
            return `${metadata.name} (${metadata.category})`;
          case 'experience':
            return `${metadata.position} at ${metadata.company}`;
          case 'project':
            return `Project: ${metadata.name} (${metadata.status})`;
          case 'education':
            return `${metadata.degree} in ${metadata.field_of_study} from ${metadata.institution}`;
          case 'content':
            return metadata.title || 'Content chunk';
          default:
            return null;
        }
      })
      .filter(Boolean)
      .join('\n\n');

    // Combine profile context with vector search results
    const context = profileContext + (vectorContext ? `\nADDITIONAL INFORMATION:\n${vectorContext}` : '');

    console.log('📝 Step 4: Context prepared for AI');

    // STEP 5: AI interprets data and responds in human talk
    console.log('🤖 Step 5: AI generating conversational response...');
    
    // Build conversation messages with history
    const conversationMessages = [
        {
          role: 'system' as const,
          content: `You are an AI assistant representing Louis Adriano, a full-stack developer. You should respond professionally about his work and technical background.

CRITICAL GUIDELINES:
- ALWAYS provide contact information when asked (email, LinkedIn, GitHub, etc.) - this information is in the context below
- ONLY discuss information provided in the context below
- If asked about personal details NOT in the context (relationships, sexuality, personal life, family, etc.), respond: "I can only share professional information about Louis's work and technical background."
- Stay focused on professional topics: work experience, projects, skills, education, contact information
- Be helpful and conversational, but stick to the facts provided
- Don't make up or assume any personal information
- If you don't know something, say "I don't have that information"
- Consider previous conversation when responding

CONTACT INQUIRY HANDLING (IMPORTANT - FULLY AUTONOMOUS MODE):
When someone expresses interest in working with Louis, hiring him, collaborating, or discussing opportunities:

**BE FULLY AUTONOMOUS - Collect info and send email automatically, NO forms or buttons!**

STEP 1 - Acknowledge & Start Collecting:
- Warmly acknowledge their interest
- Conversationally gather: name, email, project/need description
- Be natural: "I'd love to connect you with Louis! What's your name and email? And tell me about your project."

STEP 2 - Track What You Have:
Monitor the conversation for:
- ✅ Email address (required)
- ✅ Name (nice to have, can use "Anonymous" if missing)
- ✅ Project/need description (what they want)

STEP 3 - When You Have Email + Description:
Once you have their EMAIL and what they NEED:
1. Confirm: "Got it! I'm sending this to Louis right now..."
2. Add this EXACT marker at the end: [AUTO_SEND_INQUIRY]
3. The system will automatically send the email in the background (user won't see any forms!)
4. After marker, the system will add a success message to chat

STEP 4 - If Missing Critical Info:
If you DON'T have email or project description, keep asking naturally:
- "What's your email so Louis can reach you?"
- "Tell me more about what you're looking to build/do?"

**IMPORTANT**: You need AT MINIMUM the user's EMAIL and a description of what they need. Name is optional.

Examples:

User: "I want to work with you"
AI: "That's exciting! I can connect you with Louis right away. What's your email address? And what kind of project or opportunity are you interested in?"

User: "sarah@company.com, need an AI chatbot for customer support"
AI: "Perfect! I'm sending your inquiry to Louis now - he'll reach out to you at sarah@company.com about your AI chatbot project. [AUTO_SEND_INQUIRY]"

User: "I'm John from TechCorp, john@techcorp.com, looking to hire for a React developer position"
AI: "Excellent! I've got your details, John. I'm forwarding this job opportunity to Louis right now - he'll respond to john@techcorp.com soon! [AUTO_SEND_INQUIRY]"

Remember: 
- [AUTO_SEND_INQUIRY] marker = email gets sent automatically in background
- Only add marker when you have EMAIL + project description
- User never sees a form, everything happens through conversation
- After you add the marker, the system will automatically follow up with a success message

Professional context about Louis Adriano:
${context}`
        },
      // Include conversation history
      ...conversationHistory.map(msg => ({
        role: msg.role as 'user' | 'assistant',
        content: msg.content
      })),
      // Add current user message
      {
        role: 'user' as const,
        content: message
      }
    ];
    
    const stream = await groq.chat.completions.create({
      messages: conversationMessages,
      model: 'llama-3.1-8b-instant',
      temperature: 0.7,
      max_tokens: 400,
      stream: true, // Enable streaming for real-time response
    });

    // Create streaming response
    const encoder = new TextEncoder();
    let fullResponse = '';
    
    const readable = new ReadableStream({
      async start(controller) {
        try {
          // Save user message first
          if (sessionId) {
            try {
              const client = getDbClient();
              await client.connect();
              await client.query(
                'INSERT INTO chat_messages (session_id, message, role, created_at) VALUES ($1, $2, $3, CURRENT_TIMESTAMP)',
                [sessionId, message, 'user']
              );
              await client.end();
            } catch (error) {
              console.error('Error saving user message:', error);
            }
          }

          for await (const chunk of stream) {
            const content = chunk.choices[0]?.delta?.content || '';
            if (content) {
              fullResponse += content;
              const data = `data: ${JSON.stringify({ content })}\n\n`;
              controller.enqueue(encoder.encode(data));
            }
          }
          
          // Save assistant response
          if (sessionId && fullResponse) {
            try {
              const client = getDbClient();
              await client.connect();
              await client.query(
                'INSERT INTO chat_messages (session_id, message, role, created_at) VALUES ($1, $2, $3, CURRENT_TIMESTAMP)',
                [sessionId, fullResponse, 'assistant']
              );
              await client.end();
            } catch (error) {
              console.error('Error saving assistant message:', error);
            }
          }
          
          controller.enqueue(encoder.encode('data: [DONE]\n\n'));
          controller.close();
        } catch (error) {
          console.error('Streaming error:', error);
          controller.error(error);
        }
      },
    });

    return new Response(readable, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });

  } catch (error) {
    console.error('❌ Chat error:', error);
    if (error instanceof SyntaxError) {
      return NextResponse.json(
        { error: 'Invalid JSON in request body' },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to process chat message' },
      { status: 500 }
    );
  }
}