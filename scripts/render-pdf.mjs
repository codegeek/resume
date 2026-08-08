import puppeteer from 'puppeteer';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const [, , input = 'resume.html', output = 'resume.pdf'] = process.argv;

const browser = await puppeteer.launch({
  args: ['--no-sandbox', '--disable-setuid-sandbox'],
});
try {
  const page = await browser.newPage();
  await page.goto(pathToFileURL(resolve(input)).href, { waitUntil: 'networkidle0' });
  await page.pdf({ path: resolve(output), format: 'Letter', printBackground: true });
} finally {
  await browser.close();
}
