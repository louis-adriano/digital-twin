'use client';

import { useState } from 'react';
import Link from 'next/link';
import ProfileEditor from '../../../components/admin/ProfileEditor';
import ExperienceManager from '../../../components/admin/ExperienceManager';
import ProjectsManager from '../../../components/admin/ProjectsManager';
import SkillsManager from '../../../components/admin/SkillsManager';
import ThoughtsManager from '../../../components/admin/ThoughtsManager';
import DatabaseManager from '../../../components/admin/DatabaseManager';
import EmbeddingsManager from '../../../components/admin/EmbeddingsManager';

type ActiveTab = 'profile' | 'experiences' | 'projects' | 'skills' | 'thoughts' | 'database' | 'embeddings';

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('profile');

  return (
    <div className="min-h-screen bg-[#f5f1e8]">
      {/* Header */}
      <header className="bg-primary border-b border-primary-foreground/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="font-serif italic text-xl sm:text-2xl lg:text-3xl font-light text-primary-foreground">
                Admin Dashboard
              </h1>
              <p className="text-primary-foreground/80 text-sm mt-1 font-sans">
                Manage your portfolio content
              </p>
            </div>
            <Link
              href="/"
              className="bg-primary-foreground text-primary px-4 py-1.5 sm:px-6 sm:py-2 rounded-[30px] font-medium text-xs sm:text-sm transition-all hover:-translate-y-0.5"
            >
              <span className="hidden sm:inline">View Site</span>
              <span className="sm:hidden">Site</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <nav className="bg-[#ebe6da] border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex gap-4 sm:gap-6 lg:gap-8 overflow-x-auto no-scrollbar">
            <button
              onClick={() => setActiveTab('profile')}
              className={`py-3 sm:py-4 px-2 font-sans text-xs sm:text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                activeTab === 'profile'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-foreground/60 hover:text-foreground'
              }`}
            >
              Profile & Bio
            </button>
            <button
              onClick={() => setActiveTab('experiences')}
              className={`py-3 sm:py-4 px-2 font-sans text-xs sm:text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                activeTab === 'experiences'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-foreground/60 hover:text-foreground'
              }`}
            >
              Experience
            </button>
            <button
              onClick={() => setActiveTab('projects')}
              className={`py-3 sm:py-4 px-2 font-sans text-xs sm:text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                activeTab === 'projects'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-foreground/60 hover:text-foreground'
              }`}
            >
              Projects
            </button>
            <button
              onClick={() => setActiveTab('skills')}
              className={`py-3 sm:py-4 px-2 font-sans text-xs sm:text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                activeTab === 'skills'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-foreground/60 hover:text-foreground'
              }`}
            >
              Skills
            </button>
            <button
              onClick={() => setActiveTab('thoughts')}
              className={`py-3 sm:py-4 px-2 font-sans text-xs sm:text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                activeTab === 'thoughts'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-foreground/60 hover:text-foreground'
              }`}
            >
              Recent Thoughts
            </button>
            <button
              onClick={() => setActiveTab('database')}
              className={`py-3 sm:py-4 px-2 font-sans text-xs sm:text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                activeTab === 'database'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-foreground/60 hover:text-foreground'
              }`}
            >
              Database
            </button>
            <button
              onClick={() => setActiveTab('embeddings')}
              className={`py-3 sm:py-4 px-2 font-sans text-xs sm:text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                activeTab === 'embeddings'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-foreground/60 hover:text-foreground'
              }`}
            >
              AI Embeddings
            </button>
          </div>
        </div>
      </nav>

      {/* Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-12">
        {activeTab === 'profile' && (
          <div>
            <div className="mb-6 sm:mb-8">
              <h2 className="font-serif italic text-xl sm:text-2xl font-light text-foreground mb-2">
                Profile Information
              </h2>
              <p className="text-foreground/70 text-sm font-sans">
                Manage your personal information, bio, and contact details. This content appears on the homepage and portfolio page.
              </p>
            </div>
            <ProfileEditor />
          </div>
        )}

        {activeTab === 'experiences' && (
          <div>
            <div className="mb-6 sm:mb-8">
              <h2 className="font-serif italic text-xl sm:text-2xl font-light text-foreground mb-2">
                Work Experience
              </h2>
              <p className="text-foreground/70 text-sm font-sans">
                Add and manage your professional experience. This appears in the Portfolio page under the Experience section.
              </p>
            </div>
            <ExperienceManager />
          </div>
        )}

        {activeTab === 'projects' && (
          <div>
            <div className="mb-6 sm:mb-8">
              <h2 className="font-serif italic text-xl sm:text-2xl font-light text-foreground mb-2">
                Projects
              </h2>
              <p className="text-foreground/70 text-sm font-sans">
                Showcase your best work. Featured projects appear on the homepage, and all projects are shown in the Portfolio page.
              </p>
            </div>
            <ProjectsManager />
          </div>
        )}

        {activeTab === 'skills' && (
          <div>
            <div className="mb-6 sm:mb-8">
              <h2 className="font-serif italic text-xl sm:text-2xl font-light text-foreground mb-2">
                Skills
              </h2>
              <p className="text-foreground/70 text-sm font-sans">
                List your technical and professional skills. These are displayed in the Portfolio page under the Skills section.
              </p>
            </div>
            <SkillsManager />
          </div>
        )}

        {activeTab === 'thoughts' && (
          <div>
            <div className="mb-6 sm:mb-8">
              <h2 className="font-serif italic text-xl sm:text-2xl font-light text-foreground mb-2">
                Recent Thoughts
              </h2>
              <p className="text-foreground/70 text-sm font-sans">
                Share your LinkedIn posts and insights. The 3 most recent thoughts appear on the homepage in the Recent Thoughts section.
              </p>
            </div>
            <ThoughtsManager />
          </div>
        )}

        {activeTab === 'database' && (
          <div>
            <div className="mb-6 sm:mb-8">
              <h2 className="font-serif italic text-xl sm:text-2xl font-light text-foreground mb-2">
                Database Management
              </h2>
              <p className="text-foreground/70 text-sm font-sans">
                Manage your PostgreSQL database, view schema, create backups, and perform maintenance operations.
              </p>
            </div>
            <DatabaseManager />
          </div>
        )}

        {activeTab === 'embeddings' && (
          <div>
            <div className="mb-6 sm:mb-8">
              <h2 className="font-serif italic text-xl sm:text-2xl font-light text-foreground mb-2">
                AI Embeddings
              </h2>
              <p className="text-foreground/70 text-sm font-sans">
                Manage the AI embeddings that power your intelligent chatbot. Regenerate vectors when you update your content.
              </p>
            </div>
            <EmbeddingsManager />
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-primary border-t border-primary-foreground/20 mt-8 sm:mt-12 lg:mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
          <p className="text-primary-foreground/70 text-xs sm:text-sm text-center font-sans">
            Digital Twin Admin Panel • All changes are saved to the database automatically
          </p>
        </div>
      </footer>
    </div>
  );
}
