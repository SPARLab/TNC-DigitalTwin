import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright configuration for STABLE E2E testing (no hot-reload)
 * 
 * This config uses a static build (npm run preview) instead of the dev server.
 * Use this when you need deterministic, reproducible results without hot-reload interference.
 * 
 * Key differences from playwright.config.ts:
 * - Uses port 4173 (Vite preview server for production builds)
 * - Runs 'npm run build && npm run preview' instead of 'npm run dev'
 * - No HMR/hot-reload - page never reloads mid-test
 * - Recommended for CI/CD and final test validation
 * 
 * Usage:
 *   npm run test:e2e:stable                     # Run all tests
 *   npm run test:e2e:stable -- --grep="Fire"   # Run specific tests
 */
export default defineConfig({
  testDir: './e2e',
  fullyParallel: false, // Run sequentially for ArcGIS stability
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1, // Single worker to avoid ArcGIS rate limiting
  reporter: [['html', { open: 'never', outputFolder: 'playwright-report-stable' }]],
  
  use: {
    baseURL: 'http://localhost:4173', // Vite preview port (static build)
    trace: 'on-first-retry',
    viewport: { width: 2560, height: 1440 }, // Large monitor size (1440p)
    screenshot: 'only-on-failure',
    video: 'on', // Record video of all tests
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  /* Run preview server before starting tests */
  webServer: {
    command: 'npm run build && npm run preview -- --port 4173',
    url: 'http://localhost:4173',
    reuseExistingServer: !process.env.CI,
    timeout: 180 * 1000, // 3 minutes for build + server startup
  },
});

