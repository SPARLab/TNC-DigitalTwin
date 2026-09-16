// ============================================================================
// CatalogWorkbench — the data catalog page.
// Structure: Header → (LeftSidebar | Map + FloatingWidgets | RightSidebar)
// ============================================================================

import { useRef, useState } from 'react';
import { V2Header } from '../components/Header/V2Header';
import { LeftSidebar } from '../components/LeftSidebar/LeftSidebar';
import { MapContainer } from '../components/Map/MapContainer';
import { RightSidebar } from '../components/RightSidebar/RightSidebar';
import { ExportBuilderModal } from '../components/ExportBuilder/ExportBuilderModal';
import {
  ResizablePanel,
  type ResizablePanelHandle,
} from '../components/shared/ResizablePanel';

export function CatalogWorkbench() {
  const [isExportBuilderOpen, setIsExportBuilderOpen] = useState(false);
  const rightPanelRef = useRef<ResizablePanelHandle>(null);

  return (
    <div id="v2-app" className="flex h-full w-full flex-col overflow-hidden">
      <V2Header onOpenExportBuilder={() => setIsExportBuilderOpen(true)} />
      <div id="v2-main-layout" className="relative flex flex-1 overflow-hidden">
        <ResizablePanel
          side="left"
          storageKey="v2-catalog-left-panel"
          defaultWidth={280}
          minWidth={220}
          maxWidth={460}
          label="data catalog"
        >
          <LeftSidebar />
        </ResizablePanel>

        <div className="relative flex min-w-0 flex-1">
          <MapContainer />
        </div>

        <ResizablePanel
          ref={rightPanelRef}
          side="right"
          storageKey="v2-catalog-right-panel"
          defaultWidth={400}
          minWidth={320}
          maxWidth={620}
          label="layer details"
        >
          <RightSidebar onCollapse={() => rightPanelRef.current?.collapse()} />
        </ResizablePanel>
      </div>
      <ExportBuilderModal
        isOpen={isExportBuilderOpen}
        onClose={() => setIsExportBuilderOpen(false)}
      />
    </div>
  );
}
