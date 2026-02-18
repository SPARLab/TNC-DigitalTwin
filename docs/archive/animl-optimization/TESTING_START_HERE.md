# ANiML Query Testing - START HERE

## 🚦 Current Status: PAUSED FOR TESTING

The ANiML count query implementation has been **paused** to:
1. Test queries independently
2. Verify performance
3. Understand why we're seeing "0 unique images" errors
4. Build confidence before integrating

## 📍 Where Everything Is

### 📖 Documentation
All ANiML optimization docs are now in:
```
docs/animl-optimization/
```

**Start here**: [`docs/animl-optimization/QUERY_TESTING_GUIDE.md`](./docs/animl-optimization/QUERY_TESTING_GUIDE.md)

This guide contains:
- All 4 query types explained (including new simple count test!)
- Postman collection examples
- Expected response formats
- Performance benchmarks
- Troubleshooting guide

### 🧪 Test Scripts
All test scripts are now in:
```
scripts/animl-testing/
```

**Run this first**: 
```bash
# Start with the simplest test!
node scripts/animl-testing/test-simple-count.js 59 "2024-01-01" "2025-01-01"

# Then test all queries for a single deployment
node scripts/animl-testing/test-single-deployment.js 59 "2024-01-01" "2025-01-01"
```

## 🎯 What You Need to Do

### Step 0: Test Simple Count (FASTEST TEST!)

**Run this FIRST** to verify basic API connectivity:

```bash
node scripts/animl-testing/test-simple-count.js 59 "2024-01-01" "2025-01-01"
```

**What this tests:**
- Does `returnCountOnly=true` work?
- Does it return a simple number?
- How fast is it?

**Expected output:**
```
📊 RESPONSE:
{ "count": 847 }

✅ SUCCESS! returnCountOnly works as expected.
   - Returns a simple count
   - Response is tiny (~20 bytes)
   - Very fast (50ms)
```

⚠️ **Note**: This count includes duplicates (multiple labels per image), so it's NOT the unique image count. But it proves the API works!

### Step 1: Test Queries Manually (Postman)

**💡 How to use these URLs in Postman:**
1. Open Postman
2. Create a new GET request
3. **Copy-paste the full URL** into the URL field (the one with `%20` and `%3D` - these are URL-encoded)
4. Click "Send"

**OR** if you prefer to set up params manually:
1. Paste the base URL: `https://dangermondpreserve-spatial.com/server/rest/services/Animl/FeatureServer/1/query`
2. Go to the "Params" tab
3. Add each key-value pair listed (Postman will URL-encode for you)

---

Open Postman and test these 4 queries:

#### Query 0: Simple Row Count (TEST)

**Copy-paste this URL into Postman:**
```
https://dangermondpreserve-spatial.com/server/rest/services/Animl/FeatureServer/1/query?where=deployment_id%20%3D%2059%20AND%20timestamp%20%3E%3D%20DATE%20%272024-01-01%2000%3A00%3A00%27%20AND%20timestamp%20%3C%3D%20DATE%20%272025-01-01%2023%3A59%3A59%27%20AND%20label%20NOT%20IN%20%28%27person%27%2C%20%27people%27%29&returnCountOnly=true&f=json
```

**Or set up params manually:**
- Key: `where` | Value: `deployment_id = 59 AND timestamp >= DATE '2024-01-01 00:00:00' AND timestamp <= DATE '2025-01-01 23:59:59' AND label NOT IN ('person', 'people')`
- Key: `returnCountOnly` | Value: `true`
- Key: `f` | Value: `json`

**Expected Response:**
```json
{ "count": 847 }
```

**Expected Performance:**
- Response time: ~50ms
- Response size: ~20 bytes

#### Query 1: Total Unique Images ✨ DEDUPLICATED

⚠️ **NEW**: Uses the fast deduplicated service!

**Copy-paste this URL into Postman:**
```
https://dangermondpreserve-spatial.com/server/rest/services/Hosted/Animl_Deduplicated/FeatureServer/0/query?where=deployment_id%20%3D%2059%20AND%20timestamp_%20%3E%3D%20DATE%20%272024-01-01%27%20AND%20timestamp_%20%3C%3D%20DATE%20%272025-01-01%27&returnCountOnly=true&f=json
```

**Or set up params manually:**
- Key: `where` | Value: `deployment_id = 59 AND timestamp_ >= DATE '2024-01-01' AND timestamp_ <= DATE '2025-01-01'`
- Key: `returnCountOnly` | Value: `true`
- Key: `f` | Value: `json`

**Expected Response:**
```json
{ "count": 628 }
```
- Response time: ~50ms
- Response size: ~20 bytes

#### Query 2: Distinct Species

**Copy-paste this URL into Postman:**
```
https://dangermondpreserve-spatial.com/server/rest/services/Animl/FeatureServer/1/query?where=deployment_id%20%3D%2059%20AND%20timestamp%20%3E%3D%20DATE%20%272024-01-01%2000%3A00%3A00%27%20AND%20timestamp%20%3C%3D%20DATE%20%272025-01-01%2023%3A59%3A59%27%20AND%20label%20NOT%20IN%20%28%27person%27%2C%20%27people%27%29&outFields=label&returnDistinctValues=true&returnGeometry=false&f=json
```

**Or set up params manually:**
- Key: `where` | Value: `deployment_id = 59 AND timestamp >= DATE '2024-01-01 00:00:00' AND timestamp <= DATE '2025-01-01 23:59:59' AND label NOT IN ('person', 'people')`
- Key: `outFields` | Value: `label`
- Key: `returnDistinctValues` | Value: `true`
- Key: `returnGeometry` | Value: `false`
- Key: `f` | Value: `json`

**Expected Response:**
- features array with ~16 species
- Response time: ~100ms

#### Query 3: Mule Deer Count

**Copy-paste this URL into Postman:**
```
https://dangermondpreserve-spatial.com/server/rest/services/Animl/FeatureServer/1/query?where=deployment_id%20%3D%2059%20AND%20label%20%3D%20%27mule%20deer%27%20AND%20timestamp%20%3E%3D%20DATE%20%272024-01-01%2000%3A00%3A00%27%20AND%20timestamp%20%3C%3D%20DATE%20%272025-01-01%2023%3A59%3A59%27&outStatistics=%5B%7B%22statisticType%22%3A%22count%22%2C%22onStatisticField%22%3A%22id%22%2C%22outStatisticFieldName%22%3A%22count%22%7D%5D&groupByFieldsForStatistics=deployment_id%2Caniml_image_id&f=json
```

**Or set up params manually:**
- Key: `where` | Value: `deployment_id = 59 AND label = 'mule deer' AND timestamp >= DATE '2024-01-01 00:00:00' AND timestamp <= DATE '2025-01-01 23:59:59'`
- Key: `outStatistics` | Value: `[{"statisticType":"count","onStatisticField":"id","outStatisticFieldName":"count"}]`
- Key: `groupByFieldsForStatistics` | Value: `deployment_id,animl_image_id`
- Key: `f` | Value: `json`

**Expected Response:**
- features array with ~147 items
- Response time: ~150ms

### Step 2: Run Test Script

```bash
cd /Users/woverbyethompson/Documents/SpatialLab/TNC-DigitalTwin
node scripts/animl-testing/test-single-deployment.js 59 "2024-01-01" "2025-01-01"
```

**Expected output**:
```
Query 1: Total unique images
  ✅ 373 unique images (198ms)

Query 2: Distinct species
  ✅ 16 species: mule deer, coyote, bobcat, ... (102ms)

Query 3: Per-species counts
  ✅ mule deer: 147 unique images (156ms)
  ✅ coyote: 183 unique images (178ms)
  ...

Verification:
  ✅ Sum (521) > Total (373) - images can have multiple labels

Total wall time: 2.4 seconds
```

### Step 3: Diagnose Issues

**If you see "0 unique images, 0 species"**:

Try widening the date range:
```bash
node scripts/animl-testing/test-single-deployment.js 59 "2020-01-01" "2030-01-01"
```

Or test without date filter:
```
GET .../query?where=deployment_id=59&returnCountOnly=true&f=json
```

This will tell you if the deployment has ANY data at all.

### Step 4: Test Different Deployments

Try a few different deployments:
```bash
node scripts/animl-testing/test-single-deployment.js 16 "2024-01-01" "2025-01-01"
node scripts/animl-testing/test-single-deployment.js 59 "2024-01-01" "2025-01-01"
node scripts/animl-testing/test-single-deployment.js 61 "2024-01-01" "2025-01-01"
```

Do they all return 0? Or just some?

## 🔍 What We're Looking For

### Good Signs ✅
- Queries return results (not 0)
- Response times < 500ms per query
- features.length matches expected counts
- Sum of species counts > total (multi-labeling)

### Red Flags ❌
- All deployments return 0 results
- Queries take > 2 seconds
- features array is empty but we know data exists
- ArcGIS error messages

## 📊 Current Problem (from your logs)

```
animlService.ts:480 ✅ Deployment 6: 0 unique images, 0 species
animlService.ts:480 ✅ Deployment 5: 0 unique images, 0 species
...
```

This suggests:
1. **Date filtering is wrong** - Try "2020-01-01" to "2030-01-01"
2. **Label filter too restrictive** - Try removing `NOT IN ('person', 'people')`
3. **Deployments have no data** - Verify with simple count query
4. **Query is broken** - Test manually in Postman first

## 🛠️ Debugging Steps

### 1. Test Basic Connectivity
```bash
curl "https://dangermondpreserve-spatial.com/server/rest/services/Animl/FeatureServer/1/query?where=1=1&returnCountOnly=true&f=json"
```

Should return total record count (e.g., `{ "count": 50000 }`).

### 2. Test Single Deployment (No Filters)
```bash
curl "https://dangermondpreserve-spatial.com/server/rest/services/Animl/FeatureServer/1/query?where=deployment_id=59&returnCountOnly=true&f=json"
```

Should return count for that deployment (e.g., `{ "count": 780 }`).

### 3. Test Date Filter
```bash
curl "https://dangermondpreserve-spatial.com/server/rest/services/Animl/FeatureServer/1/query?where=deployment_id=59+AND+timestamp+>=+DATE+'2024-01-01+00:00:00'&returnCountOnly=true&f=json"
```

If this returns 0, the date range is wrong!

### 4. Test GROUP BY (No Date Filter)
```bash
# Use Postman for this - the URL gets too long for curl
```

## 📞 When to Resume

Resume integration when:
1. ✅ Queries work in Postman
2. ✅ Test scripts pass with real data
3. ✅ Performance is acceptable (<3s for all 70 deployments)
4. ✅ We understand why we were seeing 0 results

## 📚 Documentation Structure

```
Root:
  ANIML_TESTING_START_HERE.md ← You are here!

docs/animl-optimization/:
  README.md ← Overview of all docs
  QUERY_TESTING_GUIDE.md ← Detailed testing guide
  [8 other historical docs]

scripts/animl-testing/:
  test-single-deployment.js ← Main test script
  test-animl-count-queries.js
  verify-fix.js
```

## 💡 Key Insight

**The queries themselves are probably fine!**

The issue is likely:
- **Date range**: We're querying dates that don't have data
- **Integration**: Something in the app is breaking the queries
- **Parallel execution**: Maybe running 70 queries at once is overwhelming

**Solution**: Test queries in isolation FIRST, then integrate!

---

**Next Action**: Open Postman and test Query 1 with deployment 59.

If that works → Run the test script  
If that fails → We have a bigger problem (query syntax, server issues, etc.)

