import { execFileSync } from 'node:child_process';
import { mkdirSync } from 'node:fs';
import { resolve } from 'node:path';

// jsonresume-theme-berlin-grid-ats parses "YYYY-MM" dates as UTC midnight but
// formats them with the system's local timezone, shifting dates back a month
// west of UTC. Force UTC for the whole process so parsing and formatting agree.
process.env.TZ = 'UTC';

const OUT_DIR = 'out';

const LANGUAGES = [
  { code: 'en', file: 'resume.json', suffix: '' },
  { code: 'es', file: 'resume-es.json', suffix: '-es' },
];

const FORMATS = [
  { name: 'regular', theme: 'jsonresume-theme-even', suffix: '' },
  { name: 'ats', theme: 'jsonresume-theme-berlin-grid-ats', suffix: '-ats' },
];

function run(command, args) {
  execFileSync(command, args, { stdio: 'inherit' });
}

mkdirSync(OUT_DIR, { recursive: true });

let failed = false;

for (const lang of LANGUAGES) {
  console.log(`\n=== Validating ${lang.file} ===`);
  try {
    run('npx', ['resume', 'validate', '-r', lang.file]);
  } catch {
    console.error(`✗ ${lang.file} failed schema validation, skipping render.`);
    failed = true;
    continue;
  }

  for (const format of FORMATS) {
    const base = `resume${lang.suffix}${format.suffix}`;
    const htmlPath = resolve(OUT_DIR, `${base}.html`);
    const pdfPath = resolve(OUT_DIR, `${base}.pdf`);

    if (format.name === 'ats') {
      console.log(`\n=== ATS audit: ${lang.code} / ${format.name} ===`);
      run('npx', ['resume', 'audit', lang.file, '--theme', format.theme]);
    }

    console.log(`\n=== Rendering ${lang.code} / ${format.name} -> ${htmlPath} ===`);
    run('npx', ['resumed', 'render', lang.file, '-t', format.theme, '-o', htmlPath]);

    console.log(`=== Rendering ${lang.code} / ${format.name} -> ${pdfPath} ===`);
    run('node', ['scripts/render-pdf.mjs', htmlPath, pdfPath]);
  }
}

if (failed) {
  console.error(`\nCompleted with validation failures, see above.`);
  process.exit(1);
}

console.log(`\nAll resumes validated and rendered to ${OUT_DIR}/`);
