// ============================================================================
// useCatalogPreserveBoundaryBootstrap — on first catalog load, pin the preserve
// boundary like any other layer (same pin/active visibility rules). The left
// sidebar tree stays collapsed.
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
      // Keep the catalog tree collapsed on first load.
      activateLayer(boundaryLayer.id, undefined, undefined, undefined, { skipSidebarReveal: true });
    }
  }, [loading, layerMap, activateLayer, pinLayer, activeLayer, isLayerPinned]);
}
