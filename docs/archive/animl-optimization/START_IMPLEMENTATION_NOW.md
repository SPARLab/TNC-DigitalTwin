# 🚀 Copy-Paste Prompt for Cursor

---

## Prompt to Use:

Please implement the optimized ANiML count queries that we've tested and benchmarked. Full details are in `@IMPLEMENTATION_PROMPT.md` and test results are in `@QUERY_TESTING_GUIDE.md`.

**Key changes:**
1. Update `@animlService.ts` to use TWO services:
   - **Deduplicated service** (`/Hosted/Animl_Deduplicated/FeatureServer/0`) with `returnCountOnly=true` for total counts (uses `timestamp_` field with `DATE 'YYYY-MM-DD'` format)
   - **Flattened service** (`/Animl/FeatureServer/1`) for species labels and per-species counts (uses `timestamp` field with `DATE 'YYYY-MM-DD HH:MM:SS'` format)

2. Update `getUniqueImageCountForDeployment()` to use deduplicated service and return `data.count`

3. Add retry logic to handle flaky server responses (exponential backoff, 3 attempts)

4. Keep `getDistinctLabelsForDeployment()` and `getUniqueImageCountForLabel()` using flattened service as-is

**Expected results:**
- Queries complete in <200ms each
- Response sizes are tiny (13-15 bytes for counts)
- Right sidebar counts match left sidebar observations
- No linter errors

Please implement these changes and test in the UI to verify counts are accurate.

---

## Quick Reference URLs:

**Deduplicated Service:**
```
https://dangermondpreserve-spatial.com/server/rest/services/Hosted/Animl_Deduplicated/FeatureServer/0/query
```

**Flattened Service:**
```
https://dangermondpreserve-spatial.com/server/rest/services/Animl/FeatureServer/1/query
```

**Example Query (Deduplicated - Single Deployment):**
```
where: deployment_id = 59 AND timestamp_ >= DATE '2024-01-01' AND timestamp_ <= DATE '2025-01-01'
returnCountOnly: true
f: json
```

**Example Query (Flattened - Distinct Labels):**
```
where: deployment_id = 59 AND timestamp >= DATE '2024-01-01 00:00:00' AND timestamp <= DATE '2025-01-01 23:59:59' AND label NOT IN ('person', 'people')
returnDistinctValues: true
outFields: label
f: json
```

