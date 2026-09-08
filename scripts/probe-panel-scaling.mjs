// Measure how the panel content sizes itself as the panel widens.
import { chromium } from 'playwright';

const baseUrl = process.argv[2] ?? 'http://localhost:5180';

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1700, height: 950 } });
await page.goto(`${baseUrl}/monitoring`, { waitUntil: 'domcontentloaded' });
await page.waitForSelector('#monitoring-sensor-tree', { timeout: 30_000 });

const tree = page.locator('#monitoring-sensor-tree');
await tree.getByRole('button', { name: /Air Temperature/ }).click();
await page.waitForSelector('#monitoring-scalar-panel', { timeout: 45_000 });
await page.waitForTimeout(2000);

const report = async (tag) => {
  const data = await page.evaluate(() => {
    const panel = document.querySelector('aside[aria-label="current conditions"]');
    if (!panel) return { error: 'panel not found' };
    const wrapper = panel.firstElementChild;
    const inner = panel.querySelector('#monitoring-detail-panel');
    const style = wrapper ? getComputedStyle(wrapper) : null;
    return {
      panelWidth: Math.round(panel.getBoundingClientRect().width),
      wrapperRendered: wrapper ? Math.round(wrapper.getBoundingClientRect().width) : null,
      wrapperCssWidth: style?.width ?? null,
      zoom: style?.zoom ?? null,
      innerRendered: inner ? Math.round(inner.getBoundingClientRect().width) : null,
      sampleFontSize: (() => {
        const heading = panel.querySelector('#monitoring-scalar-panel h3');
        return heading ? getComputedStyle(heading).fontSize : null;
      })(),
    };
  });
  console.log(`${tag}: ${JSON.stringify(data)}`);
  return data;
};

await report('default   ');

const handle = page.getByRole('separator', { name: /Resize current conditions/ });
const box = await handle.boundingBox();
await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
await page.mouse.down();
await page.mouse.move(box.x - 200, box.y + box.height / 2, { steps: 20 });
await page.mouse.up();
await page.waitForTimeout(800);

await report('widened   ');
await page.screenshot({ path: 'artifacts/monitoring-panels/probe-widened.png' });

await browser.close();
