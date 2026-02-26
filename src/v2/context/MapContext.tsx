// ============================================================================
// MapContext — Shares ArcGIS MapView instance across v2 components
// Used by: MapContainer (provider), useMapLayers (sync), iNaturalist (highlight)
// ============================================================================

import { createContext, useContext, useRef, useCallback, useState, type MutableRefObject, type ReactNode } from 'react';
import Point from '@arcgis/core/geometry/Point';
import Graphic from '@arcgis/core/Graphic';
import type MapView from '@arcgis/core/views/MapView';
import type SceneView from '@arcgis/core/views/SceneView';
import type GraphicsLayer from '@arcgis/core/layers/GraphicsLayer';
import type SketchViewModel from '@arcgis/core/widgets/Sketch/SketchViewModel';
import type { SpatialPolygon } from '../utils/spatialQuery';
import { useLayers } from './LayerContext';
import { useMapToastState, type MapToast } from './mapContext/internal/useMapToastState';
import { useDataOnePreviewState, type DataOnePreviewState } from './mapContext/internal/useDataOnePreviewState';
import { useSpatialQueryState } from './mapContext/internal/useSpatialQueryState';

export type ViewMode = '2d' | '3d';

interface MapContextValue {
  /** Ref to the ArcGIS MapView or SceneView (null until map initializes) */
  viewRef: MutableRefObject<MapView | SceneView | null>;
  /** Current view mode: '2d' (MapView) or '3d' (SceneView) */
  viewMode: ViewMode;
  /** Toggle between 2D and 3D view modes */
  toggleViewMode: () => void;
  /** Visibility state for 3D LiDAR point cloud layer */
  isLidarVisible: boolean;
  /** Toggle LiDAR point cloud layer visibility */
  toggleLidarVisibility: () => void;
  /** Ref to the highlight graphics layer */
  highlightLayerRef: MutableRefObject<GraphicsLayer | null>;
  /** Increments when the map view is ready (triggers re-render in dependents) */
  mapReady: number;
  /** Signal that the map is initialized */
  setMapReady: () => void;
  /** Highlight a point on the map (cyan ring) — used by observation hover / view-on-map */
  highlightPoint: (longitude: number, latitude: number) => void;
  /** Clear all highlights */
  clearHighlight: () => void;
  /** Show a temporary toast on the map area */
  showToast: (message: string, type?: 'info' | 'warning') => void;
  /** Current toasts */
  toasts: MapToast[];
  /** Dismiss a toast */
  dismissToast: (id: string) => void;
  /** Current DataONE preview modal payload */
  dataOnePreview: DataOnePreviewState | null;
  /** Open DataONE preview modal over map */
  openDataOnePreview: (url: string, title: string) => void;
  /** Close DataONE preview modal */
  closeDataOnePreview: () => void;
  /** Spatial query polygon for the active layer (null when inactive) */
  spatialPolygon: SpatialPolygon | null;
  /** Lookup spatial polygon by layer ID (used for per-layer map filtering) */
  getSpatialPolygonForLayer: (layerId: string) => SpatialPolygon | null;
  /** True while map is in polygon draw mode */
  isSpatialQueryDrawing: boolean;
  /** Trigger map polygon draw interaction */
  startSpatialQueryDraw: () => void;
  /** Clear current spatial query polygon */
  clearSpatialQuery: () => void;
  /** Internal refs set by MapContainer for sketch interactions */
  spatialQueryLayerRef: MutableRefObject<GraphicsLayer | null>;
  spatialSketchViewModelRef: MutableRefObject<SketchViewModel | null>;
}

const MapContext = createContext<MapContextValue | null>(null);

/** Cyan ring symbol for point highlight (view-on-map, hover) */
const HIGHLIGHT_SYMBOL = {
  type: 'simple-marker' as const,
  style: 'circle' as const,
  size: 18,
  color: [0, 0, 0, 0],
  outline: { color: [6, 182, 212, 0.9], width: 3 }, // cyan-500
};

export function MapProvider({ children }: { children: ReactNode }) {
  const { activeLayer } = useLayers();
  const viewRef = useRef<MapView | SceneView | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('2d');
  const [isLidarVisible, setIsLidarVisible] = useState(true);
  const highlightLayerRef = useRef<GraphicsLayer | null>(null);
  const spatialQueryLayerRef = useRef<GraphicsLayer | null>(null);
  const spatialSketchViewModelRef = useRef<SketchViewModel | null>(null);
  const [mapReady, setMapReadyState] = useState(0);
  const setMapReady = useCallback(() => setMapReadyState(n => n + 1), []);
  const toggleViewMode = useCallback(() => setViewMode(m => (m === '2d' ? '3d' : '2d')), []);
  const toggleLidarVisibility = useCallback(() => setIsLidarVisible(v => !v), []);
  const { toasts, showToast, dismissToast } = useMapToastState();
  const { dataOnePreview, openDataOnePreview, closeDataOnePreview } = useDataOnePreviewState();
  const {
    spatialPolygon,
    getSpatialPolygonForLayer,
    isSpatialQueryDrawing,
    startSpatialQueryDraw,
    clearSpatialQuery,
  } = useSpatialQueryState({
    activeLayerId: activeLayer?.layerId,
    spatialQueryLayerRef,
    spatialSketchViewModelRef,
    showToast,
  });

  const highlightPoint = useCallback((longitude: number, latitude: number) => {
    const layer = highlightLayerRef.current;
    if (!layer) return;

    layer.removeAll();
    const graphic = new Graphic({
      geometry: new Point({ longitude, latitude }),
      symbol: HIGHLIGHT_SYMBOL,
    });
    layer.add(graphic);
  }, []);

  const clearHighlight = useCallback(() => {
    highlightLayerRef.current?.removeAll();
  }, []);

  return (
    <MapContext.Provider
      value={{
        viewRef, viewMode, toggleViewMode, isLidarVisible, toggleLidarVisibility, highlightLayerRef,
        mapReady, setMapReady,
        highlightPoint, clearHighlight,
        showToast, toasts, dismissToast,
        dataOnePreview, openDataOnePreview, closeDataOnePreview,
        spatialPolygon,
        getSpatialPolygonForLayer,
        isSpatialQueryDrawing,
        startSpatialQueryDraw,
        clearSpatialQuery,
        spatialQueryLayerRef,
        spatialSketchViewModelRef,
      }}
    >
      {children}
    </MapContext.Provider>
  );
}

export function useMap() {
  const ctx = useContext(MapContext);
  if (!ctx) throw new Error('useMap must be used within MapProvider');
  return ctx;
}
