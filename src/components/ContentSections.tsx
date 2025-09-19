import { ProfileData } from '../types/profile';

interface ContentSectionsProps {
  activeSection: string;
  profileData: ProfileData | null;
  formatDate: (dateString: string | null) => string;
}

export default function ContentSections({ activeSection, profileData, formatDate }: ContentSectionsProps) {
  return (
    <>
      {/* Overview */}
      {activeSection === "overview" && (
        <div className="space-y-12 min-h-screen py-16">
          <div className="border-l-2 border-foreground pl-8">
            <h2 className="font-serif text-4xl lg:text-5xl font-bold text-foreground mb-8 text-balance">
              About
            </h2>
            <div className="max-w-3xl">
              <p className="text-xl lg:text-2xl leading-relaxed text-foreground font-light font-sans text-pretty">
                {profileData?.profile.bio}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Experience */}
      {activeSection === "experience" && (
        <div className="space-y-16 min-h-screen py-16">
          <h2 className="font-serif text-4xl lg:text-5xl font-bold text-foreground text-balance">Experience</h2>
          {profileData?.experiences.map((exp, index) => (
            <div
              key={exp.id}
              className={`grid grid-cols-1 lg:grid-cols-3 gap-8 ${index % 2 === 1 ? "lg:grid-flow-col-dense" : ""}`}
            >
              <div className={`lg:col-span-1 ${index % 2 === 1 ? "lg:col-start-3" : ""}`}>
                <p className="text-sm uppercase tracking-widest text-muted-foreground mb-2 font-sans">
                  {formatDate(exp.start_date)} - {formatDate(exp.end_date)}
                </p>
                <p className="text-muted-foreground font-sans">{exp.location}</p>
              </div>
              <div className={`lg:col-span-2 ${index % 2 === 1 ? "lg:col-start-1" : ""}`}>
                <h3 className="font-serif text-2xl lg:text-3xl font-bold text-foreground mb-2 text-balance">
                  {exp.title}
                </h3>
                <p className="text-xl text-muted-foreground mb-4 font-sans">{exp.company}</p>
                <div className="max-w-2xl">
                  <p className="text-lg leading-relaxed text-foreground font-light font-sans">
                    {exp.description}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Projects */}
      {activeSection === "projects" && (
        <div className="space-y-16 min-h-screen py-16">
          <h2 className="font-serif text-4xl lg:text-5xl font-bold text-foreground text-balance">Projects</h2>
          {profileData?.projects.map((project, index) => (
            <div key={project.id} className="space-y-8">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
                <div>
                  <h3 className="font-serif text-3xl font-bold text-foreground mb-4 text-balance">
                    {project.name}
                  </h3>
                  <div className="max-w-xl">
                    <p className="text-lg leading-relaxed text-foreground font-light mb-6 font-sans">
                      {project.description}
                    </p>
                  </div>
                  <div className="flex space-x-6">
                    {project.github_url && (
                      <a
                        href={project.github_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-foreground hover:text-muted-foreground transition-colors text-sm uppercase tracking-wide font-sans"
                      >
                        GitHub
                      </a>
                    )}
                    {project.live_url && (
                      <a
                        href={project.live_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-foreground hover:text-muted-foreground transition-colors text-sm uppercase tracking-wide font-sans"
                      >
                        Live Demo
                      </a>
                    )}
                  </div>
                </div>
                <div>
                  <p className="text-sm uppercase tracking-widest text-muted-foreground mb-4 font-sans">Technologies</p>
                  <div className="flex flex-wrap gap-2">
                    {project.technologies.map((tech) => (
                      <span key={tech} className="px-3 py-1 border border-border text-muted-foreground text-sm font-sans">
                        {tech}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
              {index < profileData.projects.length - 1 && <div className="w-full h-px bg-border mt-16" />}
            </div>
          ))}
        </div>
      )}

      {/* Skills */}
      {activeSection === "skills" && (
        <div className="space-y-16 min-h-screen py-16">
          <h2 className="font-serif text-4xl lg:text-5xl font-bold text-foreground text-balance">Skills</h2>
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
              <div key={category} className="space-y-8">
                <h3 className="font-serif text-2xl font-bold text-foreground border-b border-border pb-4">
                  {category}
                </h3>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {skills.map((skill) => (
                    <div key={skill.id} className="space-y-2">
                      <div className="flex justify-between items-baseline">
                        <span className="font-medium text-foreground font-sans">{skill.name}</span>
                        <span className="text-sm text-muted-foreground font-sans">{skill.years_experience} years</span>
                      </div>
                      <div className="w-full bg-muted h-1">
                        <div
                          className="h-1 bg-foreground"
                          style={{
                            width: `${(skill.proficiency_level / 5) * 100}%`,
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
        </div>
      )}

      {/* Education */}
      {activeSection === "education" && (
        <div className="space-y-16 min-h-screen py-16">
          <h2 className="font-serif text-4xl lg:text-5xl font-bold text-foreground text-balance">Education</h2>
          {profileData?.education.map((edu) => (
            <div key={edu.id} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-1">
                <p className="text-sm uppercase tracking-widest text-muted-foreground mb-2 font-sans">
                  {formatDate(edu.start_date)} - {formatDate(edu.end_date)}
                </p>
              </div>
              <div className="lg:col-span-2">
                <h3 className="font-serif text-3xl font-bold text-foreground mb-2 text-balance">
                  {edu.degree}
                </h3>
                <p className="text-xl text-muted-foreground mb-2 font-sans">{edu.institution}</p>
                <p className="text-muted-foreground mb-4 font-sans">{edu.field_of_study}</p>
                {edu.description && (
                  <div className="max-w-2xl">
                    <p className="text-lg leading-relaxed text-foreground font-light font-sans">
                      {edu.description}
                    </p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}