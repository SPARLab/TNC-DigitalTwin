// ============================================================================
// bottomSheetStore — which side panel is currently open as a bottom sheet.
// Only one sheet is open at a time, so opening one closes the other. Session-only.
// ============================================================================

import { useSyncExternalStore } from 'react';

let openKey: string | null = null;
const listeners = new Set<() => void>();

export function setOpenSheet(key: string | null): void {
  if (key === openKey) return;
  openKey = key;
  listeners.forEach((listener) => listener());
}

/** Close this sheet, unless a different one has already taken over. */
export function closeSheet(key: string): void {
  if (openKey === key) setOpenSheet(null);
}

export function useOpenSheetKey(): string | null {
  return useSyncExternalStore(
    (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    () => openKey,
    () => null,
  );
}

// ----------------------------------------------------------------------------
// Visible tabs. The tab bar is fixed to the bottom of the screen, so the page
// reserves room for it; only tabs actually on screen count (pages that are
// kept mounted but hidden do not).
// ----------------------------------------------------------------------------

const visibleTabs = new Set<string>();

export function setTabVisible(key: string, visible: boolean): void {
  const had = visibleTabs.has(key);
  if (visible === had) return;
  if (visible) visibleTabs.add(key);
  else visibleTabs.delete(key);
  listeners.forEach((listener) => listener());
}

/** True while at least one bottom-sheet tab is on screen. */
export function useHasSheetTabs(): boolean {
  return useSyncExternalStore(
    (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    () => visibleTabs.size > 0,
    () => false,
  );
}