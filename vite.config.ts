import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    // @arcgis/core is deep-imported one module at a time, so any new import pulls
    // a dependency Vite has not pre-bundled and triggers a re-optimize. On Windows
    // that rename of node_modules/.vite/deps regularly fails with EBUSY, which
    // then serves 504s for every ArcGIS module until the cache is cleared by hand.
    // The package already ships ESM, so it is served unbundled instead.
    exclude: ['@arcgis/core'],
  },
  build: {
    sourcemap: true,
  },
  css: {
    devSourcemap: true,
  },
  server: {
    port: 5173,
    host: true,
  },
})
