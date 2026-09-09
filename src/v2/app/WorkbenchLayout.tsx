// ============================================================================
// WorkbenchLayout — previously scoped catalog providers to /catalog.
// Providers now live on PlatformShell so pins survive page changes.
// Kept as a passthrough in case older tests still wrap with it.
// ============================================================================

import { Outlet } from 'react-router-dom';

export function WorkbenchLayout() {
  return <Outlet />;
}
