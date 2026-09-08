// Verify the collapsible/draggable monitoring panels and the unit labels.
import { chromium } from 'playwright';
import { mkdir } from 'node:fs/promises';

const baseUrl = process.argv[2] ?? 'http://localhost:5180';
const outputDir = 'artifacts/monitoring-panels';

const errors = [];
const browser = await chromium.launch();
const context = await browser.newContext({ viewport: { width: 1600, height: 950 } });
const page = await context.newPage();
page.on('pageerror', (error) => errors.push(`pageerror: ${error.message}`));
page.on('console', (message) => {
  if (message.type() === 'error') errors.push(message.text());
});

await mkdir(outputDir, { recursive: true });

const left = page.getByRole('complementary', { name: 'sensor streams' });
const right = page.getByRole('complementary', { name: 'current conditions' });
const mapArea = page.locator('#monitoring-map-area');

const widths = async (tag) => {
  const [l, r, m] = await Promise.all([
    left.evaluate((node) => Math.round(node.getBoundingClientRect().width)),
    right.evaluate((node) => Math.round(node.getBoundingClientRect().width)),
    mapArea.evaluate((node) => Math.round(node.getBoundingClientRect().width)),
  ]);
  console.log(`  ${tag}: left=${l} right=${r} map=${m}`);
  return { l, r, m };
};

await page.goto(`${baseUrl}/monitoring`, { waitUntil: 'domcontentloaded' });
await page.waitForSelector('#monitoring-sensor-tree', { timeout: 30_000 });
await page.waitForSelector('canvas', { timeout: 60_000 });

// Turn on temperature so the panels have real content to scale.
const tree = page.locator('#monitoring-sensor-tree');
await tree.getByRole('button', { name: /Air Temperature/ }).click();
await page.waitForSelector('#monitoring-scalar-panel', { timeout: 45_000 });
await page.waitForTimeout(3000);

console.log('=== defaults');
const base = await widths('initial');
await page.screenshot({ path: `${outputDir}/1-default.png` });

// ── Collapse both ──
console.log('\n=== collapse both');
await page.getByRole('button', { name: /Collapse sensor streams/ }).click();
await page.waitForTimeout(600);
await page.getByRole('button', { name: /Collapse current conditions/ }).click();
await page.waitForTimeout(1200);
const collapsed = await widths('collapsed');
await page.screenshot({ path: `${outputDir}/2-both-collapsed.png` });

const fullMapGain = collapsed.m - base.m;
console.log(`  map gained ${fullMapGain}px (expect ~${base.l + base.r})`);

// ── Expand again ──
console.log('\n=== expand both');
await page.getByRole('button', { name: /Expand sensor streams/ }).click();
await page.getByRole('button', { name: /Expand current conditions/ }).click();
await page.waitForTimeout(1000);
await widths('expanded');

// ── Drag the right panel wider ──
console.log('\n=== drag right panel wider');
const handle = page.getByRole('separator', { name: /Resize current conditions/ });
const box = await handle.boundingBox();
await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
await page.mouse.down();
await page.mouse.move(box.x - 180, box.y + box.height / 2, { steps: 18 });
await page.mouse.up();
await page.waitForTimeout(900);
const widened = await widths('after drag');
console.log(`  right grew by ${widened.r - base.r}px`);

const scale = await right.evaluate((node) => {
  const wrapper = node.firstElementChild;
  return wrapper ? getComputedStyle(wrapper).zoom : 'n/a';
});
console.log(`  content zoom: ${scale}`);

// Confirm the scaled content still fits its panel rather than overflowing.
const overflow = await right.evaluate((node) => {
  const panel = Math.round(node.getBoundingClientRect().width);
  const inner = node.querySelector('#monitoring-detail-panel');
  return {
    panel,
    innerRendered: inner ? Math.round(inner.getBoundingClientRect().width) : null,
    horizontalScroll: node.scrollWidth > node.clientWidth + 1,
  };
});
console.log(`  ${JSON.stringify(overflow)}`);
await page.screenshot({ path: `${outputDir}/3-right-widened.png` });

// ── Persistence across reload ──
console.log('\n=== reload');
await page.reload({ waitUntil: 'domcontentloaded' });
await page.waitForSelector('#monitoring-sensor-tree', { timeout: 30_000 });
await page.waitForTimeout(1500);
const reloaded = await widths('after reload');
console.log(
  `  width persisted: ${Math.abs(reloaded.r - widened.r) <= 2 ? 'YES' : 'NO'}`,
);

// ── Keyboard resize on the left handle ──
console.log('\n=== keyboard resize (left)');
const leftHandle = page.getByRole('separator', { name: /Resize sensor streams/ });
await leftHandle.focus();
for (let i = 0; i < 5; i++) await page.keyboard.press('ArrowRight');
await page.waitForTimeout(700);
const keyed = await widths('after 5x ArrowRight');
console.log(`  left grew by ${keyed.l - reloaded.l}px (expect ~80)`);

// ── Double-click reset ──
await leftHandle.dblclick();
await page.waitForTimeout(700);
const reset = await widths('after double-click reset');
console.log(`  reset to default 280: ${reset.l === 280 ? 'YES' : `NO (${reset.l})`}`);

await page.screenshot({ path: `${outputDir}/4-final.png` });

// ── Unit labels ──
// The reload cleared the active sensor, so turn it back on first.
console.log('\n=== unit labels on badges');
await tree.getByRole('button', { name: /Air Temperature/ }).click();
await page.waitForSelector('#monitoring-scalar-panel', { timeout: 45_000 });
await page.waitForTimeout(2500);
await page.getByRole('button', { name: 'Labels', exact: true }).click();
await page.waitForTimeout(2500);
await page.screenshot({ path: `${outputDir}/5-badges-with-units.png` });

console.log(`\nconsole/page errors (${errors.length}):`);
for (const error of [...new Set(errors)].slice(0, 10)) console.log(`  - ${error}`);

await browser.close();
