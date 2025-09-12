import { config } from 'dotenv';
config({ path: '.env.local' });

import { NextRequest, NextResponse } from 'next/server';
import { Client } from 'pg';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action') || 'tables';
    const table = searchParams.get('table');
    const limit = parseInt(searchParams.get('limit') || '50');

    const client = new Client({
      connectionString: process.env.DATABASE_URL,
    });

    await client.connect();

    let data = {};

    switch (action) {
      case 'tables':
        // Get all tables with row counts
        const tablesResult = await client.query(`
          SELECT 
            schemaname,
            tablename,
            (xpath('/row/cnt/text()', xml_count))[1]::text::int as row_count
          FROM (
            SELECT 
              schemaname, 
              tablename, 
              query_to_xml(format('select count(*) as cnt from %I.%I', schemaname, tablename), false, true, '') as xml_count
            FROM pg_tables 
            WHERE schemaname = 'public'
          ) t
          ORDER BY row_count DESC NULLS LAST
        `);
        
        data = {
          tables: tablesResult.rows.map(row => ({
            schema: row.schemaname,
            name: row.tablename,
            rowCount: row.row_count || 0,
          })),
        };
        break;

      case 'data':
        if (!table) {
          return NextResponse.json({ error: 'Table parameter required' }, { status: 400 });
        }

        // Get table structure
        const columnsResult = await client.query(`
          SELECT column_name, data_type, is_nullable, column_default
          FROM information_schema.columns 
          WHERE table_schema = 'public' AND table_name = $1
          ORDER BY ordinal_position
        `, [table]);

        // Get table data
        const dataResult = await client.query(`SELECT * FROM ${table} LIMIT $1`, [limit]);

        data = {
          table,
          columns: columnsResult.rows,
          rows: dataResult.rows,
          totalShown: dataResult.rows.length,
          limit,
        };
        break;

      case 'schema':
        if (!table) {
          return NextResponse.json({ error: 'Table parameter required' }, { status: 400 });
        }

        const schemaResult = await client.query(`
          SELECT 
            column_name, 
            data_type, 
            character_maximum_length,
            is_nullable, 
            column_default,
            constraint_type
          FROM information_schema.columns c
          LEFT JOIN information_schema.key_column_usage kcu 
            ON c.table_name = kcu.table_name AND c.column_name = kcu.column_name
          LEFT JOIN information_schema.table_constraints tc 
            ON kcu.constraint_name = tc.constraint_name
          WHERE c.table_schema = 'public' AND c.table_name = $1
          ORDER BY c.ordinal_position
        `, [table]);

        data = {
          table,
          schema: schemaResult.rows,
        };
        break;

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    await client.end();
    return NextResponse.json(data);

  } catch (error) {
    console.error('Database API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch database information' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { action } = await request.json();

    switch (action) {
      case 'backup':
        // Placeholder for backup functionality
        return NextResponse.json({
          success: true,
          message: 'Database backup functionality not implemented yet',
          backupId: `backup_${Date.now()}`,
        });

      case 'validate':
        // Basic validation queries
        const client = new Client({
          connectionString: process.env.DATABASE_URL,
        });

        await client.connect();

        const validationResults = [];

        // Check for orphaned records
        const orphanedExperiences = await client.query(`
          SELECT COUNT(*) as count FROM experiences 
          WHERE professional_id NOT IN (SELECT id FROM professionals)
        `);

        validationResults.push({
          check: 'Orphaned Experiences',
          status: orphanedExperiences.rows[0].count === '0' ? 'PASS' : 'FAIL',
          count: orphanedExperiences.rows[0].count,
        });

        const orphanedSkills = await client.query(`
          SELECT COUNT(*) as count FROM skills 
          WHERE professional_id NOT IN (SELECT id FROM professionals)
        `);

        validationResults.push({
          check: 'Orphaned Skills',
          status: orphanedSkills.rows[0].count === '0' ? 'PASS' : 'FAIL',
          count: orphanedSkills.rows[0].count,
        });

        const orphanedProjects = await client.query(`
          SELECT COUNT(*) as count FROM projects 
          WHERE professional_id NOT IN (SELECT id FROM professionals)
        `);

        validationResults.push({
          check: 'Orphaned Projects',
          status: orphanedProjects.rows[0].count === '0' ? 'PASS' : 'FAIL',
          count: orphanedProjects.rows[0].count,
        });

        await client.end();

        return NextResponse.json({
          success: true,
          validation: validationResults,
        });

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

  } catch (error) {
    console.error('Database operation error:', error);
    return NextResponse.json(
      { error: 'Failed to perform database operation' },
      { status: 500 }
    );
  }
}