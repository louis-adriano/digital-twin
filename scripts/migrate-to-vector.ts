import { config } from 'dotenv';
import pg from 'pg';
import { Index } from '@upstash/vector';

// Load environment variables
config({ path: '.env.local' });

const { Client } = pg;

// Initialize Upstash Vector client
const index = new Index({
  url: process.env.UPSTASH_VECTOR_REST_URL!,
  token: process.env.UPSTASH_VECTOR_REST_TOKEN!,
});

interface VectorData {
  id: string;
  content: string;
  metadata: Record<string, any>;
}

async function main() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    console.log('🔗 Connecting to PostgreSQL...');
    await client.connect();
    console.log('✅ Connected to PostgreSQL');

    console.log('🧹 Clearing existing vector data...');
    await index.reset();
    console.log('✅ Cleared vector database');

    const vectorData: VectorData[] = [];

    // 1. Migrate Professional Profile
    console.log('\n👤 Processing professional profile...');
    const profileResult = await client.query(`
      SELECT * FROM professionals LIMIT 1
    `);
    
    if (profileResult.rows.length > 0) {
      const profile = profileResult.rows[0];
      vectorData.push({
        id: `profile_${profile.id}`,
        content: `${profile.name} is a ${profile.title} located in ${profile.location}. ${profile.summary} Contact: ${profile.email}${profile.linkedin_url ? `, LinkedIn: ${profile.linkedin_url}` : ''}${profile.github_url ? `, GitHub: ${profile.github_url}` : ''}`,
        metadata: {
          type: 'profile',
          name: profile.name,
          title: profile.title,
          email: profile.email,
          location: profile.location,
          linkedin_url: profile.linkedin_url,
          github_url: profile.github_url,
        }
      });
      console.log(`  ✓ Added profile for ${profile.name}`);
    }

    // 2. Migrate Experiences
    console.log('\n💼 Processing work experiences...');
    const experiencesResult = await client.query(`
      SELECT * FROM experiences ORDER BY start_date DESC
    `);
    
    for (const exp of experiencesResult.rows) {
      const technologies = Array.isArray(exp.technologies) ? exp.technologies.join(', ') : exp.technologies;
      const duration = exp.end_date 
        ? `from ${exp.start_date} to ${exp.end_date}`
        : `from ${exp.start_date} to present`;
      
      vectorData.push({
        id: `experience_${exp.id}`,
        content: `Work experience: ${exp.position} at ${exp.company} (${duration}) in ${exp.location}. ${exp.description} Technologies used: ${technologies}`,
        metadata: {
          type: 'experience',
          company: exp.company,
          position: exp.position,
          location: exp.location,
          start_date: exp.start_date,
          end_date: exp.end_date,
          technologies: exp.technologies
        }
      });
      console.log(`  ✓ Added ${exp.position} at ${exp.company}`);
    }

    // 3. Migrate Skills
    console.log('\n🎯 Processing skills...');
    const skillsResult = await client.query(`
      SELECT * FROM skills ORDER BY category, proficiency_level DESC
    `);
    
    for (const skill of skillsResult.rows) {
      vectorData.push({
        id: `skill_${skill.id}`,
        content: `Skill: ${skill.name} in ${skill.category} category. Proficiency level: ${skill.proficiency_level}/5, ${skill.years_experience} years of experience. ${skill.description}`,
        metadata: {
          type: 'skill',
          name: skill.name,
          category: skill.category,
          proficiency_level: skill.proficiency_level,
          years_experience: skill.years_experience
        }
      });
      console.log(`  ✓ Added ${skill.name} (${skill.category})`);
    }

    // 4. Migrate Projects
    console.log('\n🚀 Processing projects...');
    const projectsResult = await client.query(`
      SELECT * FROM projects ORDER BY start_date DESC
    `);
    
    for (const project of projectsResult.rows) {
      const technologies = Array.isArray(project.technologies) ? project.technologies.join(', ') : project.technologies;
      const highlights = Array.isArray(project.highlights) ? project.highlights.join('. ') : project.highlights;
      const duration = project.end_date 
        ? `from ${project.start_date} to ${project.end_date}`
        : `started ${project.start_date}, currently ${project.status}`;
      
      vectorData.push({
        id: `project_${project.id}`,
        content: `Project: ${project.name} (${duration}). ${project.description} Technologies: ${technologies}. Key highlights: ${highlights}${project.github_url ? ` GitHub: ${project.github_url}` : ''}${project.live_url ? ` Live demo: ${project.live_url}` : ''}`,
        metadata: {
          type: 'project',
          name: project.name,
          status: project.status,
          start_date: project.start_date,
          end_date: project.end_date,
          technologies: project.technologies,
          github_url: project.github_url,
          live_url: project.live_url
        }
      });
      console.log(`  ✓ Added ${project.name}`);
    }

    // 5. Migrate Education
    console.log('\n🎓 Processing education...');
    const educationResult = await client.query(`
      SELECT * FROM education ORDER BY start_date DESC
    `);
    
    for (const edu of educationResult.rows) {
      const duration = edu.end_date 
        ? `from ${edu.start_date} to ${edu.end_date}`
        : `started ${edu.start_date}`;
      
      vectorData.push({
        id: `education_${edu.id}`,
        content: `Education: ${edu.degree} in ${edu.field_of_study} from ${edu.institution} (${duration}). ${edu.description}`,
        metadata: {
          type: 'education',
          institution: edu.institution,
          degree: edu.degree,
          field_of_study: edu.field_of_study,
          start_date: edu.start_date,
          end_date: edu.end_date
        }
      });
      console.log(`  ✓ Added ${edu.degree} from ${edu.institution}`);
    }

    // 6. Upload to Vector Database
    console.log(`\n🔍 Uploading ${vectorData.length} items to vector database...`);
    
    // Upload in batches to avoid rate limits
    const batchSize = 10;
    for (let i = 0; i < vectorData.length; i += batchSize) {
      const batch = vectorData.slice(i, i + batchSize);
      
      await Promise.all(batch.map(async (item) => {
        await index.upsert({
          id: item.id,
          data: item.content,
          metadata: item.metadata
        });
      }));
      
      console.log(`  ✓ Uploaded batch ${Math.ceil((i + 1) / batchSize)} of ${Math.ceil(vectorData.length / batchSize)}`);
      
      // Small delay to avoid rate limits
      if (i + batchSize < vectorData.length) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    console.log('\n✨ Vector database migration completed successfully!');
    console.log(`📊 Summary:`);
    console.log(`   • Total items migrated: ${vectorData.length}`);
    console.log(`   • Profile: 1`);
    console.log(`   • Experiences: ${experiencesResult.rows.length}`);
    console.log(`   • Skills: ${skillsResult.rows.length}`);
    console.log(`   • Projects: ${projectsResult.rows.length}`);
    console.log(`   • Education: ${educationResult.rows.length}`);
    console.log('\n🤖 Your AI assistant can now access all your professional information!');

  } catch (error) {
    console.error('❌ Error during migration:', error);
    throw error;
  } finally {
    await client.end();
    console.log('\n👋 Database connection closed');
  }
}

main().catch(console.error);