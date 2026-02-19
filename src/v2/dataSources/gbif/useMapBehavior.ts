import { useEffect } from 'react';
import type Layer from '@arcgis/core/layers/Layer';
import type FeatureLayer from '@arcgis/core/layers/FeatureLayer';
import type { ActiveLayer, PinnedLayer } from '../../types';
import { useGBIFFilter } from '../../context/GBIFFilterContext';
import { useLayers } from '../../context/LayerContext';
import { gbifService } from '../../../services/gbifService';
import { useMap } from '../../context/MapContext';

const LAYER_ID = 'dataset-178';
const MAP_LAYER_ID = 'v2-dataset-178';

export function useGBIFMapBehavior(
  getManagedLayer: (layerId: string) => Layer | undefined,
  pinnedLayers: PinnedLayer[],
  activeLayer: ActiveLayer | null,
  _mapReady: number,
) {
  const { browseFilters, warmCache } = useGBIFFilter();
  const { activateLayer } = useLayers();
  const { viewRef } = useMap();

  const isPinned = pinnedLayers.some((layer) => layer.layerId === LAYER_ID);
  const isActive = activeLayer?.layerId === LAYER_ID;
  const isOnMap = isPinned || isActive;

  useEffect(() => {
    if (isOnMap) warmCache();
  }, [isOnMap, warmCache]);

  useEffect(() => {
    if (!isOnMap) return;
    const layer = getManagedLayer(LAYER_ID) as FeatureLayer | undefined;
    if (!layer || typeof layer.definitionExpression !== 'string') return;
    const whereClause = gbifService.buildWhereClause({
      searchText: browseFilters.searchText || undefined,
      kingdom: browseFilters.kingdom || undefined,
      taxonomicClass: browseFilters.taxonomicClass || undefined,
      family: browseFilters.family || undefined,
      basisOfRecord: browseFilters.basisOfRecord || undefined,
      datasetName: browseFilters.datasetName || undefined,
      startDate: browseFilters.startDate || undefined,
      endDate: browseFilters.endDate || undefined,
    });
    if (layer.definitionExpression !== whereClause) {
      layer.definitionExpression = whereClause;
    }
  }, [isOnMap, browseFilters, getManagedLayer]);

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

        const occurrenceId = graphicHit.graphic.attributes?.id as number | undefined;
        if (!occurrenceId) return;
        activateLayer(LAYER_ID, undefined, occurrenceId);
      } catch (error) {
        console.error('[GBIF Map Click] Failed to handle marker click', error);
      }
    });

    return () => handler.remove();
  }, [isOnMap, viewRef, activateLayer]);
}
