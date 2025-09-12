import { config } from 'dotenv';
config({ path: '.env.local' });

import { NextRequest, NextResponse } from 'next/server';
import { Index } from '@upstash/vector';
import { Client } from 'pg';

const index = new Index({
  url: process.env.UPSTASH_VECTOR_REST_URL!,
  token: process.env.UPSTASH_VECTOR_REST_TOKEN!,
});

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action') || 'info';

    switch (action) {
      case 'info':
        // Get vector database info
        const info = await index.info();
        
        // Get content chunks count from PostgreSQL
        const client = new Client({
          connectionString: process.env.DATABASE_URL,
        });
        await client.connect();
        
        const chunksResult = await client.query('SELECT COUNT(*) as count FROM content_chunks');
        const chunksCount = parseInt(chunksResult.rows[0].count);
        
        await client.end();

        return NextResponse.json({
          vectorCount: info.vectorCount,
          dimension: info.dimension,
          contentChunks: chunksCount,
          lastUpdated: new Date().toISOString(),
        });

      case 'search':
        const query = searchParams.get('query');
        if (!query) {
          return NextResponse.json({ error: 'Query parameter required' }, { status: 400 });
        }

        const searchResults = await index.query({
          data: query,
          topK: 10,
          includeMetadata: true,
          includeData: true,
        });

        return NextResponse.json({
          results: searchResults.map(result => ({
            id: result.id,
            score: result.score,
            metadata: result.metadata,
            data: result.data,
          })),
        });

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

  } catch (error) {
    console.error('Embeddings API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch embeddings data' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { action, vectorId } = await request.json();

    switch (action) {
      case 'regenerate':
        // This would trigger regeneration of all embeddings
        // For now, return a placeholder response
        return NextResponse.json({
          success: true,
          message: 'Embedding regeneration started',
          jobId: `regen_${Date.now()}`,
        });

      case 'delete':
        if (!vectorId) {
          return NextResponse.json({ error: 'Vector ID required' }, { status: 400 });
        }

        await index.delete(vectorId);
        return NextResponse.json({ success: true });

      case 'clear':
        // Clear all vectors (use with caution)
        const info = await index.info();
        const vectorIds: string[] = [];
        
        // This is a simplified approach - in production, you'd want to batch this
        for (let i = 0; i < Math.min(info.vectorCount, 1000); i++) {
          vectorIds.push(`vec_${i}`);
        }
        
        if (vectorIds.length > 0) {
          await index.delete(vectorIds);
        }
        
        return NextResponse.json({ 
          success: true,
          deletedCount: vectorIds.length 
        });

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

  } catch (error) {
    console.error('Embeddings operation error:', error);
    return NextResponse.json(
      { error: 'Failed to perform embeddings operation' },
      { status: 500 }
    );
  }
}