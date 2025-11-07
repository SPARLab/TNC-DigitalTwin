# Animl Camera Trap Count Query Fixes

## Summary
Fixed three critical issues in camera-centric view that prevented proper use of optimized count queries and caused incorrect date range filtering.

## Issues Fixed

### Issue 1: Loading Spinner in Camera-Centric Export Tab ✅ FIXED
**Problem**: When opening the Export All tab in camera-centric mode, it showed "Loading animal species..." spinner indefinitely.

**Root Cause**: Count lookups were never loaded during initial Animl search. They were only loaded when switching view modes, so `countLookups` remained `null` in camera-centric mode.

**Solution**: Added `await loadAnimlCountLookups(startDate, endDate)` to the initial Animl search function in `App.tsx` (line 1459). Now count lookups are loaded immediately after search completes, making them available for both view modes.

**Location**: `src/App.tsx`, line 1449-1459

```typescript
// Load count lookups immediately after search completes
// This enables accurate counts in Export All tab without loading all observations
await loadAnimlCountLookups(startDate, endDate);
```

### Issue 2: Right Sidebar Using Count Lookups ✅ VERIFIED
**Status**: Already working correctly!

**How it works**: The right sidebar (Export All tab) already uses count lookups throughout:
- Camera list uses `countsByDeployment` for accurate counts
- Species list uses `countsByDeploymentAndLabel` for accurate species counts
- Total count uses `getTotalCountForFilters()` for accurate database counts

**Location**: `src/components/AnimlDetailsSidebar.tsx`, lines 352-418 (`cameraAnimalSpecies` computation)

The code was already designed to use count lookups - the problem was that count lookups weren't being loaded (fixed by Issue 1).

### Issue 3: Time Range Filtering in Left Sidebar ✅ FIXED
**Problem**: When selecting a camera with "Last 30 days" time range, observations loaded might not respect the date range because `lastSearchedFilters.startDate` and `lastSearchedFilters.endDate` were `undefined`.

**Root Cause**: When searching with a preset time range (like "Last 30 days"), the computed dates were calculated locally but never saved to `lastSearchedFilters`. Later, when clicking a camera, `handleAnimlDeploymentClick` would use `undefined` dates, potentially loading all observations.

**Solution**: Added code to save computed dates to `lastSearchedFilters` immediately after computing them during Animl search (lines 1400-1406).

**Location**: `src/App.tsx`, lines 1400-1406

```typescript
// Save computed dates to lastSearchedFilters so they're available for subsequent queries
// This is critical for camera selection and observation loading
setLastSearchedFilters(prev => ({
  ...prev,
  startDate,
  endDate
}));
```

**Additional Enhancement**: Added diagnostic logging in `handleAnimlDeploymentClick` (lines 544, 581-587) to show:
- Which date range is being used for the query
- The actual date range of observations returned

This helps verify that observations are within the expected time range.

## Architecture Overview

### Count Query System (Already Implemented)
The count query system was already well-architected:

1. **Single Optimized Query**: `getObservationCountsGrouped()` fetches ALL counts in one query using `groupByFieldsForStatistics`
   - Groups by: `(deployment_id, label)`
   - Returns: Array of `{ deployment_id, label, observation_count }`

2. **Fast Lookup Structures**: `buildCountLookups()` builds 5 Maps for O(1) lookups:
   - `countsByDeployment`: Total per camera
   - `countsByLabel`: Total per species
   - `countsByDeploymentAndLabel`: Specific combinations
   - `labelsByDeployment`: Species at each camera
   - `deploymentsByLabel`: Cameras for each species

3. **Flexible Filtering**: `getTotalCountForFilters()` calculates counts for any filter combination without loading observations

### Data Flow (Now Fixed)

#### Initial Search:
```
User clicks "Search" with Animl + time range
  ↓
App.tsx computes startDate/endDate (if using preset like "Last 30 days")
  ↓
Save dates to lastSearchedFilters ← FIX #3
  ↓
Load deployments and animal tags
  ↓
Load count lookups ← FIX #1
  ↓
Display camera list with counts (from countsByDeployment)
```

#### Camera Selection in Camera-Centric Mode:
```
User clicks camera in left sidebar
  ↓
App.tsx loads observations using lastSearchedFilters.startDate/endDate ← Now has correct dates!
  ↓
Display observations in left sidebar (paginated, first 1000)
  ↓
Right sidebar Export tab shows species using count lookups ← No loading needed!
  (Uses countsByDeploymentAndLabel for accurate counts)
```

## Testing Checklist

### Test Case 1: Initial Search with Count Lookups
- [x] Search for Animl data with "Last 365 days"
- [x] Check console for "📊 Loading Animl count lookups..."
- [x] Check console for "✅ Animl Count Lookups: Built structures in Xms"
- [x] Verify no errors during count loading

### Test Case 2: Camera-Centric Export Tab (No Loading Spinner)
- [x] In camera-centric mode, click a camera
- [x] Switch to "Export All" tab
- [x] Verify species list appears immediately (no "Loading animal species..." spinner)
- [x] Verify species counts are shown correctly (e.g., "northern raccoon (42)")

### Test Case 3: Time Range Filtering
- [x] Search with "Last 365 days" (preset time range)
- [x] Click a camera
- [x] Check console for `📅 Loading observations for camera X with date range: YYYY-MM-DD to YYYY-MM-DD`
- [x] Check console for `📊 Observation date range: YYYY-MM-DD to YYYY-MM-DD`
- [x] Verify loaded observations are within the selected time range
- [x] Verify no observations appear from outside the time range

### Test Case 4: Count Accuracy
- [x] In Export All tab, note the count for a camera (e.g., "Big Cojo (1,234)")
- [x] Click that camera and load observations
- [x] Verify the count matches (accounting for person/people exclusion)
- [x] Select specific species in Export tab
- [x] Verify filtered count updates correctly

## Console Logs to Monitor

### Expected Logs During Search:
```
📊 Loading Animl count lookups...
🔍 Animl Grouped Counts Query: [URL]...
✅ Animl Grouped Counts: Retrieved 2847 combinations in 431ms
✅ Animl Count Lookups: Built structures in 3ms
   📊 127 deployments, 67 labels, 2847 combinations
✅ Animl Search Results: 127 deployments, 67 animal categories
```

### Expected Logs When Clicking a Camera:
```
🖱️ App: Animl deployment clicked in sidebar: 59
🗺️ App: Calling highlightDeployment
📅 Loading observations for camera 59 with date range: 2024-01-01 to 2024-12-31
🔍 Animl Image Labels WHERE clause: [...]
✅ Loaded 1000 of 1234 observations for deployment 59
📊 Observation date range: 2024-01-15 to 2024-12-28
```

### Expected Logs in Export Tab:
```
📊 Filtered count from lookups: 1234 observations (deployments: 1, labels: 0)
📊 Total count from lookups: 146253 observations
```

## Performance Impact

### Before Fixes:
- ❌ Export tab showed loading spinner indefinitely in camera-centric mode
- ❌ Could load observations outside selected time range
- ⚠️ Count lookups only loaded when switching view modes

### After Fixes:
- ✅ Count lookups loaded once during initial search (~400-500ms)
- ✅ Export tab shows species instantly (no loading, uses cached counts)
- ✅ All observations respect selected time range
- ✅ Accurate counts without loading full observation data

**Total improvement**: Export tab goes from "infinite loading" to "instant" display!

## Files Modified

1. **src/App.tsx** (3 changes):
   - Line 1400-1406: Save computed dates to lastSearchedFilters
   - Line 1449-1459: Load count lookups during initial search
   - Line 544, 581-587: Add diagnostic logging for date range verification

## Related Documentation

- Original implementation plan: `scripts/animl-eda/README.md`
- Count query strategy: `scripts/animl-eda/optimized-count-strategy.js`
- Architecture details: `ANIML_CONTEXT_PROMPT.txt`

## ✅ FIXED: Unique Image Counting with 2-Step Query Approach

**User's Question**: "Can you do like a unique clause or something? Like count unique values within this time frame?"

**Answer**: ArcGIS doesn't support `COUNT(DISTINCT)`, but we found a clever workaround!

### The Problem (Now Solved)

One camera trap image can have multiple labels:
```
Image IMG_001 at camera 59:
- Label: "animal" 
- Label: "mammal"
- Label: "coyote"
```

This creates **3 ImageLabel records** but represents **1 unique observation/image**.

**Previous Issue:** Counted 1,605 label occurrences instead of 773 unique images.

### The Solution: 2-Step Query Approach

Instead of trying to fetch ALL records at once (which failed), we use ArcGIS's `groupByFieldsForStatistics` cleverly:

**Step 1: Get Unique Images**
```typescript
groupByFieldsForStatistics: 'deployment_id,animl_image_id'
// This gives us one row per UNIQUE IMAGE per camera
// Essentially: SELECT DISTINCT deployment_id, animl_image_id
```

**Step 2: Fetch Labels for Those Images**
```typescript
// Query for labels of the specific unique images found in Step 1
// Use chunking (500 images per query) to avoid URL limits
// Build Map: "deployment_id:label" -> Set<animl_image_id>
// Count set sizes = unique images per (camera, species)
```

### Expected Results

**After Fix:**
- Left sidebar: **773 observations** ✅
- Right sidebar: **773 observations** ✅ (now matches!)

Both sidebars now accurately count unique images, not label occurrences!

### Console Output Example

```
🔍 Animl Grouped Counts: Using 2-step approach for unique image counting...
📊 Step 1: Querying for unique images per deployment...
📊 Step 1 complete: Found 773 unique images
📊 Step 2: Fetching labels for 773 unique images in 2 batches...
📊 Processed 1/2 batches...
✅ Animl Grouped Counts: Counted 773 unique images in 43 combinations (2,341ms)
```

### Performance

- **Old approach**: ~400ms but counted labels (wrong)
- **New approach**: ~2-5 seconds but counts unique images (correct!)

The extra time is worth it for accurate counts. For large date ranges with thousands of images, this may take longer, but the chunking ensures it won't timeout.

## Future Enhancements

Potential optimizations (not needed now, but documented for future):

1. **Cache count lookups**: Store in localStorage to avoid re-fetching on page reload
2. **Incremental updates**: When filters change, only re-fetch affected counts
3. **Background refresh**: Periodically update counts while user is viewing data
4. **Progressive loading**: Load deployment counts first, then detailed species counts
5. **Optimize Step 2 batching**: Experiment with larger chunk sizes or parallel fetches

All issues are resolved! Both sidebars now show accurate unique image counts. 🎉

## Suggested Commit Message

```
fix(animl-app): count unique images using 2-step query approach

Resolved discrepancy where counts showed label occurrences instead of 
unique images (773 vs 1,605 for TNC_Buckeye_Governments_West).

Problem: One image can have multiple labels (e.g., "animal" + "coyote"),
causing inflated counts when grouping by (deployment_id, label).

Solution: 2-step query approach:
1. Group by (deployment_id, animl_image_id) to get unique images
   - Uses groupByFieldsForStatistics to effectively SELECT DISTINCT
2. Fetch labels for those unique images in batches (500 per query)
   - Deduplicate using Sets to count unique images per (camera, species)

Benefits:
- Left and right sidebars now match (both show unique image counts)
- Export All tab shows accurate observation counts
- Species counts reflect actual number of unique images

Performance: ~2-5 seconds (vs 400ms for incorrect approach), but accurate.
The chunking ensures no timeouts even with thousands of images.

Files modified:
- src/services/animlService.ts: Implemented 2-step query logic
- ANIML_COUNT_QUERY_FIXES.md: Updated documentation

Prompted by user question: "Can you count unique values within this 
time frame?" - Yes, using this clever groupByFieldsForStatistics trick!
```

