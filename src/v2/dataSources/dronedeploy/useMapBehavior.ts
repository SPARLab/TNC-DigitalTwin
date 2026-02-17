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
    if (projects.length > 0 && projects[0].imageryLayers.length > 0) {
      const firstFlightId = projects[0].imageryLayers[0].id;
      setSelectedFlightId(firstFlightId);
      activateLayer(LAYER_ID, undefined, firstFlightId);
      requestFlyToFlight(firstFlightId);
      lastRequestedFlyToFlightIdRef.current = firstFlightId;
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
    activateLayer,
    requestFlyToFlight,
  ]);

  useEffect(() => {
    if (!isOnMap) {
      loadedArcLayersRef.current.clear();
      return;
    }
    const parent = getManagedLayer(LAYER_ID);
    if (!parent || !(parent instanceof GroupLayer)) return;

    const byFlightId = loadedArcLayersRef.current;
    const desired = new Set<number>(loadedFlightIds);
    if (selectedFlightId != null) {
      desired.add(selectedFlightId);
    }

    for (const [flightId, wmtsLayer] of byFlightId) {
      if (desired.has(flightId)) continue;
      parent.remove(wmtsLayer);
      byFlightId.delete(flightId);
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

      void wmtsLayer.when().then(() => {
        if (isHandlingMapReadyRef.current) return;
        if (flyToFlightId === flight.id && viewRef.current) {
          void flyToFlightExtent(viewRef.current, flight.planGeometry ?? undefined);
          clearFlyToRequest();
        }
      }).catch((error) => {
        parent.remove(wmtsLayer);
        byFlightId.delete(flight.id);
        setFlightLoaded(flight.id, false);
        console.error('[DroneDeploy Map] Failed to load WMTS layer', error);
        showToast(`Failed to load "${flight.planName}"`, 'warning');
      });
    }
  }, [
    isOnMap,
    loadedFlightIds,
    selectedFlightId,
    opacityByFlightId,
    getFlightById,
    getManagedLayer,
    showToast,
    flyToFlightId,
    clearFlyToRequest,
    setFlightLoaded,
    viewRef,
    mapReady,
    dataLoaded,
  ]);

  useEffect(() => {
    const view = viewRef.current;
    if (!view || flyToFlightId == null) return;
    const flight = getFlightById(flyToFlightId);
    if (!flight) return;
    activateLayer(LAYER_ID, undefined, flight.id);
    isHandlingMapReadyRef.current = true;
    void flyToFlightExtent(view, flight.planGeometry ?? undefined)
      .finally(() => {
        isHandlingMapReadyRef.current = false;
        clearFlyToRequest();
      });
  }, [flyToFlightId, getFlightById, viewRef, activateLayer, clearFlyToRequest]);
}
