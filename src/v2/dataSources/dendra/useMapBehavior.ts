// ============================================================================
// Dendra Map Behavior — Manages station point GraphicsLayers for all Dendra
// sensor services. Unlike iNaturalist (single layer), Dendra has 10 possible
// layers. This hook handles any combination of pinned + active Dendra layers.
//
// Locations sublayers: green/gray station dots.
// Latest sublayers: monitoring-style value label badges.
// ============================================================================

import { useEffect, useRef } from 'react';
import GraphicsLayer from '@arcgis/core/layers/GraphicsLayer';
import type Layer from '@arcgis/core/layers/Layer';
import { useDendra } from '../../context/DendraContext';
import { useCatalog } from '../../context/CatalogContext';
import { useLayers } from '../../context/LayerContext';
import { useMap } from '../../context/MapContext';
import { populateDendraLayer, filterDendraLayer } from '../../components/Map/layers/dendraLayer';
import { populateDendraLatestLabels } from '../../components/Map/layers/dendraLatestLabels';
import { registerDendraLayerId, isDendraLayer } from '../../components/Map/layers';
import type { PinnedLayer, ActiveLayer } from '../../types';
import { goToMarkerWithSmartZoom } from '../../utils/mapMarkerNavigation';
import {
  isDendraLatestCatalogLayer,
  resolveDendraServiceTitle,
} from '../../utils/resolveDendraServiceTitle';
import { buildServiceUrl } from '../../services/dendraStationService';
import { getConcreteActiveLayerId } from '../../components/Map/mapLayers/internal/mapLayerSyncHelpers';

export function useDendraMapBehavior(
  getManagedLayer: (layerId: string) => Layer | undefined,
  pinnedLayers: PinnedLayer[],
  activeLayer: ActiveLayer | null,
  mapReady: number,
) {
  const { stations, dataLoaded, warmCache, showActiveOnly, activeServiceUrl } = useDendra();
  const { activateLayer } = useLayers();
  const {
    getSpatialPolygonForLayer,
    highlightPoint,
    clearHighlight,
    viewRef,
    isSpatialQueryDrawing,
  } = useMap();
  const { layerMap } = useCatalog();
  const populatedRef = useRef<Set<string>>(new Set());
  const latestRequestRef = useRef(0);

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
  const activeCatalogLayer = (() => {
    if (activeLayer?.dataSource !== 'dendra') return undefined;
    const concreteId = getConcreteActiveLayerId(activeLayer, layerMap) ?? activeLayer.layerId;
    return layerMap.get(concreteId);
  })();
  const activeIsLatest = isDendraLatestCatalogLayer(activeCatalogLayer);

  // Warm cache when any Dendra layer appears on map
  useEffect(() => {
    if (hasAnyDendraOnMap) warmCache();
  }, [hasAnyDendraOnMap, warmCache]);

  // Populate GraphicsLayers when data arrives
  // IMPORTANT: Each Dendra layer needs its own service's data, but useDendra()
  // only returns data for the ACTIVE layer. So we can ONLY populate the active
  // layer, not pinned ones (they would get stale/wrong data).
  useEffect(() => {
    if (!activeLayer || activeLayer.dataSource !== 'dendra') return;
    if (!isDendraLayer(activeLayer.layerId) && !activeLayer.isService) return;

    const concreteLayerId = getConcreteActiveLayerId(activeLayer, layerMap) ?? activeLayer.layerId;
    if (!isDendraLayer(concreteLayerId)) return;

    const arcLayer = getManagedLayer(concreteLayerId);
    if (!arcLayer || !(arcLayer instanceof GraphicsLayer)) return;

    const catalogLayer = layerMap.get(concreteLayerId);
    const spatialPolygon = getSpatialPolygonForLayer(concreteLayerId);

    if (isDendraLatestCatalogLayer(catalogLayer)) {
      const meta = catalogLayer?.catalogMeta;
      if (!meta?.servicePath || meta.layerIdInService == null) return;

      const serviceUrl = activeServiceUrl
        ?? (meta.serverBaseUrl
          ? buildServiceUrl(meta.serverBaseUrl, meta.servicePath)
          : null);
      if (!serviceUrl) return;

      const requestId = ++latestRequestRef.current;
      const title = resolveDendraServiceTitle(layerMap, concreteLayerId) ?? catalogLayer?.name ?? 'Latest';

      void populateDendraLatestLabels(arcLayer, {
        serviceUrl,
        servicePath: meta.servicePath,
        latestLayerId: meta.layerIdInService,
        title,
      })
        .then(() => {
          if (latestRequestRef.current !== requestId) return;
          populatedRef.current.add(concreteLayerId);
        })
        .catch((error) => {
          console.warn('[Dendra Map] Latest labels failed; falling back to stations', error);
          if (latestRequestRef.current !== requestId) return;
          if (dataLoaded) {
            populateDendraLayer(arcLayer, stations);
            filterDendraLayer(arcLayer, showActiveOnly, spatialPolygon);
            populatedRef.current.add(concreteLayerId);
          }
        });
      return;
    }

    if (!dataLoaded) return;
    populateDendraLayer(arcLayer, stations);
    filterDendraLayer(arcLayer, showActiveOnly, spatialPolygon);
    populatedRef.current.add(concreteLayerId);
  }, [
    dataLoaded,
    stations,
    showActiveOnly,
    getSpatialPolygonForLayer,
    getManagedLayer,
    mapReady,
    activeLayer,
    activeLayerSpatialPolygon,
    layerMap,
    activeServiceUrl,
    activeIsLatest,
  ]);

  // Update filter when showActiveOnly changes (Locations dots only)
  useEffect(() => {
    if (activeIsLatest) return;
    for (const layerId of populatedRef.current) {
      const arcLayer = getManagedLayer(layerId);
      if (!arcLayer || !(arcLayer instanceof GraphicsLayer)) continue;
      const catalogLayer = layerMap.get(layerId);
      if (isDendraLatestCatalogLayer(catalogLayer)) continue;
      const spatialPolygon = getSpatialPolygonForLayer(layerId);
      filterDendraLayer(arcLayer, showActiveOnly, spatialPolygon);
    }
  }, [
    showActiveOnly,
    getSpatialPolygonForLayer,
    getManagedLayer,
    activeLayer?.layerId,
    activeLayerSpatialPolygon,
    activeIsLatest,
    layerMap,
  ]);

  // Map click handler: clicking a Dendra station marker activates its layer
  // and opens the station selection flow in the right sidebar.
  useEffect(() => {
    if (!hasAnyDendraOnMap || !dataLoaded) return;
    const view = viewRef.current;
    if (!view) return;

    const handler = view.on('click', async (event) => {
      if (isSpatialQueryDrawing) return;
      try {
        const response = await view.hitTest(event);
        const graphicHit = response.results.find(
          (result) =>
            result.type === 'graphic'
            && typeof result.graphic.layer?.id === 'string'
            && result.graphic.layer.id.startsWith('v2-')
            && isDendraLayer(result.graphic.layer.id.slice(3)),
        );
        if (!graphicHit || graphicHit.type !== 'graphic') return;

        const attrs = graphicHit.graphic.attributes ?? {};
        const stationIdRaw = attrs.station_id ?? attrs.stationId;
        const stationId = typeof stationIdRaw === 'number' ? stationIdRaw : Number(stationIdRaw);
        if (!Number.isFinite(stationId)) return;
        const layerId = graphicHit.graphic.layer?.id;
        if (typeof layerId !== 'string') return;
        const clickedLayerId = layerId.slice(3);
        const clickedLayer = layerMap.get(clickedLayerId);
        if (clickedLayer?.dataSource !== 'dendra') return;

        // Activate immediately so sidebar switches in parallel with camera movement.
        activateLayer(clickedLayerId, undefined, stationId);

        const geometry = graphicHit.graphic.geometry;
        if (geometry?.type === 'point') {
          const point = geometry as __esri.Point;
          if (typeof point.longitude !== 'number' || typeof point.latitude !== 'number') return;
          highlightPoint(point.longitude, point.latitude);
          void goToMarkerWithSmartZoom({
            view,
            longitude: point.longitude,
            latitude: point.latitude,
            duration: 800,
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
  }, [hasAnyDendraOnMap, dataLoaded, viewRef, activateLayer, highlightPoint, clearHighlight, layerMap, isSpatialQueryDrawing, mapReady]);
}
