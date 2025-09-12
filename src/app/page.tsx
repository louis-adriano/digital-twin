'use client';

import { useState, useEffect } from 'react';
import ChatBot from '../components/ChatBot';

interface ProfileData {
  profile: {
    name: string;
    email: string;
    location: string;
    bio: string;
    linkedin_url?: string;
    github_url?: string;
    website_url?: string;
  };
  experiences: Array<{
    id: number;
    title: string;
    company: string;
    location: string;
    start_date: string;
    end_date: string | null;
    description: string;
  }>;
  skills: Array<{
    id: number;
    name: string;
    category: string;
    proficiency_level: number;
    years_experience: number;
    description: string;
  }>;
  projects: Array<{
    id: number;
    name: string;
    description: string;
    technologies: string[];
    github_url?: string;
    live_url?: string;
    start_date: string;
    end_date: string | null;
  }>;
  education: Array<{
    id: number;
    institution: string;
    degree: string;
    field_of_study: string;
    start_date: string;
    end_date: string | null;
    description: string;
  }>;
}

export default function Home() {
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [activeSection, setActiveSection] = useState('overview');
  const [error, setError] = useState<string | null>(null);

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

  // Add error display before your existing loading check:
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-xl text-red-600 mb-4">Error Loading Profile</div>
          <div className="text-gray-600 mb-4">{error}</div>
          <button 
            onClick={() => window.location.reload()} 
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // Format date helper
  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Present';
    return new Date(dateString).toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short' 
    });
  };

  // Skill level colors
  const getSkillColor = (level: number) => {
    if (level >= 4) return '#22c55e'; // green
    if (level >= 3) return '#3b82f6'; // blue
    if (level >= 2) return '#f59e0b'; // yellow
    return '#ef4444'; // red
  };

  if (profileLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-300 rounded w-1/4 mb-4"></div>
            <div className="h-4 bg-gray-300 rounded w-1/2 mb-8"></div>
            <div className="space-y-4">
              <div className="h-32 bg-gray-300 rounded"></div>
              <div className="h-32 bg-gray-300 rounded"></div>
              <div className="h-32 bg-gray-300 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-4">
              <div className="h-12 w-12 bg-blue-600 rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-xl">
                  {profileData?.profile.name?.charAt(0) || 'L'}
                </span>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {profileData?.profile.name || 'Digital Twin'}
                </h1>
                <p className="text-gray-600">{profileData?.profile.location}</p>
              </div>
            </div>
            <div className="flex space-x-4">
              {profileData?.profile.linkedin_url && (
                <a href={profileData.profile.linkedin_url} target="_blank" rel="noopener noreferrer" 
                   className="text-blue-600 hover:text-blue-800">LinkedIn</a>
              )}
              {profileData?.profile.github_url && (
                <a href={profileData.profile.github_url} target="_blank" rel="noopener noreferrer"
                   className="text-gray-700 hover:text-gray-900">GitHub</a>
              )}
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* Navigation */}
            <nav className="flex space-x-8 border-b border-gray-200">
              {[
                { key: 'overview', label: 'Overview' },
                { key: 'experience', label: 'Experience' },
                { key: 'projects', label: 'Projects' },
                { key: 'skills', label: 'Skills' },
                { key: 'education', label: 'Education' }
              ].map((section) => (
                <button
                  key={section.key}
                  onClick={() => setActiveSection(section.key)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm ${
                    activeSection === section.key
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {section.label}
                </button>
              ))}
            </nav>

            {/* Content Sections */}
            {activeSection === 'overview' && (
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">About Me</h2>
                <p className="text-gray-700 leading-relaxed">
                  {profileData?.profile.bio}
                </p>
              </div>
            )}

            {activeSection === 'experience' && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold text-gray-900">Work Experience</h2>
                {profileData?.experiences.map((exp) => (
                  <div key={exp.id} className="bg-white rounded-lg shadow p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-xl font-semibold text-gray-900">{exp.title}</h3>
                        <p className="text-lg text-blue-600">{exp.company}</p>
                        <p className="text-gray-600">{exp.location}</p>
                      </div>
                      <span className="text-sm text-gray-500">
                        {formatDate(exp.start_date)} - {formatDate(exp.end_date)}
                      </span>
                    </div>
                    <p className="text-gray-700">{exp.description}</p>
                  </div>
                ))}
              </div>
            )}

            {activeSection === 'projects' && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold text-gray-900">Projects</h2>
                <div className="grid gap-6">
                  {profileData?.projects.map((project) => (
                    <div key={project.id} className="bg-white rounded-lg shadow p-6">
                      <div className="flex justify-between items-start mb-4">
                        <h3 className="text-xl font-semibold text-gray-900">{project.name}</h3>
                        <div className="flex space-x-2">
                          {project.github_url && (
                            <a href={project.github_url} target="_blank" rel="noopener noreferrer"
                               className="text-gray-600 hover:text-gray-900">GitHub</a>
                          )}
                          {project.live_url && (
                            <a href={project.live_url} target="_blank" rel="noopener noreferrer"
                               className="text-blue-600 hover:text-blue-800">Live Demo</a>
                          )}
                        </div>
                      </div>
                      <p className="text-gray-700 mb-4">{project.description}</p>
                      <div className="flex flex-wrap gap-2">
                        {project.technologies.map((tech) => (
                          <span key={tech} className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm">
                            {tech}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeSection === 'skills' && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold text-gray-900">Skills</h2>
                {profileData?.skills && Object.entries(
                  profileData.skills.reduce((acc, skill) => {
                    if (!acc[skill.category]) acc[skill.category] = [];
                    acc[skill.category].push(skill);
                    return acc;
                  }, {} as Record<string, typeof profileData.skills>)
                ).map(([category, skills]) => (
                  <div key={category} className="bg-white rounded-lg shadow p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">{category}</h3>
                    <div className="grid gap-4">
                      {skills.map((skill) => (
                        <div key={skill.id} className="flex items-center justify-between">
                          <div>
                            <span className="font-medium text-gray-900">{skill.name}</span>
                            <span className="text-sm text-gray-600 ml-2">({skill.years_experience} years)</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <div className="w-24 bg-gray-200 rounded-full h-2">
                              <div 
                                className="h-2 rounded-full" 
                                style={{
                                  width: `${(skill.proficiency_level / 5) * 100}%`,
                                  backgroundColor: getSkillColor(skill.proficiency_level)
                                }}
                              />
                            </div>
                            <span className="text-sm text-gray-600">{skill.proficiency_level}/5</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {activeSection === 'education' && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold text-gray-900">Education</h2>
                {profileData?.education.map((edu) => (
                  <div key={edu.id} className="bg-white rounded-lg shadow p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-xl font-semibold text-gray-900">{edu.degree}</h3>
                        <p className="text-lg text-blue-600">{edu.institution}</p>
                        <p className="text-gray-600">{edu.field_of_study}</p>
                      </div>
                      <span className="text-sm text-gray-500">
                        {formatDate(edu.start_date)} - {formatDate(edu.end_date)}
                      </span>
                    </div>
                    {edu.description && (
                      <p className="text-gray-700">{edu.description}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Chat Sidebar */}
          <div className="lg:col-span-1">
            <ChatBot />
          </div>
        </div>
      </div>
    </div>
  );
}
