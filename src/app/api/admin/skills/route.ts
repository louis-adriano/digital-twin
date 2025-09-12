import { config } from 'dotenv';
config({ path: '.env.local' });

import { NextRequest, NextResponse } from 'next/server';
import { Client } from 'pg';
import { z } from 'zod';

const skillSchema = z.object({
  name: z.string().min(1, 'Skill name is required'),
  category: z.string().min(1, 'Category is required'),
  proficiency_level: z.number().min(1).max(5, 'Proficiency must be between 1-5'),
  years_experience: z.number().min(0).optional(),
  description: z.string().optional(),
});

export async function GET() {
  try {
    const client = new Client({
      connectionString: process.env.DATABASE_URL,
    });

    await client.connect();
    
    const result = await client.query(`
      SELECT s.*, p.id as professional_id 
      FROM skills s 
      JOIN professionals p ON s.professional_id = p.id 
      ORDER BY s.category, s.name
    `);
    
    await client.end();

    return NextResponse.json(result.rows);

  } catch (error) {
    console.error('Skills fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch skills' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = skillSchema.parse(body);

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
      `INSERT INTO skills (
        professional_id, name, category, proficiency_level, years_experience, description
      ) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [
        professionalId,
        validatedData.name,
        validatedData.category,
        validatedData.proficiency_level,
        validatedData.years_experience || null,
        validatedData.description || null,
      ]
    );

    await client.end();

    return NextResponse.json({
      success: true,
      skill: result.rows[0],
    });

  } catch (error) {
    console.error('Skill create error:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to create skill' },
      { status: 500 }
    );
  }
}