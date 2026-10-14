import { useSyncExternalStore } from 'react';

function subscribe(query: string, onChange: () => void): () => void {
  if (typeof window.matchMedia !== 'function') return () => undefined;
  const list = window.matchMedia(query);
  list.addEventListener('change', onChange);
  return () => list.removeEventListener('change', onChange);
}

function getSnapshot(query: string): boolean {
  return typeof window.matchMedia === 'function' && window.matchMedia(query).matches;
}

/** Tracks whether a CSS media query currently matches. False where unsupported (tests). */
export function useMediaQuery(query: string): boolean {
  return useSyncExternalStore(
    (onChange) => subscribe(query, onChange),
    () => getSnapshot(query),
    () => false,
  );
}
