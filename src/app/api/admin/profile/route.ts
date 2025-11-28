import { config } from 'dotenv';
config({ path: '.env.local' });

import { NextRequest, NextResponse } from 'next/server';
import { Client } from 'pg';
import { z } from 'zod';
import { revalidatePath } from 'next/cache';

const profileUpdateSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Valid email is required'),
  phone: z.string().optional(),
  title: z.string().optional(),
  bio: z.string().optional(),
  summary: z.string().optional(),
  portfolio_summary: z.string().optional(),
  hero_subtitle: z.string().optional(),
  about_greeting: z.string().optional(),
  location: z.string().optional(),
  linkedin_url: z.string().url().optional().or(z.literal('')),
  github_url: z.string().url().optional().or(z.literal('')),
  website_url: z.string().url().optional().or(z.literal('')),
});

export async function GET() {
  try {
    const client = new Client({
      connectionString: process.env.DATABASE_URL,
    });

    await client.connect();
    
    const result = await client.query('SELECT * FROM professionals LIMIT 1');
    await client.end();
    
    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'No profile found' },
        { status: 404 }
      );
    }

    return NextResponse.json(result.rows[0]);

  } catch (error) {
    console.error('Profile fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch profile' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = profileUpdateSchema.parse(body);

    const client = new Client({
      connectionString: process.env.DATABASE_URL,
    });

    await client.connect();

    // Update profile
    const result = await client.query(
      `UPDATE professionals SET
        name = $1, email = $2, phone = $3, title = $4,
        bio = $5, summary = $6, portfolio_summary = $7, hero_subtitle = $8, about_greeting = $9,
        location = $10, linkedin_url = $11,
        github_url = $12, website_url = $13, updated_at = CURRENT_TIMESTAMP
      WHERE id = (SELECT id FROM professionals LIMIT 1)
      RETURNING *`,
      [
        validatedData.name,
        validatedData.email,
        validatedData.phone || null,
        validatedData.title || null,
        validatedData.bio || null,
        validatedData.summary || null,
        validatedData.portfolio_summary || null,
        validatedData.hero_subtitle || null,
        validatedData.about_greeting || null,
        validatedData.location || null,
        validatedData.linkedin_url || null,
        validatedData.github_url || null,
        validatedData.website_url || null,
      ]
    );

    await client.end();

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Profile not found' },
        { status: 404 }
      );
    }

    // Revalidate all pages that use profile data
    revalidatePath('/');
    revalidatePath('/portfolio');
    revalidatePath('/contact');

    return NextResponse.json({
      success: true,
      profile: result.rows[0],
    });

  } catch (error) {
    console.error('Profile update error:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to update profile' },
      { status: 500 }
    );
  }
}