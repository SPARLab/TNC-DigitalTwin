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
  const { pinLayer, isLayerPinned } = useLayers();
  const didBootstrapRef = useRef(false);

  useEffect(() => {
    if (loading || didBootstrapRef.current) return;

    const boundaryLayer = findPreserveBoundaryCatalogLayer(layerMap);
    if (!boundaryLayer) return;

    didBootstrapRef.current = true;

    if (!isLayerPinned(boundaryLayer.id)) {
      pinLayer(boundaryLayer.id);
    }
    // UCS-318: the boundary is pinned but not selected, so no layer is active and
    // the sidebar tree and Map Layers widget both start collapsed.
  }, [loading, layerMap, pinLayer, isLayerPinned]);
}
