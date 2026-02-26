// ============================================================================
// DataONE Map Behavior — Manages FeatureLayer population from DataONE filters.
// Layer is "on map" when PINNED or ACTIVE. Map clicks open dataset detail.
// Aggregate clicks (cluster/bin) resolve members from in-memory cache.
//
// 3D (SceneView): client-side FeatureLayers populated via applyEdits are not
// reliably hit-testable in SceneView. A companion GraphicsLayer overlay
// (same pattern as Dendra sensors) is added in 3D for rendering + clicks.
// The FeatureLayer is hidden in 3D; the overlay handles all interaction.
// ============================================================================

import { useEffect, useRef } from 'react';
import Point from '@arcgis/core/geometry/Point';
import Polygon from '@arcgis/core/geometry/Polygon';
import Extent from '@arcgis/core/geometry/Extent';
import * as geometryEngine from '@arcgis/core/geometry/geometryEngine';
import type Layer from '@arcgis/core/layers/Layer';
import type FeatureLayer from '@arcgis/core/layers/FeatureLayer';
import type GraphicsLayer from '@arcgis/core/layers/GraphicsLayer';
import type { DataOneDataset } from '../../../types/dataone';
import { dataOneService } from '../../../services/dataOneService';
import { useDataOneFilter } from '../../context/DataOneFilterContext';
import { useLayers } from '../../context/LayerContext';
import { useMap } from '../../context/MapContext';
import { goToMarkerWithSmartZoom } from '../../utils/mapMarkerNavigation';
import {
  buildDataOneFeatureReduction,
  buildDataOneFeatureReductionForScale,
  getBinningLevelForScale,
  populateDataOneLayer,
  createDataOneOverlay,
  populateDataOneOverlay,
} from '../../components/Map/layers/dataoneLayer';
import type { PinnedLayer, ActiveLayer } from '../../types';
import { isPointInsideSpatialPolygon } from '../../utils/spatialQuery';

const LAYER_ID = 'dataone-datasets';
const MAX_MAP_SELECTION_IDS = 2000;

/**
 * Identify DataONE graphic hits — works on both the FeatureLayer (2D clusters)
 * and the GraphicsLayer overlay (3D individual dots).
 */
function isDataOneGraphicHit(result: __esri.MapViewViewHit): result is __esri.MapViewGraphicHit {
  if (result.type !== 'graphic') return false;
  const g = result.graphic;
  if (typeof g.attributes?.dataoneId === 'string') return true;
  const layerId = String(g.layer?.id ?? '').replace(/^v2-/, '');
  return layerId === LAYER_ID;
}

function getAggregateCount(graphic: __esri.Graphic): number {
  const attrs = graphic.attributes ?? {};
  const candidates = [
    attrs.aggregateCount,
    attrs.cluster_count,
    attrs.point_count,
  ];
  for (const candidate of candidates) {
    if (typeof candidate === 'number' && Number.isFinite(candidate)) {
      return Math.max(0, Math.floor(candidate));
    }
  }
  return 0;
}

/** Resolve aggregate member IDs for bin/cluster graphics from local cache. */
function resolveAggregateMembersFromCache(
  aggregateGraphic: __esri.Graphic,
  cachedDatasets: Map<string, DataOneDataset>,
): string[] {
  if (cachedDatasets.size === 0) return [];

  const targetCount = Math.min(
    getAggregateCount(aggregateGraphic) || cachedDatasets.size,
    MAX_MAP_SELECTION_IDS,
  );

  const geometry = aggregateGraphic.geometry;

  if (geometry?.type === 'polygon') {
    const polygon = geometry as Polygon;
    const inPolygon: string[] = [];
    for (const [dataoneId, dataset] of cachedDatasets) {
      const lon = dataset.centerLon;
      const lat = dataset.centerLat;
      if (lon == null || lat == null) continue;
      const point = new Point({ longitude: lon, latitude: lat, spatialReference: polygon.spatialReference });
      if (geometryEngine.contains(polygon, point)) {
        inPolygon.push(dataoneId);
      }
    }
    return inPolygon.slice(0, targetCount);
  }

  if (geometry?.type === 'extent') {
    const extent = geometry as Extent;
    const inExtent: string[] = [];
    for (const [dataoneId, dataset] of cachedDatasets) {
      const lon = dataset.centerLon;
      const lat = dataset.centerLat;
      if (lon == null || lat == null) continue;
      if (lon >= extent.xmin && lon <= extent.xmax && lat >= extent.ymin && lat <= extent.ymax) {
        inExtent.push(dataoneId);
      }
    }
    return inExtent.slice(0, targetCount);
  }

  if (geometry?.type !== 'point') return [];
  const aggregatePoint = geometry as Point;
  const cLon = aggregatePoint.longitude as number | null;
  const cLat = aggregatePoint.latitude as number | null;
  if (cLon == null || cLat == null || !Number.isFinite(cLon) || !Number.isFinite(cLat)) return [];

  const ranked: Array<{ dataoneId: string; distSq: number }> = [];
  for (const [dataoneId, dataset] of cachedDatasets) {
    const lon = dataset.centerLon;
    const lat = dataset.centerLat;
    if (lon == null || lat == null) continue;
    const dLon = lon - cLon;
    const dLat = lat - cLat;
    ranked.push({ dataoneId, distSq: dLon * dLon + dLat * dLat });
  }

  ranked.sort((a, b) => a.distSq - b.distSq);
  return ranked.slice(0, targetCount).map((entry) => entry.dataoneId);
}

export function useDataOneMapBehavior(
  getManagedLayer: (layerId: string) => Layer | undefined,
  pinnedLayers: PinnedLayer[],
  activeLayer: ActiveLayer | null,
  mapReady: number,
) {
  const {
    warmCache,
    dataLoaded,
    browseFilters,
    aggregationMode,
    setMapSelectionDataoneIds,
    setMapDatasetsCache,
    createMapLoadingScope,
  } = useDataOneFilter();
  const { activateLayer, requestBrowseTab, getPinnedByLayerId } = useLayers();
  const { viewRef, getSpatialPolygonForLayer } = useMap();
  const spatialPolygon = getSpatialPolygonForLayer(LAYER_ID);
  const mapDatasetsByIdRef = useRef<Map<string, DataOneDataset>>(new Map());
  const populateVersionRef = useRef(0);
  const lastPopupSelectionKeyRef = useRef<string | null>(null);
  const overlayRef = useRef<GraphicsLayer | null>(null);

  const isPinned = pinnedLayers.some((p) => p.layerId === LAYER_ID);
  const isActive = activeLayer?.layerId === LAYER_ID;
  const isOnMap = isPinned || isActive;

  useEffect(() => {
    if (isOnMap) warmCache();
  }, [isOnMap, warmCache]);

  // ── 3D overlay lifecycle: create/destroy GraphicsLayer for SceneView ─────
  // In 3D the FeatureLayer is hidden and a GraphicsLayer takes over rendering
  // and click detection (same pattern as Dendra sensor layers).
  useEffect(() => {
    if (!isOnMap) return;
    const view = viewRef.current;
    const arcLayer = getManagedLayer(LAYER_ID);
    if (!view || !arcLayer) return;
    const dataOneLayer = arcLayer as FeatureLayer;

    if (view.type === '3d') {
      const map = view.map;
      if (!map) return;
      dataOneLayer.visible = false;
      (dataOneLayer as any).featureReduction = null;

      const overlay = createDataOneOverlay();
      map.add(overlay);
      overlayRef.current = overlay;

      // Seed overlay from current cache so dots appear immediately
      const datasets = Array.from(mapDatasetsByIdRef.current.values());
      if (datasets.length > 0) populateDataOneOverlay(overlay, datasets);

      return () => {
        try { view.map?.remove(overlay); } catch { /* view may be destroyed */ }
        overlayRef.current = null;
      };
    }

    // 2D: ensure FeatureLayer is visible + has correct feature reduction
    dataOneLayer.visible = true;
    (dataOneLayer as any).featureReduction = buildDataOneFeatureReduction(aggregationMode);
    overlayRef.current = null;
  }, [isOnMap, aggregationMode, getManagedLayer, mapReady, viewRef]);

  // Re-query map points whenever DataONE browse filters change.
  useEffect(() => {
    if (!isOnMap) return;
    const arcLayer = getManagedLayer(LAYER_ID);
    if (!arcLayer) return;
    const dataOneLayer = arcLayer as FeatureLayer;

    const abortController = new AbortController();
    const version = ++populateVersionRef.current;
    const closeMapLoadingScope = createMapLoadingScope();

    const run = async () => {
      try {
        const mapData = await dataOneService.getDatasetsForMapLayer({
          searchText: browseFilters.searchText || undefined,
          tncCategories: browseFilters.tncCategories.length > 0
            ? browseFilters.tncCategories
            : undefined,
          fileTypes: browseFilters.fileTypes.length > 0
            ? browseFilters.fileTypes
            : undefined,
          startDate: browseFilters.startDate || undefined,
          endDate: browseFilters.endDate || undefined,
          author: browseFilters.author || undefined,
          usePreserveRadius: true,
          signal: abortController.signal,
        });
        if (abortController.signal.aborted) return;
        if (populateVersionRef.current !== version) return;

        const spatiallyFilteredMapData = mapData.filter((dataset) => {
          const coordinates = dataset.geometry?.coordinates;
          if (!coordinates) return true;
          return isPointInsideSpatialPolygon(spatialPolygon, coordinates[0], coordinates[1]);
        });

        const byId = new Map<string, DataOneDataset>();
        for (const dataset of spatiallyFilteredMapData) {
          byId.set(dataset.dataoneId, dataset);
        }
        mapDatasetsByIdRef.current = byId;
        setMapDatasetsCache(byId);

        await populateDataOneLayer(dataOneLayer, spatiallyFilteredMapData);

        // Keep 3D overlay in sync when data refreshes
        const overlay = overlayRef.current;
        if (overlay) populateDataOneOverlay(overlay, spatiallyFilteredMapData);
      } catch (error) {
        if (!abortController.signal.aborted) {
          console.error('[DataONE Map] Failed to refresh map markers', error);
        }
      } finally {
        if (!abortController.signal.aborted) {
          closeMapLoadingScope();
        }
      }
    };

    void run();
    return () => {
      abortController.abort();
      closeMapLoadingScope();
    };
  }, [isOnMap, dataLoaded, browseFilters, spatialPolygon, getManagedLayer, mapReady, createMapLoadingScope]);

  // Dynamic binning: watch scale continuously and switch levels
  // only when crossing a threshold (level change guard). 2D only.
  useEffect(() => {
    if (!isOnMap) return;
    if (aggregationMode !== 'binning') return;
    const view = viewRef.current;
    if (!view || view.type === '3d') return;
    const arcLayer = getManagedLayer(LAYER_ID);
    if (!arcLayer) return;
    const dataOneLayer = arcLayer as FeatureLayer;

    let lastAppliedLevel: number | null = null;

    const applyIfLevelChanged = () => {
      const level = getBinningLevelForScale(view.scale);
      if (level === lastAppliedLevel) return;
      lastAppliedLevel = level;
      const reduction = (dataOneLayer as any).featureReduction;
      if (reduction?.type === 'binning') {
        reduction.fixedBinLevel = level;
        return;
      }
      (dataOneLayer as any).featureReduction = buildDataOneFeatureReductionForScale('binning', view.scale);
    };

    applyIfLevelChanged();
    const scaleHandle = view.watch('scale', () => applyIfLevelChanged());

    return () => {
      scaleHandle.remove();
    };
  }, [isOnMap, aggregationMode, viewRef, getManagedLayer, mapReady]);

  // Map click handler: activate DataONE and open dataset detail or aggregate list.
  // 3D: hitTest against the GraphicsLayer overlay (reliable, like Dendra).
  // 2D: hitTest against the FeatureLayer (supports cluster/bin detection).
  useEffect(() => {
    if (!isOnMap) return;
    const view = viewRef.current;
    if (!view) return;
    const dataOneLayer = getManagedLayer(LAYER_ID) as FeatureLayer | undefined;
    if (!dataOneLayer) return;

    const handler = view.on('click', async (event) => {
      try {
        // In 3D, target the overlay GraphicsLayer; in 2D, target the FeatureLayer.
        const overlay = overlayRef.current;
        const hitTarget = (view.type === '3d' && overlay) ? overlay : dataOneLayer;
        const response = await view.hitTest(event, { include: [hitTarget] });
        const graphicHit = response.results.find(isDataOneGraphicHit);
        if (!graphicHit || graphicHit.type !== 'graphic') return;

        const aggregateCount = getAggregateCount(graphicHit.graphic);

        // Aggregate click (cluster/bin with ≥1 features) — 2D only.
        if (aggregateCount >= 1) {
          const dataoneIds = resolveAggregateMembersFromCache(
            graphicHit.graphic,
            mapDatasetsByIdRef.current,
          );

          if (dataoneIds.length === 1) {
            setMapSelectionDataoneIds(null);
            const currentDataOneViewId = activeLayer?.layerId === LAYER_ID
              ? activeLayer.viewId
              : undefined;
            activateLayer(LAYER_ID, currentDataOneViewId, dataoneIds[0]);
            view.closePopup();
            return;
          }

          if (dataoneIds.length > 0) {
            setMapSelectionDataoneIds(dataoneIds);
          } else {
            setMapSelectionDataoneIds(null);
          }

          const currentDataOneViewId = activeLayer?.layerId === LAYER_ID
            ? activeLayer.viewId
            : undefined;
          activateLayer(LAYER_ID, currentDataOneViewId, undefined);
          requestBrowseTab();
          view.closePopup();

          const aggregateGeometry = graphicHit.graphic.geometry;
          if (aggregateGeometry?.type === 'point') {
            const aggPoint = aggregateGeometry as Point;
            void goToMarkerWithSmartZoom({
              view,
              longitude: aggPoint.longitude,
              latitude: aggPoint.latitude,
              duration: 450,
            });
          } else if (aggregateGeometry) {
            const centroid = aggregateGeometry.extent?.center;
            if (centroid) {
              void goToMarkerWithSmartZoom({
                view,
                longitude: centroid.longitude,
                latitude: centroid.latitude,
                duration: 450,
              });
            }
          }
          return;
        }

        // Single point click — open dataset detail.
        const dataoneId = graphicHit.graphic.attributes?.dataoneId as string | undefined;
        if (!dataoneId) return;
        setMapSelectionDataoneIds(null);

        if (!mapDatasetsByIdRef.current.has(dataoneId)) {
          const dataset = await dataOneService.getDatasetByDataoneId(dataoneId);
          if (dataset) mapDatasetsByIdRef.current.set(dataoneId, dataset);
        }
        const currentDataOneViewId = activeLayer?.layerId === LAYER_ID
          ? activeLayer.viewId
          : undefined;
        activateLayer(LAYER_ID, currentDataOneViewId, dataoneId);

        view.closePopup();

        // Open ArcGIS popup on the clicked graphic for visual highlight
        const geometry = graphicHit.graphic.geometry;
        if (geometry?.type === 'point') {
          const point = geometry as Point;
          void goToMarkerWithSmartZoom({
            view,
            longitude: point.longitude,
            latitude: point.latitude,
            duration: 600,
          });
          view.openPopup({ features: [graphicHit.graphic], location: point });
        }
      } catch (error) {
        console.error('[DataONE Map Click] Error handling marker click', error);
      }
    });

    return () => {
      handler.remove();
    };
  }, [isOnMap, viewRef, activeLayer, activateLayer, requestBrowseTab, getManagedLayer, setMapSelectionDataoneIds, mapReady]);

  // When a saved DataONE child view (single dataset) is activated from Map Layers,
  // focus the marker and open ArcGIS popup so native highlight is shown.
  useEffect(() => {
    if (!isOnMap) return;
    if (activeLayer?.layerId !== LAYER_ID || !activeLayer.featureId || !activeLayer.viewId) return;
    const view = viewRef.current;
    if (!view) return;

    const pinned = getPinnedByLayerId(LAYER_ID);
    const activeView = pinned?.views?.find((viewEntry) => viewEntry.id === activeLayer.viewId);
    const selectedDatasetId = activeView?.dataoneFilters?.selectedDatasetId;
    const featureId = String(activeLayer.featureId);
    if (!selectedDatasetId || selectedDatasetId !== featureId) return;

    const selectionKey = `${activeLayer.viewId}:${featureId}`;
    if (lastPopupSelectionKeyRef.current === selectionKey) return;

    const mapLayer = getManagedLayer(LAYER_ID) as FeatureLayer | undefined;
    if (!mapLayer) return;

    let cancelled = false;
    const escapedDataoneId = featureId.replace(/'/g, "''");

    void mapLayer.queryFeatures({
      where: `dataoneId = '${escapedDataoneId}'`,
      outFields: ['*'],
      returnGeometry: true,
      num: 1,
    })
      .then(async (result) => {
        if (cancelled) return;
        const feature = result.features[0];
        if (!feature) return;

        const geometry = feature.geometry;
        if (geometry?.type === 'point') {
          const point = geometry as Point;
          await goToMarkerWithSmartZoom({
            view,
            longitude: point.longitude,
            latitude: point.latitude,
            duration: 700,
          });
          if (cancelled) return;
          view.openPopup({
            features: [feature],
            location: point,
          });
          lastPopupSelectionKeyRef.current = selectionKey;
          return;
        }

        if (geometry) {
          const centroid = geometry.extent?.center;
          if (centroid) {
            await goToMarkerWithSmartZoom({
              view,
              longitude: centroid.longitude,
              latitude: centroid.latitude,
              duration: 700,
            });
          }
          if (cancelled) return;
          view.openPopup({ features: [feature] });
          lastPopupSelectionKeyRef.current = selectionKey;
        }
      })
      .catch((error) => {
        console.error('[DataONE View Activation] Failed to focus selected dataset feature', error);
      });

    return () => {
      cancelled = true;
    };
  }, [isOnMap, activeLayer, viewRef, getManagedLayer, getPinnedByLayerId, mapReady]);
}
