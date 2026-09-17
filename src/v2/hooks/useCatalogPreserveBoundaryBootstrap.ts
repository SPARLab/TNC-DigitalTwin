// ============================================================================
// useCatalogPreserveBoundaryBootstrap — on first catalog load, pin the preserve
// boundary like any other layer (same pin/active visibility rules) and expand
// it in the left sidebar.
// ============================================================================

import { useEffect, useRef } from 'react';
import { useCatalog } from '../context/CatalogContext';
import { useLayers } from '../context/LayerContext';
import { findPreserveBoundaryCatalogLayer } from '../utils/findPreserveBoundaryCatalogLayer';

export function useCatalogPreserveBoundaryBootstrap(): void {
  const { layerMap, loading } = useCatalog();
  const { activateLayer, pinLayer, activeLayer, isLayerPinned } = useLayers();
  const didBootstrapRef = useRef(false);

  useEffect(() => {
    if (loading || didBootstrapRef.current) return;

    const boundaryLayer = findPreserveBoundaryCatalogLayer(layerMap);
    if (!boundaryLayer) return;

    didBootstrapRef.current = true;

    if (!isLayerPinned(boundaryLayer.id)) {
      pinLayer(boundaryLayer.id);
    }
    if (!activeLayer) {
      activateLayer(boundaryLayer.id);
    }

    window.setTimeout(() => {
      document
        .getElementById(`layer-row-${boundaryLayer.id}`)
        ?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }, 250);
  }, [loading, layerMap, activateLayer, pinLayer, activeLayer, isLayerPinned]);
}
