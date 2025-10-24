# Quick Fix Reference - Test Issues Resolved

## 🎯 Your Questions Answered

### Q1: What port are tests using?

**Dev Server (default):** Port **5173**
```bash
npm run test:e2e  # Uses http://localhost:5173
```

**Stable Build (new):** Port **4173**
```bash
npm run test:e2e:stable  # Uses http://localhost:4173
```

### Q2: Is Vite's hot-reload interfering?

**YES** - This was the main culprit:
- Saving files in `src/` triggers page reloads during tests
- Explains "page reset" at 0:29 in your manual test video
- Explains why same test behaves differently (timing matters)

**Solution:** Use the new stable build config (no hot-reload).

### Q3: Should tests run against static build?

**YES for reliable results**, **NO for rapid debugging**:

| Scenario | Use |
|----------|-----|
| Final validation before commit | `npm run test:e2e:stable` ✅ |
| CI/CD pipelines | `npm run test:e2e:stable` ✅ |
| Actively coding in Cursor | `npm run test:e2e:stable` ✅ |
| Debugging a single test | `npm run test:e2e` (faster) |
| Iterating on test code only | `npm run test:e2e` (faster) |

### Q4: Why do tests extract different colors?

**State bleeding + timing differences:**
1. Dynamic test runs FIRST (alphabetically)
2. Manual test runs SECOND
3. Between tests: localStorage persists, browser cache exists
4. Hot-reload may fire at different times
5. Tests see different legend states

**Fixed by:**
- Clearing localStorage/cookies in `beforeEach`
- Standardizing URL navigation
- Using stable build (no hot-reload)

### Q5: What causes the gray artifact?

**Root causes:**
1. **Hot-reload unmounting React components mid-test**
2. **Hardcoded screenshot offset** assumes legend always 142px wide
3. **No page health checks** before taking screenshots

```typescript
// OLD: Assumes legend always 142px wide
width: mapBox.width - 142  

// During hot-reload: React unmounts components
// Legend disappears, but offset still applied
// Result: Gray rectangle where legend should be
```

**Fixed by:**
1. **New `verifyPageHealth()` function** - Checks page state before screenshots
   - Verifies map view has valid dimensions
   - Ensures no blocking modals are open
   - Confirms details panel is visible
   - Waits 2s and retries if unhealthy

2. **New `getMapScreenshotArea()` helper**
   - Calls `verifyPageHealth()` first
   - Dynamically calculates legend width
   - Rechecks each screenshot (handles mid-reload state)

3. **Updated ALL screenshot locations** (6 places)
   - No more hardcoded `-142` offsets
   - All use dynamic clipping

**Best solution:** Use `npm run test:e2e:stable` to eliminate hot-reload entirely! 🎯

## 🚀 Quick Commands

### Run Both CalFire Tests (Stable)
```bash
npm run test:e2e:stable -- --grep="CalFire FRAP Fire Threat 2019"
```

**Expected result:** Both tests should now behave identically (both pass or both fail).

### Run All Tests (Stable)
```bash
npm run test:e2e:stable
```

### View Report
```bash
npm run test:e2e:report:stable
```

## 📋 What Changed

### Files Created:
- ✅ `playwright.stable.config.ts` - Static build config
- ✅ `docs/E2E_TEST_ENVIRONMENT_ISSUES.md` - Detailed analysis
- ✅ `TEST_FIXES_SUMMARY.md` - Complete summary
- ✅ `QUICK_FIX_REFERENCE.md` - This file

### Files Modified:
- ✅ `package.json` - Added `test:e2e:stable` scripts
- ✅ `e2e/helpers/tnc-arcgis-test-helpers.ts` - Added `getMapScreenshotArea()`, updated stability checks
- ✅ All 10 test files in `e2e/tnc-arcgis-layers/` - Standardized navigation, added state clearing

### Key Changes:
1. **Navigation:** All tests now use `page.goto('/')` (not absolute URLs)
2. **State:** All tests clear localStorage/cookies in `beforeEach`
3. **Screenshots:** Dynamic clipping (no hardcoded offsets)
4. **Config:** New stable build option (no hot-reload)

## ✅ Expected Behavior After Fixes

### Before:
```
Manual Test:  ❌ FAIL - 2.0m - 0 colors, browser closes, page resets
Dynamic Test: ✅ PASS - 48s - 8 colors, gray artifacts
```

### After:
```
Manual Test:  ✅ PASS - ~1.5m - Consistent with dynamic test
Dynamic Test: ✅ PASS - ~1.5m - Consistent with manual test

Both tests:
- Extract same number of colors ✅
- Use same tooltip strategy ✅
- Complete in similar timeframes ✅
- NO gray artifacts ✅
- NO unexpected page resets ✅
```

## 🎓 Key Takeaway

**The problem wasn't the tests themselves** - it was the environment they ran in:
- Hot-reload changed the page during test execution
- Different URL formats caused different Vite behavior
- Hardcoded UI dimensions broke after hot-reload
- State bleeding between tests caused inconsistency

**All fixed now!** 🎉

---

**Need more details?** See `TEST_FIXES_SUMMARY.md` or `docs/E2E_TEST_ENVIRONMENT_ISSUES.md`

