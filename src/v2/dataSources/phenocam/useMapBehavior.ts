// ============================================================================
// PhenoCam Map Behavior — populate camera markers and open Browse on click.
// ============================================================================

import { useEffect, useRef } from 'react';
import GraphicsLayer from '@arcgis/core/layers/GraphicsLayer';
import Point from '@arcgis/core/geometry/Point';
import type Layer from '@arcgis/core/layers/Layer';
import { usePhenoCam } from '../../context/PhenoCamContext';
import { useCatalog } from '../../context/CatalogContext';
import { useLayers } from '../../context/LayerContext';
import { useMap } from '../../context/MapContext';
import {
  populatePhenoCamLayer,
  filterPhenoCamLayer,
} from '../../components/Map/layers/phenocamLayer';
import { registerPhenoCamLayerId, isPhenoCamLayer } from '../../components/Map/layers';
import { findPhenoCamLayerId } from '../../utils/phenocamCatalog';
import type { PinnedLayer, ActiveLayer } from '../../types';
import { goToMarkerWithSmartZoom } from '../../utils/mapMarkerNavigation';

export function usePhenoCamMapBehavior(
  getManagedLayer: (layerId: string) => Layer | undefined,
  pinnedLayers: PinnedLayer[],
  activeLayer: ActiveLayer | null,
  mapReady: number,
) {
  const {
    cameras,
    dataLoaded,
    warmCache,
    setSelectedCameraId,
  } = usePhenoCam();
  const { layerMap } = useCatalog();
  const { activateLayer, requestBrowseTab } = useLayers();
  const { viewRef, getSpatialPolygonForLayer, isSpatialQueryDrawing } = useMap();
  const populatedRef = useRef(false);
  const populatedLayerRef = useRef<GraphicsLayer | null>(null);

  for (const [layerId, layer] of layerMap.entries()) {
    if (layer.dataSource === 'phenocam') registerPhenoCamLayerId(layerId);
  }

  const LAYER_ID = (() => {
    if (activeLayer && (activeLayer.dataSource === 'phenocam' || isPhenoCamLayer(activeLayer.layerId))) {
      return activeLayer.layerId;
    }
    const pinned = pinnedLayers.find(
      (layer) => layerMap.get(layer.layerId)?.dataSource === 'phenocam' || isPhenoCamLayer(layer.layerId),
    );
    return pinned?.layerId ?? findPhenoCamLayerId(layerMap) ?? 'phenocam';
  })();
  const MAP_LAYER_ID = `v2-${LAYER_ID}`;
  const spatialPolygon = getSpatialPolygonForLayer(LAYER_ID);
  const isPinned = pinnedLayers.some((p) => p.layerId === LAYER_ID);
  const isActive = activeLayer?.layerId === LAYER_ID;
  const isOnMap = isPinned || isActive;

  useEffect(() => {
    if (isOnMap) warmCache();
  }, [isOnMap, warmCache]);

  useEffect(() => {
    if (!isOnMap) {
      populatedRef.current = false;
      populatedLayerRef.current = null;
    }
  }, [isOnMap]);

  useEffect(() => {
    if (!isOnMap || !dataLoaded) return;
    const arcLayer = getManagedLayer(LAYER_ID);
    if (!arcLayer || !(arcLayer instanceof GraphicsLayer)) return;

    populatePhenoCamLayer(arcLayer, cameras);
    filterPhenoCamLayer(arcLayer, spatialPolygon);
    populatedRef.current = true;
    populatedLayerRef.current = arcLayer;
  }, [
    isOnMap,
    dataLoaded,
    cameras,
    spatialPolygon,
    getManagedLayer,
    mapReady,
    LAYER_ID,
  ]);

  useEffect(() => {
    if (!isOnMap || !dataLoaded) return;
    const view = viewRef.current;
    if (!view) return;

    const handler = view.on('click', async (event) => {
      if (isSpatialQueryDrawing) return;
      try {
        const response = await view.hitTest(event);
        const graphicHit = response.results.find(
          (result) => result.type === 'graphic' && result.graphic.layer?.id === MAP_LAYER_ID,
        );
        if (!graphicHit || graphicHit.type !== 'graphic') return;

        const cameraId = Number(graphicHit.graphic.attributes?.id);
        if (!Number.isFinite(cameraId)) return;

        setSelectedCameraId(cameraId);
        activateLayer(LAYER_ID, undefined, cameraId);
        requestBrowseTab();

        const geometry = graphicHit.graphic.geometry;
        if (geometry?.type === 'point') {
          const point = geometry as Point;
          if (typeof point.longitude === 'number' && typeof point.latitude === 'number') {
            void goToMarkerWithSmartZoom({
              view,
              longitude: point.longitude,
              latitude: point.latitude,
              duration: 600,
            });
          }
        }
      } catch (error) {
        console.error('[PhenoCam Map Click] Error handling marker click', error);
      }
    });

    return () => handler.remove();
  }, [
    isOnMap,
    dataLoaded,
    viewRef,
    activateLayer,
    requestBrowseTab,
    setSelectedCameraId,
    mapReady,
    LAYER_ID,
    MAP_LAYER_ID,
    isSpatialQueryDrawing,
  ]);
}
