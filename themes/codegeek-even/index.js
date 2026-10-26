// jsonresume-theme-codegeek-even
//
// Thin wrapper around jsonresume-theme-even (unchanged upstream) that:
//  * tightens the PRINT layout so the PDF is roughly half as long, while
//    keeping Even's look: photo + name masthead, two-column section layout,
//    timeline, accent colors and skill tags. Screen view keeps the original
//    spacing.
//  * optionally condenses older roles to title/company/dates only
//    (meta.themeOptions.condenseBefore: "YYYY", roles that ENDED before it).
//  * localizes Even's fixed English labels when meta.language is "es".

import { render as renderEven, pdfRenderOptions as evenPdfOptions } from 'jsonresume-theme-even';

const compactPrintCss = `
@page { size: Letter; margin: 0.45in 0.5in; }
@media print {
  html { font-size: 9.5pt; }
  body {
    gap: 0.9em 1.4em;
    grid-template-columns:
      [full-start] 0 [main-start side-start] 7.5em [side-end content-start] 1fr [main-end content-end] 0 [full-end];
    margin-bottom: 0;
    line-height: 1.4;
  }
  h1 { font-size: 2.2em; }
  h2 { font-size: 1.25em; }
  h3 { font-size: 1.35em; }
  h4 { font-size: 1.12em; }

  /* Masthead: keep photo + name side by side, much less vertical space. */
  .masthead { padding: 0.9em 0; gap: 0.4em 1.4em; }
  .masthead > img { max-width: 6.5em; border-width: 3px; align-self: center; }
  .masthead article p { line-height: 1.4; }
  .masthead .icon-list { flex-direction: row; justify-content: flex-start; gap: 0.2em 1.2em; }

  /* Sections and entries. */
  /* Block flow instead of grid: Chromium overlaps lines when a grid item
     splits across pages. */
  .stack { display: block; }
  .stack > * + * { margin-top: 0.65em; }
  /* Let long entries split across pages, but never orphan a job title. */
  article > header { break-inside: avoid; break-after: avoid; }
  article > * + *, .timeline > div > * + * { margin-top: 0.25em; }
  .timeline > div:not(:last-child) { padding-bottom: 0.5rem; }
  :not(.icon-list, .tag-list) > li + li { margin-top: 0.15em; }

  /* Company · dates · location on one line instead of three. */
  article > header .meta { display: flex; flex-wrap: wrap; gap: 0 0.5em; }
  article > header .meta > div + div::before { content: "·"; margin-right: 0.5em; }

  /* Skills: three groups per row, smaller tags. */
  .grid-list { grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 0.6em 1em; }
  .tag-list { gap: 0.25em; margin-top: 0.2em; }
  .tag-list > li { padding: 0.05em 0.45em; }

  /* Condensed (older) roles: no description, tighter spacing. */
  article.condensed .timeline { display: none; }
  .stack > article.condensed + article.condensed { margin-top: 0.3em; }
  article.condensed > header h4 { font-size: 1em; }
}
`;

const ES = {
  labels: {
    Work: 'Experiencia',
    Education: 'Educación',
    Skills: 'Habilidades',
    Projects: 'Proyectos',
    Volunteer: 'Voluntariado',
    Awards: 'Reconocimientos',
    Certificates: 'Certificaciones',
    Publications: 'Publicaciones',
    Languages: 'Idiomas',
    Interests: 'Intereses',
    References: 'Referencias',
  },
  months: { Jan: 'Ene', Apr: 'Abr', Aug: 'Ago', Dec: 'Dic' },
  present: 'Actualidad',
};

const endYear = (date) => {
  const match = /^(\d{4})/.exec(String(date ?? ''));
  return match ? Number(match[1]) : null;
};

function condense(resume) {
  const cutoff = Number(resume.meta?.themeOptions?.condenseBefore);
  if (!cutoff || !Array.isArray(resume.work)) return { resume, condensed: new Set() };
  const condensed = new Set();
  const work = resume.work.map((job) => {
    const year = endYear(job.endDate);
    if (year && year < cutoff) {
      condensed.add(job.startDate + '|' + job.endDate);
      const { summary, highlights, ...rest } = job;
      return rest;
    }
    return job;
  });
  return { resume: { ...resume, work }, condensed };
}

function localizeEs(html) {
  let out = html.replace('<html lang="en"', '<html lang="es"');
  for (const [en, es] of Object.entries(ES.labels)) {
    out = out.replaceAll(`<h3>${en}</h3>`, `<h3>${es}</h3>`);
  }
  out = out.replace(/(<time datetime="[^"]*">)([A-Za-z]{3})( \d{4}<\/time>)/g, (m, open, mon, rest) =>
    `${open}${ES.months[mon] ?? mon}${rest}`,
  );
  out = out.replace(/(<\/time>\s*–\s*)Present\b/g, `$1${ES.present}`);
  return out;
}

export function render(input) {
  const { resume, condensed } = condense(input);
  let html = renderEven(resume);

  // Mark condensed articles so the print CSS can tighten them.
  if (condensed.size) {
    html = html.replace(/<article>([\s\S]*?)<\/article>/g, (block, inner) => {
      const m = /<time-duration dates="([^"]*)"/.exec(inner);
      return m && condensed.has(m[1]) ? `<article class="condensed">${inner}</article>` : block;
    });
  }

  const lang = String(input.meta?.language ?? 'en').slice(0, 2).toLowerCase();
  if (lang === 'es') html = localizeEs(html);

  return html.replace('</head>', `<style>${compactPrintCss}</style></head>`);
}

export const pdfRenderOptions = { ...evenPdfOptions };
export default { render, pdfRenderOptions };
