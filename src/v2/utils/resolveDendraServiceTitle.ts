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

/** True when this catalog row should show Latest value badges on the map. */
export function isDendraLatestCatalogLayer(layer: CatalogLayer | undefined | null): boolean {
  if (!layer || layer.dataSource !== 'dendra') return false;
  if (layer.catalogMeta?.dendraRole === 'measure' || layer.catalogMeta?.valueField) return true;
  if (layer.catalogMeta?.dendraRole === 'stations') return false;
  return /latest/i.test(layer.name);
}

/** True when this catalog row is the Stations / Locations map mode. */
export function isDendraStationsCatalogLayer(layer: CatalogLayer | undefined | null): boolean {
  if (!layer || layer.dataSource !== 'dendra') return false;
  if (layer.catalogMeta?.dendraRole === 'stations') return true;
  if (layer.catalogMeta?.dendraRole === 'measure' || layer.catalogMeta?.valueField) return false;
  return /location|station/i.test(layer.name);
}

/**
 * Stable right-sidebar identity for a Dendra layer.
 * Latest / Locations children of the same FeatureServer share one key so
 * Overview/Browse do not remount (and re-fetch the same chart data) when toggling.
 */
export function resolveDendraSidebarPanelKey(
  layerMap: Map<string, CatalogLayer>,
  layerId: string | null | undefined,
): string | null {
  if (!layerId) return null;
  const layer = layerMap.get(layerId);
  if (!layer || layer.dataSource !== 'dendra') return null;
  return layer.catalogMeta?.parentServiceId ?? layerId;
}
