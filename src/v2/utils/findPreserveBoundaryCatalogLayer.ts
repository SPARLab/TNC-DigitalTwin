// ============================================================================
// Find the catalog dataset that matches the live-monitoring preserve boundary.
// ============================================================================

import type { CatalogLayer } from '../types';
import { PRESERVE_BOUNDARY_LAYER_URL } from '../services/preserveBoundaryService';

function catalogServiceUrl(layer: CatalogLayer): string {
  const meta = layer.catalogMeta;
  if (!meta?.serverBaseUrl || !meta.servicePath) return '';
  const base = meta.serverBaseUrl.replace(/\/+$/, '');
  const path = meta.servicePath.replace(/^\/+/, '');
  return `${base}/${path}`.toLowerCase();
}

function isServiceContainer(layer: CatalogLayer): boolean {
  return !!(
    layer.catalogMeta?.isMultiLayerService
    && !layer.catalogMeta.parentServiceId
    && layer.catalogMeta.siblingLayers
    && layer.catalogMeta.siblingLayers.length > 0
  );
}

/** True when this catalog row is the Dangermond preserve boundary FeatureServer. */
export function isPreserveBoundaryCatalogLayer(layer: CatalogLayer | undefined): boolean {
  if (!layer) return false;
  const url = catalogServiceUrl(layer);
  if (url.includes('jldp_boundary')) return true;
  if (url.length > 0 && PRESERVE_BOUNDARY_LAYER_URL.toLowerCase().includes(url)) {
    return true;
  }
  return /preserve.*boundary|simple\s*boundary/i.test(layer.name);
}

/**
 * Pick a pin-able boundary dataset from the catalog map.
 * Prefers a concrete sublayer (not a service container), especially layer 2.
 */
export function findPreserveBoundaryCatalogLayer(
  layerMap: Map<string, CatalogLayer>,
): CatalogLayer | null {
  const matches = [...layerMap.values()].filter(isPreserveBoundaryCatalogLayer);
  if (matches.length === 0) return null;

  const concrete = matches.filter((layer) => !isServiceContainer(layer));
  const layerTwo = concrete.find((layer) => layer.catalogMeta?.layerIdInService === 2);
  return layerTwo ?? concrete[0] ?? matches[0];
}
