import { config } from 'dotenv';
import pg from 'pg';

config({ path: '.env.local' });

const { Client } = pg;

async function createThoughtsTable() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    console.log('🔧 Creating thoughts table...');
    await client.connect();

    await client.query(`
      CREATE TABLE IF NOT EXISTS thoughts (
        id SERIAL PRIMARY KEY,
        professional_id INTEGER REFERENCES professionals(id) ON DELETE CASCADE,
        title VARCHAR(500) NOT NULL,
        excerpt TEXT NOT NULL,
        linkedin_url VARCHAR(1000),
        published_date DATE NOT NULL,
        is_featured BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE INDEX IF NOT EXISTS idx_thoughts_professional_id ON thoughts(professional_id);
      CREATE INDEX IF NOT EXISTS idx_thoughts_published_date ON thoughts(published_date DESC);
      CREATE INDEX IF NOT EXISTS idx_thoughts_featured ON thoughts(is_featured);
    `);

    console.log('✅ Thoughts table created successfully!');
    
    // Show table structure
    const columns = await client.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'thoughts' 
      ORDER BY ordinal_position
    `);
    
    console.log('\n📋 Thoughts table structure:');
    columns.rows.forEach(col => {
      console.log(`  • ${col.column_name.padEnd(20)} ${col.data_type.padEnd(30)} ${col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL'}`);
    });

  } catch (error) {
    console.error('❌ Failed:', error);
  } finally {
    await client.end();
  }
}

createThoughtsTable().catch(console.error);
