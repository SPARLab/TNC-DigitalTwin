// ============================================================================
// ANiML catalog helpers — resolve the live catalog layer for camera traps.
// ANiML is catalog-backed via Datasets.catalog_tag = animl_tag (no EXTERNAL_LAYERS).
// ============================================================================

import type { CatalogLayer } from '../types';

/** True when this catalog row uses the ANiML custom visualization. */
export function isAnimlCatalogLayer(
  layer: Pick<CatalogLayer, 'dataSource'> | null | undefined,
): boolean {
  return layer?.dataSource === 'animl';
}

/**
 * Find the concrete ANiML catalog layer id (e.g. dataset-217).
 * Skips multi-layer service parents when children exist.
 */
export function findAnimlLayerId(
  layerMap: Map<string, CatalogLayer>,
): string | null {
  let fallback: string | null = null;
  for (const [id, layer] of layerMap.entries()) {
    if (!isAnimlCatalogLayer(layer)) continue;
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
