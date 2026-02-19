// ============================================================================
// MapContext — Shares ArcGIS MapView instance across v2 components
// Used by: MapContainer (provider), useMapLayers (sync), iNaturalist (highlight)
// ============================================================================

import { createContext, useContext, useRef, useCallback, useEffect, useState, type ReactNode } from 'react';
import Point from '@arcgis/core/geometry/Point';
import Polygon from '@arcgis/core/geometry/Polygon';
import Graphic from '@arcgis/core/Graphic';
import type MapView from '@arcgis/core/views/MapView';
import type GraphicsLayer from '@arcgis/core/layers/GraphicsLayer';
import type SketchViewModel from '@arcgis/core/widgets/Sketch/SketchViewModel';
import * as webMercatorUtils from '@arcgis/core/geometry/support/webMercatorUtils';
import {
  createSpatialPolygon,
  type LonLat,
  type SpatialPolygon,
} from '../utils/spatialQuery';
import { useLayers } from './LayerContext';

interface Toast {
  id: string;
  message: string;
  type: 'info' | 'warning';
}

interface DataOnePreviewState {
  url: string;
  title: string;
}

interface MapContextValue {
  /** Ref to the ArcGIS MapView (null until map initializes) */
  viewRef: React.MutableRefObject<MapView | null>;
  /** Ref to the highlight graphics layer */
  highlightLayerRef: React.MutableRefObject<GraphicsLayer | null>;
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
  toasts: Toast[];
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
  spatialQueryLayerRef: React.MutableRefObject<GraphicsLayer | null>;
  spatialSketchViewModelRef: React.MutableRefObject<SketchViewModel | null>;
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

const SPATIAL_QUERY_POLYGON_SYMBOL = {
  type: 'simple-fill' as const,
  color: [46, 125, 50, 0.14],
  outline: {
    color: [46, 125, 50, 0.95],
    width: 2,
  },
};

export function MapProvider({ children }: { children: ReactNode }) {
  const { activeLayer } = useLayers();
  const viewRef = useRef<MapView | null>(null);
  const highlightLayerRef = useRef<GraphicsLayer | null>(null);
  const spatialQueryLayerRef = useRef<GraphicsLayer | null>(null);
  const spatialSketchViewModelRef = useRef<SketchViewModel | null>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [dataOnePreview, setDataOnePreview] = useState<DataOnePreviewState | null>(null);
  const [mapReady, setMapReadyState] = useState(0);
  const [spatialPolygonsByLayerId, setSpatialPolygonsByLayerId] = useState<Record<string, SpatialPolygon>>({});
  const spatialPolygonsByLayerIdRef = useRef<Record<string, SpatialPolygon>>({});
  const [isSpatialQueryDrawing, setIsSpatialQueryDrawing] = useState(false);
  const setMapReady = useCallback(() => setMapReadyState(n => n + 1), []);
  const spatialPolygon = activeLayer?.layerId ? (spatialPolygonsByLayerId[activeLayer.layerId] ?? null) : null;

  const getSpatialPolygonForLayer = useCallback((layerId: string) => {
    return spatialPolygonsByLayerIdRef.current[layerId] ?? null;
  }, []);

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

  const showToast = useCallback((message: string, type: 'info' | 'warning' = 'info') => {
    const id = crypto.randomUUID();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3500);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const openDataOnePreview = useCallback((url: string, title: string) => {
    setDataOnePreview({ url, title });
  }, []);

  const closeDataOnePreview = useCallback(() => {
    setDataOnePreview(null);
  }, []);

  const setSpatialPolygonForLayer = useCallback((layerId: string, polygon: SpatialPolygon | null) => {
    setSpatialPolygonsByLayerId((prev) => {
      if (!polygon) {
        if (!(layerId in prev)) return prev;
        const { [layerId]: _, ...rest } = prev;
        spatialPolygonsByLayerIdRef.current = rest;
        return rest;
      }
      const next = { ...prev, [layerId]: polygon };
      spatialPolygonsByLayerIdRef.current = next;
      return next;
    });
  }, []);

  const clearSpatialQuery = useCallback(() => {
    const activeLayerId = activeLayer?.layerId;
    if (!activeLayerId) {
      showToast('Select a layer before clearing a spatial query.', 'warning');
      return;
    }
    spatialSketchViewModelRef.current?.cancel();
    setSpatialPolygonForLayer(activeLayerId, null);
    setIsSpatialQueryDrawing(false);
  }, [activeLayer?.layerId, setSpatialPolygonForLayer, showToast]);

  const startSpatialQueryDraw = useCallback(() => {
    const activeLayerId = activeLayer?.layerId;
    if (!activeLayerId) {
      showToast('Select a layer before drawing a spatial query polygon.', 'warning');
      return;
    }

    const sketchViewModel = spatialSketchViewModelRef.current;
    const spatialLayer = spatialQueryLayerRef.current;
    if (!sketchViewModel || !spatialLayer) {
      showToast('Map is still loading. Try drawing again in a moment.', 'warning');
      return;
    }

    setIsSpatialQueryDrawing(true);
    sketchViewModel.cancel();
    spatialLayer.removeAll();

    const createHandle = sketchViewModel.on('create', (event) => {
      if (event.state === 'cancel') {
        createHandle.remove();
        setIsSpatialQueryDrawing(false);
        return;
      }

      if (event.state !== 'complete') return;
      createHandle.remove();
      setIsSpatialQueryDrawing(false);

      const geometry = event.graphic?.geometry;
      if (!geometry || geometry.type !== 'polygon') {
        showToast('Unable to read polygon geometry. Please try again.', 'warning');
        return;
      }

      const polygon = geometry as Polygon;
      const ring = polygon.rings?.[0] ?? [];
      if (ring.length < 3) {
        showToast('Draw at least 3 points to create a polygon.', 'warning');
        setSpatialPolygonForLayer(activeLayerId, null);
        return;
      }

      const lonLatRing: LonLat[] = ring.map(([x, y]) => {
        const isWebMercator = polygon.spatialReference?.isWebMercator ?? false;
        if (isWebMercator) {
          const [longitude, latitude] = webMercatorUtils.xyToLngLat(x, y);
          return [longitude, latitude];
        }
        return [x, y];
      });

      const nextSpatialPolygon = createSpatialPolygon(lonLatRing);
      if (!nextSpatialPolygon) {
        showToast('Polygon is not valid. Please redraw.', 'warning');
        setSpatialPolygonForLayer(activeLayerId, null);
        return;
      }

      setSpatialPolygonForLayer(activeLayerId, nextSpatialPolygon);
      showToast('Spatial query applied to the active layer.', 'info');
    });

    sketchViewModel.create('polygon');
  }, [activeLayer?.layerId, setSpatialPolygonForLayer, showToast]);

  const activeLayerId = activeLayer?.layerId;
  useEffect(() => {
    spatialPolygonsByLayerIdRef.current = spatialPolygonsByLayerId;
  }, [spatialPolygonsByLayerId]);

  // Keep draw layer synced with active layer's polygon.
  // Inactive layer polygons remain stored and continue filtering, but are hidden on map.
  const syncActiveSpatialPolygonGraphic = useCallback(() => {
    const spatialLayer = spatialQueryLayerRef.current;
    if (!spatialLayer) return;
    spatialLayer.removeAll();

    if (!activeLayerId) return;
    const activePolygon = spatialPolygonsByLayerId[activeLayerId];
    if (!activePolygon) return;

    const graphic = new Graphic({
      geometry: new Polygon({
        rings: [activePolygon.ring],
        spatialReference: { wkid: 4326 },
      }),
      symbol: SPATIAL_QUERY_POLYGON_SYMBOL,
    });
    spatialLayer.add(graphic);
  }, [activeLayerId, spatialPolygonsByLayerId]);

  useEffect(() => {
    syncActiveSpatialPolygonGraphic();
  }, [syncActiveSpatialPolygonGraphic]);

  return (
    <MapContext.Provider
      value={{
        viewRef, highlightLayerRef,
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
