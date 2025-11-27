'use client';

import { useState, useEffect } from 'react';
import { ProfileData } from '../types/profile';
import FloatingChat from '../components/FloatingChat';
import Link from 'next/link';

export default function Home() {
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Format date helper
  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Present';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short'
    });
  };

  // Load profile data
  useEffect(() => {
    const loadProfile = async () => {
      try {
        setError(null);
        const response = await fetch('/api/profile');
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || `Failed to load profile: ${response.status}`);
        }
        const data = await response.json();
        setProfileData(data);
      } catch (error) {
        console.error('Failed to load profile:', error);
        setError(error instanceof Error ? error.message : 'Failed to load profile');
      } finally {
        setProfileLoading(false);
      }
    };

    loadProfile();
  }, []);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="text-xl text-destructive mb-4 font-serif">Error Loading Profile</div>
          <div className="text-muted-foreground mb-4">{error}</div>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-2 bg-primary text-primary-foreground hover:bg-secondary transition-colors font-sans"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (profileLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-6xl mx-auto px-8 py-16">
          <div className="animate-pulse">
            <div className="h-12 bg-muted rounded w-1/3 mb-4"></div>
            <div className="h-6 bg-muted rounded w-1/2 mb-12"></div>
            <div className="space-y-8">
              <div className="h-64 bg-muted rounded"></div>
              <div className="h-64 bg-muted rounded"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Fixed Navigation */}
      <nav className="fixed top-0 w-full px-16 py-8 z-50 bg-gradient-to-b from-[#f5f1e8]/98 to-[#f5f1e8]/0">
        <div className="flex justify-between items-center">
          <Link href="/" className="font-serif text-2xl italic font-light tracking-wide text-foreground">
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

          <a
            href="/api/cv/download"
            target="_blank"
            rel="noopener noreferrer"
            className="bg-primary text-primary-foreground px-8 py-3 rounded-[30px] font-medium text-[0.95rem] transition-all hover:bg-[#3d6149] hover:-translate-y-0.5"
          >
            Download CV
          </a>
        </div>
      </nav>

      {/* Floating Chat Button */}
      <FloatingChat />

      {/* Hero Section */}
      <section className="min-h-screen flex items-center justify-center px-16 pt-24 pb-16 bg-[#f5f1e8]">
        <div className="max-w-[1400px] mx-auto grid grid-cols-1 lg:grid-cols-2 items-center gap-16">
        <div className="max-w-[600px] mx-auto lg:mx-0 lg:ml-auto">
          <div className="text-xs uppercase tracking-[3px] text-primary font-medium mb-6">
            Welcome
          </div>
          <h1 className="font-serif italic text-[3.2rem] leading-[1.2] font-light text-foreground mb-6">
            {profileData?.profile.bio || "Building at the intersection of creativity and technology."}
          </h1>
          <p className="text-[1.05rem] leading-[1.8] text-foreground opacity-75 mb-10">
            {profileData?.profile.hero_subtitle || `I'm ${profileData?.profile.name || "Louis Adriano"}, a ${profileData?.profile.title || "Full-stack Developer"} passionate about creating meaningful digital experiences.`}
          </p>
          <div className="flex gap-6">
            <Link
              href="/portfolio"
              className="bg-primary text-primary-foreground px-8 py-[0.9rem] rounded-[30px] font-medium text-[0.95rem] transition-all hover:bg-[#3d6149] hover:-translate-y-0.5"
            >
              View my work
            </Link>
            <Link
              href="/contact"
              className="border-2 border-foreground text-foreground px-8 py-[0.8rem] rounded-[30px] font-medium text-[0.95rem] transition-all hover:bg-foreground hover:text-background hover:-translate-y-0.5"
            >
              Get in touch
            </Link>
          </div>
        </div>

        <div className="relative h-[550px] flex items-center justify-center mx-auto lg:mx-0 lg:mr-auto">
          <div className="relative w-[350px] h-[440px] bg-primary rounded-none shadow-[0_15px_50px_rgba(42,42,42,0.12)] overflow-visible">
            <img 
              src="/images/hero.jpg" 
              alt={profileData?.profile.name || "Louis Adriano"}
              className="w-full h-full object-cover"
            />
            {/* Top right decorative rectangle */}
            <div className="absolute top-8 -right-20 bg-primary px-6 py-2">
              <span className="text-primary-foreground font-serif italic text-sm font-light tracking-wide">Based in Sydney</span>
            </div>
            {/* Bottom left decorative rectangle */}
            <div className="absolute bottom-8 -left-12 bg-primary px-4 py-2">
              <span className="text-primary-foreground font-serif italic text-xs font-light tracking-wide">Let's Connect!</span>
            </div>
          </div>
        </div>
        </div>
      </section>

      {/* About Section */}
      <section className="py-32 px-16 bg-[#ebe6da]">
        <div className="max-w-[1300px] mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-24 items-center">
            <div className="relative h-[450px]">
              <div className="w-full h-full bg-primary rounded-none shadow-[0_15px_50px_rgba(42,42,42,0.12)] overflow-hidden">
                <img 
                  src="/images/about.jpg" 
                  alt={`About ${profileData?.profile.name || "Louis Adriano"}`}
                  className="w-full h-full object-cover"
                />
              </div>
            </div>

            <div className="max-w-[650px]">
              <div className="bg-primary px-16 py-0.5 mb-10 inline-block">
                <h2 className="font-serif italic text-[2.2rem] font-light text-primary-foreground m-0">
                  About Me
                </h2>
              </div>
              <p className="text-[1.05rem] leading-[1.9] text-foreground opacity-80 mb-6">
                {profileData?.profile.about_greeting || "I warmly welcome you to my corner of the internet."}
              </p>
              <p className="text-[1.05rem] leading-[1.9] text-foreground opacity-80">
                {profileData?.profile.summary || "I'm passionate about technology and spend my days building digital solutions. My journey has taken me through various projects and challenges, shaping how I approach problems and create solutions today."}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Expertise Section */}
      <section className="py-32 px-16 bg-[#f5f1e8]">
        <div className="max-w-[1300px] mx-auto">
          <div className="text-center mb-20">
            <div className="text-xs uppercase tracking-[3px] text-primary font-medium mb-3">
              Expertise
            </div>
            <h2 className="font-serif italic text-[2.5rem] font-light text-foreground">
              What I do
            </h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-16 max-w-[1100px] mx-auto">
            {/* Service Cards */}
            <div className="transition-all hover:-translate-y-1">
              <div className="w-[50px] h-[50px] bg-primary rounded-[4px] flex items-center justify-center mb-5">
                <svg className="w-6 h-6 text-primary-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                </svg>
              </div>
              <h3 className="font-serif italic text-[1.3rem] font-light text-foreground mb-3">
                Full-Stack Web Development
              </h3>
              <p className="text-foreground opacity-70 leading-[1.7] text-[0.9rem]">
                Building scalable applications with Next.js, TypeScript, and React. Creating high-performance 
                platforms with 90+ PageSpeed scores and modern architecture.
              </p>
            </div>

            <div className="transition-all hover:-translate-y-1">
              <div className="w-[50px] h-[50px] bg-primary rounded-[4px] flex items-center justify-center mb-5">
                <svg className="w-6 h-6 text-primary-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <h3 className="font-serif italic text-[1.3rem] font-light text-foreground mb-3">
                AI Integration & RAG Architecture
              </h3>
              <p className="text-foreground opacity-70 leading-[1.7] text-[0.9rem]">
                Developing AI-powered systems with RAG architecture and vector databases. 
                Achieving 90%+ accuracy with semantic search and real-time NLP.
              </p>
            </div>

            <div className="transition-all hover:-translate-y-1">
              <div className="w-[50px] h-[50px] bg-primary rounded-[4px] flex items-center justify-center mb-5">
                <svg className="w-6 h-6 text-primary-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
                </svg>
              </div>
              <h3 className="font-serif italic text-[1.3rem] font-light text-foreground mb-3">
                Cloud Deployment & DevOps
              </h3>
              <p className="text-foreground opacity-70 leading-[1.7] text-[0.9rem]">
                Deploying production applications on Vercel and AWS with automated workflows. 
                Sub-second response times with seamless scalability.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Projects Section */}
      <section className="py-32 px-16 bg-[#ebe6da]">
        <div className="max-w-[1300px] mx-auto">
          <div className="text-center mb-20">
            <div className="text-xs uppercase tracking-[3px] text-primary font-medium mb-3">
              Portfolio
            </div>
            <h2 className="font-serif italic text-[2.5rem] font-light text-foreground">
              Selected work
            </h2>
          </div>

          {/* Current Work Badge */}
          {profileData?.experiences && profileData.experiences
            .sort((a, b) => new Date(b.start_date).getTime() - new Date(a.start_date).getTime())[0] && (
            <div className="max-w-[900px] mx-auto mb-12 p-6 bg-background border-l-4 border-primary">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-2 h-2 rounded-full bg-primary animate-pulse"></div>
                <span className="text-xs uppercase tracking-[2px] text-primary font-medium">Currently Working</span>
              </div>
              <h3 className="font-serif italic text-xl font-light text-foreground mb-1">
                {profileData.experiences.sort((a, b) => new Date(b.start_date).getTime() - new Date(a.start_date).getTime())[0].title}
              </h3>
              <p className="text-sm text-muted-foreground font-sans">
                {profileData.experiences.sort((a, b) => new Date(b.start_date).getTime() - new Date(a.start_date).getTime())[0].company} • {formatDate(profileData.experiences.sort((a, b) => new Date(b.start_date).getTime() - new Date(a.start_date).getTime())[0].start_date)} - Present
              </p>
            </div>
          )}

          {/* Recent Projects */}
          <div className="max-w-[900px] mx-auto space-y-6 mb-12">
            {profileData?.projects
              .sort((a, b) => new Date(b.start_date).getTime() - new Date(a.start_date).getTime())
              .slice(0, 2)
              .map((project, index) => (
              <div
                key={project.id}
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
                        {formatDate(project.start_date)}
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
            ))}
          </div>

          <div className="text-center">
            <Link
              href="/portfolio"
              className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-8 py-3 rounded-[30px] font-medium text-[0.95rem] transition-all hover:bg-[#3d6149] hover:-translate-y-0.5"
            >
              View all projects
            </Link>
          </div>
        </div>
      </section>

      {/* Writing/Blog Section */}
      <section className="py-32 px-16 bg-[#f5f1e8]">
        <div className="max-w-[1300px] mx-auto">
          <div className="text-center mb-20">
            <div className="text-xs uppercase tracking-[3px] text-primary font-medium mb-3">
              Writing
            </div>
            <h2 className="font-serif italic text-[2.5rem] font-light text-foreground">
              Recent thoughts
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-10 max-w-[1100px] mx-auto">
            {/* Placeholder blog posts - will be dynamic later */}
            <div className="group transition-all hover:-translate-y-1">
              <div className="mb-4">
                <div className="text-xs text-muted-foreground font-sans mb-2">Nov 20, 2025 • 5 min read</div>
                <h3 className="font-serif italic text-[1.3rem] font-light text-foreground mb-3">
                  On building meaningful digital experiences
                </h3>
                <p className="text-[0.9rem] text-foreground opacity-70 leading-[1.6] mb-4">
                  Exploring what it means to create technology that truly serves people, not the other way around...
                </p>
                <a
                  href={profileData?.profile.linkedin_url || "#"}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary font-medium inline-flex items-center gap-2 transition-all group-hover:gap-4 text-[0.9rem]"
                >
                  Read more on LinkedIn →
                </a>
              </div>
            </div>

            <div className="group transition-all hover:-translate-y-1">
              <div className="mb-4">
                <div className="text-xs text-muted-foreground font-sans mb-2">Nov 15, 2025 • 4 min read</div>
                <h3 className="font-serif italic text-[1.3rem] font-light text-foreground mb-3">
                  The art of creative problem solving
                </h3>
                <p className="text-[0.9rem] text-foreground opacity-70 leading-[1.6] mb-4">
                  How constraints can actually unlock creativity and lead to better solutions than we initially imagined...
                </p>
                <a
                  href={profileData?.profile.linkedin_url || "#"}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary font-medium inline-flex items-center gap-2 transition-all group-hover:gap-4 text-[0.9rem]"
                >
                  Read more on LinkedIn →
                </a>
              </div>
            </div>

            <div className="group transition-all hover:-translate-y-1">
              <div className="mb-4">
                <div className="text-xs text-muted-foreground font-sans mb-2">Nov 10, 2025 • 6 min read</div>
                <h3 className="font-serif italic text-[1.3rem] font-light text-foreground mb-3">
                  Why continuous learning matters
                </h3>
                <p className="text-[0.9rem] text-foreground opacity-70 leading-[1.6] mb-4">
                  In a rapidly evolving field, staying curious and committed to growth isn't optional—it's essential...
                </p>
                <a
                  href={profileData?.profile.linkedin_url || "#"}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary font-medium inline-flex items-center gap-2 transition-all group-hover:gap-4 text-[0.9rem]"
                >
                  Read more on LinkedIn →
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Connect Section */}
      <section className="py-32 px-16 bg-primary text-center">
        <div className="max-w-[700px] mx-auto">
          <h2 className="font-serif italic text-[2.8rem] font-light text-primary-foreground mb-6">
            Let's create something together
          </h2>
          <p className="text-[1.05rem] leading-[1.8] text-primary-foreground opacity-85 mb-10">
            I'm always open to interesting conversations, collaborations, and new opportunities.
            Whether you want to discuss a project, ask a question, or just say hello—I'd love to hear from you.
          </p>
          <button
            onClick={() => {
              const chatButton = document.querySelector('[data-chat-trigger]') as HTMLButtonElement;
              if (chatButton) chatButton.click();
            }}
            className="bg-primary-foreground text-primary px-10 py-4 rounded-[30px] font-semibold text-[0.95rem] inline-block transition-all hover:-translate-y-0.5 hover:shadow-[0_8px_25px_rgba(0,0,0,0.15)]"
          >
            Start a conversation
          </button>

          <div className="flex gap-8 justify-center mt-12">
            {profileData?.profile.linkedin_url && (
              <a
                href={profileData.profile.linkedin_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary-foreground opacity-85 hover:opacity-100 text-[0.95rem] font-medium transition-all hover:-translate-y-0.5"
              >
                LinkedIn
              </a>
            )}
            {profileData?.profile.github_url && (
              <a
                href={profileData.profile.github_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary-foreground opacity-85 hover:opacity-100 text-[0.95rem] font-medium transition-all hover:-translate-y-0.5"
              >
                GitHub
              </a>
            )}
            {profileData?.profile.email && (
              <a
                href={`mailto:${profileData.profile.email}`}
                className="text-primary-foreground opacity-85 hover:opacity-100 text-[0.95rem] font-medium transition-all hover:-translate-y-0.5"
              >
                Email
              </a>
            )}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-16 bg-primary text-center border-t-2 border-primary-foreground/20">
        <p className="text-primary-foreground opacity-70 text-[0.9rem]">
          © 2025 {profileData?.profile.name || "Louis Adriano"}. Designed and built with care.
        </p>
      </footer>
    </div>
  );
}
