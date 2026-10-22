// Test helper: fakes which of the layout media queries match.

import {
  COMPACT_VIEWPORT_QUERY,
  NARROW_VIEWPORT_QUERY,
  PORTRAIT_VIEWPORT_QUERY,
} from '../config/layout';

interface Viewport {
  compact?: boolean;
  narrow?: boolean;
  portrait?: boolean;
}

const originalMatchMedia = window.matchMedia;

export function mockViewport({ compact = false, narrow = false, portrait = false }: Viewport): void {
  const matchesByQuery: Record<string, boolean> = {
    [COMPACT_VIEWPORT_QUERY]: compact || narrow,
    [NARROW_VIEWPORT_QUERY]: narrow,
    [PORTRAIT_VIEWPORT_QUERY]: portrait,
  };

  window.matchMedia = ((query: string) => ({
    matches: matchesByQuery[query] ?? false,
    media: query,
    addEventListener: () => undefined,
    removeEventListener: () => undefined,
  })) as unknown as typeof window.matchMedia;
}

export function restoreViewport(): void {
  window.matchMedia = originalMatchMedia;
}
