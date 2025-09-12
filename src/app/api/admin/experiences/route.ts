import { config } from 'dotenv';
config({ path: '.env.local' });

import { NextRequest, NextResponse } from 'next/server';
import { Client } from 'pg';
import { z } from 'zod';

const experienceSchema = z.object({
  company: z.string().min(1, 'Company is required'),
  position: z.string().min(1, 'Position is required'),
  start_date: z.string(),
  end_date: z.string().nullable(),
  description: z.string().optional(),
  location: z.string().optional(),
  achievements: z.array(z.string()).optional(),
  technologies: z.array(z.string()).optional(),
});

export async function GET() {
  try {
    const client = new Client({
      connectionString: process.env.DATABASE_URL,
    });

    await client.connect();
    
    const result = await client.query(`
      SELECT e.*, p.id as professional_id 
      FROM experiences e 
      JOIN professionals p ON e.professional_id = p.id 
      ORDER BY e.start_date DESC
    `);
    
    await client.end();

    return NextResponse.json(result.rows);

  } catch (error) {
    console.error('Experiences fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch experiences' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = experienceSchema.parse(body);

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
      `INSERT INTO experiences (
        professional_id, company, position, start_date, end_date,
        description, location, achievements, technologies
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
      [
        professionalId,
        validatedData.company,
        validatedData.position,
        validatedData.start_date,
        validatedData.end_date,
        validatedData.description || null,
        validatedData.location || null,
        validatedData.achievements || [],
        validatedData.technologies || [],
      ]
    );

    await client.end();

    return NextResponse.json({
      success: true,
      experience: result.rows[0],
    });

  } catch (error) {
    console.error('Experience create error:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to create experience' },
      { status: 500 }
    );
  }
}