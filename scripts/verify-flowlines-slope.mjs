// Confirm NHDPlus flowlines color by slope, legend matches, and 3D has no
// atmosphere horizon bloom.
import { chromium } from 'playwright';
import { mkdir } from 'node:fs/promises';

const baseUrl = process.argv[2] ?? 'http://localhost:5180';
const outputDir = 'artifacts/flowlines-slope';

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
await page.addInitScript(() => {
  window.localStorage.setItem('v2-catalog-basemap', JSON.stringify('dark-gray-vector'));
});
await page.goto(`${baseUrl}/catalog`, { waitUntil: 'domcontentloaded' });
await page.waitForSelector('#left-sidebar-tree', { timeout: 60_000 });
await page.waitForSelector('canvas', { timeout: 60_000 });

const search = page.locator('#layer-search input');
await search.fill('Flowlines');
const flowPin = page.locator('#left-sidebar-tree [aria-label="Pin Flowlines"], #left-sidebar-tree [aria-label="Unpin Flowlines"]').first();
await flowPin.waitFor({ timeout: 20_000 });
if ((await flowPin.getAttribute('aria-label'))?.startsWith('Pin ')) {
  await flowPin.click({ force: true });
}
const flowRow = page.locator('#left-sidebar-tree [data-left-sidebar-tree-row="true"]').filter({
  has: page.locator('[aria-label="Pin Flowlines"], [aria-label="Unpin Flowlines"]'),
}).first();
await flowRow.click({ force: true });
await page.waitForTimeout(5000);

await page.locator('#map-zoom-in').click();
await page.locator('#map-zoom-in').click();
await page.waitForTimeout(2500);
await page.screenshot({ path: `${outputDir}/1-slope-2d.png` });
console.log('  2D captured');

const legendText = await page.locator('#tnc-arcgis-legend-widget').innerText().catch(() => '');
console.log(`  legend: ${legendText.replace(/\s+/g, ' ').slice(0, 220)}`);

await page.locator('#view-mode-toggle').click();
await page.waitForSelector('#lidar-visibility-toggle', { timeout: 20_000 });
await page.waitForTimeout(4000);

const canvas = page.locator('#arcgis-map-view canvas').first();
const box = await canvas.boundingBox();
if (box) {
  await page.mouse.move(box.x + box.width * 0.55, box.y + 180);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width * 0.55, box.y + 520, { steps: 12 });
  await page.mouse.up();
  await page.waitForTimeout(2000);
}

await page.screenshot({ path: `${outputDir}/2-slope-3d-tilted.png` });
console.log('  3D tilted captured');

console.log('\nconsole errors:', errors.length);
for (const error of errors.slice(0, 8)) console.log(`  ${error}`);

await browser.close();
