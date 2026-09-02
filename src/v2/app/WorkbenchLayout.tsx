// ============================================================================
// WorkbenchLayout — layout route for the map-backed pages. Scopes the catalog
// and per-data-source providers to the routes that actually need them so the
// landing and notebooks pages skip the catalog registry fetch entirely.
// ============================================================================

import { Outlet } from 'react-router-dom';
import { V2AppProviders } from './V2AppProviders';

export function WorkbenchLayout() {
  return (
    <V2AppProviders>
      <Outlet />
    </V2AppProviders>
  );
}
