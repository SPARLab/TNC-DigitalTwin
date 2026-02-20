// ============================================================================
// V2App — Main layout for the v2 Digital Catalog
// Structure: Header → (LeftSidebar | Map + FloatingWidgets | RightSidebar)
// ============================================================================

import { useEffect, useState } from 'react';
import { PanelRightClose, PanelRightOpen } from 'lucide-react';
import { CatalogProvider } from './context/CatalogContext';
import { LayerProvider } from './context/LayerContext';
// NOTE: BookmarkProvider disabled per Feb 11 design decision.
// Saved Items widget merged into Map Layers. Code preserved for future reuse.
// import { BookmarkProvider } from './context/BookmarkContext';
import { MapProvider } from './context/MapContext';
import { INaturalistFilterProvider } from './context/INaturalistFilterContext';
import { DendraProvider } from './context/DendraContext';
import { AnimlFilterProvider } from './context/AnimlFilterContext';
import { TNCArcGISProvider } from './context/TNCArcGISContext';
import { DataOneFilterProvider } from './context/DataOneFilterContext';
import { DroneDeployProvider } from './context/DroneDeployContext';
import { GBIFFilterProvider } from './context/GBIFFilterContext';
import { V2Header } from './components/Header/V2Header';
import { LeftSidebar } from './components/LeftSidebar/LeftSidebar';
import { MapContainer } from './components/Map/MapContainer';
import { RightSidebar } from './components/RightSidebar/RightSidebar';
import { ExportBuilderModal } from './components/ExportBuilder/ExportBuilderModal';

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
    <CatalogProvider>
      <LayerProvider>
        <MapProvider>
          <INaturalistFilterProvider>
            <DendraProvider>
              <AnimlFilterProvider>
                <TNCArcGISProvider>
                  <DataOneFilterProvider>
                    <GBIFFilterProvider>
                      <DroneDeployProvider>
                        <div id="v2-app" className="flex flex-col h-screen w-screen overflow-hidden">
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
                              <div
                                id="right-sidebar-shell-panel"
                                className="absolute inset-0"
                              >
                                <RightSidebar onCollapse={() => setIsRightSidebarCollapsed(true)} />
                              </div>
                            </div>
                          </div>
                          <ExportBuilderModal
                            isOpen={isExportBuilderOpen}
                            onClose={() => setIsExportBuilderOpen(false)}
                          />
                        </div>
                      </DroneDeployProvider>
                    </GBIFFilterProvider>
                  </DataOneFilterProvider>
                </TNCArcGISProvider>
              </AnimlFilterProvider>
            </DendraProvider>
          </INaturalistFilterProvider>
        </MapProvider>
      </LayerProvider>
    </CatalogProvider>
  );
}
