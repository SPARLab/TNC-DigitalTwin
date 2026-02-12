// ============================================================================
// MapContainer — ArcGIS MapView centered on Jack & Laura Dangermond Preserve
// Renders floating widgets (MapLayersWidget) on top.
// Initializes the real ArcGIS map and syncs with LayerContext via useMapLayers.
// ============================================================================

import { useEffect, useRef } from 'react';
import Map from '@arcgis/core/Map';
import MapView from '@arcgis/core/views/MapView';
import GraphicsLayer from '@arcgis/core/layers/GraphicsLayer';
import { Loader2 } from 'lucide-react';
import { MapLayersWidget } from '../FloatingWidgets/MapLayersWidget/MapLayersWidget';
import { INaturalistLegendWidget } from '../FloatingWidgets/INaturalistLegendWidget/INaturalistLegendWidget';
// NOTE: BookmarkedItemsWidget disabled per Feb 11 design decision.
// Saved Items merged into Map Layers. Code preserved for CSS/animation reuse.
// import { BookmarkedItemsWidget } from '../FloatingWidgets/BookmarkedItemsWidget/BookmarkedItemsWidget';
import { useMap } from '../../context/MapContext';
import { useLayers } from '../../context/LayerContext';
import { useINaturalistFilter } from '../../context/INaturalistFilterContext';
import { useMapLayers } from './useMapLayers';
import { MapToasts } from './MapToasts';

/** Dangermond Preserve center coordinates */
const PRESERVE_CENTER: [number, number] = [-120.47, 34.47];
const INITIAL_ZOOM = 12;

export function MapContainer() {
  const mapDivRef = useRef<HTMLDivElement>(null);
  const { viewRef, highlightLayerRef, setMapReady } = useMap();
  const { activeLayer } = useLayers();
  const { loading: inatLoading } = useINaturalistFilter();

  // Check if iNaturalist layer is active (showing in right sidebar)
  const isINatActive = activeLayer?.layerId === 'inaturalist-obs';
  const showInatLoading = isINatActive && inatLoading;

  // Sync pinned/active layers with ArcGIS layers
  useMapLayers();

  // Initialize ArcGIS Map + MapView
  useEffect(() => {
    if (!mapDivRef.current) return;

    const map = new Map({ basemap: 'topo-vector' });

    // Graphics layer for bookmark hover highlights (task 0.6)
    const highlightLayer = new GraphicsLayer({ id: 'v2-highlight-layer' });
    map.add(highlightLayer);
    highlightLayerRef.current = highlightLayer;

    const view = new MapView({
      container: mapDivRef.current,
      map,
      center: PRESERVE_CENTER,
      zoom: INITIAL_ZOOM,
      ui: { components: ['attribution'] },
    });

    viewRef.current = view;

    // Signal map ready once the view finishes loading
    view.when(() => {
      if (view.popup) {
        view.popup.dockEnabled = false;
      }
      setMapReady();
    });

    return () => {
      viewRef.current = null;
      highlightLayerRef.current = null;
      view.destroy();
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div id="map-container" className="flex-1 relative bg-stone-100 overflow-hidden">
      {/* ArcGIS map target div */}
      <div id="arcgis-map-view" ref={mapDivRef} className="absolute inset-0" />

      {/* Floating widgets overlay */}
      <MapLayersWidget />
      {/* BookmarkedItemsWidget removed — Feb 11 design decision: unified into Map Layers */}

      {/* iNaturalist floating legend — only show when iNat layer is ACTIVE in right sidebar */}
      {isINatActive && <INaturalistLegendWidget />}

      {/* Loading overlay — iNaturalist data fetch in progress */}
      {showInatLoading && (
        <div
          id="map-loading-overlay"
          className="absolute inset-0 flex items-center justify-center bg-white/30 z-20 pointer-events-none"
        >
          <div className="bg-white px-4 py-3 rounded-lg shadow-md flex items-center gap-2">
            <Loader2 className="w-5 h-5 animate-spin text-green-600" />
            <span className="text-sm text-gray-700 font-medium">Loading iNaturalist observations...</span>
          </div>
        </div>
      )}

      {/* Toast notifications (layer not implemented, etc.) */}
      <MapToasts />
    </div>
  );
}
