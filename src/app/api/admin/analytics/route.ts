import { config } from 'dotenv';
config({ path: '.env.local' });

import { NextRequest, NextResponse } from 'next/server';
import { Client } from 'pg';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'overview';

    const client = new Client({
      connectionString: process.env.DATABASE_URL,
    });

    await client.connect();

    let data = {};

    switch (type) {
      case 'overview':
        // Get basic system statistics
        const [professionalsCount, experiencesCount, skillsCount, projectsCount, contentChunksCount] = await Promise.all([
          client.query('SELECT COUNT(*) as count FROM professionals'),
          client.query('SELECT COUNT(*) as count FROM experiences'),
          client.query('SELECT COUNT(*) as count FROM skills'),
          client.query('SELECT COUNT(*) as count FROM projects'),
          client.query('SELECT COUNT(*) as count FROM content_chunks'),
        ]);

        data = {
          professionals: parseInt(professionalsCount.rows[0].count),
          experiences: parseInt(experiencesCount.rows[0].count),
          skills: parseInt(skillsCount.rows[0].count),
          projects: parseInt(projectsCount.rows[0].count),
          contentChunks: parseInt(contentChunksCount.rows[0].count),
          lastUpdated: new Date().toISOString(),
        };
        break;

      case 'skills':
        const skillsData = await client.query(`
          SELECT category, COUNT(*) as count
          FROM skills 
          GROUP BY category 
          ORDER BY count DESC
        `);
        data = {
          skillsByCategory: skillsData.rows.map(row => ({
            category: row.category,
            count: parseInt(row.count),
          })),
        };
        break;

      case 'content':
        const contentData = await client.query(`
          SELECT content_type, COUNT(*) as count
          FROM content_chunks 
          GROUP BY content_type 
          ORDER BY count DESC
        `);
        data = {
          contentByType: contentData.rows.map(row => ({
            type: row.content_type,
            count: parseInt(row.count),
          })),
        };
        break;

      default:
        data = { error: 'Invalid analytics type' };
    }

    await client.end();

    return NextResponse.json(data);

  } catch (error) {
    console.error('Analytics API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch analytics data' },
      { status: 500 }
    );
  }
}