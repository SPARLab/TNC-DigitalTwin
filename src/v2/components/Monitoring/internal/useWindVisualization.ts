// ============================================================================
// useWindVisualization — keeps the map showing exactly one wind renderer.
//
// Owns the lifecycle of both the graphics layers and the canvas overlay so the
// page never has to reason about tearing them down.
// ============================================================================

import { useEffect, useRef } from 'react';
import type GraphicsLayer from '@arcgis/core/layers/GraphicsLayer';
import type MapView from '@arcgis/core/views/MapView';
import {
  createWindArrowLayer,
  createWindBadgeLayer,
  createWindGridLayer,
} from './windGraphicsLayers';
import { WindParticleOverlay } from './WindParticleOverlay';
import type { WindReading } from '../../../services/windService';

export type WindVizMode = 'arrows' | 'flow' | 'grid' | 'labels';

const LAYER_BUILDERS: Record<
  Exclude<WindVizMode, 'flow'>,
  (readings: WindReading[]) => GraphicsLayer
> = {
  arrows: createWindArrowLayer,
  grid: createWindGridLayer,
  labels: createWindBadgeLayer,
};

interface UseWindVisualizationParams {
  view: MapView | null;
  readings: WindReading[] | null;
  mode: WindVizMode;
  isEnabled: boolean;
}

export function useWindVisualization({
  view,
  readings,
  mode,
  isEnabled,
}: UseWindVisualizationParams) {
  const layerRef = useRef<GraphicsLayer | null>(null);
  const overlayRef = useRef<WindParticleOverlay | null>(null);

  useEffect(() => {
    if (!view || view.destroyed || !isEnabled || !readings?.length) return;

    if (mode === 'flow') {
      const overlay = new WindParticleOverlay(view, readings);
      overlay.start();
      overlayRef.current = overlay;
    } else {
      const layer = LAYER_BUILDERS[mode](readings);
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
  }, [view, readings, mode, isEnabled]);
}
