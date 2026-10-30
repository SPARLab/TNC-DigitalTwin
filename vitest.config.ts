import { configDefaults, defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
//
// Two Vitest projects share this file:
//   - `app`: the original unit and component tests under src/ (jsdom, ArcGIS mocks).
//     These are NOT catalog tests. `npm run test`, `test:run`, and `test:coverage`
//     keep running them, and `npm run test:all` does not (see TESTING.md).
//   - `catalog`: permanent catalog tests under tests/ (node environment). The test
//     runner (scripts/test-runner.ts) selects them by source file from
//     tests/support/catalog/test-catalog.json. `*.example.test.ts` skeletons are
//     never discovered.
export default defineConfig({
  plugins: [react()],
  esbuild: {
    jsx: 'automatic'
  },
  test: {
    // The runner adds its own progress reporter on the command line.
    reporters: ['default'],
    passWithNoTests: false,
    projects: [
      {
        extends: true,
        test: {
          name: 'app',
          globals: true,
          environment: 'jsdom',
          setupFiles: ['./src/test-setup.ts'],
          css: true,
          // Standalone Experiences (git submodules) run their own test suites.
          // tests/ belongs to the catalog project below.
          exclude: [
            ...configDefaults.exclude,
            'standalone-experiences/**',
            'public/standalone-experiences/**',
            'tests/**'
          ],
          server: {
            deps: {
              external: ['@arcgis/core']
            }
          }
        }
      },
      {
        extends: true,
        test: {
          name: 'catalog',
          environment: 'node',
          include: ['tests/**/*.test.ts'],
          exclude: [
            ...configDefaults.exclude,
            'tests/**/*.spec.ts',
            'tests/**/*.example.test.ts'
          ]
        }
      }
    ]
  }
})
