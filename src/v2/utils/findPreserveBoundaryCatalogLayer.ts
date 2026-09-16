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

/** True when this catalog row is the Dangermond preserve boundary FeatureServer. */
export function isPreserveBoundaryCatalogLayer(layer: CatalogLayer | undefined): boolean {
  if (!layer) return false;
  const url = catalogServiceUrl(layer);
  if (url.includes('jldp_boundary')) return true;
  if (PRESERVE_BOUNDARY_LAYER_URL.toLowerCase().includes(url) && url.length > 0) {
    return true;
  }
  return /preserve.*boundary|simple\s*boundary/i.test(layer.name);
}

/** Pick the boundary dataset from the loaded catalog map, if present. */
export function findPreserveBoundaryCatalogLayer(
  layerMap: Map<string, CatalogLayer>,
): CatalogLayer | null {
  const layers = [...layerMap.values()];
  return (
    layers.find((layer) => catalogServiceUrl(layer).includes('jldp_boundary'))
    ?? layers.find((layer) => /dangermond\s+preserve\s+simple\s+boundary/i.test(layer.name))
    ?? layers.find((layer) => /preserve.*boundary|simple\s*boundary/i.test(layer.name))
    ?? null
  );
}
