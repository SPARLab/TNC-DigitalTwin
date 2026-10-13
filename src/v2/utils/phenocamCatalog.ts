// ============================================================================
// PhenoCam catalog helpers — resolve the live catalog layer for phenology cams.
// Catalog-backed via Datasets.catalog_tag = pheno_format.
// ============================================================================

import type { CatalogLayer } from '../types';
import {
  buildPhenoCamServiceUrl,
  PHENOCAM_DEFAULT_SERVICE_URL,
} from '../services/phenocamService';

export function isPhenoCamCatalogLayer(
  layer: Pick<CatalogLayer, 'dataSource'> | null | undefined,
): boolean {
  return layer?.dataSource === 'phenocam';
}

export function findPhenoCamLayerId(
  layerMap: Map<string, CatalogLayer>,
): string | null {
  let fallback: string | null = null;
  for (const [id, layer] of layerMap.entries()) {
    if (!isPhenoCamCatalogLayer(layer)) continue;
    const isServiceParent = !!(
      layer.catalogMeta?.isMultiLayerService
      && !layer.catalogMeta.parentServiceId
    );
    if (isServiceParent) {
      fallback ??= id;
      continue;
    }
    return id;
  }
  return fallback;
}

export function resolvePhenoCamServiceUrl(
  layer: CatalogLayer | null | undefined,
): string {
  const meta = layer?.catalogMeta;
  if (meta?.serverBaseUrl && meta?.servicePath) {
    return buildPhenoCamServiceUrl(meta.serverBaseUrl, meta.servicePath);
  }
  return PHENOCAM_DEFAULT_SERVICE_URL;
}
