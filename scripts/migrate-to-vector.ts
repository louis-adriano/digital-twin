import { config } from 'dotenv';
import { Index } from "@upstash/vector";
import pg from 'pg';

// Load environment variables
config({ path: '.env.local' });

const { Client } = pg;

class VectorMigration {
  private vectorIndex: Index;
  private pgClient: pg.Client;

  constructor() {
    this.vectorIndex = new Index({
      url: process.env.UPSTASH_VECTOR_REST_URL!,
      token: process.env.UPSTASH_VECTOR_REST_TOKEN!,
    });

    this.pgClient = new Client({
      connectionString: process.env.DATABASE_URL!,
    });
  }

  async connect() {
    await this.pgClient.connect();
    console.log('✅ Connected to PostgreSQL');
  }

  async disconnect() {
    await this.pgClient.end();
    console.log('✅ Disconnected from PostgreSQL');
  }

  async migrateData() {
    try {
      console.log('🚀 Starting vector database migration from YOUR database...\n');

      // Get professional data
      const professionalResult = await this.pgClient.query(`
        SELECT id, name, email, title, summary, location 
        FROM professionals 
        LIMIT 1
      `);
      
      if (professionalResult.rows.length === 0) {
        throw new Error('No professional data found!');
      }

      const professional = professionalResult.rows[0];
      const professionalId = professional.id;

      console.log(`👤 Found professional: ${professional.name}`);

      // 1. Migrate experiences
      const experiences = await this.pgClient.query(`
        SELECT * FROM experiences WHERE professional_id = $1 ORDER BY start_date DESC
      `, [professionalId]);

      console.log(`💼 Migrating ${experiences.rows.length} work experiences...`);
      for (const exp of experiences.rows) {
        const content = `${exp.position} at ${exp.company} (${exp.start_date.toISOString().split('T')[0]} - ${exp.end_date ? exp.end_date.toISOString().split('T')[0] : 'Present'}): ${exp.description}. Technologies: ${exp.technologies ? exp.technologies.join(', ') : 'N/A'}.`;
        
        await this.vectorIndex.upsert({
          id: `experience-${exp.id}`,
          data: content,
          metadata: {
            type: 'experience',
            company: exp.company,
            position: exp.position,
            id: exp.id
          }
        });
        
        console.log(`  ✅ ${exp.position} at ${exp.company}`);
      }

      // 2. Migrate projects
      const projects = await this.pgClient.query(`
        SELECT * FROM projects WHERE professional_id = $1
      `, [professionalId]);

      console.log(`🚀 Migrating ${projects.rows.length} projects...`);
      for (const project of projects.rows) {
        const content = `Project: ${project.name}. ${project.description}. Status: ${project.status}. Technologies: ${project.technologies ? project.technologies.join(', ') : 'N/A'}.`;
        
        await this.vectorIndex.upsert({
          id: `project-${project.id}`,
          data: content,
          metadata: {
            type: 'project',
            name: project.name,
            status: project.status,
            id: project.id
          }
        });
        
        console.log(`  ✅ ${project.name}`);
      }

      // 3. Migrate skills
      const skills = await this.pgClient.query(`
        SELECT * FROM skills WHERE professional_id = $1 ORDER BY proficiency_level DESC
      `, [professionalId]);

      console.log(`🛠️  Migrating ${skills.rows.length} skills...`);
      for (const skill of skills.rows) {
        const content = `Skill: ${skill.name} (${skill.category}). Proficiency Level: ${skill.proficiency_level}/5. Experience: ${skill.years_experience} years. ${skill.description}`;
        
        await this.vectorIndex.upsert({
          id: `skill-${skill.id}`,
          data: content,
          metadata: {
            type: 'skill',
            name: skill.name,
            category: skill.category,
            proficiency_level: skill.proficiency_level,
            id: skill.id
          }
        });
        
        console.log(`  ✅ ${skill.name} (Level ${skill.proficiency_level})`);
      }

      // 4. Migrate education
      const education = await this.pgClient.query(`
        SELECT * FROM education WHERE professional_id = $1
      `, [professionalId]);

      console.log(`🎓 Migrating ${education.rows.length} education records...`);
      for (const edu of education.rows) {
        const content = `Education: ${edu.degree} in ${edu.field_of_study} from ${edu.institution}. ${edu.description}`;
        
        await this.vectorIndex.upsert({
          id: `education-${edu.id}`,
          data: content,
          metadata: {
            type: 'education',
            institution: edu.institution,
            degree: edu.degree,
            field_of_study: edu.field_of_study,
            id: edu.id
          }
        });
        
        console.log(`  ✅ ${edu.degree} from ${edu.institution}`);
      }

      // 5. Migrate content chunks
      const contentChunks = await this.pgClient.query(`
        SELECT * FROM content_chunks WHERE professional_id = $1
      `, [professionalId]);

      console.log(`📝 Migrating ${contentChunks.rows.length} content chunks...`);
      for (const chunk of contentChunks.rows) {
        await this.vectorIndex.upsert({
          id: `content-${chunk.id}`,
          data: chunk.content,
          metadata: {
            type: 'content',
            title: chunk.title,
            content_type: chunk.content_type,
            id: chunk.id
          }
        });
        
        console.log(`  ✅ ${chunk.title}`);
      }

      console.log('\n✅ Vector database migration completed successfully!');

      // Test search functionality
      console.log('\n🔍 Testing vector search functionality...');
      await this.testSearch();

    } catch (error) {
      console.error('❌ Migration failed:', error);
      throw error;
    }
  }

  async testSearch() {
    const testQueries = [
      "React development experience",
      "AI and machine learning projects", 
      "TypeScript skills",
      "full-stack developer",
      "vector databases",
      "Next.js projects"
    ];

    for (const query of testQueries) {
      try {
        const results = await this.vectorIndex.query({
          data: query,
          topK: 3,
          includeMetadata: true
        });

        console.log(`\n🔍 Query: "${query}"`);
        results.forEach((result, index) => {
          console.log(`  ${index + 1}. ${result.metadata?.type}: ${result.metadata?.name || result.metadata?.title || result.metadata?.position || 'Content'} (Score: ${result.score?.toFixed(3)})`);
        });
        
        // Add delay to avoid rate limits
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (error) {
        console.error(`❌ Search failed for "${query}":`, error);
      }
    }
  }

  async getStats() {
    try {
      const stats = await this.vectorIndex.info();
      console.log('\n📊 Vector Database Statistics:');
      console.log(`  Total vectors: ${stats.vectorCount}`);
      console.log(`  Pending vectors: ${stats.pendingVectorCount}`);
      console.log(`  Dimensions: ${stats.dimension}`);
      console.log(`  Similarity function: ${stats.similarityFunction}`);
    } catch (error) {
      console.error('❌ Failed to get stats:', error);
    }
  }
}

async function main() {
  const migration = new VectorMigration();
  
  try {
    await migration.connect();
    await migration.migrateData();
    await migration.getStats();
  } catch (error) {
    console.error('❌ Migration process failed:', error);
  } finally {
    await migration.disconnect();
  }
}

// Run if this file is executed directly
if (require.main === module) {
  main().catch(console.error);
}