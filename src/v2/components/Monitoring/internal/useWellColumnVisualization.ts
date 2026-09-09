// ============================================================================
// useWellColumnVisualization — mounts the 3D well columns on the scene view.
// ============================================================================

import { useEffect } from 'react';
import type SceneView from '@arcgis/core/views/SceneView';
import { createWellColumnLayer } from './wellColumnLayer';
import {
  isElevationValued,
  type ScalarSnapshot,
  type SensorVariableConfig,
} from '../../../services/sensorService';

interface UseWellColumnVisualizationParams {
  view: SceneView | null;
  snapshot: ScalarSnapshot | null;
  config: SensorVariableConfig | null;
}

export function useWellColumnVisualization({
  view,
  snapshot,
  config,
}: UseWellColumnVisualizationParams) {
  useEffect(() => {
    if (!view || view.destroyed || !snapshot || !config) return;
    // Ground elevation minus the reading is only a depth for a derived head. For
    // a surface-measured variable it is an arbitrary number, and drawing it would
    // put a confidently wrong column under every station.
    if (!isElevationValued(config)) return;
    // Same reason as the 2D hook: a switch of variable re-renders with the new
    // config a beat before the matching snapshot arrives.
    if (snapshot.variableId !== config.id) return;

    const layer = createWellColumnLayer(snapshot, config);
    view.map?.add(layer);

    return () => {
      if (!view.destroyed) view.map?.remove(layer);
    };
  }, [view, snapshot, config]);
}
