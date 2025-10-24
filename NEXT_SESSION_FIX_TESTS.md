# Next Session: Fix Screenshot Dimensions & Zoom Reset Issues

## 🎯 Mission
Fix the remaining 6/9 failing manual E2E tests by resolving screenshot dimension mismatches and zoom reset issues.

**Current Status:** 3/9 tests passing  
**Target Status:** 9/9 tests passing  
**Estimated Time:** 2-3 hours

---

## 📊 Current Test Results

### ✅ Passing (3/9):
- CalFire FRAP Fire Threat 2019 (47.5s)
- Cattle Pastures (38.8s)
- Earthquake Faults and Folds in the USA (2.2m)

### ❌ Failing (6/9):
1. **CalFire Fire Hazard Severity Zones 2023** (47.3s)
2. **California Historical Fire Perimeters** (1.9m) ← Zoom issue confirmed
3. **Cattle Guards** (23.8s)
4. **Coastal and Marine Data** (23.6s)
5. **Dibblee Geology** (51.9s)
6. **Fish Passage Barriers Assessment** (24.3s) ← Dimension mismatch confirmed

---

## 🐛 Root Causes Identified

### Issue #1: Screenshot Dimension Mismatch (PRIMARY)

**What's happening:**
```
Before screenshot: Legend panel not visible → full map width (2560px)
After screenshot:  Legend panel visible → width minus legend (2357px)  
Result: pixelmatch fails with "Image sizes do not match"
```

**Evidence from Fish Passage Barriers Assessment:**
```
Line 944: 📏 Legend panel not visible, using full map width
Line 947: 📏 Legend panel detected: 203.53125px wide
Line 948: ❌ Fatal error: Image sizes do not match.
```

**Root cause:** `getMapScreenshotArea()` dynamically calculates dimensions based on legend visibility, which changes between before/after screenshots.

**Affected locations:**
- `checkForVisualChangeUsingToggle()` - line 889-976
- `testFilteringForSingleLayer()` - line 1890-1950
- `waitForMapStability()` - line 757-863

---

### Issue #2: Zoom Not Resetting After Tooltip Tests (SECONDARY)

**What's happening:**
```
1. Tooltip test zooms out to state/USA level to find features
2. Test completes successfully
3. Zoom resets BETWEEN SUBLAYERS but NOT after entire test
4. Next test (filtering) runs at zoomed-out level → wrong results
```

**Evidence from California Historical Fire Perimeters:**
```
Line 914: ✅ Popup appeared on attempt 3! (at zoomed-out level)
Line 915: 🔄 Resetting zoom to default for next sublayer...
[BUT: No zoom reset after exiting testTooltipsPopUp() function]
```

**Current code location:** `testTooltipsPopUp()` line 1256-1261

**Problem:** Zoom resets inside the sublayer loop, but not after the loop completes.

---

## 🔧 Phase 1: Fix Screenshot Dimension Mismatch

### Priority: HIGH
### Estimated Time: 1 hour
### Files to modify: `e2e/helpers/tnc-arcgis-test-helpers.ts`

### Task 1.1: Fix `checkForVisualChangeUsingToggle()` (Line 889-976)

**Current problematic code:**
```typescript
// Step 2: Screenshot "before" state (dynamically calculated clip area)
const clipAreaBefore = await getMapScreenshotArea(page);
const beforeScreenshot = await page.screenshot({ clip: clipAreaBefore });

// Step 3: Show layer
await toggleButton.click();

// Step 4: Screenshot "after" state (recalculate in case layout changed)
const clipAreaAfter = await getMapScreenshotArea(page);  // ❌ Different size!
const afterScreenshot = await page.screenshot({ clip: clipAreaAfter });

// Step 5: Run pixelmatch
const pixelDiff = pixelmatch(...)  // ❌ FAILS: Image sizes don't match
```

**Fix: Use consistent dimensions**
```typescript
// Step 2: Screenshot "before" state
const clipAreaBefore = await getMapScreenshotArea(page);
if (!clipAreaBefore) {
  console.warn('    ⚠️ Map container not found for before screenshot');
  continue;
}
const beforeScreenshot = await page.screenshot({ clip: clipAreaBefore });

// Step 3: Show layer
await toggleButton.click();
await page.waitForTimeout(300);

// Step 4: Screenshot "after" state - USE SAME DIMENSIONS AS BEFORE
const afterScreenshot = await page.screenshot({ 
  clip: clipAreaBefore  // ✅ Same dimensions as before!
});

// Step 5: Run pixelmatch
const beforePNG = PNG.sync.read(beforeScreenshot);
const afterPNG = PNG.sync.read(afterScreenshot);
const diffPNG = new PNG({ width: beforePNG.width, height: beforePNG.height });

const pixelDiff = pixelmatch(
  beforePNG.data,
  afterPNG.data,
  diffPNG.data,
  beforePNG.width,
  beforePNG.height,
  { threshold: 0.1 }
);
```

**Key change:** Remove `clipAreaAfter` calculation, use `clipAreaBefore` for both screenshots.

---

### Task 1.2: Fix `testFilteringForSingleLayer()` (Line 1890-1950)

**Current problematic code:**
```typescript
// Take "before" screenshot
const clipArea = await getMapScreenshotArea(page);
const beforeScreenshot = await page.screenshot({ clip: clipArea });

// Click legend item to filter
await firstLegendItem.click({ force: true });
await waitForMapStability(page);

// Take "after" screenshot
const clipAreaAfter = await getMapScreenshotArea(page);  // ❌ Might be different!
const afterScreenshot = await page.screenshot({ clip: clipAreaAfter });
```

**Fix: Use consistent dimensions**
```typescript
// Get map screenshot area (use same dimensions for before/after)
const clipArea = await getMapScreenshotArea(page);
if (!clipArea) {
  return {
    passed: false,
    message: `${layerName}: Map container not found`,
    details: { error: 'no_map_container' }
  };
}

// CRITICAL: Wait for map to finish rendering BEFORE taking "before" screenshot
await waitForMapStability(page);

// Take "before" screenshot (all legend items visible, FULLY RENDERED)
console.log(`  📸 Taking "before" screenshot (all items visible)...`);
const beforeScreenshot = await page.screenshot({
  clip: clipArea  // Store baseline dimensions
});

// Click first legend item to filter it out
const firstLegendItem = legend.locator('[id^="legend-item-"]').first();
// ... visibility checks ...

console.log(`  🎯 Clicking first legend item to filter...`);
await firstLegendItem.click({ force: true });

// CRITICAL: Wait for map to finish re-rendering AFTER filter is applied
await waitForMapStability(page);

// Take "after" screenshot - USE SAME DIMENSIONS AS BEFORE
console.log(`  📸 Taking "after" screenshot (item filtered)...`);
const afterScreenshot = await page.screenshot({
  clip: clipArea  // ✅ Same dimensions as before!
});

// Use pixelmatch to detect visual changes
const beforePNG = PNG.sync.read(beforeScreenshot);
const afterPNG = PNG.sync.read(afterScreenshot);
const diffPNG = new PNG({ width: beforePNG.width, height: beforePNG.height });

const pixelDiff = pixelmatch(
  beforePNG.data,
  afterPNG.data,
  diffPNG.data,
  beforePNG.width,
  beforePNG.height,
  { threshold: 0.1 }
);
```

**Key change:** Remove `clipAreaAfter` variable, use initial `clipArea` for both screenshots.

---

### Task 1.3: Verify `waitForMapStability()` is OK (Line 757-863)

**Review code:** This function already recalculates dimensions each iteration, which is correct for stability checks. Each screenshot in the loop should match the previous one.

**No changes needed here** - the consecutive screenshots SHOULD have same dimensions because nothing is changing between stability checks.

---

### Testing Phase 1:

**After making changes, test with:**
```bash
npm run test:e2e -- --grep="Fish Passage Barriers Assessment" --headed
```

**Expected result:**
- ✅ Test should pass (no more "Image sizes do not match" error)
- Console should show consistent dimensions for before/after screenshots

---

## 🔧 Phase 2: Fix Zoom Reset After Tooltip Tests

### Priority: HIGH
### Estimated Time: 30 minutes
### Files to modify: `e2e/helpers/tnc-arcgis-test-helpers.ts`

### Task 2.1: Add Zoom Reset After Tooltip Test Loop

**Current code in `testTooltipsPopUp()` (Line 1238-1269):**
```typescript
// Multiple sublayers - test each individually
for (let i = 0; i < layerCount; i++) {
  const layerButton = layerButtons.nth(i);
  const layerName = (await layerButton.locator('.font-medium').textContent()) || `Layer ${i}`;
  
  console.log(`\n  Testing sublayer ${i + 1}/${layerCount}: ${layerName}`);
  
  // Click to activate this sublayer
  await layerButton.click();
  await page.waitForTimeout(2000);
  
  // Test tooltips for this specific sublayer
  const result = await testTooltipsForSingleLayer(page, layer, layerName);
  
  // If we zoomed out during this test, zoom back in before testing next sublayer
  if (result.details?.zoomLevel && result.details.zoomLevel !== 'default') {
    console.log(`\n   🔄 Resetting zoom to default for next sublayer...`);
    await zoomInToDefault(page);
  }
  
  sublayerResults.push({
    name: layerName,
    tooltipsWork: result.passed,
    reason: result.message,
    method: result.details?.method
  });
}

// Calculate success rate
const workedCount = sublayerResults.filter(r => r.tooltipsWork).length;
// ... rest of function ...
```

**Fix: Add zoom reset AFTER loop completes**
```typescript
// Multiple sublayers - test each individually
for (let i = 0; i < layerCount; i++) {
  const layerButton = layerButtons.nth(i);
  const layerName = (await layerButton.locator('.font-medium').textContent()) || `Layer ${i}`;
  
  console.log(`\n  Testing sublayer ${i + 1}/${layerCount}: ${layerName}`);
  
  // Click to activate this sublayer
  await layerButton.click();
  await page.waitForTimeout(2000);
  
  // Test tooltips for this specific sublayer
  const result = await testTooltipsForSingleLayer(page, layer, layerName);
  
  // If we zoomed out during this test, zoom back in before testing next sublayer
  if (result.details?.zoomLevel && result.details.zoomLevel !== 'default') {
    console.log(`\n   🔄 Resetting zoom to default for next sublayer...`);
    await zoomInToDefault(page);
  }
  
  sublayerResults.push({
    name: layerName,
    tooltipsWork: result.passed,
    reason: result.message,
    method: result.details?.method
  });
}

// NEW: Ensure zoom is reset after ALL tooltip tests complete
const anyZoomedOut = sublayerResults.some(r => 
  r.method === 'pixel_diff' || 
  (r as any).zoomLevel !== 'default'
);
if (anyZoomedOut) {
  console.log(`\n   🔄 Final zoom reset: Ensuring default zoom level for subsequent tests...`);
  await zoomInToDefault(page);
  await page.waitForTimeout(2000); // Wait for map to fully re-render at default zoom
  console.log(`   ✅ Zoom reset complete`);
}

// Calculate success rate
const workedCount = sublayerResults.filter(r => r.tooltipsWork).length;
// ... rest of function ...
```

**Key addition:** After the loop, check if any sublayer required zoom-out and reset zoom one final time.

---

### Testing Phase 2:

**After making changes, test with:**
```bash
npm run test:e2e -- --grep="California Historical Fire Perimeters" --headed --workers=1
```

**What to watch for:**
1. During tooltip test, browser zooms out to find features
2. After tooltip test completes, see: `🔄 Final zoom reset: Ensuring default zoom level...`
3. Browser zooms back in to preserve level
4. Filtering test runs at correct zoom level
5. Test should pass (filtering works correctly at default zoom)

---

## 🔧 Phase 3: Verify All Manual Tests Pass

### Priority: MEDIUM
### Estimated Time: 30-45 minutes

### Task 3.1: Run Full Manual Test Suite

**Command:**
```bash
npm run test:e2e -- --grep="@manual" --headed --workers=1
```

**Expected results:**
- 9/9 tests should pass
- No "Image sizes do not match" errors
- No zoom-related issues

### Task 3.2: Check Each Failed Test

If any tests still fail, investigate in this order:

1. **CalFire Fire Hazard Severity Zones 2023**
   - Check: Screenshot dimensions consistent?
   - Check: Zoom level correct?

2. **Cattle Guards**
   - Check: Toggle visibility working?
   - Check: Before/after screenshots same size?

3. **Coastal and Marine Data** (20 sublayers!)
   - This might have timeout issues unrelated to our fixes
   - May need increased timeout or skip problematic sublayers

4. **Dibblee Geology**
   - Similar to other tests, should pass after dimension fix

---

## 📝 Testing Checklist

After implementing all fixes, verify:

- [ ] Fish Passage Barriers Assessment passes (dimension fix verified)
- [ ] California Historical Fire Perimeters passes (zoom fix verified)
- [ ] Cattle Guards passes
- [ ] Dibblee Geology passes
- [ ] CalFire Fire Hazard Severity Zones 2023 passes
- [ ] Coastal and Marine Data passes (or document if separate issue)
- [ ] All tests show consistent screenshot dimensions in console logs
- [ ] All tests show zoom resets when needed
- [ ] No gray artifacts in test videos
- [ ] Console shows: `✅ Page health: All checks passed` throughout

---

## 🎯 Success Criteria

**Before fixes:** 3/9 passing (33%)  
**After fixes:** 8/9 or 9/9 passing (89-100%)

**Specific improvements expected:**
1. ✅ No more "Image sizes do not match" errors
2. ✅ Zoom resets properly between test phases
3. ✅ Tests are deterministic (same result every run)
4. ✅ Console logs clearly show what's happening

---

## 💾 Commit Message (After Completion)

```
fix(e2e): resolve screenshot dimension mismatch and zoom reset issues

Fixed two critical test stability issues affecting 6/9 manual tests:

1. Screenshot dimension mismatch in pixelmatch comparisons
   - Legend panel visibility changes between before/after screenshots
   - Caused "Image sizes do not match" errors
   - Solution: Use consistent clip dimensions for before/after pairs
   - Fixed in: checkForVisualChangeUsingToggle(), testFilteringForSingleLayer()

2. Zoom level not resetting after tooltip tests
   - Progressive zoom-out for tooltips left map at state/USA zoom
   - Subsequent filtering tests ran at wrong zoom level
   - Solution: Added final zoom reset after all tooltip sublayers tested
   - Fixed in: testTooltipsPopUp()

Test results improved from 3/9 to 9/9 passing (or document exceptions).

Changes:
- e2e/helpers/tnc-arcgis-test-helpers.ts
  * checkForVisualChangeUsingToggle: Use clipAreaBefore for both screenshots
  * testFilteringForSingleLayer: Use clipArea for both screenshots
  * testTooltipsPopUp: Added final zoom reset after loop

Fixes: Fish Passage Barriers, California Historical Fire Perimeters,
Cattle Guards, Dibblee Geology, CalFire Fire Hazard Severity Zones 2023

Related: Screenshot clipping improvements, page health checks
```

---

## 📚 Context Documents

**For reference:**
- `QUICK_FIX_REFERENCE.md` - Quick answers about hot-reload, ports, etc.
- `TEST_FIXES_SUMMARY.md` - Complete summary of previous fixes
- `GRAY_ARTIFACT_FIX.md` - Details on gray artifact resolution
- `docs/E2E_TEST_ENVIRONMENT_ISSUES.md` - Deep dive on test environment

**Key files to modify:**
- `e2e/helpers/tnc-arcgis-test-helpers.ts` - Main helper functions

**Test files (for verification only, don't modify):**
- `e2e/tnc-arcgis-layers/fish-passage-barriers-assessment.spec.ts`
- `e2e/tnc-arcgis-layers/california-historic-fire-perimeters.spec.ts`
- All other `@manual` test files

---

## 🚀 Quick Start

1. Read this document completely
2. Start with Phase 1, Task 1.1 (highest impact)
3. Test each fix immediately after implementing
4. Move to next phase only after verifying previous phase works
5. Run full test suite at end
6. Document any remaining issues

**Good luck! These fixes should get us to 9/9 passing tests.** 🎉

