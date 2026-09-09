// ============================================================================
// CatalogWorkbench — the data catalog page.
// Structure: Header → (LeftSidebar | Map + FloatingWidgets | RightSidebar)
// ============================================================================

import { useState } from 'react';
import { PanelRightClose, PanelRightOpen } from 'lucide-react';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import { V2Header } from '../components/Header/V2Header';
import { LeftSidebar } from '../components/LeftSidebar/LeftSidebar';
import { MapContainer } from '../components/Map/MapContainer';
import { RightSidebar } from '../components/RightSidebar/RightSidebar';
import { ExportBuilderModal } from '../components/ExportBuilder/ExportBuilderModal';

const RIGHT_SIDEBAR_STORAGE_KEY = 'v2-right-sidebar-collapsed';

export function CatalogWorkbench() {
  const [isExportBuilderOpen, setIsExportBuilderOpen] = useState(false);
  const [isRightSidebarCollapsed, setIsRightSidebarCollapsed] = useLocalStorage(
    RIGHT_SIDEBAR_STORAGE_KEY,
    false,
  );

  const toggleRightSidebar = () => {
    setIsRightSidebarCollapsed((current) => !current);
  };

  return (
    <div id="v2-app" className="flex flex-col h-full w-full overflow-hidden">
      <V2Header onOpenExportBuilder={() => setIsExportBuilderOpen(true)} />
      <div id="v2-main-layout" className="relative flex flex-1 overflow-hidden">
        <LeftSidebar />
        <MapContainer />
        <div
          id="right-sidebar-shell"
          className={`relative h-full w-[400px] flex-shrink-0 overflow-visible transition-[margin-right] duration-300 ease-in-out ${
            isRightSidebarCollapsed ? '-mr-[400px]' : 'mr-0'
          }`}
        >
          <button
            id="right-sidebar-edge-toggle-button"
            type="button"
            onClick={toggleRightSidebar}
            className="absolute left-0 top-1/2 z-[100] -translate-x-full -translate-y-1/2 flex h-12 w-6 items-center justify-center rounded-l-xl border border-r-0 border-gray-200 bg-white text-gray-400 shadow-none transition-colors hover:bg-gray-50 hover:text-gray-700"
            title={isRightSidebarCollapsed ? 'Expand right sidebar' : 'Collapse right sidebar'}
            aria-label={isRightSidebarCollapsed ? 'Expand right sidebar' : 'Collapse right sidebar'}
          >
            {isRightSidebarCollapsed ? (
              <PanelRightOpen className="h-4 w-4" />
            ) : (
              <PanelRightClose className="h-4 w-4" />
            )}
          </button>
          <div id="right-sidebar-shell-panel" className="absolute inset-0">
            <RightSidebar onCollapse={() => setIsRightSidebarCollapsed(true)} />
          </div>
        </div>
      </div>
      <ExportBuilderModal
        isOpen={isExportBuilderOpen}
        onClose={() => setIsExportBuilderOpen(false)}
      />
    </div>
  );
}
