'use client';

import { useState, useEffect } from 'react';
import { ProfileData } from '../../types/profile';
import Link from 'next/link';
import FloatingChat from '../../components/FloatingChat';

export default function Contact() {
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);

  // Load profile data
  useEffect(() => {
    const loadProfile = async () => {
      try {
        const response = await fetch('/api/profile');
        if (response.ok) {
          const data = await response.json();
          setProfileData(data);
        }
      } catch (error) {
        console.error('Failed to load profile:', error);
      } finally {
        setProfileLoading(false);
      }
    };

    loadProfile();
  }, []);

  return (
    <div className="min-h-screen bg-background">
      {/* Fixed Navigation */}
      <nav className="fixed top-0 w-full px-16 py-8 z-50 bg-gradient-to-b from-[#f5f1e8]/98 to-[#f5f1e8]/0">
        <div className="flex justify-between items-center">
          <Link href="/" className="font-serif text-2xl italic font-light tracking-wide text-foreground hover:text-primary transition-colors">
            {profileData?.profile.name || "Louis Adriano"}
          </Link>

          <ul className="hidden lg:flex gap-12 absolute left-1/2 transform -translate-x-1/2">
            <li>
              <Link href="/" className="font-sans text-[0.95rem] font-normal text-foreground hover:text-primary transition-colors">
                Overview
              </Link>
            </li>
            <li>
              <Link href="/portfolio" className="font-sans text-[0.95rem] font-normal text-foreground hover:text-primary transition-colors">
                Portfolio
              </Link>
            </li>
            <li>
              <Link href="/contact" className="font-sans text-[0.95rem] font-normal text-primary">
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

      {/* Page Header */}
      <section className="pt-32 pb-16 px-16 bg-[#f5f1e8]">
        <div className="max-w-[1300px] mx-auto">
          <div className="text-xs uppercase tracking-[3px] text-primary font-medium mb-6">
            Contact
          </div>
          <h1 className="font-serif italic text-[3.5rem] leading-[1.2] font-light text-foreground mb-6">
            Let's connect
          </h1>
          <p className="text-[1.05rem] leading-[1.8] text-foreground opacity-75 max-w-[650px]">
            I'm always open to new opportunities, collaborations, and interesting conversations.
          </p>
        </div>
      </section>

      {/* Contact Content */}
      <section className="py-32 px-16 bg-[#ebe6da]">
        <div className="max-w-[1100px] mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-24">
            {/* Left Column - Contact Info */}
            <div>
              <h2 className="font-serif italic text-[2rem] font-light text-foreground mb-8">
                Get in touch
              </h2>
              <p className="text-[1.05rem] leading-[1.8] text-foreground opacity-75 mb-12">
                Whether you have a project in mind, want to collaborate, or just want to say hello, I'd love to hear from you.
              </p>

              <div className="space-y-8">
                {profileData?.profile.email && (
                  <div>
                    <div className="text-xs uppercase tracking-[2px] text-primary font-medium mb-2">
                      Email
                    </div>
                    <a
                      href={`mailto:${profileData.profile.email}`}
                      className="text-[1.1rem] text-foreground hover:text-primary transition-colors font-sans"
                    >
                      {profileData.profile.email}
                    </a>
                  </div>
                )}

                {profileData?.profile.linkedin_url && (
                  <div>
                    <div className="text-xs uppercase tracking-[2px] text-primary font-medium mb-2">
                      LinkedIn
                    </div>
                    <a
                      href={profileData.profile.linkedin_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[1.1rem] text-foreground hover:text-primary transition-colors font-sans inline-flex items-center gap-2"
                    >
                      Connect with me
                      <span>→</span>
                    </a>
                  </div>
                )}

                {profileData?.profile.github_url && (
                  <div>
                    <div className="text-xs uppercase tracking-[2px] text-primary font-medium mb-2">
                      GitHub
                    </div>
                    <a
                      href={profileData.profile.github_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[1.1rem] text-foreground hover:text-primary transition-colors font-sans inline-flex items-center gap-2"
                    >
                      View my code
                      <span>→</span>
                    </a>
                  </div>
                )}

                {profileData?.profile.cv_filename && (
                  <div>
                    <div className="text-xs uppercase tracking-[2px] text-primary font-medium mb-2">
                      Resume
                    </div>
                    <a
                      href="/api/cv/download"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[1.1rem] text-foreground hover:text-primary transition-colors font-sans inline-flex items-center gap-2"
                    >
                      Download CV
                      <span>→</span>
                    </a>
                  </div>
                )}
              </div>
            </div>

            {/* Right Column - AI Chat CTA */}
            <div className="bg-primary p-12 rounded-[4px] flex flex-col justify-center">
              <div className="text-4xl mb-6">💬</div>
              <h3 className="font-serif italic text-[2rem] font-light text-primary-foreground mb-4">
                Chat with my AI twin
              </h3>
              <p className="text-primary-foreground opacity-85 mb-8 leading-relaxed">
                Want to learn more about my experience, projects, or skills? My AI assistant knows everything about my work and can answer your questions instantly.
              </p>
              <button
                onClick={() => {
                  const chatButton = document.querySelector('[data-chat-trigger]') as HTMLButtonElement;
                  if (chatButton) chatButton.click();
                }}
                className="bg-primary-foreground text-primary px-8 py-4 rounded-[30px] font-semibold text-[0.95rem] transition-all hover:-translate-y-0.5 hover:shadow-lg self-start"
              >
                Start a conversation
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Alternative Contact Methods */}
      <section className="py-32 px-16 bg-[#f5f1e8]">
        <div className="max-w-[1100px] mx-auto text-center">
          <h2 className="font-serif italic text-[2.5rem] font-light text-foreground mb-6">
            Prefer another way to connect?
          </h2>
          <p className="text-[1.05rem] leading-[1.8] text-foreground opacity-75 mb-12 max-w-[650px] mx-auto">
            I'm active on several platforms. Feel free to reach out wherever you're most comfortable.
          </p>

          <div className="flex flex-wrap gap-6 justify-center">
            {profileData?.profile.linkedin_url && (
              <a
                href={profileData.profile.linkedin_url}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-primary text-primary-foreground px-8 py-3 rounded-[30px] font-medium text-[0.95rem] transition-all hover:bg-[#3d6149] hover:-translate-y-0.5"
              >
                LinkedIn
              </a>
            )}
            {profileData?.profile.github_url && (
              <a
                href={profileData.profile.github_url}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-primary text-primary-foreground px-8 py-3 rounded-[30px] font-medium text-[0.95rem] transition-all hover:bg-[#3d6149] hover:-translate-y-0.5"
              >
                GitHub
              </a>
            )}
            {profileData?.profile.email && (
              <a
                href={`mailto:${profileData.profile.email}`}
                className="border-2 border-foreground text-foreground px-8 py-3 rounded-[30px] font-medium text-[0.95rem] transition-all hover:bg-foreground hover:text-background hover:-translate-y-0.5"
              >
                Send Email
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
