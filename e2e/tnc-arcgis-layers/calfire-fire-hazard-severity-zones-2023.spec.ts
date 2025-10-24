import { test, expect } from '@playwright/test';
import { runQualityCheck } from '../helpers/run-quality-check';
import { calculateTestTimeout } from '../helpers/timeout-calculator';
import type { LayerConfig } from '../helpers/tnc-arcgis-test-helpers';

/**
 * Manual Test: CalFire Fire Hazard Severity Zones 2023
 * 
 * Purpose: Debug test issues for this specific layer
 * 
 * Run with: npm run test:e2e -- --grep="CalFire Fire Hazard Severity Zones 2023" --grep-invert="@dynamic"
 */

test.describe('CalFire Fire Hazard Severity Zones 2023 @manual', () => {
  const SUBLAYER_COUNT = 3;
  const timeout = calculateTestTimeout(SUBLAYER_COUNT);
  
  test.setTimeout(timeout);
  
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5173');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
  });

  test('Complete Quality Check (8 Criteria)', async ({ page }) => {
    const layerConfig: LayerConfig = {
      id: 'calfire-fire-hazard-severity-zones-2023',
      title: 'CalFire Fire Hazard Severity Zones 2023',
      itemId: 'calfire-fire-hazard-severity-zones-2023',
      url: 'https://services.arcgis.com/F7DSX1DSNSiWmOqh/arcgis/rest/services/CalFire_Fire_Hazard_Severity_Zones_2023/FeatureServer',
      type: 'FeatureService',
      categories: ['Infrastructure', 'Fire', 'Land use and land (geography?)', 'Vegetation / habitat'],
      expectedResults: {
        showsInCategories: null,
        layersLoad: true,
        downloadLinkWorks: true,
        tooltipsPopUp: true,
        legendExists: true,
        legendLabelsDescriptive: true,
        legendFiltersWork: true
      },
      notes: 'Filters should work (TRUE)'
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
