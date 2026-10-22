// ============================================================================
// NavMenuButton — hamburger that opens the platform menu on narrow windows.
// Renders nothing on wider windows, where the nav rail is shown instead.
// ============================================================================

import { Menu } from 'lucide-react';
import { NARROW_VIEWPORT_QUERY } from '../../config/layout';
import { useMediaQuery } from '../../hooks/useMediaQuery';
import { toggleNavMenu, useNavMenuOpen } from './navMenuStore';

interface NavMenuButtonProps {
  className?: string;
}

export function NavMenuButton({ className = '' }: NavMenuButtonProps) {
  const isNarrow = useMediaQuery(NARROW_VIEWPORT_QUERY);
  const isOpen = useNavMenuOpen();

  if (!isNarrow) return null;

  return (
    <button
      type="button"
      onClick={toggleNavMenu}
      aria-label="Open navigation menu"
      aria-expanded={isOpen}
      aria-controls="platform-nav-rail"
      title="Menu"
      className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-md text-white transition-colors hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300 ${className}`}
    >
      <Menu className="h-5 w-5" aria-hidden />
    </button>
  );
}
