// ============================================================================
// The observation timestamp format shared by every monitoring panel, badge and
// popup, so that a reading shown in two places is never stamped two ways.
// ============================================================================

/** Formats an epoch as e.g. "Sep 8, 2:15 PM". Zero reads as unknown. */
export function formatObservedAt(epochMs: number): string {
  if (!epochMs) return 'Unknown';
  return new Date(epochMs).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}
