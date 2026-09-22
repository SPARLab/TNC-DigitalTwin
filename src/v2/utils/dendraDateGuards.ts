// ============================================================================
// Shared date helpers for Dendra chart pickers (no future dates; start ≤ end).
// ============================================================================

/** Today's date as YYYY-MM-DD in local time (matches `<input type="date">`). */
export function todayYmdLocal(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/** Clamp a YYYY-MM-DD string so it never exceeds today. */
export function clampDateToToday(value: string, today = todayYmdLocal()): string {
  if (!value) return value;
  return value > today ? today : value;
}

export function isStartAfterEnd(startDate: string, endDate: string): boolean {
  return Boolean(startDate && endDate && startDate > endDate);
}

export const START_AFTER_END_MESSAGE = 'Start date must be on or before end date.';
