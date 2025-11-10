import { test, expect } from '@playwright/test';
import { runQualityCheck, matchesExpectedResult } from '../helpers/run-quality-check';
import type { LayerConfig } from '../helpers/tnc-arcgis-test-helpers';
import { calculateTestTimeout } from '../helpers/timeout-calculator';

/**
 * Manual Test: JLDP Fire Perimeters
 * 
 * Purpose: Debug why this layer hangs during dynamic test runs
 * 
 * Run with: npm run test:e2e -- --headed --grep="JLDP Fire Perimeters" --grep-invert="@dynamic"
 * 
 * Note: Use --grep-invert="@dynamic" to ONLY run the manual test, not the dynamic test
 */

test.describe('JLDP Fire Perimeters @manual', () => {
  const SUBLAYER_COUNT = 20; // Conservative estimate
  const timeout = calculateTestTimeout(SUBLAYER_COUNT);
  
  test.setTimeout(timeout);
  
  // Fresh browser state for each test
  test.beforeEach(async ({ page, context }) => {
    // Clear all cookies and cache for fresh start
    await context.clearCookies();
    await context.clearPermissions();
    
    // Navigate using baseURL from config (consistent with dynamic tests)
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Clear ALL storage (localStorage, sessionStorage, IndexedDB, cache)
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
      // Clear IndexedDB if it exists
      if (window.indexedDB) {
        window.indexedDB.databases?.().then((dbs) => {
          dbs.forEach((db) => {
            if (db.name) window.indexedDB.deleteDatabase(db.name);
          });
        });
      }
    }).catch(() => {
      // Ignore errors if storage not accessible
    });
    
    // Wait for any async operations to complete
    await page.waitForTimeout(2000);
  });

  const layerConfig: LayerConfig = {
    title: 'JLDP Fire Perimeters',
    itemId: 'fire-perimeters',
    url: 'https://services.arcgis.com/F7DSX1DSNSiWmOqh/arcgis/rest/services/Fire_Perimeters/FeatureServer',
    type: 'FeatureService',
    categories: ['Fire'],
    expectedResults: {
      showsInCategories: true,
      layersLoad: true,
      downloadLinkWorks: true,
      tooltipsPopUp: true,
      legendExists: true,
      legendLabelsDescriptive: true,
      legendFiltersWork: true,
    },
  };

  test(`Complete Quality Check (8 Criteria)`, async ({ page }) => {
    console.log(`\n=== Testing: ${layerConfig.title} ===`);
    console.log(`Type: ${layerConfig.type}`);
    console.log(`Timeout: ${timeout / 1000}s`);
    
    // Run the complete quality check
    const results = await runQualityCheck(page, layerConfig);

    console.log('\n📊 Test Results:');
    console.log(`   1. Shows in categories: ${results.tests.test1_showsInCategories.passed ? '✅' : '❌'} - ${results.tests.test1_showsInCategories.message}`);
    console.log(`   2. Layers load: ${results.tests.test2_layersLoad.passed ? '✅' : '❌'} - ${results.tests.test2_layersLoad.message}`);
    console.log(`   3. Download link works: ${results.tests.test3_downloadWorks.passed ? '✅' : '❌'} - ${results.tests.test3_downloadWorks.message}`);
    console.log(`   4. Tooltips pop up: ${results.tests.test5_tooltipsPopUp.passed ? '✅' : '❌'} - ${results.tests.test5_tooltipsPopUp.message}`);
    console.log(`   5. Legend exists: ${results.tests.test6_legendExists.passed ? '✅' : '❌'} - ${results.tests.test6_legendExists.message}`);
    console.log(`   6. Legend labels descriptive: ${results.tests.test7_legendLabelsDescriptive.passed ? '✅' : '❌'} - ${results.tests.test7_legendLabelsDescriptive.message}`);
    console.log(`   7. Legend filters work: ${results.tests.test8_legendFiltersWork.passed ? '✅' : '❌'} - ${results.tests.test8_legendFiltersWork.message}`);

    // All tests completed - results printed above
  });
});

