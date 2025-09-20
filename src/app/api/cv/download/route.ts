import { config } from 'dotenv';
config({ path: '.env.local' });

import { NextResponse } from 'next/server';
import { Client } from 'pg';
import { readFile } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';

const CV_UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads', 'cv');

export async function GET() {
  try {
    const client = new Client({
      connectionString: process.env.DATABASE_URL,
    });

    await client.connect();

    const result = await client.query('SELECT cv_filename, name FROM professionals LIMIT 1');
    await client.end();

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Profile not found' },
        { status: 404 }
      );
    }

    const { cv_filename, name } = result.rows[0];

    if (!cv_filename) {
      return NextResponse.json(
        { error: 'No CV file uploaded' },
        { status: 404 }
      );
    }

    const filepath = path.join(CV_UPLOAD_DIR, cv_filename);

    if (!existsSync(filepath)) {
      return NextResponse.json(
        { error: 'CV file not found on disk' },
        { status: 404 }
      );
    }

    // Read the file
    const fileBuffer = await readFile(filepath);

    // Determine file extension and MIME type
    const fileExtension = cv_filename.split('.').pop()?.toLowerCase();
    const isDocx = fileExtension === 'docx';
    const mimeType = isDocx
      ? 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      : 'application/pdf';

    // Create a clean filename for download
    const downloadFilename = `${name.replace(/\s+/g, '_')}_CV.${fileExtension}`;

    // Return the file with appropriate headers
    return new NextResponse(fileBuffer as unknown as ReadableStream, {
      status: 200,
      headers: {
        'Content-Type': mimeType,
        'Content-Disposition': `attachment; filename="${downloadFilename}"`,
        'Content-Length': fileBuffer.length.toString(),
      },
    });

  } catch (error) {
    console.error('CV download error:', error);
    return NextResponse.json(
      { error: 'Failed to download CV' },
      { status: 500 }
    );
  }
}