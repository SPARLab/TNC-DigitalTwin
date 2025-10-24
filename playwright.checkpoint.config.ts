import { defineConfig, devices } from '@playwright/test';
import baseConfig from './playwright.config';

/**
 * Playwright config for checkpoint test runs
 * Extends base config with checkpoint reporter for historical tracking
 */
export default defineConfig({
  ...baseConfig,
  
  // Enable full parallelization for checkpoint runs
  fullyParallel: true,
  
  // Use checkpoint reporter in addition to HTML reporter
  reporter: [
    ['html', { outputFolder: 'playwright-report-checkpoint', open: 'never' }],
    ['./e2e/reporters/checkpoint-reporter.ts']
  ],
  
  // Override test directory to only run dynamic tests
  testDir: './e2e',
  testMatch: '**/all-layers-dynamic.spec.ts',
  
  // Checkpoint-specific settings
  use: {
    ...baseConfig.use,
    // Optimize for speed: only record videos on failures
    screenshot: 'only-on-failure', // Screenshots only for failed tests
    video: 'retain-on-failure', // Videos only for failed tests (huge speed boost!)
  },
  
  // Global timeout for all checkpoint tests
  // Most tests complete in 1-2 minutes, but complex layers with pixel-diff screenshots need more time
  timeout: 300000, // 300 seconds (5 minutes) - simple, one timeout for all tests
  
  // Run tests in parallel for faster execution
  // Optimized for 12-core machine with 32GB RAM
  workers: 9, // 9 parallel workers for faster execution
  
  // Don't retry - if a test times out at 5 minutes, retrying adds another 5 minutes (10 min total!)
  retries: 0,
});

