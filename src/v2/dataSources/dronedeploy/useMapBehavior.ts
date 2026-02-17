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
    loadedFlightIds,
    opacityByFlightId,
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
  const lastAutoLoadedFlightIdRef = useRef<number | null>(null);

  const isPinned = pinnedLayers.some((layer) => layer.layerId === LAYER_ID);
  const isActive = activeLayer?.layerId === LAYER_ID;
  const isOnMap = isPinned || isActive;
  const activeFlightId = isActive && typeof activeLayer?.featureId === 'number'
    ? activeLayer.featureId
    : null;

  useEffect(() => {
    if (isOnMap) warmCache();
  }, [isOnMap, warmCache]);

  // Left-sidebar project selection sets active featureId to that project's first flight.
  // Auto-load that flight onto the map and fly to it once so selection feels immediate.
  useEffect(() => {
    if (!isOnMap || activeFlightId == null) {
      lastAutoLoadedFlightIdRef.current = null;
      return;
    }
    if (lastAutoLoadedFlightIdRef.current === activeFlightId) return;

    const selectedFlight = getFlightById(activeFlightId);
    if (!selectedFlight) return;

    lastAutoLoadedFlightIdRef.current = activeFlightId;
    setFlightLoaded(activeFlightId, true);
    requestFlyToFlight(activeFlightId);
  }, [isOnMap, activeFlightId, getFlightById, setFlightLoaded, requestFlyToFlight]);

  useEffect(() => {
    if (!isOnMap) {
      loadedArcLayersRef.current.clear();
      return;
    }
    const parent = getManagedLayer(LAYER_ID);
    if (!parent || !(parent instanceof GroupLayer)) return;

    const byFlightId = loadedArcLayersRef.current;
    const desired = new Set(loadedFlightIds);

    for (const [flightId, wmtsLayer] of byFlightId) {
      if (desired.has(flightId)) continue;
      parent.remove(wmtsLayer);
      byFlightId.delete(flightId);
    }

    for (const flightId of loadedFlightIds) {
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
        showToast(`Loaded "${flight.planName}"`, 'info');
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
