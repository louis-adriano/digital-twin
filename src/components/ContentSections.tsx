import { ProfileData } from '../types/profile';
import { useState } from 'react';

interface ContentSectionsProps {
  activeSection: string;
  profileData: ProfileData | null;
  formatDate: (dateString: string | null) => string;
  singleSection?: boolean;
}

export default function ContentSections({ activeSection, profileData, formatDate, singleSection = false }: ContentSectionsProps) {
  // If singleSection is true, only render the active section
  if (singleSection) {
    return (
      <div className="space-y-12">
        {renderSection(activeSection, profileData, formatDate)}
      </div>
    );
  }

  // Original behavior - render all sections based on activeSection
  return (
    <>
      {activeSection === "overview" && renderSection("overview", profileData, formatDate)}
      {activeSection === "experience" && renderSection("experience", profileData, formatDate)}
      {activeSection === "projects" && renderSection("projects", profileData, formatDate)}
      {activeSection === "skills" && renderSection("skills", profileData, formatDate)}
      {activeSection === "education" && renderSection("education", profileData, formatDate)}
    </>
  );
}

function renderSection(section: string, profileData: ProfileData | null, formatDate: (dateString: string | null) => string) {
  switch (section) {
    case "overview":
      return (
        <div className="space-y-12 py-12">
          <div className="max-w-3xl">
            <h2 className="font-serif text-3xl lg:text-4xl font-bold text-foreground mb-8">
              About
            </h2>
            <p className="text-lg lg:text-xl leading-relaxed text-foreground font-light font-sans">
              {profileData?.profile.bio}
            </p>
          </div>
        </div>
      );

    case "experience":
      return (
        <div className="space-y-12 py-12">
          <h2 className="font-serif text-3xl lg:text-4xl font-bold text-foreground mb-8">
            Experience
          </h2>
          
          {profileData?.experiences.map((exp) => (
            <div key={exp.id} className="pb-12 border-b border-border last:border-b-0">
              <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 lg:gap-8">
                {/* Timeline & Location */}
                <div className="lg:col-span-1">
                  <div className="space-y-1">
                    <p className="text-xs uppercase tracking-wide text-muted-foreground font-medium font-sans">
                      {formatDate(exp.start_date)}—{formatDate(exp.end_date)}
                    </p>
                    {exp.location && (
                      <p className="text-xs text-muted-foreground font-sans">{exp.location}</p>
                    )}
                  </div>
                </div>
                
                {/* Content */}
                <div className="lg:col-span-4">
                  <div className="space-y-3">
                    <h3 className="font-serif text-xl lg:text-2xl font-bold text-foreground">
                      {exp.title}
                    </h3>
                    <p className="text-lg text-secondary font-medium font-sans">
                      {exp.company}
                    </p>
                    <p className="text-base leading-relaxed text-foreground font-light font-sans max-w-2xl">
                      {exp.description}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      );

    case "projects":
      return <ProjectsGrid projects={profileData?.projects || []} />;

    case "skills":
      return (
        <div className="space-y-12 py-12">
          <h2 className="font-serif text-3xl lg:text-4xl font-bold text-foreground mb-8">
            Skills
          </h2>
          
          {profileData?.skills &&
            Object.entries(
              profileData.skills.reduce(
                (acc, skill) => {
                  if (!acc[skill.category]) acc[skill.category] = []
                  acc[skill.category].push(skill)
                  return acc
                },
                {} as Record<string, typeof profileData.skills>,
              ),
            ).map(([category, skills]) => (
              <div key={category} className="pb-8 mb-8 border-b border-border last:border-b-0">
                {/* Category Header */}
                <h3 className="font-serif text-xl font-bold text-foreground mb-6 uppercase tracking-wider">
                  {category}
                </h3>
                
                {/* Skills Compact Grid */}
                <div className="flex flex-wrap gap-3">
                  {skills.map((skill) => (
                    <div
                      key={skill.id}
                      className="group px-4 py-2 border border-border rounded-md bg-background hover:border-foreground transition-all duration-300 cursor-default"
                      title={`${skill.name}${skill.years_experience ? ` | ${skill.years_experience} years` : ''}${skill.description ? ` | ${skill.description}` : ''}`}
                    >
                      <span className="font-sans text-sm text-foreground group-hover:font-medium transition-all duration-300">
                        {skill.name}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
        </div>
      );

    case "education":
      return (
        <div className="space-y-12 py-12">
          <h2 className="font-serif text-3xl lg:text-4xl font-bold text-foreground mb-8">
            Education
          </h2>
          
          {profileData?.education.map((edu) => (
            <div key={edu.id} className="pb-12 border-b border-border last:border-b-0">
              <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 lg:gap-8">
                {/* Timeline */}
                <div className="lg:col-span-1">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground font-medium font-sans">
                    {formatDate(edu.start_date)}—{formatDate(edu.end_date)}
                  </p>
                </div>
                
                {/* Content */}
                <div className="lg:col-span-4">
                  <div className="space-y-3">
                    <h3 className="font-serif text-xl lg:text-2xl font-bold text-foreground">
                      {edu.degree}
                    </h3>
                    <p className="text-lg text-secondary font-medium font-sans">
                      {edu.institution}
                    </p>
                    {edu.field_of_study && (
                      <p className="text-base text-muted-foreground font-sans">
                        {edu.field_of_study}
                      </p>
                    )}
                    {edu.description && (
                      <p className="text-base leading-relaxed text-foreground font-light font-sans max-w-2xl">
                        {edu.description}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      );

    default:
      return (
        <div className="space-y-12 py-12">
          <div className="text-center">
            <p className="text-muted-foreground font-sans">Section not found</p>
          </div>
        </div>
      );
  }
}

// Projects Grid Component with Popover
function ProjectsGrid({ projects }: { projects: any[] }) {
  const [selectedProject, setSelectedProject] = useState<any | null>(null);

  return (
    <div className="space-y-12 py-12">
      <h2 className="font-serif text-3xl lg:text-4xl font-bold text-foreground mb-8">
        Projects
      </h2>

      {/* Grid of Project Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {projects.map((project) => (
          <button
            key={project.id}
            onClick={() => setSelectedProject(project)}
            className="group text-left bg-background border border-border hover:border-foreground transition-all duration-300 overflow-hidden hover:shadow-lg"
          >
            {/* Image Placeholder */}
            <div className="relative h-48 bg-muted overflow-hidden">
              <div className="absolute inset-0 flex items-center justify-center text-muted-foreground/40">
                <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
            </div>

            {/* Card Content */}
            <div className="p-6">
              <h3 className="font-serif text-xl font-bold text-foreground mb-3 group-hover:text-foreground/80 transition-colors">
                {project.name}
              </h3>

              <p className="text-sm text-muted-foreground font-light font-sans line-clamp-3 mb-4">
                {project.description}
              </p>

              {/* Tech Stack Preview */}
              {project.technologies && project.technologies.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {project.technologies.slice(0, 3).map((tech: string) => (
                    <span key={tech} className="text-xs text-muted-foreground border border-border px-2 py-1 font-sans">
                      {tech}
                    </span>
                  ))}
                  {project.technologies.length > 3 && (
                    <span className="text-xs text-muted-foreground font-sans">
                      +{project.technologies.length - 3} more
                    </span>
                  )}
                </div>
              )}
            </div>
          </button>
        ))}
      </div>

      {/* Popover Modal */}
      {selectedProject && (
        <div
          className="fixed inset-0 bg-background/90 backdrop-blur-md z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedProject(null)}
        >
          <div
            className="relative bg-background border border-border max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              onClick={() => setSelectedProject(null)}
              className="absolute top-6 right-6 z-10 text-muted-foreground hover:text-foreground transition-colors text-3xl w-12 h-12 flex items-center justify-center bg-background/80 backdrop-blur-sm border border-border hover:border-foreground"
              aria-label="Close"
            >
              ×
            </button>

            {/* Project Image */}
            <div className="relative h-64 lg:h-80 bg-muted overflow-hidden border-b border-border">
              <div className="absolute inset-0 flex items-center justify-center text-muted-foreground/40">
                <svg className="w-24 h-24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
            </div>

            {/* Content */}
            <div className="p-8 lg:p-12">
              {/* Title */}
              <h3 className="font-serif text-3xl lg:text-5xl font-bold text-foreground mb-4">
                {selectedProject.name}
              </h3>

              {/* Description */}
              <p className="text-base lg:text-xl leading-relaxed text-foreground font-light font-sans mb-8">
                {selectedProject.description}
              </p>

              {/* Technologies */}
              {selectedProject.technologies && selectedProject.technologies.length > 0 && (
                <div className="mb-8 pb-8 border-b border-border">
                  <p className="text-sm uppercase tracking-widest text-muted-foreground font-medium font-sans mb-4">
                    Tech Stack
                  </p>
                  <div className="flex flex-wrap gap-3">
                    {selectedProject.technologies.map((tech: string) => (
                      <span key={tech} className="text-sm text-foreground border border-border px-4 py-2 font-sans hover:border-foreground transition-colors">
                        {tech}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Links Section */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {selectedProject.github_url && (
                  <a
                    href={selectedProject.github_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-3 bg-foreground text-background hover:bg-foreground/90 transition-colors px-6 py-4 text-sm uppercase tracking-wide font-medium font-sans"
                  >
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
                    </svg>
                    View Repository
                  </a>
                )}
                {selectedProject.live_url && (
                  <a
                    href={selectedProject.live_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-3 border-2 border-foreground text-foreground hover:bg-foreground hover:text-background transition-colors px-6 py-4 text-sm uppercase tracking-wide font-medium font-sans"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                    Live Demo
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}