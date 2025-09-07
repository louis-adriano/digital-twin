#!/usr/bin/env node

/**
 * Complete Digital Twin Database Setup
 * 
 * This script sets up your entire digital twin system:
 * 1. Creates PostgreSQL schema
 * 2. Populates with professional data
 * 3. Migrates to vector database for semantic search
 */

import { spawn } from 'child_process';
import { config } from 'dotenv';

// Load environment variables
config({ path: '.env.local' });

console.log('🚀 Digital Twin Database Setup');
console.log('==============================');

async function runScript(scriptName: string, description: string): Promise<boolean> {
  return new Promise((resolve) => {
    console.log(`\n${description}...`);
    
    const process = spawn('npx', ['tsx', `scripts/${scriptName}`], {
      stdio: 'inherit',
      shell: true
    });

    process.on('close', (code) => {
      if (code === 0) {
        console.log(`✅ ${description} completed successfully!`);
        resolve(true);
      } else {
        console.error(`❌ ${description} failed with code ${code}`);
        resolve(false);
      }
    });

    process.on('error', (error) => {
      console.error(`❌ ${description} failed:`, error);
      resolve(false);
    });
  });
}

async function main() {
  console.log('\n📋 This will set up your complete digital twin system.');
  console.log('Make sure you have configured your .env.local file first.\n');

  // Step 1: Create schema
  const schemaSuccess = await runScript('create-schema.ts', '🏗️  Creating database schema');
  if (!schemaSuccess) {
    console.error('❌ Setup failed at schema creation. Please check your DATABASE_URL.');
    process.exit(1);
  }

  // Step 2: Populate data
  const populateSuccess = await runScript('populate-database.ts', '📊 Populating professional data');
  if (!populateSuccess) {
    console.error('❌ Setup failed at data population.');
    process.exit(1);
  }

  // Step 3: Migrate to vector
  const vectorSuccess = await runScript('migrate-to-vector.ts', '🔍 Setting up vector database');
  if (!vectorSuccess) {
    console.error('❌ Setup failed at vector migration. Please check your Upstash credentials.');
    process.exit(1);
  }

  console.log('\n🎉 Digital Twin Setup Complete!');
  console.log('================================');
  console.log('✅ PostgreSQL database ready');
  console.log('✅ Professional data populated');
  console.log('✅ Vector database configured');
  console.log('\n🚀 You can now run: npm run dev');
}

// Check if environment variables are set
function checkEnvironment(): boolean {
  const required = [
    'DATABASE_URL',
    'UPSTASH_VECTOR_REST_URL', 
    'UPSTASH_VECTOR_REST_TOKEN'
  ];

  const missing = required.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    console.error('❌ Missing required environment variables:');
    missing.forEach(key => console.error(`   - ${key}`));
    console.error('\nPlease configure your .env.local file first.');
    return false;
  }

  return true;
}

// Run setup if environment is ready
if (checkEnvironment()) {
  main().catch(console.error);
} else {
  process.exit(1);
}