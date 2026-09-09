// Verify the Experiences gallery and click-through workspace against the
// twin_models webapp ModelsPage layout (banner, photo cards, map shell).
import { chromium } from 'playwright';
import { mkdir } from 'node:fs/promises';

const baseUrl = process.argv[2] ?? 'http://localhost:5180';
const outputDir = 'artifacts/experiences';

const errors = [];
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1600, height: 950 } });
page.on('pageerror', (error) => errors.push(`pageerror: ${error.message}`));
page.on('console', (message) => {
  if (message.type() === 'error') errors.push(message.text());
});

await mkdir(outputDir, { recursive: true });
await page.goto(`${baseUrl}/experiences`, { waitUntil: 'domcontentloaded' });
await page.waitForSelector('#experiences-page', { timeout: 30_000 });
await page.waitForTimeout(1500);

const heading = await page.locator('#experiences-page h1').innerText();
const cards = await page.locator('#experiences-page button[id^="experience-card-"]').count();
const categories = await page.evaluate(() =>
  [...document.querySelectorAll('#experiences-page h2')].map((node) => node.innerText.trim()),
);

console.log(`  heading: ${heading}`);
console.log(`  cards: ${cards}`);
console.log(`  categories: ${JSON.stringify(categories)}`);
await page.screenshot({ path: `${outputDir}/1-gallery.png`, fullPage: true });

console.log('\n=== open Suitability Modeler ===');
await page.locator('#experience-card-suitability').click();
await page.waitForSelector('#suitability-panel', { timeout: 15_000 });
await page.waitForTimeout(2500);

const suitabilityTitle = await page.locator('#experience-workspace-header h2').innerText();
const suitabilityPanel = await page.locator('#suitability-panel').innerText();
console.log(`  title: ${suitabilityTitle}`);
console.log(`  panel: ${suitabilityPanel.replace(/\n+/g, ' | ').slice(0, 400)}`);

const extentSelect = page.locator('#suitability-panel select[aria-label="Extent"]');
const resolutionSelect = page.locator('#suitability-panel select[aria-label="Resolution"]');
const addLayer = page.getByRole('button', { name: 'Add Layer' });

console.log(`  default extent: ${await extentSelect.inputValue()}`);
await page.waitForFunction(() => {
  const select = document.querySelector('#suitability-panel select[aria-label="Resolution"]');
  return select && [...select.options].some((option) => option.value === '30');
}, { timeout: 15_000 });

const preserveResolutions = await resolutionSelect.evaluate((node) =>
  [...node.options].map((option) => option.textContent.trim()),
);
console.log(`  preserve resolutions: ${JSON.stringify(preserveResolutions)}`);
console.log(`  default preserve resolution: ${await resolutionSelect.inputValue()}m`);
console.log(`  add layer disabled: ${await addLayer.isDisabled()}`);

await page.getByRole('row').filter({ hasText: 'Dangermond Preserve Boundary' }).waitFor({ timeout: 15_000 });
await page.waitForTimeout(2500);
await page.screenshot({ path: `${outputDir}/2-suitability.png` });

await addLayer.click();
const searchInput = page.locator('#suitability-panel input[placeholder="Search layers..."]');
await searchInput.waitFor({ timeout: 10_000 });
const pickerTitles = await page.locator('#suitability-panel .truncate').evaluateAll((nodes) =>
  nodes.map((node) => node.textContent.trim()).filter(Boolean).slice(0, 5),
);
console.log(`  picker titles: ${JSON.stringify(pickerTitles)}`);
await page.locator('#experience-workspace-header').click();

await extentSelect.selectOption('sbcounty');
await page.waitForFunction(() => {
  const select = document.querySelector('#suitability-panel select[aria-label="Resolution"]');
  return select && [...select.options].some((option) => option.value === '100');
}, { timeout: 10_000 });
await page.getByRole('row').filter({ hasText: 'Santa Barbara County Boundary' }).waitFor({ timeout: 15_000 });
await page.waitForTimeout(2500);
console.log(`  sbcounty resolutions: ${JSON.stringify(
  await resolutionSelect.evaluate((node) => [...node.options].map((option) => option.textContent.trim())),
)}`);
await page.screenshot({ path: `${outputDir}/2b-suitability-sbcounty.png` });

await extentSelect.selectOption('tricounty');
await page.getByRole('row').filter({ hasText: 'Tri-County Boundaries' }).waitFor({ timeout: 15_000 });
await page.waitForTimeout(2500);
await page.screenshot({ path: `${outputDir}/2c-suitability-tricounty.png` });

console.log('\n=== close, then open Species Distribution Model ===');
await page.getByRole('button', { name: 'Close experience' }).click();
await page.waitForSelector('#experiences-page', { timeout: 10_000 });
await page.locator('#experience-card-sdm').click();
await page.waitForSelector('#sdm-panel', { timeout: 15_000 });
await page.waitForTimeout(2500);

const sdmTitle = await page.locator('#experience-workspace-header h2').innerText();
const sdmPanel = await page.locator('#sdm-panel').innerText();
console.log(`  title: ${sdmTitle}`);
console.log(`  panel: ${sdmPanel.replace(/\n+/g, ' | ').slice(0, 400)}`);
await page.screenshot({ path: `${outputDir}/3-sdm.png` });

console.log('\n=== close back to gallery ===');
await page.getByRole('button', { name: 'Close experience' }).click();
await page.waitForSelector('#experiences-page', { timeout: 10_000 });
console.log('  back on gallery');

console.log(`\n=== errors (${errors.length}) ===`);
for (const line of [...new Set(errors)].slice(0, 10)) console.log(`  - ${line}`);

await browser.close();
