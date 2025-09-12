import { config } from 'dotenv';
config({ path: '.env.local' });

import { NextRequest, NextResponse } from 'next/server';
import { Client } from 'pg';
import { z } from 'zod';

const experienceUpdateSchema = z.object({
  company: z.string().min(1, 'Company is required'),
  position: z.string().min(1, 'Position is required'),
  start_date: z.string(),
  end_date: z.string().nullable(),
  description: z.string().optional(),
  location: z.string().optional(),
  achievements: z.array(z.string()).optional(),
  technologies: z.array(z.string()).optional(),
});

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const validatedData = experienceUpdateSchema.parse(body);
    const { id } = await params;

    const client = new Client({
      connectionString: process.env.DATABASE_URL,
    });

    await client.connect();

    const result = await client.query(
      `UPDATE experiences SET 
        company = $1, position = $2, start_date = $3, end_date = $4,
        description = $5, location = $6, achievements = $7, technologies = $8
      WHERE id = $9 RETURNING *`,
      [
        validatedData.company,
        validatedData.position,
        validatedData.start_date,
        validatedData.end_date,
        validatedData.description || null,
        validatedData.location || null,
        validatedData.achievements || [],
        validatedData.technologies || [],
        id,
      ]
    );

    await client.end();

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Experience not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      experience: result.rows[0],
    });

  } catch (error) {
    console.error('Experience update error:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to update experience' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = await params;

    const client = new Client({
      connectionString: process.env.DATABASE_URL,
    });

    await client.connect();

    const result = await client.query('DELETE FROM experiences WHERE id = $1 RETURNING id', [id]);

    await client.end();

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Experience not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Experience delete error:', error);
    return NextResponse.json(
      { error: 'Failed to delete experience' },
      { status: 500 }
    );
  }
}