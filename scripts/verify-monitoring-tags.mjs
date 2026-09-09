// Verify the Live Monitoring tree is driven by the catalog's live_tag column,
// and that Solar Radiation renders as a scalar surface.
import { chromium } from 'playwright';
import { mkdir } from 'node:fs/promises';

const baseUrl = process.argv[2] ?? 'http://localhost:5180';
const outputDir = 'artifacts/monitoring-tags';

const errors = [];
const diagnostics = [];

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1600, height: 950 } });
page.on('pageerror', (error) => errors.push(`pageerror: ${error.message}`));
page.on('console', (message) => {
  const text = message.text();
  if (message.type() === 'error') errors.push(text);
  if (text.includes('MonitoringSections')) diagnostics.push(text);
});

await mkdir(outputDir, { recursive: true });
await page.goto(`${baseUrl}/monitoring`, { waitUntil: 'domcontentloaded' });
await page.waitForSelector('#monitoring-sensor-tree', { timeout: 30_000 });
await page.waitForSelector('canvas', { timeout: 60_000 });

// The tree is populated from a network call, so wait for a section to exist.
await page.waitForSelector('[id^="monitoring-category-"]', { timeout: 30_000 });
await page.waitForTimeout(600);

// ── What did the catalog give us? ──
console.log('=== sections and sensors from live_tag ===');
const tree = await page.evaluate(() => {
  return [...document.querySelectorAll('[id^="monitoring-category-"]')].map((node) => {
    const heading = node.querySelector('button');
    const rows = [...node.querySelectorAll('li button')].map((button) => ({
      text: button.innerText.replace(/\s*\n\s*/g, ' ').trim(),
      disabled: button.disabled,
    }));
    return {
      id: node.id.replace('monitoring-category-', ''),
      heading: heading?.innerText.replace(/\s*\n\s*/g, ' ').trim() ?? '?',
      rows,
    };
  });
});

for (const section of tree) {
  console.log(`\n  [${section.id}] ${section.heading}`);
  for (const row of section.rows) {
    console.log(`    ${row.disabled ? 'x' : 'o'} ${row.text}`);
  }
}

const allRows = tree.flatMap((section) => section.rows);
const has = (name) => allRows.some((row) => row.text.includes(name));
console.log('\n=== expectations ===');
console.log(`  section named "Weather Conditions" : ${tree.some((s) => s.heading.includes('Weather Conditions'))}`);
console.log(`  Solar Radiation present           : ${has('Solar Radiation')}`);
console.log(`  Barometric Pressure present       : ${has('Barometric Pressure')}`);
console.log(`  total sensors listed              : ${allRows.length}`);
console.log(`  enabled sensors                   : ${allRows.filter((r) => !r.disabled).length}`);

await page.screenshot({ path: `${outputDir}/1-tag-driven-tree.png` });

// ── Solar Radiation as a surface ──
const treeLocator = page.locator('#monitoring-sensor-tree');
const panelText = async (selector) => {
  const node = page.locator(selector);
  if ((await node.count()) === 0) return null;
  return (await node.innerText()).replace(/\n+/g, ' | ');
};

console.log('\n=== Solar Radiation ===');
await treeLocator.getByRole('button', { name: /Solar Radiation/ }).click();

try {
  await page.waitForSelector('#monitoring-scalar-panel', { timeout: 45_000 });
  await page.waitForTimeout(2800);
  console.log(`  panel: ${await panelText('#monitoring-scalar-panel')}`);
  await page.screenshot({ path: `${outputDir}/2-solar-surface.png` });

  await page.getByRole('button', { name: 'Labels', exact: true }).click();
  await page.waitForTimeout(2200);
  await page.screenshot({ path: `${outputDir}/3-solar-labels.png` });
  console.log('  labels mode rendered');
} catch {
  console.log(`  NO PANEL. alert: ${await panelText('[role="alert"]')}`);
}

// ── Confirm something was actually painted ──
const painted = await page.evaluate(() => {
  return [...document.querySelectorAll('.esri-view-surface canvas')].map((canvas) => {
    const context = canvas.getContext('2d', { willReadFrequently: true });
    if (!context) return { readable: false };
    const { data } = context.getImageData(0, 0, canvas.width, canvas.height);
    let count = 0;
    for (let i = 3; i < data.length; i += 4) if (data[i] > 0) count++;
    return { w: canvas.width, h: canvas.height, painted: count };
  });
});
console.log(`\ncanvas layers: ${JSON.stringify(painted)}`);

console.log(`\n=== tagging diagnostics (${diagnostics.length}) ===`);
for (const line of [...new Set(diagnostics)]) console.log(`  - ${line}`);

console.log(`\n=== console/page errors (${errors.length}) ===`);
for (const error of [...new Set(errors)].slice(0, 12)) console.log(`  - ${error}`);

await browser.close();
