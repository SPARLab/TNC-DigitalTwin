# Animl Service Strategy: Deduplicated vs Flattened

**Date:** December 2, 2025  
**Status:** Using Deduplicated Service (Flattened is broken)

## Quick Summary

The Animl camera trap data is served by two ArcGIS services. We've switched from the **flattened service** (broken) to the **deduplicated service** (working), while preserving the old code for future performance comparison.

## The Two Services

### 1. Flattened Service (Currently Broken ❌)
**URL:** `https://dangermondpreserve-spatial.com/.../Animl/FeatureServer/1`

**Structure:**
- One row per (image, label) combination
- If an image has 3 labels → 3 separate rows
- Easy to query distinct labels with `returnDistinctValues`

**Current Issue:**
- Label column is empty/blank
- Returns 400 errors on all queries
- Waiting for data team to fix

**Example row:**
```json
{
  "animl_image_id": "jldp:abc123",
  "deployment_id": 13,
  "timestamp": "2025-11-20T10:30:00",
  "label": "mule deer"  // ← Single label per row
}
```

### 2. Deduplicated Service (Currently Working ✅)
**URL:** `https://dangermondpreserve-spatial.com/.../Hosted/Animl_Deduplicated/FeatureServer/0`

**Structure:**
- One row per unique image
- Labels are comma-separated in a single field
- Requires local parsing of CSV labels

**Current Status:**
- ✅ Working perfectly
- ✅ 65,330 unique images
- ✅ Recent 2025 data

**Example row:**
```json
{
  "animl_image_id": "jldp:abc123",
  "deployment_id": 13,
  "timestamp_": "2025-11-20",  // ← Note underscore
  "label": "animal, mule deer"  // ← Comma-separated
}
```

## Feature Flag

Located in `src/services/animlService.ts`:

```typescript
/**
 * Feature flag: Use deduplicated service for label queries
 * 
 * TRUE (default): Query deduplicated service, parse comma-separated labels
 * FALSE: Query flattened service with returnDistinctValues (currently broken)
 * 
 * Once flattened service is fixed, toggle to compare performance.
 */
private readonly USE_DEDUPLICATED_FOR_LABELS = true;
```

## Code Changes

### 1. `getDistinctLabelsForDeployment()`

**Deduplicated Strategy (Current):**
```typescript
// Query deduplicated service for a deployment
WHERE deployment_id = 13 AND label NOT LIKE '%person%'

// Parse comma-separated labels locally
labels = "animal, mule deer, coyote".split(',').map(trim)
// Returns: ['animal', 'mule deer', 'coyote']
```

**Flattened Strategy (Preserved):**
```typescript
// Query with returnDistinctValues=true
WHERE deployment_id = 13 AND label NOT IN ('person', 'people')
returnDistinctValues: true  // Server returns unique labels

// Server directly returns: ['animal', 'mule deer', 'coyote']
```

### 2. `getUniqueImageCountForLabel()`

**Deduplicated Strategy (Current):**
```typescript
// Use LIKE to match within comma-separated string
WHERE deployment_id = 13 AND label LIKE '%mule deer%'
returnCountOnly: true

// Deduplicated = one row per image, so count = unique images
```

**Flattened Strategy (Preserved):**
```typescript
// Exact match on label
WHERE deployment_id = 13 AND label = 'mule deer'
GROUP BY animl_image_id

// Count grouped rows = unique images with this label
```

## Performance Comparison

| Metric | Deduplicated (Current) | Flattened (When Fixed) |
|--------|------------------------|------------------------|
| **Total Rows** | ~65K (one per image) | ~200K+ (3 per image avg) |
| **Queries per Search** | 1 large query | 47 small queries (one per deployment) |
| **Network Transfer** | Higher per query | Lower total |
| **Label Matching** | LIKE '%label%' | Exact: label = 'x' |
| **Server Processing** | Minimal | returnDistinctValues, GROUP BY |
| **Client Processing** | Parse CSV strings | None |
| **Current Status** | ✅ Working | ❌ Broken |

**Expected Winner (once fixed):** Probably flattened for query speed, but deduplicated might win on total latency.

## How to Switch Back

Once the data team fixes the flattened service:

1. **Change the flag:**
   ```typescript
   private readonly USE_DEDUPLICATED_FOR_LABELS = false;
   ```

2. **Test performance:**
   - Check console logs for timing
   - Compare total query time (47 queries vs 1)
   - Check for any errors

3. **Compare:**
   - Query speed
   - Error rates
   - User-perceived performance

## Testing Checklist

When flattened service is fixed:

- [ ] Verify label column has data
- [ ] Test `returnDistinctValues` query works
- [ ] Toggle flag to FALSE
- [ ] Run full Animl search
- [ ] Compare timing logs
- [ ] Check for any errors
- [ ] Verify same results as deduplicated
- [ ] Document performance winner

## Notes

- Both strategies filter out "person", "people", "human" labels
- Deduplicated uses `timestamp_` (with underscore), flattened uses `timestamp`
- Deduplicated uses date-only format `DATE '2025-11-20'`, flattened uses datetime
- Both implement retry logic with exponential backoff
- LIKE operator in deduplicated could potentially match substrings incorrectly (e.g., "deer" matches "mule deer" and "red deer")

## Contact

If issues persist, contact data/GIS team about:
- Flattened service label column population
- Layer 1 query capabilities
- Service health monitoring

