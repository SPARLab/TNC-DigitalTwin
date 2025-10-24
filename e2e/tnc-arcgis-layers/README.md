# ArcGIS Layers E2E Tests

This directory contains E2E tests for all ArcGIS layers in the TNC Digital Twin application.

## Test Architecture

### Dynamic Tests (`all-layers-dynamic.spec.ts`)
- **Runs tests for ALL categorized layers** (45 layers)
- Generates tests dynamically from `e2e/test-data/all-arcgis-layers.json`
- Uses `runQualityCheck()` helper for consistency
- Uses `calculateTestTimeout()` for dynamic timeouts based on sublayer count
- Best for: Full regression testing, checkpoint runs

### Manual Tests (Individual `.spec.ts` files)
- **Runs tests for SPECIFIC layers** for debugging
- Uses the SAME `runQualityCheck()` helper as dynamic tests
- Uses the SAME `calculateTestTimeout()` for consistent timeouts
- Uses `@manual` tag for filtering
- **Human-readable test steps**: Each verification is a separate, clearly-labeled step
- Best for: Debugging specific layer issues before full run

**Important:** Any code changes should work in BOTH manual and dynamic tests automatically since they use the same `runQualityCheck()` function and timeout calculation.

### Test Step Hierarchy (Human-Readable Reports!)

All tests now use a clear hierarchy in Playwright reports:

```
Setup: Navigate and load layer
  ↳ Navigate to category
  ↳ Search for layer
  ↳ Click on layer
  ↳ Wait for load

1. Shows Up In All Categories
  ↳ Check category 1
  ↳ Check category 2

2. All Layers Load
  ↳ Verify layer visible

3. ArcGIS Download Link Works
  ↳ Click download button
  ↳ Verify modal opens

... (Tests 4-8)

Verify: Layer loads successfully
Verify: Download link works
Verify: Tooltips pop up when clicking features
Verify: Legend panel exists
Verify: Legend labels are descriptive
Verify: Legend filters work properly
```

This makes it EASY to see what each test is doing and where it failed! 🎯

---

## Running Tests

### Test a Specific Layer (Manual Testing)

**Important:** Use `--grep-invert="@dynamic"` to run ONLY the manual test, not the dynamic test!

```bash
# Test Cattle Guards (manual test only)
npm run test:e2e -- --grep="Cattle Guards" --grep-invert="@dynamic"

# Test Dibblee Geology (manual test only)
npm run test:e2e -- --grep="Dibblee" --grep-invert="@dynamic"

# Test Earthquake Faults (manual test only)
npm run test:e2e -- --grep="Earthquake" --grep-invert="@dynamic"

# Or use the @manual tag to run ALL manual tests
npm run test:e2e -- --grep="@manual"
```

### Test All Layers (Full Checkpoint Run)

```bash
# Run full checkpoint with custom reporter
npm run test:e2e:checkpoint

# Results saved to:
# - e2e/checkpoints/test-validation-history.csv (summary)
# - e2e/checkpoints/full/checkpoint-{timestamp}.json (detailed)
```

### Test Multiple Specific Layers

```bash
# Test all manual tests (skip dynamic tests)
npm run test:e2e -- --grep="@manual"

# Test just CalFire layers (both manual and dynamic)
npm run test:e2e -- --grep="CalFire"

# Test Fire-related layers (both manual and dynamic)
npm run test:e2e -- --grep="Fire"
```

---

## Test Files

### Manual Test Files (for debugging):
- `cattle-guards.spec.ts` - Cattle Guards (icon layer, tooltip issues)
- `cattle-pastures.spec.ts` - Cattle Pastures (category matching test)
- `coastal-and-marine-data.spec.ts` - Coastal and Marine Data (PNG icons)
- `dibblee-geology.spec.ts` - Dibblee Geology (cryptic labels, tooltip issues)
- `fish-passage-barriers-assessment.spec.ts` - Fish Passage Barriers (styled points, tooltip issues)
- `earthquake-faults-folds-usa.spec.ts` - Earthquake Faults (download broken, tooltip issues)
- `california-historic-fire-perimeters.spec.ts` - California Fire Perimeters
- `calfire-fire-hazard-severity-zones-2023.spec.ts` - CalFire FHSZ
- `calfire-frap-fire-threat-2019.spec.ts` - CalFire FRAP (filters broken)

### Dynamic Test File:
- `all-layers-dynamic.spec.ts` - Runs all 45 categorized layers

### Other Files:
- `PROBLEM_LAYERS.md` - Tracks known issues and debugging TODO list
- `README.md` - This file

---

## How to Add a New Manual Test

1. Copy an existing manual test file (e.g., `cattle-guards.spec.ts`)
2. Update the layer config with correct ID, title, URL, categories, and expected results
3. Use `runQualityCheck(page, layerConfig)` - **DO NOT** use old helpers directly
4. Run it: `npm run test:e2e -- --grep="Your Layer Name"`

**Example:**

```typescript
import { test, expect } from '@playwright/test';
import { runQualityCheck } from '../helpers/run-quality-check';

test.describe('My New Layer', () => {
  test.setTimeout(120000); // 2 minutes
  
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5173');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
  });

  test('Complete Quality Check (8 Criteria)', async ({ page }) => {
    const layerConfig = {
      id: 'my-layer-id',
      title: 'My New Layer',
      itemId: 'abc123',
      url: 'https://services.arcgis.com/.../FeatureServer',
      type: 'FeatureService' as const,
      categories: ['Fire', 'Infrastructure'],
      expectedResults: {
        showsInCategories: null,
        layersLoad: true,
        downloadLinkWorks: true,
        tooltipsPopUp: true,
        legendExists: true,
        legendLabelsDescriptive: true,
        legendFiltersWork: true
      },
      notes: 'Optional notes'
    };

    const result = await runQualityCheck(page, layerConfig);

    // Log results
    console.log(`Tooltips: ${result.tests.test5_tooltipsPopUp?.passed ? 'PASS' : 'FAIL'}`);

    // Assertions
    expect(result.tests.test2_layersLoad?.passed).toBe(true);
  });
});
```

---

## Test Results

### Viewing Results

```bash
# Open HTML report
npx playwright show-report

# Open checkpoint report (for full runs)
npx playwright show-report playwright-report-checkpoint
```

### Understanding Results

**Test Validation Metrics:**
- **True Positive (TP):** Feature works, test says PASS ✅
- **True Negative (TN):** Feature broken, test says FAIL ✅
- **False Positive (FP):** Feature broken, test says PASS ❌
- **False Negative (FN):** Feature works, test says FAIL ❌

**Accuracy = (TP + TN) / Total Tests**

**Goal:** 95%+ accuracy, < 20 minutes runtime

---

## Known Issues

See `PROBLEM_LAYERS.md` for:
- Layers with 10-minute timeouts
- Tooltip test failures (false negatives)
- Other test issues
- Priority TODOs

---

## Test Configuration

### Checkpoint Config (`playwright.checkpoint.config.ts`)
- **Workers:** 9 parallel workers
- **Timeout:** 300 seconds (5 minutes) per test
- **Retries:** 0 (disabled to prevent 10-min timeouts)
- **Video:** Only on failures (for speed)
- **Screenshots:** Only on failures (for speed)

### Base Config (`playwright.config.ts`)
- Standard Playwright settings
- Local dev server: http://localhost:5173
