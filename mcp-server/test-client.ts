#!/usr/bin/env node

/**
 * Test client for the Digital Twin MCP Server
 * This utility allows testing all MCP tools from the command line
 */

import { spawn } from 'child_process';
import { createReadStream, createWriteStream } from 'fs';
import { randomUUID } from 'crypto';

interface MCPRequest {
  jsonrpc: '2.0';
  id: string;
  method: string;
  params?: any;
}

interface MCPResponse {
  jsonrpc: '2.0';
  id: string;
  result?: any;
  error?: {
    code: number;
    message: string;
    data?: any;
  };
}

class MCPTestClient {
  private server: any;
  private requestId = 1;

  constructor(serverPath: string) {
    console.log(`Starting MCP server: ${serverPath}`);
    this.server = spawn('tsx', [serverPath], {
      stdio: ['pipe', 'pipe', 'pipe']
    });

    this.server.stderr?.on('data', (data: Buffer) => {
      console.log('Server stderr:', data.toString());
    });

    this.server.on('error', (error: Error) => {
      console.error('Server error:', error);
    });

    this.server.on('close', (code: number) => {
      console.log(`Server exited with code ${code}`);
    });
  }

  private async sendRequest(method: string, params?: any): Promise<MCPResponse> {
    const request: MCPRequest = {
      jsonrpc: '2.0',
      id: `test-${this.requestId++}`,
      method,
      params
    };

    return new Promise((resolve, reject) => {
      const requestStr = JSON.stringify(request) + '\n';
      console.log('→ Sending request:', JSON.stringify(request, null, 2));
      
      this.server.stdin.write(requestStr);

      const onData = (data: Buffer) => {
        const response = data.toString().trim();
        if (response) {
          try {
            const parsed = JSON.parse(response);
            console.log('← Received response:', JSON.stringify(parsed, null, 2));
            this.server.stdout.removeListener('data', onData);
            resolve(parsed);
          } catch (e) {
            console.log('Raw response:', response);
            reject(new Error(`Failed to parse response: ${e}`));
          }
        }
      };

      this.server.stdout.on('data', onData);

      setTimeout(() => {
        this.server.stdout.removeListener('data', onData);
        reject(new Error('Request timeout'));
      }, 30000);
    });
  }

  async testListTools() {
    console.log('\n=== Testing List Tools ===');
    try {
      const response = await this.sendRequest('tools/list');
      console.log(`✅ Found ${response.result?.tools?.length || 0} tools`);
      return response.result?.tools || [];
    } catch (error) {
      console.error('❌ List tools failed:', error);
      return [];
    }
  }

  async testSearchTools() {
    console.log('\n=== Testing Search Tools ===');
    
    const tests = [
      {
        name: 'semantic_search_professional',
        args: { query: 'full stack development experience', limit: 5 }
      },
      {
        name: 'search_experiences',
        args: { query: 'developer', limit: 3 }
      },
      {
        name: 'search_skills',
        args: { min_proficiency: 4 }
      },
      {
        name: 'search_projects',
        args: { status: 'completed' }
      }
    ];

    for (const test of tests) {
      try {
        console.log(`\n--- Testing ${test.name} ---`);
        const response = await this.sendRequest('tools/call', {
          name: test.name,
          arguments: test.args
        });
        
        if (response.error) {
          console.error(`❌ ${test.name} failed:`, response.error);
        } else {
          console.log(`✅ ${test.name} succeeded`);
          console.log('Content preview:', response.result?.content?.[0]?.text?.substring(0, 200) + '...');
        }
      } catch (error) {
        console.error(`❌ ${test.name} error:`, error);
      }
    }
  }

  async testContactTools() {
    console.log('\n=== Testing Contact Tools ===');
    
    const tests = [
      {
        name: 'get_contact_info',
        args: { include_personal: false }
      },
      {
        name: 'get_availability_status',
        args: { opportunity_type: 'full-time' }
      },
      {
        name: 'get_preferred_contact_method',
        args: { inquiry_type: 'job-opportunity' }
      },
      {
        name: 'generate_introduction_email',
        args: { 
          context: 'job opportunity',
          company_name: 'TechCorp',
          role_title: 'Senior Full Stack Developer'
        }
      }
    ];

    for (const test of tests) {
      try {
        console.log(`\n--- Testing ${test.name} ---`);
        const response = await this.sendRequest('tools/call', {
          name: test.name,
          arguments: test.args
        });
        
        if (response.error) {
          console.error(`❌ ${test.name} failed:`, response.error);
        } else {
          console.log(`✅ ${test.name} succeeded`);
          console.log('Content preview:', response.result?.content?.[0]?.text?.substring(0, 200) + '...');
        }
      } catch (error) {
        console.error(`❌ ${test.name} error:`, error);
      }
    }
  }

  async testContextTools() {
    console.log('\n=== Testing Context Tools ===');
    
    const tests = [
      {
        name: 'get_complete_profile',
        args: { 
          include_details: false,
          section_filter: ['profile', 'experiences']
        }
      },
      {
        name: 'get_career_progression',
        args: { focus: 'roles' }
      },
      {
        name: 'generate_professional_summary',
        args: { 
          audience: 'recruiter',
          length: 'standard'
        }
      }
    ];

    for (const test of tests) {
      try {
        console.log(`\n--- Testing ${test.name} ---`);
        const response = await this.sendRequest('tools/call', {
          name: test.name,
          arguments: test.args
        });
        
        if (response.error) {
          console.error(`❌ ${test.name} failed:`, response.error);
        } else {
          console.log(`✅ ${test.name} succeeded`);
          console.log('Content preview:', response.result?.content?.[0]?.text?.substring(0, 200) + '...');
        }
      } catch (error) {
        console.error(`❌ ${test.name} error:`, error);
      }
    }
  }

  async runAllTests() {
    console.log('🚀 Starting MCP Server Test Suite');
    
    try {
      // Test basic connectivity
      const tools = await this.testListTools();
      
      if (tools.length === 0) {
        console.error('❌ No tools found, aborting tests');
        return;
      }
      
      // Test all tool categories
      await this.testSearchTools();
      await this.testContactTools();
      await this.testContextTools();
      
      console.log('\n✅ All tests completed!');
      
    } catch (error) {
      console.error('❌ Test suite failed:', error);
    }
  }

  async close() {
    if (this.server) {
      this.server.kill();
    }
  }
}

// CLI interface
async function main() {
  const args = process.argv.slice(2);
  const serverPath = args[0] || './index.ts';
  
  console.log('Digital Twin MCP Server Test Client');
  console.log('=====================================');
  
  const client = new MCPTestClient(serverPath);
  
  // Give server time to start
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  try {
    await client.runAllTests();
  } finally {
    await client.close();
    process.exit(0);
  }
}

// Handle signals
process.on('SIGINT', () => {
  console.log('\n👋 Test client shutting down...');
  process.exit(0);
});

if (require.main === module) {
  main().catch(console.error);
}