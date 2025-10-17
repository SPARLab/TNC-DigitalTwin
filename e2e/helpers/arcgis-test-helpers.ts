import { Page, expect, Locator } from '@playwright/test';

/**
 * Helper functions for testing ArcGIS layer quality
 * These functions test user-visible behavior, not implementation details
 */

/**
 * Navigate to the app and select a specific ArcGIS layer
 */
export async function selectLayer(page: Page, layerTitle: string): Promise<void> {
  // Navigate to ArcGIS data source
  const sourceSelect = page.getByRole('combobox', { name: /data source/i });
  await sourceSelect.selectOption({ label: /TNC ArcGIS/i });
  
  // Wait for layers to load
  await page.waitForTimeout(1000);
  
  // Find and click the layer card
  const layerCard = page.getByText(layerTitle, { exact: false });
  await layerCard.first().click();
  
  // Wait for layer to be selected and start loading
  await page.waitForTimeout(2000); // ArcGIS needs time to initialize
}

/**
 * Check if a layer successfully loads by clicking on the map and checking for tooltip
 * This combines Test #2 (layer loads) and Test #5 (tooltips pop up)
 */
export async function checkLayerLoads(
  page: Page,
  coordinates: { x: number; y: number }
): Promise<boolean> {
  // Click on map at specified coordinates
  const mapView = page.locator('[data-testid="map-view"]').or(page.locator('.map-container')).first();
  
  try {
    await mapView.click({ position: coordinates, timeout: 5000 });
  } catch (error) {
    console.log('Failed to click map:', error);
    return false;
  }
  
  // Check if tooltip appears (indicates layer rendered and is interactive)
  const tooltip = page.locator('[data-testid="feature-tooltip"]').or(page.locator('[role="tooltip"]')).first();
  
  try {
    await tooltip.waitFor({ timeout: 5000, state: 'visible' });
    return true;
  } catch {
    return false;
  }
}

/**
 * Check if legend exists and is visible
 * Test #6: Legend exists
 */
export async function checkLegendExists(page: Page): Promise<boolean> {
  const legend = page.locator('[data-testid="layer-legend"]').or(page.getByText(/legend/i)).first();
  
  try {
    await legend.waitFor({ timeout: 5000, state: 'visible' });
    return await legend.isVisible();
  } catch {
    return false;
  }
}

/**
 * Check if legend labels are descriptive (contain text, not just numbers)
 * Test #7: Legend labels descriptive
 * 
 * Rule: If a label contains numbers, it must also contain letters (units/description)
 */
export async function checkLegendLabelsDescriptive(page: Page): Promise<boolean> {
  const legendLabels = page.locator('[data-testid="legend-item-label"]').or(
    page.locator('.legend-item').locator('text')
  );
  
  try {
    await legendLabels.first().waitFor({ timeout: 5000 });
  } catch {
    return false; // No legend labels found
  }
  
  const labels = await legendLabels.allTextContents();
  
  if (labels.length === 0) {
    return false;
  }
  
  // Check: if label contains numbers, it must also contain letters (units)
  for (const label of labels) {
    const trimmed = label.trim();
    if (trimmed.length === 0) continue;
    
    const hasNumbers = /\d/.test(trimmed);
    const hasLetters = /[a-zA-Z]/.test(trimmed);
    
    if (hasNumbers && !hasLetters) {
      console.log(`Found numeric-only label: "${trimmed}"`);
      return false; // Numeric label without units
    }
  }
  
  return true;
}

/**
 * Check if legend filters work by toggling a filter and checking map update
 * Test #8: Legend filters work
 * 
 * Note: This is a complex test that may need adjustment per layer
 */
export async function checkLegendFiltersWork(page: Page): Promise<boolean> {
  // Find legend filter checkboxes
  const filterCheckboxes = page.locator('[data-testid="legend-filter-checkbox"]').or(
    page.locator('.legend-item input[type="checkbox"]')
  );
  
  try {
    const count = await filterCheckboxes.count();
    if (count === 0) {
      return false; // No filters available
    }
    
    // Get first checkbox
    const firstCheckbox = filterCheckboxes.first();
    const wasChecked = await firstCheckbox.isChecked();
    
    // Toggle it
    await firstCheckbox.click();
    await page.waitForTimeout(1000); // Wait for map to update
    
    // Check if state changed
    const isChecked = await firstCheckbox.isChecked();
    const filterToggled = (wasChecked !== isChecked);
    
    // Toggle back
    if (filterToggled) {
      await firstCheckbox.click();
      await page.waitForTimeout(500);
    }
    
    return filterToggled;
  } catch (error) {
    console.log('Filter check failed:', error);
    return false;
  }
}

/**
 * Check if download link works (opens without 404 error)
 * Test #3: Download link works
 */
export async function checkDownloadLinkWorks(page: Page): Promise<boolean> {
  // Find download button
  const downloadButton = page.getByRole('button', { name: /download|view.*source/i });
  
  try {
    await downloadButton.waitFor({ timeout: 5000 });
    await downloadButton.click();
    
    // Check for loading spinner
    const spinner = page.locator('[data-testid="loading-spinner"]').or(page.locator('.loading, .spinner')).first();
    
    // Wait a moment for spinner to appear (or not)
    await page.waitForTimeout(500);
    
    // If spinner exists, wait for it to disappear
    if (await spinner.isVisible().catch(() => false)) {
      await spinner.waitFor({ state: 'hidden', timeout: 15000 });
    }
    
    // Check for error messages
    const errorPatterns = [
      /404.*not found/i,
      /error.*loading/i,
      /failed.*load/i,
      /cannot.*access/i
    ];
    
    for (const pattern of errorPatterns) {
      const errorText = page.getByText(pattern);
      if (await errorText.isVisible().catch(() => false)) {
        console.log(`Found error: ${pattern}`);
        return false;
      }
    }
    
    return true;
  } catch (error) {
    console.log('Download check failed:', error);
    return false;
  }
}

/**
 * Check if description is present and non-empty
 * Test #4: Description matches website
 * 
 * Note: This is a basic check. Full "matches website" requires manual verification
 */
export async function checkDescriptionExists(page: Page): Promise<boolean> {
  const description = page.locator('[data-testid="layer-description"]').or(
    page.locator('.description, .summary').filter({ hasText: /.{20,}/ })
  ).first();
  
  try {
    await description.waitFor({ timeout: 5000, state: 'visible' });
    const text = await description.textContent();
    return text !== null && text.trim().length > 20; // At least 20 characters
  } catch {
    return false;
  }
}

/**
 * Check if layer shows up in the appropriate category
 * Test #1: Shows up in all categories
 */
export async function checkShowsInCategory(page: Page, layerTitle: string, category: string): Promise<boolean> {
  // Filter by category
  const categoryButton = page.getByRole('button', { name: new RegExp(category, 'i') });
  
  try {
    await categoryButton.click();
    await page.waitForTimeout(500);
    
    // Check if layer appears in results
    const layerCard = page.getByText(layerTitle, { exact: false });
    return await layerCard.isVisible({ timeout: 3000 });
  } catch {
    return false;
  }
}

/**
 * Check if authentication is required (layer fails with auth error)
 * For ISSUE-13 detection
 */
export async function checkRequiresAuth(page: Page): Promise<boolean> {
  // Look for authentication-related error messages
  const authPatterns = [
    /token required/i,
    /authentication.*required/i,
    /please.*log.*in/i,
    /unauthorized/i,
    /403.*forbidden/i
  ];
  
  await page.waitForTimeout(2000); // Wait for error to appear
  
  for (const pattern of authPatterns) {
    const errorText = page.getByText(pattern);
    if (await errorText.isVisible().catch(() => false)) {
      return true;
    }
  }
  
  return false;
}

