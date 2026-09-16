// ============================================================================
// useCatalogPreserveBoundaryBootstrap — on first catalog load, put the same
// preserve outline on the map as Live Monitoring and expand that dataset in
// the left sidebar (via activateLayer).
// ============================================================================

import { useEffect, useRef } from 'react';
import { useCatalog } from '../context/CatalogContext';
import { useLayers } from '../context/LayerContext';
import { useMap } from '../context/MapContext';
import { createPreserveOutlineLayer } from '../components/Monitoring/internal/boundaryOutlineLayer';
import { findPreserveBoundaryCatalogLayer } from '../utils/findPreserveBoundaryCatalogLayer';

export function useCatalogPreserveBoundaryBootstrap(): void {
  const { layerMap, loading } = useCatalog();
  const { activateLayer, activeLayer } = useLayers();
  const { viewRef, mapReady, viewMode } = useMap();
  const didActivateRef = useRef(false);

  // Same outline FeatureLayer used on the Live Monitoring map.
  useEffect(() => {
    const view = viewRef.current;
    if (!view || view.destroyed || mapReady === 0) return;

    const layer = createPreserveOutlineLayer();
    view.map?.add(layer);

    return () => {
      if (!view.destroyed) view.map?.remove(layer);
    };
  }, [mapReady, viewMode, viewRef]);

  // Expand the Boundaries category path to the catalog dataset once.
  useEffect(() => {
    if (loading || didActivateRef.current) return;

    const boundaryLayer = findPreserveBoundaryCatalogLayer(layerMap);
    if (!boundaryLayer) return;

    didActivateRef.current = true;
    // Only auto-select when nothing else is active yet (first visit).
    if (!activeLayer) {
      activateLayer(boundaryLayer.id);
    }

    window.setTimeout(() => {
      document
        .getElementById(`layer-row-${boundaryLayer.id}`)
        ?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }, 250);
  }, [loading, layerMap, activateLayer, activeLayer]);
}
