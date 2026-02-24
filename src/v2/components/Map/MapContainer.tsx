// ============================================================================
// MapContainer — ArcGIS MapView / SceneView for Dangermond Preserve
// Supports 2D (MapView) and 3D (SceneView) toggle. Renders floating widgets
// on top. Uses data source registry for legend widgets and loading overlays —
// no data-source-specific imports needed in this file.
// ============================================================================

import { useEffect, useRef, useState } from 'react';
import { ExternalLink } from 'lucide-react';
import Map from '@arcgis/core/Map';
import MapView from '@arcgis/core/views/MapView';
import SceneView from '@arcgis/core/views/SceneView';
import ElevationLayer from '@arcgis/core/layers/ElevationLayer';
import PointCloudLayer from '@arcgis/core/layers/PointCloudLayer';
import GraphicsLayer from '@arcgis/core/layers/GraphicsLayer';
import SketchViewModel from '@arcgis/core/widgets/Sketch/SketchViewModel';
import { MapLayersWidget } from '../FloatingWidgets/MapLayersWidget/MapLayersWidget';
import { ViewModeToggle } from './ViewModeToggle';
import { useMap } from '../../context/MapContext';
import { useLayers } from '../../context/LayerContext';
import { useMapLayers } from './useMapLayers';
import { getAdapterForActiveLayer, useActiveCacheStatus } from '../../dataSources/registry';
import { MapToasts } from './MapToasts';
import { MapCenterLoadingOverlay } from '../shared/loading/LoadingPrimitives';
import { DendraTimeSeriesPanel } from '../FloatingWidgets/DendraTimeSeriesPanel/DendraTimeSeriesPanel';

/** Dangermond Preserve center coordinates */
const PRESERVE_CENTER: [number, number] = [-120.47, 34.47];
const INITIAL_ZOOM = 12;

/** Saved camera state for smooth 2D ↔ 3D transitions */
interface SavedViewState {
  center: [number, number];
  zoom: number;
  tilt?: number;
  heading?: number;
}

export function MapContainer() {
  const mapDivRef = useRef<HTMLDivElement>(null);
  const {
    viewRef,
    viewMode,
    highlightLayerRef,
    spatialQueryLayerRef,
    spatialSketchViewModelRef,
    setMapReady,
    dataOnePreview,
    closeDataOnePreview,
  } = useMap();
  const { activeLayer } = useLayers();
  const [previewStatus, setPreviewStatus] = useState<'loading' | 'loaded' | 'error' | 'blocked'>('loading');
  const savedViewStateRef = useRef<SavedViewState>({
    center: PRESERVE_CENTER,
    zoom: INITIAL_ZOOM,
  });

  // Adapter lookup supports layer-specific overrides (for example, DroneDeploy dataset-193).
  const adapter = getAdapterForActiveLayer(activeLayer ?? null);
  const LegendWidget = adapter?.LegendWidget;
  const FloatingPanel = adapter?.FloatingPanel;

  // Cache/loading status for the active data source (generic loading overlay)
  const cacheStatus = useActiveCacheStatus(adapter?.id ?? activeLayer?.dataSource);
  const showLoadingOverlay = !!activeLayer
    && (cacheStatus?.loading ?? false)
    && ((adapter?.id === 'drone') || !(cacheStatus?.dataLoaded ?? false));
  const defaultLoadingOverlayMessage = (adapter?.id ?? activeLayer?.dataSource) === 'animl'
    ? 'Loading camera trap data...'
    : (adapter?.id === 'drone' ? 'Loading drone imagery...' : `Loading ${activeLayer?.name ?? 'data'}...`);
  const loadingOverlayMessage = cacheStatus?.loadingMessage ?? defaultLoadingOverlayMessage;

  // Sync pinned/active layers with ArcGIS layers
  useMapLayers();

  // Initialize ArcGIS Map + View — re-runs when viewMode changes (2D ↔ 3D)
  useEffect(() => {
    if (!mapDivRef.current) return;

    // Capture position from outgoing view before destroying it
    const prev = viewRef.current;
    if (prev?.center) {
      const { longitude, latitude } = prev.center;
      savedViewStateRef.current = {
        center: [longitude ?? PRESERVE_CENTER[0], latitude ?? PRESERVE_CENTER[1]],
        zoom: prev.zoom ?? INITIAL_ZOOM,
        tilt: (prev as SceneView).camera?.tilt,
        heading: (prev as SceneView).camera?.heading,
      };
    }

    const is3D = viewMode === '3d';
    const saved = savedViewStateRef.current;

    const map = new Map({
      basemap: is3D ? 'satellite' : 'topo-vector',
      ...(is3D && { ground: 'world-elevation' }),
    });

    if (is3D) {
      map.ground.layers.add(new ElevationLayer({
        url: 'https://elevation3d.arcgis.com/arcgis/rest/services/WorldElevation3D/Terrain3D/ImageServer',
      }));

      map.add(new PointCloudLayer({
        url: 'https://tiles.arcgis.com/tiles/6DIQcwlPy8knb6sg/arcgis/rest/services/All_Aeroptic_ColorizedPointCloud/SceneServer',
        title: 'Dangermond Preserve LiDAR Point Cloud',
        renderer: {
          type: 'point-cloud-rgb',
          field: 'RGB',
          pointSizeAlgorithm: { type: 'fixed-size', useRealWorldSymbolSizes: false, size: 3 },
        } as __esri.PointCloudRendererProperties,
        elevationInfo: { mode: 'absolute-height' },
      }));
    }

    const highlightLayer = new GraphicsLayer({ id: 'v2-highlight-layer' });
    map.add(highlightLayer);
    highlightLayerRef.current = highlightLayer;

    const spatialQueryLayer = new GraphicsLayer({ id: 'v2-spatial-query-layer' });
    map.add(spatialQueryLayer);
    spatialQueryLayerRef.current = spatialQueryLayer;

    const view = is3D
      ? new SceneView({
          container: mapDivRef.current,
          map,
          camera: {
            position: { x: saved.center[0], y: saved.center[1], z: 2000 },
            tilt: saved.tilt ?? 60,
            heading: saved.heading ?? 0,
          },
          qualityProfile: 'high',
          environment: {
            atmosphereEnabled: true,
            lighting: { date: new Date(), directShadowsEnabled: true },
          },
          ui: { components: ['attribution', 'navigation-toggle', 'compass', 'zoom'] },
          padding: { top: 52, right: 8, bottom: 8, left: 8 },
        })
      : new MapView({
          container: mapDivRef.current,
          map,
          center: saved.center,
          zoom: saved.zoom,
          ui: { components: ['attribution', 'compass', 'zoom'] },
          padding: { top: 52, right: 8, bottom: 8, left: 8 },
        });

    viewRef.current = view;

    spatialSketchViewModelRef.current = new SketchViewModel({
      view: view as MapView,
      layer: spatialQueryLayer,
      polygonSymbol: {
        type: 'simple-fill',
        color: [46, 125, 50, 0.14],
        outline: {
          color: [46, 125, 50, 0.95],
          width: 2,
        },
      },
      defaultUpdateOptions: {
        tool: 'reshape',
      },
    });

    view.when(() => {
      if (view.ui.find('zoom')) view.ui.move('zoom', 'top-right');
      if (view.ui.find('compass')) view.ui.move('compass', 'top-right');
      if (view.ui.find('navigation-toggle')) view.ui.move('navigation-toggle', 'top-right');
      if (view.ui.find('attribution')) view.ui.move('attribution', 'top-right');
      if (view.popup) {
        view.popup.dockEnabled = false;
      }
      setMapReady();
    });

    return () => {
      // Snapshot position before teardown
      const outgoing = viewRef.current;
      if (outgoing?.center) {
        const { longitude, latitude } = outgoing.center;
        savedViewStateRef.current = {
          center: [longitude ?? PRESERVE_CENTER[0], latitude ?? PRESERVE_CENTER[1]],
          zoom: outgoing.zoom ?? INITIAL_ZOOM,
          tilt: (outgoing as SceneView).camera?.tilt,
          heading: (outgoing as SceneView).camera?.heading,
        };
      }
      viewRef.current = null;
      highlightLayerRef.current = null;
      spatialQueryLayerRef.current = null;
      spatialSketchViewModelRef.current?.destroy();
      spatialSketchViewModelRef.current = null;
      view.destroy();
    };
  }, [viewMode]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!dataOnePreview) return;
    setPreviewStatus('loading');
    const timeoutId = window.setTimeout(() => {
      setPreviewStatus((current) => (current === 'loading' ? 'blocked' : current));
    }, 9000);
    return () => window.clearTimeout(timeoutId);
  }, [dataOnePreview]);

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
                onLoad={() => setPreviewStatus('loaded')}
                onError={() => setPreviewStatus('error')}
              />
            </div>
          </section>
        </div>
      )}

      {/* 2D / 3D toggle */}
      <ViewModeToggle />

      {/* Floating widgets overlay */}
      <MapLayersWidget />

      {/* Legend widget — only for the ACTIVE layer's data source */}
      {LegendWidget && <LegendWidget />}

      {/* Floating panel — data source specific (e.g., Dendra time series chart) */}
      {FloatingPanel && <FloatingPanel />}

      {/* Dendra charts persist independently of active layer adapter */}
      <DendraTimeSeriesPanel />

      {/* Loading overlay — shown when active data source is fetching */}
      {showLoadingOverlay && (
        <MapCenterLoadingOverlay
          id="map-loading-overlay"
          message={loadingOverlayMessage}
        />
      )}

      {/* Toast notifications (layer not implemented, etc.) */}
      <MapToasts />
    </div>
  );
}
