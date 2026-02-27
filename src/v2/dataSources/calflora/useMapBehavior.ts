import { useEffect } from 'react';
import type Layer from '@arcgis/core/layers/Layer';
import type FeatureLayer from '@arcgis/core/layers/FeatureLayer';
import type { ActiveLayer, PinnedLayer } from '../../types';
import { useCalFloraFilter } from '../../context/CalFloraFilterContext';
import { useLayers } from '../../context/LayerContext';
import { calfloraV2Service } from '../../../services/calfloraV2Service';
import { useMap } from '../../context/MapContext';
import { goToMarkerWithSmartZoom } from '../../utils/mapMarkerNavigation';

const CALFLORA_LAYER_ID = 'calflora-observations';

function toObjectId(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value) && value > 0) return value;
  if (typeof value === 'string' && value.trim()) {
    const parsed = Number(value);
    if (Number.isFinite(parsed) && parsed > 0) return parsed;
  }
  return null;
}

export function useCalFloraMapBehavior(
  getManagedLayer: (layerId: string) => Layer | undefined,
  pinnedLayers: PinnedLayer[],
  activeLayer: ActiveLayer | null,
  mapReady: number,
) {
  const { browseFilters, warmCache } = useCalFloraFilter();
  const { activateLayer } = useLayers();
  const { viewRef } = useMap();

  const activeCalfloraLayerId = activeLayer?.layerId === CALFLORA_LAYER_ID ? CALFLORA_LAYER_ID : null;
  const pinnedCalfloraLayerId = pinnedLayers.find((layer) => layer.layerId === CALFLORA_LAYER_ID)?.layerId ?? null;
  const targetLayerId = activeCalfloraLayerId ?? pinnedCalfloraLayerId;
  const isOnMap = !!targetLayerId;

  useEffect(() => {
    if (isOnMap) warmCache();
  }, [isOnMap, warmCache]);

  useEffect(() => {
    if (!isOnMap || !targetLayerId) return;
    const layer = getManagedLayer(targetLayerId) as FeatureLayer | undefined;
    if (!layer || typeof layer.definitionExpression !== 'string') return;

    const whereClause = calfloraV2Service.buildWhereClause({
      searchText: browseFilters.searchText || undefined,
      county: browseFilters.county || undefined,
      startDate: browseFilters.startDate || undefined,
      endDate: browseFilters.endDate || undefined,
      hasPhoto: browseFilters.hasPhoto,
    });

    if (layer.definitionExpression !== whereClause) {
      layer.definitionExpression = whereClause;
    }
  }, [isOnMap, targetLayerId, browseFilters, getManagedLayer]);

  useEffect(() => {
    if (!isOnMap) return;
    const view = viewRef.current;
    if (!view) return;

    const handler = view.on('click', async (event) => {
      try {
        const response = await view.hitTest(event);
        const graphicHit = response.results.find((result) => {
          if (result.type !== 'graphic') return false;
          const layerId = String(result.graphic.layer?.id ?? '').replace(/^v2-/, '');
          return layerId === CALFLORA_LAYER_ID;
        });
        if (!graphicHit || graphicHit.type !== 'graphic') return;

        const attributes = graphicHit.graphic.attributes as Record<string, unknown> | undefined;
        const layer = graphicHit.graphic.layer as FeatureLayer | undefined;
        const objectIdField = layer?.objectIdField;

        const objectId = toObjectId(
          (objectIdField && attributes ? attributes[objectIdField] : undefined)
          ?? attributes?.objectid
          ?? attributes?.OBJECTID
          ?? attributes?.ObjectId
          ?? attributes?.objectId
        );
        if (!objectId) return;
        const geometry = graphicHit.graphic.geometry;
        if (geometry?.type === 'point') {
          const point = geometry as __esri.Point;
          const longitude = Number(point.longitude);
          const latitude = Number(point.latitude);
          if (!Number.isFinite(longitude) || !Number.isFinite(latitude)) return;
          void goToMarkerWithSmartZoom({
            view,
            longitude,
            latitude,
            duration: 600,
          });
        }
        view.openPopup({
          features: [graphicHit.graphic],
          location: event.mapPoint ?? graphicHit.graphic.geometry,
          updateLocationEnabled: true,
        });
        const nextViewId = activeLayer?.layerId === CALFLORA_LAYER_ID ? activeLayer.viewId : undefined;
        activateLayer(CALFLORA_LAYER_ID, nextViewId, objectId);
      } catch (error) {
        console.error('[CalFlora Map Click] Failed to handle marker click', error);
      }
    });

    return () => handler.remove();
  }, [isOnMap, viewRef, activateLayer, activeLayer?.layerId, activeLayer?.viewId, mapReady]);
}
