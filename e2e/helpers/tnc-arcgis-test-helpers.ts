import { Page, expect } from '@playwright/test';
import { PNG } from 'pngjs';

/**
 * Shared test helpers for TNC ArcGIS layer testing
 * These functions are reusable across all layer test files
 */

/**
 * Navigate to a layer by performing the complete search workflow
 * @param page - Playwright page object
 * @param layerTitle - Title of the layer to find
 * @param category - Category to search in (e.g., "Fire", "Topographic")
 */
export async function navigateToLayer(page: Page, layerTitle: string, category: string): Promise<void> {
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
 * Extract colors from legend swatches
 * Reads the background color of each legend-swatch-polygon element
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
    
    // Get the swatch (polygon color indicator)
    const swatch = item.locator('[id^="legend-swatch-polygon-"]');
    
    if (await swatch.isVisible().catch(() => false)) {
      // Get computed background color
      const bgColor = await swatch.evaluate((el) => {
        const style = window.getComputedStyle(el);
        return style.backgroundColor;
      });
      
      // Parse rgb(r, g, b) or rgba(r, g, b, a)
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
  
  // Click the feature
  await page.mouse.click(clickX, clickY);
  await page.waitForTimeout(1000); // Wait for popup to appear
  
  // Check if ArcGIS popup appeared
  const popup = page.locator('.esri-popup');
  const popupVisible = await popup.isVisible().catch(() => false);
  
  if (popupVisible) {
    console.log('✅ Popup appeared after clicking feature');
    
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
    console.warn('❌ No popup appeared after clicking feature');
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

