import { config } from 'dotenv';
config({ path: '.env.local' });

import { NextResponse } from 'next/server';
import { Client } from 'pg';

export async function GET() {
  try {
    // If Google Drive URL is set in env, redirect to it
    if (process.env.GOOGLE_DRIVE_CV_URL) {
      return NextResponse.redirect(process.env.GOOGLE_DRIVE_CV_URL);
    }

    const client = new Client({
      connectionString: process.env.DATABASE_URL,
    });

    await client.connect();

    const result = await client.query('SELECT name FROM professionals LIMIT 1');
    await client.end();

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Profile not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { 
        error: 'CV not configured. Please set GOOGLE_DRIVE_CV_URL in your environment variables.',
        instructions: [
          '1. Upload your CV to Google Drive',
          '2. Right-click the file and select "Share"',
          '3. Change to "Anyone with the link" can view',
          '4. Copy the sharing link',
          '5. Convert it from: https://drive.google.com/file/d/FILE_ID/view?usp=sharing',
          '6. To: https://drive.google.com/uc?export=download&id=FILE_ID',
          '7. Add GOOGLE_DRIVE_CV_URL to your .env.local and Vercel environment variables'
        ]
      },
      { status: 404 }
    );

  } catch (error) {
    console.error('CV download error:', error);
    return NextResponse.json(
      { error: 'Failed to download CV' },
      { status: 500 }
    );
  }
}