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
import GraphicsLayer from '@arcgis/core/layers/GraphicsLayer';
import type LocalMediaElementSource from '@arcgis/core/layers/support/LocalMediaElementSource';
import type MapView from '@arcgis/core/views/MapView';
import type SceneView from '@arcgis/core/views/SceneView';
import { createScalarSurfaceElement } from './scalarSurfaceLayer';
import { createScalarBadgeLayer, createScalarValueLabelLayer } from './scalarGraphicsLayers';
import type { ScalarSnapshot, SensorVariableConfig } from '../../../services/sensorService';
import type { BoundaryRing } from '../../../services/preserveBoundaryService';
import type { GeoExtent } from './windField';

export type ScalarVizMode = 'surface' | 'labels';

interface UseScalarVisualizationParams {
  /**
   * Either view type. MediaLayer and GraphicsLayer both have 3D layer views, so
   * the surface drapes over the terrain and the station graphics billboard above
   * it without either renderer needing to know which view it is in.
   */
  view: MapView | SceneView | null;
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

  // Mount one graphics carrier per view, for the same reason the surface has one:
  // adding and removing a layer per change queues layer views the SDK sometimes
  // fails to build, and it does so reliably once a cached snapshot makes the
  // add and the remove land close together.
  useEffect(() => {
    if (!view || view.destroyed) return;

    const layer = new GraphicsLayer({ title: 'Station Values' });
    view.map?.add(layer);
    badgeLayerRef.current = layer;

    return () => {
      if (!view.destroyed) view.map?.remove(layer);
      badgeLayerRef.current = null;
    };
  }, [view]);

  // Station graphics for either mode: badges on their own, or plain value text
  // over the surface.
  useEffect(() => {
    const layer = badgeLayerRef.current;
    if (!layer) return;

    layer.removeAll();
    if (!view || view.destroyed || !data || !config) return;

    const built = mode === 'labels'
      ? createScalarBadgeLayer(data, config)
      : createScalarValueLabelLayer(data, config);

    layer.title = built.title ?? 'Station Values';
    layer.addMany(built.graphics.toArray());

    // The carrier is mounted when the view is, which is before the boundary
    // outline, so it has to be lifted back above it once it holds anything.
    const layers = view.map?.layers;
    if (layers) view.map?.reorder(layer, layers.length - 1);
  }, [view, data, config, mode]);
}
