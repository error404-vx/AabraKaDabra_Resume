import type { Category, JobAnalysis, JobPosting, Keyword } from '../types.js';
import { SKILLS, countMatches, isKnownSkillText } from './skills.js';

type Section = 'intro' | 'responsibilities' | 'requirements' | 'preferred' | 'ignore';

const HEADING_RULES: [Section, RegExp][] = [
  ['preferred', /\b(preferred|nice[- ]to[- ]have|bonus|desired|desirable|pluses|a plus|good to have)\b/i],
  [
    'ignore',
    /\b(benefits?|perks|about (us|the company|the team)|who we are|our (company|culture|mission|values|story)|compensation|salary|pay (range|transparency)|equal (opportunity|employment)|eeo|diversity|how to apply|why (join|work)|what we offer|we offer|privacy|accommodations?|life at)\b/i,
  ],
  [
    'requirements',
    /\b(requirements?|qualifications?|what you('|’)?ll (need|bring)|what we('|’)?re looking for|what you (need|bring|have)|skills|experience|about you|must[- ]haves?|who you are|you have|you bring|you should have|competenc(y|ies)|ideal candidate|profile)\b/i,
  ],
  ['intro', /\b(about (the|this) (role|job|position|opportunity)|role overview|overview|job summary|position summary|the opportunity)\b/i],
  [
    'responsibilities',
    /\b(responsibilit(y|ies)|what you('|’)?ll do|what you will do|duties|day[- ]to[- ]day|key accountabilities|your (role|impact|mission)|in this role|job description|what the job involves|you will)\b/i,
  ],
];

function headingSection(line: string): Section | null {
  if (line.startsWith('•') || line.length > 80) return null;
  const l = line.replace(/[:：]\s*$/, '').trim();
  if (/[.!?]$/.test(l) || l.split(/\s+/).length > 9) return null;
  for (const [section, re] of HEADING_RULES) if (re.test(l)) return section;
  return null;
}

const BULLET = /^(?:[•·▪●◦‣\-*–]|\d{1,2}[.)])\s*/;

function splitSentences(paragraph: string): string[] {
  return paragraph
    .split(/(?<=[.!?])\s+(?=[A-Z])/)
    .map((s) => s.trim())
    .filter((s) => s.length >= 20);
}

const REQUIREMENT_HINT =
  /^(\d+\+?\s*(?:-\s*\d+\s*)?years?|(?:proven|demonstrated|strong|solid|excellent|good|deep|hands-on|working|extensive|prior|previous)\b|experience\b|proficien|knowledge|familiar|understanding|degree|bachelor|master|ph\.?d|ability|able to|must|certifi|fluent|expert)/i;

export function sectionize(description: string) {
  const sections: Record<Section, string[]> = {
    intro: [],
    responsibilities: [],
    requirements: [],
    preferred: [],
    ignore: [],
  };
  let current: Section = 'intro';
  for (const raw of description.split('\n')) {
    const line = raw.trim();
    if (!line) continue;
    const heading = headingSection(line);
    if (heading) {
      current = heading;
      continue;
    }
    const isBullet = BULLET.test(line);
    const content = line.replace(BULLET, '').trim();
    if (content.length < 15) continue;
    if (isBullet || content.length <= 300) sections[current].push(content);
    else sections[current].push(...splitSentences(content));
  }

  // Unstructured postings: classify by wording.
  if (!sections.responsibilities.length && !sections.requirements.length) {
    for (const line of sections.intro) {
      (REQUIREMENT_HINT.test(line) ? sections.requirements : sections.responsibilities).push(line);
    }
  }
  return sections;
}

const ACRONYM_STOP = new Set(
  'US USA UK EU EEO EOE AND OR THE IT HR PTO WFH CEO CTO CFO COO VP LGBTQ LGBTQIA ADA TBD ID AM PM NA ETC FAQ ASAP OK INC LLC LTD CV GPA BA BS MS MBA PHD BSC MSC DE NY CA TX WA USD EUR GBP INR APAC EMEA LATAM NYC SF II III IV'.split(' '),
);

function extraKeywords(lines: string[], title: string, company: string): Map<string, number> {
  const counts = new Map<string, number>();
  const exclude = `${title} ${company}`.toLowerCase();
  for (const line of lines) {
    const candidates = [
      ...line.matchAll(/(?<![\w.])[A-Z][A-Z0-9&/+.-]{1,9}(?![\w])/g),
      ...line.matchAll(/\b[A-Z][a-z]+[A-Z][A-Za-z]+\b/g),
    ].map((m) => m[0].replace(/[.\-/]+$/, ''));
    for (const token of candidates) {
      if (token.length < 2 || ACRONYM_STOP.has(token.toUpperCase())) continue;
      if (/^\d/.test(token) || exclude.includes(token.toLowerCase()) || isKnownSkillText(token)) continue;
      counts.set(token, (counts.get(token) ?? 0) + 1);
    }
  }
  return counts;
}

function detectSeniority(title: string): string {
  const t = title.toLowerCase();
  if (/\b(intern|internship|trainee|apprentice)\b/.test(t)) return 'Intern';
  if (/\b(junior|jr\.?|entry|graduate|associate)\b/.test(t)) return 'Entry level';
  if (/\b(principal|staff|distinguished)\b/.test(t)) return 'Principal';
  if (/\b(director|head of|vp|vice president|chief)\b/.test(t)) return 'Executive';
  if (/\b(manager|lead)\b/.test(t)) return 'Lead / Manager';
  if (/\b(senior|sr\.?)\b/.test(t)) return 'Senior';
  return 'Mid level';
}

function detectYears(lines: string[]): number | null {
  for (const line of lines) {
    const m = /(\d{1,2})\s*\+?\s*(?:(?:-|–|to)\s*\d{1,2}\s*)?\+?\s*years?/i.exec(line);
    if (m) {
      const n = Number(m[1]);
      if (n > 0 && n <= 30) return n;
    }
  }
  return null;
}

const CERT_RE =
  /\b(PMP|CAPM|CPA|CFA|CMA|CISSP|CISA|CISM|CEH|OSCP|CCNA|CCNP|CSM|PSM|SAFe|SHRM-(?:CP|SCP)|SPHR|PHR|ITIL(?: v?\d)?|CompTIA (?:A\+|Network\+|Security\+)|Security\+|AWS Certified [A-Z][\w-]*(?: [A-Z][\w-]*){0,3}|Azure [A-Z][a-z]+ (?:Associate|Expert)|Google (?:Cloud )?Professional [A-Z][a-z]+(?: [A-Z][a-z]+)?|Certified [A-Z][\w]*(?: [A-Z][\w]*){0,3}|Six Sigma (?:Green|Black|Yellow) Belt|BLS|ACLS|RN license)\b/g;

export function analyzeJob(job: JobPosting): JobAnalysis {
  const sections = sectionize(job.description);
  const relevant = [...sections.intro, ...sections.responsibilities, ...sections.requirements];
  const relevantText = `${job.title}\n${relevant.join('\n')}`;
  const preferredText = sections.preferred.join('\n');

  const keywords: Keyword[] = [];
  const company = job.company.trim().toLowerCase();
  for (const skill of SKILLS) {
    if (company && skill.name.toLowerCase() === company) continue;
    const main = countMatches(skill, relevantText);
    const pref = countMatches(skill, preferredText);
    if (main + pref > 0) {
      keywords.push({ term: skill.name, category: skill.category, count: main + pref, preferredOnly: main === 0 });
    }
  }

  const extras = extraKeywords([...sections.responsibilities, ...sections.requirements], job.title, job.company);
  [...extras.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .forEach(([term, count]) => keywords.push({ term, category: 'Other' as Category, count, preferredOnly: false }));

  keywords.sort((a, b) => Number(a.preferredOnly) - Number(b.preferredOnly) || b.count - a.count);

  const allLines = [...sections.requirements, ...sections.preferred, ...sections.intro];
  const education =
    allLines.find((l) => /\b(bachelor|master|ph\.?\s?d|degree|diploma|b\.?\s?tech|b\.?s\.?c?|m\.?s\.?c?|mba)\b/i.test(l)) ?? '';

  const certifications = [...new Set([...job.description.matchAll(CERT_RE)].map((m) => m[1].trim()))].slice(0, 10);

  return {
    title: job.title,
    seniority: detectSeniority(job.title),
    minYears: detectYears([...sections.requirements, ...sections.intro, ...sections.responsibilities]),
    responsibilities: sections.responsibilities.slice(0, 25),
    requirements: sections.requirements.slice(0, 25),
    preferred: sections.preferred.slice(0, 15),
    keywords: keywords.slice(0, 60),
    education: education.slice(0, 250),
    certifications,
  };
}
