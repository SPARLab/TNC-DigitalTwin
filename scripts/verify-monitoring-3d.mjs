// Verify groundwater is labels-only in both views, while other scalars keep both
// modes, and that the 2D/3D toggle still round-trips.
import { chromium } from 'playwright';
import { mkdir } from 'node:fs/promises';

const baseUrl = process.argv[2] ?? 'http://localhost:5180';
const outputDir = 'artifacts/monitoring-3d';

const errors = [];
const info = [];
// SceneView needs a real WebGL2 context. Headless Chromium falls back to
// SwiftShader, which Chrome now blocks outright, so no canvas is ever created.
const browser = await chromium.launch({
  headless: false,
  args: ['--ignore-gpu-blocklist', '--enable-gpu-rasterization'],
});
const page = await browser.newPage({ viewport: { width: 1600, height: 950 } });
page.on('pageerror', (error) => errors.push(`pageerror: ${error.message}`));
page.on('console', (message) => {
  const text = message.text();
  if (message.type() === 'error') errors.push(text);
  if (message.type() === 'warning' && /\[monitoring|\[MonitoringPage/.test(text)) errors.push(text);
  if (/\[sensorService\]|\[monitoring3d\]/.test(text)) info.push(text);
});

await mkdir(outputDir, { recursive: true });
await page.addInitScript(() => window.localStorage.removeItem('v2-monitoring-view-mode'));
await page.goto(`${baseUrl}/monitoring`, { waitUntil: 'domcontentloaded' });
await page.waitForSelector('#monitoring-sensor-tree', { timeout: 30_000 });
await page.waitForSelector('canvas', { timeout: 60_000 });
await page.waitForSelector('[id^="monitoring-category-"]', { timeout: 30_000 });
await page.waitForTimeout(600);

const tree = page.locator('#monitoring-sensor-tree');

const modes = () =>
  page.evaluate(() =>
    [...document.querySelectorAll('[aria-label$="visualization mode"] button')].map((b) => {
      const label = b.innerText.trim();
      return b.getAttribute('aria-pressed') === 'true' ? `${label}*` : label;
    }),
  );

const surfaceLayerVisible = () =>
  page.evaluate(
    () =>
      !!document.querySelector('#monitoring-scalar-panel')
      && document.body.innerText.includes('Inverse-distance weighted'),
  );

const step = async (label) =>
  console.log(
    `  ${label.padEnd(26)} modes=${JSON.stringify(await modes())}`
      + ` interpolationCopy=${await surfaceLayerVisible()}`,
  );

console.log('=== Groundwater in 2D: labels only ===');
await tree.getByRole('button', { name: /Groundwater/ }).click();
await page.waitForSelector('#monitoring-scalar-panel', { timeout: 45_000 });
await page.waitForTimeout(3500);
await step('groundwater 2D');
console.log(`  legend: ${(await page.locator('#monitoring-scalar-panel').innerText()).replace(/\n+/g, ' | ')}`);
await page.screenshot({ path: `${outputDir}/1-groundwater-labels-2d.png` });

console.log('\n=== Groundwater in 3D: badges plus columns, no sheet ===');
await page.locator('#monitoring-view-mode-toggle').click();
await page.waitForFunction(
  () => !document.querySelector('#monitoring-scene-area')?.innerText.includes('Loading 3D scene'),
  null,
  { timeout: 90_000 },
);
await page.waitForTimeout(16_000);
await step('groundwater 3D');
console.log(`  water-table build attempts: ${info.filter((l) => l.includes('monitoring3d')).length} (expect 0)`);
await page.screenshot({ path: `${outputDir}/2-groundwater-3d.png` });

console.log('\n=== frame the wells, which must leave an oblique camera ===');
await page.getByRole('button', { name: /Zoom to reporting stations/ }).click();
await page.waitForTimeout(10_000);
await page.screenshot({ path: `${outputDir}/3-groundwater-3d-framed.png` });

console.log('\n=== closer in, where the columns read ===');
await page.mouse.move(760, 480);
await page.mouse.wheel(0, -600);
await page.waitForTimeout(9000);
await page.screenshot({ path: `${outputDir}/3b-groundwater-3d-columns.png` });

console.log('\n=== Air Temperature keeps both modes ===');
await tree.getByRole('button', { name: /Air Temperature/ }).click();
await page.waitForTimeout(8000);
await step('temperature 3D');
await page.screenshot({ path: `${outputDir}/4-temp-3d.png` });

console.log('\n=== back to Groundwater: mode forced back to labels ===');
await page.getByRole('button', { name: 'Surface', exact: true }).click();
await page.waitForTimeout(3000);
await tree.getByRole('button', { name: /Air Temperature/ }).click();
await tree.getByRole('button', { name: /Groundwater/ }).click();
await page.waitForTimeout(8000);
await step('groundwater again');

console.log('\n=== back to 2D ===');
await page.locator('#monitoring-view-mode-toggle').click();
await page.waitForSelector('#monitoring-map-area', { timeout: 30_000 });
await page.waitForTimeout(6000);
await step('groundwater 2D again');
await page.screenshot({ path: `${outputDir}/5-back-to-2d.png` });

console.log(`\n=== console/page errors (${errors.length}) ===`);
for (const error of [...new Set(errors)].slice(0, 14)) console.log(`  - ${error}`);

await browser.close();
