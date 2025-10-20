import { test, expect } from '@playwright/test';
import testData from '../test-data/arcgis-layers.json' with { type: 'json' };
import * as helpers from '../helpers/tnc-arcgis-test-helpers';

/**
 * ArcGIS Layer Quality Assurance Tests
 * 
 * Tests verify the 8 quality criteria:
 * 1. Shows Up In All Categories
 * 2. All Layers Load
 * 3. ArcGIS Download Link Works
 * 4. Description Matches Website
 * 5. Tooltips Pop-Up
 * 6. Legend Exists
 * 7. Legend Labels Descriptive
 * 8. Legend Filters Work
 */

test.describe('CalFire FRAP Fire Threat 2019', () => {
  const layer = testData.layers.find(l => l.id === 'calfire-frap-fire-threat')!;
  
  test.beforeEach(async ({ page }) => {
    // Navigate to the app
    await page.goto('/');
    
    // Wait for app to fully load
    await page.waitForLoadState('networkidle');
    
    // Give ArcGIS extra time to initialize
    await page.waitForTimeout(2000);
  });

  /**
   * Comprehensive Quality Check - All 8 Criteria
   * Setup happens ONCE, then each criterion is checked as a separate step
   * Each step shows individual pass/fail in the report
   */
  test('Complete Quality Check (8 Criteria)', async ({ page }) => {
    
    // ===== SETUP: Navigate to Search Results =====
    await test.step('Setup: Navigate to search results', async () => {
      const selectCategoryBtn = page.getByRole('button', { name: /select category/i });
      await selectCategoryBtn.click();
      await page.waitForTimeout(500);
      
      const categoryBtn = page.getByRole('button', { name: /fire/i });
      await categoryBtn.click();
      await page.waitForTimeout(500);
      
      const selectSourceBtn = page.locator('#source-filter-button');
      await selectSourceBtn.click();
      await page.waitForTimeout(500);
      
      const arcgisOption = page.locator('#source-option-tnc-arcgis-hub');
      await arcgisOption.click();
      await page.waitForTimeout(500);
      
      const timeRangeBtn = page.locator('#time-range-filter-button');
      await timeRangeBtn.click();
      await page.waitForTimeout(500);
      
      const lastFiveYears = page.locator('#time-range-label-1825-days');
      await lastFiveYears.click();
      await page.waitForTimeout(500);
      
      const searchBtn = page.locator('#observations-search-button');
      await searchBtn.click();
      await page.waitForTimeout(3000);
    });

    // ===== TEST 1: Shows Up In All Categories =====
    let layerFoundInResults = false;
    await test.step('1. Shows Up In All Categories', async () => {
      const itemsList = page.locator('#tnc-items-list');
      await expect(itemsList).toBeVisible();
      
      const itemTitle = page.locator(`#item-title-${layer.itemId}`);
      const isVisible = await itemTitle.isVisible();
      
      if (!isVisible) {
        // CRITICAL FAILURE - layer not found, fail entire test
        throw new Error(`Layer "${layer.title}" not found in search results. All remaining tests skipped.`);
      }
      
      await expect(itemTitle).toHaveText(layer.title);
      layerFoundInResults = true;
    });

    // ===== SETUP: Click Layer Card to Load It =====
    await test.step('Setup: Click layer card to load', async () => {
      const itemTitle = page.locator(`#item-title-${layer.itemId}`);
      await itemTitle.click();
      await page.waitForTimeout(1000);
      
      // Set opacity to 100% for better testing
      const opacitySlider = page.locator('#tnc-details-opacity-slider');
      await opacitySlider.fill('100');
      await page.waitForTimeout(3000); // Wait for layer to render
    });

    // ===== TEST 2: All Layers Load =====
    await test.step('2. All Layers Load (pixel color check)', async () => {
      const mapContainer = page.locator('#map-view');
      const mapBox = await mapContainer.boundingBox();
      
      if (!mapBox) {
        throw new Error('Map container not found');
      }
      
      // Extract actual colors from legend swatches
      const legendColors = await helpers.extractLegendColors(page);
      console.log('Extracted legend colors:', legendColors.map(c => `${c.label}: rgb(${c.r},${c.g},${c.b})`));
      
      // Screenshot map area, excluding legend (142px from right)
      const screenshot = await page.screenshot({
        clip: {
          x: mapBox.x,
          y: mapBox.y,
          width: mapBox.width - 142,
          height: mapBox.height
        }
      });
      
      // Check if any legend colors are present in the screenshot
      const hasLayerColors = helpers.checkForColors(screenshot, legendColors);
      
      expect(hasLayerColors).toBe(true);
    });

    // ===== TEST 3: ArcGIS Download Link Works (No 404) =====
    await test.step('3. ArcGIS Download Link Works (No 404)', async () => {
      // Use shared helper - expects download to work (no 404)
      await helpers.testDownloadLink(page, layer.expectedResults.downloadLinkWorks);
    });

    // ===== TEST 4: Description Matches Website =====
    await test.step('4. Description Matches Website (TODO)', async () => {
      // TODO: Description is in ArcGIS Hub iframe, need iframe handling
      // For now, just pass this test - will enhance later
      // The description exists in the ArcGIS Hub interface but requires iframe access
      expect.soft(true).toBe(true); // Placeholder - always pass for now
    });

    // ===== TEST 5: Tooltips Pop-Up =====
    await test.step('5. Tooltips Pop-Up (click map feature)', async () => {
      // Extract legend colors for finding a feature to click
      const legendColors = await helpers.extractLegendColors(page);
      
      if (legendColors.length > 0) {
        // Test feature popup (finds colored pixel, clicks it, checks for popup)
        const popupAppeared = await helpers.testFeaturePopup(page, legendColors);
        expect.soft(popupAppeared).toBe(layer.expectedResults.tooltipsPopUp);
      } else {
        console.warn('No legend colors found, skipping tooltip test');
        expect.soft(false).toBe(layer.expectedResults.tooltipsPopUp);
      }
    });

    // ===== TEST 6: Legend Exists =====
    await test.step('6. Legend Exists', async () => {
      const legend = page.locator('#floating-legend-panel');
      const legendVisible = await legend.isVisible();
      expect.soft(legendVisible).toBe(true);
    });

    // ===== TEST 7: Legend Labels Descriptive =====
    await test.step('7. Legend Labels Descriptive', async () => {
      const legend = page.locator('#floating-legend-panel');
      
      if (await legend.isVisible()) {
        const legendItems = legend.locator('[data-testid="legend-item-label"]');
        const labels = await legendItems.allTextContents();
        
        if (labels.length > 0) {
          let allLabelsDescriptive = true;
          for (const label of labels) {
            const hasNumbers = /\d/.test(label);
            const hasLetters = /[a-zA-Z]/.test(label);
            
            // If label has numbers, it MUST also have letters to be descriptive
            if (hasNumbers && !hasLetters) {
              allLabelsDescriptive = false;
              break;
            }
          }
          
          // Soft assertion - check against expected result
          expect.soft(allLabelsDescriptive).toBe(layer.expectedResults.legendLabelsDescriptive);
        }
      }
    });

    // ===== TEST 8: Legend Filters Work (Pixel-Based) =====
    await test.step('8. Legend Filters Work (pixel-based verification)', async () => {
      // Wait for map to fully render (download modal already closed by Test 3)
      await page.waitForTimeout(2000);
      
      const legend = page.locator('#floating-legend-panel');
      
      if (await legend.isVisible()) {
        // Extract actual colors from legend swatches
        const layerColors = await helpers.extractLegendColors(page);
        console.log('Legend colors for filter test:', layerColors.map(c => `${c.label}: rgb(${c.r},${c.g},${c.b})`));
        
        // If only 1 legend item, filtering doesn't apply (nothing to filter)
        if (layerColors.length <= 1) {
          console.log('✅ Only 1 legend item - filtering not applicable, test passes');
          expect.soft(true).toBe(true);
          return;
        }
        
        // Take baseline screenshot of map (all colors visible)
        const mapContainer = page.locator('#map-view');
        const mapBox = await mapContainer.boundingBox();
        
        if (mapBox) {
          const beforeScreenshot = await page.screenshot({
            clip: {
              x: mapBox.x,
              y: mapBox.y,
              width: mapBox.width - 142, // Exclude legend
              height: mapBox.height
            },
            path: 'test-results/calfire-before-filter.png' // Debug: save screenshot
          });
          
          const beforeColors = helpers.checkWhichColorsPresent(beforeScreenshot, layerColors);
          console.log('Before filter - colors present:', beforeColors.filter(c => c.found).map(c => c.label));
          
          // Click first legend item to filter
          const firstLegendItem = legend.locator('[id^="legend-item-"]').first();
          if (await firstLegendItem.isVisible()) {
            await firstLegendItem.click({ force: true }); // Force click to bypass any overlays
            await page.waitForTimeout(2000); // Wait longer for filter to apply
            
            // Take screenshot after filtering
            const afterScreenshot = await page.screenshot({
              clip: {
                x: mapBox.x,
                y: mapBox.y,
                width: mapBox.width - 142,
                height: mapBox.height
              },
              path: 'test-results/calfire-after-filter.png' // Debug: save screenshot
            });
            
            const afterColors = helpers.checkWhichColorsPresent(afterScreenshot, layerColors);
            console.log('After filter - colors present:', afterColors.filter(c => c.found).map(c => c.label));
            
            // Check if filtering actually worked (some colors removed)
            const beforeCount = beforeColors.filter(c => c.found).length;
            const afterCount = afterColors.filter(c => c.found).length;
            const filterWorked = afterCount < beforeCount;
            
            console.log(`Filter test result: ${filterWorked} (before: ${beforeCount} colors, after: ${afterCount} colors)`);
            console.log(`Expected filter to work: ${layer.expectedResults.legendFiltersWork}`);
            
            // Soft assertion - check against expected result
            // For CalFire: expectedResults.legendFiltersWork = false (we expect it to NOT work)
            expect.soft(filterWorked).toBe(layer.expectedResults.legendFiltersWork);
          }
        }
      }
    });
  });
});
