// ============================================================================
// useWindVisualization — keeps the map showing exactly one wind renderer.
//
// Owns the lifecycle of both the graphics layers and the canvas overlay so the
// page never has to reason about tearing them down.
// ============================================================================

import { useEffect, useRef } from 'react';
import type GraphicsLayer from '@arcgis/core/layers/GraphicsLayer';
import type MapView from '@arcgis/core/views/MapView';
import type SceneView from '@arcgis/core/views/SceneView';
import {
  createWindArrowLayer,
  createWindBadgeLayer,
  createWindGridLayer,
} from './windGraphicsLayers';
import { WindParticleOverlay } from './WindParticleOverlay';
import type { WindReading } from '../../../services/windService';
import type { LiveAlert } from '../../../services/liveAlertService';

export type WindVizMode = 'arrows' | 'flow' | 'grid' | 'labels';

/**
 * Flow is the one renderer tied to a 2D view: the particle overlay is a canvas
 * sized to the viewport, mapping Mercator metres to pixels with an axis-aligned
 * transform that has no equivalent under a perspective camera.
 */
export const WIND_MODES_2D_ONLY: readonly WindVizMode[] = ['flow'];

interface UseWindVisualizationParams {
  view: MapView | SceneView | null;
  readings: WindReading[] | null;
  mode: WindVizMode;
  isEnabled: boolean;
  /** Open alerts for the wind service; labels mode turns matching badges into triangles. */
  alerts?: LiveAlert[];
}

export function useWindVisualization({
  view,
  readings,
  mode,
  isEnabled,
  alerts = [],
}: UseWindVisualizationParams) {
  const layerRef = useRef<GraphicsLayer | null>(null);
  const overlayRef = useRef<WindParticleOverlay | null>(null);

  useEffect(() => {
    if (!view || view.destroyed || !isEnabled || !readings?.length) return;

    if (mode === 'flow' && view.type === '2d') {
      const overlay = new WindParticleOverlay(view, readings);
      overlay.start();
      overlayRef.current = overlay;
    } else if (mode === 'labels') {
      const layer = createWindBadgeLayer(readings, alerts);
      view.map?.add(layer);
      layerRef.current = layer;
    } else if (mode === 'arrows') {
      const layer = createWindArrowLayer(readings, alerts);
      view.map?.add(layer);
      layerRef.current = layer;
    } else if (mode === 'grid') {
      const layer = createWindGridLayer(readings);
      view.map?.add(layer);
      layerRef.current = layer;
    }

    return () => {
      overlayRef.current?.destroy();
      overlayRef.current = null;

      const layer = layerRef.current;
      if (layer) {
        // Skip map mutation if the view is already tearing down. Removal is the
        // whole teardown: destroy() here would null the layer while the view may
        // still have its layer view creation queued against it.
        if (!view.destroyed) view.map?.remove(layer);
        layerRef.current = null;
      }
    };
  }, [view, readings, mode, isEnabled, alerts]);
}
