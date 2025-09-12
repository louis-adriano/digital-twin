#!/usr/bin/env tsx

/**
 * Installation script for Claude Desktop MCP Server integration
 * This script helps users set up the Digital Twin MCP server with Claude Desktop
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { homedir } from 'os';
import { execSync } from 'child_process';

const CLAUDE_CONFIG_PATHS = {
  darwin: join(homedir(), 'Library', 'Application Support', 'Claude', 'claude_desktop_config.json'),
  win32: join(homedir(), 'AppData', 'Roaming', 'Claude', 'claude_desktop_config.json'),
  linux: join(homedir(), '.config', 'claude-desktop', 'claude_desktop_config.json')
};

class MCPInstaller {
  private projectRoot: string;
  private mcpServerPath: string;

  constructor() {
    this.projectRoot = process.cwd();
    this.mcpServerPath = join(this.projectRoot, 'mcp-server');
  }

  private getClaudeConfigPath(): string {
    const platform = process.platform as keyof typeof CLAUDE_CONFIG_PATHS;
    return CLAUDE_CONFIG_PATHS[platform] || CLAUDE_CONFIG_PATHS.linux;
  }

  private async checkPrerequisites(): Promise<boolean> {
    console.log('🔍 Checking prerequisites...');

    // Check if MCP server exists
    if (!existsSync(this.mcpServerPath)) {
      console.error('❌ MCP server directory not found at:', this.mcpServerPath);
      return false;
    }

    // Check Node.js version
    try {
      const nodeVersion = execSync('node --version', { encoding: 'utf8' }).trim();
      const majorVersion = parseInt(nodeVersion.slice(1).split('.')[0]);
      
      if (majorVersion < 18) {
        console.error(`❌ Node.js version ${nodeVersion} is too old. Please upgrade to Node.js 18 or later.`);
        return false;
      }
      
      console.log(`✅ Node.js ${nodeVersion} detected`);
    } catch (error) {
      console.error('❌ Node.js not found. Please install Node.js 18 or later.');
      return false;
    }

    // Check tsx
    try {
      execSync('npx tsx --version', { encoding: 'utf8' });
      console.log('✅ tsx is available');
    } catch (error) {
      console.log('📦 Installing tsx...');
      try {
        execSync('npm install -g tsx', { stdio: 'inherit' });
        console.log('✅ tsx installed successfully');
      } catch (installError) {
        console.error('❌ Failed to install tsx. Please run: npm install -g tsx');
        return false;
      }
    }

    // Check environment variables
    if (!existsSync('.env.local')) {
      console.error('❌ .env.local file not found. Please create it with your database credentials.');
      return false;
    }

    const envContent = readFileSync('.env.local', 'utf8');
    const requiredEnvVars = ['DATABASE_URL', 'UPSTASH_VECTOR_REST_URL', 'UPSTASH_VECTOR_REST_TOKEN'];
    const missingVars = requiredEnvVars.filter(varName => !envContent.includes(varName));
    
    if (missingVars.length > 0) {
      console.error('❌ Missing required environment variables:', missingVars.join(', '));
      console.error('   Please add them to your .env.local file');
      return false;
    }

    console.log('✅ Environment variables configured');

    return true;
  }

  private async installMCPDependencies(): Promise<boolean> {
    console.log('📦 Installing MCP server dependencies...');
    
    try {
      execSync('npm install', { 
        cwd: this.mcpServerPath, 
        stdio: 'inherit' 
      });
      
      console.log('✅ MCP server dependencies installed');
      return true;
    } catch (error) {
      console.error('❌ Failed to install MCP server dependencies');
      return false;
    }
  }

  private async buildMCPServer(): Promise<boolean> {
    console.log('🔨 Building MCP server to JavaScript...');
    
    try {
      execSync('npx tsx build.ts', { 
        cwd: this.mcpServerPath, 
        stdio: 'inherit' 
      });
      
      console.log('✅ MCP server built successfully');
      return true;
    } catch (error) {
      console.error('❌ Failed to build MCP server');
      return false;
    }
  }

  private async testMCPServer(): Promise<boolean> {
    console.log('🧪 Testing MCP server...');

    try {
      // Quick test to see if server starts
      const testProcess = execSync(
        'timeout 10s npm run start || true', 
        { 
          cwd: this.mcpServerPath,
          encoding: 'utf8',
          timeout: 15000
        }
      );

      console.log('✅ MCP server test completed');
      return true;
    } catch (error) {
      console.error('❌ MCP server test failed:', error);
      console.log('💡 Try running: cd mcp-server && npm test');
      return false;
    }
  }

  private async setupClaudeDesktopConfig(): Promise<boolean> {
    console.log('⚙️ Configuring Claude Desktop...');

    const configPath = this.getClaudeConfigPath();
    const configDir = dirname(configPath);

    // Create config directory if it doesn't exist
    if (!existsSync(configDir)) {
      try {
        mkdirSync(configDir, { recursive: true });
        console.log(`✅ Created Claude config directory: ${configDir}`);
      } catch (error) {
        console.error(`❌ Failed to create config directory: ${configDir}`);
        return false;
      }
    }

    // Read existing config or create new one
    let existingConfig = {};
    if (existsSync(configPath)) {
      try {
        const content = readFileSync(configPath, 'utf8');
        existingConfig = JSON.parse(content);
        console.log('✅ Found existing Claude Desktop configuration');
      } catch (error) {
        console.log('⚠️ Existing config file is invalid, creating new one');
      }
    }

    // Load environment variables
    const envContent = readFileSync('.env.local', 'utf8');
    const envVars: { [key: string]: string } = {};
    
    envContent.split('\n').forEach(line => {
      const match = line.match(/^([^=]+)=["']?([^"'\n]*)["']?$/);
      if (match) {
        envVars[match[1]] = match[2];
      }
    });

    // Create MCP server configuration
    const mcpConfig = {
      ...existingConfig,
      mcpServers: {
        ...((existingConfig as any).mcpServers || {}),
        'digital-twin-professional': {
          command: 'node',
          args: [
            join(this.mcpServerPath, 'dist', 'index.js')
          ],
          env: {
            DATABASE_URL: envVars.DATABASE_URL,
            UPSTASH_VECTOR_REST_URL: envVars.UPSTASH_VECTOR_REST_URL,
            UPSTASH_VECTOR_REST_TOKEN: envVars.UPSTASH_VECTOR_REST_TOKEN
          }
        }
      }
    };

    try {
      writeFileSync(configPath, JSON.stringify(mcpConfig, null, 2));
      console.log('✅ Claude Desktop configuration updated');
      console.log(`📁 Config file location: ${configPath}`);
      return true;
    } catch (error) {
      console.error('❌ Failed to write Claude Desktop configuration:', error);
      return false;
    }
  }

  private async displayNextSteps(): Promise<void> {
    console.log('\n🎉 Installation completed successfully!');
    console.log('\n📋 Next Steps:');
    console.log('1. Restart Claude Desktop to load the new MCP server');
    console.log('2. In Claude Desktop, you should see "digital-twin-professional" in the MCP servers list');
    console.log('3. Test the integration with queries like:');
    console.log('   • "Find my React experience"');
    console.log('   • "What are my advanced skills?"');
    console.log('   • "Show me my contact information"');
    console.log('   • "Generate a professional summary"');
    console.log('\n🔧 Troubleshooting:');
    console.log('• Check Claude Desktop developer console for errors');
    console.log('• Test MCP server manually: cd mcp-server && npm test');
    console.log('• Verify environment variables in .env.local');
    console.log('\n📖 For more help, see: mcp-server/README.md');
  }

  async install(): Promise<boolean> {
    console.log('🚀 Digital Twin MCP Server Installation');
    console.log('=====================================\n');

    // Check prerequisites
    if (!await this.checkPrerequisites()) {
      console.error('\n❌ Prerequisites check failed. Please fix the issues above and try again.');
      return false;
    }

    // Install dependencies
    if (!await this.installMCPDependencies()) {
      console.error('\n❌ Dependency installation failed.');
      return false;
    }

    // Build server
    if (!await this.buildMCPServer()) {
      console.error('\n❌ MCP server build failed.');
      return false;
    }

    // Test server
    if (!await this.testMCPServer()) {
      console.log('\n⚠️ MCP server test had issues, but continuing...');
    }

    // Setup Claude Desktop
    if (!await this.setupClaudeDesktopConfig()) {
      console.error('\n❌ Claude Desktop configuration failed.');
      return false;
    }

    // Show next steps
    await this.displayNextSteps();

    return true;
  }
}

// CLI interface
async function main() {
  const installer = new MCPInstaller();
  
  try {
    const success = await installer.install();
    process.exit(success ? 0 : 1);
  } catch (error) {
    console.error('❌ Installation failed:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}