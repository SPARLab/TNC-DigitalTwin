// Verify the Alerts pane filters open alerts by the active layer's FeatureServer URL.
import { chromium } from 'playwright';
import { mkdir } from 'node:fs/promises';

const baseUrl = process.argv[2] ?? 'http://localhost:5180';
const outputDir = 'artifacts/monitoring-alerts';

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

async function toggle(name) {
  await tree.getByRole('button', { name }).click();
  await page.waitForTimeout(5500);
}

async function alertsSummary() {
  return page.evaluate(() => {
    const panel = document.querySelector('#monitoring-alerts-panel');
    if (!panel) return null;
    const text = panel.innerText;
    return {
      text,
      hasPanel: true,
      mentionsWind: /Wind/i.test(text),
      mentionsTemp: /Air Temp|Temperature/i.test(text),
      mentionsSevere: /severe/i.test(text),
      mentionsElevated: /elevated/i.test(text),
      mentionsHumidity: /Humidity|Fire Weather/i.test(text),
      empty: /No open alerts/i.test(text),
      countLine: text.split('\n').find((line) => /Open conditions/i.test(line)) ?? '',
    };
  });
}

const check = (label, condition, detail) => {
  console.log(`  ${condition ? 'PASS' : 'FAIL'} ${label}${detail ? ` — ${detail}` : ''}`);
  if (!condition) failures.push(`${label}${detail ? ` — ${detail}` : ''}`);
};

console.log('=== no layer selected: alerts pane hidden ===');
const none = await alertsSummary();
check('alerts pane absent on empty map', none === null, JSON.stringify(none));

console.log('\n=== Wind: single + multi alerts that list the wind URL ===');
await toggle(/Wind/);
await page.waitForSelector('#monitoring-alerts-panel', { timeout: 20_000 });
const wind = await alertsSummary();
console.log(`  ${wind?.countLine}`);
check('alerts pane present for wind', Boolean(wind?.hasPanel));
check('mentions wind layer', Boolean(wind?.mentionsWind));
check('includes elevated/severe wind when present', Boolean(wind?.mentionsElevated || wind?.mentionsSevere || !wind?.empty));
check('includes multi fire-weather (humidity+wind)', Boolean(wind?.mentionsHumidity));
await page.screenshot({ path: `${outputDir}/1-wind-alerts.png` });
await toggle(/Wind/);

console.log('\n=== Air Temperature: only air-temp source alerts ===');
await toggle(/Air Temperature/);
await page.waitForSelector('#monitoring-alerts-panel', { timeout: 20_000 });
const temp = await alertsSummary();
console.log(`  ${temp?.countLine}`);
check('alerts pane present for air temp', Boolean(temp?.hasPanel));
check('does not show severe wind under air temp', !temp?.mentionsSevere);
check('does not show elevated wind under air temp', !temp?.mentionsElevated);
check('shows air-temp alerts or empty state', Boolean(temp && (!temp.empty || /Air Temp/i.test(temp.countLine))));
await page.screenshot({ path: `${outputDir}/2-temp-alerts.png` });
await toggle(/Air Temperature/);

console.log('\n=== Humidity: multi fire-weather should still appear ===');
await toggle(/Humidity/);
await page.waitForSelector('#monitoring-alerts-panel', { timeout: 20_000 });
const humidity = await alertsSummary();
console.log(`  ${humidity?.countLine}`);
check('humidity shows multi fire-weather', Boolean(humidity?.mentionsHumidity));
await page.screenshot({ path: `${outputDir}/3-humidity-alerts.png` });

console.log(`\n=== ${failures.length} failure(s) ===`);
for (const line of failures) console.log(`  - ${line}`);
console.log(`=== console errors (${consoleErrors.length}) ===`);
for (const line of [...new Set(consoleErrors)].slice(0, 8)) console.log(`  - ${line}`);

await browser.close();
process.exit(failures.length ? 1 : 0);
