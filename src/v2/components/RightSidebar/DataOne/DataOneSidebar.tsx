// ============================================================================
// DataOneSidebar — Compatibility wrapper for DataOne browse entry.
// Core RightSidebar hosts tabs globally; this component exposes a shell view.
// ============================================================================

import { DataOneBrowseTab } from './DataOneBrowseTab';

export function DataOneSidebar() {
  return (
    <div id="dataone-sidebar-shell">
      <DataOneBrowseTab />
    </div>
  );
}
