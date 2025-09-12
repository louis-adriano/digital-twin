import { connectAndQuery, handleError } from '../index.js';
// Context enrichment tools
export const contextTools = [
    {
        name: 'get_complete_profile',
        description: 'Get comprehensive professional profile including all experiences, skills, projects, and education',
        inputSchema: {
            type: 'object',
            properties: {
                include_details: {
                    type: 'boolean',
                    description: 'Include detailed descriptions and achievements (default: true)',
                    default: true
                },
                section_filter: {
                    type: 'array',
                    items: {
                        type: 'string',
                        enum: ['profile', 'experiences', 'skills', 'projects', 'education']
                    },
                    description: 'Filter to specific sections (default: all sections)'
                }
            },
            required: []
        }
    },
    {
        name: 'get_career_progression',
        description: 'Analyze and present career progression and growth trajectory',
        inputSchema: {
            type: 'object',
            properties: {
                focus: {
                    type: 'string',
                    enum: ['roles', 'technologies', 'responsibilities', 'achievements'],
                    description: 'Focus area for career progression analysis'
                }
            },
            required: []
        }
    },
    {
        name: 'get_technical_expertise',
        description: 'Get detailed technical expertise breakdown with proficiency levels and experience',
        inputSchema: {
            type: 'object',
            properties: {
                technology_category: {
                    type: 'string',
                    description: 'Filter by specific technology category (e.g., "Programming Languages", "Frontend Frameworks")'
                },
                min_proficiency: {
                    type: 'number',
                    minimum: 1,
                    maximum: 5,
                    description: 'Minimum proficiency level to include (1-5)'
                }
            },
            required: []
        }
    },
    {
        name: 'get_project_portfolio',
        description: 'Get comprehensive project portfolio with detailed descriptions and technology stacks',
        inputSchema: {
            type: 'object',
            properties: {
                status_filter: {
                    type: 'string',
                    enum: ['completed', 'in-progress', 'on-hold', 'planning'],
                    description: 'Filter projects by status'
                },
                include_links: {
                    type: 'boolean',
                    description: 'Include GitHub and live demo links (default: true)',
                    default: true
                }
            },
            required: []
        }
    },
    {
        name: 'generate_professional_summary',
        description: 'Generate a contextual professional summary based on specific focus or audience',
        inputSchema: {
            type: 'object',
            properties: {
                audience: {
                    type: 'string',
                    enum: ['recruiter', 'technical-team', 'client', 'general'],
                    description: 'Target audience for the summary'
                },
                focus_area: {
                    type: 'string',
                    description: 'Specific focus area or technology to emphasize'
                },
                length: {
                    type: 'string',
                    enum: ['brief', 'standard', 'detailed'],
                    description: 'Length of the summary (default: standard)',
                    default: 'standard'
                }
            },
            required: []
        }
    },
    {
        name: 'get_achievement_highlights',
        description: 'Extract and present key achievements and impact metrics across all experiences',
        inputSchema: {
            type: 'object',
            properties: {
                category: {
                    type: 'string',
                    enum: ['leadership', 'technical', 'business-impact', 'innovation'],
                    description: 'Filter achievements by category'
                }
            },
            required: []
        }
    }
];
// Tool handlers
export const handleGetCompleteProfile = async (args) => {
    try {
        const { include_details = true, section_filter } = args;
        const sections = section_filter || ['profile', 'experiences', 'skills', 'projects', 'education'];
        let completeProfile = `# Complete Professional Profile\n\n`;
        // Profile section
        if (sections.includes('profile')) {
            const profile = await connectAndQuery(async (client) => {
                const result = await client.query('SELECT * FROM professionals LIMIT 1');
                return result.rows[0];
            });
            if (profile) {
                completeProfile += `## 👤 Professional Profile\n\n`;
                completeProfile += `**${profile.name}**\n`;
                if (profile.title)
                    completeProfile += `*${profile.title}*\n`;
                if (profile.location)
                    completeProfile += `📍 ${profile.location}\n`;
                completeProfile += `📧 ${profile.email}\n\n`;
                if (profile.summary && include_details) {
                    completeProfile += `**Professional Summary:**\n${profile.summary}\n\n`;
                }
                if (profile.linkedin_url || profile.github_url || profile.website_url) {
                    completeProfile += `**Professional Links:**\n`;
                    if (profile.linkedin_url)
                        completeProfile += `• [LinkedIn](${profile.linkedin_url})\n`;
                    if (profile.github_url)
                        completeProfile += `• [GitHub](${profile.github_url})\n`;
                    if (profile.website_url)
                        completeProfile += `• [Website](${profile.website_url})\n`;
                    completeProfile += `\n`;
                }
            }
        }
        // Experiences section
        if (sections.includes('experiences')) {
            const experiences = await connectAndQuery(async (client) => {
                const result = await client.query(`
          SELECT * FROM experiences 
          ORDER BY start_date DESC
        `);
                return result.rows;
            });
            if (experiences.length > 0) {
                completeProfile += `## 💼 Professional Experience\n\n`;
                experiences.forEach((exp, index) => {
                    const duration = exp.end_date
                        ? `${exp.start_date.toISOString().split('T')[0]} to ${exp.end_date.toISOString().split('T')[0]}`
                        : `${exp.start_date.toISOString().split('T')[0]} to Present`;
                    completeProfile += `### ${exp.position} at ${exp.company}\n`;
                    completeProfile += `📅 ${duration}`;
                    if (exp.location)
                        completeProfile += ` | 📍 ${exp.location}`;
                    completeProfile += `\n\n`;
                    if (exp.description && include_details) {
                        completeProfile += `${exp.description}\n\n`;
                    }
                    if (exp.achievements && exp.achievements.length > 0 && include_details) {
                        completeProfile += `**Key Achievements:**\n`;
                        exp.achievements.forEach((achievement) => {
                            completeProfile += `• ${achievement}\n`;
                        });
                        completeProfile += `\n`;
                    }
                    if (exp.technologies && exp.technologies.length > 0) {
                        completeProfile += `**Technologies:** ${exp.technologies.join(', ')}\n\n`;
                    }
                    completeProfile += `---\n\n`;
                });
            }
        }
        // Skills section
        if (sections.includes('skills')) {
            const skills = await connectAndQuery(async (client) => {
                const result = await client.query(`
          SELECT * FROM skills 
          ORDER BY category, proficiency_level DESC, name
        `);
                return result.rows;
            });
            if (skills.length > 0) {
                completeProfile += `## 🛠️ Technical Skills\n\n`;
                // Group by category
                const skillsByCategory = {};
                skills.forEach((skill) => {
                    if (!skillsByCategory[skill.category]) {
                        skillsByCategory[skill.category] = [];
                    }
                    skillsByCategory[skill.category].push(skill);
                });
                Object.entries(skillsByCategory).forEach(([category, catSkills]) => {
                    completeProfile += `### ${category}\n\n`;
                    catSkills.forEach((skill) => {
                        const proficiencyText = ['', 'Beginner', 'Basic', 'Intermediate', 'Advanced', 'Expert'][skill.proficiency_level];
                        completeProfile += `• **${skill.name}** - ${proficiencyText} (${skill.proficiency_level}/5)`;
                        if (skill.years_experience) {
                            completeProfile += ` | ${skill.years_experience} years`;
                        }
                        completeProfile += `\n`;
                        if (skill.description && include_details) {
                            completeProfile += `  *${skill.description}*\n`;
                        }
                    });
                    completeProfile += `\n`;
                });
            }
        }
        // Projects section
        if (sections.includes('projects')) {
            const projects = await connectAndQuery(async (client) => {
                const result = await client.query(`
          SELECT * FROM projects 
          ORDER BY start_date DESC NULLS LAST
        `);
                return result.rows;
            });
            if (projects.length > 0) {
                completeProfile += `## 🚀 Projects\n\n`;
                projects.forEach((project) => {
                    completeProfile += `### ${project.name}\n`;
                    if (project.status) {
                        const statusIcon = {
                            'completed': '✅',
                            'in-progress': '🔄',
                            'on-hold': '⏸️',
                            'planning': '📋'
                        }[project.status] || '📝';
                        completeProfile += `${statusIcon} Status: ${project.status.charAt(0).toUpperCase() + project.status.slice(1).replace('-', ' ')}\n`;
                    }
                    if (project.start_date) {
                        const duration = project.end_date
                            ? `${project.start_date.toISOString().split('T')[0]} to ${project.end_date.toISOString().split('T')[0]}`
                            : `${project.start_date.toISOString().split('T')[0]} to Present`;
                        completeProfile += `📅 ${duration}\n`;
                    }
                    completeProfile += `\n`;
                    if (project.description && include_details) {
                        completeProfile += `${project.description}\n\n`;
                    }
                    if (project.technologies && project.technologies.length > 0) {
                        completeProfile += `**Technologies:** ${project.technologies.join(', ')}\n\n`;
                    }
                    if (project.highlights && project.highlights.length > 0 && include_details) {
                        completeProfile += `**Key Highlights:**\n`;
                        project.highlights.forEach((highlight) => {
                            completeProfile += `• ${highlight}\n`;
                        });
                        completeProfile += `\n`;
                    }
                    const links = [];
                    if (project.github_url)
                        links.push(`[GitHub](${project.github_url})`);
                    if (project.live_url)
                        links.push(`[Live Demo](${project.live_url})`);
                    if (links.length > 0) {
                        completeProfile += `**Links:** ${links.join(' | ')}\n`;
                    }
                    completeProfile += `\n---\n\n`;
                });
            }
        }
        // Education section
        if (sections.includes('education')) {
            const education = await connectAndQuery(async (client) => {
                const result = await client.query(`
          SELECT * FROM education 
          ORDER BY start_date DESC NULLS LAST
        `);
                return result.rows;
            });
            if (education.length > 0) {
                completeProfile += `## 🎓 Education\n\n`;
                education.forEach((edu) => {
                    completeProfile += `### ${edu.degree}`;
                    if (edu.field_of_study)
                        completeProfile += ` in ${edu.field_of_study}`;
                    completeProfile += `\n`;
                    completeProfile += `${edu.institution}\n`;
                    if (edu.start_date) {
                        const duration = edu.end_date
                            ? `${edu.start_date.toISOString().split('T')[0]} to ${edu.end_date.toISOString().split('T')[0]}`
                            : `${edu.start_date.toISOString().split('T')[0]} to Present`;
                        completeProfile += `📅 ${duration}\n`;
                    }
                    if (edu.gpa) {
                        completeProfile += `📊 GPA: ${edu.gpa}\n`;
                    }
                    if (edu.description && include_details) {
                        completeProfile += `\n${edu.description}\n`;
                    }
                    if (edu.achievements && edu.achievements.length > 0 && include_details) {
                        completeProfile += `\n**Achievements:**\n`;
                        edu.achievements.forEach((achievement) => {
                            completeProfile += `• ${achievement}\n`;
                        });
                    }
                    completeProfile += `\n---\n\n`;
                });
            }
        }
        return {
            content: [{
                    type: 'text',
                    text: completeProfile
                }]
        };
    }
    catch (error) {
        return handleError(error, 'get complete profile');
    }
};
export const handleGetCareerProgression = async (args) => {
    try {
        const { focus } = args;
        const experiences = await connectAndQuery(async (client) => {
            const result = await client.query(`
        SELECT * FROM experiences 
        ORDER BY start_date ASC
      `);
            return result.rows;
        });
        if (experiences.length === 0) {
            return {
                content: [{
                        type: 'text',
                        text: 'No experience data available for career progression analysis.'
                    }]
            };
        }
        let progressionAnalysis = `# Career Progression Analysis\n\n`;
        // Timeline overview
        progressionAnalysis += `## 📈 Career Timeline\n\n`;
        experiences.forEach((exp, index) => {
            const duration = exp.end_date
                ? `${exp.start_date.toISOString().split('T')[0]} to ${exp.end_date.toISOString().split('T')[0]}`
                : `${exp.start_date.toISOString().split('T')[0]} to Present`;
            progressionAnalysis += `${index + 1}. **${exp.position}** at ${exp.company} (${duration})\n`;
        });
        progressionAnalysis += `\n`;
        // Focus-specific analysis
        if (focus === 'roles') {
            progressionAnalysis += `## 🎯 Role Evolution\n\n`;
            experiences.forEach((exp, index) => {
                if (index > 0) {
                    progressionAnalysis += `**Career Progression:** ${experiences[index - 1].position} → **${exp.position}**\n`;
                    progressionAnalysis += `• Company: ${exp.company}\n`;
                    if (exp.description) {
                        progressionAnalysis += `• Key Focus: ${exp.description.split('.')[0]}.\n`;
                    }
                    progressionAnalysis += `\n`;
                }
            });
        }
        else if (focus === 'technologies') {
            progressionAnalysis += `## 💻 Technology Evolution\n\n`;
            const allTechnologies = new Set();
            experiences.forEach((exp) => {
                if (exp.technologies && exp.technologies.length > 0) {
                    exp.technologies.forEach((tech) => allTechnologies.add(tech));
                }
            });
            progressionAnalysis += `**Technology Stack Growth:** ${allTechnologies.size} technologies across ${experiences.length} roles\n\n`;
            experiences.forEach((exp, index) => {
                if (exp.technologies && exp.technologies.length > 0) {
                    progressionAnalysis += `**${exp.position} at ${exp.company}:**\n`;
                    progressionAnalysis += `Technologies: ${exp.technologies.join(', ')}\n\n`;
                }
            });
        }
        else if (focus === 'achievements') {
            progressionAnalysis += `## 🏆 Achievement Highlights\n\n`;
            experiences.forEach((exp) => {
                if (exp.achievements && exp.achievements.length > 0) {
                    progressionAnalysis += `**${exp.position} at ${exp.company}:**\n`;
                    exp.achievements.forEach((achievement) => {
                        progressionAnalysis += `• ${achievement}\n`;
                    });
                    progressionAnalysis += `\n`;
                }
            });
        }
        else {
            // General progression analysis
            progressionAnalysis += `## 📊 Progression Insights\n\n`;
            // Calculate career span
            const startDate = new Date(experiences[0].start_date);
            const endDate = experiences[experiences.length - 1].end_date
                ? new Date(experiences[experiences.length - 1].end_date)
                : new Date();
            const careerYears = Math.round((endDate.getTime() - startDate.getTime()) / (365.25 * 24 * 60 * 60 * 1000) * 10) / 10;
            progressionAnalysis += `**Career Statistics:**\n`;
            progressionAnalysis += `• Total Experience: ${careerYears} years\n`;
            progressionAnalysis += `• Number of Positions: ${experiences.length}\n`;
            progressionAnalysis += `• Average Tenure: ${Math.round(careerYears / experiences.length * 10) / 10} years per role\n\n`;
            // Technology growth
            const uniqueTech = new Set();
            experiences.forEach((exp) => {
                if (exp.technologies) {
                    exp.technologies.forEach((tech) => uniqueTech.add(tech));
                }
            });
            if (uniqueTech.size > 0) {
                progressionAnalysis += `**Technical Growth:**\n`;
                progressionAnalysis += `• Technologies Mastered: ${uniqueTech.size}\n`;
                progressionAnalysis += `• Tech per Role Average: ${Math.round(uniqueTech.size / experiences.length * 10) / 10}\n\n`;
            }
            // Company diversity
            const companies = [...new Set(experiences.map((exp) => exp.company))];
            progressionAnalysis += `**Professional Diversity:**\n`;
            progressionAnalysis += `• Organizations: ${companies.length}\n`;
            progressionAnalysis += `• Industries Exposure: ${companies.join(', ')}\n`;
        }
        return {
            content: [{
                    type: 'text',
                    text: progressionAnalysis
                }]
        };
    }
    catch (error) {
        return handleError(error, 'get career progression');
    }
};
export const handleGenerateProfessionalSummary = async (args) => {
    try {
        const { audience = 'general', focus_area, length = 'standard' } = args;
        // Get profile and key data
        const [profile, experiences, skills, projects] = await Promise.all([
            connectAndQuery(async (client) => {
                const result = await client.query('SELECT * FROM professionals LIMIT 1');
                return result.rows[0];
            }),
            connectAndQuery(async (client) => {
                const result = await client.query('SELECT * FROM experiences ORDER BY start_date DESC LIMIT 3');
                return result.rows;
            }),
            connectAndQuery(async (client) => {
                const result = await client.query('SELECT * FROM skills WHERE proficiency_level >= 4 ORDER BY proficiency_level DESC, years_experience DESC LIMIT 8');
                return result.rows;
            }),
            connectAndQuery(async (client) => {
                const result = await client.query('SELECT * FROM projects WHERE status = \'completed\' ORDER BY start_date DESC LIMIT 3');
                return result.rows;
            })
        ]);
        if (!profile) {
            return {
                content: [{
                        type: 'text',
                        text: 'No professional profile found to generate summary.'
                    }]
            };
        }
        let summary = `# Professional Summary\n\n`;
        // Audience-specific introduction
        const introductions = {
            recruiter: `## For Hiring Managers & Recruiters\n\n**${profile.name}** is a ${profile.title || 'seasoned professional'} with a proven track record of delivering high-quality solutions and driving technical excellence.`,
            'technical-team': `## Technical Overview\n\n**${profile.name}** brings deep technical expertise and collaborative experience to development teams, with strong capabilities in modern technologies and best practices.`,
            client: `## Professional Consultation\n\n**${profile.name}** offers comprehensive technical consulting and development services, with a focus on delivering business value through innovative solutions.`,
            general: `## Professional Profile\n\n**${profile.name}** is a ${profile.title || 'dedicated professional'} passionate about creating impactful solutions through technology and innovation.`
        };
        summary += introductions[audience] || introductions.general;
        summary += `\n\n`;
        // Core competencies based on skills
        if (skills.length > 0) {
            summary += `**Core Competencies:**\n`;
            const topSkills = skills.slice(0, length === 'brief' ? 4 : 6);
            topSkills.forEach((skill) => {
                const proficiencyText = ['', 'Beginner', 'Basic', 'Intermediate', 'Advanced', 'Expert'][skill.proficiency_level];
                summary += `• ${skill.name} (${proficiencyText})`;
                if (skill.years_experience) {
                    summary += ` - ${skill.years_experience} years`;
                }
                summary += `\n`;
            });
            summary += `\n`;
        }
        // Experience highlights
        if (experiences.length > 0 && length !== 'brief') {
            summary += `**Recent Experience Highlights:**\n`;
            const expCount = length === 'detailed' ? 3 : 2;
            experiences.slice(0, expCount).forEach((exp) => {
                summary += `• **${exp.position}** at ${exp.company}`;
                if (exp.achievements && exp.achievements.length > 0) {
                    summary += ` - ${exp.achievements[0]}`;
                }
                summary += `\n`;
            });
            summary += `\n`;
        }
        // Project achievements
        if (projects.length > 0 && length === 'detailed') {
            summary += `**Notable Projects:**\n`;
            projects.slice(0, 2).forEach((project) => {
                summary += `• **${project.name}**`;
                if (project.technologies && project.technologies.length > 0) {
                    summary += ` (${project.technologies.slice(0, 3).join(', ')})`;
                }
                if (project.highlights && project.highlights.length > 0) {
                    summary += ` - ${project.highlights[0]}`;
                }
                summary += `\n`;
            });
            summary += `\n`;
        }
        // Focus area emphasis
        if (focus_area) {
            summary += `**${focus_area} Expertise:**\n`;
            // Find relevant skills and experiences
            const relevantSkills = skills.filter((skill) => skill.name.toLowerCase().includes(focus_area.toLowerCase()) ||
                skill.category.toLowerCase().includes(focus_area.toLowerCase()));
            const relevantExperiences = experiences.filter((exp) => (exp.description && exp.description.toLowerCase().includes(focus_area.toLowerCase())) ||
                (exp.technologies && exp.technologies.some((tech) => tech.toLowerCase().includes(focus_area.toLowerCase()))));
            if (relevantSkills.length > 0) {
                summary += `Skills: ${relevantSkills.map((s) => s.name).join(', ')}\n`;
            }
            if (relevantExperiences.length > 0) {
                summary += `Applied in roles: ${relevantExperiences.map((e) => `${e.position} at ${e.company}`).join(', ')}\n`;
            }
            summary += `\n`;
        }
        // Closing based on audience
        const closings = {
            recruiter: `**Value Proposition:** Ready to contribute immediately with strong technical skills, proven delivery record, and collaborative approach to achieving business objectives.`,
            'technical-team': `**Technical Fit:** Experienced in modern development practices, code quality standards, and team collaboration with a continuous learning mindset.`,
            client: `**Service Excellence:** Committed to understanding business needs and delivering solutions that drive measurable results and long-term success.`,
            general: `**Professional Approach:** Combines technical expertise with business acumen to deliver innovative solutions and drive meaningful impact.`
        };
        summary += closings[audience] || closings.general;
        // Contact information
        summary += `\n\n**Contact:** ${profile.email}`;
        if (profile.linkedin_url) {
            summary += ` | [LinkedIn](${profile.linkedin_url})`;
        }
        if (profile.github_url) {
            summary += ` | [GitHub](${profile.github_url})`;
        }
        return {
            content: [{
                    type: 'text',
                    text: summary
                }]
        };
    }
    catch (error) {
        return handleError(error, 'generate professional summary');
    }
};
