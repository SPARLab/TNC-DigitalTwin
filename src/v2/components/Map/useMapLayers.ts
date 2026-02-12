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

import { useEffect, useRef, useCallback } from 'react';
import type Layer from '@arcgis/core/layers/Layer';
import { useLayers } from '../../context/LayerContext';
import { useMap } from '../../context/MapContext';
import { createMapLayer, IMPLEMENTED_LAYERS } from './layers';
import { useAllMapBehaviors } from '../../dataSources/registry';

export function useMapLayers() {
  const { pinnedLayers, activeLayer } = useLayers();
  const { viewRef, mapReady, showToast } = useMap();
  const managedLayersRef = useRef<Map<string, Layer>>(new Map());
  const warnedLayersRef = useRef<Set<string>>(new Set());

  // Stable callback for adapter hooks to look up managed ArcGIS layers by ID
  const getManagedLayer = useCallback(
    (layerId: string) => managedLayersRef.current.get(layerId),
    [],
  );

  // ── Core effects (declared BEFORE adapter hooks — run order matters) ───────

  // Sync layers on map: pinned layers + active layer (if not already pinned)
  useEffect(() => {
    const view = viewRef.current;
    if (!view?.map) return;

    const map = view.map;
    const managed = managedLayersRef.current;

    // Build map of layerIds that should currently be on the ArcGIS map
    const shouldBeOnMap = new Map<string, { name: string; visible: boolean }>();
    for (const p of pinnedLayers) {
      shouldBeOnMap.set(p.layerId, { name: p.name, visible: p.isVisible });
    }
    // Active but not pinned → always visible (DFT-021: clicking makes active AND visible)
    if (activeLayer && !shouldBeOnMap.has(activeLayer.layerId)) {
      shouldBeOnMap.set(activeLayer.layerId, { name: activeLayer.name, visible: true });
    }

    // Remove layers that should no longer be on the map
    for (const [layerId, arcLayer] of managed.entries()) {
      if (!shouldBeOnMap.has(layerId)) {
        map.remove(arcLayer);
        managed.delete(layerId);
        warnedLayersRef.current.delete(layerId);
      }
    }

    // Add layers that should be on the map but aren't yet
    for (const [layerId, { name, visible }] of shouldBeOnMap) {
      if (managed.has(layerId)) continue;

      const arcLayer = createMapLayer(layerId, { visible });

      if (!arcLayer) {
        if (!warnedLayersRef.current.has(layerId)) {
          warnedLayersRef.current.add(layerId);
          showToast(`"${name}" — layer not implemented yet`, 'warning');
        }
        continue;
      }

      map.add(arcLayer);
      managed.set(layerId, arcLayer);
    }
  }, [pinnedLayers, activeLayer, viewRef, mapReady, showToast]);

  // Sync visibility: pinned layers use eye toggle; active-only always visible
  useEffect(() => {
    const managed = managedLayersRef.current;
    for (const pinned of pinnedLayers) {
      const arcLayer = managed.get(pinned.layerId);
      if (arcLayer) arcLayer.visible = pinned.isVisible;
    }
    // Active but not pinned: ensure visible
    if (activeLayer) {
      const isPinned = pinnedLayers.some(p => p.layerId === activeLayer.layerId);
      if (!isPinned) {
        const arcLayer = managed.get(activeLayer.layerId);
        if (arcLayer) arcLayer.visible = true;
      }
    }
  }, [pinnedLayers, activeLayer]);

  // Toast for activating unimplemented layers (browsing, not yet pinned)
  useEffect(() => {
    if (!activeLayer) return;
    if (IMPLEMENTED_LAYERS.has(activeLayer.layerId)) return;
    // Only toast if not pinned (pinned layers toast in the add-layer effect)
    if (pinnedLayers.some(p => p.layerId === activeLayer.layerId)) return;
    showToast(`"${activeLayer.name}" — map data not available yet`, 'info');
  }, [activeLayer?.layerId]); // eslint-disable-line react-hooks/exhaustive-deps

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
