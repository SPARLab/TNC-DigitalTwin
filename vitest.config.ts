/// <reference types="vitest" />
import { configDefaults } from 'vitest/config'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test-setup.ts'],
    css: true,
    // Standalone Experiences (git submodules) run their own test suites.
    exclude: [...configDefaults.exclude, 'standalone-experiences/**', 'public/standalone-experiences/**'],
    server: {
      deps: {
        external: ['@arcgis/core']
      }
    }
  },
  esbuild: {
    jsx: 'automatic'
  }
})
