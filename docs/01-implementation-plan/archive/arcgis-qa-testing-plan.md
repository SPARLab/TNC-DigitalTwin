# ArcGIS Layer Quality Assurance & Playwright Testing System

## Overview

Build a Playwright-based E2E testing framework that validates 68 ArcGIS Feature Services and Image Services against 8 quality criteria. Tests should be readable, maintainable, and capable of tracking known issues without marking everything as "expected to fail."

## Phase 1: Issue Cataloging & Categorization

### 1.1 Extract and Document All Issues

**Create**: `src/data/manual_test_of_tnc_arcgis_layers_oct_17_2025/KNOWN_ISSUES.md`

**Issues Found** (from manual testing):

**Client-Side Fixes (We Can Fix)**:
1. **Description Parsing** - Right sidebar omits first paragraph (affects multiple layers)
2. **Description HTML** - Some descriptions contain HTML that needs parsing (Habitat Areas of Particular Concern)
3. **"Layer failed to load" Error** - Error message persists when switching to new layer (Point Conception Offshore Geology)
4. **Base Layer Visibility** - Many layers hard to see on satellite imagery, need light gray basemap option (Cattle Guards, National Hydrography, Sensitive Vegetation, Union Pacific Railroad, oak restoration plantings)
5. **Boundary Layer Styling** - DP boundary should be blue for water-related layers (National Hydrography)
6. **Associated Tables** - Can't draw "Water Well Quality" table from Groundwater Wells service
7. **Zoom Suggestions** - Some layers need "zoom out" prompts (USA Weather Watches)
8. **Legend Labels** - Missing units on numeric ranges (FlamMap: "0-2" with no units)
9. **Legend Clarity** - Unclear labels need better metadata parsing (Dibblee Geology, Dangermond Boundary WGS says "Wgs", Habitat Areas says "Nationwide Hapc B")
10. **Layer Description UI** - Add "Full Service Description" vs "Selected Layer Description" options (Oak Restoration Areas)
11. **Styling Issues** - Points not styled correctly (oak restoration plantings)

**Server-Side Issues (Need TNC Fix)**:
1. **Authentication Required** - USA Offshore Pipelines, Chlorophyll-a, USA Annual NLCD require login
2. **Server Errors** - Point Conception Offshore Geology fails on their server too
3. **Performance** - NAIP 2005, USA NLCD load slowly (may be client implementation, needs investigation)
4. **Legend Filters** - FlamMap filters don't work (needs metadata investigation)

**Enhancement Requests**:
1. Color suggestions (Major Watersheds should be blue, not red)
2. Boundary layer toggle button
3. Time component UI for time-enabled services (USA NLCD)

### 1.2 Categorize by Priority

**P0 - Critical**: Authentication detection, description parsing, error message persistence
**P1 - High**: Base layer visibility, legend labels with units, associated tables
**P2 - Medium**: Styling improvements, color changes, zoom suggestions
**P3 - Low**: Enhancement requests, performance optimization investigation

## Phase 2: Playwright Setup & Test Infrastructure

### 2.1 Install Playwright

```bash
npm install -D @playwright/test
npx playwright install
```

**Create**: `playwright.config.ts`

```typescript
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false, // Run sequentially for ArcGIS stability
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1, // Single worker to avoid ArcGIS rate limiting
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
    viewport: { width: 1920, height: 1080 }, // Fixed desktop size
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
  },
});
```

### 2.2 Create Test Data Configuration

**Create**: `e2e/test-data/arcgis-layers.json`

JSON file with layer configurations:
```json
{
  "layers": [
    {
      "id": "jldp-fire-perimeters",
      "title": "JLDP Fire Perimeters",
      "url": "https://services.arcgis.com/.../Fire_Perimeters/FeatureServer",
      "type": "FeatureService",
      "expectedResults": {
        "showsInCategories": true,
        "layersLoad": true,
        "downloadLinkWorks": true,
        "descriptionMatches": true,
        "tooltipsPopUp": true,
        "legendExists": true,
        "legendLabelsDescriptive": true,
        "legendFiltersWork": true
      },
      "knownIssues": [],
      "testCoordinates": { "x": 500, "y": 400 }
    },
    {
      "id": "flammap-burn-probability",
      "title": "FlamMap Burn Probability",
      "expectedResults": {
        "legendLabelsDescriptive": false,
        "legendFiltersWork": false
      },
      "knownIssues": [
        "ISSUE-8: Legend labels missing units",
        "ISSUE-14: Legend filters don't work"
      ]
    }
  ],
  "testSuites": {
    "smoke": ["jldp-fire-perimeters"],
    "full": ["all"],
    "failing": ["flammap-burn-probability", "usa-offshore-pipelines"]
  }
}
```

### 2.3 Create Reusable Test Helpers

**Create**: `e2e/helpers/arcgis-test-helpers.ts`

```typescript
import { Page, expect } from '@playwright/test';

export async function selectLayer(page: Page, layerTitle: string) {
  // Navigate to ArcGIS data source
  await page.getByRole('combobox', { name: /data source/i }).selectOption('TNC ArcGIS');
  // Find and click the layer card
  await page.getByText(layerTitle).click();
  // Wait for layer to be selected
  await page.waitForTimeout(2000); // ArcGIS needs time
}

export async function checkLayerLoads(
  page: Page,
  coordinates: { x: number; y: number }
): Promise<boolean> {
  // Click on map at specified coordinates
  const mapView = page.locator('[data-testid="map-view"]');
  await mapView.click({ position: coordinates });
  
  // Check if tooltip appears (indicates layer rendered)
  const tooltip = page.locator('[data-testid="feature-tooltip"]');
  try {
    await tooltip.waitFor({ timeout: 5000 });
    return true;
  } catch {
    return false;
  }
}

export async function checkLegendLabelsDescriptive(page: Page): Promise<boolean> {
  const legendLabels = page.locator('[data-testid="legend-item-label"]');
  const labels = await legendLabels.allTextContents();
  
  // Check: if label contains numbers, it must also contain letters (units)
  for (const label of labels) {
    const hasNumbers = /\d/.test(label);
    const hasLetters = /[a-zA-Z]/.test(label);
    if (hasNumbers && !hasLetters) {
      return false; // Numeric label without units
    }
  }
  return true;
}

export async function checkDownloadLinkWorks(page: Page): Promise<boolean> {
  const downloadButton = page.getByRole('button', { name: /download/i });
  await downloadButton.click();
  
  // Check for loading spinner
  const spinner = page.locator('[data-testid="loading-spinner"]');
  await spinner.waitFor({ timeout: 2000 });
  
  // Wait for spinner to disappear
  await spinner.waitFor({ state: 'hidden', timeout: 10000 });
  
  // Check for 404 error
  const errorText = page.getByText(/404|not found/i);
  const hasError = await errorText.isVisible().catch(() => false);
  
  return !hasError;
}
```

### 2.4 Add Test IDs to Components

**Update**: Key components to add `data-testid` attributes:
- `src/components/MapView.tsx` - Add `data-testid="map-view"`
- `src/components/LayerLegend.tsx` - Add `data-testid="legend-item-label"` to labels
- `src/components/DatasetCard.tsx` - Add testids for cards
- `src/components/LoadingSpinner.tsx` - Add `data-testid="loading-spinner"`
- Feature tooltips - Add `data-testid="feature-tooltip"`

## Phase 3: Write Core Test Suite

### 3.1 Create Test Template

**Create**: `e2e/arcgis-layer-quality.spec.ts`

```typescript
import { test, expect } from '@playwright/test';
import * as helpers from './helpers/arcgis-test-helpers';
import testData from './test-data/arcgis-layers.json';

test.describe('ArcGIS Layer Quality Assurance', () => {
  
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // Wait for app to load
    await page.waitForLoadState('networkidle');
  });

  for (const layer of testData.layers) {
    test(`${layer.title}: Complete QA Check`, async ({ page }) => {
      await helpers.selectLayer(page, layer.title);
      
      // Test 1: Shows up in all categories
      if (layer.expectedResults.showsInCategories) {
        const card = page.getByText(layer.title);
        await expect(card).toBeVisible();
      }
      
      // Test 2 & 5: Layers load + Tooltips pop up (combined via coordinate click)
      if (layer.expectedResults.layersLoad && layer.testCoordinates) {
        const loaded = await helpers.checkLayerLoads(page, layer.testCoordinates);
        if (layer.knownIssues.some(i => i.includes('not load'))) {
          test.info().annotations.push({ 
            type: 'known-issue', 
            description: layer.knownIssues.join(', ') 
          });
        } else {
          expect(loaded).toBe(layer.expectedResults.layersLoad);
        }
      }
      
      // Test 3: Download link works
      if ('downloadLinkWorks' in layer.expectedResults) {
        const works = await helpers.checkDownloadLinkWorks(page);
        expect(works).toBe(layer.expectedResults.downloadLinkWorks);
      }
      
      // Test 4: Description matches (manual check for now)
      // Test 6: Legend exists
      // Test 7: Legend labels descriptive
      // Test 8: Legend filters work
      
    });
  }
});
```

### 3.2 Start with Representative Tests

**Initial Test Set**:
1. **Passing Layer**: "JLDP Fire Perimeters" - All checks pass
2. **Failing Layer**: "FlamMap Burn Probability" - Known issues with legend
3. **Auth Layer**: "USA Offshore Pipelines" - Requires login

Build these 3 tests completely, verify they work as expected, then expand.

## Phase 4: Known Issues Tracking System

### 4.1 Use Playwright Annotations

For tests that currently fail due to known issues:
```typescript
test('FlamMap: Legend labels have units', async ({ page }) => {
  test.info().annotations.push({
    type: 'known-issue',
    description: 'ISSUE-8: Legend labels missing units (e.g. "0-2" with no measurement)'
  });
  
  const descriptive = await helpers.checkLegendLabelsDescriptive(page);
  
  // Test ALWAYS runs and reports actual result
  // We can track when known issues get fixed
  expect(descriptive).toBe(false); // Currently expected to fail
});
```

### 4.2 Generate Issue Report

Playwright HTML reporter will show:
- Tests with known-issue annotations
- When known issues are unexpectedly fixed (test passes when expected to fail)
- New regressions (test fails when expected to pass)

## Phase 5: Expand Coverage

### 5.1 Gradual Rollout

1. Implement 3 representative tests completely
2. Run and verify results match manual testing
3. Add 10 more "easy" layers (all tests pass)
4. Add remaining layers incrementally
5. Make it easy to configure which layers run via test suites in JSON

### 5.2 Configuration System

User can easily edit `arcgis-layers.json` to:
- Add new layers
- Update expected results as bugs are fixed
- Add/remove layers from test suites
- Configure test coordinates for click testing

## Deliverables

1. **KNOWN_ISSUES.md** - Categorized list of all documented issues
2. **Playwright config** - Desktop-only E2E testing setup
3. **Test helpers** - Reusable functions for 8 quality checks
4. **Test data JSON** - Configurable layer definitions with expected results
5. **Core test suite** - 3 representative tests (passing, failing, auth)
6. **Component updates** - Add data-testid attributes
7. **Documentation** - How to run tests, add new layers, update expectations

## Key Principles

✅ **Readable**: Test descriptions clearly state what they verify
✅ **User-Focused**: Test user-visible behavior, not implementation details  
✅ **Maintainable**: Easy to add layers and update expectations
✅ **Honest**: Tests report actual state, known issues tracked separately
✅ **Incremental**: Start small (3 layers), expand gradually

## To-dos

- [ ] Create KNOWN_ISSUES.md with categorized bug list from manual testing
- [ ] Install Playwright, create config, add test-data JSON structure
- [ ] Build reusable test helper functions for 8 quality checks
- [ ] Add data-testid attributes to MapView, LayerLegend, tooltips, etc
- [ ] Implement complete tests for 3 representative layers (JLDP Fire, FlamMap, USA Pipelines)
- [ ] Run tests, verify results match manual testing, adjust as needed
- [ ] Add remaining 65 layers to test suite incrementally

