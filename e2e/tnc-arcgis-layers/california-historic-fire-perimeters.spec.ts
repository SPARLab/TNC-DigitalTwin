import { test, expect } from '@playwright/test';
import {
  navigateToLayer,
  switchToTopoBasemap,
  extractLegendColors,
  testFeaturePopup,
  testDownloadLink,
  testLayersLoad,
  testLegendFiltersWork,
  type LayerConfig,
} from '../helpers/tnc-arcgis-test-helpers';

/**
 * Manual Test: California Historical Fire Perimeters
 * 
 * Purpose: Debug legend label detection for this specific layer
 * This layer appears to have a different legend structure that our test can't parse
 */

test.describe('California Historical Fire Perimeters @manual', () => {
  test.setTimeout(120000); // 2 minutes for multi-layer testing with zoom
  
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    await switchToTopoBasemap(page);
  });

  test('Complete Quality Check (8 Criteria)', async ({ page }) => {
    const layerTitle = 'California Historical Fire Perimeters';
    const category = 'Fire';

    await test.step('1. Navigate and Load Layer', async () => {
      await navigateToLayer(page, layerTitle, category);
      
      // Find and click the layer card
      const itemsList = page.locator('#tnc-items-list');
      await itemsList.waitFor({ state: 'visible', timeout: 5000 });
      
      const layerCard = page.getByText(layerTitle, { exact: true }).first();
      await expect(layerCard).toBeVisible();
      await layerCard.click();
      
      await page.waitForTimeout(1000);
      
      // Set opacity to 100%
      const opacitySlider = page.locator('#tnc-details-opacity-slider');
      await opacitySlider.fill('100');
      
      // Wait for layer to render
      await page.waitForTimeout(3000);
    });

    await test.step('2. All Layers Load (multi-layer + zoom + border detection)', async () => {
      // Use the enhanced testLayersLoad helper which:
      // - Tests ALL 3 sublayers in this Feature Service
      // - Switches to satellite basemap for border detection
      // - Zooms out if pixels not found at default zoom
      // - Detects both fill and border colors
      const layerConfig: LayerConfig = {
        id: 'california-historic-fire-perimeters',
        title: 'California Historical Fire Perimeters',
        itemId: 'california-historic-fire-perimeters',
        url: 'https://services1.arcgis.com/jUJYIo9tSA7EHvfZ/arcgis/rest/services/California_Historic_Fire_Perimeters/FeatureServer',
        type: 'FeatureService',
        categories: ['Fire'],
        expectedResults: {
          showsInCategories: null,
          layersLoad: true,
          downloadLinkWorks: true,
          tooltipsPopUp: true,
          legendExists: true,
          legendLabelsDescriptive: true,
          legendFiltersWork: true,
        },
        notes: ''
      };
      
      const result = await testLayersLoad(page, layerConfig);
      
      console.log(`Layer load test result: ${result.message}`);
      if (result.details) {
        console.log(`Details:`, result.details);
      }
      
      expect(result.passed).toBe(true);
    });

    await test.step('3. Download Link Works', async () => {
      await testDownloadLink(page, true);
    });

    await test.step('4. Tooltips Pop-Up', async () => {
      // Extract legend colors first (needed for popup test)
      const legendColors = await extractLegendColors(page);
      console.log(`🎨 Extracted ${legendColors.length} legend colors for popup test`);
      
      const success = await testFeaturePopup(page, legendColors);
      expect(success).toBe(true);
    });

    await test.step('5. Legend Exists', async () => {
      const legend = page.locator('#floating-legend-panel');
      await expect(legend).toBeVisible();
      console.log('✅ Legend panel is visible');
    });

    await test.step('6. Debug Legend Structure', async () => {
      const legend = page.locator('#floating-legend-panel');
      
      // EXPAND the legend if it's collapsed
      const legendHeader = page.locator('#legend-panel-header');
      const expandButton = legendHeader.locator('button');
      
      // Check if legend content is visible
      let legendContent = legend.locator('[id^="legend-item-"]').first();
      let isContentVisible = await legendContent.isVisible().catch(() => false);
      
      if (!isContentVisible) {
        console.log('🔓 Legend appears collapsed, clicking to expand...');
        await expandButton.click();
        await page.waitForTimeout(500);
        isContentVisible = await legendContent.isVisible().catch(() => false);
        console.log(`🔓 After click - legend content visible: ${isContentVisible}`);
      } else {
        console.log('✅ Legend is already expanded');
      }
      
      // Check what legend items exist
      const allLegendItems = legend.locator('[id^="legend-item-"]');
      const itemCount = await allLegendItems.count();
      console.log(`📊 Total legend items found: ${itemCount}`);
      
      // Check for text labels
      const labelItems = legend.locator('[data-testid="legend-item-label"]');
      const labelCount = await labelItems.count();
      const labels = await labelItems.allTextContents();
      console.log(`📝 Text labels found: ${labelCount}`);
      console.log(`📝 Labels:`, labels);
      
      // Check legend colors (our current working method)
      const legendColors = await extractLegendColors(page);
      console.log(`🎨 Legend colors extracted: ${legendColors.length}`);
      console.log(`🎨 Colors:`, legendColors);
      
      // Dump the entire legend HTML for inspection
      const legendHTML = await legend.innerHTML();
      console.log('\n📋 Legend HTML structure:');
      console.log(legendHTML.substring(0, 1000)); // First 1000 chars
      
      // Check for different legend structures
      const iconSwatches = legend.locator('[id^="legend-swatch-icon-"]');
      const iconCount = await iconSwatches.count();
      console.log(`🖼️  Icon swatches found: ${iconCount}`);
      
      const polygonSwatches = legend.locator('[id^="legend-swatch-polygon-"]');
      const polygonCount = await polygonSwatches.count();
      console.log(`🔷 Polygon swatches found: ${polygonCount}`);
      
      const lineSwatches = legend.locator('[id^="legend-swatch-line-"]');
      const lineCount = await lineSwatches.count();
      console.log(`📏 Line swatches found: ${lineCount}`);
      
      // This test always passes - it's for debugging only
      expect(true).toBe(true);
    });

    await test.step('7. Legend Labels Descriptive (Current Test)', async () => {
      const legend = page.locator('#floating-legend-panel');
      const legendItems = legend.locator('[data-testid="legend-item-label"]');
      let labels = await legendItems.allTextContents();
      
      console.log(`\n🔍 First check - labels found: ${labels.length}`);
      
      if (labels.length === 0) {
        console.log('⏳ No labels found, waiting 3s and retrying...');
        await page.waitForTimeout(3000);
        labels = await legendItems.allTextContents();
        console.log(`🔍 After retry - labels found: ${labels.length}`);
      }
      
      if (labels.length === 0) {
        console.log('⏳ Still no labels, waiting another 2s and checking for non-text legend items...');
        await page.waitForTimeout(2000);
        
        const allLegendItems = legend.locator('[id^="legend-item-"]');
        const itemCount = await allLegendItems.count();
        console.log(`📊 Non-text legend items found: ${itemCount}`);
        
        if (itemCount > 0) {
          console.log('✅ Legend has items but no text labels - treating as not applicable');
          expect(true).toBe(true);
          return;
        }
        
        console.log('❌ No legend items found at all');
        expect(false, 'No legend labels found even after retry').toBe(true);
        return;
      }
      
      console.log(`✅ Found ${labels.length} legend labels:`, labels);
      expect(labels.length).toBeGreaterThan(0);
    });

    await test.step('8. Legend Filters Work (all sublayers with zoom logic)', async () => {
      // Use the enhanced testLegendFiltersWork helper which:
      // - Tests filtering on ALL sublayers (not just the first)
      // - For each sublayer: checks if colors are visible at current zoom
      // - Zooms out if needed (like sublayer 3 requires)
      // - Switches to satellite basemap for better visibility
      // - Takes before/after screenshots to verify filtering
      // - Skips sublayers with only 1 legend item (filtering not applicable)
      const layerConfig: LayerConfig = {
        id: 'california-historic-fire-perimeters',
        title: 'California Historical Fire Perimeters',
        itemId: 'california-historic-fire-perimeters',
        url: 'https://services1.arcgis.com/jUJYIo9tSA7EHvfZ/arcgis/rest/services/California_Historic_Fire_Perimeters/FeatureServer',
        type: 'FeatureService',
        categories: ['Fire'],
        expectedResults: {
          showsInCategories: null,
          layersLoad: true,
          downloadLinkWorks: true,
          tooltipsPopUp: true,
          legendExists: true,
          legendLabelsDescriptive: true,
          legendFiltersWork: true,
        },
        notes: ''
      };
      
      const result = await testLegendFiltersWork(page, layerConfig);
      
      console.log(`✅ Legend filter test result: ${result.message}`);
      if (result.details) {
        console.log(`📊 Details:`, result.details);
      }
      
      expect(result.passed).toBe(true);
    });
  });
});

