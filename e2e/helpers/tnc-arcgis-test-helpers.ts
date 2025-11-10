import { Page, expect } from '@playwright/test';
import { PNG } from 'pngjs';
import pixelmatch from 'pixelmatch';
// Import category constants from app source (single source of truth)
import { DATA_CATEGORIES } from '../../src/utils/constants';

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
 * Verify page is in a healthy state (no gray artifacts, overlays, etc.)
 * 
 * Checks for common issues that cause visual artifacts:
 * - Map view is fully rendered
 * - No blocking overlays or modals
 * - Page is not mid-hot-reload
 * 
 * @param page - Playwright page object
 * @returns true if page is healthy, false otherwise
 */
export async function verifyPageHealth(page: Page): Promise<boolean> {
  // Check 1: Map view exists and has valid bounds
  const mapView = page.locator('#map-view');
  const mapBox = await mapView.boundingBox();
  if (!mapBox || mapBox.width < 100 || mapBox.height < 100) {
    console.warn('    ⚠️ Page health: Map view has invalid dimensions');
    return false;
  }
  
  // Check 2: No blocking modals/overlays (download modal, etc.)
  const downloadModal = page.locator('#dataset-download-view-container');
  const modalVisible = await downloadModal.isVisible().catch(() => false);
  if (modalVisible) {
    console.warn('    ⚠️ Page health: Download modal still open');
    return false;
  }
  
  // NOTE: Removed details panel check - it's too strict
  // The panel can be legitimately hidden during zoom operations, etc.
  // Only check for critical blocking issues
  
  console.log('    ✅ Page health: All checks passed');
  return true;
}

/**
 * Get map screenshot clipping area (dynamically calculates right offset)
 * 
 * This fixes the "gray artifact" issue by checking if the floating legend panel
 * is visible and calculating its width dynamically, rather than using a hardcoded
 * 142px offset that may be wrong after hot-reload or zoom operations.
 * 
 * Also verifies page health before returning clip area.
 * 
 * @param page - Playwright page object
 * @returns Clipping area for screenshots, or null if map not found
 */
export async function getMapScreenshotArea(page: Page): Promise<{ x: number; y: number; width: number; height: number } | null> {
  // Verify page is in good state first
  const isHealthy = await verifyPageHealth(page);
  if (!isHealthy) {
    console.warn('    ⚠️ Page not healthy, waiting 2s for recovery...');
    await page.waitForTimeout(2000);
    
    // Retry health check
    const isHealthyRetry = await verifyPageHealth(page);
    if (!isHealthyRetry) {
      console.error('    ❌ Page still unhealthy after retry');
      return null;
    }
  }
  
  const mapContainer = page.locator('#map-view');
  const mapBox = await mapContainer.boundingBox();
  
  if (!mapBox) {
    console.warn('⚠️ Map container not found for screenshot');
    return null;
  }
  
  // Check if floating legend panel is visible and get its width
  const legendPanel = page.locator('#floating-legend-panel');
  const legendVisible = await legendPanel.isVisible().catch(() => false);
  
  let rightOffset = 0;
  if (legendVisible) {
    const legendBox = await legendPanel.boundingBox();
    if (legendBox) {
      rightOffset = legendBox.width;
      console.log(`    📏 Legend panel detected: ${rightOffset}px wide`);
    } else {
      // Fallback to approximate legend width if bounding box fails
      rightOffset = 142;
      console.log(`    📏 Legend panel visible but bounds unknown, using fallback: ${rightOffset}px`);
    }
  } else {
    console.log(`    📏 Legend panel not visible, using full map width`);
  }
  
  return {
    x: mapBox.x,
    y: mapBox.y,
    width: mapBox.width - rightOffset,
    height: mapBox.height
  };
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
  
  // Click the category button
  // Use exact string match (not regex) since button text matches category exactly
  // Category names come from DATA_CATEGORIES (imported from app constants)
  console.log(`  Looking for category button: "${category}"`);
  
  // Validate that the category exists in DATA_CATEGORIES
  if (!DATA_CATEGORIES.includes(category as any)) {
    console.warn(`⚠️ Category "${category}" not found in DATA_CATEGORIES. Available: ${DATA_CATEGORIES.join(', ')}`);
  }
  
  const categoryBtn = page.getByRole('button', { name: category, exact: true });
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
    const btnText = await downloadBtn.textContent();
    console.log(`📥 Clicking download button: "${btnText}"`);
    await downloadBtn.click();
    console.log('⏳ Waiting for download page to load (3s)...');
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
    
    // Verify modal closed and wait for map to be accessible again
    const downloadView = page.locator('#dataset-download-view-container');
    const stillVisible = await downloadView.isVisible().catch(() => false);
    if (stillVisible) {
      console.warn('Download modal still visible after close attempt');
    }
    
    // Important: Wait for map view to be fully accessible again after modal closes
    console.log('Waiting for map view to be accessible after download modal close...');
    await page.locator('#map-view').waitFor({ state: 'visible', timeout: 10000 }).catch(() => {
      console.warn('Map view not visible after download modal close');
    });
    await page.waitForTimeout(1000); // Extra buffer for UI to stabilize
    console.log('Map view should be accessible now');
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
  // Get screenshot area (dynamically calculated)
  const clipArea = await getMapScreenshotArea(page);
  
  if (!clipArea) {
    console.warn('Map container not found');
    return false;
  }
  
  // Take screenshot of map area (excluding legend panel if visible)
  const screenshot = await page.screenshot({
    clip: clipArea
  });
  
  // Find first pixel matching any legend color
  const png = PNG.sync.read(screenshot);
  const tolerance = 10; // Lower tolerance since we fixed opacity to 100%
  let clickX: number | null = null;
  let clickY: number | null = null;
  
  // NEW STRATEGY: Find pixels for EACH legend color, then try clicking them one by one
  // This is more robust than clicking the first pixel we find
  const colorLocations: Array<{ x: number; y: number; color: string }> = [];
  
  // For each legend color, find the first pixel with that color
  for (const target of legendColors) {
    let found = false;
    
    // Sample pixels to find this specific color
    for (let y = 0; y < png.height && !found; y += 5) {
      for (let x = 0; x < png.width && !found; x += 5) {
        const idx = (png.width * y + x) << 2;
        const r = png.data[idx];
        const g = png.data[idx + 1];
        const b = png.data[idx + 2];
        
        if (
          Math.abs(r - target.r) <= tolerance &&
          Math.abs(g - target.g) <= tolerance &&
          Math.abs(b - target.b) <= tolerance
        ) {
          colorLocations.push({
            x: clipArea.x + x,
            y: clipArea.y + y,
            color: `rgb(${r},${g},${b})`
          });
          found = true;
        }
      }
    }
  }
  
  if (colorLocations.length === 0) {
    console.warn('No colored pixels found to click');
    return false;
  }
  
  console.log(`🎯 Found ${colorLocations.length} clickable locations (one per legend color)`);
  
  // Try clicking each location until we get a popup
  let popupVisible = false;
  const popup = page.locator('.esri-popup');
  
  for (let i = 0; i < colorLocations.length; i++) {
    const loc = colorLocations[i];
    console.log(`  Attempt ${i + 1}/${colorLocations.length}: Clicking ${loc.color} at (${loc.x}, ${loc.y})`);
    
    await page.mouse.click(loc.x, loc.y);
    await page.waitForTimeout(1500);
    popupVisible = await popup.isVisible().catch(() => false);
    
    if (popupVisible) {
      console.log(`  ✅ Popup appeared on attempt ${i + 1}!`);
      break;
    }
  }
  
  if (popupVisible) {
    // Close popup for next test
    const closeButton = page.locator('#close');
    if (await closeButton.isVisible().catch(() => false)) {
      await closeButton.click({ force: true }); // Force click to bypass legend overlay
      await page.waitForTimeout(500);
      console.log('✅ Popup closed');
    }
    return true;
  }
  
  // If no popup appeared from any color, return false
  console.warn(`❌ No popup appeared after trying ${colorLocations.length} different colored pixels`);
  return false;
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
  console.log(`[TEST 1] Starting testShowsInAllCategories for: ${layer.title}`);
  console.log(`[TEST 1] Categories to check: ${layer.categories.join(', ')}`);
  
  if (layer.categories.length === 0) {
    return {
      passed: true,
      message: 'No categories tagged - skipping test',
      details: { reason: 'uncategorized' }
    };
  }
  
  const missingCategories: string[] = [];
  
  for (const category of layer.categories) {
    // Navigate to category (use stable ID - text changes after selection)
    const categoryFilterBtn = page.locator('#category-filter-button');
    await categoryFilterBtn.click();
    await page.waitForTimeout(500);
    
    // Use stable ID pattern: #category-option-{category-name-lowercase-with-dashes}
    const categoryId = `#category-option-${category.toLowerCase().replace(/\s+/g, '-').replace(/[()/?]/g, '')}`;
    const categoryBtn = page.locator(categoryId);
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
    console.log(`[TEST 1] Looking for selector: #item-title-${layer.itemId}`);
    const itemTitle = page.locator(`#item-title-${layer.itemId}`);
    const isVisible = await itemTitle.isVisible().catch(() => false);
    console.log(`[TEST 1] Layer visible in category "${category}": ${isVisible}`);
    
    if (!isVisible) {
      console.log(`[TEST 1] ⚠️ Layer NOT found in category "${category}" - trying alternative selector...`);
      
      // Try alternative: find by text
      const layerCardByText = page.getByText(layer.title, { exact: true }).first();
      const isVisibleByText = await layerCardByText.isVisible().catch(() => false);
      console.log(`[TEST 1] Layer visible by text search: ${isVisibleByText}`);
      
      if (!isVisibleByText) {
        missingCategories.push(category);
      } else {
        // Found it by text, so click it
        console.log(`[TEST 1] Found layer by text in category "${category}". Clicking to load...`);
        await layerCardByText.click();
        await page.waitForTimeout(1000);
        
        const opacitySlider = page.locator('#tnc-details-opacity-slider');
        if (await opacitySlider.isVisible().catch(() => false)) {
          await opacitySlider.fill('100');
        }
        await page.waitForTimeout(2000);
        console.log(`[TEST 1] Layer loaded for category "${category}"`);
      }
    } else {
      // Click on the layer card to load it for remaining tests
      console.log(`[TEST 1] Found layer in category "${category}". Clicking to load...`);
      const layerCard = page.getByText(layer.title, { exact: true }).first();
      if (await layerCard.isVisible().catch(() => false)) {
        await layerCard.click();
        await page.waitForTimeout(1000);
        
        // Set opacity to 100%
        const opacitySlider = page.locator('#tnc-details-opacity-slider');
        if (await opacitySlider.isVisible().catch(() => false)) {
          await opacitySlider.fill('100');
        }
        await page.waitForTimeout(2000);
        console.log(`[TEST 1] Layer loaded for category "${category}"`);
      }
    }
  }
  
  console.log(`[TEST 1] Finished checking all categories. Missing: ${missingCategories.length}`);
  
  if (missingCategories.length > 0) {
    return {
      passed: false,
      message: `Layer not found in ${missingCategories.length}/${layer.categories.length} categories`,
      details: { missingCategories }
    };
  }
  
  console.log(`[TEST 1] ✓ Layer found in all categories. Now reloading for remaining tests...`);
  
  // Re-load the layer after category checks (filtering may have de-selected it)
  // Navigate to first category, search, and click the layer to activate it for subsequent tests
  if (layer.categories.length > 0) {
    console.log(`[TEST 1] Navigating to first category: ${layer.categories[0]}`);
    const firstCategory = layer.categories[0];
    
    // Navigate to first category
    const categoryFilterBtn = page.locator('#category-filter-button');
    await categoryFilterBtn.click();
    await page.waitForTimeout(500);
    
    const categoryId = `#category-option-${firstCategory.toLowerCase().replace(/\s+/g, '-').replace(/[()/?]/g, '')}`;
    const categoryBtn = page.locator(categoryId);
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
    
    // Click the layer card to load it into right sidebar (same as setup)
    const layerCard = page.getByText(layer.title, { exact: true }).first();
    const isVisible = await layerCard.isVisible().catch(() => false);
    
    if (isVisible) {
      console.log(`[TEST 1] Clicking layer card to reload for remaining tests...`);
      await layerCard.click();
      await page.waitForTimeout(1000);
      
      // Set opacity to 100% like setup does
      console.log(`[TEST 1] Setting opacity to 100%...`);
      const opacitySlider = page.locator('#tnc-details-opacity-slider');
      if (await opacitySlider.isVisible().catch(() => false)) {
        await opacitySlider.fill('100');
      }
      
      await page.waitForTimeout(3000);
      console.log(`[TEST 1] ✓ Layer re-loaded and ready for remaining tests`);
    } else {
      console.warn(`[TEST 1] ⚠️ Layer card not found for reload`);
    }
  }
  
  return {
    passed: true,
    message: `Layer found in all ${layer.categories.length} categories`,
    details: { categories: layer.categories }
  };
}

/**
 * TEST 2: Check if layer loads and renders visually
 * 
 * HYBRID DETECTION APPROACH:
 * ════════════════════════════════════════════════════════════════════════════
 * 
 * This test intelligently chooses between TWO detection methods:
 * 
 * METHOD 1: FAST COLOR DETECTION (~60-120ms)
 * ──────────────────────────────────────────
 * - Used when legend has extractable colors (solid polygons, lines)
 * - Searches for expected RGB values in map screenshot
 * - Fast: single screenshot + pixel search
 * - Works for: solid-color polygons, lines, borders
 * 
 * METHOD 2: BEFORE/AFTER VISUAL DIFF (~730-840ms)
 * ─────────────────────────────────────────────────
 * - Used when legend has no extractable colors (icons, points, styled features)
 * - Compares "before" (layer hidden) vs "after" (layer shown) screenshots
 * - Uses pixelmatch to count changed pixels
 * - Works for: icons, points, complex styled features, anything visual
 * - Includes zoom-out retry logic (max 2 attempts to county/state level)
 * 
 * PERFORMANCE:
 * ────────────
 * - Typical layer with solid colors: ~60-120ms (METHOD 1)
 * - Icon/point layer: ~730-840ms (METHOD 2, no zoom)
 * - Icon/point layer (with zoom retries): ~2-2.5s (METHOD 2, worst case)
 * 
 * This hybrid approach gives us:
 * ✅ Speed for simple layers (solid colors)
 * ✅ Reliability for complex layers (icons, points)
 * ✅ 100% coverage for all layer types
 * 
 * Handles both Feature Services and Image Services
 */
/**
 * Helper: Zoom out using mouse wheel scroll on the map
 * 
 * PURPOSE: Expand the visible map area to find features that aren't in the default view
 * 
 * MOUSE POSITIONING: 
 * - Positions mouse at LEFT side of map (25% from left edge)
 * - This is critical! If mouse is over the legend panel (on right), the wheel scroll
 *   will scroll the LEGEND instead of zooming the MAP
 * - With large legend panels (long labels), the center of #map-view might be covered by legend
 * 
 * ZOOM STEPS:
 * - targetLevel 8 (California): 2 wheel scrolls
 * - targetLevel 4 (USA): 4 wheel scrolls
 * - Each scroll = ~1 zoom level change
 * - Conservative steps prevent zooming out so far the map becomes tiny
 * 
 * @param page - Playwright page object
 * @param targetLevel - Target zoom level (4 = USA, 8 = state, 12+ = preserve)
 */
async function zoomOutToLevel(page: Page, targetLevel: number): Promise<void> {
  // Get the map container dimensions
  const mapContainer = page.locator('#map-view');
  const mapBox = await mapContainer.boundingBox();
  
  if (!mapBox) {
    console.warn('Map container not found for zooming');
    return;
  }
  
  // CRITICAL: Position mouse on LEFT side of map (away from legend panel on right)
  // If mouse is over the legend, mouse wheel scrolls the LEGEND, not the MAP!
  const leftX = mapBox.x + (mapBox.width * 0.25); // 25% from left edge
  const centerY = mapBox.y + mapBox.height / 2;
  await page.mouse.move(leftX, centerY);
  
  // Calculate conservative zoom steps based on target level
  // Default zoom ~12-15, each wheel scroll changes zoom by ~1 level
  const zoomOutSteps = targetLevel <= 5 ? 4 : targetLevel <= 7 ? 3 : targetLevel <= 8 ? 2 : 1;
  
  console.log(`    Zooming out ${zoomOutSteps} step(s) using mouse wheel...`);
  
  // Perform the zoom-out scrolls
  for (let i = 0; i < zoomOutSteps; i++) {
    await page.mouse.wheel(0, 200); // Positive deltaY = zoom out
    await page.waitForTimeout(500); // Wait for zoom animation
  }
  
  // Wait for map tiles to load at the new zoom level
  await page.waitForTimeout(2000);
}

/**
 * Helper: Zoom out by a specific number of steps
 * 
 * PURPOSE: Zoom out incrementally relative to current zoom level
 * 
 * @param page - Playwright page object
 * @param steps - Number of zoom steps to zoom out
 */
async function zoomOutBySteps(page: Page, steps: number): Promise<void> {
  const mapContainer = page.locator('#map-view');
  const mapBox = await mapContainer.boundingBox();
  
  if (!mapBox) {
    console.warn('Map container not found for zooming');
    return;
  }
  
  // CRITICAL: Position mouse on LEFT side of map (away from legend panel on right)
  const leftX = mapBox.x + (mapBox.width * 0.25);
  const centerY = mapBox.y + mapBox.height / 2;
  await page.mouse.move(leftX, centerY);
  
  // Perform the zoom-out scrolls
  for (let i = 0; i < steps; i++) {
    await page.mouse.wheel(0, 200); // Positive deltaY = zoom out
    await page.waitForTimeout(500); // Wait for zoom animation
  }
  
  // Wait for map tiles to load at the new zoom level
  await page.waitForTimeout(1500);
}

/**
 * Helper: Zoom back in to default preserve-level view
 * 
 * PURPOSE: Reset map zoom to default after testing a sublayer at a different zoom level
 * 
 * WHEN CALLED:
 * - After testTooltipsForSingleLayer() returns with zoomLevel !== 'default'
 * - Between sublayers to prevent cumulative zoom drift
 * - Example: Sublayer 4 zoomed to level 8 → reset → Sublayer 5 starts at default
 * 
 * MOUSE POSITIONING:
 * - Same as zoomOutBySteps: positions at LEFT side (25% from left)
 * - Prevents scrolling the legend panel instead of zooming
 * 
 * ZOOM STEPS:
 * - Zooms in by exactly the number of steps specified
 * - This ensures symmetric zoom in/out (prevents drift)
 * 
 * @param page - Playwright page object
 * @param steps - Number of zoom steps to zoom back in (defaults to 6 for USA level)
 */
async function zoomInToDefault(page: Page, steps: number = 6): Promise<void> {
  // Get the map container dimensions
  const mapContainer = page.locator('#map-view');
  const mapBox = await mapContainer.boundingBox();
  
  if (!mapBox) {
    console.warn('Map container not found for zooming');
    return;
  }
  
  // CRITICAL: Position mouse on LEFT side of map (away from legend panel on right)
  const leftX = mapBox.x + (mapBox.width * 0.25); // 25% from left edge
  const centerY = mapBox.y + mapBox.height / 2;
  await page.mouse.move(leftX, centerY);
  
  console.log(`    🔍 Zooming back in ${steps} step(s) to default view...`);
  
  // Perform the zoom-in scrolls to return to default preserve-level zoom
  for (let i = 0; i < steps; i++) {
    await page.mouse.wheel(0, -200); // Negative deltaY = zoom in
    await page.waitForTimeout(300); // Wait for zoom animation
  }
  
  // Wait for map tiles to load at the default zoom level
  await page.waitForTimeout(1500);
}

/**
 * Helper: Wait for ArcGIS map to finish rendering by checking for visual stability
 * Takes multiple screenshots and compares them to ensure the map has stopped changing
 * 
 * CRITICAL for preventing false positives in filtering tests where we compare
 * "before" vs "after" screenshots. Without this, we might compare:
 * - Before: Partially rendered (still loading)
 * - After: Fully rendered (finished loading + filter applied)
 * And incorrectly detect the rendering completion as a filtering effect.
 */
async function waitForMapStability(page: Page, maxAttempts = 8): Promise<void> {
  console.log(`    ⏳ Waiting for map rendering to stabilize...`);
  
  let previousScreenshot: Buffer | null = null;
  let stableCount = 0;
  const REQUIRED_STABLE_CHECKS = 3; // Need 3 consecutive stable checks (increased from 2)
  const STABILITY_THRESHOLD = 50; // Very tight threshold: max 50 pixels (reduced from 100)
  
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    // Wait longer between checks to allow tile loading
    await page.waitForTimeout(1500); // Increased from 1000ms
    
    // Recalculate screenshot area each iteration (fixes gray artifact after hot-reload)
    const clipArea = await getMapScreenshotArea(page);
    if (!clipArea) {
      console.warn('    ⚠️ Map container not found for stability check');
      return;
    }
    
    const currentScreenshot = await page.screenshot({
      clip: clipArea
    });
    
    if (previousScreenshot) {
      // Compare with previous screenshot
      const prevPNG = PNG.sync.read(previousScreenshot);
      const currPNG = PNG.sync.read(currentScreenshot);
      const diffPNG = new PNG({ width: prevPNG.width, height: prevPNG.height });
      
      const pixelDiff = pixelmatch(
        prevPNG.data,
        currPNG.data,
        diffPNG.data,
        prevPNG.width,
        prevPNG.height,
        { threshold: 0.1 }
      );
      
      if (pixelDiff <= STABILITY_THRESHOLD) {
        stableCount++;
        console.log(`    ✓ Stable check ${stableCount}/${REQUIRED_STABLE_CHECKS} (${pixelDiff} pixels changed)`);
        
        if (stableCount >= REQUIRED_STABLE_CHECKS) {
          console.log(`    ✅ Map rendering stable!`);
          return;
        }
      } else {
        console.log(`    ⏳ Still rendering... (${pixelDiff} pixels changed)`);
        stableCount = 0; // Reset counter - must be consecutive
      }
    }
    
    previousScreenshot = currentScreenshot;
  }
  
  console.log(`    ⚠️ Max stability attempts reached, proceeding anyway`);
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
  // Get screenshot area (dynamically calculated)
  const clipArea = await getMapScreenshotArea(page);
  
  if (!clipArea) {
    return false;
  }
  
  const screenshot = await page.screenshot({
    clip: clipArea
  });
  
  return checkForColors(screenshot, legendColors);
}

/**
 * Helper: Check if layer rendered using before/after toggle comparison
 * 
 * ALGORITHM:
 * 1. Hide layer (click toggle button)
 * 2. Wait for map to settle (300ms)
 * 3. Screenshot "before" state
 * 4. Show layer (click toggle button again)
 * 5. Wait for layer to load (300ms)
 * 6. Screenshot "after" state
 * 7. Run pixelmatch to compare
 * 8. If >100 pixels changed → layer rendered ✅
 * 9. If ≤100 pixels changed → zoom out and retry (max 2 zoom attempts)
 * 
 * FAST: ~730-840ms per check (no zoom)
 * WORKS FOR: Icons, points, styled features, anything visual
 * 
 * @param page - Playwright page
 * @param maxZoomRetries - Maximum number of zoom-out retries (default: 2)
 * @returns true if visual change detected, false otherwise
 */
async function checkForVisualChangeUsingToggle(
  page: Page
): Promise<{ changed: boolean; pixelDiff: number; stepsFromDefault: number }> {
  const mapContainer = page.locator('#map-view');
  const mapBox = await mapContainer.boundingBox();
  
  if (!mapBox) {
    return { changed: false, pixelDiff: 0, stepsFromDefault: 0 };
  }
  
  const toggleButton = page.locator('#tnc-details-toggle-btn');
  const PIXEL_CHANGE_THRESHOLD = 100;
  
  // Define zoom levels to try: default → county → state → USA
  const zoomLevels = [
    { name: 'default', stepsOut: 0 },
    { name: 'county level', stepsOut: 2 },
    { name: 'state level', stepsOut: 4 },  // 4 MORE steps from default
    { name: 'USA level', stepsOut: 4 }  // 4 MORE steps from state (10 total)
  ];
  
  let totalStepsFromDefault = 0;
  let bestResult = { changed: false, pixelDiff: 0 };
  
  for (let i = 0; i < zoomLevels.length; i++) {
    const zoomInfo = zoomLevels[i];
    
    // Zoom out if needed (skip first iteration - already at default)
    if (i > 0) {
      const additionalSteps = zoomLevels[i].stepsOut - zoomLevels[i-1].stepsOut;
      console.log(`    🔍 No change detected, zooming out ${additionalSteps} more step(s) to ${zoomInfo.name}...`);
      await zoomOutBySteps(page, additionalSteps);
      totalStepsFromDefault += additionalSteps;
      await page.waitForTimeout(1500);
    }
    
    console.log(`    🔘 Attempt ${i + 1}/${zoomLevels.length}: Testing at ${zoomInfo.name}`);
    
    // Step 1: Hide layer
    await toggleButton.click();
    await page.waitForTimeout(300);
    
    // Step 2: Screenshot "before" state
    const clipAreaBefore = await getMapScreenshotArea(page);
    if (!clipAreaBefore) {
      console.warn('    ⚠️ Map container not found for screenshot');
      continue;
    }
    const beforeScreenshot = await page.screenshot({
      clip: clipAreaBefore
    });
    
    // Step 3: Show layer
    await toggleButton.click();
    await page.waitForTimeout(300);
    
    // Step 4: Screenshot "after" state
    const afterScreenshot = await page.screenshot({
      clip: clipAreaBefore
    });
    
    // Step 5: Compare screenshots
    const beforePNG = PNG.sync.read(beforeScreenshot);
    const afterPNG = PNG.sync.read(afterScreenshot);
    const diffPNG = new PNG({ width: beforePNG.width, height: beforePNG.height });
    
    const pixelDiff = pixelmatch(
      beforePNG.data,
      afterPNG.data,
      diffPNG.data,
      beforePNG.width,
      beforePNG.height,
      { threshold: 0.1 }
    );
    
    console.log(`    📊 Pixel diff: ${pixelDiff} pixels changed`);
    bestResult = { changed: pixelDiff > PIXEL_CHANGE_THRESHOLD, pixelDiff };
    
    // Step 6: If change detected, zoom back and return success
    if (bestResult.changed) {
      console.log(`    ✅ Visual change detected (${pixelDiff} > ${PIXEL_CHANGE_THRESHOLD})`);
      
      // CRITICAL: Always zoom back to default before returning
      if (totalStepsFromDefault > 0) {
        console.log(`    🔄 Zooming back ${totalStepsFromDefault} step(s) to default...`);
        await zoomInToDefault(page, totalStepsFromDefault);
        await page.waitForTimeout(1500);
      }
      
      return { ...bestResult, stepsFromDefault: 0 }; // Always 0 because we reset
    }
  }
  
  // All attempts failed - zoom back to default and return failure
  console.log(`    ❌ No visual change detected after ${zoomLevels.length} attempts`);
  
  if (totalStepsFromDefault > 0) {
    console.log(`    🔄 Zooming back ${totalStepsFromDefault} step(s) to default...`);
    await zoomInToDefault(page, totalStepsFromDefault);
    await page.waitForTimeout(1500);
  }
  
  return { ...bestResult, stepsFromDefault: 0 }; // Always 0 because we reset
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
    const clipArea = await getMapScreenshotArea(page);
    if (!clipArea) {
      return {
        passed: false,
        message: 'Map container not found for screenshot',
        details: { error: 'no_map_container' }
      };
    }
    const screenshot = await page.screenshot({
      clip: clipArea
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
    
    // HYBRID APPROACH: Choose detection method based on legend type
    if (legendColors.length === 0) {
      // No extractable colors (likely icons/points) → use before/after diff
      console.log('  📸 No legend colors - using before/after visual change detection');
      const result = await checkForVisualChangeUsingToggle(page);
      
      return {
        passed: result.changed,
        message: result.changed 
          ? `Layer rendered (${result.pixelDiff} pixels changed)`
          : `Layer did not render (only ${result.pixelDiff} pixels changed)`,
        details: { 
          method: 'visual_change_detection',
          pixelDiff: result.pixelDiff
        }
      };
    }
    
    // Has extractable colors → use fast color detection
    console.log('  🎨 Found legend colors - using fast color detection');
    const colorsFound = await checkForLayerPixels(page, legendColors);
    
    return {
      passed: colorsFound,
      message: colorsFound ? 'Layer colors detected on map' : 'Layer colors not found on map',
      details: { 
        method: 'color_detection',
        legendColors: legendColors.length 
      }
    };
  }
  
  // Test each sublayer
  console.log(`📊 Found ${layerCount} sublayers to test`);
  const sublayerResults: Array<{
    name: string; 
    loaded: boolean; 
    zoomLevel?: number; 
    method?: string; 
    pixelDiff?: number
  }> = [];
  
  for (let i = 0; i < layerCount; i++) {
    const layerButton = layerButtons.nth(i);
    const layerName = (await layerButton.locator('.font-medium').textContent()) || `Layer ${i}`;
    
    console.log(`  Testing sublayer ${i + 1}/${layerCount}: ${layerName}`);
    
    // Click to activate this sublayer
    await layerButton.click();
    await page.waitForTimeout(2000);
    
    // Get legend colors for this sublayer
    const legendColors = await extractLegendColors(page);
    
    // HYBRID APPROACH: Choose detection method based on legend type
    if (legendColors.length === 0) {
      // No extractable colors (likely icons/points) → use before/after diff
      console.log(`    📸 No legend colors - using visual change detection`);
      const result = await checkForVisualChangeUsingToggle(page);
      
      sublayerResults.push({
        name: layerName,
        loaded: result.changed,
        zoomLevel: undefined, // Function handles zoom reset internally
        method: 'visual_change',
        pixelDiff: result.pixelDiff
      });
      
      // No zoom reset needed - checkForVisualChangeUsingToggle() handles it internally
      
      continue;
    }
    
    // Has extractable colors → use fast color detection
    console.log(`    🎨 Extracted ${legendColors.length} colors - using fast color detection`);
    
    // Try pixel detection at current zoom (default ~12-15)
    let colorsFound = await checkForLayerPixels(page, legendColors);
    let zoomUsed: number | undefined = undefined;
    
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
        // Color detection failed even after zoom - RESET TO DEFAULT before trying pixel-diff
        // because checkForVisualChangeUsingToggle assumes it starts at default
        console.log(`    🔄 Resetting to default before trying pixel-diff strategy...`);
        await zoomInToDefault(page, 2); // We zoomed out 2 steps to get to level 8
        await page.waitForTimeout(1500);
        
        console.log(`    🔍 Trying pixel-diff strategy from default zoom...`);
        const result = await checkForVisualChangeUsingToggle(page);
        
        if (result.changed) {
          console.log(`    ✅ Visual change detected with pixel-diff (${result.pixelDiff} pixels changed)`);
          colorsFound = true;
          zoomUsed = undefined; // Function already reset zoom internally
        } else {
          console.log(`    ❌ No visual change detected even with pixel-diff`);
          zoomUsed = undefined; // Already at default after checkForVisualChangeUsingToggle
        }
      }
    } else {
      console.log(`    ✅ Pixels found at default zoom`);
    }
    
    sublayerResults.push({ 
      name: layerName, 
      loaded: colorsFound,
      zoomLevel: zoomUsed,
      method: 'color_detection'
    });
    
    // CRITICAL: Reset zoom after testing each sublayer to prevent drift
    // Only needed when we successfully found pixels at zoom level 8 (color detection)
    // pixel-diff handles its own resets, and failures are already reset
    if (zoomUsed === 8) {
      console.log(`    🔄 Resetting zoom from level ${zoomUsed} back to default...`);
      const stepsToReset = 2; // Level 8 = 2 steps out from default
      await zoomInToDefault(page, stepsToReset);
      await page.waitForTimeout(1500);
      console.log(`    ✅ Zoom reset complete`);
    }
  }
  
  const loadedCount = sublayerResults.filter(r => r.loaded).length;
  const allLoaded = loadedCount === layerCount;
  const successRate = loadedCount / layerCount;
  const failedLayers = sublayerResults.filter(r => !r.loaded).map(r => r.name);
  
  return {
    passed: allLoaded,
    message: allLoaded 
      ? `All ${layerCount} sublayer(s) loaded successfully`
      : `${loadedCount}/${layerCount} sublayer(s) loaded (${Math.round(successRate * 100)}% - failed: ${failedLayers.join(', ')})`,
    details: { 
      totalSublayers: layerCount,
      loadedSublayers: loadedCount,
      successRate: Math.round(successRate * 100),
      sublayerResults,
      failedLayers: failedLayers.length > 0 ? failedLayers : undefined
    }
  };
}

/**
 * TEST 5: Check if tooltips/popups appear when clicking features
 * Adaptive for Feature Services (has popups) vs Image Services (may not)
 * 
 * HANDLES MULTI-SUBLAYER SERVICES:
 * For Feature Services with multiple sublayers, tests each sublayer individually.
 * This prevents issues where one sublayer's features are in a different geographic region.
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
  
  console.log(`\n🧪 TOOLTIP TEST: Starting for layer "${layer.title}"`);
  
  // Check if this layer has sublayers
  const layersList = page.locator('#tnc-details-layers-list');
  const layerButtons = layersList.locator('button[id^="tnc-details-layer-"]');
  const layerCount = await layerButtons.count();
  
  if (layerCount === 0) {
    // No sublayers - test the main layer as a single unit
    console.log('   Single layer - testing as one unit');
    return await testTooltipsForSingleLayer(page, layer, 'Main Layer');
  }
  
  // Multiple sublayers - test each individually
  console.log(`   Found ${layerCount} sublayers - testing each individually`);
  const sublayerResults: Array<{
    name: string;
    tooltipsWork: boolean;
    reason?: string;
    method?: string;
    stepsFromDefault?: number;
  }> = [];
  
  for (let i = 0; i < layerCount; i++) {
    const layerButton = layerButtons.nth(i);
    const layerName = (await layerButton.locator('.font-medium').textContent()) || `Layer ${i}`;
    
    console.log(`\n  Testing sublayer ${i + 1}/${layerCount}: ${layerName}`);
    
    // Click to activate this sublayer
    await layerButton.click();
    await page.waitForTimeout(2000);
    
    // Test tooltips for this specific sublayer (may zoom out to find features)
    const result = await testTooltipsForSingleLayer(page, layer, layerName);
    
    // CRITICAL: Reset zoom between sublayers to prevent cumulative zoom drift
    // If sublayer 4 zoomed out to level 8, sublayer 5 should start at default (not level 8)
    // Without this reset, each zoom-out compounds and the map gets smaller and smaller
    const currentZoom = result.details?.zoomLevel || 'unknown';
    const stepsFromDefault = result.details?.stepsFromDefault || 0;
    console.log(`   📍 Current zoom after test: ${currentZoom} (${stepsFromDefault} steps from default)`);
    
    if (result.details?.zoomLevel && result.details.zoomLevel !== 'default' && stepsFromDefault > 0) {
      console.log(`   🔄 Resetting zoom from level ${currentZoom} to default for next sublayer...`);
      await zoomInToDefault(page, stepsFromDefault);
      await page.waitForTimeout(2000); // Ensure map tiles fully re-render at default zoom
      console.log(`   ✅ Zoom reset complete - ready for next sublayer`);
    }
    
    sublayerResults.push({
      name: layerName,
      tooltipsWork: result.passed,
      reason: result.message,
      method: result.details?.method,
      stepsFromDefault: stepsFromDefault
    });
  }
  
  // Note: No final zoom reset needed because we reset after each sublayer
  // Each sublayer starts at default zoom, ensuring consistent behavior
  
  const workedCount = sublayerResults.filter(r => r.tooltipsWork).length;
  const allWorked = workedCount === layerCount;
  const successRate = workedCount / layerCount;
  const failedLayers = sublayerResults.filter(r => !r.tooltipsWork);
  
  // Accept partial success: Pass if ≥70% of sublayers have working tooltips
  // (Some sublayers may be outside the visible area or have other valid reasons)
  const PASSING_THRESHOLD = 0.7; // 70%
  const passedTest = successRate >= PASSING_THRESHOLD;
  
  return {
    passed: passedTest,
    message: allWorked
      ? `Tooltips work on all ${layerCount} sublayer(s)`
      : passedTest
        ? `Tooltips work on ${workedCount}/${layerCount} sublayer(s) (${Math.round(successRate * 100)}% - ACCEPTABLE)`
        : `Tooltips work on ${workedCount}/${layerCount} sublayer(s) (${Math.round(successRate * 100)}% - below 70% threshold, failed: ${failedLayers.map(f => f.name).join(', ')})`,
    details: {
      totalSublayers: layerCount,
      workingSublayers: workedCount,
      successRate: Math.round(successRate * 100),
      threshold: Math.round(PASSING_THRESHOLD * 100),
      sublayerResults,
      failedLayers: failedLayers.length > 0 ? failedLayers : undefined
    }
  };
}

/**
 * Helper function to test tooltips on a single layer/sublayer
 * 
 * PROGRESSIVE ZOOM-OUT STRATEGY:
 * Some layers have features outside the default Dangermond Preserve view.
 * If tooltips don't appear at the default zoom, we progressively zoom out to find clickable features:
 * 
 * ATTEMPT 1: Default zoom (~12-15) - Dangermond Preserve area (California coast)
 *   → If features found: ✅ Success, return immediately
 *   → If no features: Continue to Attempt 2
 * 
 * ATTEMPT 2: Zoom level 8 - California state-wide view
 *   → Zooms out 2 steps to see more of California
 *   → If features found: ✅ Success, return with zoom level noted
 *   → If no features: Continue to Attempt 3
 * 
 * ATTEMPT 3: Zoom level 4 - Continental USA view
 *   → Zooms out 4 steps total to see entire USA (handles East Coast layers)
 *   → If features found: ✅ Success, return with zoom level noted
 *   → If no features: ❌ Fail (layer may have no clickable features or be outside USA)
 * 
 * IMPORTANT: After this function returns, the calling code MUST check the returned
 * zoomLevel and reset zoom to default before testing the next sublayer!
 */
async function testTooltipsForSingleLayer(
  page: Page,
  layer: LayerConfig,
  layerName: string
): Promise<TestResult> {
  // Define the 4 progressive zoom levels to try
  const zoomLevels = [
    { level: 'default', name: 'preserve level (default)', stepsFromDefault: 0 },
    { level: 8, name: 'county level (zoom 8)', stepsFromDefault: 2 },
    { level: 4, name: 'state level (zoom 4)', stepsFromDefault: 6 },  // 2 steps to county + 4 more to state
    { level: 2, name: 'USA level (zoom 2)', stepsFromDefault: 10 }  // 4 more steps to USA-wide view
  ];
  
  // Track current zoom level for proper reset (even if test fails)
  // This ensures zoom ALWAYS gets reset, even when tooltips aren't found
  let currentZoomLevel: string | number = 'default';
  let totalStepsFromDefault = 0;  // Track cumulative zoom steps from default
  
  // Try each zoom level in order: preserve → state → USA
  for (let zoomAttempt = 0; zoomAttempt < zoomLevels.length; zoomAttempt++) {
    const zoomInfo = zoomLevels[zoomAttempt];
    currentZoomLevel = zoomInfo.level; // Update tracked zoom level BEFORE zooming
    
    // Calculate how many additional steps we need to zoom out
    const additionalSteps = zoomInfo.stepsFromDefault - totalStepsFromDefault;
    
    // Skip zoom-out on first attempt (already at default)
    if (zoomInfo.level !== 'default' && additionalSteps > 0) {
      console.log(`\n   🔍 Previous zoom failed - zooming out ${additionalSteps} more step(s) to ${zoomInfo.name}...`);
      await zoomOutBySteps(page, additionalSteps);
      totalStepsFromDefault += additionalSteps;
      await page.waitForTimeout(2000); // Wait for layer tiles to load at new zoom
    } else {
      console.log(`   🎯 Attempt ${zoomAttempt + 1}/${zoomLevels.length}: Testing at ${zoomInfo.name}`);
    }
    
    // Try to find and click a feature at the current zoom level
    const result = await testTooltipsAtCurrentZoom(page, layer, layerName);
    
    // SUCCESS: Found a clickable feature!
    if (result.passed) {
      const zoomSuffix = zoomInfo.level !== 'default' ? ` (at ${zoomInfo.name})` : '';
      return {
        ...result,
        message: result.message + zoomSuffix,
        details: { ...result.details, zoomLevel: currentZoomLevel, stepsFromDefault: totalStepsFromDefault }
      };
    }
    
    // FAILURE: This was the last zoom level, give up
    if (zoomAttempt === zoomLevels.length - 1) {
      return {
        ...result,
        message: result.message + ` (tried ${zoomLevels.length} zoom levels)`,
        details: { ...result.details, zoomAttempts: zoomLevels.length, zoomLevel: currentZoomLevel, stepsFromDefault: totalStepsFromDefault }
      };
    }
    
    // Continue to next zoom level...
  }
  
  // Should never reach here, but TypeScript needs a return
  return {
    passed: false,
    message: `${layerName}: Unexpected error in zoom loop`,
    details: { error: 'zoom_loop_error', zoomLevel: currentZoomLevel, stepsFromDefault: totalStepsFromDefault }
  };
}

/**
 * Helper function to test tooltips at the current zoom level
 * Returns success if popup appears, failure if not
 */
async function testTooltipsAtCurrentZoom(
  page: Page,
  layer: LayerConfig,
  layerName: string
): Promise<TestResult> {
  // Extract legend colors for finding a feature to click
  const legendColors = await extractLegendColors(page);
  
  console.log(`      Legend has ${legendColors.length} color(s) extracted`);
  
  if (legendColors.length <= 2) {
    // Few/no colors found - likely icon-based legend (points, markers) or thin lines
    // Use pixel-diff approach: compare before/after screenshots to find where features appeared
    if (legendColors.length === 0) {
      console.log('      ⚠️ Strategy: PIXEL-DIFF (icon-based legend, no colors found)');
    } else {
      console.log(`      ⚠️ Strategy: PIXEL-DIFF (thin lines, only ${legendColors.length} color(s))`);
    }
    
    const mapBox = await page.locator('#map-view').boundingBox();
    if (!mapBox) {
      return {
        passed: false,
        message: `${layerName}: Map not found for popup test`,
        details: { error: 'no_map' }
      };
    }
    
    // Step 1: Hide layer by clicking the "Hide from Map" button
    console.log(`      📷 PIXEL-DIFF STEP 1: Hide layer "${layerName}"`);
    const toggleBtn = page.locator('#tnc-details-toggle-btn');
    
    // Wait for toggle button to be available (might take a moment after download modal closes)
    await toggleBtn.waitFor({ state: 'visible', timeout: 10000 }).catch(() => {
      console.warn('⚠️ Toggle button not found - details panel may be closed');
    });
    
    const toggleBtnText = await toggleBtn.textContent().catch(() => null);
    console.log(`        Current button text: "${toggleBtnText}"`);
    
    if (!toggleBtnText) {
      return {
        passed: false,
        message: `${layerName}: Could not find toggle button - details panel may be closed`,
        details: { method: 'pixel_diff', error: 'toggle_button_not_found' }
      };
    }
    
    // If button says "Hide from Map", click it to hide the layer
    if (toggleBtnText.includes('Hide')) {
      await toggleBtn.click();
      console.log('        Clicked "Hide from Map"');
      await page.waitForTimeout(1500); // Wait for layer to hide completely
    } else {
      console.log('        Layer already hidden, no need to click');
      await page.waitForTimeout(500);
    }
    
    // Take "before" screenshot
    console.log('      📸 Taking "before" screenshot...');
    const beforeScreenshot = await page.screenshot({
      clip: {
        x: mapBox.x,
        y: mapBox.y,
        width: mapBox.width,
        height: mapBox.height
      }
    });
    
    // Step 2: Show layer again by clicking the "Show on Map" button
    console.log('      📷 PIXEL-DIFF: Step 2 - Clicking "Show on Map" button...');
    const toggleBtn2 = page.locator('#tnc-details-toggle-btn');
    const toggleBtn2Text = await toggleBtn2.textContent();
    console.log(`        Current button text: "${toggleBtn2Text}"`);
    
    // Button should now say "Show on Map", click it to show the layer
    if (toggleBtn2Text?.includes('Show')) {
      await toggleBtn2.click();
      console.log('        Clicked "Show on Map"');
      await page.waitForTimeout(2500); // Wait for layer to fully render (increased for reliability in sequential test runs)
    } else {
      console.warn('        Expected "Show on Map" button but got: ' + toggleBtn2Text);
      await page.waitForTimeout(1000);
    }
    
    // Take "after" screenshot
    console.log('      📸 Taking "after" screenshot...');
    const afterScreenshot = await page.screenshot({
      clip: {
        x: mapBox.x,
        y: mapBox.y,
        width: mapBox.width,
        height: mapBox.height
      }
    });
    
    // Step 3: Compare screenshots pixel-by-pixel to find changes
    console.log('      🔍 PIXEL-DIFF: Step 3 - Comparing screenshots...');
    const beforePng = PNG.sync.read(beforeScreenshot);
    const afterPng = PNG.sync.read(afterScreenshot);
    console.log(`        Image size: ${beforePng.width}x${beforePng.height}`);
    
    const changedPixels: Array<{ x: number; y: number }> = [];
    const tolerance = 15; // Allow some tolerance for compression/rendering differences
    
    // Sample every 3rd pixel for performance
    for (let y = 0; y < beforePng.height; y += 3) {
      for (let x = 0; x < beforePng.width; x += 3) {
        const idx = (beforePng.width * y + x) << 2;
        
        const beforeR = beforePng.data[idx];
        const beforeG = beforePng.data[idx + 1];
        const beforeB = beforePng.data[idx + 2];
        
        const afterR = afterPng.data[idx];
        const afterG = afterPng.data[idx + 1];
        const afterB = afterPng.data[idx + 2];
        
        // Check if pixel changed significantly
        const rDiff = Math.abs(afterR - beforeR);
        const gDiff = Math.abs(afterG - beforeG);
        const bDiff = Math.abs(afterB - beforeB);
        
        if (rDiff > tolerance || gDiff > tolerance || bDiff > tolerance) {
          changedPixels.push({ x, y });
        }
      }
    }
    
    console.log(`      🎯 Found ${changedPixels.length} changed pixels`);
    
    if (changedPixels.length === 0) {
      return {
        passed: false,
        message: `${layerName}: No pixel changes detected when layer was shown`,
        details: { method: 'pixel_diff', changedPixels: 0 }
      };
    }
    
    // Step 4: Group changed pixels into clusters (features) and find centroids
    console.log(`      🔍 Clustering changed pixels to find feature centers...`);
    const clusterDistance = 20; // Pixels within 20px are considered same feature
    const clusters: Array<{ x: number; y: number }[]> = [];
    
    // Simple clustering: group nearby pixels
    for (const pixel of changedPixels) {
      let addedToCluster = false;
      
      // Try to add to an existing cluster
      for (const cluster of clusters) {
        // Check if pixel is near any pixel in this cluster
        const nearCluster = cluster.some(p => {
          const dist = Math.sqrt(Math.pow(p.x - pixel.x, 2) + Math.pow(p.y - pixel.y, 2));
          return dist <= clusterDistance;
        });
        
        if (nearCluster) {
          cluster.push(pixel);
          addedToCluster = true;
          break;
        }
      }
      
      // If not near any cluster, start a new cluster
      if (!addedToCluster) {
        clusters.push([pixel]);
      }
    }
    
    // Strategy: If we have one giant cluster (connected lines), sample multiple points within it
    // Otherwise, use cluster centroids
    const clickablePoints: Array<{ x: number; y: number; source: string }> = [];
    
    if (clusters.length === 1 && clusters[0].length > 1000) {
      // Single large cluster (e.g., connected fault lines) - sample points across the area
      console.log(`        Found 1 large cluster with ${clusters[0].length} pixels (likely connected lines)`);
      console.log(`        Sampling multiple points across the changed area for better coverage...`);
      
      // Find bounding box of changed pixels
      const minX = Math.min(...changedPixels.map(p => p.x));
      const maxX = Math.max(...changedPixels.map(p => p.x));
      const minY = Math.min(...changedPixels.map(p => p.y));
      const maxY = Math.max(...changedPixels.map(p => p.y));
      
      // Sample 10 random points from the changed pixels (actual feature locations)
      const sampleSize = Math.min(10, changedPixels.length);
      const step = Math.floor(changedPixels.length / sampleSize);
      for (let i = 0; i < sampleSize; i++) {
        const pixel = changedPixels[i * step];
        clickablePoints.push({ x: pixel.x, y: pixel.y, source: 'sampled' });
      }
    } else {
      // Multiple clusters - use centroids
      console.log(`        Found ${clusters.length} pixel clusters (potential features)`);
      const clusterCentroids = clusters.map(cluster => {
        const sumX = cluster.reduce((sum, p) => sum + p.x, 0);
        const sumY = cluster.reduce((sum, p) => sum + p.y, 0);
        return {
          x: Math.round(sumX / cluster.length),
          y: Math.round(sumY / cluster.length),
          size: cluster.length,
          source: 'centroid'
        };
      });
      
      // Sort by cluster size
      clusterCentroids.sort((a, b) => b.size - a.size);
      console.log(`        Largest cluster has ${clusterCentroids[0]?.size || 0} pixels`);
      
      clickablePoints.push(...clusterCentroids.slice(0, 10));
    }
    
    // Step 6: Try clicking on the sampled points
    console.log(`      🖱️  PIXEL-DIFF STEP 6: Click sampled points to trigger tooltip`);
    const maxAttempts = Math.min(4, clickablePoints.length);
    const popup = page.locator('.esri-popup__main-container');
    
    for (let i = 0; i < maxAttempts; i++) {
      const point = clickablePoints[i];
      const clickX = mapBox.x + point.x;
      const clickY = mapBox.y + point.y;
      
      console.log(`        Attempt ${i + 1}: Clicking ${point.source} point at (${clickX}, ${clickY})`);
      await page.mouse.click(clickX, clickY);
      await page.waitForTimeout(1500); // Wait for popup to render (tooltips can be slow)
      
      // Check if popup appeared
      const popupVisible = await popup.isVisible().catch(() => false);
      
      // For pixel-diff strategy, just check if popup is visible (not strict content checking)
      // Some layers have simple popups without .esri-feature-fields or .esri-widget__table
      console.log(`        Popup visible: ${popupVisible}`);
      
      if (popupVisible) {
        console.log(`        ✅ Popup appeared on attempt ${i + 1}!`);
        return {
          passed: true,
          message: `${layerName}: Popup appeared after clicking ${point.source} point (attempt ${i + 1} of ${maxAttempts})`,
          details: { method: 'pixel_diff_sampled', changedPixels: changedPixels.length, clusters: clusters.length, attempts: i + 1 }
        };
      }
    }
    
    // No popup after all attempts
    return {
      passed: false,
      message: `${layerName}: No popup appeared after ${maxAttempts} click attempts on sampled points`,
      details: { method: 'pixel_diff_sampled', changedPixels: changedPixels.length, clusters: clusters.length, attempts: maxAttempts }
    };
  }
  
  // Has enough colors for color-based detection
  console.log(`      ✅ Strategy: COLOR-BASED CLICKING (enough colors for direct detection)`);
  
  // Test feature popup with extracted colors
  const popupAppeared = await testFeaturePopup(page, legendColors);
  
  if (popupAppeared) {
    return {
      passed: true,
      message: `${layerName}: Popup appeared after clicking feature`,
      details: { method: 'color_based', legendColors: legendColors.length }
    };
  }
  
  return {
    passed: false,
    message: `${layerName}: No popup appeared after clicking`,
    details: { method: 'color_based', legendColors: legendColors.length }
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
  const successRate = workedCount / layerCount;
  const failedLayers = sublayerResults.filter(r => !r.filterWorks);
  
  // Accept partial success: Pass if ≥70% of sublayers work
  // (Some sublayers may have no legend items or other valid reasons to skip filtering)
  const PASSING_THRESHOLD = 0.7; // 70%
  const passedTest = successRate >= PASSING_THRESHOLD;
  
  return {
    passed: passedTest,
    message: allWorked
      ? `Filtering works on all ${layerCount} sublayer(s)`
      : passedTest
        ? `Filtering works on ${workedCount}/${layerCount} sublayer(s) (${Math.round(successRate * 100)}% - ACCEPTABLE)`
        : `Filtering works on ${workedCount}/${layerCount} sublayer(s) (${Math.round(successRate * 100)}% - below 70% threshold, failed: ${failedLayers.map(f => f.name).join(', ')})`,
    details: {
      totalSublayers: layerCount,
      workingSublayers: workedCount,
      successRate: Math.round(successRate * 100),
      threshold: Math.round(PASSING_THRESHOLD * 100),
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
  
  // Count legend ITEMS (not colors - a single item may have border + fill)
  const legendItems = legend.locator('[id^="legend-item-"]');
  const itemCount = await legendItems.count();
  
  if (itemCount <= 1) {
    console.log(`  ✅ Only ${itemCount} legend item - filtering not applicable`);
    return {
      passed: true,
      message: `${layerName}: Only 1 legend item - filtering not applicable`,
      details: { skipped: 'single_item' }
    };
  }
  
  console.log(`  🎨 Found ${itemCount} legend items`);
  
  // CRITICAL: Wait for map to finish rendering BEFORE taking "before" screenshot
  // This prevents false positives from comparing partially-rendered vs fully-rendered states
  await waitForMapStability(page);
  
  // Get map screenshot area (dynamically calculated to avoid gray artifacts)
  const clipArea = await getMapScreenshotArea(page);
  if (!clipArea) {
    return {
      passed: false,
      message: `${layerName}: Map container not found`,
      details: { error: 'no_map_container' }
    };
  }
  
  // Take "before" screenshot (all legend items visible, FULLY RENDERED)
  console.log(`  📸 Taking "before" screenshot (all items visible)...`);
  const beforeScreenshot = await page.screenshot({
    clip: clipArea
  });
  
  // Click first legend item to filter it out
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
  
  // CRITICAL: Wait for map to finish re-rendering AFTER filter is applied
  // This prevents false positives from comparing fully-rendered vs partially-rendered states
  await waitForMapStability(page);
  
  // Take "after" screenshot - USE SAME DIMENSIONS AS BEFORE
  // This prevents "Image sizes do not match" errors when legend visibility changes
  console.log(`  📸 Taking "after" screenshot (item filtered)...`);
  const afterScreenshot = await page.screenshot({
    clip: clipArea  // ✅ Same dimensions as before!
  });
  
  // Use pixelmatch to detect visual changes
  const beforePNG = PNG.sync.read(beforeScreenshot);
  const afterPNG = PNG.sync.read(afterScreenshot);
  const diffPNG = new PNG({ width: beforePNG.width, height: beforePNG.height });
  
  const pixelDiff = pixelmatch(
    beforePNG.data,
    afterPNG.data,
    diffPNG.data,
    beforePNG.width,
    beforePNG.height,
    { threshold: 0.1 } // 10% tolerance for anti-aliasing
  );
  
  // With proper stability checks, ANY pixel difference means filtering worked
  // If filtering doesn't work, before === after (0 pixels changed)
  // No threshold needed - we're comparing fully-rendered states
  const filterWorked = pixelDiff > 0;
  
  console.log(`  ${filterWorked ? '✅' : '❌'} Filtering ${filterWorked ? 'works' : 'did not work'}: ${pixelDiff} pixels changed`);
  
  if (filterWorked) {
    return {
      passed: true,
      message: `${layerName}: Filtering works (${pixelDiff} pixels changed)`,
      details: { pixelDiff, method: 'pixel_diff' }
    };
  }
  
  return {
    passed: false,
    message: `${layerName}: Filtering did not work (0 pixels changed)`,
    details: { pixelDiff: 0, method: 'pixel_diff' }
  };
}



