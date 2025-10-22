import { test, expect } from '@playwright/test';
import allLayersData from '../test-data/all-arcgis-layers.json' with { type: 'json' };
import { runQualityCheck, matchesExpectedResult } from '../helpers/run-quality-check';
import type { LayerConfig } from '../helpers/tnc-arcgis-test-helpers';

/**
 * Dynamic Test Suite for All ArcGIS Layers
 * 
 * This file generates tests for all layers defined in all-arcgis-layers.json
 * Each layer gets a complete 8-criteria quality check
 * Tests run in parallel for faster execution
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

/**
 * Calculate dynamic timeout based on layer metadata
 * 
 * FORMULA: base_timeout + (estimated_sublayers × time_per_sublayer)
 * 
 * - Base timeout: 60s (navigation, setup, single-layer tests)
 * - Per sublayer: 5s (layer load test + filter test)
 * - Feature Services: typically have multiple sublayers
 * - Image Services: typically single layer
 */
function calculateTimeout(layer: LayerConfig): number {
  const BASE_TIMEOUT = 60000; // 60 seconds
  const TIME_PER_SUBLAYER = 5000; // 5 seconds per sublayer
  
  // Estimate sublayer count based on layer type and known patterns
  let estimatedSublayers = 1;
  
  // Known multi-sublayer services (from manual testing)
  const MULTI_SUBLAYER_SERVICES: Record<string, number> = {
    'coastal-and-marine': 20,
    'california-historic-fire-perimeters': 10,
    'groundwater-wells': 5,
    // Add more as we discover them
  };
  
  if (MULTI_SUBLAYER_SERVICES[layer.id]) {
    estimatedSublayers = MULTI_SUBLAYER_SERVICES[layer.id];
  } else if (layer.type === 'FeatureService') {
    // Most Feature Services have 1-3 sublayers
    estimatedSublayers = 3;
  } else {
    // Image Services typically have 1 layer
    estimatedSublayers = 1;
  }
  
  const calculatedTimeout = BASE_TIMEOUT + (estimatedSublayers * TIME_PER_SUBLAYER);
  
  // Cap at 240 seconds (4 minutes) max
  return Math.min(calculatedTimeout, 240000);
}

for (const layer of categorizedLayers) {
  // Use layer ID to ensure unique test names (some layers have duplicate titles)
  test.describe(`${layer.title} [${layer.id}] ${DYNAMIC_TEST_TAG}`, () => {
    test.beforeEach(async ({ page }) => {
      // Navigate to the app
      await page.goto('/');
      
      // Wait for app to fully load
      await page.waitForLoadState('networkidle');
      
      // Give ArcGIS extra time to initialize
      await page.waitForTimeout(2000);
    });

    test(`Complete Quality Check (8 Criteria)`, async ({ page }) => {
      // 🎯 DYNAMIC TIMEOUT: Adjust based on layer complexity
      const timeout = calculateTimeout(layer);
      test.setTimeout(timeout);
      
      console.log(`\n=== Testing: ${layer.title} ===`);
      console.log(`Type: ${layer.type}`);
      console.log(`Categories: ${layer.categories.join(', ') || 'None'}`);
      console.log(`⏱️  Timeout: ${timeout / 1000}s (dynamic)`);
      
      // Run the complete quality check
      const result = await runQualityCheck(page, layer);
      
      // Use test.step() for each criterion to get granular pass/fail reporting
      // Include actual feature status in step title for checkpoint reporter
      
      const test1Status = result.tests.test1_showsInCategories ? (result.tests.test1_showsInCategories.passed ? 'WORKS' : 'BROKEN') : 'SKIP';
      await test.step(`1. Shows Up In All Categories [${test1Status}]`, async () => {
        const testResult = result.tests.test1_showsInCategories;
        const expected = layer.expectedResults.showsInCategories;
        
        if (expected === null) {
          // Untested - always pass
          expect(true).toBe(true);
          return;
        }
        
        if (!testResult) {
          expect.soft(false, 'Test did not run').toBe(true);
          return;
        }
        
        console.log(`  Test 1: ${testResult.message}`);
        
        // Soft assertion - compare against expected result
        const matches = matchesExpectedResult(testResult, expected);
        expect.soft(matches, 
          `Expected ${expected ? 'PASS' : 'FAIL'}, got ${testResult.passed ? 'PASS' : 'FAIL'}: ${testResult.message}`
        ).toBe(true);
      });

      const test2Status = result.tests.test2_layersLoad ? (result.tests.test2_layersLoad.passed ? 'WORKS' : 'BROKEN') : 'SKIP';
      await test.step(`2. All Layers Load [${test2Status}]`, async () => {
        const testResult = result.tests.test2_layersLoad;
        const expected = layer.expectedResults.layersLoad;
        
        if (expected === null) {
          expect(true).toBe(true);
          return;
        }
        
        if (!testResult) {
          expect.soft(false, 'Test did not run').toBe(true);
          return;
        }
        
        console.log(`  Test 2: ${testResult.message}`);
        
        const matches = matchesExpectedResult(testResult, expected);
        expect.soft(matches,
          `Expected ${expected ? 'PASS' : 'FAIL'}, got ${testResult.passed ? 'PASS' : 'FAIL'}: ${testResult.message}`
        ).toBe(true);
      });

      const test3Status = result.tests.test3_downloadWorks ? (result.tests.test3_downloadWorks.passed ? 'WORKS' : 'BROKEN') : 'SKIP';
      await test.step(`3. ArcGIS Download Link Works [${test3Status}]`, async () => {
        const testResult = result.tests.test3_downloadWorks;
        const expected = layer.expectedResults.downloadLinkWorks;
        
        if (expected === null) {
          expect(true).toBe(true);
          return;
        }
        
        if (!testResult) {
          expect.soft(false, 'Test did not run').toBe(true);
          return;
        }
        
        console.log(`  Test 3: ${testResult.message}`);
        
        const matches = matchesExpectedResult(testResult, expected);
        expect.soft(matches,
          `Expected ${expected ? 'PASS' : 'FAIL'}, got ${testResult.passed ? 'PASS' : 'FAIL'}: ${testResult.message}`
        ).toBe(true);
      });

      await test.step('4. Description Matches Website (SKIPPED)', async () => {
        // Always pass - skipped per user request
        expect(true).toBe(true);
      });

      const test5Status = result.tests.test5_tooltipsPopUp ? (result.tests.test5_tooltipsPopUp.passed ? 'WORKS' : 'BROKEN') : 'SKIP';
      await test.step(`5. Tooltips Pop-Up [${test5Status}]`, async () => {
        const testResult = result.tests.test5_tooltipsPopUp;
        const expected = layer.expectedResults.tooltipsPopUp;
        
        if (expected === null) {
          expect(true).toBe(true);
          return;
        }
        
        if (!testResult) {
          expect.soft(false, 'Test did not run').toBe(true);
          return;
        }
        
        console.log(`  Test 5: ${testResult.message}`);
        
        const matches = matchesExpectedResult(testResult, expected);
        expect.soft(matches,
          `Expected ${expected ? 'PASS' : 'FAIL'}, got ${testResult.passed ? 'PASS' : 'FAIL'}: ${testResult.message}`
        ).toBe(true);
      });

      const test6Status = result.tests.test6_legendExists ? (result.tests.test6_legendExists.passed ? 'WORKS' : 'BROKEN') : 'SKIP';
      await test.step(`6. Legend Exists [${test6Status}]`, async () => {
        const testResult = result.tests.test6_legendExists;
        const expected = layer.expectedResults.legendExists;
        
        if (expected === null) {
          expect(true).toBe(true);
          return;
        }
        
        if (!testResult) {
          expect.soft(false, 'Test did not run').toBe(true);
          return;
        }
        
        console.log(`  Test 6: ${testResult.message}`);
        
        const matches = matchesExpectedResult(testResult, expected);
        expect.soft(matches,
          `Expected ${expected ? 'PASS' : 'FAIL'}, got ${testResult.passed ? 'PASS' : 'FAIL'}: ${testResult.message}`
        ).toBe(true);
      });

      const test7Status = result.tests.test7_legendLabelsDescriptive ? (result.tests.test7_legendLabelsDescriptive.passed ? 'WORKS' : 'BROKEN') : 'SKIP';
      await test.step(`7. Legend Labels Descriptive [${test7Status}]`, async () => {
        const testResult = result.tests.test7_legendLabelsDescriptive;
        const expected = layer.expectedResults.legendLabelsDescriptive;
        
        if (expected === null) {
          expect(true).toBe(true);
          return;
        }
        
        if (!testResult) {
          expect.soft(false, 'Test did not run').toBe(true);
          return;
        }
        
        console.log(`  Test 7: ${testResult.message}`);
        
        const matches = matchesExpectedResult(testResult, expected);
        expect.soft(matches,
          `Expected ${expected ? 'PASS' : 'FAIL'}, got ${testResult.passed ? 'PASS' : 'FAIL'}: ${testResult.message}`
        ).toBe(true);
      });

      const test8Status = result.tests.test8_legendFiltersWork ? (result.tests.test8_legendFiltersWork.passed ? 'WORKS' : 'BROKEN') : 'SKIP';
      await test.step(`8. Legend Filters Work [${test8Status}]`, async () => {
        const testResult = result.tests.test8_legendFiltersWork;
        const expected = layer.expectedResults.legendFiltersWork;
        
        if (expected === null) {
          expect(true).toBe(true);
          return;
        }
        
        if (!testResult) {
          expect.soft(false, 'Test did not run').toBe(true);
          return;
        }
        
        console.log(`  Test 8: ${testResult.message}`);
        
        const matches = matchesExpectedResult(testResult, expected);
        expect.soft(matches,
          `Expected ${expected ? 'PASS' : 'FAIL'}, got ${testResult.passed ? 'PASS' : 'FAIL'}: ${testResult.message}`
        ).toBe(true);
      });

      // Final summary
      console.log(`\n=== Summary for ${layer.title} ===`);
      const passedTests = Object.values(result.tests).filter(t => t?.passed).length;
      const totalTests = Object.values(result.tests).filter(t => t !== null).length;
      console.log(`Passed: ${passedTests}/${totalTests} tests`);
    });
  });
}

// Export test count for logging
console.log(`\n📊 Generated dynamic tests for ${categorizedLayers.length} categorized feature services`);
console.log(`   - Feature Services: ${categorizedLayers.filter(l => l.type === 'FeatureService').length}`);
console.log(`   - Image Services: ${categorizedLayers.filter(l => l.type === 'ImageService').length}`);

