import { Tool, CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { connectAndQuery, handleError } from '../index.js';

// Contact and availability tools
export const contactTools: Tool[] = [
  {
    name: 'get_contact_info',
    description: 'Retrieve professional contact information and social media links',
    inputSchema: {
      type: 'object',
      properties: {
        include_personal: {
          type: 'boolean',
          description: 'Include personal contact details like phone number (default: false)',
          default: false
        }
      },
      required: []
    }
  },
  {
    name: 'get_availability_status',
    description: 'Get current availability status for interviews, projects, or consulting',
    inputSchema: {
      type: 'object',
      properties: {
        opportunity_type: {
          type: 'string',
          enum: ['full-time', 'part-time', 'contract', 'consulting', 'interview'],
          description: 'Type of opportunity to check availability for'
        }
      },
      required: []
    }
  },
  {
    name: 'get_preferred_contact_method',
    description: 'Get preferred contact methods for different types of inquiries',
    inputSchema: {
      type: 'object',
      properties: {
        inquiry_type: {
          type: 'string',
          enum: ['job-opportunity', 'collaboration', 'consulting', 'speaking', 'general'],
          description: 'Type of inquiry to get preferred contact method for'
        }
      },
      required: []
    }
  },
  {
    name: 'generate_introduction_email',
    description: 'Generate a professional introduction email template based on context',
    inputSchema: {
      type: 'object',
      properties: {
        context: {
          type: 'string',
          description: 'Context or purpose of the introduction (e.g., job opportunity, collaboration)'
        },
        company_name: {
          type: 'string',
          description: 'Name of the company or organization (optional)'
        },
        role_title: {
          type: 'string',
          description: 'Specific role or position being discussed (optional)'
        }
      },
      required: ['context']
    }
  }
];

// Tool handlers
export const handleGetContactInfo = async (args: any): Promise<CallToolResult> => {
  try {
    const { include_personal = false } = args;

    const profile = await connectAndQuery(async (client) => {
      const result = await client.query('SELECT * FROM professionals LIMIT 1');
      return result.rows[0];
    });

    if (!profile) {
      return {
        content: [{
          type: 'text',
          text: 'No professional profile found.'
        }]
      };
    }

    let contactInfo = `**Professional Contact Information**\n\n`;
    contactInfo += `👤 **Name:** ${profile.name}\n`;
    contactInfo += `📧 **Email:** ${profile.email}\n`;

    if (profile.location) {
      contactInfo += `📍 **Location:** ${profile.location}\n`;
    }

    contactInfo += `\n**Professional Links:**\n`;
    
    if (profile.linkedin_url) {
      contactInfo += `🔗 **LinkedIn:** ${profile.linkedin_url}\n`;
    }
    
    if (profile.github_url) {
      contactInfo += `🔗 **GitHub:** ${profile.github_url}\n`;
    }
    
    if (profile.website_url) {
      contactInfo += `🔗 **Website:** ${profile.website_url}\n`;
    }

    // Add current role/title if available
    if (profile.title) {
      contactInfo += `\n💼 **Current Title:** ${profile.title}\n`;
    }

    return {
      content: [{
        type: 'text',
        text: contactInfo
      }]
    };
  } catch (error) {
    return handleError(error, 'get contact info');
  }
};

export const handleGetAvailabilityStatus = async (args: any): Promise<CallToolResult> => {
  try {
    const { opportunity_type } = args;

    // For demo purposes, we'll provide a comprehensive availability status
    // In a real implementation, this might check a calendar API or database
    
    let availabilityInfo = `**Professional Availability Status**\n\n`;

    // Current availability matrix
    const availabilityMatrix = {
      'full-time': {
        status: 'Open to opportunities',
        details: 'Currently exploring new full-time opportunities that align with my expertise in full-stack development.',
        timeline: 'Available to start within 2-4 weeks',
        preferences: 'Remote, hybrid, or on-site positions considered'
      },
      'part-time': {
        status: 'Limited availability',
        details: 'Open to part-time roles that complement current commitments.',
        timeline: '15-20 hours per week maximum',
        preferences: 'Flexible scheduling preferred'
      },
      'contract': {
        status: 'Available',
        details: 'Open to short-term and long-term contract opportunities.',
        timeline: 'Can start within 1-2 weeks',
        preferences: 'Remote work preferred, project-based engagement'
      },
      'consulting': {
        status: 'Available',
        details: 'Available for technical consulting, code reviews, and architectural guidance.',
        timeline: 'Immediate availability for discussions',
        preferences: 'Hourly or project-based consulting'
      },
      'interview': {
        status: 'Available',
        details: 'Available for interviews and technical discussions.',
        timeline: 'Can schedule within 24-48 hours',
        preferences: 'Video calls preferred, flexible with time zones'
      }
    };

    if (opportunity_type && availabilityMatrix[opportunity_type as keyof typeof availabilityMatrix]) {
      const details = availabilityMatrix[opportunity_type as keyof typeof availabilityMatrix];
      availabilityInfo += `**${opportunity_type.charAt(0).toUpperCase() + opportunity_type.slice(1).replace('-', ' ')} Opportunities**\n`;
      availabilityInfo += `📊 **Status:** ${details.status}\n`;
      availabilityInfo += `📋 **Details:** ${details.details}\n`;
      availabilityInfo += `⏰ **Timeline:** ${details.timeline}\n`;
      availabilityInfo += `💡 **Preferences:** ${details.preferences}\n`;
    } else {
      availabilityInfo += `**General Availability Overview:**\n\n`;
      
      Object.entries(availabilityMatrix).forEach(([type, details]) => {
        const formattedType = type.charAt(0).toUpperCase() + type.slice(1).replace('-', ' ');
        availabilityInfo += `**${formattedType}:** ${details.status}\n`;
        availabilityInfo += `  • ${details.details}\n`;
        availabilityInfo += `  • Timeline: ${details.timeline}\n\n`;
      });
    }

    availabilityInfo += `\n📞 **Next Steps:** Feel free to reach out via email or LinkedIn to discuss opportunities further.`;

    return {
      content: [{
        type: 'text',
        text: availabilityInfo
      }]
    };
  } catch (error) {
    return handleError(error, 'get availability status');
  }
};

export const handleGetPreferredContactMethod = async (args: any): Promise<CallToolResult> => {
  try {
    const { inquiry_type } = args;

    const contactPreferences = {
      'job-opportunity': {
        primary: 'Email',
        secondary: 'LinkedIn message',
        details: 'Please include job description, company information, and role requirements.',
        response_time: 'Within 24-48 hours'
      },
      'collaboration': {
        primary: 'Email or LinkedIn',
        secondary: 'GitHub discussion',
        details: 'Describe the project, timeline, and collaboration expectations.',
        response_time: 'Within 24 hours'
      },
      'consulting': {
        primary: 'Email',
        secondary: 'LinkedIn message',
        details: 'Include project scope, timeline, and budget expectations.',
        response_time: 'Within 24 hours'
      },
      'speaking': {
        primary: 'Email',
        secondary: 'LinkedIn message',
        details: 'Provide event details, audience, topic requirements, and logistics.',
        response_time: 'Within 48 hours'
      },
      'general': {
        primary: 'Email',
        secondary: 'LinkedIn message',
        details: 'Feel free to reach out for any professional inquiries or questions.',
        response_time: 'Within 48-72 hours'
      }
    };

    let contactMethod = `**Preferred Contact Methods**\n\n`;

    if (inquiry_type && contactPreferences[inquiry_type as keyof typeof contactPreferences]) {
      const prefs = contactPreferences[inquiry_type as keyof typeof contactPreferences];
      const formattedType = inquiry_type.charAt(0).toUpperCase() + inquiry_type.slice(1).replace('-', ' ');
      
      contactMethod += `**For ${formattedType} Inquiries:**\n`;
      contactMethod += `🎯 **Primary:** ${prefs.primary}\n`;
      contactMethod += `🎯 **Alternative:** ${prefs.secondary}\n`;
      contactMethod += `📝 **Please Include:** ${prefs.details}\n`;
      contactMethod += `⏰ **Expected Response Time:** ${prefs.response_time}\n`;
    } else {
      contactMethod += `**Contact Preferences by Inquiry Type:**\n\n`;
      
      Object.entries(contactPreferences).forEach(([type, prefs]) => {
        const formattedType = type.charAt(0).toUpperCase() + type.slice(1).replace('-', ' ');
        contactMethod += `**${formattedType}**\n`;
        contactMethod += `  • Primary: ${prefs.primary}\n`;
        contactMethod += `  • Response time: ${prefs.response_time}\n\n`;
      });
    }

    // Add contact details
    const profile = await connectAndQuery(async (client) => {
      const result = await client.query('SELECT email, linkedin_url FROM professionals LIMIT 1');
      return result.rows[0];
    });

    if (profile) {
      contactMethod += `\n**Contact Information:**\n`;
      contactMethod += `📧 Email: ${profile.email}\n`;
      if (profile.linkedin_url) {
        contactMethod += `🔗 LinkedIn: ${profile.linkedin_url}\n`;
      }
    }

    return {
      content: [{
        type: 'text',
        text: contactMethod
      }]
    };
  } catch (error) {
    return handleError(error, 'get preferred contact method');
  }
};

export const handleGenerateIntroductionEmail = async (args: any): Promise<CallToolResult> => {
  try {
    const { context, company_name, role_title } = args;

    const profile = await connectAndQuery(async (client) => {
      const result = await client.query('SELECT * FROM professionals LIMIT 1');
      return result.rows[0];
    });

    if (!profile) {
      return {
        content: [{
          type: 'text',
          text: 'No professional profile found to generate introduction email.'
        }]
      };
    }

    let emailTemplate = `**Professional Introduction Email Template**\n\n`;
    emailTemplate += `**Subject:** `;

    // Generate subject line based on context
    if (context.toLowerCase().includes('job') || context.toLowerCase().includes('opportunity')) {
      emailTemplate += company_name 
        ? `Professional Introduction - ${role_title ? role_title + ' ' : ''}Opportunity at ${company_name}`
        : `Professional Introduction - ${profile.name}`;
    } else if (context.toLowerCase().includes('collaboration')) {
      emailTemplate += `Collaboration Opportunity - ${profile.name}`;
    } else if (context.toLowerCase().includes('consulting')) {
      emailTemplate += `Technical Consulting Inquiry - ${profile.name}`;
    } else {
      emailTemplate += `Professional Introduction - ${profile.name}`;
    }

    emailTemplate += `\n\n**Email Body:**\n\n`;
    emailTemplate += `Dear [Recipient Name],\n\n`;
    
    emailTemplate += `I hope this message finds you well. I'm reaching out regarding ${context}`;
    if (company_name) {
      emailTemplate += ` at ${company_name}`;
    }
    if (role_title) {
      emailTemplate += ` for the ${role_title} position`;
    }
    emailTemplate += `.\n\n`;

    // Professional summary
    emailTemplate += `**About Me:**\n`;
    emailTemplate += `I'm ${profile.name}`;
    if (profile.title) {
      emailTemplate += `, currently working as a ${profile.title}`;
    }
    if (profile.location) {
      emailTemplate += ` based in ${profile.location}`;
    }
    emailTemplate += `. `;
    
    if (profile.summary) {
      emailTemplate += `${profile.summary}\n\n`;
    } else {
      emailTemplate += `I'm a passionate full-stack developer with extensive experience in modern web technologies and a strong focus on creating scalable, user-friendly applications.\n\n`;
    }

    // Key highlights (you might want to fetch recent experiences/projects)
    emailTemplate += `**Key Highlights:**\n`;
    emailTemplate += `• Full-stack development expertise with modern frameworks and technologies\n`;
    emailTemplate += `• Strong background in both frontend and backend development\n`;
    emailTemplate += `• Experience with database design, API development, and cloud platforms\n`;
    emailTemplate += `• Passionate about clean code, best practices, and continuous learning\n\n`;

    emailTemplate += `I would welcome the opportunity to discuss how my skills and experience align with `;
    if (role_title) {
      emailTemplate += `the ${role_title} role`;
    } else {
      emailTemplate += `your needs`;
    }
    emailTemplate += `. I'm available for a conversation at your convenience.\n\n`;

    emailTemplate += `Please feel free to review my work:\n`;
    if (profile.linkedin_url) {
      emailTemplate += `• LinkedIn: ${profile.linkedin_url}\n`;
    }
    if (profile.github_url) {
      emailTemplate += `• GitHub: ${profile.github_url}\n`;
    }
    if (profile.website_url) {
      emailTemplate += `• Portfolio: ${profile.website_url}\n`;
    }

    emailTemplate += `\nThank you for your time and consideration. I look forward to hearing from you.\n\n`;
    emailTemplate += `Best regards,\n`;
    emailTemplate += `${profile.name}\n`;
    emailTemplate += `${profile.email}`;

    return {
      content: [{
        type: 'text',
        text: emailTemplate
      }]
    };
  } catch (error) {
    return handleError(error, 'generate introduction email');
  }
};