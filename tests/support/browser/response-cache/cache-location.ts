import path from 'node:path';

/**
 * Disk folders, under the test cache root (`.test-cache` or `TNC_TEST_CACHE_DIR`), that
 * hold saved live-service responses. Each source keeps its own folder so one source can
 * be cleared or re-versioned without touching another.
 */
export const ESRI_RESPONSE_CACHE_FOLDER = 'esri-responses';
/** Every response-cache folder. `npm run test:refresh-map-cache` should clear all of them. */
export const RESPONSE_CACHE_FOLDERS = [ESRI_RESPONSE_CACHE_FOLDER] as const;

/** Versioned directory of saved Esri responses for one cache root. */
export function esriResponseCacheDirectory(cacheRoot: string): string {
  return path.join(cacheRoot, ESRI_RESPONSE_CACHE_FOLDER, 'v1');
}
