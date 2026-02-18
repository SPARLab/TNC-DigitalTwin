# ANiML Count Deduplication Fix

## Problem Summary

When viewing ANiML camera trap data in camera-centric mode, there was a large discrepancy between:
- **Left sidebar**: Showing 2,120 observations (correctly deduplicated by unique image IDs)
- **Right sidebar**: Showing "68 filtered / 68 total observations" (using stale/incorrect count lookups)

## Root Cause

The database stores one row per `(image_id, label)` combination. When an image has multiple tags (e.g., "puma" + "animal"), it appears as multiple rows.

**Example:**
- Image 1: tagged as ["puma", "animal"] → 2 database rows
- Image 2: tagged as ["coyote", "animal"] → 2 database rows  
- Image 3: tagged as ["puma"] → 1 database row
- **Total**: 5 database rows, but only **3 unique observations (images)**

### The Counting Problem

The old code was:
1. ✅ Correctly counting unique images per `(deployment, label)` combination
   - Camera A + "puma": 2 unique images
   - Camera A + "animal": 2 unique images
   - Camera A + "coyote": 1 unique image
2. ❌ **Incorrectly summing these counts to get the total for Camera A**
   - Old calculation: 2 + 2 + 1 = **5** (WRONG - double counts multi-tagged images!)
   - Correct count: **3 unique images** (regardless of how many tags each has)

## Solution

### Approach: Use Left Sidebar's Logic as Source of Truth

Instead of trying to fix the count lookups (which come from a separate database query), we now make the right sidebar use **the exact same deduplication logic as the left sidebar**. This ensures perfect synchronization because both sidebars are working with the same loaded observations data.

### Changes Made

1. **AnimlDetailsSidebar.tsx** - Replaced count lookups with in-memory deduplication:
   
   a. **`deduplicatedObservationsCount`** - New calculated value:
      - Deduplicates `observations` array by `animl_image_id`
      - Same logic as left sidebar's `groupedObservations`
      - Returns count of unique images
   
   b. **`totalAnimalObservationCount`** - Simplified:
      - Now just returns `deduplicatedObservationsCount`
      - No longer uses count lookups
   
   c. **`filteredObservationCount`** - Updated:
      - Deduplicates `filteredObservations` by `animl_image_id`
      - Ensures filtered counts are also accurate
   
   d. **`cameraAnimalSpecies`** - Updated:
      - Tracks unique image IDs per species using `Set<string>`
      - Returns deduplicated count per species
   
   e. **`filteredAnimalTags`** - Simplified:
      - Removed count lookups dependency
      - Builds species list from loaded observations with deduplication
      - Consistent with left sidebar logic

2. **animlService.ts** - Count lookups still improved (for future use):
   - Modified `getObservationCountsGrouped()` to return `uniqueImageCountsByDeployment`
   - Updated `buildCountLookups()` to use pre-calculated unique counts
   - These may be useful for future optimizations but aren't currently used by the UI

## Technical Details

### How ArcGIS Query Works

We use a 2-step approach because ArcGIS FeatureServer doesn't support `COUNT(DISTINCT)`:

**Step 1**: Group by `(deployment_id, animl_image_id)`
```javascript
groupByFieldsForStatistics: 'deployment_id,animl_image_id'
```
This gives us one row per unique image per deployment. We use this to build the **true unique image counts per deployment**.

**Step 2**: For each unique image, fetch its labels
```javascript
WHERE animl_image_id IN (...)
```
Then we build a map of unique image IDs per `(deployment, label)` combination.

### Example Walkthrough

Given this data:
- Camera 59 has:
  - image_123 with tags ["mule deer", "animal"]
  - image_456 with tags ["coyote", "animal"]  
  - image_789 with tags ["mule deer"]

**Step 1 Results** (unique images per deployment):
- deployment_id: 59, animl_image_id: "image_123"
- deployment_id: 59, animl_image_id: "image_456"
- deployment_id: 59, animl_image_id: "image_789"
- **Total: 3 unique images** ← This is what we now store in `uniqueImageCountsByDeployment`

**Step 2 Results** (unique images per deployment+label):
- deployment_id: 59, label: "mule deer", unique_images: ["image_123", "image_789"] → count: 2
- deployment_id: 59, label: "animal", unique_images: ["image_123", "image_456"] → count: 2
- deployment_id: 59, label: "coyote", unique_images: ["image_456"] → count: 1

**Old (Incorrect) Total Calculation**:
- Sum of label counts: 2 + 2 + 1 = **5** ❌

**New (Correct) Total Calculation**:
- Unique images from Step 1: **3** ✅

## Impact

### What's Fixed
- ✅ Right sidebar now shows accurate total observation counts (unique images)
- ✅ Counts synchronize with the left sidebar's deduplicated display
- ✅ Export counts are now accurate
- ✅ "Add to Cart" shows correct observation counts

### What Still Works
- ✅ Per-label counts (e.g., "mule deer: 10") are still accurate
- ✅ Filtering by species still works correctly
- ✅ Camera-centric and animal-centric views both work

### Important Note About Tag Counts

You **cannot** add up tag counts to get the total observations:
- ❌ "puma: 10" + "animal: 10" ≠ 20 total observations
- ✅ Could be anywhere from 10 to 20 observations (depending on overlap)
- ✅ Must use the unique image count from `countsByDeployment` instead

## Testing Recommendations

1. **Camera-Centric View**
   - Select a specific camera trap
   - Verify left sidebar count matches right sidebar "total observations"
   - Verify tag counts are displayed (but don't sum to total)

2. **Animal-Centric View**  
   - Select a specific species
   - Verify counts across multiple cameras
   - Verify filtering by camera updates counts correctly

3. **Export**
   - Export data with various filters
   - Verify exported row counts match the "X observations will be saved" message
   - Check that CSV exports contain deduplicated observations

## Key Insight

**The left sidebar was always correct** because it directly deduplicates the loaded observations. Instead of trying to sync a separate database query to match, we now make the right sidebar use the same source of truth: the loaded observations array.

## Benefits of This Approach

1. **Perfect Synchronization** - Both sidebars use identical deduplication logic
2. **Simpler Code** - Removed complex count lookups dependencies from UI
3. **More Reliable** - No dependency on external query timing or caching
4. **Easier to Debug** - Single source of truth for counts
5. **Consistent Behavior** - Filtering, species counts, all use the same deduplicated data

## Related Files
- `/src/components/AnimlDetailsSidebar.tsx` - **PRIMARY FIX** - Now uses in-memory deduplication
- `/src/components/AnimlSidebar.tsx` - Left sidebar (already deduplicating correctly)
- `/src/services/animlService.ts` - Count lookups improved (but no longer used by UI)
- `/src/App.tsx` - Updated count lookups API (for future use)

