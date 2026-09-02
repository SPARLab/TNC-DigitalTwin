// Ad-hoc verification of the Live Monitoring wind pipeline against the dev server.
// Usage: node scripts/verify-monitoring-wind.mjs [baseUrl]

import { chromium } from 'playwright';
import { mkdir } from 'node:fs/promises';

const baseUrl = process.argv[2] ?? 'http://localhost:5174';
const outputDir = 'artifacts/monitoring-wind';

const consoleErrors = [];

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1600, height: 950 } });

page.on('console', (message) => {
  if (message.type() === 'error') consoleErrors.push(message.text());
});
page.on('pageerror', (error) => consoleErrors.push(`pageerror: ${error.message}`));

await mkdir(outputDir, { recursive: true });

console.log(`→ Opening ${baseUrl}/monitoring`);
await page.goto(`${baseUrl}/monitoring`, { waitUntil: 'domcontentloaded' });

await page.waitForSelector('#monitoring-sensor-tree', { timeout: 30_000 });
await page.waitForSelector('canvas', { timeout: 60_000 });
await page.waitForTimeout(3000);
await page.screenshot({ path: `${outputDir}/1-initial.png` });

const windButton = page.getByRole('button', { name: /Wind Speed & Direction/ });
console.log(`→ Wind row enabled: ${await windButton.isEnabled()}`);
await windButton.click();

// The stats panel only renders once the service responds.
await page.waitForSelector('#monitoring-wind-panel', { timeout: 60_000 });
await page.waitForTimeout(2500);
await page.screenshot({ path: `${outputDir}/2-arrows.png` });

const readStats = async () => {
  return page.evaluate(() => {
    const panel = document.querySelector('#monitoring-wind-panel');
    if (!panel) return null;
    return [...panel.querySelectorAll('div[title], div')]
      .map((node) => node.textContent?.trim())
      .filter((text) => text && text.length < 60)
      .slice(0, 12);
  });
};

console.log('→ Panel text:', JSON.stringify(await readStats(), null, 2));

for (const mode of ['Flow', 'Grid']) {
  console.log(`→ Switching to ${mode}`);
  await page.getByRole('button', { name: mode, exact: true }).click();
  await page.waitForTimeout(3500);
  await page.screenshot({ path: `${outputDir}/3-${mode.toLowerCase()}.png` });
}

// Confirm the flow overlay really paints pixels rather than sitting empty.
await page.getByRole('button', { name: 'Flow', exact: true }).click();
await page.waitForTimeout(3000);
const overlayStats = await page.evaluate(() => {
  const canvases = [...document.querySelectorAll('.esri-view-surface canvas')];
  return canvases.map((canvas) => {
    const context = canvas.getContext('2d', { willReadFrequently: true });
    if (!context) return { width: canvas.width, readable: false };
    const { data } = context.getImageData(0, 0, canvas.width, canvas.height);
    let painted = 0;
    for (let i = 3; i < data.length; i += 4) {
      if (data[i] > 0) painted++;
    }
    return { width: canvas.width, height: canvas.height, paintedPixels: painted };
  });
});
console.log('→ Canvas layers:', JSON.stringify(overlayStats));

console.log('→ Toggling wind off');
await page.getByRole('button', { name: /Wind Speed & Direction/ }).click();
await page.waitForTimeout(1500);
await page.screenshot({ path: `${outputDir}/4-toggled-off.png` });

const panelGone = (await page.locator('#monitoring-wind-panel').count()) === 0;
console.log(`→ Wind panel removed after toggle off: ${panelGone}`);

console.log(`→ Console errors (${consoleErrors.length}):`);
for (const error of consoleErrors.slice(0, 15)) console.log(`   - ${error}`);

await browser.close();
