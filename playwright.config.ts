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
  reporter: 'html',
  
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
    viewport: { width: 1920, height: 1080 }, // Fixed desktop size
    screenshot: 'only-on-failure',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  /* Run dev server before starting tests */
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000, // 2 minutes for dev server to start
  },
});

