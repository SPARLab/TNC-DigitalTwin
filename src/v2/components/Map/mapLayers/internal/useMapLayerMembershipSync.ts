import { useEffect, type MutableRefObject } from 'react';
import type Layer from '@arcgis/core/layers/Layer';
import type MapView from '@arcgis/core/views/MapView';
import type SceneView from '@arcgis/core/views/SceneView';
import type { PinnedLayer } from '../../../../types';
import { createMapLayer } from '../../layers';

interface UseMapLayerMembershipSyncParams {
  pinnedLayers: PinnedLayer[];
  concreteActiveLayerId: string | null;
  concreteActiveLayerName: string | null;
  getLayerOpacity: (layerId: string) => number;
  viewRef: MutableRefObject<MapView | SceneView | null>;
  mapReady: number;
  showToast: (message: string, type?: 'info' | 'warning') => void;
  managedLayersRef: MutableRefObject<Map<string, Layer>>;
  warnedLayersRef: MutableRefObject<Set<string>>;
  lastMapRef: MutableRefObject<__esri.Map | null>;
}

export function useMapLayerMembershipSync({
  pinnedLayers,
  concreteActiveLayerId,
  concreteActiveLayerName,
  getLayerOpacity,
  viewRef,
  mapReady,
  showToast,
  managedLayersRef,
  warnedLayersRef,
  lastMapRef,
}: UseMapLayerMembershipSyncParams) {
  useEffect(() => {
    const view = viewRef.current;
    if (!view?.map) return;

    const map = view.map;
    if (map !== lastMapRef.current) {
      managedLayersRef.current.clear();
      warnedLayersRef.current.clear();
      lastMapRef.current = map;
    }

    const managed = managedLayersRef.current;
    const pinnedByLayerId = new Map(pinnedLayers.map((pinned) => [pinned.layerId, pinned]));
    const shouldBeOnMap = new Map<string, { name: string; visible: boolean }>();

    for (const pinned of pinnedLayers) {
      shouldBeOnMap.set(pinned.layerId, { name: pinned.name, visible: pinned.isVisible });
    }

    if (concreteActiveLayerId && concreteActiveLayerName && !shouldBeOnMap.has(concreteActiveLayerId)) {
      shouldBeOnMap.set(concreteActiveLayerId, { name: concreteActiveLayerName, visible: true });
    }

    for (const [layerId, arcLayer] of managed.entries()) {
      if (!shouldBeOnMap.has(layerId)) {
        map.remove(arcLayer);
        managed.delete(layerId);
        warnedLayersRef.current.delete(layerId);
      }
    }

    for (const [layerId, { name, visible }] of shouldBeOnMap.entries()) {
      if (managed.has(layerId)) continue;

      const tncWhereClause = pinnedByLayerId.get(layerId)?.tncArcgisFilters?.whereClause;
      const pinnedOpacity = pinnedByLayerId.get(layerId)?.opacity;
      const layerOpacity = typeof pinnedOpacity === 'number' ? pinnedOpacity : getLayerOpacity(layerId);
      const arcLayer = createMapLayer(layerId, {
        visible,
        whereClause: tncWhereClause,
      });

      if (!arcLayer) {
        if (!warnedLayersRef.current.has(layerId)) {
          warnedLayersRef.current.add(layerId);
          showToast(`"${name}" — layer not implemented yet`, 'warning');
        }
        continue;
      }

      arcLayer.opacity = Math.min(1, Math.max(0, layerOpacity));
      map.add(arcLayer);
      managed.set(layerId, arcLayer);
    }
  }, [
    pinnedLayers,
    concreteActiveLayerId,
    concreteActiveLayerName,
    getLayerOpacity,
    viewRef,
    mapReady,
    showToast,
    managedLayersRef,
    warnedLayersRef,
    lastMapRef,
  ]);
}
