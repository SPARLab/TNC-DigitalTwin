import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright configuration for E2E testing of ArcGIS Digital Twin
 * 
 * This config is optimized for testing ArcGIS layer rendering and interactions.
 * - Single worker to avoid ArcGIS rate limiting
 * - Sequential execution for stability with async map loading
 * - Fixed desktop viewport (not mobile-friendly by design)
 */
export default defineConfig({
  testDir: './e2e',
  fullyParallel: false, // Run sequentially for ArcGIS stability
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1, // Single worker to avoid ArcGIS rate limiting
  reporter: [['html', { open: 'never' }]], // Generate HTML report but don't auto-serve
  
  use: {
    baseURL: 'http://localhost:5175',
    trace: 'on-first-retry',
    viewport: { width: 3840, height: 2160 }, // 4K resolution for maximum visibility
    screenshot: 'only-on-failure',
    video: 'on', // Record video of all tests
    
    // Fresh browser context for each test file to prevent state leakage
    contextOptions: {
      ignoreHTTPSErrors: true,
      // Force new context to start with clean slate
      storageState: undefined,
    },
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  /* Run dev server before starting tests */
  webServer: {
    command: 'npm run dev -- --port 5175',
    url: 'http://localhost:5175',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000, // 2 minutes for dev server to start
  },
});

