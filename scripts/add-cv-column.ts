import { config } from 'dotenv';
import pg from 'pg';

// Load environment variables
config({ path: '.env.local' });

const { Client } = pg;

async function addCvColumn() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    console.log('🏗️  Adding cv_filename column to professionals table...');
    await client.connect();

    // Check if column already exists
    const columnExists = await client.query(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'professionals'
      AND column_name = 'cv_filename'
    `);

    if (columnExists.rows.length === 0) {
      // Add the column if it doesn't exist
      await client.query(`
        ALTER TABLE professionals
        ADD COLUMN cv_filename VARCHAR(255)
      `);
      console.log('✅ cv_filename column added successfully!');
    } else {
      console.log('ℹ️  cv_filename column already exists!');
    }

  } catch (error) {
    console.error('❌ Failed to add cv_filename column:', error);
  } finally {
    await client.end();
  }
}

addCvColumn().catch(console.error);