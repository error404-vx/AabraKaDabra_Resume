import type { JobPosting } from '../types.js';

export function normalizeText(text: string): string {
  const out: string[] = [];
  for (const raw of text.replace(/\r/g, '').replace(/\u00a0/g, ' ').split('\n')) {
    const line = raw.replace(/[ \t\f\v]+/g, ' ').trim();
    if (!line || /^[•·▪\-*]$/.test(line)) {
      if (out.length && out[out.length - 1] !== '') out.push('');
      continue;
    }
    out.push(line);
  }
  return out.join('\n').trim();
}

export function cleanTitle(title: string, company = ''): string {
  let t = title.split(/\s[|–—]\s/)[0].replace(/^job application for\s+/i, '');
  t = t.replace(/\((?:[mfwdx]\s*\/\s*){1,3}[mfwdx]\)/gi, '');
  t = t.replace(/\b(?:job|req(?:uisition)?)\s*(?:id|#)\s*[:#]?\s*[\w-]+/gi, '');
  if (company) {
    const escaped = company.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    t = t.replace(new RegExp(`\\s+(?:at|@|-)\\s+${escaped}.*$`, 'i'), '');
  }
  t = t.replace(/\s+-\s+(?:careers?|jobs?)$/i, '');
  return t.replace(/\s{2,}/g, ' ').replace(/[\s,\-–]+$/, '').trim();
}

export function jobFromText(description: string, title: string, company: string): JobPosting {
  const normalized = normalizeText(description);
  let jobTitle = title;
  if (!jobTitle) {
    const first = normalized.split('\n')[0] ?? '';
    if (first.length <= 80 && !/[.!?]$/.test(first)) jobTitle = first;
  }
  return {
    url: '',
    title: cleanTitle(jobTitle, company),
    company,
    location: '',
    employmentType: '',
    description: normalized.slice(0, 40_000),
    source: 'text',
  };
}
