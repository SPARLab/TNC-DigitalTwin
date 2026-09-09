// ============================================================================
// PlatformShell — outermost layout route: persistent nav rail + active page.
// Catalog providers live here so pinned layers survive leaving /catalog.
// ============================================================================

import { Outlet } from 'react-router-dom';
import { NavRail } from '../components/NavRail/NavRail';
import { V2AppProviders } from './V2AppProviders';

export function PlatformShell() {
  return (
    <div id="platform-shell" className="flex h-screen w-screen overflow-hidden">
      <NavRail />
      <div id="platform-page-area" className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
        <V2AppProviders>
          <Outlet />
        </V2AppProviders>
      </div>
    </div>
  );
}
