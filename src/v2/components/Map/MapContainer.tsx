// ============================================================================
// MapContainer — Placeholder for ArcGIS WebMap (Phase 0 shell)
// Will be replaced with real ArcGIS integration later.
// ============================================================================

import { Map } from 'lucide-react';
import { MapLayersWidget } from '../FloatingWidgets/MapLayersWidget/MapLayersWidget';
import { BookmarkedItemsWidget } from '../FloatingWidgets/BookmarkedItemsWidget/BookmarkedItemsWidget';

export function MapContainer() {
  return (
    <div id="map-container" className="flex-1 relative bg-stone-100 overflow-hidden">
      {/* Map placeholder — subtle background pattern */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="text-center text-gray-300">
          <Map className="w-16 h-16 mx-auto mb-3 opacity-40" />
          <p className="text-lg font-medium">ArcGIS Map</p>
          <p className="text-sm mt-1 text-gray-300/80">WebMap integration — Phase 0.4</p>
        </div>
      </div>

      {/* Floating widgets overlay */}
      <MapLayersWidget />
      <BookmarkedItemsWidget />
    </div>
  );
}
