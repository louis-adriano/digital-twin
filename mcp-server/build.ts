#!/usr/bin/env tsx

/**
 * Build script to compile TypeScript MCP server to JavaScript
 * This creates a standalone JS file that doesn't need tsx at runtime
 */

import { execSync } from 'child_process';
import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('🏗️ Building MCP Server...');

try {
  // Compile TypeScript to JavaScript
  execSync('npx tsc --outDir dist --target es2022 --module node16 --moduleResolution node16 --esModuleInterop --allowSyntheticDefaultImports --skipLibCheck index.ts tools/search-tools.ts tools/contact-tools.ts tools/context-tools.ts', {
    stdio: 'inherit',
    cwd: __dirname
  });

  console.log('✅ TypeScript compilation completed');

  // Update the compiled file to use .js extensions for imports
  const indexPath = join(__dirname, 'dist', 'index.js');
  let indexContent = readFileSync(indexPath, 'utf8');

  // Fix import paths to use .js extensions
  indexContent = indexContent.replace(/from '\.\/tools\/(.*?)\.js'/g, "from './tools/$1.js'");
  indexContent = indexContent.replace(/require\.main === module/g, 'import.meta.url === `file://${process.argv[1]}`');

  writeFileSync(indexPath, indexContent);

  // Make the file executable
  if (process.platform !== 'win32') {
    execSync(`chmod +x ${indexPath}`);
  }

  console.log('✅ MCP Server built successfully!');
  console.log(`📁 Output: ${indexPath}`);
  console.log('');
  console.log('🔧 Update your Claude Desktop config to use:');
  console.log(`   "command": "node"`);
  console.log(`   "args": ["${indexPath}"]`);

} catch (error) {
  console.error('❌ Build failed:', error);
  process.exit(1);
}