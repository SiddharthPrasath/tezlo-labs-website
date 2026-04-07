import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const url = process.argv[2] || 'http://localhost:3000';
const label = process.argv[3] || '';

const dir = path.join(__dirname, 'temporary screenshots');
if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

// Find next available number
const existing = fs.readdirSync(dir).filter(f => f.startsWith('screenshot-'));
let n = 1;
while (fs.existsSync(path.join(dir, label ? `screenshot-${n}-${label}.png` : `screenshot-${n}.png`))) n++;
const filename = label ? `screenshot-${n}-${label}.png` : `screenshot-${n}.png`;
const outPath = path.join(dir, filename);

const browser = await puppeteer.launch({
  headless: true,
  args: ['--no-sandbox', '--disable-setuid-sandbox'],
});

const page = await browser.newPage();
await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 2 });
await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
await new Promise(r => setTimeout(r, 600));

// Scroll through page to trigger IntersectionObserver callbacks
await page.evaluate(async () => {
  await new Promise(resolve => {
    const total = document.body.scrollHeight;
    const step = 300;
    let pos = 0;
    const tick = setInterval(() => {
      window.scrollTo(0, pos);
      pos += step;
      if (pos >= total) {
        window.scrollTo(0, 0);
        clearInterval(tick);
        resolve();
      }
    }, 40);
  });
});
await new Promise(r => setTimeout(r, 400));
await page.screenshot({ path: outPath, fullPage: true });
await browser.close();

console.log(`Screenshot saved: ${outPath}`);
