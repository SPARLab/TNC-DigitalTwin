// ============================================================================
// MapContext — Shares ArcGIS MapView instance across v2 components
// Used by: MapContainer (provider), useMapLayers (sync), iNaturalist (highlight)
// ============================================================================

import { createContext, useContext, useRef, useCallback, useState, type ReactNode } from 'react';
import Point from '@arcgis/core/geometry/Point';
import Graphic from '@arcgis/core/Graphic';
import type MapView from '@arcgis/core/views/MapView';
import type GraphicsLayer from '@arcgis/core/layers/GraphicsLayer';

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
  const viewRef = useRef<MapView | null>(null);
  const highlightLayerRef = useRef<GraphicsLayer | null>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [dataOnePreview, setDataOnePreview] = useState<DataOnePreviewState | null>(null);
  const [mapReady, setMapReadyState] = useState(0);
  const setMapReady = useCallback(() => setMapReadyState(n => n + 1), []);

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

  return (
    <MapContext.Provider
      value={{
        viewRef, highlightLayerRef,
        mapReady, setMapReady,
        highlightPoint, clearHighlight,
        showToast, toasts, dismissToast,
        dataOnePreview, openDataOnePreview, closeDataOnePreview,
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
