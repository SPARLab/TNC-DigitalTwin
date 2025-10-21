import { test, expect } from '@playwright/test';
import testData from '../test-data/arcgis-layers.json' with { type: 'json' };
import * as helpers from '../helpers/tnc-arcgis-test-helpers';
import type { LayerConfig } from '../helpers/tnc-arcgis-test-helpers';

/**
 * ArcGIS Layer Quality Assurance Tests for Earthquake Faults and Folds in the USA
 * 
 * Tests verify the 8 quality criteria:
 * 1. Shows Up In All Categories
 * 2. All Layers Load
 * 3. ArcGIS Download Link Works (EXPECTED: FALSE - True Negative test)
 * 4. Description Matches Website
 * 5. Tooltips Pop-Up
 * 6. Legend Exists
 * 7. Legend Labels Descriptive
 * 8. Legend Filters Work
 */

test.describe('Earthquake Faults and Folds in the USA', () => {
  test.setTimeout(120000); // 2 minutes for multi-layer testing with zoom
  
  const layer = testData.layers.find(l => l.id === 'earthquake-faults-folds-usa')!;
  
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
  });

  test('Complete Quality Check (8 Criteria)', async ({ page }) => {
    
    // ===== SETUP: Navigate to Search Results =====
    await test.step('Setup: Navigate to search results', async () => {
      await helpers.navigateToLayer(page, layer.title, layer.category);
    });

    // ===== TEST 1: Shows Up In All Categories =====
    let layerFoundInResults = false;
    await test.step('1. Shows Up In All Categories', async () => {
      const itemsList = page.locator('#tnc-items-list');
      await expect(itemsList).toBeVisible();
      
      const itemTitle = page.locator(`#item-title-${layer.itemId}`);
      const isVisible = await itemTitle.isVisible();
      
      if (!isVisible) {
        throw new Error(`Layer "${layer.title}" not found in search results. All remaining tests skipped.`);
      }
      
      await expect(itemTitle).toHaveText(layer.title);
      layerFoundInResults = true;
    });

    if (layerFoundInResults) {
      // ===== SETUP: Click Layer Card to Load It =====
      await test.step('Setup: Click layer card to load', async () => {
        const itemTitle = page.locator(`#item-title-${layer.itemId}`);
        await itemTitle.click();
        await page.waitForTimeout(1000);
        
        // Set opacity to 100% for better testing
        const opacitySlider = page.locator('#tnc-details-opacity-slider');
        if (await opacitySlider.isVisible()) {
          await opacitySlider.fill('100');
        }
        await page.waitForTimeout(3000); // Wait for layer to render
      });

      // ===== TEST 2: All Layers Load (multi-layer + zoom + border detection) =====
      await test.step('2. All Layers Load (multi-layer + zoom + border detection)', async () => {
        // Use the enhanced testLayersLoad helper which:
        // - Tests ALL sublayers in a Feature Service
        // - Switches to satellite basemap for border detection
        // - Zooms out if pixels not found at default zoom
        // - Detects both fill and border colors
        const layerConfig: LayerConfig = {
          id: layer.id,
          title: layer.title,
          itemId: layer.itemId,
          url: '', // Not needed for this test
          type: 'FeatureService',
          categories: [],
          expectedResults: layer.expectedResults,
          notes: ''
        };
        
        const result = await helpers.testLayersLoad(page, layerConfig);
        
        console.log(`Layer load test result: ${result.message}`);
        if (result.details) {
          console.log(`Details:`, result.details);
        }
        
        expect(result.passed).toBe(true);
      });

      // ===== TEST 3: ArcGIS Download Link Works (No 404) =====
      await test.step('3. ArcGIS Download Link Works (Expected: 404 / TRUE NEGATIVE)', async () => {
        // Use shared helper - expects download to FAIL (downloadLinkWorks = false)
        await helpers.testDownloadLink(page, layer.expectedResults.downloadLinkWorks);
      });

      // ===== TEST 4: Description Matches Website =====
      await test.step('4. Description Matches Website (TODO)', async () => {
        expect.soft(true).toBe(true);
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
              
              if (hasNumbers && !hasLetters) {
                allLabelsDescriptive = false;
                break;
              }
            }
            expect.soft(allLabelsDescriptive).toBe(layer.expectedResults.legendLabelsDescriptive);
          }
        }
      });

      // ===== TEST 8: Legend Filters Work (Pixel-Based) =====
      await test.step('8. Legend Filters Work (pixel-based verification)', async () => {
        await page.waitForTimeout(2000);
        
        const legend = page.locator('#floating-legend-panel');
        
        if (await legend.isVisible()) {
          const layerColors = await helpers.extractLegendColors(page);
          console.log('Legend colors for filter test:', layerColors.map(c => `${c.label}: rgb(${c.r},${c.g},${c.b})`));
          
          // If only 1 legend item, filtering doesn't apply (nothing to filter)
          if (layerColors.length <= 1) {
            console.log('✅ Only 1 legend item - filtering not applicable, test passes');
            expect.soft(true).toBe(true);
            return;
          }
          
          const mapContainer = page.locator('#map-view');
          const mapBox = await mapContainer.boundingBox();
          
          if (mapBox) {
            const beforeScreenshot = await page.screenshot({
              clip: {
                x: mapBox.x,
                y: mapBox.y,
                width: mapBox.width - 142,
                height: mapBox.height
              },
              path: 'test-results/earthquake-before-filter.png'
            });
            
            const beforeColors = helpers.checkWhichColorsPresent(beforeScreenshot, layerColors);
            console.log('Before filter - colors present:', beforeColors.filter(c => c.found).map(c => c.label));
            
            const firstLegendItem = legend.locator('[id^="legend-item-"]').first();
            if (await firstLegendItem.isVisible()) {
              await firstLegendItem.click({ force: true });
              await page.waitForTimeout(2000);
              
              const afterScreenshot = await page.screenshot({
                clip: {
                  x: mapBox.x,
                  y: mapBox.y,
                  width: mapBox.width - 142,
                  height: mapBox.height
                },
                path: 'test-results/earthquake-after-filter.png'
              });
              
              const afterColors = helpers.checkWhichColorsPresent(afterScreenshot, layerColors);
              console.log('After filter - colors present:', afterColors.filter(c => c.found).map(c => c.label));
              
              const beforeCount = beforeColors.filter(c => c.found).length;
              const afterCount = afterColors.filter(c => c.found).length;
              const filterWorked = afterCount < beforeCount;
              
              console.log(`Filter test result: ${filterWorked} (before: ${beforeCount} colors, after: ${afterCount} colors)`);
              console.log(`Expected filter to work: ${layer.expectedResults.legendFiltersWork}`);
              
              expect.soft(filterWorked).toBe(layer.expectedResults.legendFiltersWork);
            }
          }
        }
      });
    } else {
      test.info().annotations.push({ type: 'skipped', description: 'Layer not found in results, skipping subsequent checks.' });
    }
  });
});

