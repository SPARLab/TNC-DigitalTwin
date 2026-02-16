// ============================================================================
// Layer Factory — Creates ArcGIS layers by catalog layer ID
// Each data source gets its own module. Add new layers here as they're built.
// This keeps map layer logic modular (no 3,000-line MapContainer).
// ============================================================================

import type Layer from '@arcgis/core/layers/Layer';
import type { CatalogLayer } from '../../../types';
import { createINaturalistLayer } from './inaturalistLayer';
import { createPreserveBoundaryLayer } from './preserveBoundaryLayer';
import { createDendraLayer } from './dendraLayer';
import { createAnimlLayer } from './animlLayer';
import { createTNCArcGISLayer } from './tncArcgisLayer';

/** Set of catalog layer IDs that have real map layer implementations */
export const IMPLEMENTED_LAYERS = new Set([
  'inaturalist-obs',
  'animl-camera-traps',
  'preserve-boundary',
]);

/** Layer IDs known to be Dendra sensor services (detected dynamically) */
const dendraLayerIds = new Set<string>();
/** Layer IDs known to be TNC ArcGIS catalog layers (detected dynamically) */
const tncArcgisLayerIds = new Set<string>();
/** Catalog metadata for each registered TNC ArcGIS layer */
const tncArcgisLayerById = new Map<string, CatalogLayer>();

/** Register a layer ID as a Dendra sensor layer (called by DendraContext/adapter) */
export function registerDendraLayerId(layerId: string): void {
  dendraLayerIds.add(layerId);
  IMPLEMENTED_LAYERS.add(layerId);
}

/** Check if a layer ID is a registered Dendra layer */
export function isDendraLayer(layerId: string): boolean {
  return dendraLayerIds.has(layerId);
}

/** Register a layer ID as a concrete TNC ArcGIS layer. */
export function registerTNCArcGISLayer(layerId: string, layer: CatalogLayer): void {
  tncArcgisLayerIds.add(layerId);
  tncArcgisLayerById.set(layerId, layer);
  IMPLEMENTED_LAYERS.add(layerId);
}

/**
 * Create an ArcGIS layer for a given catalog layer ID.
 * Returns null if the layer has no implementation yet.
 * Each data source's logic lives in its own file under layers/.
 */
export function createMapLayer(layerId: string, options: {
  visible?: boolean;
  whereClause?: string;
}): Layer | null {
  switch (layerId) {
    case 'inaturalist-obs':
      return createINaturalistLayer({ id: `v2-${layerId}`, ...options });

    case 'animl-camera-traps':
      return createAnimlLayer({ id: `v2-${layerId}`, ...options });

    case 'preserve-boundary':
      return createPreserveBoundaryLayer({ id: `v2-${layerId}`, ...options });

    default:
      // Dynamically registered Dendra layers
      if (dendraLayerIds.has(layerId)) {
        return createDendraLayer({ id: `v2-${layerId}`, ...options });
      }
      // Dynamically registered TNC ArcGIS catalog layers
      if (tncArcgisLayerIds.has(layerId)) {
        const layer = tncArcgisLayerById.get(layerId);
        if (!layer) return null;
        return createTNCArcGISLayer({
          id: `v2-${layerId}`,
          layer,
          visible: options.visible,
          whereClause: options.whereClause,
        });
      }
      return null;
  }
}

// Re-export shared taxon config for sidebar use
export { TAXON_CONFIG, TAXON_MAP, getTaxonEmoji, getTaxonColor, emojiToDataUri } from './taxonConfig';
