 # Next Session: Investigate Coastal and Marine Data Test Timeout

## 🎯 Mission
Investigate and fix the Coastal and Marine Data test that times out after 11.5 minutes. The test has 20 sublayers and appears to get stuck during tooltip testing, likely due to zoom state not resetting properly.

**Current Status:** Test times out during tooltip phase (gets through 17-18/20 sublayers)  
**Test Duration:** 11.5 minutes before timeout (690 second limit)  
**Estimated Time:** 1-2 hours to investigate and fix

---

## ✅ What We've Already Fixed (Don't Touch These!)

The following fixes were successfully implemented and are working:

1. **Screenshot dimension mismatch** - Fixed by using consistent `clipArea` for before/after screenshots
   - `checkForVisualChangeUsingToggle()` - Line 958
   - `testFilteringForSingleLayer()` - Line 1937

2. **Zoom reset after tooltip tests** - Fixed by adding final zoom reset after sublayer loop
   - `testTooltipsPopUp()` - Lines 1267-1278

**These fixes work great and got us from 3/9 to 9/9 passing in serial headed mode!**

---

## 🐛 Current Problem: Coastal and Marine Data Test

### Test Characteristics:
- **20 sublayers** (most tests have 1-3 sublayers)
- **Timeout:** 690 seconds (11.5 minutes)
- **Failure point:** During tooltip testing, around sublayer 12-18
- **Test mode:** Times out in both headed AND headless mode

### Error Details:

```
❌ Fatal error during quality check for Coastal and Marine Data: 
page.waitForTimeout: Test timeout of 690000ms exceeded.
at testFeaturePopup (/e2e/helpers/tnc-arcgis-test-helpers.ts:552:16)
```

### Observed Behavior from Logs:

Looking at the test output, several sublayers fail to find tooltips even after progressive zoom-out:

1. **Sublayer 12: "Naitonal HAPC (NOAA)"** - Failed at ALL zoom levels
   - Preserve level: 0/10 attempts
   - State level (zoom 8): 0/10 attempts  
   - USA level (zoom 4): 0/10 attempts
   - Uses PIXEL-DIFF strategy (thin lines, 2 colors)

2. **Sublayer 15: "Seamounts & Banks (NOAA NCCOS 2007)"** - Failed at ALL zoom levels
   - Preserve level: 0/9 attempts
   - State level: 0/9 attempts
   - USA level: 0/9 attempts
   - Uses PIXEL-DIFF strategy (thin lines, 2 colors)

3. **Sublayer 17: "Upwelling Zones"** - Failed at ALL zoom levels
   - Preserve level: 0/7 attempts
   - State level: 0/2 attempts
   - USA level: 0/7 attempts
   - Uses PIXEL-DIFF strategy (thin lines, 1 color)

4. **Sublayer 18: "Predicted Substrate with Depth"** - Timeout occurred here
   - Got through 3 zoom attempts with color-based clicking
   - Test timed out during this sublayer

---

## 🔍 Hypothesis: Why Is This Test Timing Out?

### Primary Suspect: **Cumulative Zoom State Corruption**

**Theory:**
1. Test zooms out to find tooltips for sublayer 12 (fails at all levels)
2. Zoom reset happens: `🔄 Resetting zoom to default for next sublayer...`
3. BUT - After 20 sublayers with multiple zoom operations, the zoom state gets corrupted
4. Later sublayers (15, 17, 18) run at WRONG zoom level
5. Each failed sublayer tries 3 zoom levels × 10 click attempts = 30 operations
6. With 20 sublayers, this compounds and eventually times out

**Evidence:**
- Sublayers 12, 15, 17 ALL fail to find ANY tooltips at ANY zoom level
- This is suspicious - most layers find tooltips SOMEWHERE
- These sublayers use PIXEL-DIFF strategy (might be zoom-sensitive)
- The test times out on sublayer 18, suggesting cumulative delay

### Secondary Suspect: **Map Rendering Lag After Multiple Zooms**

**Theory:**
1. After ~12 sublayer switches with zoom operations, the map gets sluggish
2. Each `page.waitForTimeout(1500)` might not be enough anymore
3. Clicks happen before popups can render
4. Test retries → more delays → timeout

---

## 🔧 Investigation Plan

### Phase 1: Verify Zoom Reset Is Actually Working (30 min)

**Goal:** Confirm zoom resets are happening after EVERY sublayer, not just at the end of tooltip testing.

**File:** `e2e/helpers/tnc-arcgis-test-helpers.ts`

**Check these locations:**

1. **Line 1254-1261** - Zoom reset BETWEEN sublayers:
```typescript
// If we zoomed out during this test, zoom back in before testing next sublayer
if (result.details?.zoomLevel && result.details.zoomLevel !== 'default') {
  console.log(`\n   🔄 Resetting zoom to default for next sublayer...`);
  await zoomInToDefault(page);
}
```

**PROBLEM:** This only checks `result.details?.zoomLevel`, but if a sublayer FAILS at all zoom levels, it might not record the zoom level properly!

**Action:** Add more verbose logging to confirm zoom reset is actually happening:
```typescript
// Log current zoom level BEFORE and AFTER reset
console.log(`   📍 Current zoom level: ${result.details?.zoomLevel || 'unknown'}`);
if (result.details?.zoomLevel && result.details.zoomLevel !== 'default') {
  console.log(`\n   🔄 Resetting zoom to default for next sublayer...`);
  await zoomInToDefault(page);
  await page.waitForTimeout(2000); // Ensure map fully re-renders
  console.log(`   ✅ Zoom reset complete, should be at default`);
} else {
  console.log(`   ℹ️  No zoom reset needed (already at default or unknown)`);
}
```

2. **Line 1267-1278** - Final zoom reset (already implemented, should be good)

---

### Phase 2: Add Timeout Escape Hatch for Problem Sublayers (30 min)

**Goal:** Prevent individual "unfindable" sublayers from consuming all the test time.

**Current behavior:** Each sublayer tries 3 zoom levels × 10 attempts = up to 30 click operations
**Problem:** If a sublayer genuinely has no clickable tooltips, it wastes ~2-3 minutes

**Solution:** Add a per-sublayer timeout or attempt limit

**Location:** `testTooltipsForSingleLayer()` - Lines 1310-1361

**Change:**
```typescript
async function testTooltipsForSingleLayer(
  page: Page,
  layer: LayerConfig,
  layerName: string
): Promise<TestResult> {
  // NEW: Add per-sublayer timeout
  const SUBLAYER_TIMEOUT_MS = 90000; // 90 seconds max per sublayer
  const startTime = Date.now();
  
  // Try tooltip test at multiple zoom levels progressively
  const zoomLevels = [
    { level: 'default', name: 'preserve level (default)' },
    { level: 8, name: 'state level (zoom 8)' },
    { level: 4, name: 'USA level (zoom 4)' }
  ];
  
  for (let zoomAttempt = 0; zoomAttempt < zoomLevels.length; zoomAttempt++) {
    // NEW: Check if we've exceeded sublayer timeout
    if (Date.now() - startTime > SUBLAYER_TIMEOUT_MS) {
      console.log(`   ⏰ Sublayer timeout (${SUBLAYER_TIMEOUT_MS}ms) - skipping remaining zoom levels`);
      return {
        passed: false,
        message: `${layerName}: Timeout after ${zoomAttempt} zoom attempts (no tooltips found)`,
        details: { 
          timeout: true, 
          zoomAttempts: zoomAttempt,
          timeSpent: Date.now() - startTime 
        }
      };
    }
    
    // ... rest of zoom attempt logic ...
  }
}
```

---

### Phase 3: Increase Wait Times for Large Multi-Sublayer Tests (15 min)

**Goal:** Give the map more time to render after zoom operations in tests with many sublayers.

**Location:** `zoomInToDefault()` - Lines 767-793

**Current code:**
```typescript
await page.mouse.wheel(0, -200); // Negative = zoom in
await page.waitForTimeout(300); // Wait for each zoom step

// Extra wait for final zoom to settle
await page.waitForTimeout(1500);
```

**Change:** Increase wait times for map stability:
```typescript
await page.mouse.wheel(0, -200); // Negative = zoom in
await page.waitForTimeout(500); // Increased from 300ms

// Extra wait for final zoom to settle
await page.waitForTimeout(2500); // Increased from 1500ms
```

---

### Phase 4: Run Test and Monitor (20 min)

**Run the test in headed mode with verbose logging:**

```bash
npm run test:e2e -- --grep="Coastal and Marine Data" --headed --workers=1
```

**Watch for:**
1. Does zoom reset happen after EVERY sublayer?
2. Which sublayers are consuming the most time?
3. Does the timeout escape hatch kick in?
4. Does the test complete within 690 seconds?

**Expected outcome:**
- Test should complete in ~8-10 minutes (currently times out at 11.5)
- Problem sublayers should skip after 90 seconds
- All zoom resets should be logged

---

## 📝 Alternative Solutions (If Above Doesn't Work)

### Option A: Skip Problematic Sublayers

If certain sublayers consistently fail to find tooltips, add them to a skip list:

```typescript
const SKIP_TOOLTIP_SUBLAYERS = [
  'Naitonal HAPC (NOAA)',
  'Seamounts & Banks (NOAA NCCOS 2007)',
  'Upwelling Zones'
];

if (SKIP_TOOLTIP_SUBLAYERS.includes(layerName)) {
  console.log(`   ⏭️  Skipping tooltip test for known-problematic sublayer: ${layerName}`);
  return {
    passed: true,
    message: `${layerName}: Tooltip test skipped (known issue)`,
    details: { skipped: true }
  };
}
```

### Option B: Lower Success Threshold for Multi-Sublayer Tests

Currently requires 70% success rate (14/20 sublayers). For tests with 20+ sublayers, lower it:

```typescript
// In testTooltipsPopUp() - Line 1278
const PASSING_THRESHOLD = layerCount >= 15 ? 0.6 : 0.7; // 60% for large tests, 70% for normal
```

### Option C: Increase Overall Test Timeout

In the test spec file `coastal-and-marine-data.spec.ts`:

```typescript
test.setTimeout(900000); // 15 minutes instead of 11.5
```

---

## 🎯 Success Criteria

After implementing fixes:

- [ ] Test completes within 690 seconds (11.5 minutes)
- [ ] No timeout errors
- [ ] Zoom resets are logged and confirmed after each sublayer
- [ ] At least 14/20 sublayers (70%) successfully find tooltips
- [ ] Test passes in serial headed mode

---

## 📁 Key Files

**Test helpers:**
- `e2e/helpers/tnc-arcgis-test-helpers.ts` (main file to modify)
  - `testTooltipsPopUp()` - Lines 1209-1296
  - `testTooltipsForSingleLayer()` - Lines 1310-1361
  - `zoomInToDefault()` - Lines 767-793

**Test spec:**
- `e2e/tnc-arcgis-layers/coastal-and-marine-data.spec.ts`

**Reference documents:**
- `NEXT_SESSION_FIX_TESTS.md` - Previous fixes (don't break these!)
- `TEST_FIXES_SUMMARY.md` - Historical context

---

## 🚀 Quick Start Commands

**Run the test in headed mode:**
```bash
npm run test:e2e -- --grep="Coastal and Marine Data" --headed --workers=1
```

**Run with debug output:**
```bash
DEBUG=pw:api npm run test:e2e -- --grep="Coastal and Marine Data" --headed --workers=1
```

**Check test video after failure:**
```bash
npx playwright show-report
```

---

## 💡 Key Insight

The Coastal and Marine Data test is **unique** because it has **20 sublayers** (most tests have 1-3). This means:
- 20× the zoom operations
- 20× the map renders
- 20× the wait times
- Cumulative state corruption is more likely

The fix should focus on **preventing cumulative delays** and **ensuring clean zoom state** between each of the 20 sublayers.

Good luck! 🎉

