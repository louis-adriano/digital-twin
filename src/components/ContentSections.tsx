import { ProfileData } from '../types/profile';

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
      return (
        <div className="space-y-12 py-12">
          <h2 className="font-serif text-3xl lg:text-4xl font-bold text-foreground mb-8">
            Projects
          </h2>
          
          {profileData?.projects.map((project) => (
            <div key={project.id} className="pb-12 border-b border-border last:border-b-0">
              <div className="space-y-4">
                <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start gap-4">
                  <div className="flex-1">
                    <h3 className="font-serif text-xl lg:text-2xl font-bold text-foreground mb-3">
                      {project.name}
                    </h3>
                    <p className="text-base leading-relaxed text-foreground font-light font-sans max-w-2xl mb-4">
                      {project.description}
                    </p>
                    
                    {/* Links */}
                    <div className="flex gap-4 mb-4">
                      {project.github_url && (
                        <a
                          href={project.github_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-foreground hover:text-muted-foreground transition-colors text-sm uppercase tracking-wide font-medium font-sans"
                        >
                          Code
                        </a>
                      )}
                      {project.live_url && (
                        <a
                          href={project.live_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-foreground hover:text-muted-foreground transition-colors text-sm uppercase tracking-wide font-medium font-sans"
                        >
                          Demo
                        </a>
                      )}
                    </div>
                  </div>
                  
                  {/* Technologies */}
                  <div className="lg:w-64">
                    <p className="text-xs uppercase tracking-wide text-muted-foreground font-medium font-sans mb-2">
                      Stack
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {project.technologies.map((tech) => (
                        <span key={tech} className="text-xs text-foreground bg-muted px-2 py-1 font-sans">
                          {tech}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      );

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
              <div key={category} className="pb-8 border-b border-border last:border-b-0">
                <h3 className="font-serif text-xl font-bold text-foreground mb-6">
                  {category}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {skills.map((skill) => (
                    <div key={skill.id} className="space-y-2">
                      <div className="flex justify-between items-baseline">
                        <span className="font-medium text-foreground font-sans">
                          {skill.name}
                        </span>
                        <span className="text-xs text-muted-foreground font-sans">
                          {skill.years_experience}y
                        </span>
                      </div>
                      <div className="w-full bg-muted h-0.5">
                        <div
                          className="h-0.5 bg-foreground"
                          style={{
                            width: `${(skill.proficiency_level / 5) * 100}%`,
                          }}
                        />
                      </div>
                      <span className="text-xs text-muted-foreground font-sans">
                        Level {skill.proficiency_level}/5
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