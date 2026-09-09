// Verify Soil Temperature and Soil Moisture as labels-only Latest-layer
// readings, preferring soil_*_avg and falling back to depth probes.
import { chromium } from 'playwright';
import { mkdir } from 'node:fs/promises';

const baseUrl = process.argv[2] ?? 'http://localhost:5180';
const outputDir = 'artifacts/monitoring-soil';

const errors = [];
const info = [];
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1600, height: 950 } });
page.on('pageerror', (error) => errors.push(`pageerror: ${error.message}`));
page.on('console', (message) => {
  const text = message.text();
  if (message.type() === 'error') errors.push(text);
  if (/\[sensorService\]|\[useMonitoringSections\]/.test(text)) info.push(text);
});

await mkdir(outputDir, { recursive: true });
await page.addInitScript(() => window.localStorage.removeItem('v2-monitoring-view-mode'));
await page.goto(`${baseUrl}/monitoring`, { waitUntil: 'domcontentloaded' });
await page.waitForSelector('#monitoring-sensor-tree', { timeout: 30_000 });
await page.waitForSelector('canvas', { timeout: 60_000 });
await page.waitForSelector('[id^="monitoring-category-"]', { timeout: 30_000 });

const tree = page.locator('#monitoring-sensor-tree');

console.log('=== Soil Conditions, as the tag-driven tree sees it ===');
const soil = await page.evaluate(() => {
  const rows = [...document.querySelectorAll('#monitoring-sensor-tree button')];
  return rows
    .map((b) => b.innerText.replace(/\n+/g, ' ').trim())
    .filter((t) => /Soil|Soon|Live/i.test(t));
});
for (const row of soil) console.log(`  ${row}`);

const modesOf = async () =>
  page.evaluate(() =>
    [...document.querySelectorAll('[aria-label$="visualization mode"] button')].map((b) =>
      b.getAttribute('aria-pressed') === 'true' ? `${b.innerText.trim()}*` : b.innerText.trim(),
    ),
  );

async function toggleAndCapture(name, slug) {
  console.log(`\n=== turn on ${name} ===`);
  const button = tree.getByRole('button', { name: new RegExp(name) });
  if ((await button.count()) === 0) {
    console.log('  NOT LISTED — no live_tag on this dataset, skipping');
    return;
  }

  await button.click();
  const rendered = await page
    .waitForSelector('#monitoring-scalar-panel', { timeout: 45_000 })
    .then(() => true)
    .catch(() => false);
  await page.waitForTimeout(4000);

  if (rendered) {
    const panel = await page.locator('#monitoring-scalar-panel').innerText();
    console.log(`  panel: ${panel.replace(/\n+/g, ' | ')}`);
  } else {
    const alert = await page.locator('[role="alert"]').innerText().catch(() => '');
    console.log(`  no panel. alert: ${alert.replace(/\n+/g, ' | ') || '(none)'}`);
  }

  const modes = await modesOf();
  console.log(`  modes: ${JSON.stringify(modes)} (expect Labels only)`);

  if (rendered) {
    await page.getByRole('button', { name: /Zoom to reporting stations/ }).click();
    await page.waitForTimeout(5000);
    await page.screenshot({ path: `${outputDir}/1-${slug}-labels.png` });
  } else {
    await page.screenshot({ path: `${outputDir}/1-${slug}-no-data.png` });
  }
}

await toggleAndCapture('Soil Temperature', 'soil-temp');
await toggleAndCapture('Soil Moisture', 'soil-moisture');

console.log(`\n=== service notes (${new Set(info).size}) ===`);
for (const line of [...new Set(info)].slice(0, 8)) console.log(`  - ${line}`);
console.log(`\n=== errors (${errors.length}) ===`);
for (const line of [...new Set(errors)].slice(0, 10)) console.log(`  - ${line}`);

await browser.close();
