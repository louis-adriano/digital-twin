import { config } from 'dotenv';
import pg from 'pg';

config({ path: '.env.local' });

const { Client } = pg;

async function removePhoneNumber() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    console.log('🔗 Connecting to PostgreSQL...');
    await client.connect();
    console.log('✅ Connected to PostgreSQL');

    console.log('\n🗑️ Removing phone number from database...');
    const result = await client.query(
      `UPDATE professionals SET phone = NULL WHERE email = $1 RETURNING name, email, phone`,
      ['louisadriano00@gmail.com']
    );

    if (result.rows.length > 0) {
      console.log('✅ Phone number removed successfully');
      console.log(`   Name: ${result.rows[0].name}`);
      console.log(`   Email: ${result.rows[0].email}`);
      console.log(`   Phone: ${result.rows[0].phone || '(removed)'}`);
    } else {
      console.log('⚠️  No profile found to update');
    }

  } catch (error) {
    console.error('❌ Error removing phone number:', error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

removePhoneNumber();
