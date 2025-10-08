#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
  CallToolResult,
  TextContent,
  ImageContent,
} from '@modelcontextprotocol/sdk/types.js';
import { Client } from 'pg';
import { Index } from '@upstash/vector';
import { config } from 'dotenv';

// Load environment variables (suppress dotenv output to avoid Claude Desktop JSON parsing issues)
const originalWrite = process.stdout.write;
process.stdout.write = () => true;
config({ path: '../.env.local' });
process.stdout.write = originalWrite;

// Database connections
const getDbClient = () => new Client({
  connectionString: process.env.DATABASE_URL,
});

const vectorIndex = new Index({
  url: process.env.UPSTASH_VECTOR_REST_URL!,
  token: process.env.UPSTASH_VECTOR_REST_TOKEN!,
});

// Professional data types
interface ProfessionalProfile {
  id: number;
  name: string;
  email: string;
  phone?: string;
  title?: string;
  summary?: string;
  location?: string;
  linkedin_url?: string;
  github_url?: string;
  website_url?: string;
}

interface Experience {
  id: number;
  company: string;
  position: string;
  start_date: string;
  end_date?: string;
  description?: string;
  location?: string;
  achievements?: string[];
  technologies?: string[];
}

interface Skill {
  id: number;
  name: string;
  category: string;
  proficiency_level: number;
  years_experience?: number;
  description?: string;
}

interface Project {
  id: number;
  name: string;
  description?: string;
  start_date?: string;
  end_date?: string;
  status?: string;
  technologies?: string[];
  github_url?: string;
  live_url?: string;
  highlights?: string[];
}

// Import tool modules
import { 
  searchTools, 
  handleSemanticSearch, 
  handleSearchExperiences, 
  handleSearchSkills, 
  handleSearchProjects 
} from './tools/search-tools.js';

import { 
  contactTools, 
  handleGetContactInfo, 
  handleGetAvailabilityStatus, 
  handleGetPreferredContactMethod, 
  handleGenerateIntroductionEmail 
} from './tools/contact-tools.js';

import { 
  contextTools, 
  handleGetCompleteProfile, 
  handleGetCareerProgression, 
  handleGenerateProfessionalSummary 
} from './tools/context-tools.js';

// MCP Server setup
const server = new Server(
  {
    name: 'digital-twin-professional',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Error handling helper
const handleError = (error: unknown, context: string): CallToolResult => {
  console.error(`Error in ${context}:`, error);
  return {
    content: [{
      type: 'text',
      text: `Error in ${context}: ${error instanceof Error ? error.message : 'Unknown error'}`
    }],
    isError: true,
  };
};

// Database helper functions
const connectAndQuery = async <T>(
  queryFn: (client: Client) => Promise<T>
): Promise<T> => {
  const client = getDbClient();
  try {
    await client.connect();
    return await queryFn(client);
  } finally {
    await client.end();
  }
};

// Combine all tools
const allTools = [
  ...searchTools,
  ...contactTools,
  ...contextTools
];

// List tools handler
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: allTools,
  };
});

// Call tool handler
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    // Search tools
    switch (name) {
      case 'semantic_search_professional':
        return await handleSemanticSearch(args);
      case 'search_experiences':
        return await handleSearchExperiences(args);
      case 'search_skills':
        return await handleSearchSkills(args);
      case 'search_projects':
        return await handleSearchProjects(args);
      
      // Contact tools
      case 'get_contact_info':
        return await handleGetContactInfo(args);
      case 'get_availability_status':
        return await handleGetAvailabilityStatus(args);
      case 'get_preferred_contact_method':
        return await handleGetPreferredContactMethod(args);
      case 'generate_introduction_email':
        return await handleGenerateIntroductionEmail(args);
      
      // Context tools
      case 'get_complete_profile':
        return await handleGetCompleteProfile(args);
      case 'get_career_progression':
        return await handleGetCareerProgression(args);
      case 'generate_professional_summary':
        return await handleGenerateProfessionalSummary(args);
      
      default:
        return {
          content: [{
            type: 'text',
            text: `Unknown tool: ${name}`
          }],
          isError: true,
        };
    }
  } catch (error) {
    return handleError(error, `tool ${name}`);
  }
});

// Start the server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('Digital Twin MCP Server running on stdio');
}

// Handle process termination
process.on('SIGINT', async () => {
  console.error('Shutting down Digital Twin MCP Server...');
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.error('Shutting down Digital Twin MCP Server...');
  process.exit(0);
});

// Start the server
main().catch((error) => {
  console.error('Failed to start MCP server:', error);
  process.exit(1);
});

export { server, connectAndQuery, handleError };