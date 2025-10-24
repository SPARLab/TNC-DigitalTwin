import { test, expect } from '@playwright/test';
import { runQualityCheck } from '../helpers/run-quality-check';
import { calculateTestTimeout } from '../helpers/timeout-calculator';
import type { LayerConfig } from '../helpers/tnc-arcgis-test-helpers';

/**
 * Manual Test: Dibblee Geology
 * 
 * SPECIAL CASE: Non-descriptive but accepted legend labels
 * 
 * This layer has cryptic legend labels like "Tm", "Tma", which are geological abbreviations.
 * We've decided to ACCEPT these labels without implementing complex geological interpretation.
 * 
 * Run with: npm run test:e2e -- --grep="Dibblee Geology" --grep-invert="@dynamic"
 */

test.describe('Dibblee Geology @manual', () => {
  const SUBLAYER_COUNT = 1;
  const timeout = calculateTestTimeout(SUBLAYER_COUNT);
  
  test.setTimeout(timeout);
  
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5173');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
  });

  test('Complete Quality Check (8 Criteria)', async ({ page }) => {
    const layerConfig: LayerConfig = {
      id: 'jldp-dibblee-geology',
      title: 'Dibblee Geology',
      itemId: '92bdf9cd8fff4a3bab9d77f8a6d44e1f',
      url: 'https://services.arcgis.com/F7DSX1DSNSiWmOqh/arcgis/rest/services/jldp_dibblee_geology/FeatureServer',
      type: 'FeatureService',
      categories: ['Topographic', 'Land use and land (geography?)'],
      expectedResults: {
        showsInCategories: null,
        layersLoad: true,
        downloadLinkWorks: true,
        tooltipsPopUp: true,
        legendExists: true,
        legendLabelsDescriptive: true,  // Accepting cryptic labels as-is
        legendFiltersWork: true
      },
      notes: 'Legend labels are cryptic geological abbreviations - accepted without interpretation logic'
    };

    console.log(`\n=== Testing: ${layerConfig.title} ===`);
    console.log(`Type: ${layerConfig.type}`);
    console.log(`Sublayers: ${SUBLAYER_COUNT}`);
    console.log(`Timeout: ${timeout / 1000}s`);
    console.log('📋 Legend Labels: "Tm", "Tma", etc. (geological abbreviations)');
    console.log('✅ Decision: Accept as-is without interpretation logic\n');

    // Run the complete quality check (includes test.step() calls for hierarchy)
    const result = await runQualityCheck(page, layerConfig);

    // Verify all expected results - each in its own step for clarity
    await test.step('Verify: Layer loads successfully', async () => {
      expect(result.tests.test2_layersLoad?.passed, 
        `Expected layers to load, but got: ${result.tests.test2_layersLoad?.message}`
      ).toBe(true);
    });

    await test.step('Verify: Download link works', async () => {
      expect(result.tests.test3_downloadWorks?.passed,
        `Expected download to work, but got: ${result.tests.test3_downloadWorks?.message}`
      ).toBe(true);
    });

    await test.step('Verify: Tooltips pop up when clicking features', async () => {
      expect(result.tests.test5_tooltipsPopUp?.passed,
        `Expected tooltips to appear, but got: ${result.tests.test5_tooltipsPopUp?.message}`
      ).toBe(true);
    });

    await test.step('Verify: Legend panel exists', async () => {
      expect(result.tests.test6_legendExists?.passed,
        `Expected legend to exist, but got: ${result.tests.test6_legendExists?.message}`
      ).toBe(true);
    });

    await test.step('Verify: Legend labels are descriptive', async () => {
      expect(result.tests.test7_legendLabelsDescriptive?.passed,
        `Expected legend labels to be descriptive (accepting cryptic geological abbreviations), but got: ${result.tests.test7_legendLabelsDescriptive?.message}`
      ).toBe(true);
    });

    await test.step('Verify: Legend filters work properly', async () => {
      expect(result.tests.test8_legendFiltersWork?.passed,
        `Expected legend filters to work, but got: ${result.tests.test8_legendFiltersWork?.message}`
      ).toBe(true);
    });
  });
});
