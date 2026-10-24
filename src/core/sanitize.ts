import type {
  Contact,
  EducationEntry,
  JobPosting,
  PaperSize,
  Profile,
  ResumeDocument,
  SkillGroup,
  WorkEntry,
} from './types.js';

// Characters that are invalid in XML 1.0 and would corrupt the .docx.
const INVALID_XML = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F\uFFFE\uFFFF]/g;

export function str(v: unknown, max = 200): string {
  return typeof v === 'string' ? v.replace(INVALID_XML, '').trim().slice(0, max) : '';
}

export function obj(v: unknown): Record<string, unknown> {
  return v && typeof v === 'object' && !Array.isArray(v) ? (v as Record<string, unknown>) : {};
}

function list<T>(v: unknown, max: number, map: (x: unknown) => T): T[] {
  return Array.isArray(v) ? v.slice(0, max).map(map) : [];
}

function strList(v: unknown, maxItems: number, maxLen: number): string[] {
  return list(v, maxItems, (x) => str(x, maxLen)).filter(Boolean);
}

function paper(v: unknown): PaperSize {
  return v === 'Letter' ? 'Letter' : 'A4';
}

export function parseJob(raw: unknown): JobPosting {
  const o = obj(raw);
  const source = o.source === 'json-ld' || o.source === 'html' ? o.source : 'text';
  return {
    url: str(o.url, 2048),
    title: str(o.title, 200),
    company: str(o.company, 200),
    location: str(o.location, 200),
    employmentType: str(o.employmentType, 100),
    description: str(o.description, 40_000),
    source,
  };
}

export function parseContact(raw: unknown): Contact {
  const o = obj(raw);
  return {
    fullName: str(o.fullName, 120),
    email: str(o.email, 200),
    phone: str(o.phone, 60),
    location: str(o.location, 120),
    linkedin: str(o.linkedin, 300),
    website: str(o.website, 300),
  };
}

function parseWork(raw: unknown, withBullets: boolean): WorkEntry {
  const o = obj(raw);
  return {
    title: str(o.title, 150),
    company: str(o.company, 150),
    location: str(o.location, 120),
    start: str(o.start, 40),
    end: str(o.end, 40),
    bullets: withBullets ? strList(o.bullets, 15, 400) : [],
  };
}

function parseEducation(raw: unknown): EducationEntry {
  const o = obj(raw);
  return {
    degree: str(o.degree, 200),
    institution: str(o.institution, 200),
    location: str(o.location, 120),
    graduation: str(o.graduation, 40),
    details: str(o.details, 400),
  };
}

function parseSkillGroup(raw: unknown): SkillGroup {
  const o = obj(raw);
  return { category: str(o.category, 60), items: strList(o.items, 40, 80) };
}

export function parseProfile(raw: unknown): Profile {
  const o = obj(raw);
  const years = Number(o.yearsExperience);
  return {
    contact: parseContact(o.contact),
    yearsExperience: Number.isFinite(years) && years > 0 && years <= 60 ? Math.round(years) : null,
    work: list(o.work, 8, (w) => parseWork(w, false))
      .filter((w) => w.title || w.company)
      .map(({ bullets: _b, ...rest }) => rest),
    education: list(o.education, 6, parseEducation).filter((e) => e.degree || e.institution),
    certifications: strList(o.certifications, 15, 200),
    paperSize: paper(o.paperSize),
  };
}

export function parseResume(raw: unknown): ResumeDocument {
  const o = obj(raw);
  return {
    contact: parseContact(o.contact),
    headline: str(o.headline, 250),
    summary: str(o.summary, 2000),
    skills: list(o.skills, 12, parseSkillGroup).filter((g) => g.items.length),
    experience: list(o.experience, 8, (w) => parseWork(w, true)),
    education: list(o.education, 6, parseEducation),
    certifications: strList(o.certifications, 15, 200),
    paperSize: paper(o.paperSize),
    targetTitle: str(o.targetTitle, 200),
    targetCompany: str(o.targetCompany, 200),
  };
}
