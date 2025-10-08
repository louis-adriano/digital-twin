import { config } from 'dotenv';
import pg from 'pg';

// Load environment variables
config({ path: '.env.local' });

const { Client } = pg;

// Updated professional data from digital-twin-louis.json
const professionalData = {
  personal: {
    name: "Louis Adriano",
    email: "louisadriano00@gmail.com",
    phone: "+61451220381",
    title: "Full-stack Developer",
    summary: "Full-stack Developer with 1+ years of experience building scalable web applications using Next.js, TypeScript, and React. Delivered AI-powered platforms with 90%+ search accuracy and corporate websites achieving 90+ PageSpeed Insights score. Experienced in vector databases, semantic search, API integration, and cloud deployment.",
    location: "Sydney, New South Wales, Australia",
    linkedin_url: "https://linkedin.com/in/louisadriano",
    github_url: "https://github.com/louis-adriano",
    website_url: "https://github.com/louis-adriano"
  },
  experiences: [
    {
      company: "TLA IT",
      position: "Full-stack Developer",
      start_date: "2025-05-01",
      end_date: null,
      description: "Developed responsive corporate website using Next.js 14, TypeScript, and Tailwind CSS with server-side rendering. Built 8+ custom React components with intersection observer animations and mobile-responsive UI using shadcn/ui design system. Achieved 90+ PageSpeed Insights score and implemented comprehensive SEO optimization with meta tags, Open Graph protocols, and structured data markup. Integrated RESTful API endpoints with secure authentication and comprehensive error handling, streamlining data flow between front-end and back-end services.",
      location: "Sydney, New South Wales, Australia · Hybrid",
      achievements: [
        "Achieved 90+ PageSpeed Insights score with optimized performance",
        "Built 8+ custom React components with advanced animations",
        "Implemented comprehensive SEO optimization for improved search visibility",
        "Integrated RESTful APIs with secure authentication"
      ],
      technologies: ["Next.js 14", "TypeScript", "React", "Tailwind CSS", "shadcn/ui", "Server-side Rendering (SSR)", "RESTful APIs", "SEO Optimization", "Responsive Design"]
    },
    {
      company: "AusBiz Consulting",
      position: "AI Data Analyst Intern",
      start_date: "2025-08-01",
      end_date: null,
      description: "Architected 'About To Eat' AI-powered food discovery platform using Next.js 14, TypeScript, Upstash Vector database with 1024-dimensional custom embeddings, and integrated Groq SDK with Llama 3.1 models for AI enhancement. Built admin dashboard with PostgreSQL and Clerk authentication. Achieved 90%+ search relevance accuracy using hybrid scoring (30% vector + 70% text similarity), managing 75+ global dishes across 15+ cuisine types with sub-second response times.",
      location: "Sydney, New South Wales, Australia · Hybrid",
      achievements: [
        "Achieved 90%+ search relevance accuracy with hybrid scoring algorithm",
        "Managed 75+ global dishes across 15+ cuisine types",
        "Deployed on Vercel with sub-second response times",
        "Built admin dashboard with real-time vector database synchronization"
      ],
      technologies: ["Next.js 14", "TypeScript", "Upstash Vector Database", "Vector Embeddings", "Semantic Search", "Groq SDK", "Llama 3.1 AI Models", "PostgreSQL", "Clerk Authentication", "Vercel Deployment", "Streaming APIs"]
    },
    {
      company: "AusBiz Consulting",
      position: "Full-stack Developer Intern",
      start_date: "2024-11-01",
      end_date: "2025-02-28",
      description: "Built healthcare referral management system using Next.js 15, TypeScript, and Tailwind CSS with multi-step forms, React Hook Form, Zod validation, and Google Maps API autocomplete. Implemented NextAuth.js with Google OAuth and real-time notification system. Reduced manual processing time by 40% and improved data accuracy with real-time validation. Delivered responsive mobile-friendly UI with seamless user experience.",
      location: "Sydney, New South Wales, Australia · Hybrid",
      achievements: [
        "Reduced manual processing time by 40%",
        "Improved data accuracy with real-time validation",
        "Reduced login time by 40% with Google OAuth",
        "Improved location-based service accuracy by 25%"
      ],
      technologies: ["Next.js 15", "Node.js", "TypeScript", "React Hook Form", "Zod", "NextAuth.js", "Google OAuth", "Google Maps API", "Vercel", "Tailwind CSS"]
    }
  ],
  skills: [
    // Programming Languages (converted to 1-5 scale)
    { name: "TypeScript", category: "Programming Languages", proficiency_level: 4, years_experience: 1.5, description: "Advanced proficiency in TypeScript with Next.js, React, and Node.js" },
    { name: "JavaScript", category: "Programming Languages", proficiency_level: 5, years_experience: 2, description: "Advanced proficiency in JavaScript with React, Node.js, and Next.js" },
    { name: "Python", category: "Programming Languages", proficiency_level: 4, years_experience: 2, description: "Intermediate proficiency in Python for data analysis and scripting" },
    { name: "SQL", category: "Programming Languages", proficiency_level: 4, years_experience: 2, description: "Intermediate proficiency in SQL for database design and query optimization" },
    { name: "Java", category: "Programming Languages", proficiency_level: 3, years_experience: 1, description: "Intermediate proficiency in Java" },
    { name: "PHP", category: "Programming Languages", proficiency_level: 3, years_experience: 1, description: "Intermediate proficiency in PHP" },
    { name: "HTML/CSS", category: "Programming Languages", proficiency_level: 5, years_experience: 3, description: "Advanced proficiency in HTML and CSS" },

    // Frameworks & Libraries
    { name: "Next.js 14/15", category: "Frameworks & Libraries", proficiency_level: 5, years_experience: 1.5, description: "Expert in Next.js with server-side rendering and modern patterns" },
    { name: "React", category: "Frameworks & Libraries", proficiency_level: 5, years_experience: 2, description: "Advanced React development with hooks and modern patterns" },
    { name: "React Hook Form", category: "Frameworks & Libraries", proficiency_level: 4, years_experience: 1, description: "Form management with validation using React Hook Form and Zod" },
    { name: "Tailwind CSS", category: "Frameworks & Libraries", proficiency_level: 5, years_experience: 1.5, description: "Expert in utility-first CSS with Tailwind" },
    { name: "shadcn/ui", category: "Frameworks & Libraries", proficiency_level: 4, years_experience: 1, description: "Component library integration and customization" },
    { name: "Node.js", category: "Frameworks & Libraries", proficiency_level: 4, years_experience: 1.5, description: "Backend development with Node.js" },

    // Databases
    { name: "PostgreSQL", category: "Databases", proficiency_level: 4, years_experience: 1.5, description: "Relational database design and management" },
    { name: "Upstash Vector Database", category: "Databases", proficiency_level: 4, years_experience: 1, description: "Vector database for semantic search and embeddings" },

    // Cloud & Deployment
    { name: "Vercel", category: "Cloud Platforms", proficiency_level: 4, years_experience: 1.5, description: "Cloud deployment and edge computing" },
    { name: "AWS", category: "Cloud Platforms", proficiency_level: 3, years_experience: 0.5, description: "Basic familiarity with AWS services" },

    // AI & ML
    { name: "RAG Systems", category: "AI & Machine Learning", proficiency_level: 4, years_experience: 1, description: "Retrieval Augmented Generation architecture" },
    { name: "Vector Embeddings", category: "AI & Machine Learning", proficiency_level: 4, years_experience: 1, description: "1024-dimensional custom embeddings for semantic search" },
    { name: "Semantic Search", category: "AI & Machine Learning", proficiency_level: 4, years_experience: 1, description: "Hybrid scoring algorithms for search relevance" },
    { name: "Groq SDK", category: "AI & Machine Learning", proficiency_level: 4, years_experience: 1, description: "AI integration with Groq SDK and Llama models" },
    { name: "Llama 3.1", category: "AI & Machine Learning", proficiency_level: 4, years_experience: 1, description: "LLM integration for conversational AI" },

    // Tools & Platforms
    { name: "Git/GitHub", category: "Tools & Platforms", proficiency_level: 4, years_experience: 2, description: "Version control and collaboration" },
    { name: "Jira", category: "Tools & Platforms", proficiency_level: 4, years_experience: 1, description: "Project management and issue tracking" },
    { name: "Slack", category: "Tools & Platforms", proficiency_level: 4, years_experience: 1.5, description: "Team communication and collaboration" },

    // Concepts
    { name: "SEO Optimization", category: "Concepts", proficiency_level: 4, years_experience: 1, description: "Search engine optimization and performance" },
    { name: "Server-side Rendering", category: "Concepts", proficiency_level: 5, years_experience: 1.5, description: "SSR with Next.js for improved performance" },
    { name: "Responsive Design", category: "Concepts", proficiency_level: 5, years_experience: 2, description: "Mobile-first responsive web design" },
    { name: "Authentication & Authorization", category: "Concepts", proficiency_level: 4, years_experience: 1, description: "OAuth, JWT, and secure authentication" },
    { name: "API Integration", category: "Concepts", proficiency_level: 4, years_experience: 1.5, description: "RESTful APIs and third-party integrations" },
    { name: "Performance Optimization", category: "Concepts", proficiency_level: 4, years_experience: 1, description: "Web performance and PageSpeed optimization" }
  ],
  projects: [
    {
      name: "About To Eat - AI-Powered Food Discovery Platform",
      description: "Intelligent food discovery platform using advanced semantic RAG search, enabling users to find dishes through natural language descriptions with cultural context. Built with Next.js 14, TypeScript, Upstash Vector Database, Groq SDK, and Llama 3.1. Achieved 90%+ search relevance accuracy with 1024-dimensional vector embeddings and hybrid scoring algorithm.",
      start_date: "2025-08-01",
      end_date: "2025-09-30",
      status: "Completed",
      technologies: ["Next.js 14", "TypeScript", "Upstash Vector Database", "Groq SDK", "Llama 3.1", "PostgreSQL", "Clerk Authentication", "Vercel"],
      github_url: "https://github.com/louis-adriano/about-to-eat-rag-mcp",
      live_url: null,
      highlights: [
        "90%+ search relevance accuracy with hybrid scoring (30% vector + 70% text similarity)",
        "75+ global dishes across 15+ cuisine types",
        "Sub-second response times with edge computing",
        "Real-time AI query enhancement and cultural context generation",
        "Admin dashboard with real-time vector database synchronization"
      ]
    },
    {
      name: "Healthcare Referral Management System",
      description: "Secure web-based system to streamline patient referral creation, tracking, and management. Built with Next.js 15, TypeScript, Tailwind CSS, React Hook Form, Zod validation, NextAuth.js, and Google Maps API. Reduced manual processing time by 40% with improved data accuracy and seamless mobile experience.",
      start_date: "2024-11-01",
      end_date: "2025-02-28",
      status: "Completed",
      technologies: ["Next.js 15", "TypeScript", "Tailwind CSS", "React Hook Form", "Zod", "NextAuth.js", "Google OAuth", "Google Maps API"],
      github_url: "https://github.com/louis-adriano/healthcare-referral-management-system",
      live_url: null,
      highlights: [
        "40% reduction in manual processing time",
        "Multi-step referral forms with real-time validation",
        "Google Maps API autocomplete for location accuracy",
        "Management dashboard with filtering and search",
        "Real-time notification system",
        "Responsive mobile-friendly UI"
      ]
    },
    {
      name: "TLA IT Corporate Website",
      description: "Modern, high-performance corporate website with optimal performance and SEO. Built with Next.js 14, TypeScript, Tailwind CSS, and shadcn/ui design system. Achieved 90+ PageSpeed Insights score with comprehensive SEO optimization.",
      start_date: "2025-05-01",
      end_date: null,
      status: "Active",
      technologies: ["Next.js 14", "TypeScript", "React", "Tailwind CSS", "shadcn/ui", "Server-side Rendering"],
      github_url: null,
      live_url: null,
      highlights: [
        "90+ PageSpeed Insights score",
        "8+ custom React components with animations",
        "Comprehensive SEO with meta tags and Open Graph protocols",
        "Mobile-responsive UI with intersection observer animations",
        "RESTful API integration with secure authentication"
      ]
    }
  ],
  education: [
    {
      institution: "Victoria University",
      degree: "Bachelor of Information Technology",
      field_of_study: "Web and Mobile Application Development (Minor: ICT Management)",
      start_date: "2024-09-01",
      end_date: "2026-10-31",
      description: "Specializing in Web and Mobile Application Development with a minor in ICT Management. Block Star Award winner for highest GPA in Software Engineering. Expected graduation: October 2026."
    },
    {
      institution: "Victoria University",
      degree: "Diploma of Information Technology",
      field_of_study: "Information Technology",
      start_date: "2022-09-01",
      end_date: "2024-09-30",
      description: "Completed Diploma with 3.75/4.0 GPA. Key learnings: Python programming, web development (HTML, CSS, WordPress, Bootstrap), database management (SQL, PhpMyAdmin), Linux Bash Shell, OS architectures, web application/server management with PHP, IT project management."
    }
  ]
};

async function main() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    console.log('📊 Connecting to database...');
    await client.connect();
    console.log('✅ Connected to database');

    // Clear existing data
    console.log('\n🗑️  Clearing existing data...');
    await client.query('DELETE FROM projects');
    await client.query('DELETE FROM skills');
    await client.query('DELETE FROM education');
    await client.query('DELETE FROM experiences');
    await client.query('DELETE FROM professionals');
    console.log('✅ Cleared existing data');

    // Insert professional profile
    console.log('\n👤 Inserting professional profile...');
    const profileResult = await client.query(
      `INSERT INTO professionals (name, email, phone, title, summary, location, linkedin_url, github_url, website_url)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING id`,
      [
        professionalData.personal.name,
        professionalData.personal.email,
        professionalData.personal.phone,
        professionalData.personal.title,
        professionalData.personal.summary,
        professionalData.personal.location,
        professionalData.personal.linkedin_url,
        professionalData.personal.github_url,
        professionalData.personal.website_url
      ]
    );
    const professionalId = profileResult.rows[0].id;
    console.log(`✅ Created profile with ID: ${professionalId}`);

    // Insert experiences
    console.log('\n💼 Inserting work experiences...');
    for (const exp of professionalData.experiences) {
      await client.query(
        `INSERT INTO experiences (professional_id, company, position, location, start_date, end_date, description, technologies)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [
          professionalId,
          exp.company,
          exp.position,
          exp.location,
          exp.start_date,
          exp.end_date,
          exp.description,
          exp.technologies
        ]
      );
      console.log(`  ✓ Added: ${exp.position} at ${exp.company}`);
    }
    console.log(`✅ Inserted ${professionalData.experiences.length} experiences`);

    // Insert skills
    console.log('\n🎯 Inserting skills...');
    for (const skill of professionalData.skills) {
      await client.query(
        `INSERT INTO skills (professional_id, name, category, proficiency_level, years_experience, description)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [
          professionalId,
          skill.name,
          skill.category,
          skill.proficiency_level,
          skill.years_experience,
          skill.description
        ]
      );
    }
    console.log(`✅ Inserted ${professionalData.skills.length} skills`);

    // Insert projects
    console.log('\n🚀 Inserting projects...');
    for (const project of professionalData.projects) {
      await client.query(
        `INSERT INTO projects (professional_id, name, description, start_date, end_date, status, technologies, github_url, live_url, highlights)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
        [
          professionalId,
          project.name,
          project.description,
          project.start_date,
          project.end_date,
          project.status,
          project.technologies,
          project.github_url,
          project.live_url,
          project.highlights
        ]
      );
      console.log(`  ✓ Added: ${project.name}`);
    }
    console.log(`✅ Inserted ${professionalData.projects.length} projects`);

    // Insert education
    console.log('\n🎓 Inserting education...');
    for (const edu of professionalData.education) {
      await client.query(
        `INSERT INTO education (professional_id, institution, degree, field_of_study, start_date, end_date, description)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [
          professionalId,
          edu.institution,
          edu.degree,
          edu.field_of_study,
          edu.start_date,
          edu.end_date,
          edu.description
        ]
      );
      console.log(`  ✓ Added: ${edu.degree} from ${edu.institution}`);
    }
    console.log(`✅ Inserted ${professionalData.education.length} education entries`);

    console.log('\n🎉 Database population completed successfully!');

  } catch (error) {
    console.error('❌ Error populating database:', error);
    throw error;
  } finally {
    await client.end();
    console.log('\n👋 Database connection closed');
  }
}

main().catch(console.error);
