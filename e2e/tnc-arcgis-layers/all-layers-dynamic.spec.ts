import { test, expect } from '@playwright/test';
import allLayersData from '../test-data/all-arcgis-layers.json' assert { type: 'json' };
import { runQualityCheck, matchesExpectedResult } from '../helpers/run-quality-check';
import { calculateTestTimeout } from '../helpers/timeout-calculator';
import type { LayerConfig } from '../helpers/tnc-arcgis-test-helpers';

/**
 * Dynamic Test Suite for All ArcGIS Layers
 * 
 * This file generates tests for all layers defined in all-arcgis-layers.json
 * Each layer gets a complete 8-criteria quality check
 * Tests run in parallel for faster execution
 * 
 * Test hierarchy is now built into runQualityCheck(), so reports are clear and readable!
 */

const allLayers = allLayersData.layers as LayerConfig[];

// Filter out uncategorized layers (layers with no categories or "Uncategorized" category)
const categorizedLayers = allLayers.filter(layer => 
  layer.categories.length > 0 && !layer.categories.includes('Uncategorized')
);

// Tag dynamic tests so they can be filtered
const DYNAMIC_TEST_TAG = '@dynamic';

console.log(`\n📊 Filtered Layer Count:`);
console.log(`   Total: ${allLayers.length} feature services`);
console.log(`   Categorized: ${categorizedLayers.length} (testing these)`);
console.log(`   Uncategorized: ${allLayers.length - categorizedLayers.length} (skipped)\n`);

for (const layer of categorizedLayers) {
  // Use layer ID to ensure unique test names (some layers have duplicate titles)
  test.describe(`${layer.title} [${layer.id}] ${DYNAMIC_TEST_TAG}`, () => {
    // Calculate dynamic timeout based on sublayer count
    // Most Feature Services have 1-20 sublayers; Image Services have 1
    const sublayerCount = layer.type === 'ImageService' ? 1 : 5; // Conservative estimate
    const timeout = calculateTestTimeout(sublayerCount);
    
    test.setTimeout(timeout);
    
    test.beforeEach(async ({ page, context }) => {
      // Clear cookies (can be done before navigation)
      await context.clearCookies();
      
      // Navigate to the app
      await page.goto('/');
      
      // Wait for app to fully load
      await page.waitForLoadState('networkidle');
      
      // Clear storage AFTER navigation (prevents SecurityError on about:blank)
      await page.evaluate(() => {
        localStorage.clear();
        sessionStorage.clear();
      }).catch(() => {
        // Ignore errors if localStorage not accessible
      });
      
      // Give ArcGIS extra time to initialize
      await page.waitForTimeout(2000);
    });

    test(`Complete Quality Check (8 Criteria)`, async ({ page }) => {
      console.log(`\n=== Testing: ${layer.title} ===`);
      console.log(`Type: ${layer.type}`);
      console.log(`Estimated sublayers: ${sublayerCount}`);
      console.log(`Timeout: ${timeout / 1000}s`);
      console.log(`Categories: ${layer.categories.join(', ') || 'None'}`);
      
      // Run the complete quality check
      // This function now includes test.step() calls internally for clear hierarchy
      const result = await runQualityCheck(page, layer);
      
      // Verify all test results match expected outcomes
      await test.step('Verify: All results match expectations', async () => {
        const tests = [
          { name: 'Shows In Categories', result: result.tests.test1_showsInCategories, expected: layer.expectedResults.showsInCategories },
          { name: 'Layers Load', result: result.tests.test2_layersLoad, expected: layer.expectedResults.layersLoad },
          { name: 'Download Works', result: result.tests.test3_downloadWorks, expected: layer.expectedResults.downloadLinkWorks },
          { name: 'Tooltips Pop Up', result: result.tests.test5_tooltipsPopUp, expected: layer.expectedResults.tooltipsPopUp },
          { name: 'Legend Exists', result: result.tests.test6_legendExists, expected: layer.expectedResults.legendExists },
          { name: 'Legend Labels Descriptive', result: result.tests.test7_legendLabelsDescriptive, expected: layer.expectedResults.legendLabelsDescriptive },
          { name: 'Legend Filters Work', result: result.tests.test8_legendFiltersWork, expected: layer.expectedResults.legendFiltersWork },
        ];

        for (const t of tests) {
          if (t.expected === null || !t.result) continue; // Skip untested
          
          const matches = matchesExpectedResult(t.result, t.expected);
          expect.soft(matches,
            `${t.name}: Expected ${t.expected ? 'PASS' : 'FAIL'}, got ${t.result.passed ? 'PASS' : 'FAIL'} - ${t.result.message}`
          ).toBe(true);
        }
      });

      // Final summary
      const passedTests = Object.values(result.tests).filter(t => t?.passed).length;
      const totalTests = Object.values(result.tests).filter(t => t !== null).length;
      console.log(`\n✅ Completed: ${passedTests}/${totalTests} tests passed for ${layer.title}`);
    });
  });
}

// Export test count for logging
console.log(`\n📊 Generated dynamic tests for ${categorizedLayers.length} categorized feature services`);
console.log(`   - Feature Services: ${categorizedLayers.filter(l => l.type === 'FeatureService').length}`);
console.log(`   - Image Services: ${categorizedLayers.filter(l => l.type === 'ImageService').length}`);
