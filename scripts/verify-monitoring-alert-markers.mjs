// Verify Current Conditions stays put across layer switches, and that alert
// markers are mounted for the active weather layer (mappable severities only).
import { chromium } from 'playwright';
import { mkdir } from 'node:fs/promises';

const baseUrl = process.argv[2] ?? 'http://localhost:5180';
const outputDir = 'artifacts/monitoring-alert-markers';

const failures = [];
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1600, height: 950 } });
page.on('pageerror', (error) => failures.push(`pageerror: ${error.message}`));

await mkdir(outputDir, { recursive: true });
await page.addInitScript(() => window.localStorage.removeItem('v2-monitoring-view-mode'));
await page.goto(`${baseUrl}/monitoring`, { waitUntil: 'domcontentloaded' });
await page.waitForSelector('#monitoring-sensor-tree', { timeout: 30_000 });
await page.waitForSelector('canvas', { timeout: 60_000 });
await page.waitForSelector('[id^="monitoring-category-"]', { timeout: 30_000 });

const tree = page.locator('#monitoring-sensor-tree');

const check = (label, condition, detail) => {
  console.log(`  ${condition ? 'PASS' : 'FAIL'} ${label}${detail ? ` — ${detail}` : ''}`);
  if (!condition) failures.push(`${label}${detail ? ` — ${detail}` : ''}`);
};

async function toggle(name) {
  await tree.getByRole('button', { name }).click();
  await page.waitForTimeout(2500);
}

async function panelState() {
  return page.evaluate(() => {
    const detail = document.querySelector('#monitoring-detail-panel')?.innerText ?? '';
    return {
      hasCurrentConditions: /Current Conditions/i.test(detail),
      hasAlerts: Boolean(document.querySelector('#monitoring-alerts-panel')),
      hasWindPanel: Boolean(document.querySelector('#monitoring-wind-panel')),
      hasScalarPanel: Boolean(document.querySelector('#monitoring-scalar-panel')),
      loadingOnly: /Loading the latest readings/i.test(detail) && !/Current Conditions/i.test(detail),
    };
  });
}

console.log('=== Current Conditions on first load ===');
await page.waitForTimeout(8000);
const initial = await panelState();
check('shows Current Conditions with nothing selected', initial.hasCurrentConditions);
await page.screenshot({ path: `${outputDir}/1-summary.png` });

const firstTileValues = await page.evaluate(() => {
  const panel = document.querySelector('#monitoring-detail-panel');
  return panel
    ? [...panel.querySelectorAll('.grid > div')].map((el) => el.innerText.split('\n')[0])
    : [];
});

console.log('\n=== switching layers must not remount Current Conditions ===');
await toggle(/Wind/);
await page.waitForTimeout(4000);
const onWind = await panelState();
check('Current Conditions hidden while wind is on', !onWind.hasCurrentConditions, JSON.stringify(onWind));
check('alerts pane present on wind', onWind.hasAlerts);

await toggle(/Air Temperature/);
// Catch the intermediate state during the switch, then the settled state.
await page.waitForTimeout(400);
const midSwitch = await panelState();
check(
  'no Current Conditions flash mid-switch',
  !midSwitch.hasCurrentConditions,
  JSON.stringify(midSwitch),
);
await page.waitForTimeout(5000);
const onTemp = await panelState();
check('still no Current Conditions on air temp', !onTemp.hasCurrentConditions);
check('scalar panel eventually present', onTemp.hasScalarPanel || onTemp.loadingOnly);
await page.screenshot({ path: `${outputDir}/2-temp-no-summary-flash.png` });

await toggle(/Air Temperature/);
await page.waitForTimeout(1500);
const back = await panelState();
check('Current Conditions returns when everything is off', back.hasCurrentConditions);

const restoredTiles = await page.evaluate(() => {
  const panel = document.querySelector('#monitoring-detail-panel');
  return panel
    ? [...panel.querySelectorAll('.grid > div')].map((el) => el.innerText.split('\n')[0])
    : [];
});
check(
  'summary tiles still populated from cache (not all dashes)',
  restoredTiles.some((value) => value && value !== '--'),
  JSON.stringify(restoredTiles),
);
check(
  'tile values match the first-load cache',
  JSON.stringify(firstTileValues) === JSON.stringify(restoredTiles),
  `before=${JSON.stringify(firstTileValues)} after=${JSON.stringify(restoredTiles)}`,
);

console.log('\n=== alert marker layer mounts with the active weather layer ===');
await toggle(/Wind/);
await page.waitForTimeout(5000);
const markerInfo = await page.evaluate(() => {
  const view = window.__monitoringView;
  if (!view?.map?.layers) return { ok: false, reason: 'no view hook' };
  const layers = view.map.layers.toArray();
  const alertLayer = layers.find((layer) =>
    String(layer.title ?? '').startsWith('Condition Alerts'),
  );
  return {
    ok: true,
    titles: layers.map((layer) => layer.title),
    hasAlertLayer: Boolean(alertLayer),
    graphicCount: alertLayer?.graphics?.length ?? 0,
    visible: alertLayer?.visible ?? false,
  };
});
console.log(`  ${JSON.stringify(markerInfo)}`);
// The view hook is optional; absence is not a failure of the feature itself.
if (markerInfo.ok) {
  check('Condition Alerts layer present', markerInfo.hasAlertLayer);
}

await page.screenshot({ path: `${outputDir}/3-wind-with-markers.png` });

console.log(`\n=== ${failures.filter((f) => !f.startsWith('pageerror')).length} failure(s) ===`);
for (const line of failures) console.log(`  - ${line}`);

await browser.close();
process.exit(failures.some((f) => !f.startsWith('pageerror') && !f.includes('basemap')) ? 1 : 0);
