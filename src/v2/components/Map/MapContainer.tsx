// ============================================================================
// MapContainer — ArcGIS MapView centered on Jack & Laura Dangermond Preserve
// Renders floating widgets (MapLayersWidget) on top.
// Uses data source registry for legend widgets and loading overlays —
// no data-source-specific imports needed in this file.
// ============================================================================

import { useEffect, useRef } from 'react';
import Map from '@arcgis/core/Map';
import MapView from '@arcgis/core/views/MapView';
import GraphicsLayer from '@arcgis/core/layers/GraphicsLayer';
import { MapLayersWidget } from '../FloatingWidgets/MapLayersWidget/MapLayersWidget';
// NOTE: BookmarkedItemsWidget disabled per Feb 11 design decision.
// Saved Items merged into Map Layers. Code preserved for CSS/animation reuse.
// import { BookmarkedItemsWidget } from '../FloatingWidgets/BookmarkedItemsWidget/BookmarkedItemsWidget';
import { useMap } from '../../context/MapContext';
import { useLayers } from '../../context/LayerContext';
import { useMapLayers } from './useMapLayers';
import { getAdapter, useActiveCacheStatus } from '../../dataSources/registry';
import { MapToasts } from './MapToasts';
import { MapCenterLoadingOverlay } from '../shared/loading/LoadingPrimitives';

/** Dangermond Preserve center coordinates */
const PRESERVE_CENTER: [number, number] = [-120.47, 34.47];
const INITIAL_ZOOM = 12;

export function MapContainer() {
  const mapDivRef = useRef<HTMLDivElement>(null);
  const { viewRef, highlightLayerRef, setMapReady } = useMap();
  const { activeLayer } = useLayers();

  // Data source adapter for the active layer (legend widget + floating panel lookup)
  const adapter = getAdapter(activeLayer?.dataSource);
  const LegendWidget = adapter?.LegendWidget;
  const FloatingPanel = adapter?.FloatingPanel;

  // Cache/loading status for the active data source (generic loading overlay)
  const cacheStatus = useActiveCacheStatus(activeLayer?.dataSource);
  const showLoadingOverlay = !!activeLayer
    && (cacheStatus?.loading ?? false)
    && !(cacheStatus?.dataLoaded ?? false);

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

      {/* Legend widget — only for the ACTIVE layer's data source */}
      {LegendWidget && <LegendWidget />}

      {/* Floating panel — data source specific (e.g., Dendra time series chart) */}
      {FloatingPanel && <FloatingPanel />}

      {/* Loading overlay — shown when active data source is fetching */}
      {showLoadingOverlay && (
        <MapCenterLoadingOverlay
          id="map-loading-overlay"
          message={`Loading ${activeLayer?.name ?? 'data'}...`}
        />
      )}

      {/* Toast notifications (layer not implemented, etc.) */}
      <MapToasts />
    </div>
  );
}
