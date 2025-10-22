# E2E Testing for ArcGIS Digital Twin

This directory contains end-to-end tests for the ArcGIS Digital Twin application using Playwright.

## Overview

The test suite validates 68 ArcGIS Feature Services and Image Services against 8 quality criteria:

1. **Shows Up In Categories** - Layer appears in appropriate search results
2. **All Layers Load** - Layer renders on map without errors
3. **Download Link Works** - Link to ArcGIS source page works
4. **Description Matches** - Description is present and readable
5. **Tooltips Pop-Up** - Features are interactive (combined with #2)
6. **Legend Exists** - Legend displays for the layer
7. **Legend Labels Descriptive** - Legend has meaningful labels (not just numbers)
8. **Legend Filters Work** - Legend checkboxes filter map features

## Running Tests

### Run all tests
```bash
npx playwright test
```

### Run specific test suite
```bash
# Smoke tests only (fast)
npx playwright test --grep="Smoke Tests"

# Representative sample (3 layers)
npx playwright test arcgis-layer-quality.spec.ts

# Specific layer
npx playwright test --grep="JLDP Fire Perimeters"
```

### Run in UI mode (helpful for debugging)
```bash
npx playwright test --ui
```

### Generate HTML report
```bash
npx playwright test
npx playwright show-report
```

## Checkpoint Testing System

The checkpoint system allows you to run comprehensive tests on all layers, track progress over time, and validate test accuracy.

### Quick Start

```bash
# 1. Generate test data from manual QA results
npm run test:e2e:generate-data

# 2. Run checkpoint tests (all 66 layers)
npm run test:e2e:checkpoint

# 3. Validate test accuracy (true positives/negatives)
npm run test:e2e:validate

# 4. View progress over time
npm run test:e2e:progress
```

### Workflow

#### Initial Setup (One-Time)
```bash
npm run test:e2e:generate-data  # Parse CSV → JSON
```
This reads `src/data/manual_test_of_tnc_arcgis_layers_oct_17_2025/TNC Digital Catalog Manual Verification - tnc_frontend_test_data.csv` and generates `e2e/test-data/all-arcgis-layers.json` with expected test results.

#### Test Development (Iterative)
Refine manual tests (e.g., `calfire-frap-fire-threat-2019.spec.ts`) until they accurately detect bugs:
```bash
npx playwright test calfire-frap-fire-threat-2019
```

#### Checkpoint (After Major Changes or Bug Fixes)
```bash
# Run all layers and save results
npm run test:e2e:checkpoint

# Check test accuracy
npm run test:e2e:validate

# View historical trends
npm run test:e2e:progress
```

### Understanding Test Validation

The validation script compares actual test results against expected results to ensure tests are accurate:

- **True Positive (TP)**: Expected pass, actual pass ✅
- **True Negative (TN)**: Expected fail, actual fail ✅
- **False Positive (FP)**: Expected fail, actual pass ⚠️ **TEST BUG** (test is too lenient)
- **False Negative (FN)**: Expected pass, actual fail ⚠️ **TEST or APP BUG**

**Example Output:**
```
═══════════════════════════════════════════
   TEST VALIDATION REPORT
═══════════════════════════════════════════

📅 Latest checkpoint: 2025-10-21T18:30:00.000Z
📊 Found 66 layer results

Total Tests: 320 (40 skipped)
True Positives: 250 (78.1%)
True Negatives: 50 (15.6%)
False Positives: 5 (1.6%) ⚠️ TESTS NEED FIXING
False Negatives: 15 (4.7%) ⚠️ TESTS NEED FIXING

Overall Accuracy: 93.8%

═══════════════════════════════════════════
   TESTS NEEDING REFINEMENT
═══════════════════════════════════════════

❌ FALSE NEGATIVE
   Layer: Cattle Guards
   Test: Test 5 (Tooltips)
   Issue: Expected PASS, got FAIL (test or app bug)
```

### Progress Tracking Over Time

The progress report shows improvements and regressions across checkpoints:

```
═══════════════════════════════════════════
   QUALITY PROGRESS REPORT
═══════════════════════════════════════════

Found 3 checkpoint(s)

───────────────────────────────────────────
Checkpoint 1: Oct 20, 2025, 10:00 AM
───────────────────────────────────────────
Layers passing all tests: 25/40 (62.5%)
Total bugs: 52

───────────────────────────────────────────
Checkpoint 2: Oct 21, 2025, 02:30 PM
───────────────────────────────────────────
Layers passing all tests: 28/40 (70.0%)
Total bugs: 45
⬆️  +3 layers improved
⬇️  7 fewer bugs

✅ Fixed layers (3):
   - CalFire FRAP Fire Threat 2019
   - Earthquake Faults and Folds in the USA
   - Cattle Guards
```

### Updating Expected Results

After fixing bugs in the app, update expected results:

1. Fix bugs in app code
2. Run checkpoint: `npm run test:e2e:checkpoint`
3. Update CSV: Manually edit the source CSV or regenerate from new QA
4. Re-generate JSON: `npm run test:e2e:generate-data`
5. Verify: `npm run test:e2e:validate`

### File Structure

```
e2e/
├── tnc-arcgis-layers/              # Individual layer test files
│   ├── calfire-frap-fire-threat-2019.spec.ts
│   ├── calfire-fire-hazard-severity-zones-2023.spec.ts
│   ├── earthquake-faults-folds-usa.spec.ts
│   └── all-layers-dynamic.spec.ts  # 🆕 Dynamic tests for ALL layers
├── helpers/
│   ├── tnc-arcgis-test-helpers.ts  # Test utilities & generalized functions
│   └── run-quality-check.ts        # 🆕 Main test orchestrator
├── reporters/
│   └── checkpoint-reporter.ts      # 🆕 Custom reporter for progress tracking
├── scripts/
│   ├── parse-manual-test-csv.ts    # 🆕 CSV → JSON converter
│   ├── validate-tests.ts           # 🆕 Test accuracy validator
│   └── progress-report.ts          # 🆕 Historical trend analyzer
├── test-data/
│   └── all-arcgis-layers.json      # 🆕 Expected results for all layers
├── checkpoints/
│   ├── checkpoint-history.csv      # 🎯 Summary: one row per test run
│   └── checkpoint-TIMESTAMP.json   # 📋 Detailed: full results per run (git-ignored)
└── README.md
```

**Checkpoint Results Structure:**
- **`checkpoint-history.csv`**: Summary metrics for **FULL runs only** (tracked in git)
  ```csv
  timestamp, run_type, total_layers_tested, feature_services_tested, image_services_tested,
  true_positives, true_negatives, false_positives, false_negatives, overall_accuracy,
  passing_services, failing_services, failing_service_names, detailed_results_file
  ```
  - **One row per FULL checkpoint run** (PARTIAL runs NOT saved)
  - **Run Type**: Always "FULL" (all 45 categorized layers)
  - **Layer Counts**: Total, FeatureServices, ImageServices tested
  - **Test Accuracy**: TP/TN/FP/FN and overall accuracy percentage
  - **Service Status**: Count of passing/failing services, with names if ≤5 failing
  - **Reference**: Links to detailed JSON file for investigation
  
- **`checkpoint-TIMESTAMP.json`**: Detailed test results for each run (git-ignored, for debugging)
  - Saved for **both FULL and PARTIAL runs**
  - Full pass/fail status for every test in every layer
  - Complete list of tested layer IDs
  - PARTIAL run JSONs are for manual review only

**Using the History:**
- No filtering needed - all rows are FULL checkpoint runs
- Track progress over time: accuracy trending up, failing services trending down
- Identify problematic layers from `failing_service_names` column
- PARTIAL runs: Review the JSON file manually, not tracked in CSV

**Example History Evolution:**
```
timestamp              | run_type | total | FS | IS | TP | TN | FP | FN | accuracy | passing | failing | names
2025-10-20T10:00:00Z  | FULL     | 45    | 39 | 6  | 38 | 2  | 3  | 12 | 72.7%    | 32      | 13      | More than 5 failing, see...
2025-10-21T14:30:00Z  | FULL     | 45    | 39 | 6  | 46 | 3  | 2  | 9  | 81.7%    | 38      | 7       | Cattle Guards; Dibblee...
2025-10-22T16:00:00Z  | FULL     | 45    | 39 | 6  | 52 | 3  | 0  | 5  | 91.7%    | 41      | 4       | Cattle Guards; Coastal...
```
**Progress:** 72.7% → 81.7% → 91.7% accuracy, 13 → 7 → 4 failing services 🎉
**Note:** PARTIAL runs (e.g., testing 1-3 layers for debugging) are NOT shown in this CSV

### Key Design Decisions

1. **CSV as source of truth**: Manual QA findings remain intact and easy to update
2. **JSON for test execution**: Fast parsing, programmatic access
3. **Reusable test functions**: Single implementation tested across all layers
4. **CSV for checkpoint history**: Human-readable, easy to diff, works with spreadsheets
5. **True positive/negative validation**: Ensures tests are accurate before bug fixing

## Test Structure

```
e2e/
├── tnc-arcgis-layers/              # Individual layer test files
│   ├── calfire-frap-fire-threat-2019.spec.ts  # Complete 8-criteria test
│   ├── earthquake-faults-folds-usa.spec.ts    # TRUE NEGATIVE test (404)
│   └── ...more layer tests
├── helpers/
│   └── tnc-arcgis-test-helpers.ts  # Shared test utilities
├── test-data/
│   └── arcgis-layers.json          # Layer configs & expected results
└── README.md
```

### Organization Philosophy

**One test file per layer** - Each ArcGIS layer gets its own test file named after the layer. This:
- Makes it easy to run tests for specific layers
- Scales to hundreds of layers without massive files
- Allows parallel execution (when ready)
- Simplifies tracking layer-specific issues

### Test Data Configuration
- **`test-data/arcgis-layers.json`** - Defines layers, expected results, and known issues
- Easily editable to add new layers or update expectations
- Supports test suites (smoke, representative, full, passing, failing)

### Shared Test Helpers (`helpers/tnc-arcgis-test-helpers.ts`)
- `navigateToLayer()` - Complete search workflow to find a layer
- `testDownloadLink()` - Verify download works OR detects 404 (for true negatives)
- `checkForColors()` - Pixel-based verification that layer rendered
- Functions test user-visible behavior, not implementation details

## Adding New Layers to Test

1. **Update test-data/arcgis-layers.json**:

```json
{
  "id": "new-layer-id",
  "title": "New Layer Name",
  "url": "https://services.arcgis.com/.../FeatureServer",
  "type": "FeatureService",
  "category": "Fire",
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
  "testCoordinates": { "x": 960, "y": 540 },
  "notes": "Any relevant notes about this layer"
}
```

2. **Set expected results** based on manual testing
   - `true` if feature works as expected
   - `false` if known issue exists

3. **Document known issues** using issue IDs from KNOWN_ISSUES.md:
```json
"knownIssues": [
  "ISSUE-8: Legend labels missing units"
]
```

4. **Test coordinates** - Click position to test layer loading
   - Default center: `{ "x": 960, "y": 540 }` (for 1920x1080 viewport)
   - Adjust if layer features are in different location
   - Set to `null` if layer cannot be tested via click (e.g., auth required)

## Known Issues Tracking

Tests use Playwright annotations to track known issues:

```typescript
test('legend labels have units', async ({ page }) => {
  // Annotate known issue
  test.info().annotations.push({
    type: 'known-issue',
    description: 'ISSUE-8: Legend labels missing units'
  });
  
  // Test ALWAYS runs and reports actual state
  const descriptive = await helpers.checkLegendLabelsDescriptive(page);
  expect(descriptive).toBe(false); // Expected to fail currently
});
```

**Benefits**:
- Tests always run and report actual results
- Can detect when known issues are unexpectedly fixed
- Can detect new regressions (test fails when expected to pass)
- HTML report shows all known issues clearly

## Updating Test Expectations

When a bug is fixed:

1. **Update KNOWN_ISSUES.md** - Mark issue as resolved
2. **Update test-data/arcgis-layers.json** - Change expected result to `true`
3. **Remove known issue annotation** from test (if applicable)
4. **Run tests** to verify the fix

Example:
```json
// Before fix
"expectedResults": {
  "legendLabelsDescriptive": false
},
"knownIssues": ["ISSUE-8: Legend labels missing units"]

// After fix
"expectedResults": {
  "legendLabelsDescriptive": true
},
"knownIssues": []
```

## Test Configuration

**`playwright.config.ts`** in project root:
- Desktop only (1920x1080 viewport)
- Single worker (avoids ArcGIS rate limiting)
- Sequential execution (more stable for map loading)
- Automatic dev server startup
- Screenshots on failure
- HTML reporter

## Best Practices

1. **Keep tests readable** - Test names clearly describe what they verify
2. **Test user behavior** - Verify what users see, not implementation details
3. **Use test helpers** - Reuse common functions instead of duplicating code
4. **Document expectations** - Use comments and annotations to explain why tests exist
5. **Update regularly** - Keep test data and expectations synchronized with app state

## CI/CD Integration

Recommended GitHub Actions workflow:

```yaml
name: E2E Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npx playwright install --with-deps
      - run: npx playwright test --grep="Smoke Tests"
      - uses: actions/upload-artifact@v3
        if: always()
        with:
          name: playwright-report
          path: playwright-report/
```

## Troubleshooting

### Tests timing out
- Increase timeout in test: `test.setTimeout(60000)`
- Check if dev server is running
- Verify network connection to ArcGIS services

### Map not loading
- Check viewport size matches test coordinates
- Ensure ArcGIS API key is valid (if required)
- Wait longer after layer selection: `await page.waitForTimeout(5000)`

### Legend not found
- Verify layer actually has a legend (check ArcGIS REST endpoint)
- Check if legend is collapsed/hidden by default
- Update test helper to find legend using different selector

### Auth errors
- Some layers require authentication - this is expected
- Use `checkRequiresAuth()` helper to detect auth requirement
- Document in known issues and set `expectedResults` appropriately

## Future Enhancements

- [ ] Visual regression testing (screenshot comparison)
- [ ] Performance monitoring (layer load times)
- [ ] Accessibility testing (WCAG compliance)
- [ ] Mobile viewport testing (when mobile support is added)
- [ ] API response mocking for faster tests
- [ ] Parallel test execution with proper rate limiting

