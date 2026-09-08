// Verify the sensor tree is single-select: turning a layer on turns off whatever
// was on before, and turning the active one off leaves an empty map.
//
// Wind and cameras used to be held as their own flags while the scalars shared a
// slot, so wind in particular could stay lit under a newly toggled layer. Each
// check below reports the whole set of on rows and drawn panels, since the bug
// showed up as a count rather than as an error.
import { chromium } from 'playwright';
import { mkdir } from 'node:fs/promises';

const baseUrl = process.argv[2] ?? 'http://localhost:5180';
const outputDir = 'artifacts/monitoring-exclusive';

const errors = [];
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1600, height: 950 } });
page.on('pageerror', (error) => errors.push(`pageerror: ${error.message}`));
page.on('console', (message) => {
  if (message.type() === 'error') errors.push(message.text());
});

await mkdir(outputDir, { recursive: true });
await page.addInitScript(() => window.localStorage.removeItem('v2-monitoring-view-mode'));
await page.goto(`${baseUrl}/monitoring`, { waitUntil: 'domcontentloaded' });
await page.waitForSelector('#monitoring-sensor-tree', { timeout: 30_000 });
await page.waitForSelector('canvas', { timeout: 60_000 });
await page.waitForSelector('[id^="monitoring-category-"]', { timeout: 30_000 });

const tree = page.locator('#monitoring-sensor-tree');

/** The rows the tree shows as on, and the detail panels actually mounted. */
async function state() {
  return page.evaluate(() => ({
    on: [...document.querySelectorAll('#monitoring-sensor-tree button[aria-pressed="true"]')]
      .map((b) => b.innerText.replace(/\n+/g, ' ').trim())
      .filter(Boolean),
    panels: ['wind', 'scalar', 'camera'].filter((name) =>
      document.querySelector(`#monitoring-${name}-panel`),
    ),
    empty: /Turn on a sensor/.test(document.querySelector('#monitoring-detail-panel')?.innerText ?? ''),
    // The footer names the active layer's refresh period, so it is part of the
    // same selection state and drifts the moment the two disagree.
    footer: document.querySelector('#monitoring-sidebar > div:last-child')?.innerText.trim() ?? '',
  }));
}

async function toggle(name) {
  await tree.getByRole('button', { name }).click();
  // Long enough for the fetch behind a newly selected layer to mount its panel.
  await page.waitForTimeout(6000);
}

const report = async (label, expected) => {
  const { on, panels, empty, footer } = await state();
  const ok = on.length === expected && panels.length === expected;
  console.log(`  ${ok ? 'PASS' : 'FAIL'} ${label}`);
  console.log(`       on rows: ${on.length ? on.join(' + ') : 'none'}`);
  console.log(`       panels:  ${panels.length ? panels.join(' + ') : 'none'}${empty ? ' (empty-state prompt shown)' : ''}`);
  console.log(`       footer:  ${footer}`);
  if (!ok) errors.push(`${label}: ${on.length} rows on, ${panels.length} panels drawn, expected ${expected} of each`);
};

console.log('=== one layer at a time ===');

await toggle(/Wind/);
await report('wind alone', 1);
await page.screenshot({ path: `${outputDir}/1-wind.png` });

// The original complaint: this used to leave wind on underneath.
await toggle(/Air Temperature/);
await report('air temperature replaces wind', 1);
await page.screenshot({ path: `${outputDir}/2-temp-replaces-wind.png` });

await toggle(/ALERTCalifornia Live Cameras/);
await report('cameras replace air temperature', 1);
await page.screenshot({ path: `${outputDir}/3-cameras-replace-temp.png` });

await toggle(/Wind/);
await report('wind replaces cameras', 1);

await toggle(/Electrical Conductivity/);
await report('a labels-only scalar replaces wind', 1);
await page.screenshot({ path: `${outputDir}/4-conductivity-replaces-wind.png` });

console.log('\n=== the active layer still turns itself off ===');
await toggle(/Electrical Conductivity/);
await report('nothing on', 0);
await page.screenshot({ path: `${outputDir}/5-all-off.png` });

console.log(`\n=== errors (${errors.length}) ===`);
for (const line of [...new Set(errors)].slice(0, 10)) console.log(`  - ${line}`);

await browser.close();
