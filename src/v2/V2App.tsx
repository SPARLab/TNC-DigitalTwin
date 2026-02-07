// ============================================================================
// V2App — Main layout for the v2 Digital Catalog
// Structure: Header → (LeftSidebar | Map + FloatingWidgets | RightSidebar)
// ============================================================================

import { LayerProvider } from './context/LayerContext';
import { BookmarkProvider } from './context/BookmarkContext';
import { V2Header } from './components/Header/V2Header';
import { LeftSidebar } from './components/LeftSidebar/LeftSidebar';
import { MapContainer } from './components/Map/MapContainer';
import { RightSidebar } from './components/RightSidebar/RightSidebar';

export default function V2App() {
  return (
    <LayerProvider>
      <BookmarkProvider>
        <div id="v2-app" className="flex flex-col h-screen w-screen overflow-hidden">
          <V2Header />
          <div className="flex flex-1 overflow-hidden">
            <LeftSidebar />
            <MapContainer />
            <RightSidebar />
          </div>
        </div>
      </BookmarkProvider>
    </LayerProvider>
  );
}
