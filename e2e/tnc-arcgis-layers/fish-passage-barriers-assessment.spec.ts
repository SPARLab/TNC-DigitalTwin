import { test, expect } from '@playwright/test';
import { runQualityCheck } from '../helpers/run-quality-check';

/**
 * Manual Test: Fish Passage Barriers Assessment
 * 
 * SPECIAL CASE: Styled point layer (geometric shape with border)
 * 
 * This layer uses STYLED POINTS in the legend (10px dark gray circle with 1px white border)
 * instead of solid color swatches. The hybrid detection system should automatically switch
 * to "before/after visual diff" method instead of "color detection" for this layer.
 * 
 * LEGEND HTML EXAMPLE:
 * <div class="rounded-full" style="width: 10px; height: 10px; 
 *      background-color: rgba(0, 0, 0, 0.8); border: 1px solid rgba(255, 255, 255, 0.8);">
 * </div>
 * 
 * EXPECTED BEHAVIOR:
 * - Legend extraction returns 0 colors (styled points, not extractable colors)
 * - Test automatically uses checkForVisualChangeUsingToggle()
 * - Takes before/after screenshots by toggling layer visibility
 * - Uses pixelmatch to detect if layer rendered
 * - Should PASS because styled points render visibly on the map
 */

test.describe('Fish Passage Barriers Assessment - Styled Point Layer Test', () => {
  test.setTimeout(60000); // 1 minute (single sublayer)
  
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5173');
    await page.waitForLoadState('networkidle');
  });

  test('Complete Quality Check (8 Criteria) - STYLED POINT LAYER', async ({ page }) => {
    const layerConfig = {
      id: 'jldp-fish-passage-barriers',
      title: 'Fish Passage Barriers Assessment',
      itemId: '97ce3a6f166b43e3bfd9ecb14db20c35',
      url: 'https://services.arcgis.com/F7DSX1DSNSiWmOqh/arcgis/rest/services/jldp_fish_passage_barriers/FeatureServer',
      type: 'FeatureService' as const,
      categories: ['Hydrological'],
      expectedResults: {
        showsInCategories: null,
        layersLoad: true,  // Should PASS with visual diff
        downloadLinkWorks: true,
        tooltipsPopUp: true,
        legendExists: true,
        legendLabelsDescriptive: true,
        legendFiltersWork: true
      },
      notes: 'Styled point layer (10px circle with border) - tests visual change detection with geometric shapes'
    };

    console.log('\n=== Testing: Fish Passage Barriers Assessment (STYLED POINT) ===\n');
    console.log('🔍 Detection Method: Expected to use BEFORE/AFTER VISUAL DIFF');
    console.log('📊 Legend Type: Styled point (10px dark gray circle with 1px white border)');
    console.log('✅ Expected Result: PASS (styled points render visibly)\n');

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
      
      // Log zoom level if used
      if (test.details?.zoomLevel) {
        console.log(`   🔍 Zoom Level Used: ${test.details.zoomLevel}`);
      }
    }

    // Overall assertions
    expect(result.tests.test2_layersLoad?.passed).toBe(true);
  });
});

