const VERBS = `accelerate achieve act adapt administer adopt advise advocate align analyse analyze answer apply architect
articulate assess assist audit automate balance benchmark build calculate champion clean coach code collaborate collect
communicate compile complete comply conceptualize conduct configure consolidate consult contribute control coordinate
craft create cultivate curate customize debug decrease define deliver demonstrate deploy design detect develop diagnose
direct discover document drive edit educate elevate embed empower enable engage engineer enhance ensure establish evaluate
evangelize evolve execute expand experiment explore facilitate forecast formulate foster gather generate grow guide handle
help hire identify implement improve increase influence initiate innovate inspect install instrument integrate interpret
interview investigate launch lead leverage liaise maintain manage map market measure mentor migrate model modernize monitor
motivate negotiate nurture onboard operate optimise optimize orchestrate organise organize own oversee partner perform
pilot plan prepare present prioritise prioritize process procure produce program promote propose prospect protect prototype
provide publish qualify recommend reconcile recruit redesign reduce refactor refine reinforce release remediate report
represent research resolve respond review revamp run scale schedule scope secure sell serve set shape ship simplify solve
source spearhead specify standardize streamline strengthen structure supervise support sustain synthesize teach test
track train transform translate triage troubleshoot unify update upgrade use utilize validate verify visualize write work
bring keep make meet take give find think understand get deal hold speak send seek oversee win participate attend close
exceed`
  .split(/\s+/)
  .filter(Boolean);

const VERB_SET = new Set(VERBS);

const IRREGULAR_PAST: Record<string, string> = {
  build: 'built', lead: 'led', write: 'wrote', drive: 'drove', run: 'ran', make: 'made', take: 'took',
  bring: 'brought', teach: 'taught', set: 'set', grow: 'grew', give: 'gave', keep: 'kept', meet: 'met',
  sell: 'sold', think: 'thought', understand: 'understood', find: 'found', oversee: 'oversaw', get: 'got',
  deal: 'dealt', hold: 'held', speak: 'spoke', send: 'sent', seek: 'sought', win: 'won', plan: 'planned',
  ship: 'shipped', control: 'controlled', program: 'programmed',
};

const IRREGULAR_GERUND: Record<string, string> = {
  plan: 'planning', ship: 'shipping', run: 'running', set: 'setting', control: 'controlling', win: 'winning',
  program: 'programming',
};

export function pastTense(verb: string): string {
  if (IRREGULAR_PAST[verb]) return IRREGULAR_PAST[verb];
  if (verb.endsWith('e')) return `${verb}d`;
  if (/[^aeiou]y$/.test(verb)) return `${verb.slice(0, -1)}ied`;
  return `${verb}ed`;
}

export function gerund(verb: string): string {
  if (IRREGULAR_GERUND[verb]) return IRREGULAR_GERUND[verb];
  if (verb.endsWith('ie')) return `${verb.slice(0, -2)}ying`;
  if (/(?:ee|ye|oe)$/.test(verb)) return `${verb}ing`;
  if (verb.endsWith('e')) return `${verb.slice(0, -1)}ing`;
  return `${verb}ing`;
}

const FROM_GERUND = new Map(VERBS.map((v) => [gerund(v), v]));

function baseForm(word: string): string | null {
  const w = word.toLowerCase();
  if (VERB_SET.has(w)) return w;
  if (FROM_GERUND.has(w)) return FROM_GERUND.get(w)!;
  if (w.endsWith('s') && VERB_SET.has(w.slice(0, -1))) return w.slice(0, -1);
  if (w.endsWith('es') && VERB_SET.has(w.slice(0, -2))) return w.slice(0, -2);
  return null;
}

const LEADING_PHRASES = [
  /^in this role,?\s*/i,
  /^as (?:a|an|the) [^,]{2,40},\s*/i,
  /^(?:you will|you'll|you’ll|you are going to|will|you)\s+/i,
  /^(?:be |are |is )?(?:responsible|accountable) for\s+/i,
  /^(?:the (?:successful )?candidate|the (?:ideal )?candidate|this person|the role) will\s+/i,
  /^(?:be )?expected to\s+/i,
  /^(?:the opportunity|opportunity) to\s+/i,
];

function stripLeading(text: string): string {
  let t = text;
  for (let changed = true; changed; ) {
    changed = false;
    for (const re of LEADING_PHRASES) {
      const next = t.replace(re, '');
      if (next !== t) {
        t = next;
        changed = true;
      }
    }
  }
  return t;
}

function depersonalize(text: string): string {
  return text
    .replace(/\b(?:our|your|Our|Your)\b/g, 'the')
    .replace(/\bwe\b/g, 'the team')
    .replace(/\bus\b/g, 'the team')
    .replace(/\bthe the\b/gi, 'the');
}

const TRAILING = /(?:[\s;:,.!]|\b(?:and|or|to|with|the|a|an|of|for|in)\b)+$/i;

function finish(text: string, maxLen = 230): string {
  let t = text.replace(/\s+/g, ' ').replace(TRAILING, '').trim();
  if (t.length > maxLen) {
    const cut = t.slice(0, maxLen);
    const at = Math.max(cut.lastIndexOf(','), cut.lastIndexOf(';'), cut.lastIndexOf(' and '));
    t = (at > maxLen * 0.5 ? cut.slice(0, at) : cut.slice(0, cut.lastIndexOf(' '))).replace(TRAILING, '').trim();
  }
  return `${t.charAt(0).toUpperCase()}${t.slice(1)}.`;
}

// Hedging that belongs in a job ad, not on a resume.
function stripHedges(text: string): string {
  return text
    .replace(/,?\s*(?:is|are|would be|will be)\s+(?:helpful|a plus|a bonus|preferred|desirable|nice to have|an advantage)\b.*$/i, '')
    .replace(/,?\s*(?:but )?not required.*$/i, '')
    .replace(/;?\s*travel(?:ing)? (?:to|up to|as)\b.*$/i, '');
}

// Common nouns that double as verbs; only converted near the start of a bullet.
const AMBIGUOUS = new Set(
  'plan process support work model program test report market track set use source map structure design document control release scale pilot schedule interview experiment balance code review update upgrade partner forecast budget train run lead'.split(' '),
);

const BULLET = /^\s*(?:[•·▪●◦‣\-*–]|\d{1,2}[.)])\s*/;

export interface Rewritten {
  past: string;
  gerundPhrase: string;
}

/** Turns a job-posting duty ("You will design and build APIs") into a resume bullet ("Designed and built APIs."). */
export function rewriteDuty(line: string): Rewritten | null {
  const stripped = depersonalize(stripHedges(stripLeading(line.replace(BULLET, '').trim())));
  const words = stripped.split(/\s+/);
  const first = words[0]?.replace(/[^A-Za-z]/g, '') ?? '';
  const base = baseForm(first);
  if (!base || words.length < 3) return null;

  const pastWords = [pastTense(base)];
  const gerundWords = [gerund(base)];
  let expectVerb = false;
  let afterAdverb = false;
  for (let i = 1; i < words.length; i++) {
    const raw = words[i];
    const clean = raw.replace(/[^A-Za-z]/g, '').toLowerCase();
    let nextBase = expectVerb ? baseForm(clean) : null;
    if (nextBase && i > 6 && !afterAdverb && AMBIGUOUS.has(nextBase)) nextBase = null;
    if (nextBase) {
      const suffix = raw.slice(clean.length);
      pastWords.push(pastTense(nextBase) + suffix);
      gerundWords.push(gerund(nextBase) + suffix);
    } else {
      pastWords.push(raw);
      gerundWords.push(raw);
    }
    const isAdverb: boolean = expectVerb && /^[a-z]+ly$/.test(raw);
    afterAdverb = isAdverb;
    expectVerb = isAdverb || /^(?:and|or|&)$/i.test(raw) || /[,;]$/.test(raw);
  }
  return { past: finish(pastWords.join(' ')), gerundPhrase: finish(gerundWords.join(' '), 120).slice(0, -1) };
}

const EXPERIENCE_RE =
  /^(?:(?:at least |minimum (?:of )?)?\d+\+?\s*(?:(?:-|–|to)\s*\d+\s*)?\+?\s*years?(?: of)?\s*)?(?:proven |demonstrated |hands-on |strong |solid |extensive |professional |prior |previous |relevant |practical )*(?:experience|track record|background)\s+(?:of |in |with |on |at )?(.+)$/i;

/** Turns "Experience building REST APIs with Node.js" into "Built REST APIs with Node.js." */
export function rewriteRequirement(line: string): string | null {
  const m = EXPERIENCE_RE.exec(stripHedges(line.replace(BULLET, '').trim()));
  if (!m) return null;
  const rest = m[1].trim();
  const first = rest.split(/\s+/)[0].toLowerCase();
  if (FROM_GERUND.has(first)) return rewriteDuty(rest)?.past ?? null;
  if (rest.split(/\s+/).length < 2 || rest.length > 160) return null;
  return finish(`Applied hands-on expertise in ${depersonalize(rest)} to deliver reliable, high-quality results`);
}
