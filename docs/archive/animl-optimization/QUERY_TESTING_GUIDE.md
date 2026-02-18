# ANiML Query Testing Guide

**Purpose**: Test each ArcGIS query independently to verify performance and correctness before integration.

## 🎉 NEW: Deduplicated Service Available!

We now have **two feature services**:

1. **`Animl_Deduplicated`** (NEW!) - One row per unique image
   - Use for: Total image counts
   - Benefits: Fast, tiny responses, no GROUP BY needed
   - **Date field**: `timestamp_` (with underscore)
   - **Date syntax**: `DATE 'YYYY-MM-DD'` (date only, no time)
   
2. **`Animl` (Original)** - One row per image-label combination (flattened)
   - Use for: Per-label counts, species filtering
   - Why: Allows filtering by individual labels
   - **Date field**: `timestamp` (no underscore)
   - **Date syntax**: `DATE 'YYYY-MM-DD HH:MM:SS'` (with time)

### ⚠️ Important: Date Format Differences

| Service | Field Name | Date Format | Example |
|---------|-----------|-------------|---------|
| **Deduplicated** | `timestamp_` | `DATE 'YYYY-MM-DD'` | `timestamp_ >= DATE '2024-01-01'` |
| **Flattened** | `timestamp` | `DATE 'YYYY-MM-DD HH:MM:SS'` | `timestamp >= DATE '2024-01-01 00:00:00'` |

## Quick Links

- [All Queries Overview](#all-queries-overview)
- [Query Type 0: Simple Row Count](#query-type-0-simple-row-count-deduplicated)
- [Query Type 1: Total Unique Images](#query-type-1-total-unique-images-deduplicated)
- [Query Type 2: Distinct Species](#query-type-2-distinct-species-labels-flattened)
- [Query Type 3: Per-Species Counts](#query-type-3-unique-images-for-specific-species-flattened)
- [Postman Collection](#postman-collection)
- [Testing Scripts](#testing-scripts)
- [Troubleshooting](#troubleshooting)

---

## All Queries Overview

We use **4 types of queries** for ANiML data:

### Query Type 0: Simple Row Count ✨ DEDUPLICATED
**Purpose**: Count all unique images (fast test)  
**Service**: `Animl_Deduplicated` (new!)  
**Method**: returnCountOnly=true  
**Returns**: Single count value  
**Speed**: ~50ms, ~20 bytes

### Query Type 1: Total Unique Images per Deployment ✨ DEDUPLICATED
**Purpose**: Count unique images at a specific camera for a date range  
**Service**: `Animl_Deduplicated` (new!)  
**Method**: returnCountOnly=true with WHERE clause (no GROUP BY needed!)  
**Returns**: Single count value  
**Speed**: ~50ms, ~20 bytes

### Query Type 2: Get Distinct Species Labels 📋 FLATTENED
**Purpose**: Get list of species observed at a camera  
**Service**: `Animl` (original flattened)  
**Method**: returnDistinctValues on label field  
**Returns**: Array of unique label values  
**Why flattened?**: Each label is a separate row, easy to get distinct list

### Query Type 3: Get Unique Images for a Specific Species 📋 FLATTENED
**Purpose**: Count unique images of a specific species at a camera  
**Service**: `Animl` (original flattened)  
**Method**: GROUP BY with label filter  
**Returns**: Array of grouped features (count the array length)  
**Why flattened?**: Can filter WHERE label = 'mule deer' efficiently

---

## Query Type 0: Simple Row Count (DEDUPLICATED)

### Purpose

✨ **Uses the NEW deduplicated service!** This gives us accurate unique image counts with tiny, fast responses.

### Base URL
```
https://dangermondpreserve-spatial.com/server/rest/services/Hosted/Animl_Deduplicated/FeatureServer/0/query
```

### Parameters

| Parameter | Value | Purpose |
|-----------|-------|---------|
| `where` | `1=1` | Get all records (no filter) |
| `returnCountOnly` | `true` | Return ONLY the count |
| `f` | `json` | Response format |

### Full Example URL

```
https://dangermondpreserve-spatial.com/server/rest/services/Hosted/Animl_Deduplicated/FeatureServer/0/query?where=1%3D1&returnCountOnly=true&f=json
```

### Expected Response

```json
{
  "count": 8432
}
```

**Response Size**: ~20 bytes  
**Speed**: Very fast (~50ms)

### How to Read Result

**Total unique images in database = `count` value**

✅ **This IS the unique image count!** Each row is one unique image.

**Example:**
- `count: 8432` = 8,432 total unique images across all deployments

### Why This Query?

This query verifies:
1. The deduplicated service is working
2. We have data in the service
3. `returnCountOnly` returns a simple number
4. Response is fast and tiny

### Performance Benchmarks

| Filter | Images | Response Time | Response Size |
|--------|--------|---------------|---------------|
| All images | ~8,432 | ~50ms | ~20 bytes |
| Single deployment | ~373 | ~40ms | ~20 bytes |
| Date filtered | ~2,500 | ~45ms | ~20 bytes |

### Comparison: Deduplicated vs Flattened

| Service | Query Method | Response Size | Speed | Unique Count? |
|---------|-------------|---------------|-------|---------------|
| ✨ Deduplicated | `returnCountOnly` | 20 bytes | 50ms | ✅ Yes! |
| Old Flattened | `GROUP BY` | 60KB | 200ms | ✅ Yes (but slow) |
| Old Flattened | `returnCountOnly` | 20 bytes | 50ms | ❌ No (duplicates) |

---

## Query Type 1: Total Unique Images (DEDUPLICATED)

✨ **Much faster and simpler with the deduplicated service!** No GROUP BY needed!

### Base URL
```
https://dangermondpreserve-spatial.com/server/rest/services/Hosted/Animl_Deduplicated/FeatureServer/0/query
```

### Parameters

⚠️ **Important Notes:**
- The timestamp field is `timestamp_` (with underscore) in the deduplicated service
- Use `DATE 'YYYY-MM-DD'` format (date only, no time component)

| Parameter | Value | Purpose |
|-----------|-------|---------|
| `where` | `deployment_id = 59 AND timestamp_ >= DATE '2024-01-01' AND timestamp_ <= DATE '2025-01-01'` | Filter by camera and date |
| `returnCountOnly` | `true` | Return ONLY the count |
| `f` | `json` | Response format |

### Full Example URL

```
https://dangermondpreserve-spatial.com/server/rest/services/Hosted/Animl_Deduplicated/FeatureServer/0/query?where=deployment_id%20%3D%2059%20AND%20timestamp_%20%3E%3D%20DATE%20%272024-01-01%27%20AND%20timestamp_%20%3C%3D%20DATE%20%272025-01-01%27&returnCountOnly=true&f=json
```

### Expected Response

```json
{
  "count": 628
}
```

**Response Size**: ~20 bytes (vs 30KB with old GROUP BY!)  
**Speed**: ~50ms (vs 200ms with old GROUP BY!)

### How to Read Result

**Total unique images = `count` value**

✅ Simple! Just read the number.

Example: `count: 373` = **373 unique images** at deployment 59 for this date range.

### Performance Benchmarks

| Deployment | Date Range | Unique Images | Response Time | Response Size |
|------------|-----------|---------------|---------------|---------------|
| 59 | 2024 (1 year) | 628 | ~50ms | ~20 bytes |
| All | All time | 65,330 | ~50ms | ~20 bytes |
| All (70 parallel) | 1 year | ~8,000 | ~500ms | ~1.4 KB total |

### Comparison: Deduplicated vs Old GROUP BY

| Method | Response | Speed | Size |
|--------|----------|-------|------|
| ✨ Deduplicated `returnCountOnly` | `{ "count": 628 }` | 50ms | 20 bytes |
| Old `GROUP BY` | 628 feature objects | 200ms | ~50 KB |

**Improvement**: 4x faster, 99.9% smaller response! 🚀

---

## Query Type 2: Distinct Species Labels (FLATTENED)

📋 **Still uses the original flattened service** because we need individual label rows.

### Why Flattened?

The deduplicated service stores all labels for an image in one field (e.g., `"mule deer, animal, mammal"`). To get a clean list of distinct labels, it's easier to query the flattened service where each label is a separate row.

### Base URL
```
https://dangermondpreserve-spatial.com/server/rest/services/Animl/FeatureServer/1/query
```

### Parameters

| Parameter | Value | Purpose |
|-----------|-------|---------|
| `where` | `deployment_id = 59 AND timestamp >= DATE '2024-01-01 00:00:00' AND timestamp <= DATE '2025-01-01 23:59:59' AND label NOT IN ('person', 'people')` | Same filter as Query 1 |
| `outFields` | `label` | Only return label field |
| `returnDistinctValues` | `true` | No duplicates |
| `returnGeometry` | `false` | Don't need spatial data |
| `f` | `json` | Response format |

### Full Example URL

```
https://dangermondpreserve-spatial.com/server/rest/services/Animl/FeatureServer/1/query?where=deployment_id%20%3D%2059%20AND%20timestamp%20%3E%3D%20DATE%20%272024-01-01%2000%3A00%3A00%27%20AND%20timestamp%20%3C%3D%20DATE%20%272025-01-01%2023%3A59%3A59%27%20AND%20label%20NOT%20IN%20%28%27person%27%2C%20%27people%27%29&outFields=label&returnDistinctValues=true&returnGeometry=false&f=json
```

### Expected Response

```json
{
  "displayFieldName": "",
  "fieldAliases": {
    "label": "label"
  },
  "fields": [...],
  "features": [
    { "attributes": { "label": "mule deer" } },
    { "attributes": { "label": "coyote" } },
    { "attributes": { "label": "bobcat" } },
    { "attributes": { "label": "empty" } }
    // ... more labels
  ]
}
```

### How to Read Result

**Species list = Extract `label` from each feature**

Example: `["mule deer", "coyote", "bobcat", "empty", ...]`

### Performance Benchmarks

| Deployment | Date Range | # Species | Response Time | Response Size |
|------------|-----------|-----------|---------------|---------------|
| 59 | 1 year | 16 | ~100ms | ~1 KB |
| 59 | 2 years | 18 | ~120ms | ~1.2 KB |

---

## Query Type 3: Unique Images for Specific Species (FLATTENED)

📋 **Still uses the original flattened service** because we need to filter by individual labels.

### Why Flattened?

To count images with a specific label (e.g., "mule deer"), we need to filter `WHERE label = 'mule deer'`. The deduplicated service has labels as a comma-separated string, making filtering complex. The flattened service makes this easy.

### Base URL
```
https://dangermondpreserve-spatial.com/server/rest/services/Animl/FeatureServer/1/query
```

### Parameters

| Parameter | Value | Purpose |
|-----------|-------|---------|
| `where` | `deployment_id = 59 AND label = 'mule deer' AND timestamp >= DATE '2024-01-01 00:00:00' AND timestamp <= DATE '2025-01-01 23:59:59'` | Filter by camera, species, date |
| `outStatistics` | `[{"statisticType":"count","onStatisticField":"id","outStatisticFieldName":"count"}]` | Count records per group |
| `groupByFieldsForStatistics` | `deployment_id,animl_image_id` | Group by unique images |
| `f` | `json` | Response format |

### Full Example URL

```
https://dangermondpreserve-spatial.com/server/rest/services/Animl/FeatureServer/1/query?where=deployment_id%20%3D%2059%20AND%20label%20%3D%20%27mule%20deer%27%20AND%20timestamp%20%3E%3D%20DATE%20%272024-01-01%2000%3A00%3A00%27%20AND%20timestamp%20%3C%3D%20DATE%20%272025-01-01%2023%3A59%3A59%27&outStatistics=%5B%7B%22statisticType%22%3A%22count%22%2C%22onStatisticField%22%3A%22id%22%2C%22outStatisticFieldName%22%3A%22count%22%7D%5D&groupByFieldsForStatistics=deployment_id%2Caniml_image_id&f=json
```

### Expected Response

```json
{
  "features": [
    {
      "attributes": {
        "deployment_id": 59,
        "animl_image_id": "jldp:abc123...",
        "count": 3
      }
    },
    {
      "attributes": {
        "deployment_id": 59,
        "animl_image_id": "jldp:ghi789...",
        "count": 2
      }
    }
    // ... more features
  ]
}
```

### How to Read Result

**Unique images of this species = `features.length`**

Example: If `features.length = 147`, there are **147 unique images of mule deer** at this camera.

### Performance Benchmarks

| Deployment | Species | Date Range | Unique Images | Response Time |
|------------|---------|-----------|---------------|---------------|
| 59 | mule deer | 1 year | 147 | ~150ms |
| 59 | coyote | 1 year | 183 | ~180ms |
| 59 | bobcat | 1 year | 92 | ~110ms |

---

## Postman Collection

### Query Strategy Summary

| Query Type | Service | Why |
|------------|---------|-----|
| **Total Counts** (Query 0, 1) | ✨ Deduplicated | Fast, accurate unique image counts |
| **Label Lists** (Query 2) | 📋 Flattened | Easy to get distinct labels |
| **Per-Label Counts** (Query 3) | 📋 Flattened | Easy to filter by specific labels |

### Setting Up Postman

1. Open Postman
2. Create a new Collection called "ANiML Queries"
3. Add these 4 requests:

### Request 0: Simple Row Count ✨ DEDUPLICATED

```
Name: Query 0 - Total Unique Images (All)
Method: GET
URL: https://dangermondpreserve-spatial.com/server/rest/services/Hosted/Animl_Deduplicated/FeatureServer/0/query

Query Params:
  where: 1=1
  returnCountOnly: true
  f: json

Tests (JavaScript):
  pm.test("Response has count field", function () {
    pm.response.to.have.jsonBody("count");
  });
  
  pm.test("Display total unique images", function () {
    const count = pm.response.json().count;
    console.log(`Total unique images in database: ${count}`);
    pm.expect(count).to.be.above(0);
  });
  
  pm.test("Response is tiny (should be ~20 bytes)", function () {
    const responseSize = pm.response.responseSize;
    console.log(`Response size: ${responseSize} bytes`);
    pm.expect(responseSize).to.be.below(100);
  });
```

### Request 1: Unique Images per Deployment ✨ DEDUPLICATED

⚠️ **Important**: 
- Use `timestamp_` (with underscore) in the deduplicated service
- Use `DATE 'YYYY-MM-DD'` format (date only, no time)

```
Name: Query 1 - Unique Images for Deployment 59
Method: GET
URL: https://dangermondpreserve-spatial.com/server/rest/services/Hosted/Animl_Deduplicated/FeatureServer/0/query

Query Params:
  where: deployment_id = 59 AND timestamp_ >= DATE '2024-01-01' AND timestamp_ <= DATE '2025-01-01'
  returnCountOnly: true
  f: json

Tests (JavaScript):
  pm.test("Response has count field", function () {
    pm.response.to.have.jsonBody("count");
  });
  
  pm.test("Count unique images for deployment", function () {
    const count = pm.response.json().count;
    console.log(`Unique images for deployment 59: ${count}`);
    pm.expect(count).to.be.above(0);
  });
  
  pm.test("Response is tiny and fast", function () {
    const responseSize = pm.response.responseSize;
    const responseTime = pm.response.responseTime;
    console.log(`Size: ${responseSize} bytes, Time: ${responseTime}ms`);
    pm.expect(responseSize).to.be.below(100);
    pm.expect(responseTime).to.be.below(200);
  });
```

### Request 2: Distinct Species 📋 FLATTENED

```
Name: Query 2 - Distinct Species (Flattened Service)
Method: GET
URL: https://dangermondpreserve-spatial.com/server/rest/services/Animl/FeatureServer/1/query

Query Params:
  where: deployment_id = 59 AND timestamp >= DATE '2024-01-01 00:00:00' AND timestamp <= DATE '2025-01-01 23:59:59' AND label NOT IN ('person', 'people')
  outFields: label
  returnDistinctValues: true
  returnGeometry: false
  f: json

Tests (JavaScript):
  pm.test("Response has features array", function () {
    pm.response.to.have.jsonBody("features");
  });
  
  pm.test("Extract species list", function () {
    const features = pm.response.json().features;
    const species = features.map(f => f.attributes.label);
    console.log(`Species observed: ${species.join(', ')}`);
    pm.expect(species.length).to.be.above(0);
  });
```

### Request 3: Species-Specific Count 📋 FLATTENED

```
Name: Query 3 - Mule Deer Count (Flattened Service)
Method: GET
URL: https://dangermondpreserve-spatial.com/server/rest/services/Animl/FeatureServer/1/query

Query Params:
  where: deployment_id = 59 AND label = 'mule deer' AND timestamp >= DATE '2024-01-01 00:00:00' AND timestamp <= DATE '2025-01-01 23:59:59'
  outStatistics: [{"statisticType":"count","onStatisticField":"id","outStatisticFieldName":"count"}]
  groupByFieldsForStatistics: deployment_id,animl_image_id
  f: json

Tests (JavaScript):
  pm.test("Response has features array", function () {
    pm.response.to.have.jsonBody("features");
  });
  
  pm.test("Count mule deer images", function () {
    const count = pm.response.json().features.length;
    console.log(`Mule deer unique images: ${count}`);
    pm.expect(count).to.be.above(0);
  });
```

### Using Variables in Postman

Create Collection Variables:
- `deployment_id`: `59`
- `start_date`: `2024-01-01 00:00:00`
- `end_date`: `2025-01-01 23:59:59`
- `species`: `mule deer`

Then use `{{deployment_id}}`, `{{start_date}}`, etc. in your queries.

---

## Testing Scripts

### Script 1: Test Single Deployment (Quick)

**Location**: `scripts/animl-testing/test-single-deployment.js`

**Purpose**: Test all 3 query types for one camera

**Usage**:
```bash
node scripts/animl-testing/test-single-deployment.js 59 "2024-01-01" "2025-01-01"
```

**What it does**:
1. Runs Query 1 → Total unique images
2. Runs Query 2 → Distinct species
3. Runs Query 3 for each species → Per-species counts
4. Verifies totals make sense
5. Reports timing for each query

**Expected output**:
```
Testing deployment 59 from 2024-01-01 to 2025-01-01

Query 1: Total unique images
  ✅ 373 unique images (198ms)

Query 2: Distinct species
  ✅ 16 species: mule deer, coyote, bobcat, ...  (102ms)

Query 3: Per-species counts
  ✅ mule deer: 147 unique images (156ms)
  ✅ coyote: 183 unique images (178ms)
  ✅ bobcat: 92 unique images (112ms)
  ... (13 more species)

Verification:
  ✅ Sum of per-species counts (147+183+92+...) = 521
  ⚠️  Note: Sum (521) > Total (373) because images can have multiple labels
  
Total time: 2.4 seconds
Average per-species query: 143ms
```

### Script 2: Test All Deployments (Slow)

**Location**: `scripts/animl-testing/test-all-deployments.js`

**Purpose**: Test the full parallel execution strategy

**Usage**:
```bash
node scripts/animl-testing/test-all-deployments.js "2024-01-01" "2025-01-01"
```

**What it does**:
1. Fetches all 70 deployments
2. Runs all 3 queries for each deployment IN PARALLEL
3. Reports timing, identifies slow deployments
4. Verifies data consistency

**Expected output**:
```
Testing 70 deployments from 2024-01-01 to 2025-01-01

Processing in parallel...
[====================] 70/70 deployments

Results:
  ✅ 70 deployments processed
  ✅ 8,456 total unique images
  ✅ 781 (deployment, species) combinations
  
Performance:
  Total wall time: 3.2 seconds
  Average per deployment: 245ms
  Slowest: Deployment 59 (1.2s) - 373 images, 16 species
  Fastest: Deployment 12 (45ms) - 0 images, 0 species
  
Issues:
  ⚠️  5 deployments returned 0 images (check date range?)
```

### Script 3: Compare Query Approaches

**Location**: `scripts/animl-testing/compare-approaches.js`

**Purpose**: Compare different counting strategies

**Usage**:
```bash
node scripts/animl-testing/compare-approaches.js 59 "2024-01-01" "2025-01-01"
```

**What it tests**:
1. **Approach A**: Simple count (no GROUP BY) → raw record count
2. **Approach B**: GROUP BY → unique image count
3. **Approach C**: Load all data and deduplicate in memory
4. **Approach D**: Old 2-step approach

**Expected output**:
```
Comparing counting approaches for deployment 59

Approach A: Simple COUNT query
  Result: 780 records
  Time: 45ms
  ❌ Wrong! Counts database rows, not unique images

Approach B: GROUP BY (current)
  Result: 373 unique images
  Time: 198ms
  ✅ Correct! Server-side deduplication

Approach C: Load all + dedupe in memory
  Result: 373 unique images
  Time: 1,245ms
  ✅ Correct but slow! Loads all 780 records

Approach D: Old 2-step
  Result: 373 unique images
  Time: 2,134ms
  ✅ Correct but slowest! Sequential queries

Recommendation: Use Approach B (GROUP BY)
```

---

## Troubleshooting

### Issue: Queries Return 0 Results

**Symptom**: `✅ Deployment 59: 0 unique images, 0 species`

**Possible Causes**:

1. **Date range is wrong**
   - Check if data exists for that date range
   - Test with a wider range: `2020-01-01` to `2030-01-01`
   - Remove date filter entirely to see if data exists

2. **Deployment has no data**
   - Some cameras may have been inactive during that period
   - Query deployment info to verify it exists

3. **Label filter too restrictive**
   - Try removing `AND label NOT IN ('person', 'people')`
   - Check what labels actually exist

**Debug Query** (no filters):
```
https://dangermondpreserve-spatial.com/server/rest/services/Animl/FeatureServer/1/query?where=deployment_id=59&returnCountOnly=true&f=json
```

This will tell you if ANY records exist for this deployment.

### Issue: Queries Are Slow

**Symptom**: Queries take >5 seconds

**Possible Causes**:

1. **Too wide date range**
   - Narrow down to 1 year at a time
   - Process in chunks

2. **No indexes on timestamp or deployment_id**
   - Contact ArcGIS admin to add indexes
   - Not much we can do from client side

3. **Network latency**
   - Test from different location
   - Check if server is under load

**Performance Test**:
```bash
# Test network latency
curl -w "@curl-format.txt" -o /dev/null -s "https://dangermondpreserve-spatial.com/server/rest/services/Animl/FeatureServer/1/query?where=1=1&returnCountOnly=true&f=json"
```

### Issue: Features Array vs Count Field

**Symptom**: Response has `features` array but no `count` field

**This is expected!** With `groupByFieldsForStatistics`, ArcGIS always returns the grouped features, even if `returnCountOnly: true` is set.

**Solution**: Count `features.length` instead of reading `data.count`.

### Issue: Sum of Species Counts > Total Count

**Symptom**: Sum of per-species counts (521) is greater than total count (373)

**This is expected!** A single image can have multiple labels:
- Image IMG_001: `["animal", "mammal", "mule deer"]` (3 labels)

So:
- Total unique images: 373
- Sum of per-species counts: 521 (because of multi-labeling)

**This is NOT a bug!**

---

## Next Steps

1. **Test in Postman**:
   - Import the 3 requests
   - Run them manually
   - Verify response formats
   - Check timing

2. **Run Test Scripts**:
   - Start with single deployment test
   - Verify results match Postman
   - Then test all deployments

3. **Identify Issues**:
   - Are queries returning correct data?
   - Are they fast enough?
   - Any deployments with errors?

4. **Document Findings**:
   - Note any slow deployments
   - Record typical response times
   - Identify any data quality issues

5. **Only Then**: Integrate into application

---

## Performance Targets

| Query Type | Target Time | Acceptable | Too Slow |
|------------|------------|------------|----------|
| Query 1 (total) | <200ms | <500ms | >1s |
| Query 2 (species) | <100ms | <300ms | >500ms |
| Query 3 (per-species) | <150ms | <400ms | >1s |
| Full deployment (all 3) | <500ms | <1.5s | >3s |
| All 70 deployments (parallel) | <3s | <6s | >10s |

---

## Contact

If queries are consistently too slow or returning incorrect data, we may need to:
1. Review ArcGIS server configuration
2. Add database indexes
3. Consider alternative data structures
4. Implement caching strategy

Let's test first, then decide!

