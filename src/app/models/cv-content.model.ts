export interface AiPersonalInfo {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  country: string;
  linkedin?: string;
  github?: string;
  website?: string;
}

export interface AiExperience {
  id: string;
  title: string;
  company: string;
  location: string;
  startDate: string;
  endDate?: string;
  description: string[];
}

export interface AiEducation {
  id: string;
  degree: string;
  fieldOfStudy: string;
  university: string;
  location: string;
  startDate: string;
  endDate: string;
  description?: string[];
}

export interface AiSkills {
  id: string;
  technical: string[];
  soft: string[];
  languages: { id: string; name: string; level: string }[];
}

export interface AiProject {
  id: string;
  name: string;
  description: string;
  technologies: string[];
  link?: string;
}

export interface AiCvContent {
  id: string;
  personalInfo: AiPersonalInfo;
  summary: string;
  experience: AiExperience[];
  education: AiEducation[];
  skills: AiSkills;
  projects: AiProject[];
  interests: string[];
  sectionOrder: string[];
}
