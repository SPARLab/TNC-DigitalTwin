import { test, Page } from '@playwright/test';
import {
  LayerConfig,
  QualityCheckResult,
  TestResult,
  navigateToLayer,
  testDownloadLink,
  testShowsInAllCategories,
  testLayersLoad,
  testTooltipsPopUp,
  testLegendExists,
  testLegendLabelsDescriptive,
  testLegendFiltersWork,
} from './tnc-arcgis-test-helpers';

/**
 * Run complete 8-criteria quality check for a single layer
 * This is the main orchestrator function used by all test files
 * 
 * @param page - Playwright page object
 * @param layer - Layer configuration with expected results
 * @returns QualityCheckResult with pass/fail for each test
 */
export async function runQualityCheck(
  page: Page,
  layer: LayerConfig
): Promise<QualityCheckResult> {
  const result: QualityCheckResult = {
    layerId: layer.id,
    layerTitle: layer.title,
    layerType: layer.type,
    tests: {
      test1_showsInCategories: null,
      test2_layersLoad: null,
      test3_downloadWorks: null,
      test4_descriptionMatches: null,
      test5_tooltipsPopUp: null,
      test6_legendExists: null,
      test7_legendLabelsDescriptive: null,
      test8_legendFiltersWork: null,
    },
    timestamp: new Date().toISOString(),
  };

  try {
    // SETUP: Load the layer before running visual tests
    // This comes FIRST so the layer is loaded for all subsequent tests
    await test.step('Setup: Navigate and load layer', async () => {
      const categoryToUse = layer.categories.length > 0 ? layer.categories[0] : 'Fire';
      
      console.log(`[Setup] Navigating to category: ${categoryToUse}`);
      await navigateToLayer(page, layer.title, categoryToUse);
      
      console.log(`[Setup] Waiting for search results...`);
      const itemsList = page.locator('#tnc-items-list');
      await itemsList.waitFor({ state: 'visible', timeout: 5000 }).catch(() => {});
      
      console.log(`[Setup] Finding layer card: ${layer.title}`);
      const layerCard = page.getByText(layer.title, { exact: true }).first();
      const isVisible = await layerCard.isVisible().catch(() => false);
      
      if (isVisible) {
        console.log(`[Setup] Clicking layer card...`);
        await layerCard.click();
        await page.waitForTimeout(1000);
        
        console.log(`[Setup] Setting opacity to 100%...`);
        const opacitySlider = page.locator('#tnc-details-opacity-slider');
        if (await opacitySlider.isVisible().catch(() => false)) {
          await opacitySlider.fill('100');
        }
        
        await page.waitForTimeout(3000);
        console.log(`[Setup] ✓ Layer loaded and ready`);
      } else {
        console.warn(`[Setup] ⚠️ Layer card not found for: ${layer.title}`);
      }
    });

    // TEST 1: Shows Up In All Categories
    // Tests that layer appears in search results for ALL its tagged categories
    await test.step('1. Shows Up In All Categories', async () => {
      if (layer.expectedResults.showsInCategories !== null && layer.categories.length > 0) {
        result.tests.test1_showsInCategories = await testShowsInAllCategories(page, layer);
      } else {
        result.tests.test1_showsInCategories = {
          passed: true,
          message: layer.categories.length === 0 
            ? 'No categories tagged - test not applicable'
            : 'Test skipped (not validated for this layer)',
          details: { skipped: true }
        };
      }
    });

    // TEST 2: All Layers Load
    await test.step('2. All Layers Load', async () => {
      if (layer.expectedResults.layersLoad !== null) {
        result.tests.test2_layersLoad = await testLayersLoad(page, layer);
      } else {
        result.tests.test2_layersLoad = {
          passed: true,
          message: 'Test skipped (not tested for this layer)',
          details: { skipped: true }
        };
      }
    });

    // TEST 3: ArcGIS Download Link Works
    await test.step('3. ArcGIS Download Link Works', async () => {
      if (layer.expectedResults.downloadLinkWorks !== null) {
        try {
          await testDownloadLink(page, layer.expectedResults.downloadLinkWorks);
          result.tests.test3_downloadWorks = {
            passed: true,
            message: 'Download link worked as expected',
            details: {}
          };
        } catch (error: any) {
          result.tests.test3_downloadWorks = {
            passed: false,
            message: `Download link failed: ${error.message}`,
            details: { error: error.message }
          };
        }
      } else {
        result.tests.test3_downloadWorks = {
          passed: true,
          message: 'Test skipped (not tested for this layer)',
          details: { skipped: true }
        };
      }
    });

    // TEST 4: Description Matches Website (SKIPPED)
    await test.step('4. Description Matches Website (skipped)', async () => {
      result.tests.test4_descriptionMatches = {
        passed: true,
        message: 'Description test skipped (per user request)',
        details: { skipped: true }
      };
    });

    // TEST 5: Tooltips Pop-Up
    await test.step('5. Tooltips Pop-Up', async () => {
      if (layer.expectedResults.tooltipsPopUp !== null) {
        result.tests.test5_tooltipsPopUp = await testTooltipsPopUp(page, layer);
      } else {
        result.tests.test5_tooltipsPopUp = {
          passed: true,
          message: 'Test skipped (not tested for this layer)',
          details: { skipped: true }
        };
      }
    });

    // TEST 6: Legend Exists
    await test.step('6. Legend Exists', async () => {
      if (layer.expectedResults.legendExists !== null) {
        result.tests.test6_legendExists = await testLegendExists(page, layer);
      } else {
        result.tests.test6_legendExists = {
          passed: true,
          message: 'Test skipped (not tested for this layer)',
          details: { skipped: true }
        };
      }
    });

    // TEST 7: Legend Labels Descriptive
    await test.step('7. Legend Labels Descriptive', async () => {
      if (layer.expectedResults.legendLabelsDescriptive !== null) {
        result.tests.test7_legendLabelsDescriptive = await testLegendLabelsDescriptive(page, layer);
      } else {
        result.tests.test7_legendLabelsDescriptive = {
          passed: true,
          message: 'Test skipped (not tested for this layer)',
          details: { skipped: true }
        };
      }
    });

    // TEST 8: Legend Filters Work
    await test.step('8. Legend Filters Work', async () => {
      if (layer.expectedResults.legendFiltersWork !== null) {
        result.tests.test8_legendFiltersWork = await testLegendFiltersWork(page, layer);
      } else {
        result.tests.test8_legendFiltersWork = {
          passed: true,
          message: 'Test skipped (not tested for this layer)',
          details: { skipped: true }
        };
      }
    });

  } catch (error: any) {
    console.error(`❌ Fatal error during quality check for ${layer.title}:`, error);
    // Mark remaining tests as failed
    for (const [key, value] of Object.entries(result.tests)) {
      if (value === null) {
        (result.tests as any)[key] = {
          passed: false,
          message: `Test skipped due to fatal error: ${error.message}`,
          details: { error: error.message }
        };
      }
    }
  }

  return result;
}

/**
 * Compare test result against expected result
 * Returns true if test result matches expectation (both pass or both fail)
 */
export function matchesExpectedResult(
  testResult: TestResult | null,
  expected: boolean | null
): boolean {
  if (expected === null || testResult === null) {
    return true; // Untested - no comparison
  }
  
  return testResult.passed === expected;
}

/**
 * Calculate accuracy metrics for a quality check result
 * Returns true positives, true negatives, false positives, false negatives
 */
export function calculateAccuracy(
  result: QualityCheckResult,
  layer: LayerConfig
): {
  truePositives: number;
  trueNegatives: number;
  falsePositives: number;
  falseNegatives: number;
  accuracy: number;
} {
  let truePositives = 0;
  let trueNegatives = 0;
  let falsePositives = 0;
  let falseNegatives = 0;
  let total = 0;

  const testMap: Record<string, boolean | null> = {
    test1_showsInCategories: layer.expectedResults.showsInCategories,
    test2_layersLoad: layer.expectedResults.layersLoad,
    test3_downloadWorks: layer.expectedResults.downloadLinkWorks,
    test5_tooltipsPopUp: layer.expectedResults.tooltipsPopUp,
    test6_legendExists: layer.expectedResults.legendExists,
    test7_legendLabelsDescriptive: layer.expectedResults.legendLabelsDescriptive,
    test8_legendFiltersWork: layer.expectedResults.legendFiltersWork,
  };

  for (const [testKey, expected] of Object.entries(testMap)) {
    if (expected === null) continue; // Untested
    
    const testResult = (result.tests as any)[testKey] as TestResult | null;
    if (!testResult) continue;
    
    total++;
    
    if (expected && testResult.passed) {
      truePositives++; // Expected pass, actual pass
    } else if (!expected && !testResult.passed) {
      trueNegatives++; // Expected fail, actual fail
    } else if (!expected && testResult.passed) {
      falsePositives++; // Expected fail, actual pass (TEST BUG)
    } else if (expected && !testResult.passed) {
      falseNegatives++; // Expected pass, actual fail (TEST BUG or APP BUG)
    }
  }

  const accuracy = total > 0 ? (truePositives + trueNegatives) / total : 1.0;

  return {
    truePositives,
    trueNegatives,
    falsePositives,
    falseNegatives,
    accuracy,
  };
}

