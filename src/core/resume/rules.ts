import { mentions } from '../job/skills.js';
import type {
  Category,
  Coverage,
  EducationEntry,
  JobAnalysis,
  JobPosting,
  Keyword,
  Profile,
  ResumeDocument,
  SkillGroup,
  WorkEntry,
} from '../types.js';
import { rewriteDuty, rewriteRequirement } from './verbs.js';

const CATEGORY_ORDER: Category[] = [
  'Languages',
  'Frameworks & Libraries',
  'Cloud & DevOps',
  'Data & AI',
  'Databases',
  'Tools & Platforms',
  'Methods & Practices',
  'Business & Domain',
  'Other',
  'Soft Skills',
];

const CATEGORY_LABEL: Record<Category, string> = {
  Languages: 'Programming Languages',
  'Frameworks & Libraries': 'Frameworks & Libraries',
  'Cloud & DevOps': 'Cloud & DevOps',
  'Data & AI': 'Data & AI',
  Databases: 'Databases',
  'Tools & Platforms': 'Tools & Platforms',
  'Methods & Practices': 'Methodologies',
  'Business & Domain': 'Domain Expertise',
  Other: 'Additional Technologies',
  'Soft Skills': 'Professional Skills',
};

const TEMPLATES: Partial<Record<Category, (terms: string) => string>> = {
  Languages: (t) => `Developed and maintained production code in ${t}, with a focus on clean, well-tested and maintainable solutions.`,
  'Frameworks & Libraries': (t) => `Built and enhanced features using ${t}, following code review, testing and documentation best practices.`,
  'Cloud & DevOps': (t) => `Automated build, deployment and monitoring workflows with ${t}, improving release reliability and reducing manual effort.`,
  'Data & AI': (t) => `Analyzed complex datasets with ${t} to uncover trends and deliver actionable insights to stakeholders.`,
  Databases: (t) => `Designed and optimized data models and queries in ${t} to support reliable, high-performance applications.`,
  'Tools & Platforms': (t) => `Used ${t} to streamline workflows, track progress and keep stakeholders aligned.`,
  'Methods & Practices': (t) => `Applied ${t} practices to plan, deliver and continuously improve work in iterative cycles.`,
  'Business & Domain': (t) => `Drove ${t} initiatives in partnership with cross-functional teams, aligning outcomes with business goals.`,
  Other: (t) => `Worked hands-on with ${t} as part of day-to-day delivery.`,
};

export function joinList(items: string[]): string {
  if (items.length <= 1) return items[0] ?? '';
  if (items.length === 2) return `${items[0]} and ${items[1]}`;
  return `${items.slice(0, -1).join(', ')}, and ${items[items.length - 1]}`;
}

function inline(k: Keyword): string {
  const lowerable = k.category === 'Business & Domain' || k.category === 'Soft Skills' || k.category === 'Methods & Practices';
  const isAcronymOrBrand = /[A-Z]{2,}|[a-z][A-Z]|\d/.test(k.term) || ['Agile', 'Scrum', 'Kanban', 'Lean', 'Six Sigma', 'Waterfall', 'DevOps'].includes(k.term);
  return lowerable && !isAcronymOrBrand ? k.term.toLowerCase() : k.term;
}

function article(word: string): string {
  return /^[aeiou]/i.test(word) && !/^(?:uni|use|one)/i.test(word) ? 'an' : 'a';
}

/** "Account Executive - France (Remote)" -> "Account Executive" */
export function coreTitle(title: string): string {
  return title.split(/\s[-–—|/]\s|,\s|\s\(/)[0].trim();
}

function dedupe(bullets: string[]): string[] {
  const seen = new Set<string>();
  return bullets.filter((b) => {
    const key = b.toLowerCase().replace(/[^a-z]/g, '').slice(0, 45);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function hardKeywords(analysis: JobAnalysis): Keyword[] {
  return analysis.keywords.filter((k) => k.category !== 'Soft Skills');
}

function buildBulletPool(analysis: JobAnalysis): string[] {
  const duties = analysis.responsibilities.map((l) => rewriteDuty(l)?.past).filter((b): b is string => !!b);
  const fromRequirements = [...analysis.requirements, ...analysis.preferred]
    .map((l) => rewriteDuty(l)?.past ?? rewriteRequirement(l))
    .filter((b): b is string => !!b);

  const pool = dedupe([...duties, ...fromRequirements]);
  const text = pool.join(' ');

  // Make sure important keywords that no bullet mentions still show up in context, not just the skills list.
  const uncovered = hardKeywords(analysis).filter((k) => !mentions(k.term, text));
  const byCategory = new Map<Category, Keyword[]>();
  for (const k of uncovered) byCategory.set(k.category, [...(byCategory.get(k.category) ?? []), k]);
  for (const category of CATEGORY_ORDER) {
    const terms = byCategory.get(category);
    const template = TEMPLATES[category];
    if (!terms?.length || !template) continue;
    for (let i = 0; i < terms.length && i < 6; i += 3) {
      pool.push(template(joinList(terms.slice(i, i + 3).map(inline))));
    }
  }

  const soft = analysis.keywords.filter((k) => k.category === 'Soft Skills').slice(0, 3).map(inline);
  pool.push(
    soft.length
      ? `Partnered with cross-functional stakeholders, demonstrating strong ${joinList(soft)} skills to deliver on shared goals.`
      : 'Partnered with cross-functional stakeholders to clarify requirements, resolve blockers and deliver on shared goals.',
  );
  return dedupe(pool);
}

function placeholderRoles(): Omit<WorkEntry, 'bullets'>[] {
  return [
    { title: '[Most Recent Job Title]', company: '[Company Name]', location: '[City, Country]', start: '[Start Date]', end: 'Present' },
    { title: '[Previous Job Title]', company: '[Company Name]', location: '[City, Country]', start: '[Start Date]', end: '[End Date]' },
  ];
}

function distribute(pool: string[], roles: Omit<WorkEntry, 'bullets'>[]): WorkEntry[] {
  const quotas = roles.map((_, i) => (i === 0 ? 6 : i === 1 ? 4 : 3));
  let cursor = 0;
  return roles.map((role, i) => {
    const bullets = pool.slice(cursor, cursor + quotas[i]);
    cursor += quotas[i];
    return { ...role, bullets };
  });
}

function buildSkills(analysis: JobAnalysis): SkillGroup[] {
  const groups: SkillGroup[] = [];
  for (const category of CATEGORY_ORDER) {
    const items = analysis.keywords.filter((k) => k.category === category).map((k) => k.term).slice(0, category === 'Soft Skills' ? 6 : 14);
    if (items.length) groups.push({ category: CATEGORY_LABEL[category], items });
  }
  return groups;
}

function buildSummary(job: JobPosting, analysis: JobAnalysis, profile: Profile): string {
  const title = coreTitle(job.title) || 'Professional';
  const years = profile.yearsExperience ?? analysis.minYears;
  const hard = hardKeywords(analysis).filter((k) => !k.preferredOnly);
  const top = hard.slice(0, 3).map(inline);
  const next = hard.slice(3, 8).map(inline);
  const soft = analysis.keywords.filter((k) => k.category === 'Soft Skills').slice(0, 2).map(inline);

  const focus = analysis.responsibilities
    .map((l) => rewriteDuty(l)?.gerundPhrase)
    .filter((p): p is string => !!p)
    .map((p) => p.split(/,|;| to (?:ensure|support|help|drive|enable)\b/)[0].trim())
    .filter((p) => p.split(' ').length >= 3)
    .slice(0, 2)
    .map((p) => p.charAt(0).toLowerCase() + p.slice(1));

  const sentences = [
    `${title}${years ? ` with ${years}+ years of experience` : ''}${top.length ? ` specializing in ${joinList(top)}` : ''}.`,
    focus.length ? `Proven track record of ${joinList(focus)}.` : '',
    next.length
      ? `Skilled in ${joinList(next)}${soft.length ? `, with strong ${joinList(soft)} skills` : ''}.`
      : soft.length
        ? `Recognized for strong ${joinList(soft)} skills.`
        : '',
    job.company ? `Seeking to deliver measurable impact as ${article(title)} ${title} at ${job.company}.` : '',
  ];
  return sentences.filter(Boolean).join(' ');
}

function educationOrPlaceholder(education: EducationEntry[]): EducationEntry[] {
  return education.length
    ? education
    : [{ degree: '[Degree], [Field of Study]', institution: '[University Name]', location: '[City, Country]', graduation: '[Year]', details: '' }];
}

export function buildRulesResume(job: JobPosting, analysis: JobAnalysis, profile: Profile): ResumeDocument {
  const roles = profile.work.length ? profile.work : placeholderRoles();
  const pool = buildBulletPool(analysis);
  const topHard = hardKeywords(analysis).filter((k) => !k.preferredOnly).slice(0, 3).map((k) => k.term);
  return {
    contact: profile.contact,
    headline: [coreTitle(job.title), ...topHard].filter(Boolean).join(' | '),
    summary: buildSummary(job, analysis, profile),
    skills: buildSkills(analysis),
    experience: distribute(pool, roles),
    education: educationOrPlaceholder(profile.education),
    certifications: profile.certifications,
    paperSize: profile.paperSize,
    targetTitle: job.title,
    targetCompany: job.company,
  };
}

export function resumeText(resume: ResumeDocument): string {
  return [
    resume.headline,
    resume.summary,
    ...resume.skills.flatMap((g) => g.items),
    ...resume.experience.flatMap((e) => [e.title, ...e.bullets]),
    ...resume.education.flatMap((e) => [e.degree, e.details]),
    ...resume.certifications,
  ].join('\n');
}

export function coverage(resume: ResumeDocument, analysis: JobAnalysis): Coverage {
  const text = resumeText(resume);
  const matched: string[] = [];
  const missing: string[] = [];
  for (const k of analysis.keywords) (mentions(k.term, text) ? matched : missing).push(k.term);
  const total = matched.length + missing.length;
  return { score: total ? Math.round((matched.length / total) * 100) : 100, matched, missing };
}

/** Adds any job keywords the resume lacks into the skills section. */
export function ensureKeywords(resume: ResumeDocument, analysis: JobAnalysis): ResumeDocument {
  const { missing } = coverage(resume, analysis);
  if (!missing.length) return resume;
  const byTerm = new Map(analysis.keywords.map((k) => [k.term, k]));
  const skills = resume.skills.map((g) => ({ ...g, items: [...g.items] }));
  for (const term of missing) {
    const label = CATEGORY_LABEL[byTerm.get(term)?.category ?? 'Other'];
    let group = skills.find((g) => g.category === label);
    if (!group) {
      group = { category: label, items: [] };
      skills.push(group);
    }
    group.items.push(term);
  }
  return { ...resume, skills };
}
