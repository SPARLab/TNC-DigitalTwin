// ============================================================================
// DataONE Map Behavior — Manages GraphicsLayer population from DataONE filters.
// Layer is "on map" when PINNED or ACTIVE. Map clicks open dataset detail.
// ============================================================================

import { useEffect, useRef } from 'react';
import Point from '@arcgis/core/geometry/Point';
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
  } = useDataOneFilter();
  const { activateLayer } = useLayers();
  const { viewRef, getSpatialPolygonForLayer } = useMap();
  const spatialPolygon = getSpatialPolygonForLayer(LAYER_ID);
  const mapDatasetsByIdRef = useRef<Map<string, DataOneDataset>>(new Map());

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

  // Map click handler: activate DataONE and open dataset detail.
  useEffect(() => {
    if (!isOnMap) return;
    const view = viewRef.current;
    if (!view) return;

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
          void view.goTo({
            target: graphicHit.graphic.geometry,
            zoom: (view.zoom ?? 8) + 2,
          }, { duration: 450 });
          return;
        }

        const dataoneId = graphicHit.graphic.attributes?.dataoneId as string | undefined;
        if (!dataoneId) return;

        if (!mapDatasetsByIdRef.current.has(dataoneId)) {
          const dataset = await dataOneService.getDatasetByDataoneId(dataoneId);
          if (dataset) mapDatasetsByIdRef.current.set(dataoneId, dataset);
        }
        activateLayer(LAYER_ID, undefined, dataoneId);

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

    return () => handler.remove();
  }, [isOnMap, viewRef, activateLayer]);
}
