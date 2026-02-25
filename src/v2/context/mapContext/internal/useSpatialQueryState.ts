import { useCallback, useEffect, useRef, useState, type MutableRefObject } from 'react';
import Polygon from '@arcgis/core/geometry/Polygon';
import Graphic from '@arcgis/core/Graphic';
import type GraphicsLayer from '@arcgis/core/layers/GraphicsLayer';
import type SketchViewModel from '@arcgis/core/widgets/Sketch/SketchViewModel';
import * as webMercatorUtils from '@arcgis/core/geometry/support/webMercatorUtils';
import {
  createSpatialPolygon,
  type LonLat,
  type SpatialPolygon,
} from '../../../utils/spatialQuery';

const SPATIAL_QUERY_POLYGON_SYMBOL = {
  type: 'simple-fill' as const,
  color: [46, 125, 50, 0.14],
  outline: {
    color: [46, 125, 50, 0.95],
    width: 2,
  },
};

interface UseSpatialQueryStateParams {
  activeLayerId?: string;
  spatialQueryLayerRef: MutableRefObject<GraphicsLayer | null>;
  spatialSketchViewModelRef: MutableRefObject<SketchViewModel | null>;
  showToast: (_message: string, _type?: 'info' | 'warning') => void;
}

export function useSpatialQueryState({
  activeLayerId,
  spatialQueryLayerRef,
  spatialSketchViewModelRef,
  showToast,
}: UseSpatialQueryStateParams) {
  const [spatialPolygonsByLayerId, setSpatialPolygonsByLayerId] = useState<Record<string, SpatialPolygon>>({});
  const spatialPolygonsByLayerIdRef = useRef<Record<string, SpatialPolygon>>({});
  const [isSpatialQueryDrawing, setIsSpatialQueryDrawing] = useState(false);

  const spatialPolygon = activeLayerId ? (spatialPolygonsByLayerId[activeLayerId] ?? null) : null;

  const getSpatialPolygonForLayer = useCallback((layerId: string) => {
    return spatialPolygonsByLayerIdRef.current[layerId] ?? null;
  }, []);

  const setSpatialPolygonForLayer = useCallback((layerId: string, polygon: SpatialPolygon | null) => {
    setSpatialPolygonsByLayerId((prev) => {
      if (!polygon) {
        if (!(layerId in prev)) return prev;
        const rest = { ...prev };
        delete rest[layerId];
        spatialPolygonsByLayerIdRef.current = rest;
        return rest;
      }

      const next = { ...prev, [layerId]: polygon };
      spatialPolygonsByLayerIdRef.current = next;
      return next;
    });
  }, []);

  const clearSpatialQuery = useCallback(() => {
    if (!activeLayerId) {
      showToast('Select a layer before clearing a spatial query.', 'warning');
      return;
    }

    spatialSketchViewModelRef.current?.cancel();
    setSpatialPolygonForLayer(activeLayerId, null);
    setIsSpatialQueryDrawing(false);
  }, [activeLayerId, setSpatialPolygonForLayer, showToast, spatialSketchViewModelRef]);

  const startSpatialQueryDraw = useCallback(() => {
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
  }, [activeLayerId, setSpatialPolygonForLayer, showToast, spatialQueryLayerRef, spatialSketchViewModelRef]);

  useEffect(() => {
    spatialPolygonsByLayerIdRef.current = spatialPolygonsByLayerId;
  }, [spatialPolygonsByLayerId]);

  // Keep draw layer synced with active layer's polygon.
  // Inactive layer polygons remain stored and continue filtering, but are hidden on map.
  useEffect(() => {
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
  }, [activeLayerId, spatialPolygonsByLayerId, spatialQueryLayerRef]);

  return {
    spatialPolygon,
    getSpatialPolygonForLayer,
    isSpatialQueryDrawing,
    startSpatialQueryDraw,
    clearSpatialQuery,
  };
}
