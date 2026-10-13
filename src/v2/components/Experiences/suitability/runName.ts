// ============================================================================
// Run name rules for the suitability wizard.
// ============================================================================

function normalizeRunName(name: string): string {
  return name.trim().replace(/\s+/g, ' ').toLowerCase();
}

/**
 * Returns a message when the name cannot be used, or null when it is fine.
 * Names are compared ignoring case and extra spaces.
 */
export function validateRunName(name: string, existingNames: string[]): string | null {
  const normalized = normalizeRunName(name);
  if (!normalized) return 'Enter a run name before running the analysis.';
  const clash = existingNames.find((existing) => normalizeRunName(existing) === normalized);
  if (clash != null) {
    return `A run named “${clash}” already exists. Choose a different name.`;
  }
  return null;
}
