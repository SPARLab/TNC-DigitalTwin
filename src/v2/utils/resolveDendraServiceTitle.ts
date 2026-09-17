// ============================================================================
// resolveDendraServiceTitle — prefer the FeatureServer / parent service name
// over ArcGIS sublayer names like "Air_Temperature Latest".
// ============================================================================

import type { CatalogLayer } from '../types';

/**
 * Overall Dendra service title for workspace chrome and copy.
 * Child layers (Latest / Locations) resolve to their parent service name.
 */
export function resolveDendraServiceTitle(
  layerMap: Map<string, CatalogLayer>,
  layerId: string | null | undefined,
): string | null {
  if (!layerId) return null;
  const layer = layerMap.get(layerId);
  if (!layer || layer.dataSource !== 'dendra') return null;

  const parentId = layer.catalogMeta?.parentServiceId;
  if (parentId) {
    const parent = layerMap.get(parentId);
    if (parent?.name?.trim()) return parent.name.trim();
  }

  return layer.name?.trim() || null;
}

/** True when this catalog row is the live "Latest" readings sublayer. */
export function isDendraLatestCatalogLayer(layer: CatalogLayer | undefined | null): boolean {
  if (!layer || layer.dataSource !== 'dendra') return false;
  return /latest/i.test(layer.name);
}
