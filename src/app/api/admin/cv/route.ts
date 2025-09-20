import { config } from 'dotenv';
config({ path: '.env.local' });

import { NextRequest, NextResponse } from 'next/server';
import { Client } from 'pg';
import { writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';

const CV_UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads', 'cv');

// Ensure upload directory exists
async function ensureUploadDir() {
  if (!existsSync(CV_UPLOAD_DIR)) {
    await mkdir(CV_UPLOAD_DIR, { recursive: true });
  }
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('cv') as File;

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // Validate file type
    const allowedTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Only PDF and DOCX files are allowed' },
        { status: 400 }
      );
    }

    // Validate file size (5MB max)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'File size must be less than 5MB' },
        { status: 400 }
      );
    }

    await ensureUploadDir();

    // Generate filename with timestamp and proper extension
    const timestamp = Date.now();
    const extension = file.type === 'application/pdf' ? 'pdf' : 'docx';
    const filename = `cv_${timestamp}.${extension}`;
    const filepath = path.join(CV_UPLOAD_DIR, filename);

    // Save file
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filepath, buffer);

    // Update database
    const client = new Client({
      connectionString: process.env.DATABASE_URL,
    });

    await client.connect();

    const result = await client.query(
      `UPDATE professionals SET
        cv_filename = $1,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = (SELECT id FROM professionals LIMIT 1)
      RETURNING *`,
      [filename]
    );

    await client.end();

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Profile not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      filename,
      message: 'CV uploaded successfully'
    });

  } catch (error) {
    console.error('CV upload error:', error);
    return NextResponse.json(
      { error: 'Failed to upload CV' },
      { status: 500 }
    );
  }
}

export async function DELETE() {
  try {
    const client = new Client({
      connectionString: process.env.DATABASE_URL,
    });

    await client.connect();

    const result = await client.query(
      `UPDATE professionals SET
        cv_filename = NULL,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = (SELECT id FROM professionals LIMIT 1)
      RETURNING *`,
    );

    await client.end();

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Profile not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'CV removed successfully'
    });

  } catch (error) {
    console.error('CV removal error:', error);
    return NextResponse.json(
      { error: 'Failed to remove CV' },
      { status: 500 }
    );
  }
}