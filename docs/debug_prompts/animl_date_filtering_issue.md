# Debug Prompt: Animl Date Filtering Issue

## Context
We're working on the TNC Digital Twin application. The Animl Camera Traps feature queries an ArcGIS MapServer to get camera trap images and their animal labels.

## Problem
The date filtering for Animl queries is not working correctly:

1. **Animal tag counts don't change** when changing the time range (e.g., "Last year" vs "Last 5 years" shows identical counts)
2. **Cameras with no data in the date range** are still being displayed
3. The ArcGIS server was ignoring `DATE 'YYYY-MM-DD'` syntax in WHERE clauses

## Key Files
- `src/services/animlService.ts` - Contains all Animl API query methods
- `src/services/cacheService.ts` - Frontend caching utility
- `src/App.tsx` - Main app, handles Animl search flow

## What Was Tried
1. Changed from `DATE 'YYYY-MM-DD'` syntax to Unix timestamps (milliseconds) for all date filters
2. Added client-side date filtering as a safety net in `queryImageLabels`
3. Modified search flow to filter out cameras/tags with no data in the date range

## Key Methods to Investigate
1. `getObservationCountsGroupedCached()` - Returns counts by deployment and label
2. `getAnimalCategoryCountsCached()` - Returns animal tag list with counts
3. `getUniqueImageCountForDeployment()` - Counts unique images for a camera
4. `getDistinctLabelsForDeployment()` - Gets unique labels for a camera
5. `getUniqueImageCountForLabel()` - Counts images for a specific label

## Cache Debug
In browser console:
- `__cacheDebug.showCacheKeys()` - Shows all cached data
- `__cacheDebug.clearAniml()` - Clears Animl cache
- `__cacheDebug.clearAll()` - Clears all cache

## Expected Behavior
1. When searching with "Last year", only cameras with observations in the last year should appear
2. Animal tag counts should reflect observations in the selected date range
3. Clicking a camera should only show observations from the selected date range

## How to Test
1. Clear cache: `__cacheDebug.clearAll()`
2. Search Animl with "Last year" time range
3. Note the animal tag counts
4. Change to "Last 5 years" and search again
5. Counts should be DIFFERENT (higher for 5 years)
6. Click on a camera - observations should be within date range

## Technical Notes
- ArcGIS MapServer stores timestamps as Unix epoch milliseconds
- The flattened service is at MapServer/4
- The deduplicated service is at MapServer/3
- WHERE clause format: `timestamp >= 1733270400000 AND timestamp <= 1733356799000`

