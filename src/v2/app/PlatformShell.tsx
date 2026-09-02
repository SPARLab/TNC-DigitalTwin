// ============================================================================
// PlatformShell — outermost layout route: persistent nav rail + active page.
// ============================================================================

import { Outlet } from 'react-router-dom';
import { NavRail } from '../components/NavRail/NavRail';

export function PlatformShell() {
  return (
    <div id="platform-shell" className="flex h-screen w-screen overflow-hidden">
      <NavRail />
      <div id="platform-page-area" className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <Outlet />
      </div>
    </div>
  );
}
