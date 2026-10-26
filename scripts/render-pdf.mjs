import puppeteer from 'puppeteer';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const [, , input = 'resume.html', output = 'resume.pdf'] = process.argv;

const browser = await puppeteer.launch({
  args: ['--no-sandbox', '--disable-setuid-sandbox'],
  // Optional override, e.g. to reuse a system Chrome/Chromium.
  executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || undefined,
});
try {
  const page = await browser.newPage();
  await page.emulateMediaType('print');
  await page.goto(pathToFileURL(resolve(input)).href, { waitUntil: 'networkidle0' });
  await page.pdf({
    path: resolve(output),
    format: 'Letter',
    printBackground: true,
    // Honor the theme's @page size/margins when it defines them.
    preferCSSPageSize: true,
    // Tagged PDF: gives parsers an explicit reading order and structure.
    tagged: true,
    // No browser-generated header/footer text (dates, URLs, page numbers).
    displayHeaderFooter: false,
  });
} finally {
  await browser.close();
}
