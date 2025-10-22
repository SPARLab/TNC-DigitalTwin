import { test, expect } from '@playwright/test';
import { runQualityCheck } from '../helpers/run-quality-check';

/**
 * Manual Test: Dibblee Geology
 * 
 * SPECIAL CASE: Non-descriptive but accepted legend labels
 * 
 * This layer has cryptic legend labels like "Tm", "Tma", which are geological abbreviations.
 * We've decided to ACCEPT these labels without implementing complex geological interpretation.
 * 
 * EXPECTED BEHAVIOR:
 * - Test 7 (Legend Labels Descriptive) should PASS
 * - Labels like "Tm", "Tma" are accepted as-is
 * - We're not implementing logic to interpret geological abbreviations
 */

test.describe('Dibblee Geology - Cryptic Labels Test', () => {
  test.setTimeout(60000); // 1 minute
  
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5173');
    await page.waitForLoadState('networkidle');
  });

  test('Complete Quality Check (8 Criteria) - CRYPTIC LABELS ACCEPTED', async ({ page }) => {
    const layerConfig = {
      id: 'jldp-dibblee-geology',
      title: 'Dibblee Geology',
      itemId: '92bdf9cd8fff4a3bab9d77f8a6d44e1f',
      url: 'https://services.arcgis.com/F7DSX1DSNSiWmOqh/arcgis/rest/services/jldp_dibblee_geology/FeatureServer',
      type: 'FeatureService' as const,
      categories: ['Topographic', 'Land use and land (geography?)'],
      expectedResults: {
        showsInCategories: null,
        layersLoad: true,
        downloadLinkWorks: true,
        tooltipsPopUp: true,
        legendExists: true,
        legendLabelsDescriptive: true,  // NOW TRUE (accepting cryptic labels)
        legendFiltersWork: true
      },
      notes: 'Legend labels are cryptic geological abbreviations - accepted without interpretation logic'
    };

    console.log('\n=== Testing: Dibblee Geology (CRYPTIC LABELS) ===\n');
    console.log('📋 Legend Labels: "Tm", "Tma", etc. (geological abbreviations)');
    console.log('✅ Decision: Accept as-is without interpretation logic');
    console.log('✅ Expected Result: Test 7 (Legend Labels Descriptive) should PASS\n');

    const result = await runQualityCheck(page, layerConfig);

    // Log detailed test results
    console.log('\n=== Test Results ===');
    console.log('Layer:', result.layerTitle);
    console.log('Type:', result.layerType);
    
    if (result.tests.test7_legendLabelsDescriptive) {
      const test = result.tests.test7_legendLabelsDescriptive;
      console.log('\n📋 TEST 7: Legend Labels Descriptive');
      console.log(`   Status: ${test.passed ? '✅ PASS' : '❌ FAIL'}`);
      console.log(`   Message: ${test.message}`);
      if (test.details) {
        console.log('   Details:', JSON.stringify(test.details, null, 2));
      }
    }

    // Overall assertions
    expect(result.tests.test7_legendLabelsDescriptive?.passed).toBe(true);
  });
});

