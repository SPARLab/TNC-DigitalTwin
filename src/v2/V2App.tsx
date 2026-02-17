// ============================================================================
// V2App — Main layout for the v2 Digital Catalog
// Structure: Header → (LeftSidebar | Map + FloatingWidgets | RightSidebar)
// ============================================================================

import { useState } from 'react';
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
import { V2Header } from './components/Header/V2Header';
import { LeftSidebar } from './components/LeftSidebar/LeftSidebar';
import { MapContainer } from './components/Map/MapContainer';
import { RightSidebar } from './components/RightSidebar/RightSidebar';
import { ExportBuilderModal } from './components/ExportBuilder/ExportBuilderModal';

export default function V2App() {
  const [isExportBuilderOpen, setIsExportBuilderOpen] = useState(false);

  return (
    <CatalogProvider>
      <LayerProvider>
        <MapProvider>
          <INaturalistFilterProvider>
            <DendraProvider>
              <AnimlFilterProvider>
                <TNCArcGISProvider>
                  <DataOneFilterProvider>
                    <DroneDeployProvider>
                      <div id="v2-app" className="flex flex-col h-screen w-screen overflow-hidden">
                        <V2Header onOpenExportBuilder={() => setIsExportBuilderOpen(true)} />
                        <div id="v2-main-layout" className="flex flex-1 overflow-hidden">
                          <LeftSidebar />
                          <MapContainer />
                          <RightSidebar />
                        </div>
                        <ExportBuilderModal
                          isOpen={isExportBuilderOpen}
                          onClose={() => setIsExportBuilderOpen(false)}
                        />
                      </div>
                    </DroneDeployProvider>
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
