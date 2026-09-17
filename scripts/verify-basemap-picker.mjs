// Verify the catalog map basemap picker: Dark in 2D, then keep it in 3D.
import { chromium } from 'playwright';
import { mkdir } from 'node:fs/promises';

const baseUrl = process.argv[2] ?? 'http://localhost:5180';
const outputDir = 'artifacts/basemap-picker';

const errors = [];
const browser = await chromium.launch({
  headless: false,
  args: ['--ignore-gpu-blocklist', '--enable-gpu-rasterization'],
});
const page = await browser.newPage({ viewport: { width: 1600, height: 950 } });
page.on('pageerror', (error) => errors.push(`pageerror: ${error.message}`));
page.on('console', (message) => {
  if (message.type() === 'error') errors.push(message.text());
});

await mkdir(outputDir, { recursive: true });
await page.addInitScript(() => window.localStorage.removeItem('v2-catalog-basemap'));
await page.goto(`${baseUrl}/catalog`, { waitUntil: 'domcontentloaded' });
await page.waitForSelector('#map-control-rail', { timeout: 60_000 });
await page.waitForSelector('canvas', { timeout: 60_000 });
await page.waitForTimeout(2000);

await page.locator('#basemap-picker-toggle').click();
await page.locator('#basemap-option-dark-gray-vector').waitFor({ timeout: 5_000 });
await page.screenshot({ path: `${outputDir}/1-picker-open.png` });
console.log('  picker open');

await page.locator('#basemap-option-dark-gray-vector').click();
await page.waitForTimeout(2500);
await page.screenshot({ path: `${outputDir}/2-dark-2d.png` });
console.log('  dark 2D');

await page.locator('#view-mode-toggle').click();
await page.waitForSelector('#lidar-visibility-toggle', { timeout: 20_000 });
await page.waitForTimeout(3500);
await page.screenshot({ path: `${outputDir}/3-dark-3d.png` });
console.log('  dark 3D');

await page.locator('#basemap-picker-toggle').click();
const darkPressed = await page.locator('#basemap-option-dark-gray-vector').getAttribute('aria-pressed');
console.log(`  dark still selected in 3D: ${darkPressed}`);
await page.screenshot({ path: `${outputDir}/4-picker-3d.png` });

console.log('\nconsole errors:', errors.length);
for (const error of errors.slice(0, 8)) console.log(`  ${error}`);

await browser.close();
