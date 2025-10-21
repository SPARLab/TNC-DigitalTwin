import { Page } from '@playwright/test';
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
    // TEST 1: Shows Up In All Categories
    if (layer.expectedResults.showsInCategories !== null) {
      result.tests.test1_showsInCategories = await testShowsInAllCategories(page, layer);
    }

    // CRITICAL: Load the layer before running visual tests
    // Navigate to first category (or use first available category)
    const categoryToUse = layer.categories.length > 0 ? layer.categories[0] : 'Fire'; // Fallback to Fire category
    
    console.log(`[runQualityCheck] Navigating to category: ${categoryToUse}`);
    await navigateToLayer(page, layer.title, categoryToUse);
    
    // Wait for search results to load
    const itemsList = page.locator('#tnc-items-list');
    await itemsList.waitFor({ state: 'visible', timeout: 5000 }).catch(() => {});
    
    // Find the layer card by matching the title text
    // Use getByText instead of itemId since we don't have real ArcGIS item IDs
    const layerCard = page.getByText(layer.title, { exact: true }).first();
    const isVisible = await layerCard.isVisible().catch(() => false);
    
    if (isVisible) {
      console.log(`[runQualityCheck] Found layer card, clicking: ${layer.title}`);
      await layerCard.click();
      await page.waitForTimeout(1000);
      
      // Set opacity to 100% for better testing
      const opacitySlider = page.locator('#tnc-details-opacity-slider');
      if (await opacitySlider.isVisible().catch(() => false)) {
        await opacitySlider.fill('100');
        console.log(`[runQualityCheck] Set opacity to 100%`);
      }
      
      // Wait for layer to fully render
      await page.waitForTimeout(3000);
      console.log(`[runQualityCheck] Layer loaded, proceeding with tests`);
    } else {
      console.warn(`[runQualityCheck] Layer card not found in search results for: ${layer.title}`);
      console.warn(`[runQualityCheck] Category used: ${categoryToUse}`);
      // Don't throw - let tests handle missing layer gracefully
    }

    // TEST 2: All Layers Load
    if (layer.expectedResults.layersLoad !== null) {
      result.tests.test2_layersLoad = await testLayersLoad(page, layer);
    }

    // TEST 3: ArcGIS Download Link Works
    if (layer.expectedResults.downloadLinkWorks !== null) {
      try {
        // Use existing testDownloadLink helper
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
    }

    // TEST 4: Description Matches Website (SKIPPED)
    result.tests.test4_descriptionMatches = {
      passed: true,
      message: 'Description test skipped (per user request)',
      details: { skipped: 'user_requested' }
    };

    // TEST 5: Tooltips Pop-Up
    if (layer.expectedResults.tooltipsPopUp !== null) {
      result.tests.test5_tooltipsPopUp = await testTooltipsPopUp(page, layer);
    }

    // TEST 6: Legend Exists
    if (layer.expectedResults.legendExists !== null) {
      result.tests.test6_legendExists = await testLegendExists(page, layer);
    }

    // TEST 7: Legend Labels Descriptive
    if (layer.expectedResults.legendLabelsDescriptive !== null) {
      result.tests.test7_legendLabelsDescriptive = await testLegendLabelsDescriptive(page, layer);
    }

    // TEST 8: Legend Filters Work
    if (layer.expectedResults.legendFiltersWork !== null) {
      result.tests.test8_legendFiltersWork = await testLegendFiltersWork(page, layer);
    }

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

