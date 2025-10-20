import { test, expect } from '@playwright/test';
import testData from '../test-data/arcgis-layers.json' with { type: 'json' };
import * as helpers from '../helpers/tnc-arcgis-test-helpers';

/**
 * Earthquake Faults and Folds in the USA - TRUE NEGATIVE Test
 * 
 * This layer is expected to have a BROKEN download link (404).
 * This test verifies that our download link checker correctly detects 404 errors.
 */

test.describe('Earthquake Faults and Folds in the USA', () => {
  const layer = testData.layers.find(l => l.id === 'earthquake-faults-folds-usa')!;
  
  test.beforeEach(async ({ page }) => {
    // Navigate to the app
    await page.goto('/');
    
    // Wait for app to fully load
    await page.waitForLoadState('networkidle');
    
    // Give ArcGIS extra time to initialize
    await page.waitForTimeout(2000);
  });

  /**
   * Focused test on Download Link - TRUE NEGATIVE
   * We expect this to FAIL (404), which means our test should PASS when it detects the 404
   */
  test('Download Link Test (Expected: 404 / Broken Link)', async ({ page }) => {
    
    // ===== SETUP: Navigate to Search Results =====
    await test.step('Setup: Navigate to search results', async () => {
      await helpers.navigateToLayer(page, layer.title, layer.category);
    });

    // ===== TEST 1: Shows Up In Categories =====
    await test.step('1. Shows Up In Categories', async () => {
      const itemsList = page.locator('#tnc-items-list');
      await expect(itemsList).toBeVisible();
      
      const itemTitle = page.locator(`#item-title-${layer.itemId}`);
      const isVisible = await itemTitle.isVisible();
      
      if (!isVisible) {
        throw new Error(`Layer "${layer.title}" not found in search results`);
      }
      
      await expect(itemTitle).toHaveText(layer.title);
    });

    // ===== SETUP: Click Layer Card =====
    await test.step('Setup: Click layer card to load', async () => {
      const itemTitle = page.locator(`#item-title-${layer.itemId}`);
      await itemTitle.click();
      await page.waitForTimeout(3000);
    });

    // ===== TEST 2: Download Link SHOULD FAIL (TRUE NEGATIVE) =====
    await test.step('2. Download Link Should Have 404 (TRUE NEGATIVE)', async () => {
      // Use shared helper - expects download to FAIL (downloadLinkWorks = false)
      // When downloadLinkWorks is false, the helper expects to find a 404
      await helpers.testDownloadLink(page, layer.expectedResults.downloadLinkWorks);
    });
  });
});

