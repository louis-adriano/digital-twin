import { config } from 'dotenv';
config({ path: '.env.local' });

import { Client } from 'pg';

async function addDigitalTwinProject() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    await client.connect();
    console.log('✅ Connected to database');

    // Get professional ID
    const professionalResult = await client.query('SELECT id FROM professionals LIMIT 1');
    if (professionalResult.rows.length === 0) {
      console.error('❌ No professional profile found. Please run populate-database.ts first.');
      process.exit(1);
    }

    const professionalId = professionalResult.rows[0].id;

    // Check if project already exists
    const existingProject = await client.query(
      'SELECT id FROM projects WHERE name = $1',
      ['Digital Twin Portfolio']
    );

    if (existingProject.rows.length > 0) {
      console.log('⚠️  Digital Twin Portfolio already exists. Updating...');

      await client.query(
        `UPDATE projects SET
          description = $1,
          start_date = $2,
          end_date = $3,
          status = $4,
          technologies = $5,
          github_url = $6,
          live_url = $7,
          highlights = $8
        WHERE name = $9`,
        [
          'An AI-powered professional portfolio featuring a digital twin with RAG (Retrieval-Augmented Generation) chat capabilities. The application uses vector databases for semantic search and provides an interactive way for visitors to learn about professional background and experience.',
          '2025-01-01',
          null,
          'in-progress',
          [
            'Next.js 15',
            'React 19',
            'TypeScript',
            'PostgreSQL',
            'Upstash Vector',
            'Tailwind CSS',
            'Groq AI',
            'OpenAI',
            'Model Context Protocol'
          ],
          'https://github.com/louis-adriano/digital-twin',
          null,
          [
            'RAG-powered AI chatbot with semantic search capabilities',
            'Vector database integration with Upstash Vector',
            'Modern admin dashboard for content management',
            'Real-time chat interface with streaming responses',
            'MCP server integration for advanced AI capabilities',
            'Responsive design with Tailwind CSS'
          ],
          'Digital Twin Portfolio'
        ]
      );
      console.log('✅ Project updated successfully!');
    } else {
      // Insert new project
      const result = await client.query(
        `INSERT INTO projects (
          professional_id,
          name,
          description,
          start_date,
          end_date,
          status,
          technologies,
          github_url,
          live_url,
          highlights
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *`,
        [
          professionalId,
          'Digital Twin Portfolio',
          'An AI-powered professional portfolio featuring a digital twin with RAG (Retrieval-Augmented Generation) chat capabilities. The application uses vector databases for semantic search and provides an interactive way for visitors to learn about professional background and experience.',
          '2025-01-01',
          null,
          'in-progress',
          [
            'Next.js 15',
            'React 19',
            'TypeScript',
            'PostgreSQL',
            'Upstash Vector',
            'Tailwind CSS',
            'Groq AI',
            'OpenAI',
            'Model Context Protocol'
          ],
          'https://github.com/louis-adriano/digital-twin',
          null,
          [
            'RAG-powered AI chatbot with semantic search capabilities',
            'Vector database integration with Upstash Vector',
            'Modern admin dashboard for content management',
            'Real-time chat interface with streaming responses',
            'MCP server integration for advanced AI capabilities',
            'Responsive design with Tailwind CSS'
          ]
        ]
      );

      console.log('✅ Project added successfully!');
      console.log('\n📦 Project Details:');
      console.log(`   ID: ${result.rows[0].id}`);
      console.log(`   Name: ${result.rows[0].name}`);
      console.log(`   Status: ${result.rows[0].status}`);
      console.log(`   Technologies: ${result.rows[0].technologies.join(', ')}`);
    }

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

addDigitalTwinProject();
