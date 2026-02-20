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
import { useLayers } from '../../context/LayerContext';
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
  const { activateLayer } = useLayers();
  const { getSpatialPolygonForLayer, highlightPoint, clearHighlight, viewRef } = useMap();
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
  const activeLayerSpatialPolygon = activeLayer?.layerId
    ? getSpatialPolygonForLayer(activeLayer.layerId)
    : null;

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
    const spatialPolygon = getSpatialPolygonForLayer(activeLayerId);
    populateDendraLayer(arcLayer, stations);
    filterDendraLayer(arcLayer, showActiveOnly, spatialPolygon);
    populatedRef.current.add(activeLayerId);
  }, [dataLoaded, stations, showActiveOnly, getSpatialPolygonForLayer, getManagedLayer, mapReady, activeLayer, activeLayerSpatialPolygon]); // eslint-disable-line react-hooks/exhaustive-deps

  // Update filter when showActiveOnly changes
  useEffect(() => {
    for (const layerId of populatedRef.current) {
      const arcLayer = getManagedLayer(layerId);
      if (!arcLayer || !(arcLayer instanceof GraphicsLayer)) continue;
      const spatialPolygon = getSpatialPolygonForLayer(layerId);
      filterDendraLayer(arcLayer, showActiveOnly, spatialPolygon);
    }
  }, [showActiveOnly, getSpatialPolygonForLayer, getManagedLayer, activeLayer?.layerId, activeLayerSpatialPolygon]);

  // Map click handler: clicking a Dendra station marker activates its layer
  // and opens the station detail flow in the right sidebar.
  useEffect(() => {
    if (!hasAnyDendraOnMap || !dataLoaded) return;
    const view = viewRef.current;
    if (!view) return;

    const handler = view.on('click', async (event) => {
      try {
        const response = await view.hitTest(event);
        const graphicHit = response.results.find(
          (result): result is __esri.GraphicHit =>
            result.type === 'graphic'
            && typeof result.graphic.layer?.id === 'string'
            && result.graphic.layer.id.startsWith('v2-')
            && isDendraLayer(result.graphic.layer.id.slice(3)),
        );
        if (!graphicHit) return;

        const stationId = graphicHit.graphic.attributes?.station_id as number | undefined;
        if (stationId == null) return;
        const layerId = graphicHit.graphic.layer?.id;
        if (typeof layerId !== 'string') return;
        const clickedLayerId = layerId.slice(3);
        const clickedLayer = layerMap.get(clickedLayerId);
        if (clickedLayer?.dataSource !== 'dendra') return;

        // Activate immediately so sidebar switches to Browse/detail in parallel
        // with camera movement instead of waiting for goTo to finish.
        activateLayer(clickedLayerId, undefined, stationId);

        const geometry = graphicHit.graphic.geometry;
        if (geometry?.type === 'point') {
          const point = geometry as __esri.Point;
          if (typeof point.longitude !== 'number' || typeof point.latitude !== 'number') return;
          highlightPoint(point.longitude, point.latitude);
          void view.goTo(
            { center: [point.longitude, point.latitude], zoom: 15 },
            { duration: 800 },
          ).catch(() => {
            // Ignore goTo interruptions from rapid user interactions.
          });
          view.openPopup({
            features: [graphicHit.graphic],
            location: point,
          });
          setTimeout(clearHighlight, 5000);
        }
      } catch (error) {
        console.error('[Dendra Map Click] Error handling marker click', error);
      }
    });

    return () => handler.remove();
  }, [hasAnyDendraOnMap, dataLoaded, viewRef, activateLayer, highlightPoint, clearHighlight, layerMap]);
}
