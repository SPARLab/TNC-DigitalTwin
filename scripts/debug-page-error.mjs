// Capture full stacks for page errors while toggling sensor layers.
import { chromium } from 'playwright';

const baseUrl = process.argv[2] ?? 'http://localhost:5174';

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1400, height: 900 } });

let step = '(startup)';
page.on('pageerror', (error) => {
  console.log(`\n===== PAGE ERROR during: ${step} =====`);
  console.log(error.stack ?? error.message);
});

page.on('console', async (message) => {
  const text = message.text();
  if (!text.includes('layer view failed')) return;
  console.log(`\n===== LAYERVIEW ERROR during: ${step} =====`);
  console.log(text);
  for (const arg of message.args()) {
    try {
      const value = await arg.evaluate((error) =>
        error && typeof error === 'object'
          ? {
              name: error.name,
              message: error.message,
              details: error.details,
              stack: String(error.stack ?? '').split('\n').slice(0, 4).join('\n'),
            }
          : error,
      );
      if (value && typeof value === 'object') console.log(JSON.stringify(value, null, 2));
    } catch {
      // Handle already released.
    }
  }
});

await page.goto(`${baseUrl}/monitoring`, { waitUntil: 'domcontentloaded' });
await page.waitForSelector('canvas', { timeout: 60_000 });

// Scope sensor toggles to the tree; the detail panel also has buttons named
// after the variable (its refresh control).
const tree = page.locator('#monitoring-sensor-tree');
const sensor = (name) => tree.getByRole('button', { name: new RegExp(name) });

const act = async (label, action, settleMs) => {
  step = label;
  console.log(`-- ${label} (settle ${settleMs}ms)`);
  await action();
  await page.waitForTimeout(settleMs);
};

await act('enable Air Temperature', async () => {
  await sensor('Air Temperature').click();
  await page.waitForSelector('#monitoring-scalar-panel', { timeout: 45_000 });
}, 2600);

// Mirror the fast toggling in the verification run, which is where the SDK's
// internal load controller gets caught mid-flight.
await act('surface -> Labels', () => page.getByRole('button', { name: 'Labels', exact: true }).click(), 800);
await act('Labels -> Surface', () => page.getByRole('button', { name: 'Surface', exact: true }).click(), 800);
await act('switch to Humidity', () => sensor('Relative Humidity').click(), 800);
await act('switch to Pressure', () => sensor('Barometric Pressure').click(), 800);
await act('switch to Precipitation', () => sensor('Precipitation').click(), 800);
await act('turn Precipitation off', () => sensor('Precipitation').click(), 1200);
await act('re-enable Air Temperature', () => sensor('Air Temperature').click(), 300);
await act('immediately switch to Humidity', () => sensor('Relative Humidity').click(), 2500);
await act('enable Wind on top', () => sensor('Wind Speed & Direction').click(), 2500);
await act('navigate away', () => page.goto(`${baseUrl}/`, { waitUntil: 'domcontentloaded' }), 2000);

console.log('\ndone');
await browser.close();
