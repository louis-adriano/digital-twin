import { config } from 'dotenv';
config({ path: '.env.local' });

import { NextRequest, NextResponse } from 'next/server';
import { Client } from 'pg';
import { z } from 'zod';
import { revalidatePath } from 'next/cache';

const thoughtUpdateSchema = z.object({
  title: z.string().min(1, 'Title is required').max(500),
  excerpt: z.string().min(1, 'Excerpt is required'),
  linkedin_url: z.string().url().optional().or(z.literal('')),
  published_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
  is_featured: z.boolean().optional(),
});

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const validatedData = thoughtUpdateSchema.parse(body);

    const client = new Client({
      connectionString: process.env.DATABASE_URL,
    });

    await client.connect();

    const result = await client.query(
      `UPDATE thoughts SET
        title = $1, excerpt = $2, linkedin_url = $3,
        published_date = $4, is_featured = $5, updated_at = CURRENT_TIMESTAMP
      WHERE id = $6
      RETURNING *`,
      [
        validatedData.title,
        validatedData.excerpt,
        validatedData.linkedin_url || null,
        validatedData.published_date,
        validatedData.is_featured || false,
        id,
      ]
    );

    await client.end();

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Thought not found' },
        { status: 404 }
      );
    }

    revalidatePath('/');

    return NextResponse.json({
      success: true,
      thought: result.rows[0],
    });

  } catch (error) {
    console.error('Thought update error:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to update thought' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const client = new Client({
      connectionString: process.env.DATABASE_URL,
    });

    await client.connect();

    const result = await client.query(
      'DELETE FROM thoughts WHERE id = $1 RETURNING *',
      [id]
    );

    await client.end();

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Thought not found' },
        { status: 404 }
      );
    }

    revalidatePath('/');

    return NextResponse.json({
      success: true,
      message: 'Thought deleted successfully',
    });

  } catch (error) {
    console.error('Thought deletion error:', error);
    return NextResponse.json(
      { error: 'Failed to delete thought' },
      { status: 500 }
    );
  }
}
