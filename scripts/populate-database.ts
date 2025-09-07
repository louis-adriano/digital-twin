import { config } from 'dotenv';
import pg from 'pg';

// Load environment variables
config({ path: '.env.local' });

const { Client } = pg;

// Your professional data
const professionalData = {
  personal: {
    name: "Louis Adriano",
    email: "louisadriano00@gmail.com",
    phone: "+61123456789",
    title: "Full-stack Developer & AI Data Analyst",
    summary: "Full-stack Developer with 1 year of experience specializing in responsive web development using Next.js, TypeScript, and Tailwind CSS. Developed custom React components, leading to an optimized 90+ PageSpeed Insights score through advanced SEO strategies. Currently expanding into AI and machine learning with hands-on experience in vector databases, semantic search, and RAG systems. Seeking to leverage technical acumen and innovative design skills in a challenging environment to drive user engagement and streamline web solutions.",
    location: "Australia",
    linkedin_url: "https://linkedin.com/in/louis-adriano",
    github_url: "https://github.com/louisadriano",
    website_url: "https://louisadriano.dev"
  },
  experiences: [
    {
      company: "TLA IT",
      position: "Full-stack Developer",
      start_date: "2025-05-01",
      end_date: null,
      description: "Developing responsive web applications using Next.js, TypeScript, and Tailwind CSS",
      location: "Remote",
      achievements: [
        "Achieved 90+ PageSpeed Insights score through advanced SEO optimization",
        "Developed custom React components for improved user experience",
        "Implemented responsive design patterns for mobile-first development"
      ],
      technologies: ["Next.js", "TypeScript", "Tailwind CSS", "React", "JavaScript", "HTML", "CSS"]
    },
    {
      company: "AusBiz Consulting",
      position: "AI Data Analyst Intern",
      start_date: "2025-08-01",
      end_date: null,
      description: "Working on AI automation projects and data analysis using machine learning techniques",
      location: "Australia",
      achievements: [
        "Developed AI automation workflows for business processes",
        "Implemented data analysis pipelines using Python and machine learning",
        "Gained hands-on experience with vector databases and semantic search"
      ],
      technologies: ["Python", "Machine Learning", "Data Analysis", "AI Automation", "Vector Databases"]
    }
  ],
  projects: [
    {
      name: "AI-Powered Digital Twin System",
      description: "Comprehensive digital twin system with PostgreSQL database, vector embeddings, and RAG-powered chat functionality. Built with Next.js, TypeScript, and integrated with Upstash Vector database for semantic search capabilities.",
      start_date: "2025-09-01",
      end_date: null,
      status: "in_progress",
      technologies: ["Next.js", "TypeScript", "PostgreSQL", "Vector Databases", "RAG", "AI", "Upstash"],
      github_url: "https://github.com/louisadriano/digital-twin",
      highlights: [
        "Designed comprehensive PostgreSQL schema for professional data",
        "Implemented vector embeddings for semantic search",
        "Built RAG system for intelligent chat interactions",
        "Integrated with Upstash Vector database for scalable vector operations"
      ]
    }
  ],
  skills: [
    {
      name: "JavaScript",
      category: "Programming Languages",
      proficiency_level: 4,
      years_experience: 1.5,
      description: "Extensive experience with modern JavaScript ES6+ features and frameworks"
    },
    {
      name: "TypeScript",
      category: "Programming Languages", 
      proficiency_level: 4,
      years_experience: 1.0,
      description: "Strong typing and advanced TypeScript patterns for scalable applications"
    },
    {
      name: "Next.js",
      category: "Frameworks",
      proficiency_level: 4,
      years_experience: 1.0,
      description: "Full-stack React framework with SSR, API routes, and modern web development"
    },
    {
      name: "React",
      category: "Frameworks",
      proficiency_level: 4,
      years_experience: 1.5,
      description: "Component-based UI development with hooks, context, and modern patterns"
    },
    {
      name: "Tailwind CSS",
      category: "Styling",
      proficiency_level: 4,
      years_experience: 1.0,
      description: "Utility-first CSS framework for rapid UI development and responsive design"
    },
    {
      name: "Python",
      category: "Programming Languages",
      proficiency_level: 3,
      years_experience: 0.5,
      description: "Data analysis, machine learning, and AI automation projects"
    },
    {
      name: "Machine Learning",
      category: "AI/ML",
      proficiency_level: 3,
      years_experience: 0.5,
      description: "Vector databases, semantic search, and RAG systems implementation"
    },
    {
      name: "PostgreSQL",
      category: "Databases",
      proficiency_level: 3,
      years_experience: 0.5,
      description: "Relational database design, queries, and optimization"
    },
    {
      name: "Vector Databases",
      category: "AI/ML",
      proficiency_level: 3,
      years_experience: 0.3,
      description: "Upstash Vector, embeddings, and semantic search implementation"
    }
  ],
  education: [
    {
      institution: "Self-Directed Learning",
      degree: "Continuous Education",
      field_of_study: "Full-stack Development & AI",
      start_date: "2024-01-01",
      end_date: null,
      description: "Ongoing self-directed learning in web development, AI, and machine learning through practical projects and industry best practices",
      achievements: [
        "Completed numerous full-stack projects",
        "Gained expertise in modern web development stack",
        "Developed AI and machine learning skills through hands-on projects"
      ]
    }
  ]
};

async function populateDatabase() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    console.log('📊 Populating your database with professional data...');
    await client.connect();
    
    // Insert professional profile
    console.log('👤 Inserting professional profile...');
    const professionalResult = await client.query(`
      INSERT INTO professionals (name, email, phone, title, summary, location, linkedin_url, github_url, website_url)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING id
    `, [
      professionalData.personal.name,
      professionalData.personal.email,
      professionalData.personal.phone,
      professionalData.personal.title,
      professionalData.personal.summary,
      professionalData.personal.location,
      professionalData.personal.linkedin_url,
      professionalData.personal.github_url,
      professionalData.personal.website_url
    ]);
    
    const professionalId = professionalResult.rows[0].id;
    console.log(`✅ Professional profile created with ID: ${professionalId}`);
    
    // Insert experiences
    console.log('💼 Inserting work experiences...');
    for (const exp of professionalData.experiences) {
      await client.query(`
        INSERT INTO experiences (professional_id, company, position, start_date, end_date, description, location, achievements, technologies)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      `, [
        professionalId,
        exp.company,
        exp.position,
        exp.start_date,
        exp.end_date,
        exp.description,
        exp.location,
        exp.achievements,
        exp.technologies
      ]);
      console.log(`  ✅ Added experience: ${exp.position} at ${exp.company}`);
    }
    
    // Insert projects
    console.log('🚀 Inserting projects...');
    for (const project of professionalData.projects) {
      await client.query(`
        INSERT INTO projects (professional_id, name, description, start_date, end_date, status, technologies, github_url, highlights)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      `, [
        professionalId,
        project.name,
        project.description,
        project.start_date,
        project.end_date,
        project.status,
        project.technologies,
        project.github_url,
        project.highlights
      ]);
      console.log(`  ✅ Added project: ${project.name}`);
    }
    
    // Insert skills
    console.log('🛠️  Inserting skills...');
    for (const skill of professionalData.skills) {
      await client.query(`
        INSERT INTO skills (professional_id, name, category, proficiency_level, years_experience, description)
        VALUES ($1, $2, $3, $4, $5, $6)
      `, [
        professionalId,
        skill.name,
        skill.category,
        skill.proficiency_level,
        skill.years_experience,
        skill.description
      ]);
      console.log(`  ✅ Added skill: ${skill.name} (Level ${skill.proficiency_level})`);
    }
    
    // Insert education
    console.log('🎓 Inserting education...');
    for (const edu of professionalData.education) {
      await client.query(`
        INSERT INTO education (professional_id, institution, degree, field_of_study, start_date, end_date, description, achievements)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      `, [
        professionalId,
        edu.institution,
        edu.degree,
        edu.field_of_study,
        edu.start_date,
        edu.end_date,
        edu.description,
        edu.achievements
      ]);
      console.log(`  ✅ Added education: ${edu.degree} from ${edu.institution}`);
    }
    
    // Insert content chunks for RAG
    console.log('📝 Creating content chunks for RAG system...');
    
    // Professional summary chunk
    await client.query(`
      INSERT INTO content_chunks (professional_id, title, content, content_type, source_table, source_id)
      VALUES ($1, $2, $3, $4, $5, $6)
    `, [
      professionalId,
      "Professional Summary",
      `${professionalData.personal.name} - ${professionalData.personal.title}. ${professionalData.personal.summary}`,
      "profile",
      "professionals",
      professionalId
    ]);
    
    // Experience chunk
    const experienceContent = professionalData.experiences.map(exp => 
      `${exp.position} at ${exp.company} (${exp.start_date} - ${exp.end_date || 'Present'}): ${exp.description}. Technologies: ${exp.technologies.join(', ')}.`
    ).join('\n\n');
    
    await client.query(`
      INSERT INTO content_chunks (professional_id, title, content, content_type, source_table)
      VALUES ($1, $2, $3, $4, $5)
    `, [
      professionalId,
      "Work Experience",
      experienceContent,
      "experience",
      "experiences"
    ]);
    
    console.log('✅ Database population completed successfully!');
    
    // Verify the data
    const counts = await client.query(`
      SELECT 
        (SELECT COUNT(*) FROM professionals) as professionals,
        (SELECT COUNT(*) FROM experiences) as experiences,
        (SELECT COUNT(*) FROM projects) as projects,
        (SELECT COUNT(*) FROM skills) as skills,
        (SELECT COUNT(*) FROM education) as education,
        (SELECT COUNT(*) FROM content_chunks) as content_chunks
    `);
    
    console.log('\n📊 Data Summary:');
    const summary = counts.rows[0];
    console.log(`  👤 Professionals: ${summary.professionals}`);
    console.log(`  💼 Experiences: ${summary.experiences}`);
    console.log(`  🚀 Projects: ${summary.projects}`);
    console.log(`  🛠️  Skills: ${summary.skills}`);
    console.log(`  🎓 Education: ${summary.education}`);
    console.log(`  📝 Content Chunks: ${summary.content_chunks}`);
    
  } catch (error) {
    console.error('❌ Database population failed:', error);
  } finally {
    await client.end();
  }
}

populateDatabase().catch(console.error);