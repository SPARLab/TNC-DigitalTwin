# Test Fixtures Directory

This directory contains test data files used by the testing framework.

## Files

### `tnc_frontend_test_data.csv`
**Status**: 📋 *Please add this file here*

This CSV file contains the real TNC ArcGIS Hub data that will be used to:

1. **Generate realistic test scenarios** based on actual data
2. **Validate filter combinations** against expected results  
3. **Test category mappings** with real tags and categories
4. **Verify UI pattern detection** with actual data types
5. **Create data-driven tests** that match production behavior

### Expected CSV Structure

The CSV should contain columns like:
- `id` - Unique identifier for each dataset
- `title` - Dataset title
- `type` - Data type (Feature Service, Dashboard, etc.)
- `description` - Full description
- `snippet` - Short description
- `url` - Service/application URL
- `owner` - Data owner
- `tags` - Semicolon-separated tags
- `categories` - Hierarchical categories
- `mainCategories` - Mapped main categories
- `collection` - Collection type (dataset, document, appAndMap)
- `num_views` - View count
- `size` - Data size
- `created` - Creation date
- `modified` - Last modified date

## Usage in Tests

Once the CSV is added, the tests will automatically:

```typescript
// Load real data
const realData = await loadCSVFromFixtures('tnc_frontend_test_data.csv')

// Generate test scenarios
const scenarios = createDataDrivenTestScenarios(realData)

// Test filter combinations
scenarios.forEach(scenario => {
  it(`should return ${scenario.expectedCount} items for ${scenario.name}`, () => {
    // Test that filters produce expected results
  })
})
```

## Test Scenarios Generated

The framework will analyze the CSV and create test scenarios for:

- **Hydrological + Dangermond Preserve + Last 6 months**
- **Fire + Dangermond + Margin + 2020-2024** 
- **Marine + Current View + Last 6 months**
- **Vegetation + Custom Date Range**
- And more based on the actual data categories

## Benefits

✅ **Real Data Testing** - Tests use actual TNC datasets
✅ **Predictable Results** - Know exactly what each filter should return
✅ **Category Validation** - Verify mappings work with real tags
✅ **UI Pattern Testing** - Test with actual data types
✅ **Regression Prevention** - Catch changes in data structure

## Adding the CSV File

1. Place `tnc_frontend_test_data.csv` in this directory
2. Run the tests: `npm test -- real-data-tests.test.ts`
3. The framework will automatically analyze the data and generate scenarios
4. Tests will validate that filter combinations work as expected

## Mock Data Fallback

Until the real CSV is added, tests will use mock data that simulates the expected structure with sample items for each category.

