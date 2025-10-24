import { test, expect } from '@playwright/test';
import { runQualityCheck } from '../helpers/run-quality-check';
import { calculateTestTimeout } from '../helpers/timeout-calculator';
import type { LayerConfig } from '../helpers/tnc-arcgis-test-helpers';

/**
 * Manual Test: Earthquake Faults and Folds in the USA
 * 
 * Purpose: Debug test issues for this specific layer
 * Note: Download does NOT work for this layer (expected FAIL on test 3)
 * 
 * Run with: npm run test:e2e -- --grep="Earthquake Faults and Folds" --grep-invert="@dynamic"
 */

test.describe('Earthquake Faults and Folds in the USA @manual', () => {
  const SUBLAYER_COUNT = 2;
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
      id: 'earthquake-faults-and-folds-in-the-usa',
      title: 'Earthquake Faults and Folds in the USA',
      itemId: 'earthquake-faults-and-folds-in-the-usa',
      url: 'https://services2.arcgis.com/FiaPA4ga0iQKduv3/arcgis/rest/services/Earthquake_Faults_and_Folds_in_the_USA/FeatureServer',
      type: 'FeatureService',
      categories: ['Topographic'],
      expectedResults: {
        showsInCategories: null,
        layersLoad: true,
        downloadLinkWorks: false,  // Expected: Download page shows 404 (broken link)
        tooltipsPopUp: true,
        legendExists: true,
        legendLabelsDescriptive: true,
        legendFiltersWork: true
      },
      notes: 'Known issue: Download link leads to 404 page'
    };

    console.log(`\n=== Testing: ${layerConfig.title} ===`);
    console.log(`Type: ${layerConfig.type}`);
    console.log(`Sublayers: ${SUBLAYER_COUNT}`);
    console.log(`Timeout: ${timeout / 1000}s\n`);

    // Run the complete quality check (includes test.step() calls for hierarchy)
    const result = await runQualityCheck(page, layerConfig);

    // Verify expected results - download is expected to NOT work for this layer
    await test.step('Verify: Layer loads successfully', async () => {
      expect(result.tests.test2_layersLoad?.passed, 
        `Expected layers to load, but got: ${result.tests.test2_layersLoad?.message}`
      ).toBe(true);
    });

    await test.step('Verify: Download link correctly detects 404 error', async () => {
      expect(result.tests.test3_downloadWorks?.passed,
        `Expected test to detect 404 page (broken download link), but got: ${result.tests.test3_downloadWorks?.message}`
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
