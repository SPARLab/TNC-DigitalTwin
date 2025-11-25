# Animl Camera Traps - Data Loading Investigation

**Status:** Requires external investigation with data provider  
**Date:** November 25, 2025

## Issue Summary

The Animl Camera Traps data source is not loading any data. Console logs show:
- ✅ Query succeeds with HTTP 200
- ❌ Returns 0 deployments
- ❌ Statistics queries fail with error 400

## Observed Behavior

### Deployment Query
- **Query URL:** `https://dangermondpreserve-spatial.com/.../FeatureServer/0/query?where=1%3D1&outFields=id%2Caniml_dp_id%2Cname&returnGeometry=true&f=json`
- **Response:** Successfully returns, but with 0 features
- **Expected:** Should return camera deployment locations

### Statistics Query
- **Query Type:** Statistics with groupByFieldsForStatistics
- **Error:** HTTP 400 - "Unable to complete operation" / "Unable to perform query operation"
- **Impact:** Cannot fetch observation counts for camera traps

### Date Range in Use
- **Current Filter:** 2024-11-25 to 2025-11-25 (last year from today)
- **Issue:** This date range might be excluding all data if no recent observations exist

## Code Analysis

### Query Implementation (`animlService.ts`)

The deployment query is straightforward:

```typescript
// Line 145-195: queryDeployments method
async queryDeployments(_options: AnimlServiceQueryOptions = {}): Promise<AnimlDeployment[]> {
  const params: AnimlQueryOptions = {
    where: '1=1',
    outFields: 'id,animl_dp_id,name',
    returnGeometry: true,
    f: 'json'
  };
  
  const queryUrl = `${this.baseUrl}/${this.deploymentsLayerId}/query`;
  // ... fetch and process
}
```

**Key Observations:**
1. Uses simple `where: '1=1'` filter (should match all records)
2. No date filtering applied to deployments query
3. No spatial filtering (intentionally disabled due to previous server issues)
4. Requests basic fields only: id, animl_dp_id, name

### Statistics Query Issues

The statistics queries used for counting observations may be incompatible with the ArcGIS service version:

```typescript
// Lines 959-973: Statistics query with grouping
const outStatistics = JSON.stringify([{
  statisticType: 'COUNT',
  onStatisticField: 'label',
  outStatisticFieldName: 'count'
}]);

const params = new URLSearchParams({
  where: whereClause,
  outStatistics: outStatistics,
  groupByFieldsForStatistics: 'label',
  f: 'json'
});
```

## Possible Root Causes

### 1. Empty Dataset (Most Likely)
**Theory:** The FeatureServer has no camera deployment data in layer 0.

**Evidence:**
- Query succeeds but returns 0 features
- No error messages (would expect errors if service was down)
- `where: '1=1'` matches everything, yet returns nothing

**Next Steps:**
- Verify data exists in the ArcGIS service via ArcGIS Online interface
- Check if data was moved to a different layer or service
- Confirm the correct FeatureServer URL

### 2. Date Range Too Restrictive
**Theory:** If all observations are older than November 2024, the "Last Year" filter excludes everything.

**Evidence:**
- Default filter: last 365 days (2024-11-25 to 2025-11-25)
- Camera trap data might only exist from earlier years
- Deployments query doesn't use date filter, but observations query does

**Next Steps:**
- Test with broader date range (e.g., "All Time")
- Query the service directly to check timestamp ranges
- Review when camera traps were last active

### 3. Service Configuration Issues
**Theory:** The FeatureServer endpoints might have changed or require different query parameters.

**Evidence:**
- Statistics queries fail with generic 400 errors
- Multiple fallback strategies in place (suggests historical issues)
- Code comments mention "server issues" and disabled spatial filtering

**Next Steps:**
- Test endpoints directly in browser or Postman
- Check ArcGIS REST Services Directory for layer info
- Verify service capabilities (does it support statistics queries?)
- Review service health/status with IT team

### 4. Permissions/Access Issues
**Theory:** The application may lack permissions to access this specific service.

**Evidence:**
- Other TNC ArcGIS services work correctly
- Deployment query succeeds but returns no data (not a permissions error typically)

**Likelihood:** Low (would expect authentication errors, not empty results)

## Investigation Checklist

### Direct API Testing
- [ ] Test deployment query in browser: `https://dangermondpreserve-spatial.com/server/rest/services/Animl/FeatureServer/0/query?where=1=1&outFields=*&f=json`
- [ ] Check service metadata: `https://dangermondpreserve-spatial.com/server/rest/services/Animl/FeatureServer/0?f=json`
- [ ] Verify record count in service info
- [ ] Test with different query parameters (outFields=*, returnGeometry=false)

### Data Verification
- [ ] Confirm data exists in ArcGIS Online web interface
- [ ] Check most recent observation timestamp
- [ ] Verify deployment locations are within expected area
- [ ] Confirm layer index (is it really layer 0?)

### Service Configuration
- [ ] Check service capabilities (supportsStatistics, supportsAdvancedQueries)
- [ ] Review recent service changes or migrations
- [ ] Verify URL endpoints haven't changed
- [ ] Test from different network (rule out firewall/VPN issues)

### Code Changes to Try
- [ ] Add more detailed error logging
- [ ] Test without date filters (for observations)
- [ ] Try alternative deduplicated service URLs
- [ ] Implement retry logic for statistics queries

## Relevant Code Locations

- **Service Class:** `src/services/animlService.ts`
  - `queryDeployments()` - Line 145
  - `queryImageLabels()` - Line 1082
  - `getObservationCountsGrouped()` - Line 466
  - `getAnimalCategoryCounts()` - Line 926

- **View Component:** `src/components/dataviews/WildlifeAnimlView.tsx`
- **Sidebar Component:** `src/components/AnimlSidebar.tsx`

## Recommendations

### Short-term Actions
1. **Test the service directly** using a web browser or API client to confirm data exists
2. **Review with data team** to verify the service URL and layer indices
3. **Try broader date ranges** to see if data appears (change "Last Year" to "All Time")
4. **Check service logs** on the ArcGIS Server side (if available)

### Long-term Considerations
- Add service health checks/monitoring for all data sources
- Implement better error messages for empty results vs. failed queries
- Consider caching service metadata (capabilities, field names, etc.)
- Add data freshness indicators to UI (show timestamp of most recent data)

## Notes

- Spatial filtering was intentionally disabled in previous commits due to server issues
- The service uses multiple endpoints for different query types:
  - `/FeatureServer/0` - Deployments (camera locations)
  - `/FeatureServer/1` - Image Labels (observations) 
  - Hosted/Animl_Deduplicated - Optimized service for counting
- Statistics queries have had historical reliability issues, hence fallback methods exist

---

**Action Required:** External investigation with ArcGIS administrator or data team to verify service status and data availability.

