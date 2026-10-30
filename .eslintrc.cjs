module.exports = {
  root: true,
  env: { browser: true, es2020: true },
  extends: [
    'eslint:recommended',
  ],
  // Standalone Experiences are separate repos (submodules) with their own lint setup.
  ignorePatterns: ['dist', '.eslintrc.cjs', 'standalone-experiences', 'public/standalone-experiences'],
  parser: '@typescript-eslint/parser',
  plugins: ['react-refresh'],
  rules: {
    'react-refresh/only-export-components': [
      'warn',
      { allowConstantExport: true },
    ],
    'no-unused-vars': 'warn',
    'prefer-const': 'error',
  },
  overrides: [
    {
      // Feature-centered test system (see TESTING.md). This code runs in Node and is
      // type-checked by tsconfig.test.json (`npx tsc -p tsconfig.test.json`), so the
      // base-ESLint rules that cannot read TypeScript types are replaced by their
      // TypeScript-aware versions: `no-undef` misses Node and DOM globals and types
      // (Buffer, process, NodeJS), `no-redeclare` flags type-only imports named
      // Request/Response, and `no-unused-vars` flags parameter names in type signatures.
      files: [
        'tests/**/*.ts',
        'scripts/test-runner.ts',
        'playwright.config.ts',
        'playwright.legacy-e2e.config.ts',
        'vitest.config.ts',
      ],
      env: { node: true },
      plugins: ['@typescript-eslint'],
      rules: {
        'no-undef': 'off',
        'no-redeclare': 'off',
        'no-unused-vars': 'off',
        '@typescript-eslint/no-unused-vars': 'warn',
      },
    },
    {
      // Example skeletons are illustrative, never run, and declare unused seams on purpose.
      files: ['tests/**/*.example.spec.ts', 'tests/**/*.example.test.ts'],
      rules: { '@typescript-eslint/no-unused-vars': 'off' },
    },
    {
      // Live specs reuse saved Esri responses. See tests/support/browser/response-cache/index.ts.
      files: ['**/*.live.spec.ts'],
      rules: {
        'no-restricted-imports': [
          'error',
          {
            paths: [
              {
                name: '@playwright/test',
                message:
                  'Import test and expect from tests/support/browser/response-cache/index.ts so live tests reuse saved Esri responses.',
              },
            ],
          },
        ],
      },
    },
  ],
}