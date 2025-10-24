import { test, expect } from '@playwright/test';
import { runQualityCheck } from '../helpers/run-quality-check';
import { calculateTestTimeout } from '../helpers/timeout-calculator';
import type { LayerConfig } from '../helpers/tnc-arcgis-test-helpers';

/**
 * Manual Test: Coastal and Marine Data
 * 
 * SPECIAL CASE: Multiple PNG icon-based layer with 20 sublayers
 * 
 * This layer uses MULTIPLE SMALL PNG IMAGES in the legend instead of solid color swatches.
 * 
 * Run with: npm run test:e2e -- --grep="Coastal and Marine Data" --grep-invert="@dynamic"
 */

test.describe('Coastal and Marine Data @manual', () => {
  const SUBLAYER_COUNT = 20;  // This layer has many sublayers!
  const timeout = calculateTestTimeout(SUBLAYER_COUNT);
  
  test.setTimeout(timeout);
  
  test.beforeEach(async ({ page, context }) => {
    // Clear cookies (can be done before navigation)
    await context.clearCookies();
    
    // Navigate using baseURL from config (consistent with dynamic tests)
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Clear storage AFTER navigation (prevents SecurityError on about:blank)
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    }).catch(() => {
      // Ignore errors if localStorage not accessible
    });
    
    await page.waitForTimeout(2000);
  });

  test('Complete Quality Check (8 Criteria)', async ({ page }) => {
    const layerConfig: LayerConfig = {
      id: 'coastal-and-marine',
      title: 'Coastal and Marine Data',
      itemId: '0a7eb52e2edb456892eaa27ad46aca3a',
      url: 'https://services.arcgis.com/F7DSX1DSNSiWmOqh/arcgis/rest/services/Coastal_and_Marine/FeatureServer',
      type: 'FeatureService',
      categories: ['Marine', 'Ecological / Biological (Species?)'],
      expectedResults: {
        showsInCategories: null,
        layersLoad: true,
        downloadLinkWorks: true,
        tooltipsPopUp: true,
        legendExists: true,
        legendLabelsDescriptive: true,
        legendFiltersWork: true
      },
      notes: 'Multiple PNG icon-based layer with 20 sublayers'
    };

    console.log(`\n=== Testing: ${layerConfig.title} ===`);
    console.log(`Type: ${layerConfig.type}`);
    console.log(`Sublayers: ${SUBLAYER_COUNT}`);
    console.log(`Timeout: ${timeout / 1000}s`);
    console.log('📊 Legend Type: Multiple small PNG images\n');

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
        `Expected legend labels to be descriptive, but got: ${result.tests.test7_legendLabelsDescriptive?.message}`
      ).toBe(true);
    });

    await test.step('Verify: Legend filters work properly', async () => {
      expect(result.tests.test8_legendFiltersWork?.passed,
        `Expected legend filters to work, but got: ${result.tests.test8_legendFiltersWork?.message}`
      ).toBe(true);
    });
  });
});
