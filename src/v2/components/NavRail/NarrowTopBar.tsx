// ============================================================================
// NarrowTopBar — slim bar with the hamburger and the current section's name.
// Stands in for the nav rail on narrow windows, on pages that have no header
// of their own to hold the hamburger (the catalog header carries its own).
// ============================================================================

import { useLocation } from 'react-router-dom';
import { FEEDBACK_NAV_ITEM, PLATFORM_NAV_ITEMS, isNavItemActive } from '../../config/navigation';
import { NavMenuButton } from './NavMenuButton';

export function NarrowTopBar() {
  const { pathname } = useLocation();
  const section = [...PLATFORM_NAV_ITEMS, FEEDBACK_NAV_ITEM].find((item) => isNavItemActive(item.path, pathname));

  return (
    <div
      id="narrow-top-bar"
      className="flex h-11 flex-shrink-0 items-center gap-1 border-b border-emerald-950/40 bg-emerald-900 px-1.5"
    >
      <NavMenuButton />
      <span className="truncate text-sm font-semibold text-white">
        {section?.label ?? 'Digital Twin'}
      </span>
    </div>
  );
}
