// Verify the scalar sensor surfaces, badges, and the wind Labels mode.
import { chromium } from 'playwright';
import { mkdir } from 'node:fs/promises';

const baseUrl = process.argv[2] ?? 'http://localhost:5174';
const outputDir = 'artifacts/monitoring-sensors';

const errors = [];
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1600, height: 950 } });
page.on('pageerror', (error) => errors.push(`pageerror: ${error.message}`));
page.on('console', (message) => {
  if (message.type() === 'error') errors.push(message.text());
});

await mkdir(outputDir, { recursive: true });
await page.goto(`${baseUrl}/monitoring`, { waitUntil: 'domcontentloaded' });
await page.waitForSelector('#monitoring-sensor-tree', { timeout: 30_000 });
await page.waitForSelector('canvas', { timeout: 60_000 });

const panelText = async (selector) => {
  const node = page.locator(selector);
  if ((await node.count()) === 0) return null;
  return (await node.innerText()).replace(/\n+/g, ' | ');
};

// Scope sensor toggles to the tree; each detail panel also has a refresh button
// named after its variable.
const tree = page.locator('#monitoring-sensor-tree');
const sensor = (name) => tree.getByRole('button', { name: new RegExp(name) });

// ── Wind first, including the restored Labels mode ──
await sensor('Wind Speed & Direction').click();
await page.waitForSelector('#monitoring-wind-panel', { timeout: 60_000 });
await page.waitForTimeout(4000);
await page.screenshot({ path: `${outputDir}/1-wind-arrows.png` });

await page.getByRole('button', { name: 'Labels', exact: true }).click();
await page.waitForTimeout(2500);
await page.screenshot({ path: `${outputDir}/2-wind-labels.png` });

// Turn wind off so the scalar surfaces are unobstructed.
await sensor('Wind Speed & Direction').click();
await page.waitForTimeout(1200);

// ── Each scalar variable as a surface, then as badges ──
const variables = [
  ['Air Temperature', 'temp'],
  ['Relative Humidity', 'humidity'],
  ['Barometric Pressure', 'pressure'],
  ['Precipitation', 'precip'],
];

for (const [name, slug] of variables) {
  console.log(`\n=== ${name}`);
  await sensor(name).click();

  try {
    await page.waitForSelector('#monitoring-scalar-panel', { timeout: 45_000 });
  } catch {
    const alert = await panelText('[role="alert"]');
    console.log(`  NO PANEL. alert: ${alert}`);
    // Toggle back off before moving on.
    await sensor(name).click();
    await page.waitForTimeout(800);
    continue;
  }

  await page.waitForTimeout(2600);
  console.log(`  stats: ${await panelText('#monitoring-scalar-panel')}`);
  await page.screenshot({ path: `${outputDir}/3-${slug}-surface.png` });

  await page.getByRole('button', { name: 'Labels', exact: true }).click();
  await page.waitForTimeout(2200);
  await page.screenshot({ path: `${outputDir}/4-${slug}-labels.png` });

  // Back to surface for the next variable, then switch away.
  await page.getByRole('button', { name: 'Surface', exact: true }).click();
  await page.waitForTimeout(800);
}

// ── Confirm scalars are mutually exclusive ──
await sensor('Air Temperature').click();
await page.waitForSelector('#monitoring-scalar-panel', { timeout: 45_000 });
await page.waitForTimeout(2000);
const activeCount = await page.locator('#monitoring-scalar-panel').count();
console.log(`\nscalar panels rendered simultaneously: ${activeCount} (expect 1)`);

// ── Wind + temperature together ──
await sensor('Wind Speed & Direction').click();
await page.waitForSelector('#monitoring-wind-panel', { timeout: 60_000 });
await page.waitForTimeout(3000);
await page.screenshot({ path: `${outputDir}/5-wind-over-temperature.png` });

const surfaceCanvases = await page.evaluate(() => {
  return [...document.querySelectorAll('.esri-view-surface canvas')].map((canvas) => {
    const context = canvas.getContext('2d', { willReadFrequently: true });
    if (!context) return { readable: false };
    const { data } = context.getImageData(0, 0, canvas.width, canvas.height);
    let painted = 0;
    for (let i = 3; i < data.length; i += 4) if (data[i] > 0) painted++;
    return { w: canvas.width, h: canvas.height, painted };
  });
});
console.log(`canvas layers: ${JSON.stringify(surfaceCanvases)}`);

console.log(`\nconsole/page errors (${errors.length}):`);
for (const error of [...new Set(errors)].slice(0, 12)) console.log(`  - ${error}`);

await browser.close();
