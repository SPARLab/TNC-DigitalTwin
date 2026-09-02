// ============================================================================
// useScalarVisualization — renders one scalar variable as either a continuous
// interpolated surface or per-station badges.
//
// Both modes are ordinary map layers, so the surface sits at the bottom of the
// stack where wind arrows and badges draw cleanly over it.
//
// The MediaLayer carrying the surface is created once and kept mounted, with its
// image source swapped as the variable changes. Adding and removing the layer per
// change races the SDK's internal load controller and throws from inside it.
// ============================================================================

import { useEffect, useRef } from 'react';
import MediaLayer from '@arcgis/core/layers/MediaLayer';
import type GraphicsLayer from '@arcgis/core/layers/GraphicsLayer';
import type LocalMediaElementSource from '@arcgis/core/layers/support/LocalMediaElementSource';
import type MapView from '@arcgis/core/views/MapView';
import { createScalarSurfaceElement } from './scalarSurfaceLayer';
import { createScalarBadgeLayer, createScalarValueLabelLayer } from './scalarGraphicsLayers';
import type { ScalarSnapshot, SensorVariableConfig } from '../../../services/sensorService';
import type { BoundaryRing } from '../../../services/preserveBoundaryService';
import type { GeoExtent } from './windField';

export type ScalarVizMode = 'surface' | 'labels';

interface UseScalarVisualizationParams {
  view: MapView | null;
  snapshot: ScalarSnapshot | null;
  config: SensorVariableConfig | null;
  mode: ScalarVizMode;
  /** Buffered preserve boundary. Surfaces fall back to a box without it. */
  clip?: { rings: BoundaryRing[]; extent: GeoExtent } | null;
}

export function useScalarVisualization({
  view,
  snapshot,
  config,
  mode,
  clip,
}: UseScalarVisualizationParams) {
  const surfaceLayerRef = useRef<MediaLayer | null>(null);
  const badgeLayerRef = useRef<GraphicsLayer | null>(null);

  /**
   * Selecting a different variable re-renders with the new config before the new
   * snapshot has replaced the old one. Drawing that pair would label one
   * variable's readings with another's units and ramp, and the layer it creates
   * is discarded a moment later, which trips a crash in the SDK's layer view
   * scheduler. So wait until the two agree.
   */
  const data = snapshot && config && snapshot.variableId === config.id ? snapshot : null;

  // Mount the surface carrier once per view, hidden until there is data.
  useEffect(() => {
    if (!view || view.destroyed) return;

    const layer = new MediaLayer({
      title: 'Interpolated Surface',
      source: [],
      visible: false,
    });

    // Index 0 keeps it beneath the wind graphics.
    view.map?.add(layer, 0);
    surfaceLayerRef.current = layer;

    return () => {
      if (!view.destroyed) view.map?.remove(layer);
      surfaceLayerRef.current = null;
    };
  }, [view]);

  // Swap the raster whenever the variable, its data, or the mode changes.
  useEffect(() => {
    const layer = surfaceLayerRef.current;
    if (!layer) return;

    // An array passed to the constructor is wrapped in a LocalMediaElementSource,
    // whose `elements` collection is what we swap.
    const elements = (layer.source as LocalMediaElementSource | null)?.elements;

    if (mode !== 'surface' || !data || !config) {
      layer.visible = false;
      elements?.removeAll();
      return;
    }

    const element = createScalarSurfaceElement(
      data.readings.map((reading) => ({
        longitude: reading.longitude,
        latitude: reading.latitude,
        value: reading.value,
      })),
      {
        ramp: config.ramp,
        min: data.min,
        max: data.max,
        absenceBelow: config.absenceBelow,
        clip: clip ?? undefined,
      },
    );

    if (!element) {
      layer.visible = false;
      return;
    }

    elements?.removeAll();
    elements?.add(element);
    layer.title = `${config.label} — Interpolated Surface`;
    layer.visible = true;
  }, [view, data, config, mode, clip]);

  // Station graphics for either mode: badges on their own, or plain value text
  // over the surface. Both are graphics layers, safe to add and remove per change,
  // and both go on top so the surface never covers them.
  useEffect(() => {
    if (!view || view.destroyed || !data || !config) return;

    const layer = mode === 'labels'
      ? createScalarBadgeLayer(data, config)
      : createScalarValueLabelLayer(data, config);

    view.map?.add(layer);
    badgeLayerRef.current = layer;

    return () => {
      // Removal is the whole teardown. Calling destroy() here nulls the layer
      // while the view may still have its layer view creation queued, which then
      // fails reading from the layer it was handed.
      if (!view.destroyed) view.map?.remove(layer);
      badgeLayerRef.current = null;
    };
  }, [view, data, config, mode]);
}
