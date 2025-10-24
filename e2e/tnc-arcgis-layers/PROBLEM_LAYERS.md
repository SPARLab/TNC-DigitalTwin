# Problem Layers - Debugging List

This document tracks layers with test issues identified in the last full checkpoint run.

**Last Full Run:** Oct 23 2025 10:35 AM  
**Results:** 89.3% accuracy (71 TP, 4 TN, 4 FP, 5 FN)  
**Duration:** 42.2 minutes (TOO LONG! Many tests took 10 minutes)

---

## 🔴 Critical Issues (10-Minute Timeouts)

**Problem:** 30+ tests took 10 minutes each (5-min timeout + 5-min retry)

**Root Cause:** Tests hitting 5-minute timeout, then retrying (retries now disabled)

**Layers taking 10+ minutes:**
- Groundwater Wells (10.0m)
- Habitat Areas of Particular Concern (10.1m)
- JLDP Fire Perimeters (10.1m)
- JLDP Prescribed Burns (10.1m)
- Jalama Watershed Outline (10.1m)
- Major Watersheds (10.2m)
- Minor Watersheds (10.1m)
- NOAA Marine Protected Areas Inventory 2024 (10.1m)
- National Hydrography Dataset Plus High Resolution (10.1m)
- Oak Restoration Areas (10.1m)
- Peregrine Falcon Observations Generalized (10.2m)
- Point Conception Offshore Geology (10.1m)
- Restoration Areas (10.1m)
- Sensitive Vegetation Communities (10.1m)
- Springs (10.3m)
- Stock Ponds (10.3m)
- Union Pacific Railroad (10.1m)
- Water Tanks (10.2m)
- And more...

**Next Steps:**
1. ✅ Disabled test retries (prevents 10-min timeouts)
2. ⏳ Optimize pixel-diff logic (currently takes 15-20 seconds per test)
3. ⏳ Debug why tests are timing out (5 minutes should be plenty)

---

## 🐛 Tooltip Test Failures (False Negatives)

**Problem:** Tooltip tests failing even though tooltips work manually

### 1. **Cattle Guards** (`jldp-cattle-guards-public-`)
- **Error:** "No popup appeared after 1 click attempts on cluster centroids"
- **Expected:** PASS (tooltips work)
- **Actual:** FAIL
- **Manual test:** PASSES consistently
- **Issue:** Pixel-diff clustering not finding clickable areas
- **Test file:** `cattle-guards.spec.ts`

### 2. **Dibblee Geology** (`jldp-dibblee-geology`)
- **Error:** "No popup appeared after clicking"
- **Expected:** PASS
- **Actual:** FAIL
- **Issue:** Pixel-diff not detecting features reliably
- **Test file:** `dibblee-geology.spec.ts`

### 3. **Fish Passage Barriers** (`jldp-fish-passage-barriers`)
- **Error:** "No popup appeared after 1 click attempts on cluster centroids"
- **Expected:** PASS
- **Actual:** FAIL
- **Issue:** Small icon layer, pixel clustering not working
- **Test file:** `fish-passage-barriers-assessment.spec.ts`

### 4. **Earthquake Faults and Folds** (`earthquake-faults-and-folds-in-the-usa`)
- **Error:** "No popup appeared after clicking"
- **Expected:** FAIL (tooltips don't work) ← **BUT TEST SAYS PASS!**
- **Actual:** FAIL (correct)
- **Issue:** FALSE POSITIVE on download test (says PASS but should FAIL)
- **Test file:** `earthquake-faults-folds-usa.spec.ts`

**Root Cause:** Pixel-diff clustering algorithm not reliable for all layer types

**Next Steps:**
1. Debug pixel-diff clustering logic
2. Consider alternative approaches (ArcGIS API hitTest?)
3. Increase cluster distance threshold?
4. Add more robust click retry logic?

---

## 🟡 Other Test Issues

### 5. **CalFire FRAP Fire Threat 2019** (`calfire-frap-fire-threat-2019`)
- **Error:** Test 8 (Filters Work) - FAIL
- **Expected:** FAIL (filters broken)
- **Actual:** FAIL (correct!)
- **Status:** ✅ TRUE NEGATIVE (test working correctly)

### 6. **FlamMap Burn Probability** (`flammap-burn-probability-based-on-500-random-ignitions`)
- **Error:** Test 7 (Legend Labels Descriptive) - FAIL
- **Error:** Test 8 (Filters Work) - FAIL
- **Status:** Need to investigate expected results

### 7. **Dangermond Preserve Boundary (WGS)** (`jldp-boundary-wgs`)
- **Error:** Test 2 (Layers Load) - Expected FAIL, got PASS
- **Issue:** FALSE POSITIVE (expected results might be wrong)
- **Action:** Review expected results in `all-arcgis-layers.json`

### 8. **Critical Habitat for Threatened and Endangered Species** (`usfws-critical-habitat`)
- **Error:** Test 3 (Download) - Expected FAIL, got PASS
- **Error:** Test 8 (Filters Work) - FAIL
- **Issue:** Download test might be false positive

---

## 📋 Testing Workflow

### To test individual layers:
```bash
# Test specific layer by name
npm run test:e2e -- --grep="Cattle Guards"
npm run test:e2e -- --grep="Dibblee Geology"

# Test all manual tests
npm run test:e2e -- e2e/tnc-arcgis-layers/*.spec.ts

# Test only dynamic suite (all layers)
npm run test:e2e:checkpoint
```

### Manual Test Files (for debugging):
- `cattle-guards.spec.ts` - Cattle Guards
- `cattle-pastures.spec.ts` - Cattle Pastures (category matching test)
- `coastal-and-marine-data.spec.ts` - Coastal and Marine Data
- `dibblee-geology.spec.ts` - Dibblee Geology
- `fish-passage-barriers-assessment.spec.ts` - Fish Passage Barriers
- `earthquake-faults-folds-usa.spec.ts` - Earthquake Faults
- `california-historic-fire-perimeters.spec.ts` - California Fire Perimeters
- `calfire-fire-hazard-severity-zones-2023.spec.ts` - CalFire FHSZ
- `calfire-frap-fire-threat-2019.spec.ts` - CalFire FRAP

**Note:** All manual tests should use `runQualityCheck()` for consistency with `all-layers-dynamic.spec.ts`

---

## 🎯 Priority TODOs

1. **Speed Optimization** (Critical)
   - Tests taking 42 minutes for 45 layers (average 1 min each, but 30+ took 10 min)
   - Target: < 20 minutes total (< 30 seconds per layer)
   - Actions:
     - ✅ Disable retries (done)
     - ⏳ Optimize pixel-diff (reduce waits from 1500ms → 500ms?)
     - ⏳ Investigate why some tests timeout at 5 minutes

2. **Tooltip Test Reliability** (High Priority)
   - 4 false negatives (Cattle Guards, Dibblee, Fish Passage, Earthquake)
   - Manual tests pass, dynamic tests fail
   - Need to debug pixel-clustering algorithm

3. **Update Inconsistent Manual Tests** (Medium Priority)
   - Some tests use old helpers, not `runQualityCheck`
   - Need consistency between manual and dynamic tests
   - Files to update:
     - `calfire-fire-hazard-severity-zones-2023.spec.ts` ← uses old helpers
     - `calfire-frap-fire-threat-2019.spec.ts` ← uses old helpers
     - `california-historic-fire-perimeters.spec.ts` ← uses old helpers
     - `earthquake-faults-folds-usa.spec.ts` ← uses old helpers

4. **False Positives** (Medium Priority)
   - Earthquake Faults: Download says PASS but should FAIL
   - Dangermond Boundary: Layers Load says PASS but expected FAIL
   - Review expected results in `all-arcgis-layers.json`

---

## 📊 Progress Tracking

| Date | Accuracy | Duration | Notes |
|------|----------|----------|-------|
| Oct 21 | 86.7% | Unknown | Initial baseline |
| Oct 22 (2:40 PM) | 90.0% | Unknown | Improved |
| Oct 22 (5:09 PM) | 93.3% | Unknown | Peak accuracy |
| **Oct 23 (10:35 AM)** | **89.3%** | **42.2 min** | **Regression! Timeouts** |

**Goal:** 95%+ accuracy, < 20 minutes total runtime

