import { analyzeJob } from './job/analyze.js';
import { jobFromText } from './job/text.js';
import { buildDocx, docxFileName } from './resume/docx.js';
import { buildRulesResume, coverage, ensureKeywords } from './resume/rules.js';
import { parseJob, parseProfile, parseResume, str } from './sanitize.js';

export function analyzeJobText(input: { text: string; title: string; company: string }) {
  const text = str(input.text, 40_000);
  if (text.length < 100) throw new Error('Paste the full job description (at least 100 characters).');
  const job = jobFromText(text, str(input.title, 200), str(input.company, 200));
  return { job, analysis: analyzeJob(job) };
}

export function draftResume(rawJob: unknown, rawProfile: unknown) {
  const job = parseJob(rawJob);
  const analysis = analyzeJob(job);
  const resume = ensureKeywords(buildRulesResume(job, analysis, parseProfile(rawProfile)), analysis);
  return { resume, coverage: coverage(resume, analysis) };
}

export async function createDocx(rawResume: unknown): Promise<{ blob: Blob; fileName: string }> {
  const resume = parseResume(rawResume);
  const data = await buildDocx(resume);
  return {
    blob: new Blob([data], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' }),
    fileName: docxFileName(resume),
  };
}
