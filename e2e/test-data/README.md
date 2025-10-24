# E2E Test Data

This directory contains test data for automated E2E tests of ArcGIS layers.

## Important: Single Source of Truth for Categories

**⚠️ Category names in test data MUST match the categories defined in the app!**

### How it works:

1. **Master categories** are defined in: `src/data-sources/tnc-arcgis/category_mappings.json`
2. **App imports** from: `src/utils/constants.ts` → `DATA_CATEGORIES`
3. **Tests import** from: `e2e/helpers/tnc-arcgis-test-helpers.ts` → imports from `src/utils/constants.ts`

This ensures **both app and tests always use the same category names**.

### Valid Categories (from `category_mappings.json`):

1. `"Vegetation / habitat"`
2. `"Ecological / Biological (Species?)"`  ⚠️ Note the exact formatting
3. `"Real-time & Remote Sensing"`
4. `"Land use and land (geography?)"`
5. `"Climate / weather"`
6. `"Hydrological"`
7. `"Topographic"`
8. `"Marine"`
9. `"Fire"`
10. `"Infrastructure"`
11. `"Hazards & Resilience"`

### Validating Test Data

To check that all categories in test data are valid:

```bash
npm run test:e2e:validate-data
```

This script will:
- ✅ Check all categories in `all-arcgis-layers.json` against `DATA_CATEGORIES`
- ❌ Report any mismatches or typos
- 📊 Show summary statistics

### Adding New Layers

When adding new layers to `all-arcgis-layers.json`:

1. Use **exact category strings** from the list above (including special characters!)
2. Run validation: `npm run test:e2e:validate-data`
3. If you need a new category, add it to `category_mappings.json` first

### Changing Category Names

If you need to change a category name:

1. ✏️ Update `src/data-sources/tnc-arcgis/category_mappings.json`
2. ✏️ Update `all-arcgis-layers.json` (or run validation to find issues)
3. ✅ Run `npm run test:e2e:validate-data` to verify
4. 🧪 Run tests to ensure everything still works

The validation script will catch any inconsistencies!

## Files

- `all-arcgis-layers.json` - Complete test data for all ArcGIS layers with expected test results
- `arcgis-layers.json` - Legacy test data (kept for reference)

## Test Data Format

```json
{
  "layers": [
    {
      "id": "layer-id",
      "title": "Layer Title",
      "itemId": "ArcGIS_item_id",
      "url": "https://...",
      "type": "FeatureService" | "ImageService",
      "categories": ["Category1", "Category2"],  // MUST match DATA_CATEGORIES!
      "expectedResults": {
        "showsInCategories": true | false | null,
        "layersLoad": true | false | null,
        // ... etc
      },
      "notes": "Optional notes"
    }
  ]
}
```

**Key Point**: The `categories` array MUST contain strings that exactly match `DATA_CATEGORIES` from `src/utils/constants.ts`!

