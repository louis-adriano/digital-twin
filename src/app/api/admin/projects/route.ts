import { config } from 'dotenv';
config({ path: '.env.local' });

import { NextRequest, NextResponse } from 'next/server';
import { Client } from 'pg';
import { z } from 'zod';

const projectSchema = z.object({
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

export async function GET() {
  try {
    const client = new Client({
      connectionString: process.env.DATABASE_URL,
    });

    await client.connect();
    
    const result = await client.query(`
      SELECT p.*, pr.id as professional_id 
      FROM projects p 
      JOIN professionals pr ON p.professional_id = pr.id 
      ORDER BY p.start_date DESC NULLS LAST
    `);
    
    await client.end();

    return NextResponse.json(result.rows);

  } catch (error) {
    console.error('Projects fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch projects' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = projectSchema.parse(body);

    const client = new Client({
      connectionString: process.env.DATABASE_URL,
    });

    await client.connect();

    // Get professional ID
    const professionalResult = await client.query('SELECT id FROM professionals LIMIT 1');
    if (professionalResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'No professional profile found' },
        { status: 404 }
      );
    }

    const professionalId = professionalResult.rows[0].id;

    const result = await client.query(
      `INSERT INTO projects (
        professional_id, name, description, start_date, end_date, status,
        technologies, github_url, live_url, image_url, highlights
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING *`,
      [
        professionalId,
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
      ]
    );

    await client.end();

    return NextResponse.json({
      success: true,
      project: result.rows[0],
    });

  } catch (error) {
    console.error('Project create error:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to create project' },
      { status: 500 }
    );
  }
}