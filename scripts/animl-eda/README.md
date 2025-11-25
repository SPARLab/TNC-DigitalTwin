# Animl Exploratory Data Analysis

This folder contains scripts for analyzing Animl data query performance and behavior.

## Key Findings

### Query Performance (Last Year Date Range)
- **Total count**: 335ms
- **Count per deployment** (grouped): 130ms ⚡
- **Count per animal tag** (grouped): 143ms ⚡
- **Specific deployment count**: 85ms ⚡
- **Specific tag count**: 96ms ⚡

**Conclusion**: Count queries are VERY fast! We can use them extensively without performance concerns.

### Data Characteristics
- **~30,000 total observations** in the last year
- **21 deployments** have observations
- **57 unique animal tags/labels**
- **Multiple tags per image**: Many images have both "animal" (generic) AND specific species tags
  - Example: One mule deer image creates 2 rows: one for "animal", one for "mule deer"
  - This is why label-based queries can return more records than expected

### Current Issues

#### Issue 1: Cart Estimate Mismatch
- **Problem**: Cart shows 38 observations, but export returns 725
- **Root Cause**: Cart stores labels extracted from incomplete in-memory data (38 observations), then queries database with those labels and gets ALL matching records (725)
- **Solution**: Use COUNT queries before adding to cart to get accurate estimates

#### Issue 2: "animal" Tag Inflation
- **Problem**: The "animal" tag is generic and appears on most images alongside specific species
- **Impact**: Including "animal" in filters drastically increases result counts
- **Solution**: Either:
  1. Filter out "animal" when more specific tags exist
  2. Make users explicitly choose if they want generic "animal" tag
  3. Show counts per tag so users understand impact

## Recommended Architecture

### Left Sidebar (Observations List)
**Goal**: Show recent observations, paginated/lazy-loaded

```javascript
// Load first batch (most recent 100-1000)
const observations = await animlService.queryImageLabels({
  startDate,
  endDate,
  deploymentIds: [selectedDeploymentId], // if camera-centric
  labels: [selectedLabel], // if animal-centric  
  maxResults: 1000,
  orderBy: 'timestamp DESC'
});

// As user scrolls, load more with offset
const moreObservations = await animlService.queryImageLabels({
  // ... same params
  maxResults: 1000,
  resultOffset: 1000
});
```

### Right Sidebar (Export Tab)
**Goal**: Show accurate counts for filtering

```javascript
// Get counts per deployment (fast!)
const deploymentCounts = await animlService.getObservationCountsPerDeployment({
  startDate,
  endDate
});
// Returns: [{ deployment_id: 3, count: 6515 }, { deployment_id: 61, count: 5691 }, ...]

// Get counts per animal tag (fast!)
const tagCounts = await animlService.getObservationCountsPerLabel({
  startDate,
  endDate,
  deploymentIds: selectedDeploymentIds // optional filter
});
// Returns: [{ label: "mule deer", count: 5589 }, { label: "coyote", count: 2878 }, ...]

// When user selects filters, get accurate total count
const totalCount = await animlService.getImageLabelsCount({
  startDate,
  endDate,
  deploymentIds: selectedDeploymentIds,
  labels: selectedLabels
});
// This is what goes in the cart!
```

### Cart/Export
**Goal**: Export exactly what user sees in counts

```javascript
// When adding to cart:
const cartItem = {
  // ... filters ...
  estimatedCount: totalCount, // From COUNT query, not in-memory data!
};

// When exporting:
// Re-query with exact same filters to get all records
const records = await animlService.queryImageLabels({
  startDate,
  endDate,
  deploymentIds,
  labels,
  maxResults: totalCount + small_buffer
});
```

## Scripts

### `test-count-performance.js`
Tests performance of various count queries. Run with:
```bash
node scripts/animl-eda/test-count-performance.js
```

### `check-animl-cart-query.js`
Analyzes a specific cart query to understand record counts and multi-label behavior. Run with:
```bash
node scripts/animl-eda/check-animl-cart-query.js
```

## Next Steps

1. **Add count query methods to `animlService.ts`**:
   - `getObservationCountsPerDeployment(options)`
   - `getObservationCountsPerLabel(options)`
   - `getImageLabelsCount(options)` (already exists, ensure it's used)

2. **Update `AnimlDetailsSidebar.tsx`** to use count queries for accurate numbers

3. **Update `handleAnimlAddToCart`** in `App.tsx` to query for accurate count before adding

4. **Consider caching**: Cache count results for 30-60 seconds to reduce redundant queries

5. **Handle "animal" tag**: Decide strategy for generic vs. specific tags

