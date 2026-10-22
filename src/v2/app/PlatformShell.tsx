// ============================================================================
// PlatformShell — outermost layout route: persistent nav rail + active page.
// Catalog providers live here so pinned layers survive leaving /catalog.
// ============================================================================

import { Outlet, useLocation } from 'react-router-dom';
import { NavRail } from '../components/NavRail/NavRail';
import { NarrowTopBar } from '../components/NavRail/NarrowTopBar';
import { NARROW_VIEWPORT_QUERY } from '../config/layout';
import { useMediaQuery } from '../hooks/useMediaQuery';
import { platformSectionFromPath } from './platformSections';
import { useHasSheetTabs } from '../components/shared/bottomSheetStore';
import { V2AppProviders } from './V2AppProviders';

export function PlatformShell() {
  const { pathname } = useLocation();
  const isNarrow = useMediaQuery(NARROW_VIEWPORT_QUERY);
  // The catalog header holds its own hamburger; other pages get a slim bar for it.
  const showTopBar = isNarrow && platformSectionFromPath(pathname) !== 'catalog';
  // On phones the side panels are a tab bar fixed to the bottom edge (2.5rem tall).
  // Reserving that strip keeps map controls, legends and attribution above it.
  const hasSheetTabs = useHasSheetTabs();

  return (
    <div id="platform-shell" className="flex h-screen w-screen overflow-hidden">
      <NavRail />
      <div
        id="platform-page-area"
        className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden"
        style={{ paddingBottom: hasSheetTabs ? '2.5rem' : undefined }}
      >
        {showTopBar && <NarrowTopBar />}
        <V2AppProviders>
          <Outlet />
        </V2AppProviders>
      </div>
    </div>
  );
}
