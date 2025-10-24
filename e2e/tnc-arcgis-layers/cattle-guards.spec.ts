import { test, expect } from '@playwright/test';
import { runQualityCheck, matchesExpectedResult } from '../helpers/run-quality-check';
import type { LayerConfig } from '../helpers/tnc-arcgis-test-helpers';
import { calculateTestTimeout } from '../helpers/timeout-calculator';

/**
 * Manual Test: Cattle Guards
 * 
 * Purpose: Debug tooltip test failures for this specific layer
 * This layer uses icon-based legend (not color swatches)
 * 
 * Run with: npm run test:e2e -- --grep="Cattle Guards" --grep-invert="@dynamic"
 * 
 * Note: Use --grep-invert="@dynamic" to ONLY run the manual test, not the dynamic test
 */

test.describe('Cattle Guards @manual', () => {
  const SUBLAYER_COUNT = 1; // Cattle Guards has 1 sublayer
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
      id: 'jldp-cattle-guards-public-',
      title: 'Cattle Guards',
      itemId: '29f58141849e4e65b18b08953741c473',
      url: 'https://services.arcgis.com/F7DSX1DSNSiWmOqh/arcgis/rest/services/jldp_cattle_guards_(Public)/FeatureServer',
      type: 'FeatureService',
      categories: ['Infrastructure'],
      expectedResults: {
        showsInCategories: null,
        layersLoad: true,
        downloadLinkWorks: true,
        tooltipsPopUp: true,
        legendExists: true,
        legendLabelsDescriptive: true,
        legendFiltersWork: true
      },
      notes: 'Icon-based layer - tooltip test often fails'
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
