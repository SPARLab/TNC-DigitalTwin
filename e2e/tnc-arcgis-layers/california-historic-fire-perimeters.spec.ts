import { test, expect } from '@playwright/test';
import { runQualityCheck } from '../helpers/run-quality-check';
import { calculateTestTimeout } from '../helpers/timeout-calculator';
import type { LayerConfig } from '../helpers/tnc-arcgis-test-helpers';

/**
 * Manual Test: California Historical Fire Perimeters
 * 
 * Purpose: Debug test issues for this specific layer
 * 
 * Run with: npm run test:e2e -- --grep="California Historical Fire Perimeters" --grep-invert="@dynamic"
 */

test.describe('California Historical Fire Perimeters @manual', () => {
  const SUBLAYER_COUNT = 7;
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
      id: 'california-historic-fire-perimeters',
      title: 'California Historical Fire Perimeters',
      itemId: 'california-historic-fire-perimeters',
      url: 'https://services1.arcgis.com/jUJYIo9tSA7EHvfZ/arcgis/rest/services/California_Historic_Fire_Perimeters/FeatureServer',
      type: 'FeatureService',
      categories: ['Fire', 'Land use and land (geography?)'],
      expectedResults: {
        showsInCategories: null,
        layersLoad: true,
        downloadLinkWorks: true,
        tooltipsPopUp: true,
        legendExists: true,
        legendLabelsDescriptive: true,
        legendFiltersWork: true
      },
      notes: 'Multi-sublayer fire perimeters'
    };

    console.log(`\n=== Testing: ${layerConfig.title} ===`);
    console.log(`Type: ${layerConfig.type}`);
    console.log(`Sublayers: ${SUBLAYER_COUNT}`);
    console.log(`Timeout: ${timeout / 1000}s\n`);

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
