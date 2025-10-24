# ⚠️ TODO: Fix Broken Tests

**Status**: Work in progress - DO NOT merge to main yet!

## 🔴 Critical Issues

### 1. **Manual Test Inconsistency: CalFire FRAP Fire Threat 2019**

**Problem**: Manual test (`calfire-frap-fire-threat-2019.spec.ts`) is FAILING with browser closure, but dynamic test PASSES.

**Error**:
```
❌ Fatal error: locator.boundingBox: Target page, context or browser has been closed
    at zoomOutToLevel (e2e/helpers/tnc-arcgis-test-helpers.ts:641:37)
```

**Root Cause**: 
- Manual test's tooltip detection is falling back to pixel-diff clustering (legend has 0 colors extracted)
- Dynamic test successfully uses color-based clicking (legend has 8 colors extracted)
- Different code paths being executed for same layer!

**Location**: 
- Test file: `e2e/tnc-arcgis-layers/calfire-frap-fire-threat-2019.spec.ts:72`
- Helper function: `e2e/helpers/tnc-arcgis-test-helpers.ts:641` (zoomOutToLevel)

**Impact**: Manual test times out after 2 minutes, dynamic test passes in ~46 seconds

---

## 🟡 What's Working

✅ **CalFire FRAP Fire Threat 2019 @dynamic** - PASSES consistently
✅ **CalFire Fire Hazard Severity Zones 2023** - Both manual and dynamic PASS
✅ **Playwright configs** - Fixed auto-serving issue (no more background servers)
✅ **Test result consistency** - Dynamic tests produce consistent results
✅ **Stability checks** - Working correctly (0 pixel changes between checks)

---

## 🔍 Investigation Needed

### Why do manual and dynamic tests extract different color counts?

**Dynamic test (WORKS)**:
```
Legend has 8 color(s) extracted
✅ Strategy: COLOR-BASED CLICKING (enough colors for direct detection)
```

**Manual test (FAILS)**:
```
Legend has 0 color(s) extracted
⚠️ Strategy: PIXEL-DIFF (icon-based legend, no colors found)
```

**Questions**:
1. Are they testing the same layer state?
2. Is the legend not fully rendered when manual test runs?
3. Is there a timing issue with color extraction?
4. Why does manual test see 0 colors but dynamic sees 8?

---

## 🛠️ Next Steps

1. **Debug color extraction logic** in manual vs dynamic tests
2. **Add defensive checks** in `zoomOutToLevel()` to handle browser closure gracefully
3. **Investigate timing differences** between manual and dynamic test setup
4. **Consider removing pixel-diff fallback** (unreliable, causes timeouts)
5. **Run both tests with verbose logging** to compare extraction results

---

## 📋 Test Commands

```bash
# Test ONLY CalFire FRAP (both manual and dynamic)
npm run test:e2e -- --grep="CalFire FRAP Fire Threat 2019"

# Test ONLY manual version
npm run test:e2e -- --grep="CalFire FRAP Fire Threat 2019 @manual"

# Test ONLY dynamic version
npm run test:e2e -- --grep="CalFire FRAP Fire Threat 2019.*@dynamic"

# View latest HTML report (manually)
open playwright-report/index.html
```

---

## 📅 Timeline

- **Oct 24, 12:08 PM**: Identified inconsistency between manual/dynamic tests
- **Oct 24, 12:15 PM**: Fixed Playwright auto-serve issue
- **Next**: Debug color extraction and browser closure errors

---

## 🚫 Do NOT Delete This File

This file serves as a reminder that **tests are still broken**. Delete only when:
- ✅ All CalFire manual tests pass
- ✅ Manual and dynamic tests produce identical results
- ✅ No browser closure errors
- ✅ All tests run in < 2 minutes each

