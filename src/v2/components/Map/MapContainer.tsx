// ============================================================================
// MapContainer — ArcGIS MapView / SceneView for Dangermond Preserve
// Supports 2D (MapView) and 3D (SceneView) toggle. Renders floating widgets
// on top. Uses data source registry for legend widgets and loading overlays —
// no data-source-specific imports needed in this file.
// ============================================================================

import { useRef } from 'react';
import { ExternalLink } from 'lucide-react';
import { MapLayersWidget } from '../FloatingWidgets/MapLayersWidget/MapLayersWidget';
import { MapControlRail } from './MapControlRail';
import { useMap } from '../../context/MapContext';
import { useLayers } from '../../context/LayerContext';
import { useMapLayers } from './useMapLayers';
import { getAdapterForActiveLayer, useActiveCacheStatus } from '../../dataSources/registry';
import { MapToasts } from './MapToasts';
import { MapCenterLoadingOverlay, MapRefreshPill } from '../shared/loading/LoadingPrimitives';
import { DendraTimeSeriesPanel } from '../FloatingWidgets/DendraTimeSeriesPanel/DendraTimeSeriesPanel';
import { useArcgisViewLifecycle } from './internal/useArcgisViewLifecycle';
import { useDataOnePreviewStatus } from './internal/useDataOnePreviewStatus';

export function MapContainer() {
  const mapDivRef = useRef<HTMLDivElement>(null);
  const {
    viewRef,
    viewMode,
    highlightLayerRef,
    spatialQueryLayerRef,
    spatialSketchViewModelRef,
    isLidarVisible,
    setMapReady,
    dataOnePreview,
    closeDataOnePreview,
  } = useMap();
  const { activeLayer } = useLayers();
  const { previewStatus, markPreviewLoaded, markPreviewErrored } = useDataOnePreviewStatus(dataOnePreview);

  // Adapter lookup supports layer-specific overrides (for example, DroneDeploy dataset-193).
  const adapter = getAdapterForActiveLayer(activeLayer ?? null);
  const LegendWidget = adapter?.LegendWidget;
  const FloatingPanel = adapter?.FloatingPanel;

  // Cache/loading status for the active data source
  const cacheStatus = useActiveCacheStatus(adapter?.id ?? activeLayer?.dataSource);
  // Full overlay only on first load (data not yet loaded)
  const showLoadingOverlay = !!activeLayer
    && (cacheStatus?.loading ?? false)
    && ((adapter?.id === 'drone') || !(cacheStatus?.dataLoaded ?? false));
  const defaultLoadingOverlayMessage = (adapter?.id ?? activeLayer?.dataSource) === 'animl'
    ? 'Loading camera trap data...'
    : (adapter?.id === 'drone' ? 'Loading drone imagery...' : `Loading ${activeLayer?.name ?? 'data'}...`);
  const loadingOverlayMessage = cacheStatus?.loadingMessage ?? defaultLoadingOverlayMessage;
  // Subtle bottom-left pill for subsequent re-renders (pan/zoom)
  const showRefreshPill = !showLoadingOverlay && (cacheStatus?.isRefreshing ?? false);
  const refreshPillMessage = cacheStatus?.refreshMessage ?? 'Updating...';

  // Sync pinned/active layers with ArcGIS layers
  useMapLayers();

  useArcgisViewLifecycle({
    mapDivRef,
    viewRef,
    viewMode,
    highlightLayerRef,
    spatialQueryLayerRef,
    spatialSketchViewModelRef,
    isLidarVisible,
    setMapReady,
  });

  const handleOpenPreviewInNewTab = () => {
    if (!dataOnePreview?.url) return;
    window.open(dataOnePreview.url, '_blank', 'noopener,noreferrer');
  };

  return (
    <div id="map-container" className="flex-1 relative bg-stone-100 overflow-hidden">
      {/* ArcGIS map target div */}
      <div id="arcgis-map-view" ref={mapDivRef} className="absolute inset-0" />

      {dataOnePreview && (
        <div
          id="map-dataone-preview-modal-overlay"
          className="absolute inset-0 z-[80] flex items-center justify-center bg-black/45 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="map-dataone-preview-modal-title"
          onClick={closeDataOnePreview}
        >
          <section
            id="map-dataone-preview-modal"
            className="flex h-full max-h-[86vh] w-full max-w-6xl flex-col rounded-xl bg-white shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <header id="map-dataone-preview-modal-header" className="flex items-start justify-between gap-3 border-b border-gray-200 px-4 py-3">
              <div id="map-dataone-preview-modal-header-text" className="space-y-1">
                <h3 id="map-dataone-preview-modal-title" className="text-base font-semibold text-gray-900">
                  DataONE Preview
                </h3>
                <p id="map-dataone-preview-modal-subtitle" className="text-xs text-gray-600">
                  {dataOnePreview.title}
                </p>
              </div>
              <button
                id="map-dataone-preview-modal-close-button"
                type="button"
                onClick={closeDataOnePreview}
                aria-label="Close DataONE preview modal"
                className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-gray-300 text-base font-semibold text-gray-700 hover:bg-gray-100"
              >
                X
              </button>
            </header>

            <div id="map-dataone-preview-modal-guidance" className="flex flex-wrap items-center justify-between gap-2 border-b border-amber-200 bg-amber-50 px-4 py-2">
              <p id="map-dataone-preview-modal-guidance-text" className="text-xs font-medium text-amber-900">
                Downloads are disabled in this preview. To download files, use "Open in DataONE (New Tab)".
              </p>
              <button
                id="map-dataone-preview-modal-new-tab-button"
                type="button"
                onClick={handleOpenPreviewInNewTab}
                className="inline-flex items-center gap-1 rounded-md border border-emerald-300 bg-white px-2.5 py-1 text-xs font-semibold text-emerald-800 hover:bg-emerald-50"
              >
                Open in DataONE (New Tab)
                <ExternalLink className="h-3.5 w-3.5" />
              </button>
            </div>

            <div id="map-dataone-preview-modal-body" className="relative flex-1 bg-slate-100 p-3">
              {previewStatus === 'loading' && (
                <p id="map-dataone-preview-modal-loading-message" className="mb-2 text-xs text-gray-600">
                  Loading DataONE preview...
                </p>
              )}

              {(previewStatus === 'error' || previewStatus === 'blocked') && (
                <div id="map-dataone-preview-modal-fallback" className="mb-2 rounded border border-amber-200 bg-amber-50 px-3 py-2">
                  <p id="map-dataone-preview-modal-fallback-text" className="text-xs text-amber-900">
                    {previewStatus === 'blocked'
                      ? 'DataONE blocked embedding in this browser context. Use the New Tab button to continue and download.'
                      : 'The embedded preview failed to load. Use the New Tab button to continue and download.'}
                  </p>
                </div>
              )}

              <iframe
                id="map-dataone-preview-modal-iframe"
                src={dataOnePreview.url}
                title={`DataONE preview for ${dataOnePreview.title}`}
                className={`h-full w-full rounded-md border border-gray-300 bg-white ${previewStatus === 'error' || previewStatus === 'blocked' ? 'hidden' : 'block'}`}
                loading="lazy"
                referrerPolicy="no-referrer"
                onLoad={markPreviewLoaded}
                onError={markPreviewErrored}
              />
            </div>
          </section>
        </div>
      )}

      {/* Unified map control rail (view mode, LiDAR, zoom, compass) */}
      <MapControlRail />

      {/* Floating widgets overlay */}
      <MapLayersWidget />

      {/* Legend widget — only for the ACTIVE layer's data source */}
      {LegendWidget && <LegendWidget />}

      {/* Floating panel — data source specific (e.g., Dendra time series chart) */}
      {FloatingPanel && <FloatingPanel />}

      {/* Dendra charts persist independently of active layer adapter */}
      <DendraTimeSeriesPanel />

      {/* Full overlay — first load only (data not yet cached) */}
      {showLoadingOverlay && (
        <MapCenterLoadingOverlay
          id="map-loading-overlay"
          message={loadingOverlayMessage}
        />
      )}

      {/* Subtle pill — subsequent re-renders during pan/zoom */}
      {showRefreshPill && (
        <MapRefreshPill id="map-refresh-pill" message={refreshPillMessage} />
      )}

      {/* Toast notifications (layer not implemented, etc.) */}
      <MapToasts />
    </div>
  );
}
