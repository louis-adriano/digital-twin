import { config } from 'dotenv';
config({ path: '.env.local' });

import { NextRequest, NextResponse } from 'next/server';
import { Client } from 'pg';
import { z } from 'zod';

const projectUpdateSchema = z.object({
  name: z.string().min(1, 'Project name is required'),
  description: z.string().optional(),
  start_date: z.string().optional(),
  end_date: z.string().nullable(),
  status: z.string().optional(),
  technologies: z.array(z.string()).optional(),
  github_url: z.string().url().optional().or(z.literal('')),
  live_url: z.string().url().optional().or(z.literal('')),
  image_url: z.string().url().optional().or(z.literal('')),
  highlights: z.array(z.string()).optional(),
});

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const body = await request.json();
    const validatedData = projectUpdateSchema.parse(body);
    const { id } = await params;

    const client = new Client({
      connectionString: process.env.DATABASE_URL,
    });

    await client.connect();

    const result = await client.query(
      `UPDATE projects SET 
        name = $1, description = $2, start_date = $3, end_date = $4, status = $5,
        technologies = $6, github_url = $7, live_url = $8, image_url = $9, highlights = $10
      WHERE id = $11 RETURNING *`,
      [
        validatedData.name,
        validatedData.description || null,
        validatedData.start_date || null,
        validatedData.end_date,
        validatedData.status || 'completed',
        validatedData.technologies || [],
        validatedData.github_url || null,
        validatedData.live_url || null,
        validatedData.image_url || null,
        validatedData.highlights || [],
        id,
      ]
    );

    await client.end();

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      project: result.rows[0],
    });

  } catch (error) {
    console.error('Project update error:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to update project' },
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

    const result = await client.query('DELETE FROM projects WHERE id = $1 RETURNING id', [id]);

    await client.end();

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Project delete error:', error);
    return NextResponse.json(
      { error: 'Failed to delete project' },
      { status: 500 }
    );
  }
}