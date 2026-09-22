// ============================================================================
// Dendra Map Behavior — Manages station point GraphicsLayers for all Dendra
// sensor services. Unlike iNaturalist (single layer), Dendra has 10 possible
// layers. This hook handles any combination of pinned + active Dendra layers.
//
// Locations sublayers: green/gray station dots (screen-space clustered).
// Latest sublayers: monitoring-style value label badges.
// ============================================================================

import { useEffect, useRef, useState } from 'react';
import GraphicsLayer from '@arcgis/core/layers/GraphicsLayer';
import Extent from '@arcgis/core/geometry/Extent';
import Point from '@arcgis/core/geometry/Point';
import type Layer from '@arcgis/core/layers/Layer';
import type MapView from '@arcgis/core/views/MapView';
import type SceneView from '@arcgis/core/views/SceneView';
import { useDendra } from '../../context/DendraContext';
import { useCatalog } from '../../context/CatalogContext';
import { useLayers } from '../../context/LayerContext';
import { useMap } from '../../context/MapContext';
import {
  populateDendraLayer,
  type ScreenPoint,
} from '../../components/Map/layers/dendraLayer';
import {
  populateDendraLatestLabels,
  populateDendraInactiveMeasureStations,
} from '../../components/Map/layers/dendraLatestLabels';
import { registerDendraLayerId, isDendraLayer } from '../../components/Map/layers';
import type { PinnedLayer, ActiveLayer } from '../../types';
import { goToMarkerWithSmartZoom } from '../../utils/mapMarkerNavigation';
import {
  isDendraLatestCatalogLayer,
  resolveDendraServiceTitle,
} from '../../utils/resolveDendraServiceTitle';
import { buildServiceUrl, type DendraStation } from '../../services/dendraStationService';
import { getConcreteActiveLayerId } from '../../components/Map/mapLayers/internal/mapLayerSyncHelpers';
import type { SpatialPolygon } from '../../utils/spatialQuery';

function buildScreenOf(
  view: MapView | SceneView | null | undefined,
): ((point: { longitude: number; latitude: number }) => ScreenPoint | null) | undefined {
  if (!view || view.destroyed) return undefined;
  return (point) => {
    try {
      const screen = view.toScreen(new Point({
        longitude: point.longitude,
        latitude: point.latitude,
      }));
      if (!screen || !Number.isFinite(screen.x) || !Number.isFinite(screen.y)) return null;
      return { x: screen.x, y: screen.y };
    } catch {
      return null;
    }
  };
}

function renderStationsLayer(
  arcLayer: GraphicsLayer,
  stations: DendraStation[],
  showActiveOnly: boolean,
  spatialPolygon: SpatialPolygon | null | undefined,
  view: MapView | SceneView | null | undefined,
): void {
  populateDendraLayer(arcLayer, stations, {
    screenOf: buildScreenOf(view),
    showActiveOnly,
    spatialPolygon,
  });
}

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
  // Clustering is screen-space — rebuild after zoom/pan settles.
  const [scaleToken, setScaleToken] = useState(0);

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

  useEffect(() => {
    const view = viewRef.current;
    if (!view || view.destroyed) return;
    const handle = view.watch('stationary', (isStationary) => {
      if (isStationary) setScaleToken((token) => token + 1);
    });
    return () => handle.remove();
  }, [viewRef, mapReady]);

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
    const view = viewRef.current;

    if (isDendraLatestCatalogLayer(catalogLayer)) {
      const meta = catalogLayer?.catalogMeta;
      if (!meta?.servicePath || meta.layerIdInService == null) return;

      const serviceUrl = activeServiceUrl
        ?? (meta.serverBaseUrl
          ? buildServiceUrl(meta.serverBaseUrl, meta.servicePath)
          : null);
      if (!serviceUrl) return;

      const requestId = ++latestRequestRef.current;
      const serviceTitle = resolveDendraServiceTitle(layerMap, concreteLayerId) ?? 'Latest';
      const measureLabel = catalogLayer?.catalogMeta?.valueField
        ? (catalogLayer.name || serviceTitle)
        : serviceTitle;
      const valueField = catalogLayer?.catalogMeta?.valueField;
      const isInactiveMeasure = !!catalogLayer?.catalogMeta?.isInactive;

      // Inactive measures: station dots only (no live value badges).
      if (isInactiveMeasure && valueField) {
        void populateDendraInactiveMeasureStations(arcLayer, {
          serviceUrl,
          latestLayerId: meta.layerIdInService,
          valueField,
          title: measureLabel,
        })
          .then(() => {
            if (latestRequestRef.current !== requestId) return;
            populatedRef.current.add(concreteLayerId);
          })
          .catch((error) => {
            console.warn('[Dendra Map] Inactive measure stations failed', error);
            if (latestRequestRef.current !== requestId) return;
            if (dataLoaded) {
              renderStationsLayer(arcLayer, stations, showActiveOnly, spatialPolygon, view);
              populatedRef.current.add(concreteLayerId);
            }
          });
        return;
      }

      void populateDendraLatestLabels(arcLayer, {
        serviceUrl,
        servicePath: meta.servicePath,
        latestLayerId: meta.layerIdInService,
        title: measureLabel,
        valueField,
      })
        .then(() => {
          if (latestRequestRef.current !== requestId) return;
          populatedRef.current.add(concreteLayerId);
        })
        .catch((error) => {
          console.warn('[Dendra Map] Latest labels failed; falling back to stations', error);
          if (latestRequestRef.current !== requestId) return;
          if (dataLoaded) {
            renderStationsLayer(arcLayer, stations, showActiveOnly, spatialPolygon, view);
            populatedRef.current.add(concreteLayerId);
          }
        });
      return;
    }

    if (!dataLoaded) return;
    renderStationsLayer(arcLayer, stations, showActiveOnly, spatialPolygon, view);
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
    scaleToken,
    viewRef,
  ]);

  // Map click handler: station markers open the sidebar; clusters zoom in.
  useEffect(() => {
    if (!hasAnyDendraOnMap || !dataLoaded) return;
    const view = viewRef.current;
    if (!view) return;

    const handler = view.on('click', async (event) => {
      if (isSpatialQueryDrawing) return;
      try {
        const response = await view.hitTest(event);
        const dendraHits = response.results.filter(
          (result) =>
            result.type === 'graphic'
            && typeof result.graphic.layer?.id === 'string'
            && result.graphic.layer.id.startsWith('v2-')
            && isDendraLayer(result.graphic.layer.id.slice(3)),
        );
        // Prefer the marker disc over name-label / count captions.
        const graphicHit = dendraHits.find((result) =>
          result.type === 'graphic' && result.graphic.attributes?.is_label !== 1,
        ) ?? dendraHits[0];
        if (!graphicHit || graphicHit.type !== 'graphic') return;

        const attrs = graphicHit.graphic.attributes ?? {};
        const layerId = graphicHit.graphic.layer?.id;
        if (typeof layerId !== 'string') return;
        const clickedLayerId = layerId.slice(3);
        const clickedLayer = layerMap.get(clickedLayerId);
        if (clickedLayer?.dataSource !== 'dendra') return;

        // Cluster click → zoom to the member stations' extent.
        if (attrs.is_cluster === 1) {
          const ids = String(attrs.cluster_station_ids ?? '')
            .split(',')
            .map(Number)
            .filter((id) => Number.isFinite(id));
          const members = stations.filter((station) => ids.includes(station.station_id));
          if (members.length === 0) return;

          const longitudes = members.map((station) => station.longitude);
          const latitudes = members.map((station) => station.latitude);
          const pad = 0.002;
          const extent = new Extent({
            xmin: Math.min(...longitudes) - pad,
            xmax: Math.max(...longitudes) + pad,
            ymin: Math.min(...latitudes) - pad,
            ymax: Math.max(...latitudes) + pad,
            spatialReference: { wkid: 4326 },
          });
          void view.goTo(extent, { duration: 700 }).catch(() => undefined);
          return;
        }

        const stationIdRaw = attrs.station_id ?? attrs.stationId;
        const stationId = typeof stationIdRaw === 'number' ? stationIdRaw : Number(stationIdRaw);
        if (!Number.isFinite(stationId)) return;

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
  }, [
    hasAnyDendraOnMap,
    dataLoaded,
    viewRef,
    activateLayer,
    highlightPoint,
    clearHighlight,
    layerMap,
    isSpatialQueryDrawing,
    mapReady,
    stations,
  ]);
}
