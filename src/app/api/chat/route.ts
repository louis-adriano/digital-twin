import { NextRequest, NextResponse } from 'next/server';
import { Index } from '@upstash/vector';

const index = new Index({
  url: process.env.UPSTASH_VECTOR_REST_URL!,
  token: process.env.UPSTASH_VECTOR_REST_TOKEN!,
});

export async function POST(request: NextRequest) {
  try {
    const { message } = await request.json();

    console.log('Received message:', message);

    if (!message || typeof message !== 'string') {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }

    // Search vector database for relevant information
    console.log('Searching vector database...');
    const searchResults = await index.query({
      data: message,
      topK: 3,
      includeMetadata: true,
      includeData: true,  // Explicitly request the data field
    });

    console.log('Search results:', searchResults.length, 'found');
    searchResults.forEach((result, i) => {
      console.log(`Result ${i + 1}: score=${result.score}`);
      console.log(`Metadata:`, result.metadata);
      console.log(`Data:`, result.data);
    });

    // Extract relevant context from search results - use the data field which contains the actual text
    const context = searchResults
      .filter(result => result.score > 0.6)
      .map(result => {
        // Try to get the actual content from data field first
        let content = result.data as string;
        
        // If data field is undefined, construct content from metadata
        if (!content) {
          const metadata = result.metadata || {};
          if (metadata.type === 'skill') {
            const skillName = metadata.name || metadata.skill_name;
            const proficiency = metadata.proficiency_level;
            const experience = metadata.years_experience;
            const category = metadata.category;
            
            content = `**${skillName}** (${category}) - ${proficiency} level`;
            if (experience) {
              content += ` with ${experience} year${experience !== 1 ? 's' : ''} of experience`;
            }
          } else if (metadata.type === 'experience') {
            content = `**${metadata.position}** at **${metadata.company}**`;
          } else if (metadata.type === 'project') {
            content = `**Project: ${metadata.name}** - Status: ${metadata.status}`;
          } else if (metadata.type === 'education') {
            content = `**${metadata.degree}** in ${metadata.field_of_study} from **${metadata.institution}**`;
          } else if (metadata.type === 'content') {
            content = `**${metadata.title}**`;
          }
        }
        
        return content;
      })
      .filter(text => text && text.trim())
      .join('\n\n');

    let response = '';
    
    if (context.trim()) {
      response = `Based on my professional background:\n\n${context}`;
    } else {
      response = "I don't have specific information about that topic. Try asking about my programming skills, work experience, or projects!";
    }

    console.log('Sending response:', response.substring(0, 100) + '...');

    return NextResponse.json({
      response,
      searchResults: searchResults.map(r => ({
        score: r.score,
        preview: (r.data as string)?.substring(0, 100) + '...' || 'No preview available'
      }))
    });
  } catch (error) {
    console.error('Chat error:', error);
    return NextResponse.json(
      { error: 'Failed to process chat message' },
      { status: 500 }
    );
  }
}