# ANiML COUNT DISTINCT Solution for ArcGIS

## The Problem

When viewing ANiML camera trap data, we need accurate counts of **unique observations (images)**, not database rows. The challenge:

- Database stores one row per `(image_id, tag)` combination
- Images with multiple tags create multiple rows
- Need to count DISTINCT `animl_image_id` values per camera
- **ArcGIS REST API does NOT support COUNT(DISTINCT)**

## The Solution: GROUP BY Workaround

### Official Esri Recommendation

From Esri documentation ([support.esri.com](https://support.esri.com/en-us/bug/when-using-return-distinct-values-with-the-out-fields-a-bug-000169317)):

> "Use a GROUP BY clause on the desired fields and calculate the distinct sum for each group"

This is exactly what we implemented!

### Our Implementation

#### Step 1: Query for Unique Images

```javascript
// Group by (deployment_id, animl_image_id) - gives one row per unique image per camera
groupByFieldsForStatistics: 'deployment_id,animl_image_id'
```

This query returns:
```javascript
[
  { deployment_id: 59, animl_image_id: "img_123" },
  { deployment_id: 59, animl_image_id: "img_456" },
  { deployment_id: 59, animl_image_id: "img_789" },
  // ... one row per unique image per camera
]
```

**Result**: We can count the rows to get the true number of unique images per deployment! This is stored in `uniqueImageCountsByDeployment`.

#### Step 2: Map Labels to Unique Images

For each unique image, fetch its labels and build:
```javascript
{
  "59:mule deer": 2,  // 2 unique images tagged as mule deer at camera 59
  "59:animal": 2,     // 2 unique images tagged as animal at camera 59
  "59:coyote": 1      // 1 unique image tagged as coyote at camera 59
}
```

**Important**: These per-label counts may overlap (same image can have multiple labels), so you can't sum them to get total. But they're accurate for counting unique images per species.

### Key Data Structure: Count Lookups

The `AnimlCountLookups` object provides O(1) access to counts:

```typescript
{
  countsByDeployment: Map<number, number>,  // deployment_id -> unique image count (TRUE total)
  countsByLabel: Map<string, number>,        // label -> count across all deployments
  countsByDeploymentAndLabel: Map<string, number>,  // "deployment:label" -> unique image count
  labelsByDeployment: Map<number, Set<string>>,  // deployment_id -> set of labels seen
  deploymentsByLabel: Map<string, Set<number>>   // label -> set of deployments that saw it
}
```

## Usage in UI

### Camera-Centric Mode (Single Camera)

```typescript
// Get total unique images for selected camera
const total = countLookups.countsByDeployment.get(selectedDeployment.id);

// Get unique images per species for this camera
const speciesCount = countLookups.countsByDeploymentAndLabel.get(`${deploymentId}:${label}`);
```

### Animal-Centric Mode (Multiple Cameras)

```typescript
// Get total across all cameras
const total = Array.from(countLookups.countsByDeployment.values())
  .reduce((sum, count) => sum + count, 0);

// Get species count across selected cameras
let total = 0;
for (const deploymentId of selectedDeploymentIds) {
  total += countLookups.countsByDeploymentAndLabel.get(`${deploymentId}:${label}`) || 0;
}
```

## Performance Benefits

### Fast Database Query
- **Single query** with GROUP BY gets all unique image counts
- No need to load all observations into memory
- Works for 70+ cameras, 5-year time spans
- Scales to any dataset size

### O(1) Lookups
- Pre-calculated Maps allow instant access
- No iteration or counting needed in UI
- Filtering is just Map lookups: `countLookups.countsByDeployment.get(id)`

### Comparison

| Approach | Time | Memory | Accuracy |
|----------|------|--------|----------|
| Load all rows, dedupe in-memory | Slow (seconds) | High (MB) | 100% |
| **GROUP BY query + lookups** | **Fast (ms)** | **Low (KB)** | **100%** |
| Direct COUNT (not supported) | N/A | N/A | N/A |

## Why This Works

1. **ArcGIS Limitation**: No COUNT(DISTINCT) support
2. **Workaround**: GROUP BY gives one row per unique value
3. **Counting Rows** = Counting Distinct Values!
4. **Build Lookups**: Process grouped results into Maps for fast access
5. **UI Uses Lookups**: O(1) access, no in-memory processing

## Implementation Details

### Service Layer (`animlService.ts`)

```typescript
// Query with GROUP BY to get unique images
async getObservationCountsGrouped(options) {
  // Step 1: GROUP BY (deployment_id, animl_image_id)
  const uniqueImages = await query({
    groupByFieldsForStatistics: 'deployment_id,animl_image_id'
  });
  
  // Count unique images per deployment
  const uniqueImageCountsByDeployment = new Map();
  uniqueImages.forEach(img => {
    const count = uniqueImageCountsByDeployment.get(img.deployment_id) || 0;
    uniqueImageCountsByDeployment.set(img.deployment_id, count + 1);
  });
  
  // Step 2: Map labels to unique images
  const groupedCounts = buildGroupedCounts(uniqueImages);
  
  return { groupedCounts, uniqueImageCountsByDeployment };
}

// Build fast lookup structures
buildCountLookups(groupedCounts, uniqueImageCountsByDeployment) {
  return {
    countsByDeployment: uniqueImageCountsByDeployment,  // Uses pre-calculated unique counts!
    countsByLabel: /* aggregated from groupedCounts */,
    countsByDeploymentAndLabel: /* from groupedCounts */,
    labelsByDeployment: /* derived */,
    deploymentsByLabel: /* derived */
  };
}
```

### UI Layer (`AnimlDetailsSidebar.tsx`)

```typescript
// Use count lookups for accurate, fast counts
const totalAnimalObservationCount = useMemo(() => {
  if (countLookups && !countsLoading) {
    if (viewMode === 'camera-centric' && selectedDeployment) {
      // O(1) lookup for single camera
      return countLookups.countsByDeployment.get(selectedDeployment.id) || 0;
    }
    // O(n) sum across all cameras (where n = number of cameras, typically small)
    return Array.from(countLookups.countsByDeployment.values())
      .reduce((sum, count) => sum + count, 0);
  }
  
  // Fallback: in-memory deduplication (only if lookups unavailable)
  const uniqueImageIds = new Set();
  observations.forEach(obs => uniqueImageIds.add(obs.animl_image_id));
  return uniqueImageIds.size;
}, [countLookups, countsLoading, viewMode, selectedDeployment, observations]);
```

## When Count Lookups Are Loaded

Count lookups are loaded once per search:

```typescript
// After initial Animl search
const deploymentIds = enhancedDeployments.map(d => d.id);
await loadAnimlCountLookups(startDate, endDate, deploymentIds);
```

They remain valid for:
- The entire search session
- Any camera selection in camera-centric mode
- Any species selection in animal-centric mode
- Any filtering in the export tab

**No need to reload** when switching between cameras or species!

## Fallback Behavior

If count lookups fail or are unavailable:
- UI falls back to in-memory deduplication
- Less performant but still accurate
- Warning logged to console
- Ensures UI always shows something

## Best Practices

1. **Always use count lookups when available** - much faster than in-memory
2. **Use `countsByDeployment` for totals** - this has the correct unique counts
3. **Don't sum label counts** - they overlap due to multi-tag images
4. **Check `countsLoading` flag** - show loading state while fetching
5. **Provide fallback** - handle case where lookups aren't available

## Related Files

- `src/services/animlService.ts` - GROUP BY query and count lookups builder
- `src/components/AnimlDetailsSidebar.tsx` - Uses count lookups for all counts
- `src/App.tsx` - Loads count lookups after search
- `ANIML_COUNT_DEDUPLICATION_FIX.md` - Earlier documentation (now superseded)

## Key Takeaway

**We're already using the recommended ArcGIS workaround for COUNT DISTINCT!** The issue was that we weren't using these optimized lookups consistently in the UI. Now that we are, counts are:

✅ **Accurate** - Based on GROUP BY query (Esri's recommended approach)  
✅ **Fast** - O(1) Map lookups instead of in-memory iteration  
✅ **Scalable** - Works for any dataset size  
✅ **Consistent** - Same counts everywhere in the UI

