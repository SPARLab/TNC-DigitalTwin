import { test, expect } from '@playwright/test';
import { runQualityCheck } from '../helpers/run-quality-check';

/**
 * Manual Test: Cattle Guards
 * 
 * SPECIAL CASE: Icon-based layer (not solid colors)
 * 
 * This layer uses ICONS in the legend instead of solid color swatches.
 * The hybrid detection system should automatically switch to "before/after visual diff"
 * method instead of "color detection" for this layer.
 * 
 * EXPECTED BEHAVIOR:
 * - Legend extraction returns 0 colors (icons, not colors)
 * - Test automatically uses checkForVisualChangeUsingToggle()
 * - Takes before/after screenshots by toggling layer visibility
 * - Uses pixelmatch to detect if layer rendered
 * - Should PASS because icons render visibly on the map
 */

test.describe('Cattle Guards - Icon Layer Test', () => {
  test.setTimeout(60000); // 1 minute (single sublayer)
  
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5173');
    await page.waitForLoadState('networkidle');
  });

  test('Complete Quality Check (8 Criteria) - ICON LAYER', async ({ page }) => {
    const layerConfig = {
      id: 'jldp-cattle-guards-public-',
      title: 'Cattle Guards',
      itemId: '29f58141849e4e65b18b08953741c473',
      url: 'https://services.arcgis.com/F7DSX1DSNSiWmOqh/arcgis/rest/services/jldp_cattle_guards_(Public)/FeatureServer',
      type: 'FeatureService' as const,
      categories: ['Infrastructure'],
      expectedResults: {
        showsInCategories: null,
        layersLoad: true,  // Should PASS with visual diff
        downloadLinkWorks: true,
        tooltipsPopUp: true,
        legendExists: true,
        legendLabelsDescriptive: true,
        legendFiltersWork: true
      },
      notes: 'Icon-based layer - tests visual change detection'
    };

    console.log('\n=== Testing: Cattle Guards (ICON LAYER) ===\n');
    console.log('🔍 Detection Method: Expected to use BEFORE/AFTER VISUAL DIFF');
    console.log('📊 Legend Type: Icons (no extractable colors)');
    console.log('✅ Expected Result: PASS (icons render visibly)\n');

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

