// ============================================================================
// ANiML Map Behavior — Manages GraphicsLayer population & filtering.
// Extracted from useMapLayers to keep core map logic data-source-agnostic.
//
// Layer is "on map" when PINNED or ACTIVE (whichever comes first).
// Cache warms on first appearance. Data persists across activate/deactivate.
// Called unconditionally by useAllMapBehaviors (React hooks rules).
// ============================================================================

import { useEffect, useRef } from 'react';
import GraphicsLayer from '@arcgis/core/layers/GraphicsLayer';
import type Layer from '@arcgis/core/layers/Layer';
import Point from '@arcgis/core/geometry/Point';
import { useAnimlFilter } from '../../context/AnimlFilterContext';
import { useCatalog } from '../../context/CatalogContext';
import { useLayers } from '../../context/LayerContext';
import { useMap } from '../../context/MapContext';
import {
  populateAnimlLayer,
  filterAnimlLayer,
  updateAnimlCameraBadges,
  getAnimlCameraGraphicByDeploymentId,
} from '../../components/Map/layers/animlLayer';
import { registerAnimlLayerId, isAnimlLayer } from '../../components/Map/layers';
import { findAnimlLayerId } from '../../utils/animlCatalog';
import type { PinnedLayer, ActiveLayer } from '../../types';
import { goToMarkerWithSmartZoom } from '../../utils/mapMarkerNavigation';

export function useAnimlMapBehavior(
  getManagedLayer: (layerId: string) => Layer | undefined,
  pinnedLayers: PinnedLayer[],
  activeLayer: ActiveLayer | null,
  mapReady: number,
) {
  const {
    selectedAnimals,
    selectedCameras,
    hasCameraFilter,
    hasAnyFilter,
    getFilteredCountForDeployment,
    deployments,
    dataLoaded,
    warmCache,
    focusedDeploymentId,
  } = useAnimlFilter();
  const { layerMap } = useCatalog();
  const { activateLayer } = useLayers();
  const { viewRef, viewMode, getSpatialPolygonForLayer } = useMap();
  const populatedRef = useRef(false);
  const populatedLayerRef = useRef<GraphicsLayer | null>(null);
  const highlightHandleRef = useRef<__esri.Handle | null>(null);

  for (const [layerId, layer] of layerMap.entries()) {
    if (layer.dataSource === 'animl') registerAnimlLayerId(layerId);
  }

  const LAYER_ID = (() => {
    if (activeLayer && (activeLayer.dataSource === 'animl' || isAnimlLayer(activeLayer.layerId))) {
      return activeLayer.layerId;
    }
    const pinned = pinnedLayers.find(
      (layer) => layerMap.get(layer.layerId)?.dataSource === 'animl' || isAnimlLayer(layer.layerId),
    );
    return pinned?.layerId ?? findAnimlLayerId(layerMap) ?? 'dataset-217';
  })();
  const MAP_LAYER_ID = `v2-${LAYER_ID}`;
  const spatialPolygon = getSpatialPolygonForLayer(LAYER_ID);
  const shouldShowBadges = hasAnyFilter && !(!!spatialPolygon && selectedAnimals.size === 0);

  const isPinned = pinnedLayers.some(p => p.layerId === LAYER_ID);
  const isActive = activeLayer?.layerId === LAYER_ID;
  const isOnMap = isPinned || isActive;

  // Warm cache when layer first appears on map (pinned OR activated)
  useEffect(() => {
    if (isOnMap) warmCache();
  }, [isOnMap, warmCache]);

  // Reset populated flag when layer is removed from map entirely
  useEffect(() => {
    if (!isOnMap) {
      populatedRef.current = false;
      populatedLayerRef.current = null;
      highlightHandleRef.current?.remove();
      highlightHandleRef.current = null;
    }
  }, [isOnMap]);

  // Populate GraphicsLayer when data arrives AND layer exists on map.
  useEffect(() => {
    if (!isOnMap || !dataLoaded) return;
    const arcLayer = getManagedLayer(LAYER_ID);
    if (!arcLayer || !(arcLayer instanceof GraphicsLayer)) return;
    const hasMapSwapLayerReplacement = populatedLayerRef.current !== arcLayer;
    if (populatedRef.current && !hasMapSwapLayerReplacement) return;

    populateAnimlLayer(arcLayer, deployments, { viewMode });
    filterAnimlLayer(arcLayer, selectedAnimals, undefined, spatialPolygon);
    updateAnimlCameraBadges(arcLayer, {
      hasActiveFilter: shouldShowBadges,
      getCountForDeployment: (deploymentId) => {
        // Camera filter narrows the query to selected cameras only.
        if (hasCameraFilter && !selectedCameras.has(deploymentId)) return 0;
        return getFilteredCountForDeployment(deploymentId);
      },
      viewMode,
    });
    populatedRef.current = true;
    populatedLayerRef.current = arcLayer;
  }, [
    isOnMap,
    dataLoaded,
    deployments,
    selectedAnimals,
    hasAnyFilter,
    shouldShowBadges,
    hasCameraFilter,
    selectedCameras,
    getFilteredCountForDeployment,
    spatialPolygon,
    getManagedLayer,
    mapReady,
    viewMode,
    LAYER_ID,
  ]);

  // Update filter when selectedAnimals changes (instant local visibility toggle)
  useEffect(() => {
    if (!populatedRef.current) return;
    const arcLayer = getManagedLayer(LAYER_ID);
    if (!arcLayer || !(arcLayer instanceof GraphicsLayer)) return;
    filterAnimlLayer(arcLayer, selectedAnimals, undefined, spatialPolygon);
  }, [selectedAnimals, spatialPolygon, getManagedLayer, LAYER_ID]);

  // Update map badges whenever filter state changes.
  useEffect(() => {
    if (!populatedRef.current) return;
    const arcLayer = getManagedLayer(LAYER_ID);
    if (!arcLayer || !(arcLayer instanceof GraphicsLayer)) return;

    updateAnimlCameraBadges(arcLayer, {
      hasActiveFilter: shouldShowBadges,
      getCountForDeployment: (deploymentId) => {
        if (hasCameraFilter && !selectedCameras.has(deploymentId)) return 0;
        return getFilteredCountForDeployment(deploymentId);
      },
      viewMode,
    });
  }, [
    shouldShowBadges,
    hasCameraFilter,
    selectedCameras,
    getFilteredCountForDeployment,
    getManagedLayer,
    viewMode,
    LAYER_ID,
  ]);

  // Map click handler: clicking a camera marker opens ANiML browse for that camera.
  useEffect(() => {
    if (!isOnMap || !dataLoaded) return;
    const view = viewRef.current;
    if (!view) return;

    const handler = view.on('click', async (event) => {
      try {
        const response = await view.hitTest(event);
        const graphicHit = response.results.find(
          (result) => result.type === 'graphic' && result.graphic.layer?.id === MAP_LAYER_ID,
        );
        if (!graphicHit || graphicHit.type !== 'graphic') return;

        const deploymentId = Number(graphicHit.graphic.attributes?.id);
        if (!Number.isFinite(deploymentId)) return;

        activateLayer(LAYER_ID, undefined, deploymentId);

        const geometry = graphicHit.graphic.geometry;
        if (geometry?.type === 'point') {
          const point = geometry as Point;
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
      } catch (error) {
        console.error('[ANiML Map Click] Error handling marker click:', error);
      }
    });

    return () => handler.remove();
  }, [isOnMap, dataLoaded, viewRef, activateLayer, mapReady, LAYER_ID, MAP_LAYER_ID]);

  // Native ArcGIS highlight for camera selected from image interactions.
  useEffect(() => {
    let cancelled = false;
    const view = viewRef.current;
    if (!view || !isOnMap || !populatedRef.current) return;

    const arcLayer = getManagedLayer(LAYER_ID);
    if (!arcLayer || !(arcLayer instanceof GraphicsLayer)) return;

    // Always clear old handle first so only one camera is highlighted.
    highlightHandleRef.current?.remove();
    highlightHandleRef.current = null;

    if (focusedDeploymentId === null) return;
    const targetGraphic = getAnimlCameraGraphicByDeploymentId(arcLayer, focusedDeploymentId);
    if (!targetGraphic) return;

    view.whenLayerView(arcLayer).then(layerView => {
      if (cancelled) return;
      highlightHandleRef.current = layerView.highlight(targetGraphic);
    }).catch(() => {
      // Swallow layerView lifecycle errors; next focus event will retry.
    });

    return () => {
      cancelled = true;
    };
  }, [focusedDeploymentId, isOnMap, getManagedLayer, viewRef, mapReady, LAYER_ID]);
}
