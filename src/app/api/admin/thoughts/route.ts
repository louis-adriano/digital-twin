import { config } from 'dotenv';
config({ path: '.env.local' });

import { NextRequest, NextResponse } from 'next/server';
import { Client } from 'pg';
import { z } from 'zod';
import { revalidatePath } from 'next/cache';

const thoughtSchema = z.object({
  title: z.string().min(1, 'Title is required').max(500),
  excerpt: z.string().min(1, 'Excerpt is required'),
  linkedin_url: z.string().url().optional().or(z.literal('')),
  published_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
  is_featured: z.boolean().optional(),
});

export async function GET() {
  try {
    const client = new Client({
      connectionString: process.env.DATABASE_URL,
    });

    await client.connect();
    
    const result = await client.query(`
      SELECT * FROM thoughts 
      WHERE professional_id = (SELECT id FROM professionals LIMIT 1)
      ORDER BY published_date DESC
    `);
    
    await client.end();

    return NextResponse.json(result.rows);

  } catch (error) {
    console.error('Thoughts fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch thoughts' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = thoughtSchema.parse(body);

    const client = new Client({
      connectionString: process.env.DATABASE_URL,
    });

    await client.connect();

    const result = await client.query(
      `INSERT INTO thoughts (professional_id, title, excerpt, linkedin_url, published_date, is_featured)
       VALUES ((SELECT id FROM professionals LIMIT 1), $1, $2, $3, $4, $5)
       RETURNING *`,
      [
        validatedData.title,
        validatedData.excerpt,
        validatedData.linkedin_url || null,
        validatedData.published_date,
        validatedData.is_featured || false,
      ]
    );

    await client.end();

    // Revalidate homepage to show new thought
    revalidatePath('/');

    return NextResponse.json({
      success: true,
      thought: result.rows[0],
    });

  } catch (error) {
    console.error('Thought creation error:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to create thought' },
      { status: 500 }
    );
  }
}
