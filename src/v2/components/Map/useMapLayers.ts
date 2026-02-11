// ============================================================================
// useMapLayers — Syncs LayerContext pinned/active layers with ArcGIS layers
// Adds FeatureLayers when layers are pinned, removes on unpin.
// Shows toast for unimplemented layers.
// ============================================================================

import { useEffect, useRef } from 'react';
import FeatureLayer from '@arcgis/core/layers/FeatureLayer';
import GeoJSONLayer from '@arcgis/core/layers/GeoJSONLayer';
import { useLayers } from '../../context/LayerContext';
import { useMap } from '../../context/MapContext';
import { getLayerConfig, IMPLEMENTED_LAYERS } from './layerConfigs';

/** Track which ArcGIS layers we've added to avoid duplicates */
type ManagedLayer = FeatureLayer | GeoJSONLayer;

export function useMapLayers() {
  const { pinnedLayers, activeLayer } = useLayers();
  const { viewRef, mapReady, showToast } = useMap();
  const managedLayersRef = useRef<Map<string, ManagedLayer>>(new Map());
  const warnedLayersRef = useRef<Set<string>>(new Set());

  // Sync pinned layers → ArcGIS layers
  useEffect(() => {
    const view = viewRef.current;
    if (!view?.map) return;

    const map = view.map;
    const managed = managedLayersRef.current;
    const pinnedIds = new Set(pinnedLayers.map(p => p.layerId));

    // Remove ArcGIS layers for unpinned catalog layers
    for (const [layerId, arcLayer] of managed.entries()) {
      if (!pinnedIds.has(layerId)) {
        map.remove(arcLayer);
        managed.delete(layerId);
        warnedLayersRef.current.delete(layerId);
      }
    }

    // Add ArcGIS layers for newly pinned catalog layers
    for (const pinned of pinnedLayers) {
      const { layerId } = pinned;

      // Skip if already managed
      if (managed.has(layerId)) continue;

      const config = getLayerConfig(layerId);

      if (!config) {
        // Not implemented — show warning once per layer
        if (!warnedLayersRef.current.has(layerId)) {
          warnedLayersRef.current.add(layerId);
          showToast(`"${pinned.name}" — layer not implemented yet`, 'warning');
        }
        continue;
      }

      // Create the ArcGIS layer
      let arcLayer: ManagedLayer;

      if (config.type === 'feature') {
        arcLayer = new FeatureLayer({
          url: config.url,
          id: `v2-${layerId}`,
          visible: pinned.isVisible,
          renderer: config.renderer as __esri.Renderer,
          popupEnabled: config.popupEnabled ?? true,
          popupTemplate: config.popupTemplate as __esri.PopupTemplate,
          opacity: config.opacity ?? 1,
        });
      } else {
        arcLayer = new GeoJSONLayer({
          url: config.url,
          id: `v2-${layerId}`,
          visible: pinned.isVisible,
          renderer: config.renderer as __esri.Renderer,
          popupEnabled: config.popupEnabled ?? false,
        });
      }

      map.add(arcLayer);
      managed.set(layerId, arcLayer);
    }
  }, [pinnedLayers, viewRef, mapReady, showToast]);

  // Sync visibility changes
  useEffect(() => {
    const managed = managedLayersRef.current;
    for (const pinned of pinnedLayers) {
      const arcLayer = managed.get(pinned.layerId);
      if (arcLayer) {
        arcLayer.visible = pinned.isVisible;
      }
    }
  }, [pinnedLayers]);

  // Show toast when activating unimplemented layers (not pinned, just browsing)
  useEffect(() => {
    if (!activeLayer) return;
    if (IMPLEMENTED_LAYERS.has(activeLayer.layerId)) return;
    // Only warn if not already pinned (pinned layers warn on pin)
    const isPinned = pinnedLayers.some(p => p.layerId === activeLayer.layerId);
    if (isPinned) return;

    showToast(`"${activeLayer.name}" — map data not available yet`, 'info');
  }, [activeLayer?.layerId]); // eslint-disable-line react-hooks/exhaustive-deps

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      const view = viewRef.current;
      const managed = managedLayersRef.current;
      if (view?.map) {
        for (const arcLayer of managed.values()) {
          view.map.remove(arcLayer);
        }
      }
      managed.clear();
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
}
