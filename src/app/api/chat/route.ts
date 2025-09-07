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
    });

    console.log('Search results:', searchResults.length, 'found');
    searchResults.forEach((result, i) => {
      console.log(`Result ${i + 1}: score=${result.score}`);
      console.log(`Metadata keys:`, Object.keys(result.metadata || {}));
      console.log(`Full metadata:`, result.metadata);
    });

    // Extract relevant context from search results - let's check all metadata fields
    const context = searchResults
      .filter(result => result.score > 0.6)
      .map(result => {
        const metadata = result.metadata || {};
        // Try different possible field names for the text content
        const text = metadata.text || metadata.content || metadata.description || metadata.name || 'No content found';
        return text as string;
      })
      .filter(text => text && text !== 'No content found')
      .join('\n\n');

    let response = '';
    
    if (context.trim()) {
      response = `Based on my professional background:\n\n${context}`;
    } else {
      // If no matches above 0.6, show the best results with all available metadata
      const bestResults = searchResults
        .slice(0, 2)
        .map(result => {
          const metadata = result.metadata || {};
          console.log('Fallback metadata check:', metadata);
          return JSON.stringify(metadata, null, 2);
        })
        .filter(text => text.trim())
        .join('\n\n');
      
      if (bestResults) {
        response = `Here's what I found:\n\n${bestResults}`;
      } else {
        response = "I don't have specific information about that topic. Try asking about my programming skills, work experience, or projects!";
      }
    }

    console.log('Sending response:', response.substring(0, 100) + '...');

    return NextResponse.json({
      response,
      searchResults: searchResults.map(r => ({
        score: r.score,
        preview: (r.metadata?.text as string)?.substring(0, 100) + '...' || 'No preview available'
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