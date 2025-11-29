'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { ProfileData } from '../../types/profile';
import Link from 'next/link';
import ContentSections from '../../components/ContentSections';
import FloatingChat from '../../components/FloatingChat';
import FadeIn from '../../components/animations/FadeIn';
import MobileBurgerMenu from '../../components/MobileBurgerMenu';

export default function Portfolio() {
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [activeSection, setActiveSection] = useState('overview');
  const [error, setError] = useState<string | null>(null);

  // Refs for sections
  const sectionRefs = useRef<{ [key: string]: HTMLElement | null }>({});

  const sections = [
    { key: "overview", label: "Summary" },
    { key: "experience", label: "Experience" },
    { key: "projects", label: "Projects" },
    { key: "education", label: "Education" },
    { key: "skills", label: "Skills" },
  ];

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

  // Smooth scroll to section
  const scrollToSection = useCallback((sectionKey: string) => {
    const section = sectionRefs.current[sectionKey];
    if (section) {
      setActiveSection(sectionKey);
      section.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });
    }
  }, []);

  // Format date helper
  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Present';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short'
    });
  };

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
      <nav className="fixed top-0 w-full px-4 sm:px-8 lg:px-16 py-4 sm:py-6 lg:py-8 z-50 bg-gradient-to-b from-[#f5f1e8]/98 to-[#f5f1e8]/0">
        <div className="flex justify-between items-center">
          <Link href="/" className="font-serif text-xl sm:text-2xl italic font-light tracking-wide text-foreground hover:text-primary transition-colors">
            {profileData?.profile.name || "Louis Adriano"}
          </Link>

          <ul className="hidden lg:flex gap-12 absolute left-1/2 transform -translate-x-1/2">
            <li>
              <Link href="/" className="font-sans text-[0.95rem] font-normal text-foreground hover:text-primary transition-colors">
                Overview
              </Link>
            </li>
            <li>
              <Link href="/portfolio" className="font-sans text-[0.95rem] font-normal text-primary">
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

          {/* Mobile Burger Menu */}
          <MobileBurgerMenu profileName={profileData?.profile.name || "Louis Adriano"} />
        </div>
      </nav>

      {/* Floating Chat */}
      <FloatingChat />

      {/* Hero/Header Section */}
      <section className="pt-24 sm:pt-28 lg:pt-32 pb-12 sm:pb-16 px-4 sm:px-8 lg:px-16 bg-[#f5f1e8]">
        <div className="max-w-[1400px] mx-auto">
          <FadeIn direction="up" delay={0.1}>
            <div className="text-xs sm:text-xs uppercase tracking-[2px] sm:tracking-[3px] text-primary font-medium mb-4 sm:mb-5">
              Portfolio
            </div>
            <h1 className="font-serif italic text-2xl sm:text-[2.5rem] lg:text-[3.5rem] font-light text-foreground mb-3 sm:mb-4">
              My Journey
            </h1>
            <p className="text-foreground opacity-70 text-sm sm:text-base max-w-2xl leading-[1.6] sm:leading-[1.7]">
              {profileData?.profile.portfolio_summary || "A collection of my experiences, projects, and the skills I've developed along the way."}
            </p>
          </FadeIn>
            <span className="hidden sm:inline">Download CV</span>
            <span className="sm:hidden">CV</span>
          </a>
        </div>
      </nav>

      {/* Floating Chat Button */}
      <FloatingChat />

      {/* Page Header */}
      <section className="pt-24 sm:pt-28 lg:pt-32 pb-12 sm:pb-16 px-4 sm:px-8 lg:px-16 bg-[#f5f1e8] relative overflow-hidden">
        <div className="max-w-[1300px] mx-auto text-center relative z-10">
          <FadeIn direction="none" delay={0.1}>
            <div className="text-[0.65rem] sm:text-xs uppercase tracking-[2px] sm:tracking-[3px] text-primary font-medium mb-4 sm:mb-6">
              Portfolio
            </div>
          </FadeIn>
          <FadeIn direction="up" delay={0.2}>
            <h1 className="font-serif italic text-2xl sm:text-[2.5rem] lg:text-[3.5rem] leading-[1.2] font-light text-foreground mb-4 sm:mb-6">
              Work & Experience
            </h1>
          </FadeIn>
          <FadeIn direction="up" delay={0.3}>
            <p className="text-sm sm:text-base lg:text-[1.05rem] leading-[1.7] sm:leading-[1.8] text-foreground opacity-75 max-w-[650px] mx-auto">
              A comprehensive look at my professional journey, projects, skills, and education.
            </p>
          </FadeIn>
        </div>
      </section>

      {/* Main Content - Alternating Backgrounds */}
      <div>
        {sections.map((section, index) => {
          // Alternate animation directions: up, left, up, right, up
          const directions: Array<'up' | 'left' | 'right'> = ['up', 'left', 'up', 'right', 'up'];
          const direction = directions[index % directions.length];
          
          return (
            <section
              key={section.key}
              ref={(el) => {
                sectionRefs.current[section.key] = el;
              }}
              data-section={section.key}
              className={`py-12 sm:py-16 px-4 sm:px-8 lg:px-16 ${
                index % 2 === 0 ? "bg-[#ebe6da]" : "bg-[#f5f1e8]"
              }`}
            >
              <FadeIn direction={direction} className="max-w-[1300px] mx-auto">
                <ContentSections
                  activeSection={section.key}
                  profileData={profileData}
                  formatDate={formatDate}
                  singleSection={true}
                />
              </FadeIn>
            </section>
          );
        })}
      </div>

      {/* Footer */}
      <footer className="py-8 sm:py-12 px-4 sm:px-8 lg:px-16 bg-primary text-center border-t-2 border-primary-foreground/20">
        <p className="text-primary-foreground opacity-70 text-xs sm:text-sm lg:text-[0.9rem]">
          © 2025{' '}
          <a
            href="https://www.linkedin.com/in/louisadriano/"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:opacity-100 transition-opacity underline decoration-primary-foreground/30 hover:decoration-primary-foreground/70"
          >
            {profileData?.profile.name || "Louis Adriano"}
          </a>
          . Thanks for stopping by! :)
        </p>
      </footer>
    </div>
  );
}
