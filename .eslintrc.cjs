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
}