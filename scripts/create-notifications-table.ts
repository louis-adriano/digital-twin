import { config } from 'dotenv';
import pg from 'pg';

config({ path: '.env.local' });

const { Client } = pg;

async function createNotificationsTable() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    console.log('🔗 Connecting to PostgreSQL...');
    await client.connect();
    console.log('✅ Connected to PostgreSQL');

    console.log('\n📋 Creating inquiry_notifications table...');
    
    await client.query(`
      CREATE TABLE IF NOT EXISTS inquiry_notifications (
        id SERIAL PRIMARY KEY,
        session_id VARCHAR(255),
        visitor_email VARCHAR(255) NOT NULL,
        visitor_name VARCHAR(255),
        inquiry_type VARCHAR(100),
        message TEXT NOT NULL,
        conversation_context TEXT,
        email_sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        resend_id VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    console.log('✅ Table created successfully');

    console.log('\n📊 Creating indexes...');
    
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_inquiry_session_id ON inquiry_notifications(session_id);
    `);
    
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_inquiry_visitor_email ON inquiry_notifications(visitor_email);
    `);
    
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_inquiry_email_sent_at ON inquiry_notifications(email_sent_at);
    `);

    console.log('✅ Indexes created successfully');

    // Check if table exists and show structure
    const tableCheck = await client.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'inquiry_notifications'
      ORDER BY ordinal_position;
    `);

    console.log('\n✨ Table structure:');
    tableCheck.rows.forEach(row => {
      console.log(`  • ${row.column_name}: ${row.data_type} ${row.is_nullable === 'NO' ? '(required)' : '(optional)'}`);
    });

    console.log('\n🎉 Notifications table setup completed successfully!');

  } catch (error) {
    console.error('❌ Error creating notifications table:', error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

createNotificationsTable();
