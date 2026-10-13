// ============================================================================
// Platform sections — which page tree a pathname belongs to.
// ============================================================================

export type PlatformSection = 'home' | 'about' | 'catalog' | 'monitoring' | 'experiences' | 'notebooks';

export function platformSectionFromPath(pathname: string): PlatformSection | null {
  if (pathname === '/') return 'home';
  if (pathname === '/about' || pathname.startsWith('/about/')) return 'about';
  if (pathname === '/catalog' || pathname.startsWith('/catalog/')) return 'catalog';
  if (pathname === '/monitoring' || pathname.startsWith('/monitoring/')) return 'monitoring';
  if (pathname === '/experiences' || pathname.startsWith('/experiences/')) return 'experiences';
  if (pathname === '/notebooks' || pathname.startsWith('/notebooks/')) return 'notebooks';
  return null;
}
