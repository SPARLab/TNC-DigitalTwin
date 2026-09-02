// Screenshot the wind Labels (value badge) mode and the auto-framing fix.
import { chromium } from 'playwright';
import { mkdir } from 'node:fs/promises';

const baseUrl = process.argv[2] ?? 'http://localhost:5174';
const outputDir = 'artifacts/monitoring-wind';

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1600, height: 950 } });
const errors = [];
page.on('pageerror', (error) => errors.push(error.message));

await mkdir(outputDir, { recursive: true });
await page.goto(`${baseUrl}/monitoring`, { waitUntil: 'domcontentloaded' });
await page.waitForSelector('canvas', { timeout: 60_000 });

await page.getByRole('button', { name: /Wind Speed & Direction/ }).click();
await page.waitForSelector('#monitoring-wind-panel', { timeout: 60_000 });
// Let the auto-frame animation settle.
await page.waitForTimeout(4000);
await page.screenshot({ path: `${outputDir}/5-framed-arrows.png` });

for (const mode of ['Labels', 'Flow']) {
  await page.getByRole('button', { name: mode, exact: true }).click();
  await page.waitForTimeout(3500);
  await page.screenshot({ path: `${outputDir}/6-${mode.toLowerCase()}.png` });
}

console.log(`page errors: ${errors.length}`);
for (const error of errors.slice(0, 10)) console.log(`  - ${error}`);
await browser.close();
