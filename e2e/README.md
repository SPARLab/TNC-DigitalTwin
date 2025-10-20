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

