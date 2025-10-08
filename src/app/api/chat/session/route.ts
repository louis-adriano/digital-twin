import { NextRequest, NextResponse } from 'next/server';
import { Client } from 'pg';
import { v4 as uuidv4 } from 'uuid';

const getDbClient = () => new Client({
  connectionString: process.env.DATABASE_URL,
});

// Get or create chat session
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { sessionId } = body;

    const client = getDbClient();
    await client.connect();

    let session;

    if (sessionId) {
      // Try to find existing session
      const existingSession = await client.query(
        'SELECT * FROM chat_sessions WHERE session_id = $1',
        [sessionId]
      );

      if (existingSession.rows.length > 0) {
        // Update last activity
        await client.query(
          'UPDATE chat_sessions SET last_activity = CURRENT_TIMESTAMP WHERE session_id = $1',
          [sessionId]
        );
        session = existingSession.rows[0];
      }
    }

    if (!session) {
      // Create new session
      const newSessionId = uuidv4();
      const result = await client.query(
        `INSERT INTO chat_sessions (session_id, created_at, last_activity) 
         VALUES ($1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP) 
         RETURNING *`,
        [newSessionId]
      );
      session = result.rows[0];
    }

    await client.end();

    return NextResponse.json({
      sessionId: session.session_id,
      createdAt: session.created_at,
    });

  } catch (error) {
    console.error('Session error:', error);
    return NextResponse.json(
      { error: 'Failed to manage session' },
      { status: 500 }
    );
  }
}

// Get chat history for session
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Session ID required' },
        { status: 400 }
      );
    }

    const client = getDbClient();
    await client.connect();

    // Get chat history
    const messages = await client.query(
      `SELECT id, message, role, metadata, created_at 
       FROM chat_messages 
       WHERE session_id = $1 
       ORDER BY created_at ASC`,
      [sessionId]
    );

    await client.end();

    return NextResponse.json({
      messages: messages.rows.map(row => ({
        id: row.id,
        content: row.message,
        role: row.role,
        timestamp: row.created_at,
        metadata: row.metadata,
      })),
    });

  } catch (error) {
    console.error('Get history error:', error);
    return NextResponse.json(
      { error: 'Failed to get chat history' },
      { status: 500 }
    );
  }
}