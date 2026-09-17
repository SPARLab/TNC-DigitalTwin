// ============================================================================
// Temporary locks for the low-stakes feedback deploy.
// Flip FEEDBACK_PREVIEW_MODE to false to restore Experiences, Notebooks, and login.
// ============================================================================

/** When true: hide sign-in; Experiences + Notebooks are under construction. */
export const FEEDBACK_PREVIEW_MODE = true;

export function isFeedbackPreviewLockedPath(path: string): boolean {
  if (!FEEDBACK_PREVIEW_MODE) return false;
  return (
    path === '/experiences'
    || path.startsWith('/experiences/')
    || path === '/notebooks'
    || path.startsWith('/notebooks/')
  );
}
