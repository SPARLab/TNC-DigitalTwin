# Next Session: Debug Test Regressions & Screenshot Artifacts

## 🚨 CRITICAL ISSUES TO FIX

### 1. **Inconsistent Test Results Between Manual & Dynamic Tests**
**Problem**: The same layer tested with the same helper functions produces different results:
- `calfire-frap-fire-threat-2019.spec.ts` (@manual): ❌ FAILED (2.0m)
- `all-layers-dynamic.spec.ts` (@dynamic): ✅ PASSED (46.4s)

**Both tests use the SAME code** from `e2e/helpers/tnc-arcgis-test-helpers.ts`, so they should get identical results!

**Possible causes**:
- Race condition in `waitForMapStability()` 
- Different timeout values
- State bleeding between tests
- Map not fully reset between tests

### 2. **Strange Gray Artifact in Screenshots**
**Problem**: There's a gray rectangular area appearing on the right side of map screenshots (visible in video at 0:46/0:48).

**Location**: Right side of the map area, looks like a scrolling/viewport issue

**Possible causes**:
- Map viewport not properly sized during screenshots
- Zoom operations causing scroll/pan issues
- Screenshot clipping calculation is wrong
- ArcGIS map not centered properly after zoom operations

**Current screenshot logic**:
```typescript
const screenshot = await page.screenshot({
  clip: {
    x: mapBox.x,
    y: mapBox.y,
    width: mapBox.width - 142,  // <-- This offset might be wrong after zoom
    height: mapBox.height
  }
});
```

### 3. **Recent Changes That May Have Introduced Regressions**

#### Added `waitForMapStability()`:
```typescript
// In e2e/helpers/tnc-arcgis-test-helpers.ts
async function waitForMapStability(page: Page, maxAttempts = 8): Promise<void> {
  // Waits for 3 consecutive stable checks (≤50px threshold)
  // 1.5s between checks
  // Uses pixelmatch to compare screenshots
}
```

**Used in**:
- `testFilteringForSingleLayer()` - called BEFORE and AFTER clicking filter button

**Potential issues**:
- May timeout on slow networks
- 50px threshold might be too tight for some layers
- Consecutive stable checks might restart if ANY change detected
- Could be comparing wrong map areas after zoom

#### Added `zoomInToDefault()`:
```typescript
// Zooms back in after progressive zoom-out
// Called after each sublayer tooltip test
await zoomInToDefault(page);
```

**Potential issues**:
- Might not be fully resetting zoom level
- Could cause scroll/pan artifacts
- May not wait long enough for map to re-render

#### Removed pixel threshold:
```typescript
// OLD: const filterWorked = pixelDiff > 500;
// NEW: const filterWorked = pixelDiff > 0;
```

**Impact**: Now ANY pixel change = filtering works. This is correct IF stability checks are working properly, but if stability checks have race conditions, we'll get false positives.

---

## 📋 DEBUGGING STEPS

### Step 1: Run Both Tests Individually and Compare
```bash
# Test 1: Manual test
npm run test:e2e -- --grep="CalFire FRAP Fire Threat 2019 @manual"

# Test 2: Dynamic test  
npm run test:e2e -- --grep="calfire-frap-fire-threat-2019.*@dynamic"
```

**Compare**:
- Pixel diff values in filtering test
- Stability check output (how many attempts, pixel changes)
- Screenshot artifacts
- Total execution time

### Step 2: Investigate Screenshot Clipping
The gray area suggests the screenshot clip region is wrong after zoom operations.

**Check**:
1. After `zoomOutToLevel()` - is mapBox still correct?
2. After `zoomInToDefault()` - is mapBox still correct?
3. Does `mapContainer.boundingBox()` need to be recalculated after zoom?

**Possible fix**:
```typescript
// In waitForMapStability(), recalculate mapBox each iteration?
for (let attempt = 0; attempt < maxAttempts; attempt++) {
  await page.waitForTimeout(1500);
  
  // RECALCULATE mapBox in case zoom changed it
  const freshMapBox = await mapContainer.boundingBox();
  if (!freshMapBox) continue;
  
  const currentScreenshot = await page.screenshot({
    clip: {
      x: freshMapBox.x,
      y: freshMapBox.y,
      width: freshMapBox.width - 142,
      height: freshMapBox.height
    }
  });
  // ... rest of logic
}
```

### Step 3: Add Debug Logging to Stability Checks
Add more verbose logging to understand what's happening:

```typescript
console.log(`    📏 Map bounds: ${mapBox.width}x${mapBox.height} at (${mapBox.x}, ${mapBox.y})`);
console.log(`    📸 Screenshot region: ${mapBox.width - 142}x${mapBox.height}`);
```

### Step 4: Check if Tests Are Properly Isolated
- Are we resetting zoom level between tests?
- Are we closing modals/sidebars?
- Is the map centered on Dangermond Preserve at test start?

---

## 🎯 GOALS FOR THIS SESSION

1. **Fix inconsistent results** - Both manual and dynamic tests should produce identical outcomes
2. **Remove gray screenshot artifact** - Screenshots should be clean map views
3. **Verify stability checks work correctly** - No false positives or false negatives
4. **Ensure tests are deterministic** - Running same test twice should give same result

---

## 📂 KEY FILES TO REVIEW

- `e2e/helpers/tnc-arcgis-test-helpers.ts` (lines 701-773: `waitForMapStability`)
- `e2e/helpers/tnc-arcgis-test-helpers.ts` (lines 1811-1850: filtering test with stability)
- `e2e/helpers/tnc-arcgis-test-helpers.ts` (lines 673-699: `zoomInToDefault`)
- `e2e/tnc-arcgis-layers/calfire-frap-fire-threat-2019.spec.ts`
- `e2e/tnc-arcgis-layers/all-layers-dynamic.spec.ts`

---

## 💡 HYPOTHESIS

The gray artifact and inconsistent results are likely related. If the map viewport is shifted/scrolled after zoom operations, then:
- Screenshots capture the wrong area (gray artifact)
- Stability checks compare shifted regions (inconsistent results)
- Filtering tests compare before/after of different map regions (false positives/negatives)

**Test this**: Add logging before each screenshot to print `mapBox` dimensions and position.

---

## ✅ WHAT'S WORKING

- Progressive zoom-out for tooltip detection
- Pixel-diff approach for filtering (when stability works)
- Multi-sublayer handling
- Zoom reset between sublayers (in theory)

## ❌ WHAT'S BROKEN

- Screenshot clipping after zoom operations
- Test result consistency between manual/dynamic
- Stability checks may have race conditions

---

## 🔍 TEST COMMAND TO USE

```bash
# Test ONLY CalFire FRAP (both manual and dynamic versions)
npm run test:e2e -- --grep="CalFire FRAP Fire Threat 2019"
```

This will run exactly 2 tests (manual + dynamic) and should take ~3 minutes total.
