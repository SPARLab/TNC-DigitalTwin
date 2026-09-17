// Verify the Current Conditions tiles populate on first load, and that each one
// really is the maximum of the same data the detail panel shows.
//
// The cross-check matters more than "a number appeared": the tiles compute their
// own maxima, so the way they can be wrong is by disagreeing with the layer they
// summarize. Comparing against the panel's own High stat uses the app's pipeline
// as the reference rather than reimplementing unit correction in the test.
import { chromium } from 'playwright';
import { mkdir } from 'node:fs/promises';

const baseUrl = process.argv[2] ?? 'http://localhost:5180';
const outputDir = 'artifacts/monitoring-summary';

const failures = [];
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1600, height: 950 } });
const consoleErrors = [];
page.on('pageerror', (error) => consoleErrors.push(`pageerror: ${error.message}`));
page.on('console', (message) => {
  if (message.type() === 'error') consoleErrors.push(message.text());
});

await mkdir(outputDir, { recursive: true });
await page.addInitScript(() => window.localStorage.removeItem('v2-monitoring-view-mode'));
await page.goto(`${baseUrl}/monitoring`, { waitUntil: 'domcontentloaded' });
await page.waitForSelector('#monitoring-sensor-tree', { timeout: 30_000 });
await page.waitForSelector('canvas', { timeout: 60_000 });
await page.waitForSelector('[id^="monitoring-category-"]', { timeout: 30_000 });

const tree = page.locator('#monitoring-sensor-tree');

/** Tile label to displayed number, reading the Current Conditions grid. */
async function readTiles() {
  return page.evaluate(() => {
    const panel = document.querySelector('#monitoring-detail-panel');
    if (!panel) return null;
    const tiles = {};
    for (const tile of panel.querySelectorAll('.grid > div')) {
      const lines = tile.innerText.split('\n').map((l) => l.trim()).filter(Boolean);
      if (lines.length < 2) continue;
      // Rendered as value, then unit, then label.
      tiles[lines[lines.length - 1]] = lines[0];
    }
    return tiles;
  });
}

/** A named stat from whichever detail panel is mounted, e.g. High or Current. */
async function readStat(name) {
  return page.evaluate((statName) => {
    const panel = document.querySelector('#monitoring-detail-panel');
    if (!panel) return null;
    const lines = panel.innerText.split('\n').map((l) => l.trim()).filter(Boolean);
    const index = lines.findIndex((line) => line.startsWith(statName));
    if (index <= 0) return null;
    return lines[index - 1];
  }, name);
}

async function toggle(name) {
  await tree.getByRole('button', { name }).click();
  await page.waitForTimeout(6500);
}

const check = (label, condition, detail) => {
  console.log(`  ${condition ? 'PASS' : 'FAIL'} ${label}${detail ? ` — ${detail}` : ''}`);
  if (!condition) failures.push(`${label}${detail ? ` — ${detail}` : ''}`);
};

console.log('=== tiles on first load, nothing selected ===');
// The six fetches run in parallel behind the panel; give them room.
await page.waitForTimeout(9000);
const tiles = await readTiles();
console.log(`  ${JSON.stringify(tiles, null, 0)}`);

const EXPECTED = ['Air Temp', 'Wind Speed', 'Humidity', 'Pressure', 'Creek Height', 'Creek Temp'];
for (const label of EXPECTED) {
  const value = tiles?.[label];
  check(`${label} shows a reading`, value !== undefined && value !== '--', `value=${value}`);
}

const observed = await page.evaluate(() => {
  const text = document.querySelector('#monitoring-detail-panel')?.innerText ?? '';
  return text.split('\n').find((line) => line.trim().startsWith('Observed'))?.trim() ?? '';
});
console.log(`  ${observed || 'no observed line'}`);
await page.screenshot({ path: `${outputDir}/1-tiles-populated.png` });

console.log('\n=== each tile is the max of what its layer reports ===');
for (const [sensor, tileLabel, stat] of [
  [/Air Temperature/, 'Air Temp', 'High'],
  [/Humidity/, 'Humidity', 'High'],
  [/Barometric Pressure/, 'Pressure', 'High'],
  [/Jalama Creek Gauge Height/, 'Creek Height', 'Current'],
  [/Jalama Creek Water Temperature/, 'Creek Temp', 'Current'],
]) {
  await toggle(sensor);
  const panelValue = await readStat(stat);
  check(
    `${tileLabel} matches the panel's ${stat}`,
    panelValue !== null && panelValue === tiles?.[tileLabel],
    `tile=${tiles?.[tileLabel]} panel=${panelValue}`,
  );
  await toggle(sensor);
}

// Wind's panel headlines gust and mean rather than the highest sustained speed,
// so the invariant available here is that no station's average beats the gust.
console.log('\n=== wind sits below the peak gust ===');
await toggle(/Wind/);
const gust = await page.evaluate(() => {
  const lines = (document.querySelector('#monitoring-detail-panel')?.innerText ?? '')
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);
  const index = lines.findIndex((line) => /gust/i.test(line));
  return index > 0 ? lines[index - 1] : null;
});
const windTile = Number.parseFloat(tiles?.['Wind Speed'] ?? 'NaN');
const gustValue = Number.parseFloat(gust ?? 'NaN');
check(
  'max sustained wind <= peak gust',
  Number.isFinite(windTile) && Number.isFinite(gustValue) && windTile <= gustValue,
  `tile=${windTile} gust=${gustValue}`,
);
await toggle(/Wind/);

console.log('\n=== tiles come back once the layer is off ===');
const restored = await readTiles();
check(
  'all six still populated',
  EXPECTED.every((label) => restored?.[label] && restored[label] !== '--'),
  JSON.stringify(restored),
);
await page.screenshot({ path: `${outputDir}/2-tiles-restored.png` });

console.log(`\n=== ${failures.length} failure(s) ===`);
for (const line of failures) console.log(`  - ${line}`);
console.log(`=== console errors (${consoleErrors.length}) ===`);
for (const line of [...new Set(consoleErrors)].slice(0, 6)) console.log(`  - ${line}`);

await browser.close();
process.exit(failures.length ? 1 : 0);
