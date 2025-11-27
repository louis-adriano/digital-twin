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
        <div className="max-w-[900px] mx-auto relative">
          <div className="inline-block bg-primary px-4 py-1 mb-6">
            <h2 className="text-xs uppercase tracking-[0.2em] text-primary-foreground font-medium font-sans">
              01 / Summary
            </h2>
          </div>
          <p className="text-[1.1rem] leading-[1.8] text-foreground/90 font-sans">
            {profileData?.profile.portfolio_summary || profileData?.profile.summary}
          </p>
          <div className="absolute -top-4 -right-8 w-20 h-20 bg-primary/5 rounded-none -z-10"></div>
        </div>
      );

    case "experience":
      return (
        <div className="max-w-[900px] mx-auto relative">
          <div className="inline-block bg-primary px-4 py-1 mb-10">
            <h2 className="text-xs uppercase tracking-[0.2em] text-primary-foreground font-medium font-sans">
              02 / Experience
            </h2>
          </div>
          <div className="absolute top-0 -left-12 w-16 h-16 bg-primary/5 rounded-none -z-10"></div>

          <div className="space-y-12">
            {profileData?.experiences.map((exp, index) => (
              <div key={exp.id} className="group">
                <div className="flex items-start gap-8">
                  {/* Timeline dot */}
                  <div className="flex-shrink-0 mt-1">
                    <div className="w-2 h-2 rounded-full bg-primary"></div>
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-col lg:flex-row lg:items-baseline lg:justify-between gap-2 mb-3">
                      <h3 className="font-serif italic text-xl text-foreground font-light">
                        {exp.title}
                      </h3>
                      <span className="text-[0.75rem] uppercase tracking-wider text-muted-foreground font-medium whitespace-nowrap font-sans">
                        {formatDate(exp.start_date)} — {formatDate(exp.end_date)}
                      </span>
                    </div>
                    
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mb-3">
                      <p className="text-sm font-medium text-foreground font-sans">
                        {exp.company}
                      </p>
                      {exp.location && (
                        <>
                          <span className="text-muted-foreground">•</span>
                          <p className="text-sm text-muted-foreground font-sans">{exp.location}</p>
                        </>
                      )}
                    </div>

                    <p className="text-[0.95rem] leading-relaxed text-foreground/70 font-sans">
                      {exp.description}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      );

    case "projects":
      return <ProjectsGrid projects={profileData?.projects || []} />;

    case "skills":
      return (
        <div className="max-w-[900px] mx-auto relative">
          <div className="inline-block bg-primary px-4 py-1 mb-10">
            <h2 className="text-xs uppercase tracking-[0.2em] text-primary-foreground font-medium font-sans">
              05 / Skills
            </h2>
          </div>
          <div className="absolute -top-8 -right-16 w-24 h-24 bg-primary/5 rounded-none -z-10"></div>

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
              <div key={category} className="mb-10 last:mb-0">
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-8 h-[2px] bg-primary"></div>
                  <h3 className="text-[0.75rem] font-semibold text-primary uppercase tracking-[0.15em] font-sans">
                    {category}
                  </h3>
                </div>

                <div className="flex flex-wrap gap-2">
                  {skills.map((skill) => (
                    <span
                      key={skill.id}
                      className="group px-3 py-1.5 bg-background border border-border hover:border-primary hover:bg-primary/5 transition-all duration-200 cursor-default text-[0.8rem] text-foreground/80 font-sans"
                      title={`${skill.name}${skill.years_experience ? ` | ${skill.years_experience} years` : ''}${skill.description ? ` | ${skill.description}` : ''}`}
                    >
                      {skill.name}
                    </span>
                  ))}
                </div>
              </div>
            ))}
        </div>
      );

    case "education":
      return (
        <div className="max-w-[900px] mx-auto relative">
          <div className="inline-block bg-primary px-4 py-1 mb-10">
            <h2 className="text-xs uppercase tracking-[0.2em] text-primary-foreground font-medium font-sans">
              04 / Education
            </h2>
          </div>
          <div className="absolute top-0 right-0 w-20 h-20 bg-primary/5 rounded-none -z-10"></div>

          <div className="space-y-12">
            {profileData?.education.map((edu) => (
              <div key={edu.id} className="group">
                <div className="flex items-start gap-8">
                  {/* Timeline dot */}
                  <div className="flex-shrink-0 mt-1">
                    <div className="w-2 h-2 rounded-full bg-primary"></div>
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-col lg:flex-row lg:items-baseline lg:justify-between gap-2 mb-3">
                      <h3 className="font-serif italic text-xl text-foreground font-light">
                        {edu.degree}
                      </h3>
                      <span className="text-[0.75rem] uppercase tracking-wider text-muted-foreground font-medium whitespace-nowrap font-sans">
                        {formatDate(edu.start_date)} — {formatDate(edu.end_date)}
                      </span>
                    </div>
                    
                    <div className="mb-3">
                      <p className="text-sm font-medium text-foreground font-sans">
                        {edu.institution}
                      </p>
                      {edu.field_of_study && (
                        <p className="text-sm text-muted-foreground mt-1 font-sans">
                          {edu.field_of_study}
                        </p>
                      )}
                    </div>

                    {edu.description && (
                      <p className="text-[0.95rem] leading-relaxed text-foreground/70 font-sans">
                        {edu.description}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
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
    <div className="max-w-[900px] mx-auto relative">
      <div className="inline-block bg-primary px-4 py-1 mb-10">
        <h2 className="text-xs uppercase tracking-[0.2em] text-primary-foreground font-medium font-sans">
          03 / Projects
        </h2>
      </div>
      <div className="absolute -top-6 right-20 w-16 h-16 bg-primary/5 rounded-none -z-10"></div>

      {/* List of Project Cards */}
      <div className="space-y-6">
        {projects.map((project, index) => (
          <button
            key={project.id}
            onClick={() => setSelectedProject(project)}
            className="group w-full text-left bg-transparent border border-border hover:border-primary transition-all duration-300 p-6"
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
                    {project.status || "Project"}
                  </span>
                </div>

                <p className="text-[0.9rem] text-foreground/70 leading-relaxed mb-4 line-clamp-2 font-sans">
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
                    {project.technologies.length > 5 && (
                      <span className="text-[0.7rem] px-2 py-1 text-muted-foreground font-sans">
                        +{project.technologies.length - 5} more
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Arrow */}
              <div className="flex-shrink-0 text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
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
            <div className="relative h-64 lg:h-80 bg-primary overflow-hidden border-b border-border">
              <div className="absolute inset-0 flex items-center justify-center text-primary-foreground/60">
                <svg className="w-24 h-24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
                </svg>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 lg:p-8">
              {/* Title */}
              <h3 className="font-serif italic text-xl lg:text-2xl font-light text-foreground mb-3">
                {selectedProject.name}
              </h3>

              {/* Description */}
              <p className="text-[0.95rem] leading-relaxed text-foreground/70 font-sans mb-6">
                {selectedProject.description}
              </p>

              {/* Technologies */}
              {selectedProject.technologies && selectedProject.technologies.length > 0 && (
                <div className="mb-6 pb-6 border-b border-border">
                  <p className="text-[0.7rem] uppercase tracking-widest text-muted-foreground font-medium font-sans mb-3">
                    Tech Stack
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {selectedProject.technologies.map((tech: string) => (
                      <span key={tech} className="text-[0.8rem] text-foreground border border-border px-3 py-1.5 font-sans hover:border-foreground transition-colors">
                        {tech}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Links Section */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {selectedProject.github_url && (
                  <a
                    href={selectedProject.github_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 bg-primary text-primary-foreground hover:bg-[#3d6149] transition-all px-5 py-2.5 text-[0.8rem] uppercase tracking-wide font-medium font-sans rounded-[30px]"
                  >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
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
                    className="flex items-center justify-center gap-2 border-2 border-foreground text-foreground hover:bg-foreground hover:text-background transition-all px-5 py-2.5 text-[0.8rem] uppercase tracking-wide font-medium font-sans rounded-[30px]"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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