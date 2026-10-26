// jsonresume-theme-codegeek-ats
//
// A single-column, plain-text-first JSON Resume theme built for automated
// resume parsers (Workday, Greenhouse, Lever, iCIMS, Taleo, SmartRecruiters…)
// and for a compact two-page print.
//
// Parsing rules this theme follows on purpose:
//  * One column, DOM order == visual order == reading order. No grid, float,
//    flex "columns", tables, icons, images, or text in page headers/footers.
//  * Standard section titles ("Summary", "Experience", "Skills", "Education").
//  * Each job keeps title, company, location and dates on one line, in a
//    fixed order, so every parser sees the same tokens next to each other.
//  * Dates are "Mon YYYY - Mon YYYY" / "Present", built from the literal
//    string parts (never `new Date('YYYY-MM-DD')`, which shifts by timezone).
//  * Bullets are real "•" characters in the text, not CSS list markers.
//  * No letter-spacing, no justification, ligatures off: those make PDF
//    text extraction split or merge words ("Of ce", "con guration").
//  * Contact details are plain visible text (URLs shown without "https://").
//
// Options live in resume.meta.atsTheme (all optional):
//   language:        "en" | "es"   (falls back to resume.meta.language, then "en")
//   condenseBefore:  "YYYY"        roles that ENDED before this year render as
//                                  a one-line entry (no description/bullets)
//   hideSkillLevel:  boolean       default true
//   showCompanyUrl:  boolean       default false

const I18N = {
  en: {
    summary: 'Summary',
    experience: 'Experience',
    earlier: 'Earlier Experience',
    skills: 'Skills',
    education: 'Education',
    projects: 'Projects',
    certificates: 'Certifications',
    awards: 'Awards',
    publications: 'Publications',
    volunteer: 'Volunteer Experience',
    languages: 'Languages',
    present: 'Present',
    months: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
    resume: 'Resume',
  },
  es: {
    summary: 'Resumen Profesional',
    experience: 'Experiencia',
    earlier: 'Experiencia Previa',
    skills: 'Habilidades',
    education: 'Educación',
    projects: 'Proyectos',
    certificates: 'Certificaciones',
    awards: 'Reconocimientos',
    publications: 'Publicaciones',
    volunteer: 'Voluntariado',
    languages: 'Idiomas',
    present: 'Actualidad',
    months: ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'],
    resume: 'Currículum',
  },
};

const style = `
  @page { size: Letter; margin: 0.55in 0.6in; }
  *, *::before, *::after { box-sizing: border-box; }
  html { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  body {
    margin: 0;
    background: #ffffff;
    color: #111111;
    font-family: Arial, Helvetica, "Liberation Sans", sans-serif;
    font-size: 10.5pt;
    line-height: 1.32;
    letter-spacing: 0;
    word-spacing: 0;
    text-align: left;
    font-variant-ligatures: none;
    font-feature-settings: "liga" 0, "clig" 0;
  }
  main { max-width: 8.5in; margin: 0 auto; padding: 0.55in 0.6in; }
  @media print { main { padding: 0; max-width: none; } }
  a { color: inherit; text-decoration: none; }
  p, ul, h1, h2, h3 { margin: 0; padding: 0; }

  header { margin-bottom: 8pt; }
  h1 { font-size: 18pt; font-weight: 700; line-height: 1.15; }
  .label { font-size: 11pt; font-weight: 700; margin-top: 2pt; }
  .contact { margin-top: 3pt; }

  section { margin-top: 9pt; }
  h2 {
    font-size: 11pt;
    font-weight: 700;
    border-bottom: 1px solid #111111;
    padding-bottom: 1pt;
    margin-bottom: 4pt;
  }

  .entry { margin-top: 6pt; break-inside: avoid; page-break-inside: avoid; }
  .entry:first-of-type { margin-top: 0; }
  h3 { font-size: 10.5pt; font-weight: 400; line-height: 1.32; }
  h3 strong { font-weight: 700; }
  .entry p { margin-top: 1.5pt; }
  ul.bullets { list-style: none; margin-top: 1.5pt; }
  ul.bullets li { padding-left: 11pt; text-indent: -11pt; }

  .condensed { margin-top: 2pt; break-inside: avoid; }
  .skills p { margin-top: 1.5pt; }
  .skills p:first-of-type { margin-top: 0; }
`;

// ---------- helpers ----------

const esc = (value) =>
  String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

const clean = (value) => String(value ?? '').trim();

// Display a URL as plain readable text: no scheme, no "www.", no trailing "/".
const bareUrl = (url) =>
  clean(url).replace(/^https?:\/\//i, '').replace(/^www\./i, '').replace(/\/+$/, '');

const link = (url, text) => {
  const href = clean(url);
  if (!href) return esc(text);
  return `<a href="${esc(href)}">${esc(text ?? bareUrl(href))}</a>`;
};

// Parse "YYYY", "YYYY-MM" or "YYYY-MM-DD" from its literal components only.
const parseDate = (value) => {
  const match = /^(\d{4})(?:-(\d{1,2}))?/.exec(clean(value));
  if (!match) return null;
  return { year: match[1], month: match[2] ? Number(match[2]) : null };
};

const formatDate = (value, t, { yearOnly = false } = {}) => {
  const d = parseDate(value);
  if (!d) return clean(value);
  if (yearOnly || !d.month || d.month < 1 || d.month > 12) return d.year;
  return `${t.months[d.month - 1]} ${d.year}`;
};

const dateRange = (start, end, t, opts = {}) => {
  const from = start ? formatDate(start, t, opts) : '';
  const to = end ? formatDate(end, t, opts) : start ? t.present : '';
  if (from && to) return `${from} - ${to}`;
  return from || to;
};

const joinParts = (parts, sep = ' | ') => parts.filter((p) => clean(p)).join(sep);

const bullets = (items) => {
  const list = (items ?? []).map(clean).filter(Boolean);
  if (!list.length) return '';
  const li = list
    // The source text may already start with a bullet; never double it.
    .map((h) => `<li>• ${esc(h.replace(/^[•\-*]\s*/, ''))}</li>`)
    .join('');
  return `<ul class="bullets">${li}</ul>`;
};

const paragraph = (text) => (clean(text) ? `<p>${esc(clean(text))}</p>` : '');

const section = (id, title, body) =>
  body ? `<section id="${id}"><h2>${esc(title)}</h2>${body}</section>` : '';

const pickLanguage = (resume) => {
  const raw = clean(resume.meta?.atsTheme?.language || resume.meta?.language || 'en').toLowerCase();
  return I18N[raw.slice(0, 2)] ? raw.slice(0, 2) : 'en';
};

// ---------- sections ----------

function renderHeader(basics = {}, t) {
  const loc = basics.location ?? {};
  const location = joinParts([loc.city, loc.region, loc.countryCode], ', ');

  const contact = joinParts([
    location && esc(location),
    basics.phone && `<a href="tel:${esc(clean(basics.phone).replace(/[^\d+]/g, ''))}">${esc(basics.phone)}</a>`,
    basics.email && `<a href="mailto:${esc(basics.email)}">${esc(basics.email)}</a>`,
    basics.url && link(basics.url),
    ...(basics.profiles ?? []).map((p) => (p.url ? link(p.url) : esc(joinParts([p.network, p.username], ': ')))),
  ]);

  return `<header>
    <h1>${esc(basics.name)}</h1>
    ${basics.label ? `<p class="label">${esc(basics.label)}</p>` : ''}
    ${contact ? `<p class="contact">${contact}</p>` : ''}
  </header>`;
}

function entryHeading({ title, org, location, dates, url }, opts) {
  const orgText = org ? (opts.showCompanyUrl && url ? link(url, org) : esc(org)) : '';
  const head = title ? `<strong>${esc(title)}</strong>` : `<strong>${orgText}</strong>`;
  const rest = joinParts([title ? orgText : '', esc(location), esc(dates)]);
  return `<h3>${joinParts([head, rest])}</h3>`;
}

function renderWork(work = [], t, opts) {
  const cutoff = opts.condenseBefore ? Number(opts.condenseBefore) : null;
  const full = [];
  const condensed = [];

  for (const job of work) {
    const heading = entryHeading(
      {
        title: job.position,
        org: job.name,
        location: job.location,
        dates: dateRange(job.startDate, job.endDate, t),
        url: job.url,
      },
      opts,
    );
    const endYear = parseDate(job.endDate)?.year;
    if (cutoff && endYear && Number(endYear) < cutoff) {
      condensed.push(`<div class="condensed">${heading}</div>`);
    } else {
      full.push(`<div class="entry">${heading}${paragraph(job.summary)}${bullets(job.highlights)}</div>`);
    }
  }

  return {
    main: section('experience', t.experience, full.join('')),
    earlier: section('earlier-experience', t.earlier, condensed.join('')),
  };
}

function renderSkills(skills = [], t, opts) {
  const lines = skills
    .filter((s) => clean(s.name) || (s.keywords ?? []).length)
    .map((s) => {
      const name = clean(s.name);
      const level = !opts.hideSkillLevel && clean(s.level) ? ` (${esc(s.level)})` : '';
      const keywords = (s.keywords ?? []).map(clean).filter(Boolean).map(esc).join(', ');
      if (!name) return `<p>${keywords}</p>`;
      return `<p><strong>${esc(name)}${level}:</strong> ${keywords}</p>`;
    });
  return lines.length ? section('skills', t.skills, `<div class="skills">${lines.join('')}</div>`) : '';
}

function renderEducation(education = [], t) {
  const items = education.map((ed) => {
    const degree = joinParts([ed.studyType, ed.area], ', ');
    const heading = entryHeading(
      {
        title: degree || ed.institution,
        org: degree ? ed.institution : '',
        location: ed.location,
        dates: dateRange(ed.startDate, ed.endDate, t, { yearOnly: true }),
      },
      {},
    );
    const extra = joinParts([ed.score && `GPA: ${ed.score}`, (ed.courses ?? []).join(', ')], ' | ');
    return `<div class="entry">${heading}${paragraph(extra)}</div>`;
  });
  return section('education', t.education, items.join(''));
}

function renderSimpleList(id, title, items, map) {
  const rows = (items ?? []).map(map).filter(Boolean);
  return section(id, title, rows.join(''));
}

// ---------- entry point ----------

export function render(resume) {
  const lang = pickLanguage(resume);
  const t = I18N[lang];
  const cfg = resume.meta?.atsTheme ?? {};
  const opts = {
    condenseBefore: cfg.condenseBefore,
    hideSkillLevel: cfg.hideSkillLevel !== false,
    showCompanyUrl: cfg.showCompanyUrl === true,
  };
  const basics = resume.basics ?? {};
  const work = renderWork(resume.work, t, opts);

  const projects = renderSimpleList('projects', t.projects, resume.projects, (p) =>
    `<div class="entry">${entryHeading({ title: p.name, org: joinParts([...(p.roles ?? [])], ', '), dates: dateRange(p.startDate, p.endDate, t) }, {})}${paragraph(joinParts([p.description, p.url && bareUrl(p.url)], ' | '))}${bullets(p.highlights)}</div>`,
  );
  const certificates = renderSimpleList('certifications', t.certificates, resume.certificates, (c) =>
    `<p>${joinParts([`<strong>${esc(c.name)}</strong>`, esc(c.issuer), esc(formatDate(c.date, t))])}</p>`,
  );
  const awards = renderSimpleList('awards', t.awards, resume.awards, (a) =>
    `<div class="entry">${entryHeading({ title: a.title, org: a.awarder, dates: formatDate(a.date, t) }, {})}${paragraph(a.summary)}</div>`,
  );
  const publications = renderSimpleList('publications', t.publications, resume.publications, (p) =>
    `<div class="entry">${entryHeading({ title: p.name, org: p.publisher, dates: formatDate(p.releaseDate, t) }, {})}${paragraph(p.summary)}</div>`,
  );
  const volunteer = renderSimpleList('volunteer', t.volunteer, resume.volunteer, (v) =>
    `<div class="entry">${entryHeading({ title: v.position, org: v.organization, dates: dateRange(v.startDate, v.endDate, t) }, {})}${paragraph(v.summary)}${bullets(v.highlights)}</div>`,
  );
  const languages = (resume.languages ?? []).length
    ? section(
        'languages',
        t.languages,
        `<p>${resume.languages.map((l) => esc(joinParts([l.language, l.fluency && `(${l.fluency})`], ' '))).join(', ')}</p>`,
      )
    : '';

  const body = [
    renderHeader(basics, t),
    section('summary', t.summary, paragraph(basics.summary)),
    renderSkills(resume.skills, t, opts),
    work.main,
    work.earlier,
    projects,
    renderEducation(resume.education, t),
    certificates,
    awards,
    publications,
    volunteer,
    languages,
  ].join('\n');

  return `<!doctype html>
<html lang="${lang}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="author" content="${esc(basics.name)}">
<title>${esc(joinParts([basics.name, t.resume], ' - '))}</title>
<style>${style}</style>
</head>
<body>
<main>
${body}
</main>
</body>
</html>`;
}

export default { render };
