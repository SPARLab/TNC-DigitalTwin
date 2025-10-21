import { defineConfig, devices } from '@playwright/test';
import baseConfig from './playwright.config';

/**
 * Playwright config for checkpoint test runs
 * Extends base config with checkpoint reporter for historical tracking
 */
export default defineConfig({
  ...baseConfig,
  
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
  timeout: 120000, // 120 seconds per test (2 minutes)
  
  // Run tests in parallel for faster execution
  workers: 4, // Adjust based on your machine
  
  // Retry failed tests to reduce false negatives
  retries: 1,
});

