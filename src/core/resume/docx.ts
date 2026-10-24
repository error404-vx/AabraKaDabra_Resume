import {
  AlignmentType,
  BorderStyle,
  Document,
  LevelFormat,
  Packer,
  Paragraph,
  Tab,
  TabStopType,
  TextRun,
} from 'docx';
import type { ResumeDocument } from '../types.js';

const FONT = 'Calibri';
const BODY_SIZE = 21; // half-points (10.5pt)
const MARGIN = 900; // twips (~0.63in)
const PAGE = {
  A4: { width: 11906, height: 16838 },
  Letter: { width: 12240, height: 15840 },
};

/** Splits text so [placeholders] are highlighted for the user to replace. */
function runs(text: string, opts: { bold?: boolean; italics?: boolean; size?: number } = {}): TextRun[] {
  return text
    .split(/(\[[^\]\n]{1,80}\])/)
    .filter(Boolean)
    .map((part) =>
      new TextRun({
        text: part,
        font: FONT,
        size: opts.size ?? BODY_SIZE,
        bold: opts.bold,
        italics: opts.italics,
        highlight: /^\[.*\]$/.test(part) ? 'yellow' : undefined,
      }),
    );
}

function sectionHeading(title: string): Paragraph {
  return new Paragraph({
    children: [new TextRun({ text: title.toUpperCase(), font: FONT, size: 23, bold: true })],
    spacing: { before: 200, after: 80 },
    border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: '444444', space: 1 } },
    keepNext: true,
  });
}

function rightTabLine(left: TextRun[], right: string, tabPos: number, keepNext = true): Paragraph {
  return new Paragraph({
    children: right ? [...left, new TextRun({ children: [new Tab()], font: FONT }), ...runs(right, { bold: true })] : left,
    tabStops: [{ type: TabStopType.RIGHT, position: tabPos }],
    spacing: { before: 120, after: 0 },
    keepNext,
  });
}

function bullet(text: string): Paragraph {
  return new Paragraph({
    children: runs(text),
    numbering: { reference: 'resume-bullets', level: 0 },
    spacing: { after: 40 },
  });
}

function plain(text: string, opts: { italics?: boolean; after?: number } = {}): Paragraph {
  return new Paragraph({ children: runs(text, { italics: opts.italics }), spacing: { after: opts.after ?? 40 } });
}

export async function buildDocx(resume: ResumeDocument): Promise<ArrayBuffer> {
  const page = PAGE[resume.paperSize];
  const tabPos = page.width - MARGIN * 2;
  const c = resume.contact;
  const children: Paragraph[] = [];

  children.push(
    new Paragraph({
      children: runs(c.fullName || '[Your Full Name]', { bold: true, size: 36 }),
      alignment: AlignmentType.CENTER,
      spacing: { after: 40 },
    }),
  );
  if (resume.headline) {
    children.push(new Paragraph({ children: runs(resume.headline, { size: 22 }), alignment: AlignmentType.CENTER, spacing: { after: 40 } }));
  }
  const contactLine = [
    c.location || '[City, Country]',
    c.phone || '[Phone Number]',
    c.email || '[Email Address]',
    c.linkedin,
    c.website,
  ].filter(Boolean);
  children.push(new Paragraph({ children: runs(contactLine.join('  |  ')), alignment: AlignmentType.CENTER, spacing: { after: 120 } }));

  if (resume.summary) {
    children.push(sectionHeading('Professional Summary'));
    children.push(new Paragraph({ children: runs(resume.summary), alignment: AlignmentType.JUSTIFIED, spacing: { after: 60 } }));
  }

  if (resume.skills.length) {
    children.push(sectionHeading('Skills'));
    for (const group of resume.skills) {
      children.push(
        new Paragraph({
          children: [...runs(`${group.category}: `, { bold: true }), ...runs(group.items.join(', '))],
          spacing: { after: 40 },
        }),
      );
    }
  }

  if (resume.experience.length) {
    children.push(sectionHeading('Professional Experience'));
    for (const job of resume.experience) {
      const dates = [job.start, job.end].filter(Boolean).join(' – ');
      children.push(rightTabLine(runs(job.title || '[Job Title]', { bold: true }), dates, tabPos));
      const org = [job.company, job.location].filter(Boolean).join(', ');
      if (org) children.push(new Paragraph({ children: runs(org, { italics: true }), spacing: { after: 60 }, keepNext: true }));
      job.bullets.forEach((b) => children.push(bullet(b)));
    }
  }

  if (resume.education.length) {
    children.push(sectionHeading('Education'));
    for (const edu of resume.education) {
      children.push(rightTabLine(runs(edu.degree || '[Degree]', { bold: true }), edu.graduation, tabPos));
      const school = [edu.institution, edu.location].filter(Boolean).join(', ');
      if (school) children.push(plain(school, { italics: true, after: edu.details ? 20 : 60 }));
      if (edu.details) children.push(plain(edu.details, { after: 60 }));
    }
  }

  if (resume.certifications.length) {
    children.push(sectionHeading('Certifications'));
    resume.certifications.forEach((cert) => children.push(bullet(cert)));
  }

  const doc = new Document({
    creator: c.fullName || 'Resume',
    title: `${c.fullName || 'Resume'} - ${resume.targetTitle || 'Resume'}`,
    description: 'ATS-friendly resume',
    styles: { default: { document: { run: { font: FONT, size: BODY_SIZE } } } },
    numbering: {
      config: [
        {
          reference: 'resume-bullets',
          levels: [
            {
              level: 0,
              format: LevelFormat.BULLET,
              text: '•',
              alignment: AlignmentType.LEFT,
              style: { paragraph: { indent: { left: 360, hanging: 240 } } },
            },
          ],
        },
      ],
    },
    sections: [
      {
        properties: {
          page: {
            size: page,
            margin: { top: MARGIN, bottom: MARGIN, left: MARGIN, right: MARGIN },
          },
        },
        children,
      },
    ],
  });
  return Packer.toArrayBuffer(doc);
}

export function docxFileName(resume: ResumeDocument): string {
  const safe = (s: string) => s.replace(/[^A-Za-z0-9]+/g, '_').replace(/^_+|_+$/g, '').slice(0, 40);
  return [safe(resume.contact.fullName) || 'Resume', resume.contact.fullName ? 'Resume' : '', safe(resume.targetCompany)]
    .filter(Boolean)
    .join('_')
    .concat('.docx');
}
