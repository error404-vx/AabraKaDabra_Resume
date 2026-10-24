export type Category =
  | 'Languages'
  | 'Frameworks & Libraries'
  | 'Cloud & DevOps'
  | 'Data & AI'
  | 'Databases'
  | 'Tools & Platforms'
  | 'Methods & Practices'
  | 'Business & Domain'
  | 'Soft Skills'
  | 'Other';

export interface JobPosting {
  url: string;
  title: string;
  company: string;
  location: string;
  employmentType: string;
  description: string;
  source: 'json-ld' | 'html' | 'text';
}

export interface Keyword {
  term: string;
  category: Category;
  count: number;
  preferredOnly: boolean;
}

export interface JobAnalysis {
  title: string;
  seniority: string;
  minYears: number | null;
  responsibilities: string[];
  requirements: string[];
  preferred: string[];
  keywords: Keyword[];
  education: string;
  certifications: string[];
}

export interface Contact {
  fullName: string;
  email: string;
  phone: string;
  location: string;
  linkedin: string;
  website: string;
}

export interface WorkEntry {
  title: string;
  company: string;
  location: string;
  start: string;
  end: string;
  bullets: string[];
}

export interface EducationEntry {
  degree: string;
  institution: string;
  location: string;
  graduation: string;
  details: string;
}

export type PaperSize = 'A4' | 'Letter';

export interface Profile {
  contact: Contact;
  yearsExperience: number | null;
  work: Omit<WorkEntry, 'bullets'>[];
  education: EducationEntry[];
  certifications: string[];
  paperSize: PaperSize;
}

export interface SkillGroup {
  category: string;
  items: string[];
}

export interface ResumeDocument {
  contact: Contact;
  headline: string;
  summary: string;
  skills: SkillGroup[];
  experience: WorkEntry[];
  education: EducationEntry[];
  certifications: string[];
  paperSize: PaperSize;
  targetTitle: string;
  targetCompany: string;
}

export interface Coverage {
  score: number;
  matched: string[];
  missing: string[];
}
