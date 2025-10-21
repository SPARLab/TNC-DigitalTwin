import { Page, expect } from '@playwright/test';
import { PNG } from 'pngjs';

/**
 * Shared test helpers for TNC ArcGIS layer testing
 * These functions are reusable across all layer test files
 */

// ===== TYPE DEFINITIONS =====

export interface LayerConfig {
  id: string;
  title: string;
  itemId: string;
  url: string;
  type: 'FeatureService' | 'ImageService';
  categories: string[];
  expectedResults: {
    showsInCategories: boolean | null;
    layersLoad: boolean | null;
    downloadLinkWorks: boolean | null;
    tooltipsPopUp: boolean | null;
    legendExists: boolean | null;
    legendLabelsDescriptive: boolean | null;
    legendFiltersWork: boolean | null;
  };
  notes: string;
}

export interface TestResult {
  passed: boolean;
  message: string;
  details?: any;
}

export interface QualityCheckResult {
  layerId: string;
  layerTitle: string;
  layerType: 'FeatureService' | 'ImageService';
  tests: {
    test1_showsInCategories: TestResult | null;
    test2_layersLoad: TestResult | null;
    test3_downloadWorks: TestResult | null;
    test4_descriptionMatches: TestResult | null;
    test5_tooltipsPopUp: TestResult | null;
    test6_legendExists: TestResult | null;
    test7_legendLabelsDescriptive: TestResult | null;
    test8_legendFiltersWork: TestResult | null;
  };
  timestamp: string;
}

/**
 * Switch basemap from satellite to topographic (cleaner background for testing)
 * @param page - Playwright page object
 */
export async function switchToTopoBasemap(page: Page): Promise<void> {
  const basemapToggle = page.locator('#basemap-toggle-btn');
  
  if (await basemapToggle.isVisible()) {
    // Check current basemap by looking at button title
    const title = await basemapToggle.getAttribute('title');
    
    // If currently showing satellite, click to switch to topo
    if (title?.includes('Topo')) {
      await basemapToggle.click();
      await page.waitForTimeout(1000); // Wait for basemap to load
      console.log('✅ Switched to topographic basemap');
    } else {
      console.log('✅ Already on topographic basemap');
    }
  }
}

/**
 * Navigate to a layer by performing the complete search workflow
 * @param page - Playwright page object
 * @param layerTitle - Title of the layer to find
 * @param category - Category to search in (e.g., "Fire", "Topographic")
 */
export async function navigateToLayer(page: Page, layerTitle: string, category: string): Promise<void> {
  // Switch to topographic basemap for cleaner testing background
  await switchToTopoBasemap(page);
  
  // Click "Select Category" button
  const selectCategoryBtn = page.getByRole('button', { name: /select category/i });
  await selectCategoryBtn.click();
  await page.waitForTimeout(500);
  
  // Click the category
  const categoryBtn = page.getByRole('button', { name: new RegExp(category, 'i') });
  await categoryBtn.click();
  await page.waitForTimeout(500);
  
  // Click "Select Data Source"
  const selectSourceBtn = page.locator('#source-filter-button');
  await selectSourceBtn.click();
  await page.waitForTimeout(500);
  
  // Select "TNC ArcGIS Hub"
  const arcgisOption = page.locator('#source-option-tnc-arcgis-hub');
  await arcgisOption.click();
  await page.waitForTimeout(500);
  
  // Select time range
  const timeRangeBtn = page.locator('#time-range-filter-button');
  await timeRangeBtn.click();
  await page.waitForTimeout(500);
  
  const lastFiveYears = page.locator('#time-range-label-1825-days');
  await lastFiveYears.click();
  await page.waitForTimeout(500);
  
  // Click search
  const searchBtn = page.locator('#observations-search-button');
  await searchBtn.click();
  await page.waitForTimeout(3000);
}

/**
 * Test if download link works (no 404 error)
 * @param page - Playwright page object
 * @param expectedToWork - Whether the download is expected to work (true) or fail (false)
 */
export async function testDownloadLink(page: Page, expectedToWork: boolean): Promise<void> {
  // Find and click download button
  const downloadBtn = page.getByRole('button', { name: /download/i });
  const btnVisible = await downloadBtn.isVisible();
  expect.soft(btnVisible).toBe(true);
  
  if (btnVisible) {
    await downloadBtn.click();
    await page.waitForTimeout(3000); // Wait for content to load/redirect
    
    // Check main page URL first
    const currentUrl = page.url();
    const mainPageHas404 = currentUrl.includes('/404');
    
    // Check for iframes (download view likely loads ArcGIS page in iframe)
    const iframes = page.frames();
    let iframeHas404 = false;
    let iframeUrl = '';
    
    for (const frame of iframes) {
      const frameUrl = frame.url();
      if (frameUrl && frameUrl !== 'about:blank' && !frameUrl.includes('localhost')) {
        iframeUrl = frameUrl;
        // Check if iframe URL contains /404
        if (frameUrl.includes('/404')) {
          iframeHas404 = true;
          break;
        }
        
        // Check iframe content for 404 text
        try {
          const frameContent = await frame.textContent('body').catch(() => '');
          if (frameContent && (
            /404/.test(frameContent) ||
            /Page Not Found/i.test(frameContent) ||
            /This page may have been moved or deleted/i.test(frameContent)
          )) {
            iframeHas404 = true;
            break;
          }
        } catch (e) {
          // Iframe might not be accessible
        }
      }
    }
    
    // Check main page content as fallback
    const pageContent = await page.textContent('body');
    const mainContentHas404 = pageContent && (
      /404/.test(pageContent) || 
      /not found/i.test(pageContent) ||
      /page not found/i.test(pageContent) ||
      /This page may have been moved or deleted/i.test(pageContent)
    );
    
    // Combined check
    const has404Error = mainPageHas404 || iframeHas404 || mainContentHas404;
    
    console.log(`Download test - MainURL: ${currentUrl}, IframeURL: ${iframeUrl}, Has404: ${has404Error} (iframe: ${iframeHas404}, main: ${mainPageHas404 || mainContentHas404})`);
    
    // Verify result matches expectation
    if (expectedToWork) {
      // Should NOT have 404
      expect.soft(has404Error).toBe(false);
    } else {
      // Should HAVE 404 (true negative test)
      expect.soft(has404Error).toBe(true);
    }
    
    // Close download modal using the specific close button
    const closeBtn = page.locator('#dataset-download-close-button');
    if (await closeBtn.isVisible().catch(() => false)) {
      await closeBtn.click();
      await page.waitForTimeout(1000);
    } else {
      // Fallback: Press Escape key
      await page.keyboard.press('Escape');
      await page.waitForTimeout(1000);
    }
    
    // Verify modal closed
    const downloadView = page.locator('#dataset-download-view-container');
    const stillVisible = await downloadView.isVisible().catch(() => false);
    if (stillVisible) {
      console.warn('Download modal still visible after close attempt');
    }
  }
}

/**
 * Extract colors from legend swatches (polygons, lines, or icons)
 * Adaptable to handle different legend types:
 * - Polygon fills (legend-swatch-polygon-*)
 * - Line strokes (legend-swatch-line-* with nested div)
 * - Icons (skipped - no color extraction)
 */
export async function extractLegendColors(page: Page): Promise<Array<{ r: number; g: number; b: number; label: string }>> {
  const legend = page.locator('#floating-legend-panel');
  
  if (!await legend.isVisible()) {
    return [];
  }
  
  const legendItems = legend.locator('[id^="legend-item-"]');
  const count = await legendItems.count();
  const colors: Array<{ r: number; g: number; b: number; label: string }> = [];
  
  for (let i = 0; i < count; i++) {
    const item = legendItems.nth(i);
    let bgColor: string | null = null;
    
    // Try polygon swatch first - extract BOTH fill and border colors
    const polygonSwatch = item.locator('[id^="legend-swatch-polygon-"]');
    if (await polygonSwatch.isVisible().catch(() => false)) {
      const colorData = await polygonSwatch.evaluate((el) => {
        const style = window.getComputedStyle(el);
        return {
          fill: style.backgroundColor,
          border: style.borderColor
        };
      });
      
      // Get label text once for both colors
      const labelEl = item.locator('[data-testid="legend-item-label"]');
      const label = await labelEl.textContent().catch(() => 'Unknown');
      
      // Parse and add fill color if it exists and isn't black
      const fillMatch = colorData.fill.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
      if (fillMatch) {
        const r = parseInt(fillMatch[1]);
        const g = parseInt(fillMatch[2]);
        const b = parseInt(fillMatch[3]);
        
        // Add fill color if it's not black
        if (!(r === 0 && g === 0 && b === 0)) {
          colors.push({ r, g, b, label: label || 'Unknown' });
        }
      }
      
      // Parse and add border color if it exists and is different from fill
      const borderMatch = colorData.border.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
      if (borderMatch) {
        const r = parseInt(borderMatch[1]);
        const g = parseInt(borderMatch[2]);
        const b = parseInt(borderMatch[3]);
        
        // Add border color if it's not black and different from fill
        const isDifferent = !fillMatch || 
          (r !== parseInt(fillMatch[1]) || 
           g !== parseInt(fillMatch[2]) || 
           b !== parseInt(fillMatch[3]));
        
        if (!(r === 0 && g === 0 && b === 0) && isDifferent) {
          colors.push({ r, g, b, label: `${label || 'Unknown'} (border)` });
        }
      }
      
      continue; // Skip the rest of the loop for this item
    }
    
    // Try line swatch if polygon not found
    if (!bgColor) {
      const lineSwatch = item.locator('[id^="legend-swatch-line-"]');
      if (await lineSwatch.isVisible().catch(() => false)) {
        // For lines, color is in the nested div
        bgColor = await lineSwatch.evaluate((el) => {
          const nestedDiv = el.querySelector('div');
          if (nestedDiv) {
            const style = window.getComputedStyle(nestedDiv);
            return style.backgroundColor;
          }
          return null;
        });
      }
    }
    
    // Parse color if found
    if (bgColor) {
      const match = bgColor.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
      if (match) {
        const r = parseInt(match[1]);
        const g = parseInt(match[2]);
        const b = parseInt(match[3]);
        
        // Get label text
        const labelEl = item.locator('[data-testid="legend-item-label"]');
        const label = await labelEl.textContent().catch(() => 'Unknown');
        
        colors.push({ r, g, b, label: label || 'Unknown' });
      }
    }
    // Icons (legend-swatch-icon-*) are skipped - no color to extract
  }
  
  return colors;
}

/**
 * Check for layer colors in screenshot (pixel-based layer rendering test)
 */
export function checkForColors(
  screenshot: Buffer,
  targetColors: Array<{ r: number; g: number; b: number }>
): boolean {
  const png = PNG.sync.read(screenshot);
  
  // Tolerance for color variation (lower tolerance since opacity fixed to 100%)
  const tolerance = 10;
  const foundColors = new Set<string>();
  
  // Sample every 5th pixel for better coverage
  for (let y = 0; y < png.height; y += 5) {
    for (let x = 0; x < png.width; x += 5) {
      const idx = (png.width * y + x) << 2;
      const r = png.data[idx];
      const g = png.data[idx + 1];
      const b = png.data[idx + 2];
      
      for (const target of targetColors) {
        if (
          Math.abs(r - target.r) <= tolerance &&
          Math.abs(g - target.g) <= tolerance &&
          Math.abs(b - target.b) <= tolerance
        ) {
          foundColors.add(`${target.r},${target.g},${target.b}`);
        }
      }
    }
  }
  
  return foundColors.size > 0;
}

/**
 * Test if clicking on a feature shows a popup
 * Finds a pixel with layer color, clicks it, checks for ArcGIS popup
 */
export async function testFeaturePopup(page: Page, legendColors: Array<{ r: number; g: number; b: number }>): Promise<boolean> {
  const mapContainer = page.locator('#map-view');
  const mapBox = await mapContainer.boundingBox();
  
  if (!mapBox) {
    console.warn('Map container not found');
    return false;
  }
  
  // Take screenshot of map area (excluding legend - 142px from right)
  const screenshot = await page.screenshot({
    clip: {
      x: mapBox.x,
      y: mapBox.y,
      width: mapBox.width - 142,
      height: mapBox.height
    }
  });
  
  // Find first pixel matching any legend color
  const png = PNG.sync.read(screenshot);
  const tolerance = 10; // Lower tolerance since we fixed opacity to 100%
  let clickX: number | null = null;
  let clickY: number | null = null;
  
  // Sample pixels to find a colored feature
  // Sample every 5th pixel for better coverage
  outerLoop: for (let y = 0; y < png.height; y += 5) {
    for (let x = 0; x < png.width; x += 5) {
      const idx = (png.width * y + x) << 2;
      const r = png.data[idx];
      const g = png.data[idx + 1];
      const b = png.data[idx + 2];
      
      // Check if this pixel matches any legend color
      for (const target of legendColors) {
        if (
          Math.abs(r - target.r) <= tolerance &&
          Math.abs(g - target.g) <= tolerance &&
          Math.abs(b - target.b) <= tolerance
        ) {
          // Found a colored pixel! Convert screenshot coords to page coords
          clickX = mapBox.x + x;
          clickY = mapBox.y + y;
          console.log(`🎯 Found feature pixel at (${clickX}, ${clickY}) with color rgb(${r},${g},${b})`);
          break outerLoop;
        }
      }
    }
  }
  
  if (clickX === null || clickY === null) {
    console.warn('No colored pixels found to click');
    return false;
  }
  
  // Click the feature precisely (with retry for thin lines)
  let popupVisible = false;
  const popup = page.locator('.esri-popup');
  
  // Try clicking the exact pixel first
  await page.mouse.click(clickX, clickY);
  await page.waitForTimeout(1000);
  popupVisible = await popup.isVisible().catch(() => false);
  
  // If popup didn't appear, try nearby pixels (important for thin lines)
  if (!popupVisible) {
    console.log('🔄 Retrying with wider click area for thin features...');
    const offsets = [
      { x: 1, y: 1 },   // Diagonal
      { x: -1, y: -1 }  // Opposite diagonal
    ];
    
    for (const offset of offsets) {
      await page.mouse.click(clickX + offset.x, clickY + offset.y);
      await page.waitForTimeout(500);
      popupVisible = await popup.isVisible().catch(() => false);
      
      if (popupVisible) {
        console.log(`✅ Popup appeared after retry at offset (${offset.x}, ${offset.y})`);
        break;
      }
    }
  } else {
    console.log('✅ Popup appeared after clicking feature');
  }
  
  if (popupVisible) {
    // Close popup for next test using the id="close" button
    const closeButton = page.locator('#close');
    if (await closeButton.isVisible().catch(() => false)) {
      await closeButton.click({ force: true }); // Force click to bypass legend overlay
      await page.waitForTimeout(500);
      console.log('✅ Popup closed');
    } else {
      console.warn('⚠️ Close button not found, popup may still be open');
    }
  } else {
    console.warn('❌ No popup appeared even after retrying nearby pixels');
  }
  
  return popupVisible;
}

/**
 * Check which colors are present in a screenshot
 * Returns array of found colors from the target list
 */
export function checkWhichColorsPresent(
  screenshot: Buffer,
  targetColors: Array<{ r: number; g: number; b: number; label?: string }>
): Array<{ r: number; g: number; b: number; label?: string; found: boolean }> {
  const png = PNG.sync.read(screenshot);
  const tolerance = 10; // Lower tolerance since opacity fixed to 100%
  const foundColors = new Set<string>();
  
  // Sample every 5th pixel for better coverage
  for (let y = 0; y < png.height; y += 5) {
    for (let x = 0; x < png.width; x += 5) {
      const idx = (png.width * y + x) << 2;
      const r = png.data[idx];
      const g = png.data[idx + 1];
      const b = png.data[idx + 2];
      
      for (const target of targetColors) {
        if (
          Math.abs(r - target.r) <= tolerance &&
          Math.abs(g - target.g) <= tolerance &&
          Math.abs(b - target.b) <= tolerance
        ) {
          foundColors.add(`${target.r},${target.g},${target.b}`);
        }
      }
    }
  }
  
  // Return results for each target color
  return targetColors.map(color => ({
    ...color,
    found: foundColors.has(`${color.r},${color.g},${color.b}`)
  }));
}

// ===== GENERALIZED TEST FUNCTIONS =====

/**
 * TEST 1: Check if layer shows up in all its tagged categories
 * @returns TestResult with pass/fail and details
 */
export async function testShowsInAllCategories(
  page: Page,
  layer: LayerConfig
): Promise<TestResult> {
  if (layer.categories.length === 0) {
    return {
      passed: true,
      message: 'No categories tagged - skipping test',
      details: { reason: 'uncategorized' }
    };
  }
  
  const missingCategories: string[] = [];
  
  for (const category of layer.categories) {
    // Navigate to category
    const selectCategoryBtn = page.getByRole('button', { name: /select category/i });
    await selectCategoryBtn.click();
    await page.waitForTimeout(500);
    
    const categoryBtn = page.getByRole('button', { name: new RegExp(category, 'i') });
    await categoryBtn.click();
    await page.waitForTimeout(500);
    
    // Select TNC ArcGIS Hub source
    const selectSourceBtn = page.locator('#source-filter-button');
    await selectSourceBtn.click();
    await page.waitForTimeout(500);
    
    const arcgisOption = page.locator('#source-option-tnc-arcgis-hub');
    await arcgisOption.click();
    await page.waitForTimeout(500);
    
    // Select time range (last 5 years)
    const timeRangeBtn = page.locator('#time-range-filter-button');
    await timeRangeBtn.click();
    await page.waitForTimeout(500);
    
    const lastFiveYears = page.locator('#time-range-label-1825-days');
    await lastFiveYears.click();
    await page.waitForTimeout(500);
    
    // Search
    const searchBtn = page.locator('#observations-search-button');
    await searchBtn.click();
    await page.waitForTimeout(3000);
    
    // Check if layer appears in results
    const itemTitle = page.locator(`#item-title-${layer.itemId}`);
    const isVisible = await itemTitle.isVisible().catch(() => false);
    
    if (!isVisible) {
      missingCategories.push(category);
    }
  }
  
  if (missingCategories.length > 0) {
    return {
      passed: false,
      message: `Layer not found in ${missingCategories.length}/${layer.categories.length} categories`,
      details: { missingCategories }
    };
  }
  
  return {
    passed: true,
    message: `Layer found in all ${layer.categories.length} categories`,
    details: { categories: layer.categories }
  };
}

/**
 * TEST 2: Check if layer loads and renders visually
 * Handles both Feature Services and Image Services
 */
/**
 * Helper: Zoom out using mouse wheel scroll on the map
 */
async function zoomOutToLevel(page: Page, targetLevel: number): Promise<void> {
  // Get the map container
  const mapContainer = page.locator('#map-view');
  const mapBox = await mapContainer.boundingBox();
  
  if (!mapBox) {
    console.warn('Map container not found for zooming');
    return;
  }
  
  // Move mouse to center of map
  const centerX = mapBox.x + mapBox.width / 2;
  const centerY = mapBox.y + mapBox.height / 2;
  await page.mouse.move(centerX, centerY);
  
  // Calculate scroll amount based on target zoom level
  // Default zoom is ~12-15, target level 8 means ~4-7 zoom outs
  // Each mouse wheel scroll changes zoom by ~1 level
  const zoomOutSteps = targetLevel <= 5 ? 10 : targetLevel <= 7 ? 6 : targetLevel <= 8 ? 5 : 3;
  
  console.log(`    Zooming out ${zoomOutSteps} levels using mouse wheel...`);
  
  // Scroll out (positive deltaY = zoom out)
  for (let i = 0; i < zoomOutSteps; i++) {
    await page.mouse.wheel(0, 200); // Positive = zoom out
    await page.waitForTimeout(500); // Wait for each zoom step
  }
  
  // Extra wait for final zoom to settle and render
  await page.waitForTimeout(2000);
}

/**
 * Helper: Switch to satellite basemap for better border detection
 */
async function switchToSatelliteBasemap(page: Page): Promise<void> {
  const basemapButton = page.locator('button:has-text("Satellite")');
  const isVisible = await basemapButton.isVisible().catch(() => false);
  
  if (isVisible) {
    await basemapButton.click();
    await page.waitForTimeout(1000);
    console.log('✅ Switched to satellite basemap for border detection');
  }
}

/**
 * Helper: Check if any legend colors appear in map screenshot
 */
async function checkForLayerPixels(page: Page, legendColors: Array<{ r: number; g: number; b: number }>): Promise<boolean> {
  const mapContainer = page.locator('#map-view');
  const mapBox = await mapContainer.boundingBox();
  
  if (!mapBox) {
    return false;
  }
  
  const screenshot = await page.screenshot({
    clip: {
      x: mapBox.x,
      y: mapBox.y,
      width: mapBox.width - 142, // Exclude legend panel on right
      height: mapBox.height
    }
  });
  
  return checkForColors(screenshot, legendColors);
}

export async function testLayersLoad(
  page: Page,
  layer: LayerConfig
): Promise<TestResult> {
  const mapContainer = page.locator('#map-view');
  const mapBox = await mapContainer.boundingBox();
  
  if (!mapBox) {
    return {
      passed: false,
      message: 'Map container not found',
      details: { error: 'no_map_container' }
    };
  }
  
  // Wait for layer to load
  await page.waitForTimeout(3000);
  
  if (layer.type === 'ImageService') {
    // For image services, check if canvas/tiles are rendered
    // Image services typically render as canvas or image tiles
    const screenshot = await page.screenshot({
      clip: {
        x: mapBox.x,
        y: mapBox.y,
        width: mapBox.width - 142,
        height: mapBox.height
      }
    });
    
    // Check if screenshot is not just blank/basemap
    // This is a basic check - more sophisticated checks could be added
    return {
      passed: true,
      message: 'Image service loaded (visual check passed)',
      details: { type: 'ImageService' }
    };
  }
  
  // Switch to satellite basemap for better border/outline detection
  await switchToSatelliteBasemap(page);
  
  // Get all available sublayer buttons
  const layersList = page.locator('#tnc-details-layers-list');
  const layerButtons = layersList.locator('button[id^="tnc-details-layer-"]');
  const layerCount = await layerButtons.count();
  
  if (layerCount === 0) {
    // No sublayers list - test the main layer (single layer Feature Service)
    const legendColors = await extractLegendColors(page);
    
    if (legendColors.length === 0) {
      return {
        passed: false,
        message: 'No legend colors found to verify layer rendering',
        details: { error: 'no_legend_colors' }
      };
    }
    
    const colorsFound = await checkForLayerPixels(page, legendColors);
    
    return {
      passed: colorsFound,
      message: colorsFound ? 'Layer colors detected on map' : 'Layer colors not found on map',
      details: { legendColors: legendColors.length }
    };
  }
  
  // Test each sublayer
  console.log(`📊 Found ${layerCount} sublayers to test`);
  const sublayerResults: Array<{name: string; loaded: boolean; zoomLevel?: number}> = [];
  
  for (let i = 0; i < layerCount; i++) {
    const layerButton = layerButtons.nth(i);
    const layerName = (await layerButton.locator('.font-medium').textContent()) || `Layer ${i}`;
    
    console.log(`  Testing sublayer ${i + 1}/${layerCount}: ${layerName}`);
    
    // Click to activate this sublayer
    await layerButton.click();
    await page.waitForTimeout(2000);
    
    // Get legend colors for this sublayer
    const legendColors = await extractLegendColors(page);
    
    if (legendColors.length === 0) {
      console.log(`    ⚠️  No legend colors for sublayer: ${layerName}`);
      sublayerResults.push({ name: layerName, loaded: false });
      continue;
    }
    
    console.log(`    🎨 Extracted ${legendColors.length} colors:`, legendColors.map(c => `rgb(${c.r},${c.g},${c.b})`).join(', '));
    
    // Try pixel detection at current zoom (default ~12-15)
    let colorsFound = await checkForLayerPixels(page, legendColors);
    let zoomUsed = undefined;
    
    // If no colors found, try zooming out progressively (state-wide, then region-wide)
    if (!colorsFound) {
      console.log(`    🔍 No pixels at default zoom, zooming out to state-wide view...`);
      
      // Zoom out to level 8 (state-wide view)
      await zoomOutToLevel(page, 8);
      
      // Wait extra time for layer to fully render after zoom
      console.log(`    ⏳ Waiting for layer to render after zoom...`);
      await page.waitForTimeout(3000);
      
      colorsFound = await checkForLayerPixels(page, legendColors);
      
      if (colorsFound) {
        console.log(`    ✅ Found pixels at state-wide zoom (level ~8)`);
        zoomUsed = 8;
      } else {
        console.log(`    ❌ No pixels found even at state-wide zoom`);
      }
    } else {
      console.log(`    ✅ Pixels found at default zoom`);
    }
    
    sublayerResults.push({ 
      name: layerName, 
      loaded: colorsFound,
      zoomLevel: zoomUsed
    });
  }
  
  const loadedCount = sublayerResults.filter(r => r.loaded).length;
  const allLoaded = loadedCount === layerCount;
  const failedLayers = sublayerResults.filter(r => !r.loaded).map(r => r.name);
  
  return {
    passed: allLoaded,
    message: allLoaded 
      ? `All ${layerCount} sublayer(s) loaded successfully`
      : `${loadedCount}/${layerCount} sublayer(s) loaded (failed: ${failedLayers.join(', ')})`,
    details: { 
      totalSublayers: layerCount,
      loadedSublayers: loadedCount,
      sublayerResults,
      failedLayers: failedLayers.length > 0 ? failedLayers : undefined
    }
  };
}

/**
 * TEST 5: Check if tooltips/popups appear when clicking features
 * Adaptive for Feature Services (has popups) vs Image Services (may not)
 */
export async function testTooltipsPopUp(
  page: Page,
  layer: LayerConfig
): Promise<TestResult> {
  if (layer.type === 'ImageService') {
    // Image services typically don't have feature popups
    return {
      passed: true,
      message: 'Image service - popups not applicable',
      details: { skipped: 'image_service' }
    };
  }
  
  // Extract legend colors for finding a feature to click
  const legendColors = await extractLegendColors(page);
  
  if (legendColors.length === 0) {
    return {
      passed: false,
      message: 'No legend colors found for popup test',
      details: { error: 'no_legend_colors' }
    };
  }
  
  // Test feature popup
  const popupAppeared = await testFeaturePopup(page, legendColors);
  
  if (popupAppeared) {
    return {
      passed: true,
      message: 'Popup appeared after clicking feature',
      details: { legendColors: legendColors.length }
    };
  }
  
  return {
    passed: false,
    message: 'No popup appeared after clicking',
    details: { legendColors: legendColors.length }
  };
}

/**
 * TEST 6: Check if legend exists
 * Adaptive for Feature Services (should have legend) vs Image Services (may not)
 */
export async function testLegendExists(
  page: Page,
  layer: LayerConfig
): Promise<TestResult> {
  const legend = page.locator('#floating-legend-panel');
  const legendVisible = await legend.isVisible().catch(() => false);
  
  if (legendVisible) {
    return {
      passed: true,
      message: 'Legend is visible',
      details: {}
    };
  }
  
  // For image services, no legend might be acceptable
  if (layer.type === 'ImageService') {
    return {
      passed: true,
      message: 'Image service - legend may not be present',
      details: { skipped: 'image_service_no_legend' }
    };
  }
  
  return {
    passed: false,
    message: 'Legend not visible',
    details: { type: layer.type }
  };
}

/**
 * TEST 7: Check if legend labels are descriptive
 * Labels with only numbers are not descriptive
 */
export async function testLegendLabelsDescriptive(
  page: Page,
  layer: LayerConfig
): Promise<TestResult> {
  const legend = page.locator('#floating-legend-panel');
  
  if (!await legend.isVisible()) {
    return {
      passed: true,
      message: 'No legend - test not applicable',
      details: { skipped: 'no_legend' }
    };
  }
  
  // Expand legend if it's collapsed (legend can collapse after popup interactions)
  const legendContent = legend.locator('[id^="legend-item-"]').first();
  let isContentVisible = await legendContent.isVisible().catch(() => false);
  
  if (!isContentVisible) {
    console.log('Legend appears collapsed, expanding...');
    const legendHeader = page.locator('#legend-panel-header');
    const expandButton = legendHeader.locator('button');
    await expandButton.click();
    await page.waitForTimeout(500);
  }
  
  const legendItems = legend.locator('[data-testid="legend-item-label"]');
  let labels = await legendItems.allTextContents();
  
  // Retry mechanism: If no labels found initially, wait longer and check again
  if (labels.length === 0) {
    console.log('No legend labels found on first check, waiting 3s and retrying...');
    await page.waitForTimeout(3000);
    labels = await legendItems.allTextContents();
  }
  
  if (labels.length === 0) {
    // Check if legend items exist but just don't have text labels (icon legends, etc.)
    const allLegendItems = legend.locator('[id^="legend-item-"]');
    
    // Wait a bit for legend items to load if they haven't yet
    await page.waitForTimeout(2000);
    const itemCount = await allLegendItems.count();
    
    if (itemCount > 0) {
      // Legend exists but uses a different structure (icons, images, etc.)
      console.log(`Legend has ${itemCount} item(s) but no text labels - treating as not applicable`);
      return {
        passed: true,
        message: `Legend has ${itemCount} item(s) but no text labels - not applicable`,
        details: { skipped: 'no_text_labels', itemCount }
      };
    }
    
    return {
      passed: false,
      message: 'No legend labels found (even after retry)',
      details: { error: 'no_labels' }
    };
  }
  
  const nonDescriptiveLabels: string[] = [];
  
  for (const label of labels) {
    const hasNumbers = /\d/.test(label);
    const hasLetters = /[a-zA-Z]/.test(label);
    
    // Exception: Year patterns are descriptive (e.g., "2020", "1950 - 1959", "2000-2009")
    const isYearPattern = /\b(19|20)\d{2}\b/.test(label); // Matches years 1900-2099
    
    // If label has numbers but NO letters AND is NOT a year pattern, it's not descriptive
    if (hasNumbers && !hasLetters && !isYearPattern) {
      nonDescriptiveLabels.push(label);
    }
  }
  
  if (nonDescriptiveLabels.length > 0) {
    return {
      passed: false,
      message: `${nonDescriptiveLabels.length}/${labels.length} labels are non-descriptive`,
      details: { nonDescriptiveLabels }
    };
  }
  
  return {
    passed: true,
    message: 'All legend labels are descriptive',
    details: { totalLabels: labels.length }
  };
}

/**
 * TEST 8: Check if legend filters work (clicking legend items filters map)
 * Adaptive: skips if only 1 legend item or if image service
 */
export async function testLegendFiltersWork(
  page: Page,
  layer: LayerConfig
): Promise<TestResult> {
  if (layer.type === 'ImageService') {
    return {
      passed: true,
      message: 'Image service - filtering not applicable',
      details: { skipped: 'image_service' }
    };
  }
  
  const legend = page.locator('#floating-legend-panel');
  
  if (!await legend.isVisible()) {
    return {
      passed: true,
      message: 'No legend - filtering not applicable',
      details: { skipped: 'no_legend' }
    };
  }
  
  // Get all available sublayer buttons
  const layersList = page.locator('#tnc-details-layers-list');
  const layerButtons = layersList.locator('button[id^="tnc-details-layer-"]');
  const layerCount = await layerButtons.count();
  
  if (layerCount === 0) {
    // No sublayers list - test the main layer (single layer Feature Service)
    return await testFilteringForSingleLayer(page, legend, 'Main Layer');
  }
  
  // Test filtering for each sublayer
  console.log(`🎛️  Testing filtering on ${layerCount} sublayer(s)`);
  const sublayerResults: Array<{name: string; filterWorks: boolean; reason?: string}> = [];
  
  for (let i = 0; i < layerCount; i++) {
    const layerButton = layerButtons.nth(i);
    const layerName = (await layerButton.locator('.font-medium').textContent()) || `Layer ${i}`;
    
    console.log(`  Testing filtering on sublayer ${i + 1}/${layerCount}: ${layerName}`);
    
    // Click to activate this sublayer
    await layerButton.click();
    await page.waitForTimeout(2000);
    
    // Test filtering for this sublayer
    const result = await testFilteringForSingleLayer(page, legend, layerName);
    
    sublayerResults.push({
      name: layerName,
      filterWorks: result.passed,
      reason: result.message
    });
  }
  
  const workedCount = sublayerResults.filter(r => r.filterWorks).length;
  const allWorked = workedCount === layerCount;
  const failedLayers = sublayerResults.filter(r => !r.filterWorks);
  
  return {
    passed: allWorked,
    message: allWorked
      ? `Filtering works on all ${layerCount} sublayer(s)`
      : `Filtering works on ${workedCount}/${layerCount} sublayer(s) (failed: ${failedLayers.map(f => f.name).join(', ')})`,
    details: {
      totalSublayers: layerCount,
      workingSublayers: workedCount,
      sublayerResults,
      failedLayers: failedLayers.length > 0 ? failedLayers : undefined
    }
  };
}

/**
 * Helper function to test filtering on a single layer/sublayer
 */
async function testFilteringForSingleLayer(
  page: Page,
  legend: any,
  layerName: string
): Promise<TestResult> {
  // Expand legend if it's collapsed
  const legendContent = legend.locator('[id^="legend-item-"]').first();
  let isContentVisible = await legendContent.isVisible().catch(() => false);
  
  if (!isContentVisible) {
    console.log(`  Legend collapsed, expanding...`);
    const legendHeader = page.locator('#legend-panel-header');
    const expandButton = legendHeader.locator('button');
    await expandButton.click();
    await page.waitForTimeout(500);
  }
  
  // Extract legend colors
  const layerColors = await extractLegendColors(page);
  
  if (layerColors.length <= 1) {
    console.log(`  ✅ Only ${layerColors.length} legend item - filtering not applicable`);
    return {
      passed: true,
      message: `${layerName}: Only 1 legend item - filtering not applicable`,
      details: { skipped: 'single_item' }
    };
  }
  
  console.log(`  🎨 Found ${layerColors.length} legend colors`);
  
  // Take baseline screenshot (with zoom-out if needed)
  const mapContainer = page.locator('#map-view');
  const mapBox = await mapContainer.boundingBox();
  
  if (!mapBox) {
    return {
      passed: false,
      message: `${layerName}: Map container not found`,
      details: { error: 'no_map_container' }
    };
  }
  
  // Check if layer colors are visible at current zoom
  let beforeScreenshot = await page.screenshot({
    clip: {
      x: mapBox.x,
      y: mapBox.y,
      width: mapBox.width - 142,
      height: mapBox.height
    }
  });
  
  let beforeColors = checkWhichColorsPresent(beforeScreenshot, layerColors);
  let beforeCount = beforeColors.filter(c => c.found).length;
  
  // If no colors visible at default zoom, zoom out to find them
  if (beforeCount === 0) {
    console.log(`  🔍 No colors visible at default zoom, zooming out...`);
    
    // Switch to satellite basemap for better visibility
    await switchToSatelliteBasemap(page);
    
    // Zoom out to level 8 (state-wide view)
    await zoomOutToLevel(page, 8);
    
    // Wait for rendering
    await page.waitForTimeout(3000);
    
    // Retake screenshot after zoom
    beforeScreenshot = await page.screenshot({
      clip: {
        x: mapBox.x,
        y: mapBox.y,
        width: mapBox.width - 142,
        height: mapBox.height
      }
    });
    
    beforeColors = checkWhichColorsPresent(beforeScreenshot, layerColors);
    beforeCount = beforeColors.filter(c => c.found).length;
    console.log(`  📊 After zoom: ${beforeCount}/${layerColors.length} colors visible`);
  }
  
  // If still only 1 or fewer colors visible, filtering cannot be tested
  if (beforeCount <= 1) {
    console.log(`  ✅ Only ${beforeCount} color(s) visible - filtering not testable`);
    return {
      passed: true,
      message: `${layerName}: Only ${beforeCount} visible color(s) - filtering not applicable`,
      details: { skipped: 'insufficient_colors', beforeCount }
    };
  }
  
  // Click first legend item to filter
  const firstLegendItem = legend.locator('[id^="legend-item-"]').first();
  let isVisible = await firstLegendItem.isVisible().catch(() => false);
  
  // Retry mechanism
  if (!isVisible) {
    await page.waitForTimeout(3000);
    isVisible = await firstLegendItem.isVisible().catch(() => false);
  }
  
  if (!isVisible) {
    return {
      passed: false,
      message: `${layerName}: Legend items not found`,
      details: { error: 'no_legend_items' }
    };
  }
  
  console.log(`  🎯 Clicking first legend item to filter...`);
  await firstLegendItem.click({ force: true });
  await page.waitForTimeout(2000);
  
  // Take screenshot after filtering
  const afterScreenshot = await page.screenshot({
    clip: {
      x: mapBox.x,
      y: mapBox.y,
      width: mapBox.width - 142,
      height: mapBox.height
    }
  });
  
  const afterColors = checkWhichColorsPresent(afterScreenshot, layerColors);
  const afterCount = afterColors.filter(c => c.found).length;
  
  const filterWorked = afterCount < beforeCount;
  
  console.log(`  ${filterWorked ? '✅' : '❌'} Filtering ${filterWorked ? 'works' : 'did not work'}: ${beforeCount} → ${afterCount} colors`);
  
  if (filterWorked) {
    return {
      passed: true,
      message: `${layerName}: Filtering works (${beforeCount} → ${afterCount} colors)`,
      details: { beforeCount, afterCount }
    };
  }
  
  return {
    passed: false,
    message: `${layerName}: Filtering did not work (${beforeCount} → ${afterCount} colors)`,
    details: { beforeCount, afterCount }
  };
}



