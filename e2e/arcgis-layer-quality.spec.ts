import { test, expect } from '@playwright/test';
import * as helpers from './helpers/arcgis-test-helpers';
import testData from './test-data/arcgis-layers.json';

/**
 * ArcGIS Layer Quality Assurance Tests
 * 
 * These tests verify that ArcGIS layers load correctly and display expected behaviors.
 * Tests are designed to be readable and test user-visible behavior, not implementation details.
 * 
 * Known issues are tracked via test annotations and expected results,
 * allowing us to detect both regressions and unexpected fixes.
 */

test.describe('ArcGIS Layer Quality Assurance - Representative Sample', () => {
  
  test.beforeEach(async ({ page }) => {
    // Navigate to the app
    await page.goto('/');
    
    // Wait for app to fully load
    await page.waitForLoadState('networkidle');
    
    // Give ArcGIS extra time to initialize
    await page.waitForTimeout(2000);
  });

  /**
   * Test Suite 1: JLDP Fire Perimeters (Passing Layer)
   * This layer should pass all quality checks - use as reference for expected behavior
   */
  test.describe('JLDP Fire Perimeters (Clean Passing Layer)', () => {
    const layer = testData.layers.find(l => l.id === 'jldp-fire-perimeters')!;

    test('shows up in Fire category', async ({ page }) => {
      // This is a basic smoke test to ensure layer appears in search results
      const searchResults = page.locator('.dataset-card, [data-testid="dataset-card"]');
      const layerCard = page.getByText(layer.title, { exact: false }).first();
      
      await expect(layerCard).toBeVisible({ timeout: 10000 });
    });

    test('loads successfully on map', async ({ page }) => {
      // Select the layer
      await helpers.selectLayer(page, layer.title);
      
      // Wait for map to load
      await page.waitForTimeout(3000);
      
      // Check if layer loads (by checking for absence of error messages)
      const errorMessages = page.getByText(/error.*loading|failed.*load/i);
      await expect(errorMessages).not.toBeVisible();
    });

    test('has working download link', async ({ page }) => {
      // Select the layer
      await helpers.selectLayer(page, layer.title);
      
      // Check download link
      const downloadWorks = await helpers.checkDownloadLinkWorks(page);
      expect(downloadWorks).toBe(layer.expectedResults.downloadLinkWorks);
    });

    test('displays description', async ({ page }) => {
      // Select the layer
      await helpers.selectLayer(page, layer.title);
      
      // Check description exists
      const hasDescription = await helpers.checkDescriptionExists(page);
      expect(hasDescription).toBe(layer.expectedResults.descriptionMatches);
    });

    test('shows legend', async ({ page }) => {
      // Select the layer
      await helpers.selectLayer(page, layer.title);
      
      // Check legend exists
      const legendExists = await helpers.checkLegendExists(page);
      expect(legendExists).toBe(layer.expectedResults.legendExists);
    });

    test('has descriptive legend labels', async ({ page }) => {
      // Select the layer
      await helpers.selectLayer(page, layer.title);
      
      // Wait for legend to load
      await page.waitForTimeout(2000);
      
      // Check legend labels are descriptive
      const labelsDescriptive = await helpers.checkLegendLabelsDescriptive(page);
      expect(labelsDescriptive).toBe(layer.expectedResults.legendLabelsDescriptive);
    });

    test('legend filters work', async ({ page }) => {
      // Select the layer
      await helpers.selectLayer(page, layer.title);
      
      // Wait for legend to load
      await page.waitForTimeout(2000);
      
      // Check if filters work
      const filtersWork = await helpers.checkLegendFiltersWork(page);
      expect(filtersWork).toBe(layer.expectedResults.legendFiltersWork);
    });
  });

  /**
   * Test Suite 2: FlamMap Burn Probability (Known Issues)
   * This layer has known issues with legend labels and filters
   */
  test.describe('FlamMap Burn Probability (Layer with Known Issues)', () => {
    const layer = testData.layers.find(l => l.id === 'flammap-burn-probability')!;

    test('shows up in search results', async ({ page }) => {
      const layerCard = page.getByText(layer.title, { exact: false }).first();
      await expect(layerCard).toBeVisible({ timeout: 10000 });
    });

    test('loads on map despite known issues', async ({ page }) => {
      // Select the layer
      await helpers.selectLayer(page, layer.title);
      
      // Wait for map to load
      await page.waitForTimeout(3000);
      
      // Should still load even with legend issues
      const errorMessages = page.getByText(/error.*loading|failed.*load/i);
      await expect(errorMessages).not.toBeVisible();
    });

    test('legend labels missing units (KNOWN ISSUE)', async ({ page }) => {
      // Annotate as known issue
      test.info().annotations.push({
        type: 'known-issue',
        description: layer.knownIssues.find(i => i.includes('ISSUE-8'))!
      });
      
      // Select the layer
      await helpers.selectLayer(page, layer.title);
      
      // Wait for legend to load
      await page.waitForTimeout(2000);
      
      // Check legend labels
      const labelsDescriptive = await helpers.checkLegendLabelsDescriptive(page);
      
      // We EXPECT this to fail (false) because labels are missing units
      // If it passes unexpectedly, that means the issue was fixed!
      expect(labelsDescriptive).toBe(layer.expectedResults.legendLabelsDescriptive);
    });

    test('legend filters dont work (KNOWN ISSUE)', async ({ page }) => {
      // Annotate as known issue
      test.info().annotations.push({
        type: 'known-issue',
        description: layer.knownIssues.find(i => i.includes('ISSUE-16'))!
      });
      
      // Select the layer
      await helpers.selectLayer(page, layer.title);
      
      // Wait for legend to load
      await page.waitForTimeout(2000);
      
      // Check filters
      const filtersWork = await helpers.checkLegendFiltersWork(page);
      
      // We EXPECT this to fail
      expect(filtersWork).toBe(layer.expectedResults.legendFiltersWork);
    });
  });

  /**
   * Test Suite 3: USA Offshore Pipelines (Authentication Required)
   * This layer requires login credentials - tests auth detection
   */
  test.describe('USA Offshore Pipelines (Authentication Required)', () => {
    const layer = testData.layers.find(l => l.id === 'usa-offshore-pipelines')!;

    test('shows up in search results', async ({ page }) => {
      const layerCard = page.getByText(layer.title, { exact: false }).first();
      await expect(layerCard).toBeVisible({ timeout: 10000 });
    });

    test('detects authentication requirement (KNOWN ISSUE)', async ({ page }) => {
      // Annotate as known issue
      test.info().annotations.push({
        type: 'known-issue',
        description: layer.knownIssues[0]
      });
      
      // Select the layer
      await helpers.selectLayer(page, layer.title);
      
      // Wait for error to appear
      await page.waitForTimeout(3000);
      
      // Check if authentication is required
      const requiresAuth = await helpers.checkRequiresAuth(page);
      
      // We EXPECT this to detect auth requirement
      expect(requiresAuth).toBe(true);
    });

    test('does not load without authentication', async ({ page }) => {
      // Select the layer
      await helpers.selectLayer(page, layer.title);
      
      // Wait for loading attempt
      await page.waitForTimeout(3000);
      
      // Layer should not load successfully
      const errorPresent = await page.getByText(/token required|unauthorized|authentication/i).isVisible()
        .catch(() => false);
      
      expect(errorPresent).toBe(true);
    });
  });

  /**
   * Integration Test: Switching Between Layers
   * Verifies that error states don't persist when switching layers
   */
  test('error states clear when switching from failing to passing layer', async ({ page }) => {
    const failingLayer = testData.layers.find(l => l.id === 'usa-offshore-pipelines')!;
    const passingLayer = testData.layers.find(l => l.id === 'jldp-fire-perimeters')!;
    
    // Load failing layer
    await helpers.selectLayer(page, failingLayer.title);
    await page.waitForTimeout(3000);
    
    // Switch to passing layer
    await helpers.selectLayer(page, passingLayer.title);
    await page.waitForTimeout(3000);
    
    // Error message should be cleared (ISSUE-3 test)
    const errorVisible = await page.getByText(/error|failed|unauthorized/i).isVisible()
      .catch(() => false);
    
    // This tests ISSUE-3: error message persistence
    // Currently may fail if issue not fixed yet
    expect(errorVisible).toBe(false);
  });
});

/**
 * Smoke Test Suite
 * Quick tests that can run in CI for fast feedback
 */
test.describe('Smoke Tests (Fast)', () => {
  test('app loads successfully', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Check for main UI elements
    const header = page.locator('header, [role="banner"]').first();
    await expect(header).toBeVisible();
  });

  test('ArcGIS data source is available', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Check for data source selector
    const sourceSelect = page.getByRole('combobox', { name: /data source/i });
    await expect(sourceSelect).toBeVisible();
    
    // Check if TNC ArcGIS option exists
    const options = await sourceSelect.locator('option').allTextContents();
    expect(options.some(opt => opt.includes('ArcGIS'))).toBe(true);
  });

  test('at least one layer appears in results', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Wait for results to load
    await page.waitForTimeout(2000);
    
    // Check for at least one dataset card
    const cards = page.locator('.dataset-card, [data-testid="dataset-card"]');
    await expect(cards.first()).toBeVisible({ timeout: 10000 });
  });
});

