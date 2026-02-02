# Animl Lazy Loading Optimization

## Overview
Optimize Animl data loading to improve initial page load performance by only fetching observations when needed, rather than loading all observations upfront.

## Current Behavior
- On search: Fetches ALL deployments AND ALL observations (up to 1000 limit)
- Then aggregates observations into animal categories
- This is slow for large datasets

## New Behavior
1. **On Search**: 
   - Fetch all camera deployments (small dataset, fast)
   - Fetch animal category counts using ArcGIS statistics query (no observation data)
   - Show categories with counts immediately
   - **Do NOT fetch observations yet**

2. **On Category Click**:
   - Fetch observations for that specific category only
   - Limit to first 100 observations (with pagination support)
   - Show loading state while fetching

## Implementation Details

### Service Changes (`animlService.ts`)
- Added `getAnimalCategoryCounts()` method using ArcGIS statistics query
- Falls back to individual count queries if statistics query fails
- Modified `queryImageLabels()` to support category-specific filtering

### App Changes (`App.tsx`)
- Initial search: Only fetch deployments and category counts
- `handleAnimlAnimalTagClick()`: Now async, fetches observations when category is clicked
- Added `animlLoadingObservations` state for loading indicator

### Component Changes
- `AnimlSidebar`: Added `loadingObservations` prop to show loading state
- Back button clears observations when navigating back

## Benefits
- **Faster initial load**: Only fetch counts, not all data
- **Better UX**: Users see categories immediately, load details on demand
- **Scalable**: Works with datasets of any size
- **Reduced server load**: Only fetch what's needed

## Future Enhancements
- Pagination for observations (load more button)
- Cache observations per category
- Prefetch next page while user scrolls

