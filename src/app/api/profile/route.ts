import { NextResponse } from 'next/server';
import { Client } from 'pg';

export async function GET() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    await client.connect();
    
    // Get profile
    const profileResult = await client.query('SELECT * FROM professionals LIMIT 1');
    const profile = profileResult.rows[0];

    // Get experiences
    const experiencesResult = await client.query(
      'SELECT * FROM experiences WHERE professional_id = $1 ORDER BY start_date DESC',
      [profile.id]
    );

    // Get skills
    const skillsResult = await client.query(
      'SELECT * FROM skills WHERE professional_id = $1 ORDER BY category, name',
      [profile.id]
    );

    // Get projects
    const projectsResult = await client.query(
      'SELECT * FROM projects WHERE professional_id = $1 ORDER BY start_date DESC',
      [profile.id]
    );

    // Get education
    const educationResult = await client.query(
      'SELECT * FROM education WHERE professional_id = $1 ORDER BY start_date DESC',
      [profile.id]
    );

    return NextResponse.json({
      profile: {
        name: profile.name,
        email: profile.email,
        location: profile.location,
        bio: profile.summary,
        linkedin_url: profile.linkedin_url,
        github_url: profile.github_url,
        website_url: profile.website_url,
      },
      experiences: experiencesResult.rows.map(exp => ({
        id: exp.id,
        title: exp.position,
        company: exp.company,
        location: exp.location,
        start_date: exp.start_date,
        end_date: exp.end_date,
        description: exp.description,
      })),
      skills: skillsResult.rows,
      projects: projectsResult.rows.map(proj => ({
        id: proj.id,
        name: proj.name,
        description: proj.description,
        technologies: proj.technologies || [],
        github_url: proj.github_url,
        live_url: proj.live_url,
        start_date: proj.start_date,
        end_date: proj.end_date,
      })),
      education: educationResult.rows.map(edu => ({
        id: edu.id,
        institution: edu.institution,
        degree: edu.degree,
        field_of_study: edu.field_of_study,
        start_date: edu.start_date,
        end_date: edu.end_date,
        description: edu.description,
      })),
    });
  } catch (error) {
    console.error('Database error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch profile data' },
      { status: 500 }
    );
  } finally {
    await client.end();
  }
}