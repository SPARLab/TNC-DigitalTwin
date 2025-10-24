import { test, expect } from '@playwright/test';
import { runQualityCheck } from '../helpers/run-quality-check';
import { calculateTestTimeout } from '../helpers/timeout-calculator';
import type { LayerConfig } from '../helpers/tnc-arcgis-test-helpers';

/**
 * Manual Test: CalFire FRAP Fire Threat 2019
 * 
 * Purpose: Debug test issues for this specific layer
 * Note: Filters do NOT work for this layer (expected FAIL on test 8)
 *       Previous false positive was due to comparing partially vs fully rendered states
 * 
 * Run with: npm run test:e2e -- --grep="CalFire FRAP Fire Threat 2019" --grep-invert="@dynamic"
 */

test.describe('CalFire FRAP Fire Threat 2019 @manual', () => {
  const SUBLAYER_COUNT = 1;
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
      id: 'calfire-frap-fire-threat-2019',
      title: 'CalFire FRAP Fire Threat 2019',
      itemId: 'calfire-frap-fire-threat-2019',
      url: 'https://services.arcgis.com/F7DSX1DSNSiWmOqh/arcgis/rest/services/CalFire_FRAP_Fire_Threat_2019/FeatureServer',
      type: 'FeatureService',
      categories: ['Fire'],
      expectedResults: {
        showsInCategories: null,
        layersLoad: true,
        downloadLinkWorks: true,
        tooltipsPopUp: true,
        legendExists: true,
        legendLabelsDescriptive: true,
        legendFiltersWork: false  // Filters DON'T work (expected FAIL)
      },
      notes: 'Filters do NOT work for this layer (known issue with app)'
    };

    console.log(`\n=== Testing: ${layerConfig.title} ===`);
    console.log(`Type: ${layerConfig.type}`);
    console.log(`Sublayers: ${SUBLAYER_COUNT}`);
    console.log(`Timeout: ${timeout / 1000}s\n`);

    // Run the complete quality check (includes test.step() calls for hierarchy)
    const result = await runQualityCheck(page, layerConfig);

    // Verify expected results - filters are expected to NOT work for this layer
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

    await test.step('Verify: Legend filters FAIL as expected (known issue)', async () => {
      expect(result.tests.test8_legendFiltersWork?.passed,
        `Expected legend filters to FAIL (known issue), but they actually work? ${result.tests.test8_legendFiltersWork?.message}`
      ).toBe(false); // We EXPECT this to fail!
    });
  });
});
