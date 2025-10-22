import { test, expect } from '@playwright/test';
import { runQualityCheck } from '../helpers/run-quality-check';

/**
 * Manual Test: Coastal and Marine Data
 * 
 * SPECIAL CASE: Multiple PNG icon-based layer
 * 
 * This layer uses MULTIPLE SMALL PNG IMAGES in the legend instead of solid color swatches.
 * The hybrid detection system should automatically switch to "before/after visual diff"
 * method instead of "color detection" for this layer.
 * 
 * EXPECTED BEHAVIOR:
 * - Legend extraction returns 0 colors (PNGs, not colors)
 * - Test automatically uses checkForVisualChangeUsingToggle()
 * - Takes before/after screenshots by toggling layer visibility
 * - Uses pixelmatch to detect if layer rendered
 * - Should PASS because PNG icons render visibly on the map
 */

test.describe('Coastal and Marine Data - Multiple PNG Icon Layer Test', () => {
  // 20 sublayers! Need extended timeout
  test.setTimeout(120000); // 2 minutes
  
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5173');
    await page.waitForLoadState('networkidle');
  });

  test('Complete Quality Check (8 Criteria) - PNG ICON LAYER', async ({ page }) => {
    const layerConfig = {
      id: 'coastal-and-marine',
      title: 'Coastal and Marine Data',
      itemId: '0a7eb52e2edb456892eaa27ad46aca3a',
      url: 'https://services.arcgis.com/F7DSX1DSNSiWmOqh/arcgis/rest/services/Coastal_and_Marine/FeatureServer',
      type: 'FeatureService' as const,
      categories: ['Marine', 'Ecological / Biological (Species?)'],
      expectedResults: {
        showsInCategories: null,
        layersLoad: true,  // Should PASS with visual diff
        downloadLinkWorks: true,
        tooltipsPopUp: true,
        legendExists: true,
        legendLabelsDescriptive: true,
        legendFiltersWork: true
      },
      notes: 'Multiple PNG icon-based layer - tests visual change detection with complex icons'
    };

    console.log('\n=== Testing: Coastal and Marine Data (MULTIPLE PNG ICONS) ===\n');
    console.log('🔍 Detection Method: Expected to use BEFORE/AFTER VISUAL DIFF');
    console.log('📊 Legend Type: Multiple small PNG images');
    console.log('✅ Expected Result: PASS (PNG icons render visibly)\n');

    const result = await runQualityCheck(page, layerConfig);

    // Log detailed test results
    console.log('\n=== Test Results ===');
    console.log('Layer:', result.layerTitle);
    console.log('Type:', result.layerType);
    
    if (result.tests.test2_layersLoad) {
      const test = result.tests.test2_layersLoad;
      console.log('\n📊 TEST 2: All Layers Load');
      console.log(`   Status: ${test.passed ? '✅ PASS' : '❌ FAIL'}`);
      console.log(`   Message: ${test.message}`);
      if (test.details) {
        console.log('   Details:', JSON.stringify(test.details, null, 2));
      }
      
      // Verify detection method was used
      if (test.details?.method) {
        console.log(`   🔍 Detection Method Used: ${test.details.method}`);
        expect(test.details.method).toBe('visual_change_detection');
      }
      
      // Verify pixel diff
      if (test.details?.pixelDiff) {
        console.log(`   📊 Pixel Difference: ${test.details.pixelDiff} pixels`);
      }
    }

    // Overall assertions
    expect(result.tests.test2_layersLoad?.passed).toBe(true);
  });
});

