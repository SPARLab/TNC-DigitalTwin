# Feature-centered testing

The test catalog at `tests/support/catalog/test-catalog.json` is the declarative source of truth for classification, selection, Feature lifecycle, test enforcement, duration budgets, methodology, and source files. Every test command validates that catalog and the fixture manifests through `tests/support/validation/foundations.ts` before execution, and does not start the suite when validation fails. Permanent catalog test identifiers use `FBT`, `FST`, `CCT`, or `SST` plus a number, such as `SST-001`, and must match that test's category. They are catalog labels, not HTML `id` attributes. Example identifiers keep the `E` form, such as `FBT-E001`.

Governing policy lives in `~/.cursor/testing-system/testing-standards.md` and `~/.cursor/testing-system/repository-infrastructure.md`. This file records what this repository does.

## Current state

The catalog has three required Feature Behavior Tests under Feature Set `FS-100` (Data Export), Feature `F-110` (Export cart): `FBT-001` (Export ZIP names the layer, view, and format), `FBT-002` (Generate Links downloads a link per pinned layer), and `FBT-003` (unpinning removes a layer from the package). They are live browser tests that use the response cache. It also holds two infrastructure self-tests (`SST-001`, `SST-002`, Shared Supporting, nonblocking) and three Example entries (`FBT-E001`, `FBT-E002`, `CCT-E001`) that never run. There is no Critical Core test yet, so the gate's Critical Core phase is empty. `npm run test:gate` passes (exit code 0) when the three FBTs pass, and goes back to inconclusive (exit code 2) only if no required tests exist.

The repository has no `docs/architecture/glossary.md`. Do not add domain terms to the catalog without developer approval.

## Two test suites, kept apart

| Suite | Where | Run with | In the catalog? |
|---|---|---|---|
| Legacy unit and component tests | `src/**/*.test.ts(x)` | `npm test`, `npm run test:run`, `npm run test:coverage` | No |
| Legacy Playwright layer tests | `e2e/` | `npm run test:e2e*` (uses `playwright.legacy-e2e.config.ts`) | No |
| Catalog tests | `tests/` | `npm run test:*` commands below | Yes |

- `vitest.config.ts` defines two Vitest projects. `app` runs the legacy `src/` tests (jsdom, ArcGIS mocks) and ignores `tests/`. `catalog` runs `tests/**/*.test.ts` in a Node environment, excluding `*.example.test.ts`. `npm test`, `test:ui`, `test:run`, and `test:coverage` pass `--project app`, so they behave as they did before the catalog existed. The test runner selects catalog tests by source file.
- `playwright.config.ts` is the catalog config (`testDir: ./tests`). `playwright.legacy-e2e.config.ts` is the former default config (`testDir: ./e2e`, port 5180). Neither one discovers the other's files. `playwright.checkpoint.config.ts` extends the legacy config.
- `npm run test:all` runs every enabled catalog test plus `npm run lint`. It does not run the legacy `src/` Vitest tests or the legacy `e2e/` tests, because they are not catalog tests and some fail today. Run `npm run test:run` separately for them.

## Commands

Run these from the repository root.

- `npm run test:view-test-catalog` writes `.test-results/catalog.html`, serves it at `http://127.0.0.1:4174/` (the next free port if that one is busy; set `TNC_CATALOG_PORT` to change the preferred port), and opens it. Ctrl+C stops the server. `--no-open` serves without launching a browser. `--no-serve` writes the file and exits. It never executes tests. The page shows Feature Set, Feature, and Feature Behavior Tests, with Critical Core collapsed. Supporting Tests are intentionally absent from this page. Each opened test keeps Test methodology collapsed. The header shows the latest command and its status separately from the release-gate status.
- `npm run test:fast-only` runs non-browser tests marked `fast: true` and reports exclusions.
- `npm run test:features` runs enabled Feature Behavior Tests, including nonblocking ones. It excludes Critical Core and Supporting Tests.
- `npm run test:core` runs enabled Critical Core Tests.
- `npm run test:shared` runs enabled Shared Supporting Tests (`SST-*`).
- `npm run test:browser-deterministic` runs enabled deterministic browser tests (`*.deterministic.spec.ts`).
- `npm run test:browser-live` runs enabled live browser tests (`*.live.spec.ts`).
- `npm run test:refresh-map-cache` deletes the saved Esri responses and runs every enabled live browser test to download them again.
- `npm run test:browser-all` and `npm run test:browser-only` run both browser modes.
- `npm run test:gate` runs required Critical Core Tests first, stops on failure or inconclusive verification, then required Feature Behavior Tests. Supporting Tests and lint are outside the gate. With zero required tests it is inconclusive, exits with code 2, and never stores Passed.
- `npm run test:all` runs every enabled catalog test plus lint, and reports release eligibility separately from diagnostic health. Lint currently fails on pre-existing errors (see Known baseline), so diagnostic health reads unsuccessful until those are fixed.
- `npm run test:feature -- F-110` runs enabled tests owned by or associated with one Feature. A catalog test identifier instead runs that one test, even when disabled.
- `npm run test:feature-set -- FS-100` runs enabled tests associated with one Feature Set.
- `npm run test:id -- FBT-133` runs that one catalog test, including a disabled one. It does not change release-gate status.

Two opt-in flags, accepted before or after the selector: `--headed` opens visible browser windows (results are recorded), and `--ui` opens Playwright UI mode for the selected browser tests (results are never recorded, and `test:gate` rejects it). `--autorun` with `--ui` presses Run all on open.

Exit codes: 0 passed, 1 failed, 2 required verification inconclusive. Results live in `.test-results/latest.json` and `.test-results/history.json` (up to 20 runs). Both are ignored by Git.

## Lifecycle and enforcement

Feature lifecycle (`active`, `deprecated`, `retired`) and test enforcement (`required`, `nonblocking`, `disabled`) are independent catalog fields.

- Critical Core Tests use `required`.
- Active Feature Behavior Tests default to `required`. A `nonblocking` or `disabled` exception needs approval evidence in the catalog.
- Deprecated Feature Behavior Tests may stay `required` or, with explicit approval metadata, use `nonblocking` or `disabled`.
- Feature Supporting and Shared Supporting Tests are advisory: `nonblocking` or `disabled`. `required` is rejected.

Nonblocking and disabled tests stay visible in the catalog. Disabled tests are skipped by feature, suite, and gate commands, and run only when named by identifier. Lifecycle and enforcement changes need a reason, the affected behaviors, the consequences, and approval. Adding, deleting, weakening, reclassifying, or raising the budget of any permanent test needs explicit developer approval first. See `~/.cursor/rules/testing-governance.mdc`.

## Bug Checks

A Bug Check is a Feature Behavior Test with `regression: true`. It checks that one known or likely bug stays absent. It requires a nonempty `bugReference` and a separate nonempty `rootCauseAnalysis`. A baseline Feature Behavior Test has `regression: false`, `bugReference: null`, and `rootCauseAnalysis: null`.

## Fixtures, cache, and reports

Reviewed fixtures live in `tests/fixtures/recorded`, with source, version, checksum, review, and association metadata in `tests/fixtures/manifests` (schema: `fixture-manifest.schema.json`). Neither folder has entries yet. Refresh is manual: replace the reviewed file, run `shasum -a 256 <fixture>`, update its manifest, and obtain review approval.

The ignored local cache defaults to `.test-cache`. Set `TNC_TEST_CACHE_DIR` to an absolute path to share a cache between clones. Generated artifacts, reports, results, and the catalog page stay under `.test-cache/`, `.test-results/`, `playwright-report/`, and `test-results/`, all ignored by Git.

Live browser tests reuse saved live-service responses through the response cache in `tests/support/browser/response-cache/`. It has one source today:

- Esri responses (`*.arcgis.com`, `*.arcgisonline.com`) in `.test-cache/esri-responses/v1`. The key is the request URL with tokens and `_ts` removed and the query sorted.

A response missing from the cache is fetched live and saved, and that miss never fails a test. HTTP 200 and 404 responses are saved. HTTP 429 and 5xx are not. Replays return the saved status, content type, and exact body bytes. A new live service (for example iNaturalist, Dendra, or ANiML) gets its own source module in that folder, listed in `RESPONSE_CACHE_SOURCES` in `index.ts` and `RESPONSE_CACHE_FOLDERS` in `cache-location.ts`. This cache is unrelated to the reviewed fixtures. A lint rule (`.eslintrc.cjs` override) requires `*.live.spec.ts` files to import `test` and `expect` from `tests/support/browser/response-cache/index.ts`.

## Browser projects and workers

`playwright.config.ts` defines two projects.

| Project | Files | Workers | Retries | Timeout per attempt | Network |
|---|---|---|---|---|---|
| `deterministic` | `*.deterministic.spec.ts` | 1 | 0 | 30 s | Unexpected external requests fail the test (`tests/support/browser/deterministic-network.ts`; exceptions in `tests/support/browser/deterministic-allowlist.ts`) |
| `live` | `*.live.spec.ts` | 2 | 1 | 30 s | Real services through the response cache |

The live project uses the `chromium` channel, so WebGL (Web Graphics Library) runs on the GPU (graphics processing unit). The default headless shell draws on a CPU renderer (SwiftShader) that is several times slower for map views. First-time setup is `npx playwright install chromium`.

Workers are separate browser processes that share one page server, the GPU, and the network. More workers are not automatically faster, and they can push tests into their budget and a retry. These counts are template defaults and are not benchmarked for this app. Benchmark with real live tests before raising either count.

Live tests budget 20 s each (`durationBudgetMs: 20000`). A longer budget needs explicit approval. A pass after a failed first attempt counts as passed and shows `passed after retry`; the failed attempt's trace and screenshot are kept.

The page server is the app's Vite dev server, started directly on `127.0.0.1` at `TNC_TEST_PORT` (default `4177`) with `--strictPort`. It skips the standalone-Experience build that `npm run dev` runs first. The runner picks a per-run port unless `TNC_TEST_PORT` is set. The existing legacy e2e config keeps port 5180.

## Environment variables

- `TNC_TEST_PORT` page-server port (default `4177` when running Playwright directly).
- `TNC_TEST_CACHE_DIR` response-cache and test-cache root (default `.test-cache`).
- `TNC_TEST_RUN_PLAN`, `TNC_PLAYWRIGHT_OUTPUT_DIR` set by the runner for reporters.
- `TNC_CATALOG_PORT` preferred catalog-viewer port (default `4174`).

## Type checking

`npx tsc --noEmit` checks the application as before. `npx tsc -p tsconfig.test.json --noEmit` checks the test support code (`tests/`, the Playwright and Vitest configs, and the runner). Run both after changing test infrastructure.

## Known baseline

These failures predate the catalog and are not caused by it.

- `npm run test:run`: 11 of 66 files fail (36 of 400 tests), including `e2e/` spec files that the `app` project picks up and Vitest cannot run.
- `npm run lint`: about 312 errors and 664 warnings, mostly `no-undef` on browser and ArcGIS type globals in `src/`.
