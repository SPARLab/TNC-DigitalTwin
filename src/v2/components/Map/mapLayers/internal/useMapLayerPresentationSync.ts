import { useEffect, type MutableRefObject } from 'react';
import type Layer from '@arcgis/core/layers/Layer';
import type MapView from '@arcgis/core/views/MapView';
import type SceneView from '@arcgis/core/views/SceneView';
import type { CatalogLayer, PinnedLayer } from '../../../../types';
import {
  getFirstMapImageSublayer,
  normalizeWhereClause,
  type DefinitionExpressionLayer,
} from './mapLayerSyncHelpers';

interface UseMapLayerPresentationSyncParams {
  pinnedLayers: PinnedLayer[];
  concreteActiveLayerId: string | null;
  getLayerOpacity: (layerId: string) => number;
  layerMap: Map<string, CatalogLayer>;
  viewRef: MutableRefObject<MapView | SceneView | null>;
  mapReady: number;
  managedLayersRef: MutableRefObject<Map<string, Layer>>;
}

export function useMapLayerPresentationSync({
  pinnedLayers,
  concreteActiveLayerId,
  getLayerOpacity,
  layerMap,
  viewRef,
  mapReady,
  managedLayersRef,
}: UseMapLayerPresentationSyncParams) {
  useEffect(() => {
    const managed = managedLayersRef.current;

    for (const pinned of pinnedLayers) {
      const arcLayer = managed.get(pinned.layerId);
      if (!arcLayer) continue;
      arcLayer.visible = pinned.isVisible;
      arcLayer.opacity = Math.min(1, Math.max(0, pinned.opacity ?? 1));
    }

    if (!concreteActiveLayerId) return;
    const isPinned = pinnedLayers.some((pinned) => pinned.layerId === concreteActiveLayerId);
    if (isPinned) return;

    const activeLayer = managed.get(concreteActiveLayerId);
    if (!activeLayer) return;
    activeLayer.visible = true;
    activeLayer.opacity = Math.min(1, Math.max(0, getLayerOpacity(concreteActiveLayerId)));
  }, [pinnedLayers, concreteActiveLayerId, getLayerOpacity, managedLayersRef]);

  useEffect(() => {
    const managed = managedLayersRef.current;
    for (const pinned of pinnedLayers) {
      const catalogLayer = layerMap.get(pinned.layerId);
      if (catalogLayer?.dataSource !== 'tnc-arcgis') continue;

      const arcLayer = managed.get(pinned.layerId);
      if (!arcLayer) continue;

      const whereClause = normalizeWhereClause(pinned.tncArcgisFilters?.whereClause);
      const featureLayer = arcLayer as DefinitionExpressionLayer;
      if (typeof featureLayer.definitionExpression === 'string') {
        if (featureLayer.definitionExpression !== whereClause) {
          featureLayer.definitionExpression = whereClause;
        }
        continue;
      }

      const firstSublayer = getFirstMapImageSublayer(arcLayer);
      if (
        firstSublayer &&
        typeof firstSublayer.definitionExpression === 'string' &&
        firstSublayer.definitionExpression !== whereClause
      ) {
        firstSublayer.definitionExpression = whereClause;
      }
    }
  }, [pinnedLayers, layerMap, managedLayersRef]);

  useEffect(() => {
    const view = viewRef.current;
    if (!view?.map) return;

    const map = view.map;
    const managed = managedLayersRef.current;
    const pinnedArcLayers = pinnedLayers
      .map((pinned) => managed.get(pinned.layerId))
      .filter((layer): layer is Layer => !!layer);

    for (let i = pinnedArcLayers.length - 1; i >= 0; i -= 1) {
      map.reorder(pinnedArcLayers[i], map.layers.length - 1);
    }
  }, [pinnedLayers, viewRef, mapReady, managedLayersRef]);
}
