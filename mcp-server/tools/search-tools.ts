import { Tool, CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { connectAndQuery, handleError } from '../index.js';
import { Index } from '@upstash/vector';

// Lazy-load vector index instance to ensure env vars are loaded first
let vectorIndex: Index | null = null;
const getVectorIndex = () => {
  if (!vectorIndex) {
    vectorIndex = new Index({
      url: process.env.UPSTASH_VECTOR_REST_URL!,
      token: process.env.UPSTASH_VECTOR_REST_TOKEN!,
    });
  }
  return vectorIndex;
};

// Professional search tools
export const searchTools: Tool[] = [
  {
    name: 'semantic_search_professional',
    description: 'Perform semantic search across all professional data including experience, skills, projects, and education',
    inputSchema: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'Search query to find relevant professional information'
        },
        limit: {
          type: 'number',
          description: 'Maximum number of results to return (default: 10)',
          default: 10
        },
        min_score: {
          type: 'number',
          description: 'Minimum similarity score threshold (0.0-1.0, default: 0.7)',
          default: 0.7
        }
      },
      required: ['query']
    }
  },
  {
    name: 'search_experiences',
    description: 'Search work experiences by company, position, skills, or keywords',
    inputSchema: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'Search terms for filtering experiences'
        },
        company: {
          type: 'string',
          description: 'Filter by specific company name'
        },
        position: {
          type: 'string',
          description: 'Filter by job title/position'
        },
        technology: {
          type: 'string',
          description: 'Filter by technology used'
        },
        date_range: {
          type: 'object',
          properties: {
            start: { type: 'string', format: 'date' },
            end: { type: 'string', format: 'date' }
          },
          description: 'Filter experiences within date range'
        }
      },
      required: []
    }
  },
  {
    name: 'search_skills',
    description: 'Search skills by name, category, or proficiency level',
    inputSchema: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'Skill name or keyword to search for'
        },
        category: {
          type: 'string',
          description: 'Filter by skill category (e.g., "Programming Languages", "Frontend Frameworks")'
        },
        min_proficiency: {
          type: 'number',
          description: 'Minimum proficiency level (1-5)',
          minimum: 1,
          maximum: 5
        },
        min_experience_years: {
          type: 'number',
          description: 'Minimum years of experience with the skill'
        }
      },
      required: []
    }
  },
  {
    name: 'search_projects',
    description: 'Search projects by name, technology, status, or description',
    inputSchema: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'Project name or keyword to search for'
        },
        technology: {
          type: 'string',
          description: 'Filter by technology used in projects'
        },
        status: {
          type: 'string',
          description: 'Filter by project status (completed, in-progress, on-hold, etc.)'
        },
        has_live_demo: {
          type: 'boolean',
          description: 'Filter projects that have live demo URLs'
        },
        has_github: {
          type: 'boolean',
          description: 'Filter projects that have GitHub repositories'
        }
      },
      required: []
    }
  }
];

// Tool handlers
export const handleSemanticSearch = async (args: any): Promise<CallToolResult> => {
  try {
    const { query, limit = 10, min_score = 0.7 } = args;

    const searchResults = await getVectorIndex().query({
      data: query,
      topK: limit,
      includeMetadata: true,
      includeData: true,
    });

    const relevantResults = searchResults
      .filter(result => result.score >= min_score)
      .map(result => ({
        content: result.data,
        metadata: result.metadata,
        score: result.score,
      }));

    if (relevantResults.length === 0) {
      return {
        content: [{
          type: 'text',
          text: `No relevant results found for query: "${query}" with minimum score ${min_score}. Try a different search term or lower the minimum score threshold.`
        }]
      };
    }

    const formattedResults = relevantResults.map((result, index) => 
      `**Result ${index + 1} (Score: ${result.score.toFixed(3)})**\n${result.content}\n---`
    ).join('\n\n');

    return {
      content: [{
        type: 'text',
        text: `Found ${relevantResults.length} relevant results for "${query}":\n\n${formattedResults}`
      }]
    };
  } catch (error) {
    return handleError(error, 'semantic search');
  }
};

export const handleSearchExperiences = async (args: any): Promise<CallToolResult> => {
  try {
    const { query, company, position, technology, date_range } = args;

    const experiences = await connectAndQuery(async (client) => {
      let sql = `
        SELECT e.*, 
               EXTRACT(YEAR FROM e.start_date) as start_year,
               EXTRACT(YEAR FROM COALESCE(e.end_date, CURRENT_DATE)) as end_year
        FROM experiences e 
        WHERE 1=1
      `;
      const params: any[] = [];
      let paramIndex = 1;

      if (query) {
        sql += ` AND (
          LOWER(e.company) LIKE LOWER($${paramIndex}) OR 
          LOWER(e.position) LIKE LOWER($${paramIndex}) OR 
          LOWER(e.description) LIKE LOWER($${paramIndex})
        )`;
        params.push(`%${query}%`);
        paramIndex++;
      }

      if (company) {
        sql += ` AND LOWER(e.company) LIKE LOWER($${paramIndex})`;
        params.push(`%${company}%`);
        paramIndex++;
      }

      if (position) {
        sql += ` AND LOWER(e.position) LIKE LOWER($${paramIndex})`;
        params.push(`%${position}%`);
        paramIndex++;
      }

      if (technology) {
        sql += ` AND $${paramIndex} = ANY(e.technologies)`;
        params.push(technology);
        paramIndex++;
      }

      if (date_range?.start) {
        sql += ` AND e.start_date >= $${paramIndex}`;
        params.push(date_range.start);
        paramIndex++;
      }

      if (date_range?.end) {
        sql += ` AND COALESCE(e.end_date, CURRENT_DATE) <= $${paramIndex}`;
        params.push(date_range.end);
        paramIndex++;
      }

      sql += ` ORDER BY e.start_date DESC`;

      const result = await client.query(sql, params);
      return result.rows;
    });

    if (experiences.length === 0) {
      return {
        content: [{
          type: 'text',
          text: 'No experiences found matching the specified criteria.'
        }]
      };
    }

    const formattedExperiences = experiences.map((exp: any) => {
      const duration = exp.end_date 
        ? `${exp.start_date.toISOString().split('T')[0]} to ${exp.end_date.toISOString().split('T')[0]}`
        : `${exp.start_date.toISOString().split('T')[0]} to Present`;

      let details = `**${exp.position} at ${exp.company}**\n`;
      details += `📅 Duration: ${duration}\n`;
      
      if (exp.location) details += `📍 Location: ${exp.location}\n`;
      if (exp.description) details += `📋 Description: ${exp.description}\n`;
      
      if (exp.achievements && exp.achievements.length > 0) {
        details += `🏆 Key Achievements:\n${exp.achievements.map((a: string) => `  • ${a}`).join('\n')}\n`;
      }
      
      if (exp.technologies && exp.technologies.length > 0) {
        details += `💻 Technologies: ${exp.technologies.join(', ')}\n`;
      }

      return details;
    }).join('\n---\n\n');

    return {
      content: [{
        type: 'text',
        text: `Found ${experiences.length} experience(s):\n\n${formattedExperiences}`
      }]
    };
  } catch (error) {
    return handleError(error, 'search experiences');
  }
};

export const handleSearchSkills = async (args: any): Promise<CallToolResult> => {
  try {
    const { query, category, min_experience_years } = args;

    const skills = await connectAndQuery(async (client) => {
      let sql = `
        SELECT s.* FROM skills s WHERE 1=1
      `;
      const params: any[] = [];
      let paramIndex = 1;

      if (query) {
        sql += ` AND LOWER(s.name) LIKE LOWER($${paramIndex})`;
        params.push(`%${query}%`);
        paramIndex++;
      }

      if (category) {
        sql += ` AND LOWER(s.category) = LOWER($${paramIndex})`;
        params.push(category);
        paramIndex++;
      }



      if (min_experience_years) {
        sql += ` AND s.years_experience >= $${paramIndex}`;
        params.push(min_experience_years);
        paramIndex++;
      }

      sql += ` ORDER BY s.category, s.name`;

      const result = await client.query(sql, params);
      return result.rows;
    });

    if (skills.length === 0) {
      return {
        content: [{
          type: 'text',
          text: 'No skills found matching the specified criteria.'
        }]
      };
    }

    // Group skills by category
    const skillsByCategory: { [key: string]: any[] } = {};
    skills.forEach((skill: any) => {
      if (!skillsByCategory[skill.category]) {
        skillsByCategory[skill.category] = [];
      }
      skillsByCategory[skill.category].push(skill);
    });

    const formattedSkills = Object.entries(skillsByCategory).map(([cat, catSkills]) => {
      const skillList = catSkills.map((skill: any) => {
        let skillInfo = `  • **${skill.name}**`;
        
        if (skill.years_experience) {
          skillInfo += ` | ${skill.years_experience} years experience`;
        }
        
        if (skill.description) {
          skillInfo += `\n    ${skill.description}`;
        }
        
        return skillInfo;
      }).join('\n');

      return `**${cat}**\n${skillList}`;
    }).join('\n\n');

    return {
      content: [{
        type: 'text',
        text: `Found ${skills.length} skill(s) across ${Object.keys(skillsByCategory).length} categories:\n\n${formattedSkills}`
      }]
    };
  } catch (error) {
    return handleError(error, 'search skills');
  }
};

export const handleSearchProjects = async (args: any): Promise<CallToolResult> => {
  try {
    const { query, technology, status, has_live_demo, has_github } = args;

    const projects = await connectAndQuery(async (client) => {
      let sql = `
        SELECT p.* FROM projects p WHERE 1=1
      `;
      const params: any[] = [];
      let paramIndex = 1;

      if (query) {
        sql += ` AND (
          LOWER(p.name) LIKE LOWER($${paramIndex}) OR 
          LOWER(p.description) LIKE LOWER($${paramIndex})
        )`;
        params.push(`%${query}%`);
        paramIndex++;
      }

      if (technology) {
        sql += ` AND $${paramIndex} = ANY(p.technologies)`;
        params.push(technology);
        paramIndex++;
      }

      if (status) {
        sql += ` AND LOWER(p.status) = LOWER($${paramIndex})`;
        params.push(status);
        paramIndex++;
      }

      if (has_live_demo !== undefined) {
        sql += has_live_demo 
          ? ` AND p.live_url IS NOT NULL AND p.live_url != ''`
          : ` AND (p.live_url IS NULL OR p.live_url = '')`;
      }

      if (has_github !== undefined) {
        sql += has_github
          ? ` AND p.github_url IS NOT NULL AND p.github_url != ''`
          : ` AND (p.github_url IS NULL OR p.github_url = '')`;
      }

      sql += ` ORDER BY p.start_date DESC NULLS LAST`;

      const result = await client.query(sql, params);
      return result.rows;
    });

    if (projects.length === 0) {
      return {
        content: [{
          type: 'text',
          text: 'No projects found matching the specified criteria.'
        }]
      };
    }

    const formattedProjects = projects.map((project: any) => {
      let details = `**${project.name}**\n`;
      
      if (project.status) {
        const statusIcon = ({
          'completed': '✅',
          'in-progress': '🔄',
          'on-hold': '⏸️',
          'planning': '📋',
          'cancelled': '❌'
        } as Record<string, string>)[project.status] || '📝';
        details += `${statusIcon} Status: ${project.status.charAt(0).toUpperCase() + project.status.slice(1).replace('-', ' ')}\n`;
      }

      if (project.start_date) {
        const duration = project.end_date 
          ? `${project.start_date.toISOString().split('T')[0]} to ${project.end_date.toISOString().split('T')[0]}`
          : `${project.start_date.toISOString().split('T')[0]} to Present`;
        details += `📅 Duration: ${duration}\n`;
      }

      if (project.description) details += `📋 Description: ${project.description}\n`;

      if (project.technologies && project.technologies.length > 0) {
        details += `💻 Technologies: ${project.technologies.join(', ')}\n`;
      }

      if (project.highlights && project.highlights.length > 0) {
        details += `⭐ Highlights:\n${project.highlights.map((h: string) => `  • ${h}`).join('\n')}\n`;
      }

      const links = [];
      if (project.github_url) links.push(`[GitHub](${project.github_url})`);
      if (project.live_url) links.push(`[Live Demo](${project.live_url})`);
      if (links.length > 0) {
        details += `🔗 Links: ${links.join(' | ')}\n`;
      }

      return details;
    }).join('\n---\n\n');

    return {
      content: [{
        type: 'text',
        text: `Found ${projects.length} project(s):\n\n${formattedProjects}`
      }]
    };
  } catch (error) {
    return handleError(error, 'search projects');
  }
};