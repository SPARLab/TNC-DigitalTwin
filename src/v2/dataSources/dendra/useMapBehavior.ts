// ============================================================================
// Dendra Map Behavior — Manages station point GraphicsLayers for all Dendra
// sensor services. Unlike iNaturalist (single layer), Dendra has 10 possible
// layers. This hook handles any combination of pinned + active Dendra layers.
//
// Called unconditionally by useAllMapBehaviors (React hooks rules).
// ============================================================================

import { useEffect, useRef } from 'react';
import GraphicsLayer from '@arcgis/core/layers/GraphicsLayer';
import type Layer from '@arcgis/core/layers/Layer';
import { useDendra } from '../../context/DendraContext';
import { useCatalog } from '../../context/CatalogContext';
import { useMap } from '../../context/MapContext';
import { populateDendraLayer, filterDendraLayer } from '../../components/Map/layers/dendraLayer';
import { registerDendraLayerId, isDendraLayer } from '../../components/Map/layers';
import type { PinnedLayer, ActiveLayer } from '../../types';

export function useDendraMapBehavior(
  getManagedLayer: (layerId: string) => Layer | undefined,
  pinnedLayers: PinnedLayer[],
  activeLayer: ActiveLayer | null,
  mapReady: number,
) {
  const { stations, dataLoaded, warmCache, showActiveOnly } = useDendra();
  const { spatialPolygon } = useMap();
  const { layerMap } = useCatalog();
  const populatedRef = useRef<Set<string>>(new Set());

  // Register all Dendra layer IDs from the catalog SYNCHRONOUSLY during render.
  // This must happen before useMapLayers' core effects check IMPLEMENTED_LAYERS
  // and call createMapLayer(). Idempotent Set mutation — safe to repeat.
  for (const [layerId, layer] of layerMap.entries()) {
    if (layer.dataSource === 'dendra') registerDendraLayerId(layerId);
  }

  // Find all Dendra layers currently on the map (pinned or active)
  const dendraLayerIds = new Set<string>();
  for (const p of pinnedLayers) {
    if (isDendraLayer(p.layerId)) dendraLayerIds.add(p.layerId);
  }
  if (activeLayer && isDendraLayer(activeLayer.layerId)) {
    dendraLayerIds.add(activeLayer.layerId);
  }

  const hasAnyDendraOnMap = dendraLayerIds.size > 0;

  // Warm cache when any Dendra layer appears on map
  useEffect(() => {
    if (hasAnyDendraOnMap) warmCache();
  }, [hasAnyDendraOnMap, warmCache]);

  // Populate GraphicsLayers when data arrives
  // IMPORTANT: Each Dendra layer needs its own service's data, but useDendra()
  // only returns data for the ACTIVE layer. So we can ONLY populate the active
  // layer, not pinned ones (they would get stale/wrong data).
  useEffect(() => {
    if (!dataLoaded || !activeLayer || !isDendraLayer(activeLayer.layerId)) return;

    const activeLayerId = activeLayer.layerId;
    const arcLayer = getManagedLayer(activeLayerId);
    if (!arcLayer || !(arcLayer instanceof GraphicsLayer)) return;

    // Always repopulate when data changes (handles layer switching)
    populateDendraLayer(arcLayer, stations);
    filterDendraLayer(arcLayer, showActiveOnly, spatialPolygon);
    populatedRef.current.add(activeLayerId);
  }, [dataLoaded, stations, showActiveOnly, spatialPolygon, getManagedLayer, mapReady, activeLayer]); // eslint-disable-line react-hooks/exhaustive-deps

  // Update filter when showActiveOnly changes
  useEffect(() => {
    for (const layerId of populatedRef.current) {
      const arcLayer = getManagedLayer(layerId);
      if (!arcLayer || !(arcLayer instanceof GraphicsLayer)) continue;
      filterDendraLayer(arcLayer, showActiveOnly, spatialPolygon);
    }
  }, [showActiveOnly, spatialPolygon, getManagedLayer]);
}
