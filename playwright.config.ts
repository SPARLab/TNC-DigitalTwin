import { defineConfig, devices } from '@playwright/test';
import { deterministicRequestAllowlist } from './tests/support/browser/deterministic-allowlist.ts';

type DeterministicProjectOptions = {
  deterministicRequestAllowlist: string[];
};

const testPort = process.env.TNC_TEST_PORT ?? '4177';
const testBaseUrl = `http://127.0.0.1:${testPort}`;
const artifactDirectory =
  process.env.TNC_PLAYWRIGHT_OUTPUT_DIR ??
  '.test-results/playwright-artifacts';

export default defineConfig<DeterministicProjectOptions>({
  testDir: './tests',
  testIgnore: '**/*.example.spec.ts',
  outputDir: artifactDirectory,
  fullyParallel: false,
  // Keep every attempt directory. A failed attempt's trace and screenshot stay
  // when a later retry passes; see TESTING.md.
  preserveOutput: 'always',
  timeout: 30000,
  expect: { timeout: 10000 },
  reporter: [['./tests/support/reporting/quiet-stdio-reporter.ts']],
  use: {
    baseURL: testBaseUrl,
    headless: true,
    viewport: { width: 1280, height: 800 },
    deviceScaleFactor: 1,
    // Playwright 1.64 keeps a failed attempt's trace when a later retry passes.
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  webServer: {
    // Vite dev server for this app, started directly. `npm run dev` also builds the
    // standalone Experiences first, which the test pages do not need. The CLI --port
    // flag overrides the port pinned in vite.config.ts, and --strictPort fails loudly
    // on a clash instead of moving to another port.
    command: `npx --no-install vite --host 127.0.0.1 --port ${testPort} --strictPort`,
    url: testBaseUrl,
    reuseExistingServer: false,
    timeout: 120000,
  },
  projects: [
    {
      name: 'deterministic',
      testMatch: '**/*.deterministic.spec.ts',
      retries: 0,
      workers: 1,
      use: {
        ...devices['Desktop Chrome'],
        // Explicit external exceptions. Same-origin recorded fixtures and mocks stay allowed.
        deterministicRequestAllowlist: [...deterministicRequestAllowlist],
      },
    },
    {
      name: 'live',
      testMatch: '**/*.live.spec.ts',
      // 30s per attempt fits the 20s duration budget plus a settle wait. Retries once.
      timeout: 30000,
      retries: 1,
      // Two browsers share one GPU, one page server, and the Esri services. Benchmark
      // before raising; see TESTING.md.
      workers: 2,
      // The chromium channel draws WebGL on the GPU. The default headless shell uses
      // SwiftShader, a CPU renderer that is several times slower for map views.
      use: { ...devices['Desktop Chrome'], channel: 'chromium' },
    },
  ],
});
