// ============================================================================
// DataONE Map Behavior — Manages FeatureLayer population from DataONE filters.
// Layer is "on map" when PINNED or ACTIVE. Map clicks open dataset detail.
// Aggregate clicks (cluster/bin) resolve members from in-memory cache.
// applyEdits-populated FeatureLayers don't support aggregateIds queries.
// ============================================================================

import { useEffect, useRef } from 'react';
import Point from '@arcgis/core/geometry/Point';
import Polygon from '@arcgis/core/geometry/Polygon';
import Extent from '@arcgis/core/geometry/Extent';
import * as geometryEngine from '@arcgis/core/geometry/geometryEngine';
import type Layer from '@arcgis/core/layers/Layer';
import type FeatureLayer from '@arcgis/core/layers/FeatureLayer';
import type { DataOneDataset } from '../../../types/dataone';
import { dataOneService } from '../../../services/dataOneService';
import { useDataOneFilter } from '../../context/DataOneFilterContext';
import { useLayers } from '../../context/LayerContext';
import { useMap } from '../../context/MapContext';
import { buildDataOneFeatureReduction, buildDataOneFeatureReductionForScale, getBinningLevelForScale, populateDataOneLayer } from '../../components/Map/layers/dataoneLayer';
import type { PinnedLayer, ActiveLayer } from '../../types';
import { isPointInsideSpatialPolygon } from '../../utils/spatialQuery';

const LAYER_ID = 'dataone-datasets';
const MAP_LAYER_ID = 'v2-dataone-datasets';
const MAX_MAP_SELECTION_IDS = 2000;

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

  const isPinned = pinnedLayers.some((p) => p.layerId === LAYER_ID);
  const isActive = activeLayer?.layerId === LAYER_ID;
  const isOnMap = isPinned || isActive;

  useEffect(() => {
    if (isOnMap) warmCache();
  }, [isOnMap, warmCache]);

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

  // Keep map aggregation mode (clusters vs bins) in sync with sidebar toggle.
  useEffect(() => {
    if (!isOnMap) return;
    const arcLayer = getManagedLayer(LAYER_ID);
    if (!arcLayer) return;
    const dataOneLayer = arcLayer as FeatureLayer;
    (dataOneLayer as any).featureReduction = buildDataOneFeatureReduction(aggregationMode);
  }, [isOnMap, aggregationMode, getManagedLayer, mapReady]);

  // Dynamic binning: watch scale continuously and switch levels
  // only when crossing a threshold (level change guard).
  useEffect(() => {
    if (!isOnMap) return;
    if (aggregationMode !== 'binning') return;
    const view = viewRef.current;
    if (!view) return;
    const arcLayer = getManagedLayer(LAYER_ID);
    if (!arcLayer) return;
    const dataOneLayer = arcLayer as FeatureLayer;

    let lastAppliedLevel: number | null = null;

    const applyIfLevelChanged = () => {
      const level = getBinningLevelForScale(view.scale);
      if (level === lastAppliedLevel) return;
      lastAppliedLevel = level;
      const reduction = (dataOneLayer as any).featureReduction;
      // Prefer mutating the existing reduction to avoid full reduction rebuild flicker.
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
  useEffect(() => {
    if (!isOnMap) return;
    const view = viewRef.current;
    if (!view) return;
    if (!getManagedLayer(LAYER_ID)) return;

    const handler = view.on('click', async (event) => {
      try {
        const response = await view.hitTest(event);
        const graphicHit = response.results.find(
          (result): result is __esri.GraphicHit =>
            result.type === 'graphic' && result.graphic.layer?.id === MAP_LAYER_ID,
        );
        if (!graphicHit) return;

        const aggregateCount = getAggregateCount(graphicHit.graphic);

        // Aggregate click (cluster/bin with ≥1 features).
        // count=1 aggregates are still cluster/bin graphics without feature
        // attributes like dataoneId, so they must go through cache resolution.
        if (aggregateCount >= 1) {
          const dataoneIds = resolveAggregateMembersFromCache(
            graphicHit.graphic,
            mapDatasetsByIdRef.current,
          );

          // Single-member aggregate: open dataset detail directly.
          if (dataoneIds.length === 1) {
            setMapSelectionDataoneIds(null);
            activateLayer(LAYER_ID, undefined, dataoneIds[0]);
            view.closePopup();
            return;
          }

          // Multi-member aggregate: show filtered list in sidebar.
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

          // Aggregate click should re-center to the selected group without
          // changing zoom level, so users can continue manual exploration.
          void view.goTo({
            target: graphicHit.graphic.geometry,
          }, { duration: 450 });
          return;
        }

        // Single point click (non-aggregate feature) — open dataset detail.
        const dataoneId = graphicHit.graphic.attributes?.dataoneId as string | undefined;
        if (!dataoneId) return;
        setMapSelectionDataoneIds(null);

        if (!mapDatasetsByIdRef.current.has(dataoneId)) {
          const dataset = await dataOneService.getDatasetByDataoneId(dataoneId);
          if (dataset) mapDatasetsByIdRef.current.set(dataoneId, dataset);
        }
        activateLayer(LAYER_ID, undefined, dataoneId);

        view.closePopup();

        const geometry = graphicHit.graphic.geometry;
        if (geometry?.type === 'point') {
          const point = geometry as Point;
          void view.goTo(
            {
              center: [point.longitude, point.latitude],
              zoom: Math.max(view.zoom ?? 8, 10),
            },
            { duration: 600 },
          );
        }
      } catch (error) {
        console.error('[DataONE Map Click] Error handling marker click', error);
      }
    });

    return () => {
      handler.remove();
    };
  }, [isOnMap, viewRef, activeLayer, activateLayer, requestBrowseTab, getManagedLayer, setMapSelectionDataoneIds]);

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
          await view.goTo(
            { center: [point.longitude, point.latitude], zoom: Math.max(view.zoom ?? 8, 14) },
            { duration: 700 },
          ).catch(() => {});
          if (cancelled) return;
          view.openPopup({
            features: [feature],
            location: point,
          });
          lastPopupSelectionKeyRef.current = selectionKey;
          return;
        }

        if (geometry) {
          await view.goTo({ target: geometry }, { duration: 700 }).catch(() => {});
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
  }, [isOnMap, activeLayer, viewRef, getManagedLayer, getPinnedByLayerId]);
}
