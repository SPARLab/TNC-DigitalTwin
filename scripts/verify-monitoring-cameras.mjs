// Verify ALERTCalifornia cameras on Live Monitoring: markers, panel, preview.
import { chromium } from 'playwright';
import { mkdir } from 'node:fs/promises';

const baseUrl = process.argv[2] ?? 'http://localhost:5180';
const outputDir = 'artifacts/monitoring-cameras';

const errors = [];
const diagnostics = [];

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1600, height: 950 } });
page.on('pageerror', (error) => errors.push(`pageerror: ${error.message}`));
page.on('console', (message) => {
  const text = message.text();
  if (message.type() === 'error') errors.push(text);
  if (text.includes('MonitoringSections') || text.includes('useCameraData')) diagnostics.push(text);
});

await mkdir(outputDir, { recursive: true });
await page.goto(`${baseUrl}/monitoring`, { waitUntil: 'domcontentloaded' });
await page.waitForSelector('#monitoring-sensor-tree', { timeout: 30_000 });
await page.waitForSelector('canvas', { timeout: 60_000 });
await page.waitForSelector('[id^="monitoring-category-"]', { timeout: 30_000 });
await page.waitForTimeout(800);

const tree = page.locator('#monitoring-sensor-tree');
const panelText = async (selector) => {
  const node = page.locator(selector);
  if ((await node.count()) === 0) return null;
  return (await node.innerText()).replace(/\n+/g, ' | ');
};

console.log('=== camera section ===');
const camerasCategory = page.locator('#monitoring-category-cameras');
console.log(`  cameras section present: ${(await camerasCategory.count()) > 0}`);

const cameraToggle = tree.getByRole('button', { name: /Live Cameras|ALERT/i });
console.log(`  camera toggle present: ${(await cameraToggle.count()) > 0}`);
console.log(`  camera toggle disabled: ${await cameraToggle.isDisabled()}`);

if ((await cameraToggle.count()) === 0 || (await cameraToggle.isDisabled())) {
  console.log('Cameras row is missing or still unimplemented — aborting.');
  await page.screenshot({ path: `${outputDir}/0-missing.png` });
  await browser.close();
  process.exit(1);
}

await cameraToggle.click();

try {
  await page.waitForSelector('#monitoring-camera-panel', { timeout: 45_000 });
} catch {
  console.log(`  NO PANEL. alert: ${await panelText('[role="alert"]')}`);
  await page.screenshot({ path: `${outputDir}/0-no-panel.png` });
  await browser.close();
  process.exit(1);
}

await page.waitForTimeout(4000);
console.log(`  panel: ${await panelText('#monitoring-camera-panel')}`);
const panel = await panelText('#monitoring-camera-panel');
console.log(`  mentions 12:20 AM (stale PTZ time): ${/12:20\s*AM/i.test(panel ?? '')}`);
console.log(`  mentions PDT: ${/\bPDT\b/.test(panel ?? '')}`);
await page.screenshot({ path: `${outputDir}/1-cameras-on.png` });

const dangermond = page.locator('#monitoring-camera-panel').getByRole('button', { name: /Dangermond 1/ });
if ((await dangermond.count()) > 0) {
  await dangermond.click();
  await page.waitForTimeout(2500);
  const preview = page.locator('#monitoring-camera-panel img');
  console.log(`  preview image present: ${(await preview.count()) > 0}`);
  if ((await preview.count()) > 0) {
    console.log(`  preview src: ${await preview.getAttribute('src')}`);
  }
  await page.screenshot({ path: `${outputDir}/2-dangermond-preview.png` });

  for (let step = 0; step < 5; step++) {
    await page.locator('.esri-zoom .esri-widget--button').nth(1).click();
    await page.waitForTimeout(400);
  }
  await page.waitForTimeout(1200);
  await page.screenshot({ path: `${outputDir}/3-clustered.png` });
} else {
  console.log('  Dangermond 1 not listed');
  await page.screenshot({ path: `${outputDir}/2-no-dangermond.png` });
}

if (errors.length > 0) {
  console.log('\n=== page errors ===');
  for (const error of errors) console.log(`  ${error}`);
}
if (diagnostics.length > 0) {
  console.log('\n=== diagnostics ===');
  for (const line of diagnostics) console.log(`  ${line}`);
}

await browser.close();
