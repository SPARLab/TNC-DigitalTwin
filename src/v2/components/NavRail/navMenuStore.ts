// ============================================================================
// navMenuStore — whether the platform menu is open on compact and narrow windows.
// Shared so the hamburger buttons (in page headers) and the NavRail menu itself
// stay in step. Session-only: it is never saved, and always starts closed.
// ============================================================================

import { useSyncExternalStore } from 'react';

let isOpen = false;
const listeners = new Set<() => void>();

function emit(): void {
  listeners.forEach((listener) => listener());
}

export function setNavMenuOpen(next: boolean): void {
  if (next === isOpen) return;
  isOpen = next;
  emit();
}

export function toggleNavMenu(): void {
  setNavMenuOpen(!isOpen);
}

export function closeNavMenu(): void {
  setNavMenuOpen(false);
}

export function useNavMenuOpen(): boolean {
  return useSyncExternalStore(
    (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    () => isOpen,
    () => false,
  );
}
