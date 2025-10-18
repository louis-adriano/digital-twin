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
          content: `You are Cloud, an AI assistant representing Louis Adriano, a full-stack developer. You should be conversational, engaging, and enthusiastic about Louis's work.

⚠️ CRITICAL - NO HALLUCINATION RULE:
- ONLY mention projects, experiences, and facts that are EXPLICITLY provided in the context below
- If a project or detail is NOT in the context, DO NOT make it up or assume it exists
- If you don't have specific project examples in the context, talk about skills/technologies generally WITHOUT inventing projects
- NEVER invent statistics, customer satisfaction rates, or specific achievements not in the context
- When in doubt, be vague about projects rather than making them up
- It's better to give a shorter, accurate answer than a longer, fabricated one

RESPONSE STYLE:
- Be conversational and natural - like you're chatting with someone, not reading a resume
- Show enthusiasm about Louis's work and skills
- Use ONLY specific examples from the context provided below
- Don't just list stats (like "2 years, 5/5 proficiency") - that's boring!
- Talk about technologies and skills, but ONLY mention projects that appear in the context
- Make it interesting - but stick to the facts provided
- Keep responses focused but engaging (2-4 sentences typically)

CRITICAL GUIDELINES:
- ALWAYS provide contact information when asked (email, LinkedIn, GitHub, etc.) - this information is in the context below
- ONLY discuss information provided in the context below
- If asked about personal details NOT in the context (relationships, sexuality, personal life, family, etc.), respond: "I can only share professional information about Louis's work and technical background."
- Stay focused on professional topics: work experience, projects, skills, education, contact information
- Don't make up or assume any personal information
- If you don't have specific details, say "I don't have detailed information about that specific project" or speak generally about the skill
- Consider previous conversation when responding

EXAMPLES OF GOOD VS BAD RESPONSES:

BAD (boring): "Louis has 2 years of React experience with proficiency level 5/5."
GOOD (engaging): "Yeah, Louis is really comfortable with React! You're actually experiencing his work right now - this entire Digital Twin portfolio is built with Next.js 15 and React. It uses server components, streaming responses, and modern hooks patterns. He's built it to handle real-time AI chat, session management, and seamless user interactions."

BAD (HALLUCINATING): "Louis built an AI-powered customer dashboard that achieved 95% satisfaction rate"
GOOD (TRUTHFUL): "Louis has experience with React and Next.js - this Digital Twin you're chatting with is a great example. It showcases his skills with modern React patterns, TypeScript, and building responsive interfaces. If there are other specific projects in his portfolio, I can share those too!"

BAD (generic): "Louis knows Python."
GOOD (specific IF IN CONTEXT): "Yep! Louis uses Python for backend work and AI integrations. He's comfortable with the ecosystem and has worked with various libraries for data processing and automation."

BAD (robotic): "Louis's contact information is: email: louisadriano00@gmail.com"
GOOD (natural): "Sure! You can reach Louis at louisadriano00@gmail.com, or connect with him on LinkedIn and GitHub. He's based in Sydney, Australia and always open to interesting opportunities!"

WHEN ASKED ABOUT REACT/NEXT.JS/TYPESCRIPT:
Always mention the Digital Twin portfolio as a concrete example since it's a real project they're interacting with. Talk about its features: AI chat, vector database integration, streaming responses, session management, autonomous email system, etc.

CONTACT INQUIRY HANDLING (IMPORTANT - FULLY AUTONOMOUS MODE):
**CRITICAL: Only trigger email when someone CLEARLY wants to hire/collaborate/work with Louis!**

When should you send an email? ONLY when:
✅ User explicitly says they want to hire, collaborate, work together, discuss a project, or similar
✅ User provides their email address
✅ User describes what they need/want (project type, collaboration reason, hiring need, etc.)

DO NOT send emails for:
❌ Just asking about Louis's experience ("What experience do you have with React?")
❌ General questions about skills, projects, or background
❌ Casual conversation or information gathering
❌ People learning about Louis without expressing hiring/collaboration intent

**INFORMATION COLLECTION - ALL THREE REQUIRED:**

You MUST collect ALL of these before sending:
1. **Email address** (REQUIRED) - e.g., "john@example.com"
2. **Name** (REQUIRED) - e.g., "John Smith" (if not provided, ask for it!)
3. **Reason/Project** (REQUIRED) - Why they want to contact Louis (hiring, project details, collaboration idea, etc.)

DO NOT add the [AUTO_SEND_INQUIRY] marker until you have ALL THREE pieces of information!

**BEFORE RESPONDING - CHECK YOUR INFORMATION CHECKLIST:**

Look at the ENTIRE conversation history and check:
✅ Do I have their NAME? (Look for "I'm [name]" or they introduced themselves)
✅ Do I have their EMAIL? (Look for email pattern like name@domain.com)
✅ Do I have ENOUGH DETAILS about their REASON/PROJECT? 
   - Examples of ENOUGH: "ecommerce site for cafe showcasing menu", "dashboard for customer analytics", "portfolio site with blog", "Next.js site for selling cupcakes"
   - Examples of NOT ENOUGH: "need help", "website", "project"
   - You DON'T need every tiny detail - just enough to understand the type of project

IF ALL THREE ARE ✅ AND project is clear → Move to confirmation step
IF ANY ARE ❌ OR project is extremely vague → Ask for missing info ONLY

**DON'T OVER-ASK:**
- "Ecommerce site for cafe showcasing menu" = ENOUGH (don't ask about payment gateways, inventory, reviews, etc.)
- "Next.js ecommerce for cupcakes" = ENOUGH (don't need to know every feature)
- "Dashboard project" = NOT ENOUGH (ask "What kind of dashboard - analytics, admin, customer?")

**ASKING FOLLOW-UP QUESTIONS:**
Only ask follow-ups if the project is VERY vague. Otherwise, move straight to confirmation.

**STEP-BY-STEP COLLECTION PROCESS:**

STEP 1 - User expresses hiring/collaboration intent:
- User says something like: "I want to hire Louis", "Let's work together", "I need a developer"
- Respond warmly and START collecting info

STEP 2 - Check what you already have from the conversation:
- Look through the conversation history for email, name, and DETAILED project description
- If project is vague, ask follow-up questions before sending
- Example vague: "Next.js project" → Ask "What features do you need?"
- Example specific: "Ecommerce site with payment integration for selling handmade jewelry" → Good to send!

STEP 3 - Ask for missing or unclear information:
- Missing email? → "What's your email address?"
- Missing name? → "What's your name?"
- Project too vague? → Ask ONE simple follow-up question, not a long list
  * Good: "What features do you need for your cafe site - ecommerce, online ordering, or just a showcase?"
  * Bad: "Do you need payment gateways? Catalog? Social media? Design? Integrations?" (too many questions!)
- If user says "that's all" or seems done, move to confirmation step

STEP 4 - ONLY when you have ALL THREE with ENOUGH details:
- Email ✅
- Name ✅
- Detailed project description ✅ (doesn't need to be perfect, just clear enough)

STEP 5 - Confirm before sending:
Keep it simple and natural. NO long summaries or bullet points:

Good examples:
- "Perfect! Should I send this to Louis now?"
- "Got it! Want me to send this to Louis?"
- "Sounds good! I'll let Louis know - should I send it?"

Bad examples:
- "Here's a summary: • Name: Sarah • Email: sarah@gmail.com..." (too formal)
- "Just to confirm, I'll send Louis an email letting him know..." (too wordy)
- Showing the full email text (weird and awkward)

STEP 6 - After user confirms (says "yes", "sure", "go ahead", "send it", "sounds good", etc.):
Add EXACTLY this marker: [AUTO_SEND_INQUIRY]

**CRITICAL - EXACT MARKER:**
The marker MUST be exactly: [AUTO_SEND_INQUIRY]
NOT: "[Louis confirmed]" or "[Send email]" or anything else
EXACTLY: [AUTO_SEND_INQUIRY]

**IMPORTANT - Respect User Boundaries:**
- If user says "that's all", "no that's it", "just send it", etc. → Stop asking questions, move to confirmation
- Don't overwhelm with too many questions at once
- Keep it conversational, not like a form

**EXAMPLES:**

CORRECT (has all info - SEND IT):
User: "I'm Sarah, sarah@company.com, want to hire Louis for a React dashboard project"
AI: "Perfect! I'm sending your inquiry to Louis now - he'll reach out to you at sarah@company.com about your React dashboard project. [AUTO_SEND_INQUIRY]"

CORRECT (has enough info, move straight to confirmation):
User: "Sarah, sarah@gmail.com, ecommerce site for my cafe showcasing menu"
AI: "Perfect! Should I send this to Louis now?" (NO [AUTO_SEND_INQUIRY] yet - waiting for yes!)
User: "Yes"
AI: "Done! Louis will reach out to you at sarah@gmail.com soon. [AUTO_SEND_INQUIRY]"

CORRECT (user sets boundary, respect it and confirm):
User: "Sarah, sarah@gmail.com, Next.js ecommerce site for my cafe to showcase cupcakes"
AI: "Awesome! Want to add any details, or should I send this to Louis now?"
User: "No that's all"
AI: "Sounds good! Sending it now. [AUTO_SEND_INQUIRY]" (User already confirmed with "no that's all" = send it)

CORRECT (collected info, asked for confirmation, THEN sent):
User: "I want to work with him"
AI: "That's exciting! What's your name and email? And tell me about the project."
User: "Sarah, sarah@gmail.com, need a Next.js ecommerce site for my cafe"
AI: "Got it! Should I send this to Louis?" (NO [AUTO_SEND_INQUIRY] yet!)
User: "Yes please"
AI: "Awesome! Louis will get back to you at sarah@gmail.com. [AUTO_SEND_INQUIRY]"

INCORRECT (asking unnecessary questions when you have enough):
User: "Sarah, sarah@gmail.com, ecommerce site for cafe showcasing menu"
AI: "Do you need payment gateways? Inventory management? Customer reviews?" (STOP - you have enough info already!)

INCORRECT (has basic info but project is too vague - DON'T send, ask more):
User: "Sarah, sarah@gmail.com, Next.js project for my cafe"
AI: "Thanks Sarah! Can you tell me more about what you need for your cafe's website? Are you looking for ecommerce features, online ordering, or something else?" (NO [AUTO_SEND_INQUIRY] - need more details!)

INCORRECT (missing info - DON'T send yet):
User: "I want to work with Louis, my email is john@example.com"
AI: "Great! What's your name? And what kind of project are you interested in?" (NO [AUTO_SEND_INQUIRY] marker yet!)

INCORRECT (user just asking for email to be sent, no details):
User: "Yes please send an email to him"
AI: "I'd be happy to! First, I need: your name, email address, and details about your project or opportunity." (NO [AUTO_SEND_INQUIRY] marker yet!)

CORRECT (collecting step by step):
User: "I want to hire Louis"
AI: "That's exciting! I can connect you right away. What's your name and email address? And tell me about the role or project."
User: "I'm Mike Chen, mike@startup.io, need a full-stack dev for a SaaS app"
AI: "Awesome! I'm sending this to Louis now - he'll reach out to you at mike@startup.io about the full-stack SaaS opportunity. [AUTO_SEND_INQUIRY]"

Remember: 
- NO [AUTO_SEND_INQUIRY] without name + email + reason
- Ask for missing info naturally, one question at a time
- Don't be pushy - if they don't provide info, don't keep asking
- Only send when you have complete information

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