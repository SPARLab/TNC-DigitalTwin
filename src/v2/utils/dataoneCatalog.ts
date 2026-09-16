// ============================================================================
// DataONE catalog helpers — resolve the live catalog layer for DataONE.
// DataONE is catalog-backed via Datasets.catalog_tag = dataone_format
// (also accepts dataone_tag) — not injected via EXTERNAL_LAYERS.
// ============================================================================

import type { CatalogLayer } from '../types';

/** True when this catalog row uses the DataONE custom visualization. */
export function isDataOneCatalogLayer(
  layer: Pick<CatalogLayer, 'dataSource'> | null | undefined,
): boolean {
  return layer?.dataSource === 'dataone';
}

/**
 * Find the concrete DataONE catalog layer id (e.g. dataset-216).
 * Skips multi-layer service parents when children exist.
 */
export function findDataOneLayerId(
  layerMap: Map<string, CatalogLayer>,
): string | null {
  let fallback: string | null = null;
  for (const [id, layer] of layerMap.entries()) {
    if (!isDataOneCatalogLayer(layer)) continue;
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
