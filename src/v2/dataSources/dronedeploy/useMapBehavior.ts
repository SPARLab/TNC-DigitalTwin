import { useEffect, useRef } from 'react';
import Extent from '@arcgis/core/geometry/Extent';
import GroupLayer from '@arcgis/core/layers/GroupLayer';
import type Layer from '@arcgis/core/layers/Layer';
import WMTSLayer from '@arcgis/core/layers/WMTSLayer';
import type MapView from '@arcgis/core/views/MapView';
import { useLayers } from '../../context/LayerContext';
import { useMap } from '../../context/MapContext';
import { useDroneDeploy } from '../../context/DroneDeployContext';
import type { PinnedLayer, ActiveLayer } from '../../types';

const LAYER_ID = 'dataset-193';
const PORTAL_URL = 'https://dangermondpreserve-spatial.com/portal';

function extentFromRings(rings?: number[][][]): Extent | null {
  if (!rings?.[0]?.length) return null;
  const points = rings[0];
  const xs = points.map((point) => point[0]);
  const ys = points.map((point) => point[1]);
  return new Extent({
    xmin: Math.min(...xs),
    ymin: Math.min(...ys),
    xmax: Math.max(...xs),
    ymax: Math.max(...ys),
    spatialReference: { wkid: 4326 },
  });
}

function pickDefaultFlightIdForProject(projects: ReturnType<typeof useDroneDeploy>['projects']): number | null {
  for (const project of projects) {
    for (let i = project.imageryLayers.length - 1; i >= 0; i -= 1) {
      const flight = project.imageryLayers[i];
      if (flight.wmts.itemId.trim().length > 0) return flight.id;
    }
  }
  const fallback = projects[0]?.imageryLayers[projects[0].imageryLayers.length - 1] ?? projects[0]?.imageryLayers[0];
  return fallback?.id ?? null;
}

async function flyToFlightExtent(view: MapView, rings?: number[][][]): Promise<void> {
  const extent = extentFromRings(rings);
  if (!extent) return;
  await view.goTo(extent.expand(1.25), { duration: 700 });
}

export function useDroneDeployMapBehavior(
  getManagedLayer: (layerId: string) => Layer | undefined,
  pinnedLayers: PinnedLayer[],
  activeLayer: ActiveLayer | null,
  mapReady: number
) {
  const {
    warmCache,
    dataLoaded,
    projects,
    loadedFlightIds,
    opacityByFlightId,
    selectedFlightId,
    setSelectedFlightId,
    getFlightById,
    flyToFlightId,
    clearFlyToRequest,
    setFlightLoaded,
    setFlightLoading,
    requestFlyToFlight,
  } = useDroneDeploy();
  const { activateLayer } = useLayers();
  const { viewRef, showToast } = useMap();
  const loadedArcLayersRef = useRef<Map<number, WMTSLayer>>(new Map());
  const isHandlingMapReadyRef = useRef(false);
  const lastRequestedFlyToFlightIdRef = useRef<number | null>(null);

  const isPinned = pinnedLayers.some((layer) => layer.layerId === LAYER_ID);
  const isActive = activeLayer?.layerId === LAYER_ID;
  const isOnMap = isPinned || isActive;
  const activeFlightId = isActive && typeof activeLayer?.featureId === 'number'
    ? activeLayer.featureId
    : null;
  const pinnedDroneLayer = pinnedLayers.find((layer) => layer.layerId === LAYER_ID);
  const pinnedViews = pinnedDroneLayer?.views ?? [];
  const visiblePinnedFlightIds = pinnedViews
    .filter((view) => view.isVisible)
    .map((view) => view.droneView?.flightId)
    .filter((flightId): flightId is number => typeof flightId === 'number');

  useEffect(() => {
    if (isOnMap) warmCache();
  }, [isOnMap, warmCache]);

  // Keep the context's selected flight synchronized with active layer selection
  // so sidebar and map carousel remain in lockstep.
  useEffect(() => {
    if (!isOnMap) {
      return;
    }
    if (activeFlightId != null) {
      setSelectedFlightId(activeFlightId);
      if (lastRequestedFlyToFlightIdRef.current !== activeFlightId) {
        requestFlyToFlight(activeFlightId);
        lastRequestedFlyToFlightIdRef.current = activeFlightId;
      }
      return;
    }
    if (selectedFlightId != null) return;
    if (visiblePinnedFlightIds.length > 0) {
      const pinnedFlightId = visiblePinnedFlightIds[0];
      const pinnedViewId = pinnedViews.find((view) => view.droneView?.flightId === pinnedFlightId)?.id;
      setSelectedFlightId(pinnedFlightId);
      activateLayer(LAYER_ID, pinnedViewId ?? activeLayer?.viewId, pinnedFlightId);
      if (lastRequestedFlyToFlightIdRef.current !== pinnedFlightId) {
        requestFlyToFlight(pinnedFlightId);
        lastRequestedFlyToFlightIdRef.current = pinnedFlightId;
      }
      return;
    }
    const defaultFlightId = pickDefaultFlightIdForProject(projects);
    if (defaultFlightId != null) {
      const firstPinnedViewId = pinnedViews.find((view) => view.droneView?.flightId === defaultFlightId)?.id;
      setSelectedFlightId(defaultFlightId);
      activateLayer(LAYER_ID, firstPinnedViewId, defaultFlightId);
      requestFlyToFlight(defaultFlightId);
      lastRequestedFlyToFlightIdRef.current = defaultFlightId;
      return;
    }
    if (loadedFlightIds.length > 0) {
      setSelectedFlightId(loadedFlightIds[0]);
      if (lastRequestedFlyToFlightIdRef.current !== loadedFlightIds[0]) {
        requestFlyToFlight(loadedFlightIds[0]);
        lastRequestedFlyToFlightIdRef.current = loadedFlightIds[0];
      }
    }
  }, [
    isOnMap,
    activeFlightId,
    selectedFlightId,
    setSelectedFlightId,
    loadedFlightIds,
    projects,
    visiblePinnedFlightIds,
    activeLayer?.viewId,
    activateLayer,
    requestFlyToFlight,
  ]);

  useEffect(() => {
    if (!isOnMap) {
      for (const flightId of loadedArcLayersRef.current.keys()) {
        setFlightLoading(flightId, false);
      }
      loadedArcLayersRef.current.clear();
      return;
    }
    const parent = getManagedLayer(LAYER_ID);
    if (!parent || !(parent instanceof GroupLayer)) return;

    const byFlightId = loadedArcLayersRef.current;
    const desiredFlightIds = loadedFlightIds;
    const desired = new Set<number>(desiredFlightIds);

    for (const [flightId, wmtsLayer] of byFlightId) {
      if (desired.has(flightId)) continue;
      parent.remove(wmtsLayer);
      byFlightId.delete(flightId);
      setFlightLoading(flightId, false);
    }

    for (const flightId of desired) {
      if (byFlightId.has(flightId)) {
        const layer = byFlightId.get(flightId);
        if (layer) layer.opacity = opacityByFlightId[flightId] ?? 0.8;
        continue;
      }

      const flight = getFlightById(flightId);
      if (!flight) continue;

      const wmtsLayer = new WMTSLayer({
        id: `v2-drone-wmts-${flight.id}`,
        title: flight.planName,
        opacity: opacityByFlightId[flight.id] ?? 0.8,
        portalItem: {
          id: flight.wmts.itemId,
          portal: { url: PORTAL_URL },
        },
      });

      parent.add(wmtsLayer);
      byFlightId.set(flight.id, wmtsLayer);
      setFlightLoading(flight.id, true);

      void wmtsLayer.when().then(() => {
        setFlightLoading(flight.id, false);
        if (isHandlingMapReadyRef.current) return;
        if (flyToFlightId === flight.id && viewRef.current) {
          void flyToFlightExtent(viewRef.current, flight.planGeometry ?? undefined);
          clearFlyToRequest();
        }
      }).catch((error) => {
        parent.remove(wmtsLayer);
        byFlightId.delete(flight.id);
        setFlightLoading(flight.id, false);
        setFlightLoaded(flight.id, false);
        console.error('[DroneDeploy Map] Failed to load WMTS layer', error);
        showToast(`Failed to load "${flight.planName}"`, 'warning');
      });
    }

    // Keep drawing order stable for overlapping imagery.
    // `loadedFlightIds` is treated as top -> bottom in UI, so reverse for ArcGIS index order.
    for (let uiIndex = desiredFlightIds.length - 1; uiIndex >= 0; uiIndex -= 1) {
      const flightId = desiredFlightIds[uiIndex];
      const layer = byFlightId.get(flightId);
      if (!layer) continue;
      const arcgisIndex = desiredFlightIds.length - 1 - uiIndex;
      parent.reorder(layer, arcgisIndex);
    }
  }, [
    isOnMap,
    selectedFlightId,
    loadedFlightIds,
    opacityByFlightId,
    getFlightById,
    getManagedLayer,
    showToast,
    flyToFlightId,
    clearFlyToRequest,
    setFlightLoaded,
    setFlightLoading,
    viewRef,
    mapReady,
    dataLoaded,
    visiblePinnedFlightIds,
  ]);

  useEffect(() => {
    const view = viewRef.current;
    if (!view || flyToFlightId == null) return;
    const flight = getFlightById(flyToFlightId);
    if (!flight) return;
    const matchingViewId = pinnedViews.find((savedView) => savedView.droneView?.flightId === flight.id)?.id;
    activateLayer(LAYER_ID, matchingViewId, flight.id);
    isHandlingMapReadyRef.current = true;
    void flyToFlightExtent(view, flight.planGeometry ?? undefined)
      .finally(() => {
        isHandlingMapReadyRef.current = false;
        clearFlyToRequest();
      });
  }, [flyToFlightId, getFlightById, viewRef, activateLayer, clearFlyToRequest, pinnedViews]);
}
