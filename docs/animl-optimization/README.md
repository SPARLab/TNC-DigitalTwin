# ANiML Optimization Documentation

This directory contains all documentation related to optimizing ANiML camera trap data queries.

## 📋 Quick Start

**Ready to implement?**
- **[START_IMPLEMENTATION_NOW.md](./START_IMPLEMENTATION_NOW.md)** ← **Copy-paste prompt for Cursor!**

**Want to understand the testing first?**
- **[QUERY_TESTING_GUIDE.md](./QUERY_TESTING_GUIDE.md)** ← Testing guide and benchmarks

**Need implementation details?**
- **[IMPLEMENTATION_PROMPT.md](./IMPLEMENTATION_PROMPT.md)** ← Full implementation guide

## 📁 Files in This Directory

### Active Documentation
- **`START_IMPLEMENTATION_NOW.md`** - Copy-paste prompt for implementing optimized queries
- **`IMPLEMENTATION_PROMPT.md`** - Detailed implementation guide and requirements
- **`QUERY_TESTING_GUIDE.md`** - Comprehensive testing guide with Postman examples
- **`README.md`** - This file (overview and navigation)

### Historical Context
All historical documentation has been moved to `archive/` for reference.

## 🧪 Test Scripts

Located in `/scripts/animl-testing/`:

- **`test-all-queries-benchmark.js`** - Comprehensive benchmark for all 4 query types
- **`test-single-deployment.js`** - Test queries for one camera (quick!)
- **`test-simple-count.js`** - Simple count test using deduplicated service

### Usage Examples

```bash
# Benchmark all queries
node scripts/animl-testing/test-all-queries-benchmark.js 59 "2024-01-01" "2025-01-01"

# Test a single deployment (detailed)
node scripts/animl-testing/test-single-deployment.js 59 "2024-01-01" "2025-01-01"

# Simple count test
node scripts/animl-testing/test-simple-count.js 59 "2024-01-01" "2025-01-01"
```

## 🎯 Current Status

### What's Working
- ✅ **Deduplicated service** - New `Animl_Deduplicated` service provides unique images
- ✅ **Fast count queries** - `returnCountOnly=true` returns counts in ~100ms with 13 bytes
- ✅ **Distinct species** - `returnDistinctValues=true` for label lists
- ✅ **Per-species counts** - GROUP BY queries for label-specific counts
- ✅ **Comprehensive test suite** - Benchmark and test scripts

### Performance Metrics (Nov 8, 2025)
- 📊 **Total Images (All Deployments)**: 65,330 images in 473ms (15 bytes)
- 📊 **Single Deployment Count**: 628 images in 119ms (13 bytes)
- 📊 **Distinct Species**: 13 species in 113ms (617 bytes)
- 📊 **Species-specific Count**: 5 images in 144ms (899 bytes)
- 📊 **Total benchmark time**: 849ms for all 4 queries
- 📊 **Total data transfer**: 1.51 KB

### What's Next
- 🔜 Integrate deduplicated service into `animlService.ts`
- 🔜 Update UI to use new faster queries
- 🔜 Add retry logic for flaky server responses

## 🚦 Next Steps

1. ✅ **Test queries manually** - Completed with benchmark
2. ✅ **Verify performance** - Queries are fast (<200ms each)
3. ✅ **Discover deduplicated service** - Found `Animl_Deduplicated`
4. 🔜 **Integrate into application** - Update `animlService.ts`
5. 🔜 **Add retry logic** - Handle server flakiness
6. 🔜 **Update UI** - Use new count lookups

## 📊 Performance Comparison

| Query Type | Old (GROUP BY) | New (Deduplicated) | Improvement |
|------------|----------------|-----------------------|-------------|
| Single deployment total | ~900 bytes | **13 bytes** | **98.6% smaller** |
| Single deployment total | ~144ms | **119ms** | **17.4% faster** |
| Distinct species | ~617 bytes | ~617 bytes | Same (uses flattened) |
| Per-species count | ~899 bytes | ~899 bytes | Same (uses flattened) |

**Key Insight**: Using the deduplicated service for total counts is dramatically more efficient!

## 📞 Getting Help

1. **Read the testing guide** first
2. **Run the test scripts** to see actual behavior
3. **Check the historical docs** for context on decisions made
4. **Update this README** as you learn more!

## 🗂️ File Organization

```
docs/animl-optimization/
├── README.md (this file)
├── START_IMPLEMENTATION_NOW.md ← Copy-paste this to implement!
├── IMPLEMENTATION_PROMPT.md ← Full implementation details
├── QUERY_TESTING_GUIDE.md ← Testing guide and benchmarks
└── archive/
    ├── ANIML_COUNT_QUERY_FIXES.md
    ├── ANIML_RETURNCOUNT_BUG_FIX.md
    ├── ANIML_3_QUERY_IMPLEMENTATION.md
    ├── ANIML_COUNT_OPTIMIZATION.md
    ├── ANIML_IMPLEMENTATION_VISUAL_SUMMARY.md
    ├── ANIML_COUNT_DISTINCT_SOLUTION.md
    └── ANIML_COUNT_DEDUPLICATION_FIX.md

scripts/animl-testing/
├── test-all-queries-benchmark.js ← Comprehensive benchmark
├── test-single-deployment.js ← Detailed single camera test
└── test-simple-count.js ← Simple count test
```

---

**Last Updated**: 2025-11-08  
**Status**: Testing complete ✅ - Ready for integration

