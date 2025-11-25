# ANiML Count Optimization - Implementation Status

## ✅ Completed

### 1. Service Layer (`src/services/animlService.ts`) ✅
- Added `AnimlGroupedCount` interface for grouped count results
- Added `AnimlCountLookups` interface for lookup structures
- Implemented `getObservationCountsGrouped()` - Single optimized query that gets ALL counts grouped by (deployment_id, label)
- Implemented `buildCountLookups()` - Processes grouped counts into 5 Map structures for O(1) lookups
- Implemented `getTotalCountForFilters()` - Calculate total for any filter combination
- Performance: ~150ms query + <1ms processing

### 2. App.tsx State & Functions ✅  
- Added `animlCountLookups` state to store count lookup structures
- Added `animlCountsLoading` state for loading indicator
- Implemented `loadAnimlCountLookups()` function to fetch and build count lookups
- Updated `handleAnimlViewModeChange()` to load counts when view mode changes
- Added `AnimlCountLookups` to imports
- Passing `countLookups` and `countsLoading` props to `AnimlDetailsSidebar`

### 3. AnimlDetailsSidebar Props ✅
- Updated interface to accept `countLookups` and `countsLoading` props
- Added imports for `AnimlCountLookups` and `animlService`
- Updated component destructuring to receive new props

### 4. EDA Scripts ✅
- Created comprehensive test scripts in `scripts/animl-eda/`
- Documented performance findings (85-335ms for count queries)
- Demonstrated the optimized single-query approach
- Identified root cause of cart export mismatch (in-memory vs database counts)

## 🚧 Remaining Work

### 1. AnimlDetailsSidebar - Use Count Lookups for Display
**File:** `src/components/AnimlDetailsSidebar.tsx`

Currently the component calculates counts from `observations` array in memory:
```typescript
// OLD (lines ~317-335):
const filteredObservations = useMemo(() => {
  let filtered = animalOnlyObservations;
  if (effectiveDeploymentIds.length > 0) {
    filtered = filtered.filter(obs => effectiveDeploymentIds.includes(obs.deployment_id));
  }
  if (selectedLabels.length > 0) {
    filtered = filtered.filter(obs => selectedLabels.includes(obs.label));
  }
  return filtered;
}, [animalOnlyObservations, effectiveDeploymentIds, selectedLabels]);
```

**TODO:** Replace with count lookups:
```typescript
const filteredObservationCount = useMemo(() => {
  if (!countLookups) {
    // Fallback to in-memory counting if lookups not loaded
    return filteredObservations.length;
  }
  
  // Use animlService.getTotalCountForFilters() for accurate count
  return animlService.getTotalCountForFilters(
    countLookups,
    effectiveDeploymentIds,
    selectedLabels
  );
}, [countLookups, effectiveDeploymentIds, selectedLabels]);
```

### 2. Update Count Displays in Export Tab
**File:** `src/components/AnimlDetailsSidebar.tsx`

Update the count display text (search for "{filtered Observations.length} observations"):
```typescript
// OLD:
{filteredObservations.length} of {animalOnlyObservations.length} observations

// NEW:
{countsLoading ? '...' : filteredObservationCount} observations
```

### 3. Update handleAnimlAddToCart to Use Accurate Count
**File:** `src/App.tsx` (line ~791)

Currently uses `animlFilteredObservations.length`. Update to use count lookups:

```typescript
const handleAnimlAddToCart = async (filteredCount: number) => {
  if (!hasSearched) {
    toast.error('No data to add to cart');
    return;
  }

  // If count lookups are available, recalculate for accuracy
  let accurateCount = filteredCount;
  if (animlCountLookups) {
    const effectiveDeploymentIds = animlCustomFilters.deploymentIds && animlCustomFilters.deploymentIds.length > 0
      ? animlCustomFilters.deploymentIds
      : (animlViewMode === 'camera-centric' && selectedAnimlDeployment
          ? [selectedAnimlDeployment.id]
          : []);
          
    accurateCount = animlService.getTotalCountForFilters(
      animlCountLookups,
      effectiveDeploymentIds,
      animlCustomFilters.labels || []
    );
    
    console.log(`🛒 Recalculated count using lookups: ${accurateCount} (was ${filteredCount})`);
  }
  
  // ... rest of function using accurateCount
};
```

### 4. Call loadAnimlCountLookups on Initial Search
**File:** `src/App.tsx`

Find where Animl data is initially loaded (when user clicks Search) and add:
```typescript
// After loading deployments and animal tags
await loadAnimlCountLookups(startDate, endDate);
```

### 5. Add Loading States to UI
**File:** `src/components/AnimlDetailsSidebar.tsx`

Show loading indicator while counts are being fetched:
```typescript
{countsLoading && (
  <div className="text-sm text-gray-500">
    Loading counts...
  </div>
)}
```

## 📊 Expected Benefits

Once complete:
- ✅ **Accurate counts**: Queries database directly, not limited by in-memory data
- ✅ **Fast**: Count queries < 200ms, lookups < 0.01ms
- ✅ **No mismatch**: Export will match estimated count exactly
- ✅ **Scalable**: Works with any data size (not limited by pagination)
- ✅ **Better UX**: User sees real numbers before exporting

## 🧪 Testing Checklist

After implementation:
1. [ ] Switch between camera-centric and animal-centric modes - counts should load quickly
2. [ ] Select different camera traps - counts should update instantly
3. [ ] Select different animal tags - counts should update instantly
4. [ ] Add to cart - estimated count should be accurate
5. [ ] Export from cart - should get exactly the estimated number of records
6. [ ] Compare: cart estimate (e.g., 8,703) should match export row count
7. [ ] Verify counts match database query (use `scripts/animl-eda/check-animl-cart-query.js`)

## 📝 Next Steps

1. Complete remaining TODOs in AnimlDetailsSidebar
2. Update handleAnimlAddToCart
3. Add loadAnimlCountLookups call on initial search
4. Test thoroughly with real data
5. Commit changes with message below

## 💾 Suggested Commit Message

```
feat(animl): implement optimized count queries for accurate export estimates

- Add getObservationCountsGrouped() to fetch all counts in single query (~150ms)
- Add buildCountLookups() to create Map structures for O(1) count lookups
- Add getTotalCountForFilters() helper for calculating filtered counts
- Add count lookups state management in App.tsx
- Update AnimlDetailsSidebar to accept and use count lookups
- Create EDA scripts documenting performance and strategy

This fixes the cart export mismatch issue where estimates showed 38 but
exports contained 42-725 records. Root cause was counting in-memory data
(paginated/incomplete) vs querying database (complete). Now queries database
for accurate counts before adding to cart.

Performance: Single 150ms query replaces multiple queries (~450ms total).
All subsequent count lookups are instant (<0.01ms).

Related: scripts/animl-eda/FINDINGS.md, scripts/animl-eda/README.md
```

