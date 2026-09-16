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
import { createDataOneLayer } from './dataoneLayer';
import { createCalFloraLayer } from './calFloraLayer';
import { createDroneDeployLayer } from './droneDeployLayer';
import { createGBIFLayer } from './gbifLayer';
import { createMotusLayer, MOTUS_TAGGED_ANIMALS_LAYER_ID } from './motusLayer';

/** Set of catalog layer IDs that have real map layer implementations */
export const IMPLEMENTED_LAYERS = new Set([
  'inaturalist-obs',
  'preserve-boundary',
  'dataone-datasets',
  'calflora-observations',
  'dataset-178',
  'dataset-215',
  'dataset-193',
  MOTUS_TAGGED_ANIMALS_LAYER_ID,
]);

/** Layer IDs known to be Dendra sensor services (detected dynamically) */
const dendraLayerIds = new Set<string>();
/** Layer IDs known to be GBIF occurrence services (detected via catalog_tag) */
const gbifLayerIds = new Set<string>();
/** Layer IDs known to be DroneDeploy orthomosaic services (detected via catalog_tag) */
const droneLayerIds = new Set<string>();
/** Layer IDs known to be ANiML camera-trap services (detected via catalog_tag) */
const animlLayerIds = new Set<string>();
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

/** Register a layer ID as a GBIF occurrence layer. */
export function registerGBIFLayerId(layerId: string): void {
  gbifLayerIds.add(layerId);
  IMPLEMENTED_LAYERS.add(layerId);
}

/** Register a layer ID as a DroneDeploy orthomosaics layer. */
export function registerDroneLayerId(layerId: string): void {
  droneLayerIds.add(layerId);
  IMPLEMENTED_LAYERS.add(layerId);
}

/** Check if a layer ID is a registered DroneDeploy layer */
export function isDroneLayer(layerId: string): boolean {
  return droneLayerIds.has(layerId);
}

/** Register a layer ID as an ANiML camera-trap layer. */
export function registerAnimlLayerId(layerId: string): void {
  animlLayerIds.add(layerId);
  IMPLEMENTED_LAYERS.add(layerId);
}

/** Check if a layer ID is a registered ANiML layer */
export function isAnimlLayer(layerId: string): boolean {
  return animlLayerIds.has(layerId);
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
  viewMode?: '2d' | '3d';
}): Layer | null {
  switch (layerId) {
    case 'inaturalist-obs':
      return createINaturalistLayer({ id: `v2-${layerId}`, ...options });

    case 'preserve-boundary':
      return createPreserveBoundaryLayer({ id: `v2-${layerId}`, ...options });

    case 'dataone-datasets':
      return createDataOneLayer({ id: `v2-${layerId}`, ...options });

    case 'calflora-observations':
      return createCalFloraLayer({ id: `v2-${layerId}`, ...options });

    case MOTUS_TAGGED_ANIMALS_LAYER_ID:
      return createMotusLayer({ id: `v2-${layerId}`, ...options });

    default:
      if (dendraLayerIds.has(layerId)) {
        return createDendraLayer({ id: `v2-${layerId}`, ...options });
      }
      if (animlLayerIds.has(layerId) || layerId === 'animl-camera-traps') {
        return createAnimlLayer({ id: `v2-${layerId}`, ...options });
      }
      if (gbifLayerIds.has(layerId) || layerId === 'dataset-178' || layerId === 'dataset-215') {
        return createGBIFLayer({ id: `v2-${layerId}`, ...options });
      }
      if (droneLayerIds.has(layerId) || layerId === 'dataset-193') {
        return createDroneDeployLayer({ id: `v2-${layerId}`, ...options });
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
          viewMode: options.viewMode,
        });
      }
      return null;
  }
}

// Re-export shared taxon config for sidebar use
export { TAXON_CONFIG, TAXON_MAP, getTaxonEmoji, getTaxonColor, emojiToDataUri } from './taxonConfig';
