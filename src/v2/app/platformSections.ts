// ============================================================================
// Platform sections — which page tree a pathname belongs to.
// ============================================================================

import { NOTEBOOKS_ENABLED } from '../config/featureFlags';

export type PlatformSection = 'home' | 'about' | 'catalog' | 'monitoring' | 'experiences' | 'notebooks' | 'feedback';

export function platformSectionFromPath(
  pathname: string,
  notebooksEnabled: boolean = NOTEBOOKS_ENABLED,
): PlatformSection | null {
  if (pathname === '/') return 'home';
  if (pathname === '/about' || pathname.startsWith('/about/')) return 'about';
  if (pathname === '/catalog' || pathname.startsWith('/catalog/')) return 'catalog';
  if (pathname === '/monitoring' || pathname.startsWith('/monitoring/')) return 'monitoring';
  if (pathname === '/feedback' || pathname.startsWith('/feedback/')) return 'feedback';
  if (pathname === '/experiences' || pathname.startsWith('/experiences/')) return 'experiences';
  // Hidden routes fall through to null, which redirects home.
  if (notebooksEnabled && (pathname === '/notebooks' || pathname.startsWith('/notebooks/'))) {
    return 'notebooks';
  }
  return null;
}
