// ============================================================================
// iNaturalist Map Behavior — Manages GraphicsLayer population & filtering.
// Extracted from useMapLayers to keep core map logic data-source-agnostic.
//
// Layer is "on map" when PINNED or ACTIVE (whichever comes first).
// Cache warms on first appearance. Data persists across activate/deactivate.
// Called unconditionally by useAllMapBehaviors (React hooks rules).
// ============================================================================

import { useEffect, useRef } from 'react';
import GraphicsLayer from '@arcgis/core/layers/GraphicsLayer';
import type Layer from '@arcgis/core/layers/Layer';
import { useINaturalistFilter } from '../../context/INaturalistFilterContext';
import {
  populateINaturalistLayer,
  filterINaturalistLayer,
} from '../../components/Map/layers/inaturalistLayer';
import type { PinnedLayer, ActiveLayer } from '../../types';

const LAYER_ID = 'inaturalist-obs';

export function useINaturalistMapBehavior(
  getManagedLayer: (layerId: string) => Layer | undefined,
  pinnedLayers: PinnedLayer[],
  activeLayer: ActiveLayer | null,
  mapReady: number,
) {
  const { selectedTaxa, allObservations, dataLoaded, warmCache } = useINaturalistFilter();
  const populatedRef = useRef(false);

  const isPinned = pinnedLayers.some(p => p.layerId === LAYER_ID);
  const isActive = activeLayer?.layerId === LAYER_ID;
  const isOnMap = isPinned || isActive;

  // Warm cache when layer first appears on map (pinned OR activated)
  useEffect(() => {
    if (isOnMap) warmCache();
  }, [isOnMap, warmCache]);

  // Reset populated flag when layer is removed from map entirely
  useEffect(() => {
    if (!isOnMap) populatedRef.current = false;
  }, [isOnMap]);

  // Populate GraphicsLayer when data arrives AND layer exists on map.
  // Declaration order: fires AFTER useMapLayers' add-layer effect,
  // so getManagedLayer() returns the layer added in the same render cycle.
  useEffect(() => {
    if (!isOnMap || !dataLoaded || populatedRef.current) return;
    const arcLayer = getManagedLayer(LAYER_ID);
    if (!arcLayer || !(arcLayer instanceof GraphicsLayer)) return;

    populateINaturalistLayer(arcLayer, allObservations);
    filterINaturalistLayer(arcLayer, selectedTaxa);
    populatedRef.current = true;
  }, [isOnMap, dataLoaded, allObservations, selectedTaxa, getManagedLayer, mapReady]);

  // Update filter when selectedTaxa changes (instant local visibility toggle)
  useEffect(() => {
    if (!populatedRef.current) return;
    const arcLayer = getManagedLayer(LAYER_ID);
    if (!arcLayer || !(arcLayer instanceof GraphicsLayer)) return;
    filterINaturalistLayer(arcLayer, selectedTaxa);
  }, [selectedTaxa, getManagedLayer]);
}
