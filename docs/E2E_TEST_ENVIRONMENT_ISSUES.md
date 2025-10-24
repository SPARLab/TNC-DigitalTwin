# E2E Test Environment Issues & Solutions

## 🚨 Problem Summary

Running `npm run test:e2e -- --grep="CalFire FRAP Fire Threat 2019"` executes TWO tests that should behave identically but don't:

| Test File | Type | Result | Duration | Behavior |
|-----------|------|--------|----------|----------|
| `calfire-frap-fire-threat-2019.spec.ts` | @manual | ❌ FAIL | 2min | Extracts 0 colors, falls back to pixel-diff, browser closes |
| `all-layers-dynamic.spec.ts` | @dynamic | ✅ PASS | 48s | Extracts 8 colors, uses color-based clicking |

**Both tests call the SAME functions** (`runQualityCheck`) with the SAME layer config, yet produce completely different results.

## 🔍 Root Causes Identified

### 1. **Hot-Reload Interference (CONFIRMED)**

**Configuration:**
```typescript
// playwright.config.ts
webServer: {
  command: 'npm run dev',  // ← Runs Vite dev server
  url: 'http://localhost:5173',
  reuseExistingServer: !process.env.CI,  // ← Reuses your running dev server
}
```

**What happens:**
- Tests run against Vite dev server (NOT a static build)
- Vite's Hot Module Replacement (HMR) is active
- Saving files in `src/` triggers page reloads during test execution
- This causes the "unexpected page reset" at 0:29 in the manual test video

**Evidence from videos:**
- 0:29 (manual test): Filters clear, page resets → Hot-reload triggered
- 0:43 (dynamic test): Gray artifact on right side → React unmounting during screenshot

### 2. **URL Navigation Inconsistency**

**Manual tests** (hardcoded in 10 test files):
```typescript
test.beforeEach(async ({ page }) => {
  await page.goto('http://localhost:5173');  // ← Absolute URL
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(2000);
});
```

**Dynamic test** (in `all-layers-dynamic.spec.ts`):
```typescript
test.beforeEach(async ({ page }) => {
  await page.goto('/');  // ← Relative URL (uses baseURL config)
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(2000);
});
```

**Why this matters:**
- Absolute URLs bypass Playwright's `baseURL` and may handle HMR differently
- Different URL formats may result in different Vite behavior
- Cache headers, service workers, and React hydration may differ

### 3. **Test Execution Order & State Bleeding**

When both tests run together:
1. `all-layers-dynamic.spec.ts` runs FIRST (alphabetically)
2. `calfire-frap-fire-threat-2019.spec.ts` runs SECOND

Potential state bleeding:
- Browser cache (images, tiles, API responses)
- localStorage (app settings, filter state)
- ArcGIS SDK internal state (layer cache, token refresh)
- React state not fully reset between test files

### 4. **Screenshot Clipping After Hot-Reload**

**Current logic:**
```typescript
const mapBox = await mapContainer.boundingBox();
const screenshot = await page.screenshot({
  clip: {
    x: mapBox.x,
    y: mapBox.y,
    width: mapBox.width - 142,  // ← Subtracts sidebar width
    height: mapBox.height
  }
});
```

**Problem:** After hot-reload, React may be mid-render:
- Sidebar may be unmounted (gray artifact)
- Map container bounds may be incorrect
- The `-142` offset becomes wrong

## ✅ Solutions

### Solution 1: Use Static Build for Tests (RECOMMENDED)

**Why:** Eliminates hot-reload interference completely.

Create a new Playwright config for stable testing:

```typescript
// playwright.stable.config.ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: [['html', { open: 'never' }]],
  
  use: {
    baseURL: 'http://localhost:4173',  // ← Preview port (static build)
    trace: 'on-first-retry',
    viewport: { width: 2560, height: 1440 },
    screenshot: 'only-on-failure',
    video: 'on',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  webServer: {
    command: 'npm run build && npm run preview',  // ← Static build
    url: 'http://localhost:4173',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
  },
});
```

**Add to package.json:**
```json
{
  "scripts": {
    "test:e2e:stable": "playwright test --config=playwright.stable.config.ts"
  }
}
```

**Usage:**
```bash
# For debugging (use dev server with hot-reload)
npm run test:e2e -- --grep="CalFire"

# For reliable results (use static build, no hot-reload)
npm run test:e2e:stable -- --grep="CalFire"
```

### Solution 2: Standardize URL Navigation

**Fix all manual test files** to use relative URLs (consistent with dynamic test):

**Find and replace in these files:**
- `calfire-frap-fire-threat-2019.spec.ts`
- `calfire-fire-hazard-severity-zones-2023.spec.ts`
- `earthquake-faults-folds-usa.spec.ts`
- `california-historic-fire-perimeters.spec.ts`
- `cattle-guards.spec.ts`
- `cattle-pastures.spec.ts`
- `coastal-and-marine-data.spec.ts`
- `dibblee-geology.spec.ts`
- `fish-passage-barriers-assessment.spec.ts`

**Change FROM:**
```typescript
await page.goto('http://localhost:5173');
```

**Change TO:**
```typescript
await page.goto('/');
```

This ensures all tests use the `baseURL` from config consistently.

### Solution 3: Clear State Between Tests

Add to EACH test file's `beforeEach`:

```typescript
test.beforeEach(async ({ page, context }) => {
  // Clear storage and cache for clean state
  await context.clearCookies();
  await context.clearPermissions();
  await page.evaluate(() => {
    localStorage.clear();
    sessionStorage.clear();
  });
  
  // Navigate to app
  await page.goto('/');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(2000);
});
```

### Solution 4: Fix Screenshot Clipping

Add defensive checks for hot-reload mid-render:

```typescript
async function takeMapScreenshot(page: Page): Promise<Buffer> {
  const mapContainer = page.locator('#map-view');
  
  // Wait for container to be stable
  await mapContainer.waitFor({ state: 'visible', timeout: 5000 });
  await page.waitForTimeout(500);  // Extra buffer for render
  
  const mapBox = await mapContainer.boundingBox();
  if (!mapBox) {
    throw new Error('Map container not found for screenshot');
  }
  
  // Verify sidebar is present before calculating offset
  const sidebar = page.locator('#tnc-details-panel');
  const sidebarBox = await sidebar.boundingBox();
  const sidebarOffset = sidebarBox?.width || 0;
  
  return await page.screenshot({
    clip: {
      x: mapBox.x,
      y: mapBox.y,
      width: mapBox.width - sidebarOffset,
      height: mapBox.height
    }
  });
}
```

### Solution 5: Disable HMR in Dev Server (ALTERNATIVE)

If you want to keep using `npm run dev` but disable hot-reload:

```typescript
// vite.config.ts
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    host: true,
    hmr: process.env.E2E_TESTING ? false : true,  // ← Disable HMR for E2E
  },
})
```

```json
// package.json
{
  "scripts": {
    "test:e2e": "E2E_TESTING=true playwright test"
  }
}
```

## 📊 Verification Plan

After implementing fixes, verify both tests produce identical results:

```bash
# Run both tests together
npm run test:e2e:stable -- --grep="CalFire FRAP Fire Threat 2019"

# Verify:
# 1. Both tests PASS or both FAIL (consistent results)
# 2. Both extract same number of colors
# 3. Both use same detection strategy (color-based or pixel-diff)
# 4. No gray artifacts in screenshots
# 5. No unexpected page resets
# 6. Similar execution times (~1-2 minutes each)
```

## 🎯 Recommended Action Plan

**Immediate (High Priority):**
1. ✅ Create `playwright.stable.config.ts` for static build testing
2. ✅ Add `test:e2e:stable` script to package.json
3. ✅ Standardize all test files to use `page.goto('/')` (not absolute URLs)

**Short-term (Medium Priority):**
4. ✅ Add state clearing to `beforeEach` hooks
5. ✅ Fix screenshot clipping logic with sidebar detection

**Long-term (Low Priority):**
6. Consider disabling HMR via environment variable
7. Add test to verify no hot-reload interference
8. Document when to use dev server vs static build

## 📝 Notes

- **Dev server testing** is useful for rapid iteration and debugging
- **Static build testing** is essential for reliable, reproducible results
- Keep BOTH configs and use them for different purposes
- CI/CD should ALWAYS use static build (`playwright.stable.config.ts`)

---

**Last Updated:** October 24, 2025  
**Issue Tracking:** CalFire FRAP Fire Threat 2019 test inconsistency

