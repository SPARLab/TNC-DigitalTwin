# eBird Query Debugging Guide

## Problem
eBird searches are returning only 500 observations regardless of the time range (1 year vs 5 years).

## Diagnostic Test Script

A test script has been created to help diagnose the issue: `src/test-ebird-queries.ts`

### How to Run Tests

1. **Start the dev server** (if not already running):
   ```bash
   npm run dev
   ```

2. **Open browser console** (F12 or Cmd+Option+I on Mac)

3. **Run the test**:
   ```javascript
   testEBirdQueries()
   ```

4. **Review the results** in the console

### What the Tests Check

The test script runs 11 different query scenarios:

1. **Default query** (no filters)
2. **Last 1 year** with default maxResults=2000
3. **Last 5 years** with default maxResults=2000
4. **Last 1 year** with maxResults=500
5. **Last 1 year** with maxResults=1000
6. **Last 1 year** with maxResults=2000, pageSize=2000
7. **Last 5 years** with maxResults=5000, pageSize=5000
8. **Preserve-only** search mode
9. **Expanded** search mode (1.5 mile buffer)
10. **Direct count query** for 1 year
11. **Direct count query** for 5 years

## Possible Issues to Check

### 1. ArcGIS Service Level Limits

The ArcGIS Feature Service may have a `maxRecordCount` setting that caps results:

- **Check service metadata**: 
  ```
  https://dangermondpreserve-spatial.com/server/rest/services/Hosted/Dangermond_Preserve_eBird_Exact_Boundary_133M_Dataset_/FeatureServer/0
  ```
  
- Look for:
  - `maxRecordCount`: Maximum records per request
  - `supportsPagination`: Whether pagination is supported
  - `advancedQueryCapabilities`: Available query features

### 2. Code-Level Issues

**Files to check:**

- `src/services/eBirdService.ts` (lines 99-104)
  - Default `maxResults = 2000`
  - Default `pageSize = 500`
  
- `src/components/MapView/loaders/eBirdLoader.ts` (lines 56-64)
  - Query parameters passed to service
  - **Recent fix**: `pageSize` now defaults to `maxResults`

### 3. Pagination Implementation

Currently, the code only makes **ONE request**. If the ArcGIS service has a hard limit (e.g., 500 or 1000 records), you'll need to implement pagination:

```typescript
// Example pagination logic
let allObservations = [];
let page = 1;
let hasMore = true;

while (hasMore && allObservations.length < maxResults) {
  const response = await eBirdService.queryObservations({
    ...filters,
    page,
    pageSize: 500
  });
  
  allObservations.push(...response.observations);
  hasMore = response.exceededLimit;
  page++;
}
```

## Expected Results

If working correctly, you should see:
- **1 year query**: More than 500 observations (if available in data)
- **5 year query**: Significantly more observations than 1 year
- **Count queries**: Show total available records in database

If all queries return exactly 500:
- ⚠️ Likely a service-level cap
- Need to implement pagination

## Next Steps

1. **Run the diagnostic test** and review results
2. **Check ArcGIS service metadata** for hard limits
3. **Compare count vs fetched records** - if count > 500 but fetched = 500, pagination is needed
4. **Implement pagination** if service supports it
5. **Consider alternative approaches**:
   - Request access to higher service limits
   - Use different data endpoints if available
   - Implement client-side caching/progressive loading

## Files Modified

- `src/test-ebird-queries.ts` - Diagnostic test script
- `src/App.tsx` - Auto-loads test in dev mode
- `src/components/MapView/loaders/eBirdLoader.ts` - Fixed pageSize to match maxResults

## Commit Message

```
debug(eBird): add query diagnostic test script

- Create comprehensive test suite for eBird query parameters
- Test various maxResults, pageSize, and date range combinations
- Add direct count queries to compare against fetched results
- Auto-load test utilities in development mode
- Help identify service-level limits and pagination needs
```
