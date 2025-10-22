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
    ['html', { outputFolder: 'playwright-report-checkpoint' }],
    ['./e2e/reporters/checkpoint-reporter.ts']
  ],
  
  // Override test directory to only run dynamic tests
  testDir: './e2e',
  testMatch: '**/all-layers-dynamic.spec.ts',
  
  // Checkpoint-specific settings
  use: {
    ...baseConfig.use,
    // Ensure all screenshots/videos are saved for checkpoint runs
    screenshot: 'on',
    video: 'on',
  },
  
  // Increase timeout for checkpoint runs (multi-layer testing with zoom can be slow)
  // Base: 60s + ~30s per sublayer (avg 3-5 sublayers = 150-210s)
  timeout: 240000, // 240 seconds per test (4 minutes)
  
  // Run tests in parallel for faster execution
  // Reduced from 8 to 6 workers to minimize resource contention
  workers: 6, // 6 parallel workers for stable execution
  
  // Retry failed tests to reduce false negatives
  retries: 1,
});

