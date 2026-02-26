// ============================================================================
// V2App — Main layout for the v2 Digital Catalog
// Structure: Header → (LeftSidebar | Map + FloatingWidgets | RightSidebar)
// ============================================================================

import { useEffect, useState } from 'react';
import { V2AppProviders } from './app/V2AppProviders';
import { V2AppRoutes } from './app/V2AppRoutes';

export default function V2App() {
  const [isExportBuilderOpen, setIsExportBuilderOpen] = useState(false);
  const [isRightSidebarCollapsed, setIsRightSidebarCollapsed] = useState(false);

  useEffect(() => {
    const savedPreference = window.localStorage.getItem('v2-right-sidebar-collapsed');
    if (savedPreference == null) return;
    setIsRightSidebarCollapsed(savedPreference === 'true');
  }, []);

  useEffect(() => {
    window.localStorage.setItem('v2-right-sidebar-collapsed', String(isRightSidebarCollapsed));
  }, [isRightSidebarCollapsed]);

  const toggleRightSidebar = () => {
    setIsRightSidebarCollapsed((current) => !current);
  };

  return (
    <V2AppProviders>
      <V2AppRoutes
        isExportBuilderOpen={isExportBuilderOpen}
        onOpenExportBuilder={() => setIsExportBuilderOpen(true)}
        onCloseExportBuilder={() => setIsExportBuilderOpen(false)}
        isRightSidebarCollapsed={isRightSidebarCollapsed}
        onToggleRightSidebar={toggleRightSidebar}
        onCollapseRightSidebar={() => setIsRightSidebarCollapsed(true)}
      />
    </V2AppProviders>
  );
}
