// ============================================================================
// Layer Factory — Creates ArcGIS layers by catalog layer ID
// Each data source gets its own module. Add new layers here as they're built.
// This keeps map layer logic modular (no 3,000-line MapContainer).
// ============================================================================

import type Layer from '@arcgis/core/layers/Layer';
import { createINaturalistLayer } from './inaturalistLayer';
import { createPreserveBoundaryLayer } from './preserveBoundaryLayer';

/** Set of catalog layer IDs that have real map layer implementations */
export const IMPLEMENTED_LAYERS = new Set([
  'inaturalist-obs',
  'preserve-boundary',
]);

/**
 * Create an ArcGIS layer for a given catalog layer ID.
 * Returns null if the layer has no implementation yet.
 * Each data source's logic lives in its own file under layers/.
 */
export function createMapLayer(layerId: string, options: {
  visible?: boolean;
}): Layer | null {
  switch (layerId) {
    case 'inaturalist-obs':
      return createINaturalistLayer({ id: `v2-${layerId}`, ...options });

    case 'preserve-boundary':
      return createPreserveBoundaryLayer({ id: `v2-${layerId}`, ...options });

    default:
      return null;
  }
}

// Re-export shared taxon config for sidebar use
export { TAXON_CONFIG, TAXON_MAP, getTaxonEmoji, getTaxonColor, emojiToDataUri } from './taxonConfig';
