// ============================================================================
// useMapLayers — Syncs LayerContext pinned/active layers with ArcGIS layers.
// Generic: manages layer lifecycle (add/remove/visibility/z-order). All
// data-source-specific behavior (population, filtering, cache warming) is
// delegated to adapter hooks via the registry's useAllMapBehaviors.
//
// Layers are added to the map when PINNED or ACTIVE (whichever comes first).
//   - Pinned layers: visibility controlled by eye toggle (isVisible flag)
//   - Active-but-not-pinned: always visible (DFT-021)
//   - Removed from map when neither pinned nor active
// ============================================================================

import { useCallback, useEffect, useRef } from 'react';
import type Layer from '@arcgis/core/layers/Layer';
import { useLayers } from '../../context/LayerContext';
import { useMap } from '../../context/MapContext';
import { useCatalog } from '../../context/CatalogContext';
import { IMPLEMENTED_LAYERS } from './layers';
import { useAllMapBehaviors } from '../../dataSources/registry';
import { getConcreteActiveLayerId } from './mapLayers/internal/mapLayerSyncHelpers';
import { useMapLayerMembershipSync } from './mapLayers/internal/useMapLayerMembershipSync';
import { useMapLayerPresentationSync } from './mapLayers/internal/useMapLayerPresentationSync';

export function useMapLayers() {
  const { pinnedLayers, activeLayer, getLayerOpacity } = useLayers();
  const { viewRef, mapReady, showToast } = useMap();
  const { layerMap } = useCatalog();
  const managedLayersRef = useRef<Map<string, Layer>>(new Map());
  const warnedLayersRef = useRef<Set<string>>(new Set());
  const lastMapRef = useRef<__esri.Map | null>(null);
  const concreteActiveLayerId = getConcreteActiveLayerId(activeLayer, layerMap);
  const concreteActiveLayerName = concreteActiveLayerId
    ? (layerMap.get(concreteActiveLayerId)?.name ?? activeLayer?.name ?? 'Layer')
    : null;

  // Stable callback for adapter hooks to look up managed ArcGIS layers by ID
  const getManagedLayer = useCallback(
    (layerId: string) => managedLayersRef.current.get(layerId),
    [],
  );

  // ── Core effects (declared BEFORE adapter hooks — run order matters) ───────
  useMapLayerMembershipSync({
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
  });

  useMapLayerPresentationSync({
    pinnedLayers,
    concreteActiveLayerId,
    getLayerOpacity,
    layerMap,
    viewRef,
    mapReady,
    managedLayersRef,
  });

  // Toast for activating unimplemented layers (browsing, not yet pinned)
  useEffect(() => {
    if (!concreteActiveLayerId) return;
    if (IMPLEMENTED_LAYERS.has(concreteActiveLayerId)) return;
    // Only toast if not pinned (pinned layers toast in the add-layer effect)
    if (pinnedLayers.some(p => p.layerId === concreteActiveLayerId)) return;
    showToast(`"${concreteActiveLayerName ?? 'Layer'}" — map data not available yet`, 'info');
  }, [concreteActiveLayerId]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Adapter hooks (declared AFTER core effects — their effects fire later) ─

  useAllMapBehaviors(getManagedLayer, pinnedLayers, activeLayer, mapReady);

  // ── Cleanup on unmount ─────────────────────────────────────────────────────

  useEffect(() => {
    return () => {
      const view = viewRef.current;
      const managed = managedLayersRef.current;
      if (view?.map) {
        for (const arcLayer of managed.values()) view.map.remove(arcLayer);
      }
      managed.clear();
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
}
