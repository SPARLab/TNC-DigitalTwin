// ============================================================================
// Feature flags for pages that are not ready for the production build.
// ============================================================================

/**
 * Notebooks is a scaffold. It stays available while developing (`npm run dev`)
 * and in tests, and is hidden from the production build: no nav item, and its
 * route redirects home.
 */
export const NOTEBOOKS_ENABLED = !import.meta.env.PROD;
