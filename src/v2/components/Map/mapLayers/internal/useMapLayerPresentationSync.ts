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
    const isActivePinned = !!concreteActiveLayerId
      && pinnedLayers.some((pinned) => pinned.layerId === concreteActiveLayerId);
    const desiredTopToBottomIds: string[] = [];

    if (concreteActiveLayerId && !isActivePinned) {
      desiredTopToBottomIds.push(concreteActiveLayerId);
    }
    desiredTopToBottomIds.push(...pinnedLayers.map((pinned) => pinned.layerId));

    const desiredTopToBottomLayers = desiredTopToBottomIds
      .map((layerId) => managed.get(layerId))
      .filter((layer): layer is Layer => !!layer);

    // ArcGIS draws highest-index layers on top. Move bottom->top entries to top
    // in sequence so final draw order matches the widget's top->bottom order.
    for (let i = desiredTopToBottomLayers.length - 1; i >= 0; i -= 1) {
      map.reorder(desiredTopToBottomLayers[i], map.layers.length - 1);
    }
  }, [pinnedLayers, concreteActiveLayerId, viewRef, mapReady, managedLayersRef]);
}
