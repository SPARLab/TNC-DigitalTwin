// ============================================================================
// useMapLayers — Syncs LayerContext pinned/active layers with ArcGIS layers
// For iNaturalist: uses GraphicsLayer populated from locally-cached data.
// Taxon filtering toggles individual graphic visibility (instant, no network).
// Shows toast for unimplemented layers.
// ============================================================================

import { useEffect, useRef } from 'react';
import type Layer from '@arcgis/core/layers/Layer';
import GraphicsLayer from '@arcgis/core/layers/GraphicsLayer';
import { useLayers } from '../../context/LayerContext';
import { useMap } from '../../context/MapContext';
import { useINaturalistFilter } from '../../context/INaturalistFilterContext';
import { createMapLayer, IMPLEMENTED_LAYERS } from './layers';
import {
  populateINaturalistLayer,
  filterINaturalistLayer,
} from './layers/inaturalistLayer';

export function useMapLayers() {
  const { pinnedLayers, activeLayer } = useLayers();
  const { viewRef, mapReady, showToast } = useMap();
  const { selectedTaxa, allObservations, dataLoaded } = useINaturalistFilter();
  const managedLayersRef = useRef<Map<string, Layer>>(new Map());
  const warnedLayersRef = useRef<Set<string>>(new Set());
  const inatPopulatedRef = useRef(false);

  // Sync pinned layers → ArcGIS layers
  useEffect(() => {
    const view = viewRef.current;
    if (!view?.map) return;

    const map = view.map;
    const managed = managedLayersRef.current;
    const pinnedIds = new Set(pinnedLayers.map(p => p.layerId));

    // Remove layers for unpinned catalog layers
    for (const [layerId, arcLayer] of managed.entries()) {
      if (!pinnedIds.has(layerId)) {
        map.remove(arcLayer);
        managed.delete(layerId);
        warnedLayersRef.current.delete(layerId);
        if (layerId === 'inaturalist-obs') inatPopulatedRef.current = false;
      }
    }

    // Add layers for newly pinned catalog layers
    for (const pinned of pinnedLayers) {
      const { layerId } = pinned;
      if (managed.has(layerId)) continue;

      const arcLayer = createMapLayer(layerId, { visible: pinned.isVisible });

      if (!arcLayer) {
        if (!warnedLayersRef.current.has(layerId)) {
          warnedLayersRef.current.add(layerId);
          showToast(`"${pinned.name}" — layer not implemented yet`, 'warning');
        }
        continue;
      }

      map.add(arcLayer);
      managed.set(layerId, arcLayer);

      // If iNaturalist data is already loaded, populate immediately
      if (layerId === 'inaturalist-obs' && dataLoaded && arcLayer instanceof GraphicsLayer) {
        populateINaturalistLayer(arcLayer, allObservations);
        filterINaturalistLayer(arcLayer, selectedTaxa);
        inatPopulatedRef.current = true;
      }
    }
  }, [pinnedLayers, viewRef, mapReady, showToast, dataLoaded, allObservations, selectedTaxa]);

  // Sync visibility
  useEffect(() => {
    const managed = managedLayersRef.current;
    for (const pinned of pinnedLayers) {
      const arcLayer = managed.get(pinned.layerId);
      if (arcLayer) arcLayer.visible = pinned.isVisible;
    }
  }, [pinnedLayers]);

  // Toast for activating unimplemented layers (browsing, not pinned)
  useEffect(() => {
    if (!activeLayer) return;
    if (IMPLEMENTED_LAYERS.has(activeLayer.layerId)) return;
    if (pinnedLayers.some(p => p.layerId === activeLayer.layerId)) return;
    showToast(`"${activeLayer.name}" — map data not available yet`, 'info');
  }, [activeLayer?.layerId]); // eslint-disable-line react-hooks/exhaustive-deps

  // Populate iNaturalist GraphicsLayer when data arrives (after layer exists)
  useEffect(() => {
    if (!dataLoaded || inatPopulatedRef.current) return;
    const inatLayer = managedLayersRef.current.get('inaturalist-obs');
    if (!inatLayer || !(inatLayer instanceof GraphicsLayer)) return;

    populateINaturalistLayer(inatLayer, allObservations);
    filterINaturalistLayer(inatLayer, selectedTaxa);
    inatPopulatedRef.current = true;
  }, [dataLoaded, allObservations, mapReady, selectedTaxa]);

  // Update iNaturalist filter when selectedTaxa changes (instant local toggle)
  useEffect(() => {
    if (!inatPopulatedRef.current) return;
    const inatLayer = managedLayersRef.current.get('inaturalist-obs');
    if (!inatLayer || !(inatLayer instanceof GraphicsLayer)) return;
    filterINaturalistLayer(inatLayer, selectedTaxa);
  }, [selectedTaxa]);

  // Cleanup on unmount
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
