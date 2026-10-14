// ============================================================================
// legendVisibilityStore — whether the floating map legend has been closed.
// The legend widget's X button hides it; the map control rail then offers a
// button to bring it back. Kept for the session, shared by every legend widget.
// ============================================================================

import { useSyncExternalStore } from 'react';

let legendHidden = false;
const listeners = new Set<() => void>();

function emit(): void {
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function hideLegend(): void {
  if (legendHidden) return;
  legendHidden = true;
  emit();
}

export function showLegend(): void {
  if (!legendHidden) return;
  legendHidden = false;
  emit();
}

export function useLegendHidden(): boolean {
  return useSyncExternalStore(subscribe, () => legendHidden, () => false);
}
