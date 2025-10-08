'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { ProfileData } from '../types/profile';
import FloatingChat from '../components/FloatingChat';
import ContentSections from '../components/ContentSections';

export default function Home() {
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [activeSection, setActiveSection] = useState('overview');
  const [error, setError] = useState<string | null>(null);
  
  // Refs for sections
  const sectionRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});
  const containerRef = useRef<HTMLDivElement>(null);
  
  const sections = [
    { key: "overview", label: "Overview" },
    { key: "experience", label: "Experience" },
    { key: "projects", label: "Projects" },
    { key: "skills", label: "Skills" },
    { key: "education", label: "Education" },
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

  // Intersection Observer to detect which section is in view
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Small delay to ensure refs are mounted
    const timer = setTimeout(() => {
      const observer = new IntersectionObserver(
        (entries) => {
          // Find the entry with highest intersection ratio
          let maxEntry = entries[0];
          entries.forEach((entry) => {
            if (entry.intersectionRatio > (maxEntry?.intersectionRatio || 0)) {
              maxEntry = entry;
            }
          });

          if (maxEntry && maxEntry.isIntersecting && maxEntry.intersectionRatio > 0.2) {
            const sectionKey = maxEntry.target.getAttribute('data-section');
            if (sectionKey) {
              setActiveSection(sectionKey);
            }
          }
        },
        {
          root: container,
          threshold: [0, 0.2, 0.4, 0.6, 0.8, 1.0],
          rootMargin: '-100px 0px -60% 0px'
        }
      );

      // Observe all sections
      Object.values(sectionRefs.current).forEach((ref) => {
        if (ref) observer.observe(ref);
      });

      return () => observer.disconnect();
    }, 100);

    return () => clearTimeout(timer);
  }, [profileData]);

  // Keyboard navigation for quick jumping
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const currentIndex = sections.findIndex(s => s.key === activeSection);
      
      if (e.key === 'ArrowDown' && currentIndex < sections.length - 1) {
        e.preventDefault();
        scrollToSection(sections[currentIndex + 1].key);
      } else if (e.key === 'ArrowUp' && currentIndex > 0) {
        e.preventDefault();
        scrollToSection(sections[currentIndex - 1].key);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeSection, scrollToSection, sections]);

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
      {/* Hero Section */}
      <div className="relative">
        <div className="px-8 py-20 lg:px-16 lg:py-32">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-end">
              {/* Large Name Display */}
              <div className="lg:col-span-8">
                <h1 className="font-serif text-6xl lg:text-8xl xl:text-9xl font-bold leading-none text-foreground text-balance">
                  {profileData?.profile.name?.split(" ")[0] || "Louis"}
                </h1>
                <h1 className="font-serif text-6xl lg:text-8xl xl:text-9xl font-light leading-none text-muted-foreground text-balance -mt-4">
                  {profileData?.profile.name?.split(" ")[1] || "Adriano"}
                </h1>
                
                {/* Job Title */}
                <div className="mt-8 lg:mt-12">
                  <p className="text-lg lg:text-xl font-sans font-light tracking-wide text-secondary uppercase">
                    {profileData?.profile.title || "Full-stack Developer & AI Data Analyst"}
                  </p>
                </div>
              </div>

              {/* Contact Info */}
              <div className="lg:col-span-4 space-y-4">
                <div className="text-right">
                  <p className="text-sm uppercase tracking-widest text-muted-foreground mb-2 font-sans">Contact</p>
                  <p className="text-foreground font-sans">{profileData?.profile.email}</p>
                  <p className="text-muted-foreground font-sans">{profileData?.profile.location}</p>
                </div>
                <div className="flex justify-end space-x-6 pt-4">
                  {profileData?.profile.linkedin_url && (
                    <a
                      href={profileData.profile.linkedin_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-foreground hover:text-muted-foreground transition-colors text-sm uppercase tracking-wide font-sans"
                    >
                      LinkedIn
                    </a>
                  )}
                  {profileData?.profile.github_url && (
                    <a
                      href={profileData.profile.github_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-foreground hover:text-muted-foreground transition-colors text-sm uppercase tracking-wide font-sans"
                    >
                      GitHub
                    </a>
                  )}
                  {profileData?.profile.cv_filename && (
                    <a
                      href="/api/cv/download"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-foreground hover:text-muted-foreground transition-colors text-sm uppercase tracking-wide font-sans"
                    >
                      Download CV
                    </a>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="px-8 lg:px-16">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-16">
            {/* Left Column - Sticky Navigation */}
            <div className="lg:col-span-3">
              <nav className="sticky top-8">
                <p className="text-sm uppercase tracking-widest text-muted-foreground mb-8 font-medium font-sans">Sections</p>
                <div className="space-y-4">
                  {sections.map((section) => (
                    <button
                      key={section.key}
                      onClick={() => scrollToSection(section.key)}
                      className={`block text-left transition-all duration-500 ease-out font-sans ${
                        activeSection === section.key
                          ? "text-foreground font-medium border-l-4 border-foreground pl-6 text-xl transform scale-105"
                          : "text-muted-foreground hover:text-foreground hover:pl-2 text-lg hover:transform hover:scale-102"
                      }`}
                    >
                      {section.label}
                    </button>
                  ))}
                </div>
              </nav>
            </div>

            {/* Right Column - Continuous Scroll Content */}
            <div className="lg:col-span-9">
              <div 
                ref={containerRef}
                className="h-screen overflow-y-auto scrollbar-hide"
                style={{ scrollBehavior: 'smooth' }}
              >
                <div className="space-y-16">
                  {sections.map((section) => (
                    <div
                      key={section.key}
                      ref={(el) => {
                        sectionRefs.current[section.key] = el;
                      }}
                      data-section={section.key}
                      className="py-8"
                    >
                      <ContentSections 
                        activeSection={section.key}
                        profileData={profileData} 
                        formatDate={formatDate}
                        singleSection={true}
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Clean Floating Chat Button */}
      <FloatingChat />
    </div>
  );
}