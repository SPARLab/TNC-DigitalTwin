// ============================================================================
// V2App — Main layout for the v2 Digital Catalog
// Structure: Header → (LeftSidebar | Map + FloatingWidgets | RightSidebar)
// ============================================================================

import { CatalogProvider } from './context/CatalogContext';
import { LayerProvider } from './context/LayerContext';
// NOTE: BookmarkProvider disabled per Feb 11 design decision.
// Saved Items widget merged into Map Layers. Code preserved for future reuse.
// import { BookmarkProvider } from './context/BookmarkContext';
import { MapProvider } from './context/MapContext';
import { INaturalistFilterProvider } from './context/INaturalistFilterContext';
import { DendraProvider } from './context/DendraContext';
import { AnimlFilterProvider } from './context/AnimlFilterContext';
import { DataOneFilterProvider } from './context/DataOneFilterContext';
import { V2Header } from './components/Header/V2Header';
import { LeftSidebar } from './components/LeftSidebar/LeftSidebar';
import { MapContainer } from './components/Map/MapContainer';
import { RightSidebar } from './components/RightSidebar/RightSidebar';

export default function V2App() {
  return (
    <CatalogProvider>
      <LayerProvider>
        <MapProvider>
          <INaturalistFilterProvider>
            <DendraProvider>
              <AnimlFilterProvider>
                <DataOneFilterProvider>
                  <div id="v2-app" className="flex flex-col h-screen w-screen overflow-hidden">
                    <V2Header />
                    <div className="flex flex-1 overflow-hidden">
                      <LeftSidebar />
                      <MapContainer />
                      <RightSidebar />
                    </div>
                  </div>
                </DataOneFilterProvider>
              </AnimlFilterProvider>
            </DendraProvider>
          </INaturalistFilterProvider>
        </MapProvider>
      </LayerProvider>
    </CatalogProvider>
  );
}
