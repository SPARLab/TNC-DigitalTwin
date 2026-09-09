// Verify the Jalama Creek gage variables render as single labelled badges from
// services whose Latest view is the second sublayer, and that Electrical
// Conductivity reports raw multi-station values without offering a surface.
//
// The retry below dates from when the creek services answered from four
// instances of which only one carried the republished data. It is kept because
// the attempt number it reports is itself the evidence that they now load first
// try; a run that reports anything above attempt 1 means the server regressed.
import { chromium } from 'playwright';
import { mkdir } from 'node:fs/promises';

const baseUrl = process.argv[2] ?? 'http://localhost:5180';
const outputDir = 'artifacts/monitoring-creek';

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
const panel = page.locator('#monitoring-scalar-panel');

console.log('=== the tag-driven tree ===');
const rows = await page.evaluate(() =>
  [...document.querySelectorAll('#monitoring-sensor-tree button')]
    .map((b) => b.innerText.replace(/\n+/g, ' ').trim())
    .filter(Boolean),
);
for (const row of rows) console.log(`  ${row}`);

/** Turn a sensor on and wait for its panel, retrying the fetch past empty instances. */
async function activate(name, attempts = 10) {
  await tree.getByRole('button', { name }).click();

  for (let attempt = 1; attempt <= attempts; attempt++) {
    const shown = await panel
      .waitFor({ state: 'visible', timeout: 12_000 })
      .then(() => true)
      .catch(() => false);
    if (shown) return attempt;

    // Refresh re-issues the query, which round-robins onto another instance.
    const refresh = page.getByRole('button', { name: new RegExp(`Refresh`) });
    if (await refresh.count()) await refresh.first().click();
    else await tree.getByRole('button', { name }).click({ clickCount: 2, delay: 120 });
    await page.waitForTimeout(1500);
  }
  return null;
}

const summarize = async (label) => {
  const text = await panel.innerText();
  const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);
  console.log(`  ${label}: ${lines.slice(0, 6).join(' | ')}`);
  const modes = await page.evaluate(() =>
    [...document.querySelectorAll('[aria-label$="visualization mode"] button')].map((b) =>
      b.getAttribute('aria-pressed') === 'true' ? `${b.innerText.trim()}*` : b.innerText.trim(),
    ),
  );
  console.log(`     modes: ${JSON.stringify(modes)}`);
  const note = lines.find((l) => /NAVD88|fixed scale|single gage|dissolved ions/i.test(l));
  if (note) console.log(`     note:  ${note}`);
};

for (const [name, slug] of [
  [/Jalama Creek Gauge Height/, 'gauge-height'],
  [/Jalama Creek Stream Level/, 'stream-level'],
  [/Jalama Creek Discharge/, 'discharge'],
  [/Jalama Creek Water Temperature/, 'water-temp'],
]) {
  console.log(`\n=== ${name.source} ===`);
  const attempt = await activate(name);
  if (!attempt) {
    console.log('  never loaded: every instance returned an empty result set');
    await page.screenshot({ path: `${outputDir}/${slug}-no-data.png` });
    continue;
  }
  console.log(`  loaded on attempt ${attempt}`);
  await page.waitForTimeout(2500);
  await summarize('panel');

  await page.getByRole('button', { name: /Zoom to reporting stations/ }).click();
  await page.waitForTimeout(5000);
  await page.mouse.move(760, 470);
  await page.mouse.wheel(0, -300);
  await page.waitForTimeout(3500);
  await page.screenshot({ path: `${outputDir}/${slug}.png` });

  // Turn it back off so the next one starts clean.
  await tree.getByRole('button', { name }).click();
  await page.waitForTimeout(1200);
}

// Conductivity's depth probes carry Campbell fault codes reaching 7999, so the
// spread the panel reports is the evidence that the plausible range caught them.
console.log('\n=== Electrical Conductivity, raw values across four stations ===');
const ecAttempt = await activate(/Electrical Conductivity/);
if (!ecAttempt) {
  console.log('  never loaded');
  await page.screenshot({ path: `${outputDir}/conductivity-no-data.png` });
} else {
  console.log(`  loaded on attempt ${ecAttempt}`);
  await page.waitForTimeout(3000);
  await summarize('conductivity');
  const spread = await panel.innerText();
  const faults = spread.match(/7\d{3}(\.\d+)?/g);
  console.log(`  fault codes leaked into the panel: ${faults ? faults.join(', ') : 'none'}`);
  await page.getByRole('button', { name: /Zoom to reporting stations/ }).click();
  await page.waitForTimeout(5000);
  await page.screenshot({ path: `${outputDir}/conductivity.png` });
  await tree.getByRole('button', { name: /Electrical Conductivity/ }).click();
  await page.waitForTimeout(1200);
}

console.log('\n=== a multi-station variable must be unaffected ===');
await activate(/Air Temperature/);
await page.waitForTimeout(3000);
await summarize('air temperature');
await page.screenshot({ path: `${outputDir}/temp-unchanged.png` });

console.log(`\n=== errors (${errors.length}) ===`);
for (const line of [...new Set(errors)].slice(0, 10)) console.log(`  - ${line}`);

await browser.close();
