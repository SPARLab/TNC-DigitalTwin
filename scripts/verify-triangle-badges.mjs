import { chromium } from 'playwright';
import { mkdir } from 'node:fs/promises';

await mkdir('artifacts/monitoring-alert-markers', { recursive: true });
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1600, height: 950 } });
await page.addInitScript(() => window.localStorage.removeItem('v2-monitoring-view-mode'));
await page.goto('http://localhost:5180/monitoring', { waitUntil: 'domcontentloaded' });
await page.waitForSelector('#monitoring-sensor-tree', { timeout: 30_000 });
await page.waitForSelector('canvas', { timeout: 60_000 });
await page.waitForSelector('[id^="monitoring-category-"]', { timeout: 30_000 });

const tree = page.locator('#monitoring-sensor-tree');
await tree.getByRole('button', { name: /Wind/ }).click();
await page.waitForTimeout(7000);

const wind = await page.evaluate(() => {
  const pressed = [...document.querySelectorAll('[aria-label$="visualization mode"] button')].map(
    (b) => (b.getAttribute('aria-pressed') === 'true' ? `${b.innerText.trim()}*` : b.innerText.trim()),
  );
  const view = window.__monitoringView;
  const layers =
    view?.map?.layers?.toArray?.().map((l) => ({
      title: l.title,
      n: l.graphics?.length ?? null,
    })) ?? [];
  return {
    pressed,
    labelsActive: pressed.some((label) => label === 'Labels*'),
    layers,
    hasFloatingAlerts: layers.some((l) => String(l.title ?? '').startsWith('Condition Alerts')),
    badgeLayer: layers.find((l) => String(l.title ?? '').includes('Station Readings')),
  };
});

console.log('wind', JSON.stringify(wind, null, 2));
await page.screenshot({ path: 'artifacts/monitoring-alert-markers/5-wind-triangle-badges.png' });

await tree.getByRole('button', { name: /Air Temperature/ }).click();
await page.waitForTimeout(7000);

const temp = await page.evaluate(() => {
  const pressed = [...document.querySelectorAll('[aria-label$="visualization mode"] button')].map(
    (b) => (b.getAttribute('aria-pressed') === 'true' ? `${b.innerText.trim()}*` : b.innerText.trim()),
  );
  const view = window.__monitoringView;
  const layers =
    view?.map?.layers?.toArray?.().map((l) => ({
      title: l.title,
      n: l.graphics?.length ?? null,
    })) ?? [];
  return {
    pressed,
    labelsActive: pressed.some((label) => label === 'Labels*'),
    badgeLayer: layers.find((l) => String(l.title ?? '').includes('Station')),
    hasFloatingAlerts: layers.some((l) => String(l.title ?? '').startsWith('Condition Alerts')),
  };
});

console.log('temp', JSON.stringify(temp, null, 2));
await page.screenshot({ path: 'artifacts/monitoring-alert-markers/6-temp-triangle-badges.png' });
await browser.close();
