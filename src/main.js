import './styles.css';
import { analyzeJobText, createDocx, draftResume } from './core/index.ts';

const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
const STORAGE_KEY = 'akd-resume-profile';

const state = { job: null, analysis: null, resume: null };

function el(tag, props = {}, children = []) {
  const node = document.createElement(tag);
  Object.assign(node, props);
  for (const child of [].concat(children)) node.append(child);
  return node;
}

function setStatus(id, message, isError = false) {
  const node = $(id);
  node.textContent = message;
  node.classList.toggle('error', isError);
}

// Let the busy label paint before the synchronous work runs.
const nextFrame = () => new Promise((resolve) => setTimeout(resolve, 30));

function busy(button, isBusy, label) {
  button.disabled = isBusy;
  if (isBusy) {
    button.dataset.label = button.textContent;
    button.textContent = label;
  } else if (button.dataset.label) {
    button.textContent = button.dataset.label;
  }
}

/* ---------- Step 1: job ---------- */

$('#job-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const button = $('#job-submit');
  const body = {
    text: $('#job-text').value.trim(),
    title: $('#job-title-in').value.trim(),
    company: $('#job-company-in').value.trim(),
  };
  if (body.text.length < 100) {
    setStatus('#job-status', 'Paste the full job description (at least 100 characters).', true);
    $('#job-text').focus();
    return;
  }
  busy(button, true, 'Reading the runes…');
  setStatus('#job-status', '');
  try {
    await nextFrame();
    const data = analyzeJobText(body);
    state.job = data.job;
    state.analysis = data.analysis;
    renderJobSummary(data);
    $('#step-profile').hidden = false;
    $('#step-review').hidden = true;
    $('#step-profile').scrollIntoView({ behavior: 'smooth' });
  } catch (err) {
    setStatus('#job-status', err.message, true);
  } finally {
    busy(button, false);
  }
});

function chip(text, cls = '') {
  return el('span', { className: `chip ${cls}`.trim(), textContent: text });
}

function renderJobSummary({ job, analysis }) {
  const box = $('#job-summary');
  box.replaceChildren();
  const meta = [job.company, job.location, job.employmentType, analysis.seniority].filter(Boolean).join(' · ');
  box.append(
    el('h3', { textContent: job.title || 'Untitled role' }),
    el('p', { className: 'muted', textContent: meta }),
  );
  if (analysis.minYears) box.append(el('p', { textContent: `Asks for ${analysis.minYears}+ years of experience.` }));

  const required = analysis.keywords.filter((k) => !k.preferredOnly);
  const preferred = analysis.keywords.filter((k) => k.preferredOnly);
  if (required.length) {
    box.append(el('p', { className: 'label', textContent: `ATS keywords found (${required.length})` }));
    box.append(el('div', { className: 'chips' }, required.map((k) => chip(k.term))));
  }
  if (preferred.length) {
    box.append(el('p', { className: 'label', textContent: 'Nice-to-have keywords' }));
    box.append(el('div', { className: 'chips' }, preferred.map((k) => chip(k.term, 'soft'))));
  }
  box.append(
    el('p', {
      className: 'muted small',
      textContent: `Found ${analysis.responsibilities.length} responsibilities and ${analysis.requirements.length} requirements.`,
    }),
  );

  $('#edu-hint').textContent = analysis.education ? `The job asks for: “${analysis.education}”` : '';
  $('#cert-hint').textContent = analysis.certifications.length
    ? `Certifications mentioned in the job: ${analysis.certifications.join(', ')}. Add them above only if you hold them.`
    : '';
}

/* ---------- Step 2: profile ---------- */

function addRow(listId, tplId, values = {}) {
  const row = $(tplId).content.firstElementChild.cloneNode(true);
  for (const input of $$('[data-k]', row)) input.value = values[input.dataset.k] ?? '';
  $('.remove', row).addEventListener('click', () => {
    row.remove();
    saveProfile();
  });
  $(listId).append(row);
}

function readRows(listId) {
  return $$('.row', $(listId)).map((row) =>
    Object.fromEntries($$('[data-k]', row).map((input) => [input.dataset.k, input.value.trim()])),
  );
}

function readProfile() {
  const form = $('#profile-form');
  const v = (name) => form.elements[name].value.trim();
  return {
    contact: {
      fullName: v('fullName'),
      email: v('email'),
      phone: v('phone'),
      location: v('location'),
      linkedin: v('linkedin'),
      website: v('website'),
    },
    yearsExperience: v('yearsExperience') ? Number(v('yearsExperience')) : null,
    paperSize: v('paperSize'),
    certifications: v('certifications').split('\n').map((s) => s.trim()).filter(Boolean),
    work: readRows('#work-list').filter((w) => w.title || w.company),
    education: readRows('#edu-list').filter((e) => e.degree || e.institution),
  };
}

function saveProfile() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(readProfile()));
  } catch {
    // storage may be disabled
  }
}

function loadProfile() {
  let profile = null;
  try {
    profile = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
  } catch {
    profile = null;
  }
  const form = $('#profile-form');
  if (profile) {
    for (const [k, value] of Object.entries(profile.contact || {})) if (form.elements[k]) form.elements[k].value = value;
    if (profile.yearsExperience) form.elements.yearsExperience.value = profile.yearsExperience;
    if (profile.paperSize) form.elements.paperSize.value = profile.paperSize;
    form.elements.certifications.value = (profile.certifications || []).join('\n');
  }
  const work = profile?.work?.length ? profile.work : [{}];
  const edu = profile?.education?.length ? profile.education : [{}];
  work.forEach((w) => addRow('#work-list', '#work-tpl', w));
  edu.forEach((e) => addRow('#edu-list', '#edu-tpl', e));
}

$('#add-work').addEventListener('click', () => addRow('#work-list', '#work-tpl'));
$('#add-edu').addEventListener('click', () => addRow('#edu-list', '#edu-tpl'));
$('#profile-form').addEventListener('input', saveProfile);
$('#clear-saved').addEventListener('click', () => {
  localStorage.removeItem(STORAGE_KEY);
  $('#profile-form').reset();
  $('#work-list').replaceChildren();
  $('#edu-list').replaceChildren();
  addRow('#work-list', '#work-tpl');
  addRow('#edu-list', '#edu-tpl');
  setStatus('#profile-status', 'Saved details cleared.');
});

async function generate() {
  const button = $('#profile-submit');
  busy(button, true, 'Conjuring your resume…');
  setStatus('#profile-status', '');
  try {
    saveProfile();
    await nextFrame();
    const data = draftResume(state.job, readProfile());
    state.resume = data.resume;
    renderReview(data);
    $('#step-review').hidden = false;
    $('#step-review').scrollIntoView({ behavior: 'smooth' });
  } catch (err) {
    setStatus('#profile-status', err.message, true);
  } finally {
    busy(button, false);
  }
}

$('#profile-form').addEventListener('submit', (e) => {
  e.preventDefault();
  generate();
});

/* ---------- Step 3: review ---------- */

function renderReview({ resume, coverage }) {
  const cov = $('#coverage');
  cov.replaceChildren(
    el('div', { className: 'score' }, [
      el('strong', { textContent: `${coverage.score}%` }),
      el('span', { textContent: ' ATS keyword match' }),
    ]),
  );
  if (coverage.missing.length) {
    cov.append(el('p', { className: 'label', textContent: 'Missing keywords' }));
    cov.append(el('div', { className: 'chips' }, coverage.missing.map((k) => chip(k, 'warn'))));
  }

  $('#rv-headline').value = resume.headline;
  $('#rv-summary').value = resume.summary;
  $('#rv-skills').value = resume.skills.map((g) => `${g.category}: ${g.items.join(', ')}`).join('\n');

  const container = $('#rv-experience');
  container.replaceChildren();
  resume.experience.forEach((job, i) => {
    const block = $('#exp-tpl').content.firstElementChild.cloneNode(true);
    $('legend', block).textContent = `Experience ${i + 1}`;
    for (const input of $$('[data-k]', block)) {
      const k = input.dataset.k;
      input.value = k === 'bullets' ? job.bullets.join('\n') : job[k] ?? '';
    }
    container.append(block);
  });
}

function readReview() {
  const skills = $('#rv-skills')
    .value.split('\n')
    .map((line) => {
      const idx = line.indexOf(':');
      const category = idx > 0 ? line.slice(0, idx).trim() : 'Skills';
      const items = (idx > 0 ? line.slice(idx + 1) : line).split(',').map((s) => s.trim()).filter(Boolean);
      return { category, items };
    })
    .filter((g) => g.items.length);

  const experience = $$('.exp', $('#rv-experience')).map((block) => {
    const get = (k) => $(`[data-k="${k}"]`, block).value.trim();
    return {
      title: get('title'),
      company: get('company'),
      location: get('location'),
      start: get('start'),
      end: get('end'),
      bullets: get('bullets').split('\n').map((b) => b.replace(/^[•\-*]\s*/, '').trim()).filter(Boolean),
    };
  });

  const profile = readProfile();
  return {
    ...state.resume,
    contact: profile.contact,
    paperSize: profile.paperSize,
    headline: $('#rv-headline').value.trim(),
    summary: $('#rv-summary').value.trim(),
    skills,
    experience,
  };
}

$('#review-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const button = $('#download');
  busy(button, true, 'Building document…');
  setStatus('#review-status', '');
  try {
    const { blob, fileName: name } = await createDocx(readReview());
    const href = URL.createObjectURL(blob);
    const a = el('a', { href, download: name });
    document.body.append(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(href), 10_000);
    setStatus('#review-status', `Downloaded ${name}. Replace any yellow-highlighted placeholders in Word before applying.`);
  } catch (err) {
    setStatus('#review-status', err.message, true);
  } finally {
    busy(button, false);
  }
});

$('#regenerate').addEventListener('click', generate);

loadProfile();
