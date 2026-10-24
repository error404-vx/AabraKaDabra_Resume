import { describe, expect, it } from 'vitest';
import { analyzeJob } from '../src/core/job/analyze.js';
import { jobFromText } from '../src/core/job/text.js';
import { buildDocx } from '../src/core/resume/docx.js';
import { buildRulesResume, coverage, ensureKeywords } from '../src/core/resume/rules.js';
import { rewriteDuty, rewriteRequirement } from '../src/core/resume/verbs.js';
import { parseProfile } from '../src/core/sanitize.js';

const JD = `Senior Software Engineer

About the role
We are looking for a Senior Software Engineer to join our Payments team.

What you'll do
• Design and build scalable REST APIs using Node.js and TypeScript
• Collaborate with product managers and designers to ship new features
• Own CI/CD pipelines on AWS using Docker and Kubernetes
• Mentor junior engineers and lead code reviews

Requirements
• 5+ years of experience building web applications with React
• Strong knowledge of PostgreSQL and Redis
• Experience with Agile and Scrum
• Excellent communication and problem-solving skills

Nice to have
• Experience with GraphQL and Kafka

Benefits
• Unlimited PTO and great health insurance`;

describe('verbs', () => {
  it('rewrites duties into past-tense bullets', () => {
    expect(rewriteDuty('You will design and build scalable APIs for our customers')?.past).toBe(
      'Designed and built scalable APIs for the customers.',
    );
    expect(rewriteDuty('Managing a team of five engineers')?.past).toBe('Managed a team of five engineers.');
    expect(rewriteDuty('Strong communication skills')).toBeNull();
    expect(
      rewriteDuty('Support customer adoption, proactively work to reduce churn, and participate in forecasting; travel as needed')?.past,
    ).toBe('Supported customer adoption, proactively worked to reduce churn, and participated in forecasting.');
  });

  it('rewrites experience requirements', () => {
    expect(rewriteRequirement('3+ years of experience building data pipelines in Python')).toBe(
      'Built data pipelines in Python.',
    );
  });
});

describe('analyzeJob', () => {
  const job = jobFromText(JD, '', 'Acme');
  const analysis = analyzeJob(job);

  it('detects title, sections and years', () => {
    expect(job.title).toBe('Senior Software Engineer');
    expect(analysis.responsibilities).toHaveLength(4);
    expect(analysis.requirements.length).toBeGreaterThanOrEqual(4);
    expect(analysis.preferred).toHaveLength(1);
    expect(analysis.minYears).toBe(5);
    expect(analysis.seniority).toBe('Senior');
  });

  it('extracts keywords and marks preferred-only ones', () => {
    const terms = analysis.keywords.map((k) => k.term);
    for (const t of ['Node.js', 'TypeScript', 'AWS', 'Docker', 'Kubernetes', 'React', 'PostgreSQL', 'CI/CD', 'Agile']) {
      expect(terms).toContain(t);
    }
    expect(analysis.keywords.find((k) => k.term === 'Kafka')?.preferredOnly).toBe(true);
    expect(terms).not.toContain('PTO');
  });

  it('builds a resume that covers every keyword', () => {
    const profile = parseProfile({ contact: { fullName: 'Jane Doe' }, yearsExperience: 6 });
    const resume = ensureKeywords(buildRulesResume(job, analysis, profile), analysis);
    expect(coverage(resume, analysis).score).toBe(100);
    expect(resume.summary).toMatch(/^Senior Software Engineer with 6\+ years/);
    expect(resume.experience[0].bullets[0]).toBe('Designed and built scalable REST APIs using Node.js and TypeScript.');
    expect(resume.experience[0].company).toBe('[Company Name]');
  });

  it('produces a valid .docx', async () => {
    const resume = buildRulesResume(job, analysis, parseProfile({}));
    const buffer = new Uint8Array(await buildDocx(resume));
    expect(String.fromCharCode(buffer[0], buffer[1])).toBe('PK');
  });
});
