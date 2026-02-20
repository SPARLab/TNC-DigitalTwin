// ============================================================================
// DataONE Map Behavior — Manages GraphicsLayer population from DataONE filters.
// Layer is "on map" when PINNED or ACTIVE. Map clicks open dataset detail.
// Cluster clicks resolve members from in-memory cache (not ArcGIS LayerView)
// because applyEdits-populated FeatureLayers don't support aggregateIds queries.
// ============================================================================

import { useEffect, useRef } from 'react';
import Graphic from '@arcgis/core/Graphic';
import Point from '@arcgis/core/geometry/Point';
import SimpleMarkerSymbol from '@arcgis/core/symbols/SimpleMarkerSymbol';
import type Layer from '@arcgis/core/layers/Layer';
import type FeatureLayer from '@arcgis/core/layers/FeatureLayer';
import type { DataOneDataset } from '../../../types/dataone';
import { dataOneService } from '../../../services/dataOneService';
import { useDataOneFilter } from '../../context/DataOneFilterContext';
import { useLayers } from '../../context/LayerContext';
import { useMap } from '../../context/MapContext';
import { populateDataOneLayer } from '../../components/Map/layers/dataoneLayer';
import type { PinnedLayer, ActiveLayer } from '../../types';
import { isPointInsideSpatialPolygon } from '../../utils/spatialQuery';

const LAYER_ID = 'dataone-datasets';
const MAP_LAYER_ID = 'v2-dataone-datasets';
const MAX_MAP_SELECTION_IDS = 2000;

const CLUSTER_HIGHLIGHT_SYMBOL = new SimpleMarkerSymbol({
  style: 'circle',
  size: 62,
  color: [59, 130, 246, 0.10],  // blue-500 @ 10% fill
  outline: {
    color: [59, 130, 246, 0.80], // blue-500 @ 80%
    width: 2.5,
  },
});

/**
 * Resolve cluster member IDs by finding the N closest datasets to the cluster
 * center, where N = cluster_count.  This avoids pixel→geographic bounding-box
 * conversion, which breaks at low zoom because ArcGIS hierarchical clustering
 * can merge points far beyond the configured clusterRadius.
 */
function resolveClusterMembersFromCache(
  clusterGraphic: __esri.Graphic,
  cachedDatasets: Map<string, DataOneDataset>,
): string[] {
  if (cachedDatasets.size === 0) return [];
  if (clusterGraphic.geometry?.type !== 'point') return [];

  const clusterPoint = clusterGraphic.geometry as Point;
  const cLon = clusterPoint.longitude as number | null;
  const cLat = clusterPoint.latitude as number | null;
  if (cLon == null || cLat == null || !Number.isFinite(cLon) || !Number.isFinite(cLat)) return [];

  const targetCount = Math.min(
    (clusterGraphic.attributes?.cluster_count as number) || cachedDatasets.size,
    MAX_MAP_SELECTION_IDS,
  );

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
    mapSelectionDataoneIds,
    setMapSelectionDataoneIds,
    setMapDatasetsCache,
  } = useDataOneFilter();
  const { activateLayer } = useLayers();
  const { viewRef, getSpatialPolygonForLayer } = useMap();
  const spatialPolygon = getSpatialPolygonForLayer(LAYER_ID);
  const mapDatasetsByIdRef = useRef<Map<string, DataOneDataset>>(new Map());
  const highlightGraphicRef = useRef<__esri.Graphic | null>(null);

  const isPinned = pinnedLayers.some((p) => p.layerId === LAYER_ID);
  const isActive = activeLayer?.layerId === LAYER_ID;
  const isOnMap = isPinned || isActive;

  useEffect(() => {
    if (isOnMap) warmCache();
  }, [isOnMap, warmCache]);

  // Clear the map highlight ring when the sidebar map-selection filter is dismissed.
  useEffect(() => {
    if (mapSelectionDataoneIds != null) return;
    const view = viewRef.current;
    if (!view || !highlightGraphicRef.current) return;
    view.graphics.remove(highlightGraphicRef.current);
    highlightGraphicRef.current = null;
  }, [mapSelectionDataoneIds, viewRef]);

  // Re-query map points whenever DataONE browse filters change.
  useEffect(() => {
    if (!isOnMap) return;
    const arcLayer = getManagedLayer(LAYER_ID);
    if (!arcLayer) return;
    const dataOneLayer = arcLayer as FeatureLayer;

    const abortController = new AbortController();

    const run = async () => {
      try {
        const mapData = await dataOneService.getDatasetsForMapLayer({
          searchText: browseFilters.searchText || undefined,
          tncCategory: browseFilters.tncCategory || undefined,
          startDate: browseFilters.startDate || undefined,
          endDate: browseFilters.endDate || undefined,
          author: browseFilters.author || undefined,
          usePreserveRadius: true,
          signal: abortController.signal,
        });
        if (abortController.signal.aborted) return;

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
      }
    };

    void run();
    return () => abortController.abort();
  }, [isOnMap, dataLoaded, browseFilters, spatialPolygon, getManagedLayer, mapReady]);

  // Map click handler: activate DataONE and open dataset detail or cluster list.
  useEffect(() => {
    if (!isOnMap) return;
    const view = viewRef.current;
    if (!view) return;
    const mapLayer = getManagedLayer(LAYER_ID) as FeatureLayer | undefined;
    if (!mapLayer) return;

    function clearHighlight() {
      if (highlightGraphicRef.current) {
        view!.graphics.remove(highlightGraphicRef.current);
        highlightGraphicRef.current = null;
      }
    }

    function showHighlight(geometry: __esri.Geometry) {
      clearHighlight();
      const ring = new Graphic({
        geometry,
        symbol: CLUSTER_HIGHLIGHT_SYMBOL,
      });
      view!.graphics.add(ring);
      highlightGraphicRef.current = ring;
    }

    const handler = view.on('click', async (event) => {
      try {
        const response = await view.hitTest(event);
        const graphicHit = response.results.find(
          (result): result is __esri.GraphicHit =>
            result.type === 'graphic' && result.graphic.layer?.id === MAP_LAYER_ID,
        );
        if (!graphicHit) return;

        const clusterCount = graphicHit.graphic.attributes?.cluster_count as number | undefined;
        if (clusterCount && clusterCount > 1) {
          const dataoneIds = resolveClusterMembersFromCache(
            graphicHit.graphic,
            mapDatasetsByIdRef.current,
          );

          if (dataoneIds.length > 0) {
            setMapSelectionDataoneIds(dataoneIds);
          } else {
            setMapSelectionDataoneIds(null);
          }

          activateLayer(LAYER_ID, undefined, undefined);
          view.closePopup();

          if (graphicHit.graphic.geometry) {
            showHighlight(graphicHit.graphic.geometry);
          }

          void view.goTo({
            target: graphicHit.graphic.geometry,
            zoom: (view.zoom ?? 8) + 2,
          }, { duration: 450 });
          return;
        }

        // Single point click — open dataset detail directly.
        const dataoneId = graphicHit.graphic.attributes?.dataoneId as string | undefined;
        if (!dataoneId) return;
        setMapSelectionDataoneIds(null);
        clearHighlight();

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
      clearHighlight();
    };
  }, [isOnMap, viewRef, activateLayer, getManagedLayer, setMapSelectionDataoneIds]);
}
