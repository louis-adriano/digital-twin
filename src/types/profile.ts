// src/types/profile.ts

export interface ProfileData {
  profile: {
    name: string;
    email: string;
    title?: string;
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