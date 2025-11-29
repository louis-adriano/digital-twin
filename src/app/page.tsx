import { ProfileData } from '../types/profile';
import FloatingChat from '../components/FloatingChat';
import Link from 'next/link';
import { ConnectButton } from '../components/ConnectButton';
import { Client } from 'pg';
import FadeIn from '../components/animations/FadeIn';
import StaggerContainer from '../components/animations/StaggerContainer';
import StaggerItem from '../components/animations/StaggerItem';
import MobileBurgerMenu from '../components/MobileBurgerMenu';
import SkipToContent from '../components/SkipToContent';

// Format date helper
const formatDate = (dateString: string | null) => {
  if (!dateString) return 'Present';
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short'
  });
};

// Fetch profile data directly from database
async function getProfileData(): Promise<ProfileData | null> {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    await client.connect();
    
    const profileResult = await client.query('SELECT * FROM professionals LIMIT 1');
    if (profileResult.rows.length === 0) return null;
    
    const profile = profileResult.rows[0];
    
    const [experiencesResult, skillsResult, projectsResult, educationResult, thoughtsResult] = await Promise.all([
      client.query(
        `SELECT * FROM experiences 
         WHERE professional_id = $1 
         ORDER BY CASE WHEN end_date IS NULL THEN 0 ELSE 1 END, start_date DESC`,
        [profile.id]
      ),
      client.query('SELECT * FROM skills WHERE professional_id = $1 ORDER BY category, name', [profile.id]),
      client.query(
        `SELECT * FROM projects 
         WHERE professional_id = $1 
         ORDER BY CASE WHEN end_date IS NULL THEN 0 ELSE 1 END, start_date DESC`,
        [profile.id]
      ),
      client.query('SELECT * FROM education WHERE professional_id = $1 ORDER BY start_date DESC', [profile.id]),
      client.query(
        `SELECT * FROM thoughts 
         WHERE professional_id = $1 
         ORDER BY published_date DESC LIMIT 3`,
        [profile.id]
      )
    ]);

    return {
      profile: {
        name: profile.name,
        email: profile.email,
        title: profile.title,
        location: profile.location,
        bio: profile.bio,
        summary: profile.summary,
        portfolio_summary: profile.portfolio_summary,
        hero_subtitle: profile.hero_subtitle,
        about_greeting: profile.about_greeting,
        linkedin_url: profile.linkedin_url,
        github_url: profile.github_url,
        website_url: profile.website_url,
        cv_filename: profile.cv_filename,
      },
      experiences: experiencesResult.rows.map(exp => ({
        id: exp.id,
        title: exp.position,
        company: exp.company,
        location: exp.location,
        start_date: exp.start_date,
        end_date: exp.end_date,
        description: exp.description,
      })),
      skills: skillsResult.rows,
      projects: projectsResult.rows.map(proj => ({
        id: proj.id,
        name: proj.name,
        description: proj.description,
        technologies: proj.technologies || [],
        github_url: proj.github_url,
        live_url: proj.live_url,
        start_date: proj.start_date,
        end_date: proj.end_date,
      })),
      education: educationResult.rows.map(edu => ({
        id: edu.id,
        institution: edu.institution,
        degree: edu.degree,
        field_of_study: edu.field_of_study,
        start_date: edu.start_date,
        end_date: edu.end_date,
        description: edu.description,
      })),
      thoughts: thoughtsResult.rows.map(thought => ({
        id: thought.id,
        title: thought.title,
        excerpt: thought.excerpt,
        linkedin_url: thought.linkedin_url,
        published_date: thought.published_date,
        is_featured: thought.is_featured,
      })),
    };
  } catch (error) {
    console.error('Error fetching profile:', error);
    return null;
  } finally {
    await client.end();
  }
}

export default async function Home() {
  const profileData = await getProfileData();

  if (!profileData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="text-xl text-destructive mb-4 font-serif">Error Loading Profile</div>
          <div className="text-muted-foreground mb-4">Unable to load profile data</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <SkipToContent />
      {/* Fixed Navigation */}
      <nav aria-label="Main navigation" className="fixed top-0 w-full px-6 sm:px-8 lg:px-16 py-5 sm:py-6 lg:py-8 z-50 bg-gradient-to-b from-[#f5f1e8]/98 to-[#f5f1e8]/0">
        <div className="flex justify-between items-center">
          <Link href="/" className="font-serif text-xl sm:text-2xl italic font-light tracking-wide text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded">
            {profileData?.profile.name || "Louis Adriano"}
          </Link>

          <ul className="hidden lg:flex gap-12 absolute left-1/2 transform -translate-x-1/2">
            <li>
              <Link href="/" className="font-sans text-[0.95rem] font-normal text-primary">
                Overview
              </Link>
            </li>
            <li>
              <Link href="/portfolio" className="font-sans text-[0.95rem] font-normal text-foreground hover:text-primary transition-colors">
                Portfolio
              </Link>
            </li>
            <li>
              <Link href="/contact" className="font-sans text-[0.95rem] font-normal text-foreground hover:text-primary transition-colors">
                Contact
              </Link>
            </li>
          </ul>

          {/* Desktop CV Button */}
          <a
            href="/api/cv/download"
            target="_blank"
            rel="noopener noreferrer"
            className="hidden lg:block bg-primary text-primary-foreground px-8 py-3 rounded-[30px] font-medium text-[0.95rem] transition-all hover:bg-[#3d6149] hover:-translate-y-0.5"
          >
            Download CV
          </a>

          {/* Mobile Burger Menu Button */}
          <MobileBurgerMenu profileName={profileData?.profile.name || "Louis Adriano"} />
        </div>
      </nav>

      {/* Floating Chat Button */}
      <FloatingChat />

      <main id="main-content" tabIndex={-1}>
        {/* Hero Section */}
        <section className="min-h-screen flex items-center justify-center px-6 sm:px-8 lg:px-16 pt-24 sm:pt-28 pb-12 sm:pb-16 bg-[#f5f1e8]" aria-label="Hero">
          <div className="max-w-[1400px] mx-auto grid grid-cols-1 lg:grid-cols-2 items-center gap-12 sm:gap-12 lg:gap-16">
          <FadeIn direction="up" delay={0.2} className="max-w-[600px] mx-auto lg:mx-0 lg:ml-auto flex flex-col">
            <div className="text-xs sm:text-xs uppercase tracking-[2px] sm:tracking-[3px] text-primary font-medium mb-5 sm:mb-6 text-center lg:text-left">
              Welcome
            </div>
            <h1 className="font-serif italic text-[2.2rem] sm:text-[2.5rem] lg:text-[3.2rem] leading-[1.25] font-light text-foreground mb-5 sm:mb-6 text-center lg:text-left">
              {profileData?.profile.bio || "Building at the intersection of creativity and technology."}
            </h1>
            <p className="text-[0.95rem] sm:text-base lg:text-[1.05rem] leading-[1.75] sm:leading-[1.8] text-foreground opacity-75 mb-8 sm:mb-10 text-center lg:text-left">
              {profileData?.profile.hero_subtitle || `I'm ${profileData?.profile.name || "Louis Adriano"}, a ${profileData?.profile.title || "Full-stack Developer"} passionate about creating meaningful digital experiences.`}
            </p>
            
            {/* Picture - Mobile only, centered */}
            <div className="lg:hidden mb-8 flex justify-center order-1">
              <div className="relative w-[280px] h-[360px] bg-primary rounded-none shadow-[0_15px_50px_rgba(42,42,42,0.12)] overflow-visible">
                <img 
                  src="/images/hero.jpg" 
                  alt={profileData?.profile.name || "Louis Adriano"}
                  className="w-full h-full object-cover"
                />
                {/* Top right decorative rectangle */}
                <div className="absolute top-4 -right-8 bg-primary px-3 py-1">
                  <span className="text-primary-foreground font-serif italic text-xs font-light tracking-wide">Based in Sydney</span>
                </div>
                {/* Bottom left decorative rectangle */}
                <div className="absolute bottom-4 -left-6 bg-primary px-3 py-1">
                  <span className="text-primary-foreground font-serif italic text-[0.65rem] font-light tracking-wide">Let&apos;s Connect!</span>
                </div>
              </div>
            </div>

            {/* Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 order-2">
              <Link
                href="/portfolio"
                className="bg-primary text-primary-foreground px-8 sm:px-8 py-3.5 sm:py-[0.9rem] rounded-[30px] font-medium text-[0.95rem] sm:text-[0.95rem] transition-all hover:bg-[#3d6149] hover:-translate-y-0.5 text-center focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:outline-none"
                aria-label="View portfolio"
              >
                View my work
              </Link>
              <Link
                href="/contact"
                className="border-2 border-foreground text-foreground px-8 sm:px-8 py-[0.8rem] sm:py-[0.8rem] rounded-[30px] font-medium text-[0.95rem] sm:text-[0.95rem] transition-all hover:bg-foreground hover:text-background hover:-translate-y-0.5 text-center focus:ring-2 focus:ring-foreground focus:ring-offset-2 focus:outline-none"
                aria-label="Contact me"
              >
                Get in touch
              </Link>
            </div>
          </FadeIn>

        {/* Picture - Desktop only */}
        <FadeIn direction="right" delay={0.4} className="hidden lg:flex relative h-[400px] sm:h-[500px] lg:h-[550px] items-center justify-center mx-auto lg:mx-0 lg:mr-auto">
          <div className="relative w-[280px] h-[360px] sm:w-[320px] sm:h-[400px] lg:w-[350px] lg:h-[440px] bg-primary rounded-none shadow-[0_15px_50px_rgba(42,42,42,0.12)] overflow-visible">
            <img 
              src="/images/hero.jpg" 
              alt={profileData?.profile.name || "Louis Adriano"}
              className="w-full h-full object-cover"
            />
            {/* Top right decorative rectangle */}
            <div className="absolute top-4 -right-8 sm:top-8 sm:-right-20 bg-primary px-3 py-1 sm:px-6 sm:py-2">
              <span className="text-primary-foreground font-serif italic text-xs sm:text-sm font-light tracking-wide">Based in Sydney</span>
            </div>
            {/* Bottom left decorative rectangle */}
            <div className="absolute bottom-4 -left-6 sm:bottom-8 sm:-left-12 bg-primary px-3 py-1 sm:px-4 sm:py-2">
              <span className="text-primary-foreground font-serif italic text-[0.65rem] sm:text-xs font-light tracking-wide">Let&apos;s Connect!</span>
            </div>
          </div>
        </FadeIn>
        </div>
      </section>

      {/* About Section */}
      <section className="py-20 sm:py-24 lg:py-32 px-6 sm:px-8 lg:px-16 bg-[#ebe6da]" aria-label="About">
        <div className="max-w-[1300px] mx-auto">
          <FadeIn direction="up" className="max-w-[800px] mx-auto text-center">
            <div className="bg-primary px-8 sm:px-12 lg:px-16 py-0.5 mb-6 sm:mb-8 lg:mb-10 inline-block">
              <h2 className="font-serif italic text-xl sm:text-[1.8rem] lg:text-[2.2rem] font-light text-primary-foreground m-0">
                About Me
              </h2>
            </div>
            <p className="text-[0.95rem] sm:text-base lg:text-[1.05rem] leading-[1.8] sm:leading-[1.8] lg:leading-[1.9] text-foreground opacity-80 mb-5 sm:mb-6">
              {profileData?.profile.about_greeting || "I warmly welcome you to my corner of the internet."}
            </p>
            <p className="text-[0.95rem] sm:text-base lg:text-[1.05rem] leading-[1.8] sm:leading-[1.8] lg:leading-[1.9] text-foreground opacity-80">
              {profileData?.profile.summary || "I'm passionate about technology and spend my days building digital solutions. My journey has taken me through various projects and challenges, shaping how I approach problems and create solutions today."}
            </p>
          </FadeIn>
        </div>
      </section>

      {/* Expertise Section */}
      <section className="py-20 sm:py-24 lg:py-32 px-6 sm:px-8 lg:px-16 bg-[#f5f1e8]" aria-label="Expertise">
        <div className="max-w-[1300px] mx-auto">
          <FadeIn direction="up" className="text-center mb-12 sm:mb-16 lg:mb-20">
            <div className="text-[0.65rem] sm:text-xs uppercase tracking-[2px] sm:tracking-[3px] text-primary font-medium mb-2 sm:mb-3">
              Expertise
            </div>
            <h2 className="font-serif italic text-2xl sm:text-[2rem] lg:text-[2.5rem] font-light text-foreground text-center">
              What I do
            </h2>
          </FadeIn>

          <StaggerContainer className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10 sm:gap-12 lg:gap-16 max-w-[1100px] mx-auto">
            {/* Service Cards */}
            <StaggerItem className="transition-all hover:-translate-y-1 text-center md:text-left">
              <div className="w-[48px] h-[48px] sm:w-[50px] sm:h-[50px] bg-primary rounded-[4px] flex items-center justify-center mb-5 sm:mb-5 mx-auto md:mx-0">
                <svg className="w-5 h-5 sm:w-6 sm:h-6 text-primary-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                </svg>
              </div>
              <h3 className="font-serif italic text-xl sm:text-xl lg:text-[1.3rem] font-light text-foreground mb-3 sm:mb-3">
                Full-Stack Development
              </h3>
              <p className="text-foreground opacity-70 leading-[1.7] sm:leading-[1.7] text-[0.9rem] sm:text-[0.9rem]">
                Creating high-performance web applications with Next.js, TypeScript, and React. Delivered corporate websites with 90+ PageSpeed scores and scalable cloud deployments on Vercel and AWS.
              </p>
            </StaggerItem>

            <StaggerItem className="transition-all hover:-translate-y-1 text-center md:text-left">
              <div className="w-[48px] h-[48px] sm:w-[50px] sm:h-[50px] bg-primary rounded-[4px] flex items-center justify-center mb-5 sm:mb-5 mx-auto md:mx-0">
                <svg className="w-5 h-5 sm:w-6 sm:h-6 text-primary-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <h3 className="font-serif italic text-xl sm:text-xl lg:text-[1.3rem] font-light text-foreground mb-3 sm:mb-3">
                Business Analysis & Requirements
              </h3>
              <p className="text-foreground opacity-70 leading-[1.7] sm:leading-[1.7] text-[0.9rem] sm:text-[0.9rem]">
                Translating business needs into technical solutions. Experience gathering stakeholder requirements, creating process documentation, and bridging communication between technical teams and business stakeholders.
              </p>
            </StaggerItem>

            <StaggerItem className="transition-all hover:-translate-y-1 text-center md:text-left">
              <div className="w-[48px] h-[48px] sm:w-[50px] sm:h-[50px] bg-primary rounded-[4px] flex items-center justify-center mb-5 sm:mb-5 mx-auto md:mx-0">
                <svg className="w-5 h-5 sm:w-6 sm:h-6 text-primary-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
                </svg>
              </div>
              <h3 className="font-serif italic text-xl sm:text-xl lg:text-[1.3rem] font-light text-foreground mb-3 sm:mb-3">
                AI Integration & Smart Systems
              </h3>
              <p className="text-foreground opacity-70 leading-[1.7] sm:leading-[1.7] text-[0.9rem] sm:text-[0.9rem]">
                Implementing AI-powered search with RAG architecture and vector databases. Building intelligent platforms with semantic search, NLP processing, and real-time query understanding.
              </p>
            </StaggerItem>
          </StaggerContainer>
        </div>
      </section>

      {/* Featured Projects Section */}
      <section className="py-20 sm:py-24 lg:py-32 px-6 sm:px-8 lg:px-16 bg-[#ebe6da]" aria-label="Featured Projects">
        <div className="max-w-[1300px] mx-auto">
          <FadeIn direction="up" className="text-center mb-12 sm:mb-16 lg:mb-20">
            <div className="text-[0.65rem] sm:text-xs uppercase tracking-[2px] sm:tracking-[3px] text-primary font-medium mb-2 sm:mb-3">
              Portfolio
            </div>
            <h2 className="font-serif italic text-[2.5rem] font-light text-foreground">
              Selected works
            </h2>
          </FadeIn>

          {/* Current Work Badge */}
          {profileData?.experiences && profileData.experiences.length > 0 && (() => {
            // Sort experiences: null end_date first (current), then by start_date descending
            const sortedExperiences = [...profileData.experiences].sort((a, b) => {
              if (a.end_date === null && b.end_date !== null) return -1;
              if (a.end_date !== null && b.end_date === null) return 1;
              return new Date(b.start_date).getTime() - new Date(a.start_date).getTime();
            });
            const currentExp = sortedExperiences[0];
            
            return (
              <FadeIn direction="up" delay={0.2}>
              <div className="max-w-[900px] mx-auto mb-8 sm:mb-12 p-4 sm:p-6 bg-background border-l-4 border-primary">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-2 h-2 rounded-full bg-primary animate-pulse"></div>
                  <span className="text-xs uppercase tracking-[2px] text-primary font-medium">Currently Working</span>
                </div>
                <h3 className="font-serif italic text-xl font-light text-foreground mb-1">
                  {currentExp.title}
                </h3>
                <p className="text-sm text-muted-foreground font-sans">
                  {currentExp.company} • {formatDate(currentExp.start_date)} - {currentExp.end_date ? formatDate(currentExp.end_date) : 'Present'}
                </p>
              </div>
              </FadeIn>
            );
          })()}

          {/* Recent Projects */}
          <StaggerContainer className="max-w-[900px] mx-auto space-y-6 mb-12" staggerDelay={0.15}>
            {profileData?.projects
              .sort((a, b) => new Date(b.start_date).getTime() - new Date(a.start_date).getTime())
              .slice(0, 2)
              .map((project, index) => (
              <StaggerItem key={project.id}>
              <div
                className="group w-full bg-background border border-border hover:border-primary transition-all duration-300 p-6"
              >
                <div className="flex items-start gap-6">
                  {/* Project Number */}
                  <div className="flex-shrink-0 w-12 h-12 flex items-center justify-center border border-border group-hover:border-primary transition-colors">
                    <span className="text-sm font-medium text-muted-foreground group-hover:text-primary transition-colors font-sans">
                      {String(index + 1).padStart(2, '0')}
                    </span>
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4 mb-2">
                      <h3 className="font-serif italic text-lg text-foreground group-hover:text-primary transition-colors font-light">
                        {project.name}
                      </h3>
                      <span className="text-[0.7rem] uppercase tracking-wider text-muted-foreground font-medium whitespace-nowrap font-sans">
                        {formatDate(project.start_date)} - {project.end_date ? formatDate(project.end_date) : 'Present'}
                      </span>
                    </div>

                    <p className="text-[0.9rem] text-foreground/70 leading-relaxed mb-4 font-sans">
                      {project.description}
                    </p>

                    {/* Technologies */}
                    {project.technologies && project.technologies.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {project.technologies.slice(0, 5).map((tech: string) => (
                          <span key={tech} className="text-[0.7rem] px-2 py-1 bg-background border border-border text-foreground/60 font-sans">
                            {tech}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
              </StaggerItem>
            ))}
          </StaggerContainer>

          <FadeIn direction="up" delay={0.3} className="text-center">
            <Link
              href="/portfolio"
              className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-8 py-3 rounded-[30px] font-medium text-[0.95rem] transition-all hover:bg-[#3d6149] hover:-translate-y-0.5 focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:outline-none"
              aria-label="View all projects"
            >
              View all projects
            </Link>
          </FadeIn>
        </div>
      </section>

      {/* Writing/Blog Section */}
      <section className="py-20 sm:py-24 lg:py-32 px-6 sm:px-8 lg:px-16 bg-[#f5f1e8]" aria-label="Blog Posts">
        <div className="max-w-[1300px] mx-auto">
          <FadeIn direction="up" className="text-center mb-12 sm:mb-16 lg:mb-20">
            <div className="text-xs uppercase tracking-[3px] text-primary font-medium mb-3">
              Posts
            </div>
            <h2 className="font-serif italic text-[2.5rem] font-light text-foreground">
              Recent thoughts
            </h2>
          </FadeIn>

          <StaggerContainer className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 lg:gap-10 max-w-[1100px] mx-auto">
            {profileData?.thoughts && profileData.thoughts.length > 0 ? (
              profileData.thoughts.map((thought) => (
                <StaggerItem key={thought.id} className="group transition-all hover:-translate-y-1">
                  <div className="mb-4">
                    <div className="text-xs text-muted-foreground font-sans mb-2">
                      {new Date(thought.published_date).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      })}
                      {' • '}
                      {Math.max(1, Math.ceil(thought.excerpt.split(' ').length / 200))} min read
                    </div>
                    <h3 className="font-serif italic text-[1.3rem] font-light text-foreground mb-3">
                      {thought.title}
                    </h3>
                    <p className="text-[0.9rem] text-foreground opacity-70 leading-[1.6] mb-4">
                      {thought.excerpt.split(' ').slice(0, 30).join(' ')}
                      {thought.excerpt.split(' ').length > 30 ? '...' : ''}
                    </p>
                    {thought.linkedin_url && (
                      <a
                        href={thought.linkedin_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary font-medium inline-flex items-center gap-2 transition-all group-hover:gap-4 text-[0.9rem]"
                      >
                        Read more on LinkedIn →
                      </a>
                    )}
                  </div>
                </StaggerItem>
              ))
            ) : (
              <div className="col-span-3 text-center py-12">
                <p className="text-muted-foreground font-sans">No thoughts shared yet. Check back soon!</p>
              </div>
            )}
          </StaggerContainer>
        </div>
      </section>

      {/* Connect Section */}
      <section className="py-20 sm:py-24 lg:py-32 px-6 sm:px-8 lg:px-16 bg-primary text-center" aria-label="Connect">
        <FadeIn direction="up" className="max-w-[700px] mx-auto">
          <h2 className="font-serif italic text-[2rem] sm:text-[2.2rem] lg:text-[2.8rem] font-light text-primary-foreground mb-5 sm:mb-6">
            Let&apos;s create something together
          </h2>
          <p className="text-[0.95rem] sm:text-base lg:text-[1.05rem] leading-[1.75] sm:leading-[1.8] text-primary-foreground opacity-85 mb-8 sm:mb-10">
            I&apos;m always open to interesting conversations, collaborations, and new opportunities.
            Whether you want to discuss a project, ask a question, or just say hello, I&apos;d love to hear from you.
          </p>
          <ConnectButton />

          <div className="flex flex-wrap gap-4 sm:gap-8 justify-center mt-8 sm:mt-12">
            {profileData?.profile.linkedin_url && (
              <a
                href={profileData.profile.linkedin_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary-foreground opacity-85 hover:opacity-100 text-[0.95rem] font-medium transition-all hover:-translate-y-0.5 focus:ring-2 focus:ring-primary-foreground focus:ring-offset-2 focus:ring-offset-primary focus:outline-none rounded"
                aria-label="Visit LinkedIn profile"
              >
                LinkedIn
              </a>
            )}
            {profileData?.profile.github_url && (
              <a
                href={profileData.profile.github_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary-foreground opacity-85 hover:opacity-100 text-[0.95rem] font-medium transition-all hover:-translate-y-0.5 focus:ring-2 focus:ring-primary-foreground focus:ring-offset-2 focus:ring-offset-primary focus:outline-none rounded"
                aria-label="Visit GitHub profile"
              >
                GitHub
              </a>
            )}
            {profileData?.profile.email && (
              <a
                href={`mailto:${profileData.profile.email}`}
                className="text-primary-foreground opacity-85 hover:opacity-100 text-[0.95rem] font-medium transition-all hover:-translate-y-0.5 focus:ring-2 focus:ring-primary-foreground focus:ring-offset-2 focus:ring-offset-primary focus:outline-none rounded"
                aria-label="Send email"
              >
                Email
              </a>
            )}
          </div>
        </FadeIn>
      </section>
      </main>

      {/* Footer */}
      <footer className="py-8 sm:py-12 px-4 sm:px-8 lg:px-16 bg-primary text-center border-t-2 border-primary-foreground/20" role="contentinfo">
        <p className="text-primary-foreground opacity-70 text-xs sm:text-sm lg:text-[0.9rem]">
          © 2025{' '}
          <a
            href="https://www.linkedin.com/in/louisadriano/"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:opacity-100 transition-opacity underline decoration-primary-foreground/30 hover:decoration-primary-foreground/70 focus:ring-2 focus:ring-primary-foreground focus:ring-offset-2 focus:ring-offset-primary focus:outline-none rounded"
            aria-label="Visit LinkedIn profile"
          >
            {profileData?.profile.name || "Louis Adriano"}
          </a>
          . Thanks for stopping by! :)
        </p>
      </footer>
    </div>
  );
}
