// ============================================================================
// MapContainer — Placeholder for ArcGIS WebMap (Phase 0 shell)
// Will be replaced with real ArcGIS integration later.
// ============================================================================

import { MapLayersWidget } from '../FloatingWidgets/MapLayersWidget/MapLayersWidget';
import { BookmarkedItemsWidget } from '../FloatingWidgets/BookmarkedItemsWidget/BookmarkedItemsWidget';

export function MapContainer() {
  return (
    <div id="map-container" className="flex-1 relative bg-gray-100 overflow-hidden">
      {/* Map placeholder */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="text-center text-gray-400">
          <p className="text-lg font-medium">ArcGIS Map</p>
          <p className="text-sm mt-1">WebMap integration — Phase 0.4</p>
        </div>
      </div>

      {/* Floating widgets overlay */}
      <MapLayersWidget />
      <BookmarkedItemsWidget />
    </div>
  );
}
