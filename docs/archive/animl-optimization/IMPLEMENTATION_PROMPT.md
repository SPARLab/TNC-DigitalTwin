# ANiML Query Optimization - Implementation Prompt

## 🎯 Objective

Integrate the newly optimized ANiML count queries into the application. We've completed testing and benchmarking (see [QUERY_TESTING_GUIDE.md](./QUERY_TESTING_GUIDE.md)) and confirmed significant performance improvements.

## 📊 Performance Results

Our benchmark tests (`scripts/animl-testing/test-all-queries-benchmark.js`) show:

| Query Type | Response Time | Data Size | Notes |
|------------|---------------|-----------|-------|
| **Total Images (All Deployments)** | 473ms | 15 bytes | Using deduplicated service |
| **Single Deployment Count** | 119ms | 13 bytes | Using deduplicated service |
| **Distinct Species** | 113ms | 617 bytes | Using flattened service |
| **Species-specific Count** | 144ms | 899 bytes | Using flattened service |

**Key Improvement**: Using the deduplicated service for total counts is **98.6% smaller** (13 bytes vs 900 bytes) and **17.4% faster** (119ms vs 144ms) than the old GROUP BY approach.

## 🔧 What Needs to Change

### 1. Update `src/services/animlService.ts`

**Two ArcGIS Services to Use:**
- **`Animl_Deduplicated`** (`/Hosted/Animl_Deduplicated/FeatureServer/0`) - Use for total unique image counts
  - Date field: `timestamp_` (use `DATE 'YYYY-MM-DD'` format)
  - Already deduplicated by `animl_image_id`
  - Use `returnCountOnly=true` for fast, tiny responses
  
- **`Animl` (flattened)** (`/Animl/FeatureServer/1`) - Use for species-specific queries
  - Date field: `timestamp` (use `DATE 'YYYY-MM-DD HH:MM:SS'` format)
  - Flattened structure (multiple rows per image for multi-tagged images)
  - Use for getting distinct labels and per-label counts

**Implementation Strategy:**

```typescript
// Query Type 0: Total unique images across ALL deployments (deduplicated service)
// URL: /Hosted/Animl_Deduplicated/FeatureServer/0/query
// Params: where=1=1, returnCountOnly=true
// Use for: Overall totals in animal-centric view

// Query Type 1: Unique images for a SINGLE deployment (deduplicated service)
// URL: /Hosted/Animl_Deduplicated/FeatureServer/0/query
// Params: where=deployment_id = X AND timestamp_ >= DATE 'YYYY-MM-DD' AND timestamp_ <= DATE 'YYYY-MM-DD', returnCountOnly=true
// Use for: Per-camera totals, camera-centric view

// Query Type 2: Get all distinct species labels (flattened service)
// URL: /Animl/FeatureServer/1/query
// Params: where=deployment_id = X AND timestamp >= DATE 'YYYY-MM-DD HH:MM:SS' ..., returnDistinctValues=true, outFields=label
// Use for: Building species filter list, getting available tags

// Query Type 3: Count unique images for a specific species (flattened service)
// URL: /Animl/FeatureServer/1/query
// Params: where=deployment_id = X AND label = 'species' AND timestamp >= ..., groupByFieldsForStatistics=deployment_id,animl_image_id, outStatistics=[count]
// Use for: Species-specific counts (e.g., "Bobcat (5)")
```

### 2. Methods to Update

#### `getUniqueImageCountForDeployment()` (Private)
- **Change FROM**: Using flattened service with GROUP BY
- **Change TO**: Using deduplicated service with `returnCountOnly=true`
- **URL**: `${this.baseUrl}/Hosted/Animl_Deduplicated/FeatureServer/0/query`
- **Date field**: `timestamp_` (not `timestamp`)
- **Date format**: `DATE 'YYYY-MM-DD'` (not `DATE 'YYYY-MM-DD HH:MM:SS'`)
- **Return**: `data.count` (not `data.features?.length`)

#### `getDistinctLabelsForDeployment()` (Private)
- **Keep**: Using flattened service (no changes needed)
- **URL**: `${this.baseUrl}/Animl/FeatureServer/1/query`
- **Date field**: `timestamp`

#### `getUniqueImageCountForLabel()` (Private)
- **Keep**: Using flattened service with GROUP BY (no changes needed)
- **URL**: `${this.baseUrl}/Animl/FeatureServer/1/query`
- **Date field**: `timestamp`
- **Return**: `data.features?.length` (count the grouped results)

#### `getObservationCountsGrouped()` (Public)
- **Update**: The method should work as-is once the three private methods are updated
- **Consider**: Add retry logic for flaky server responses (server often fails on first request)

### 3. Add Retry Logic

The ArcGIS server can be flaky and often fails on the first request. Add retry logic to all query methods:

```typescript
private async fetchWithRetry(url: string, maxRetries = 3): Promise<Response> {
  let lastError: Error;
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetch(url);
      if (response.ok) return response;
      
      // If not ok, treat as error and retry
      lastError = new Error(`HTTP ${response.status}: ${response.statusText}`);
    } catch (error) {
      lastError = error as Error;
      console.warn(`⚠️ Fetch attempt ${attempt}/${maxRetries} failed:`, lastError.message);
      
      if (attempt < maxRetries) {
        // Exponential backoff: 500ms, 1000ms, 2000ms
        await new Promise(resolve => setTimeout(resolve, 500 * Math.pow(2, attempt - 1)));
      }
    }
  }
  throw lastError!;
}
```

Then update all `fetch()` calls to use `this.fetchWithRetry()`.

### 4. Constants to Add

```typescript
// Add these constants at the top of animlService.ts
private readonly deduplicatedServiceUrl = 'https://dangermondpreserve-spatial.com/server/rest/services/Hosted/Animl_Deduplicated/FeatureServer/0';
private readonly flattenedServiceUrl = 'https://dangermondpreserve-spatial.com/server/rest/services/Animl/FeatureServer/1';

// Helper method to format dates correctly for each service
private formatDateForService(date: string, isDeduplicated: boolean): string {
  if (isDeduplicated) {
    // Deduplicated service uses date-only format
    return `DATE '${date.split(' ')[0]}'`;
  } else {
    // Flattened service uses full datetime format
    return `DATE '${date}'`;
  }
}
```

## 📝 Testing Instructions

After implementing the changes:

1. **Run the benchmark script** to verify queries work from the service layer:
   ```bash
   node scripts/animl-testing/test-all-queries-benchmark.js 59 "2024-01-01" "2025-01-01"
   ```

2. **Test in the UI**:
   - Open ANiML data source
   - Switch to camera-centric view
   - Select a deployment (e.g., deployment 59)
   - Verify counts in right sidebar match left sidebar
   - Check console logs for timing and performance

3. **Test animal-centric view**:
   - Switch to animal-centric view (all cameras)
   - Verify total counts are accurate
   - Filter by species and verify filtered counts update correctly
   - Check that deselecting cameras updates counts properly

## ✅ Expected Behavior After Changes

- **Faster initial load**: Count queries should complete in <1 second for single deployments
- **Accurate counts**: Right sidebar should match left sidebar observations
- **Smaller data transfers**: Deduplicated service returns tiny responses (13-15 bytes for counts)
- **Resilient queries**: Retry logic should handle flaky server responses
- **Proper date handling**: Each service uses its correct date field and format

## 🔍 Reference Files

- **Testing Guide**: `docs/animl-optimization/QUERY_TESTING_GUIDE.md`
- **Benchmark Script**: `scripts/animl-testing/test-all-queries-benchmark.js`
- **Current Service Implementation**: `src/services/animlService.ts`
- **UI Component**: `src/components/AnimlDetailsSidebar.tsx`

## 🚨 Important Notes

1. **Don't break existing observation loading**: The changes only affect COUNT queries, not the actual observation data fetching
2. **Maintain backward compatibility**: The `AnimlCountLookups` interface should remain the same
3. **Console logging**: Keep detailed logging during initial rollout to debug any issues
4. **Label filtering**: Remember to exclude 'person' and 'people' labels in all queries

## 🎯 Success Criteria

- [ ] Count queries use deduplicated service for totals
- [ ] Species queries use flattened service for labels and per-species counts
- [ ] Retry logic handles server flakiness
- [ ] Right sidebar counts match left sidebar observations
- [ ] Queries complete in <200ms each
- [ ] Data transfers are minimal (<1KB for typical queries)
- [ ] No linter errors
- [ ] Console logs show successful query execution with timing

---

**Ready to implement!** The testing is complete and the approach is proven to work.

