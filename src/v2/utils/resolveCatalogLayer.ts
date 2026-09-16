// ============================================================================
// resolveCatalogLayer — map a Data Catalog dataset id to the CatalogLayer that
// can be activated / pinned on the map.
//
// Single-layer rows are keyed `dataset-{id}`. Multi-layer FeatureServers (common
// for live datastreams: Latest + Locations) are keyed `service-{id}` with
// children `service-{id}-layer-{n}`, so a naive dataset- id lookup misses them.
// ============================================================================

import type { CatalogLayer } from '../types';

/** Which FeatureServer child to prefer when a dataset has several map layers. */
export type CatalogSublayerPreference = 'latest' | 'locations' | number;

function isServiceContainer(layer: CatalogLayer): boolean {
  return !!(
    layer.catalogMeta?.isMultiLayerService
    && !layer.catalogMeta.parentServiceId
    && layer.catalogMeta.siblingLayers
    && layer.catalogMeta.siblingLayers.length > 0
  );
}

function matchesPreference(
  layer: CatalogLayer,
  preference: CatalogSublayerPreference,
): boolean {
  const layerId = layer.catalogMeta?.layerIdInService;
  const name = layer.name;

  if (typeof preference === 'number') {
    return layerId === preference;
  }

  if (preference === 'latest') {
    return layerId === 0 || /latest/i.test(name);
  }

  // Stations / locations view used for historical browsing of live datastreams.
  return layerId === 1 || /location|station/i.test(name);
}

function resolveFromMap(
  layerMap: Map<string, CatalogLayer>,
  layer: CatalogLayer | undefined,
): CatalogLayer | null {
  if (!layer) return null;
  return layerMap.get(layer.id) ?? layer;
}

function pickPreferredSibling(
  siblings: CatalogLayer[],
  preference: CatalogSublayerPreference,
  layerMap: Map<string, CatalogLayer>,
): CatalogLayer | null {
  const exact = siblings.find((sibling) => matchesPreference(sibling, preference));
  if (exact) return resolveFromMap(layerMap, exact);

  // Locations may be missing on some services — fall back to Latest, then first child.
  if (preference === 'locations') {
    const latest = siblings.find((sibling) => matchesPreference(sibling, 'latest'));
    if (latest) return resolveFromMap(layerMap, latest);
  }

  return siblings[0] ? resolveFromMap(layerMap, siblings[0]) : null;
}

function findAnyLayerForDataset(
  layerMap: Map<string, CatalogLayer>,
  datasetId: number,
): CatalogLayer | null {
  return (
    layerMap.get(`service-${datasetId}`)
    ?? layerMap.get(`dataset-${datasetId}`)
    ?? [...layerMap.values()].find((layer) => layer.catalogMeta?.datasetId === datasetId)
    ?? null
  );
}

/**
 * Resolve the concrete catalog layer for a datasets-table id.
 *
 * @param preference - FeatureServer sublayer to prefer. Use `'locations'` for the
 *   stations view on dendra-format live datastreams, `'latest'` for live readings,
 *   or a numeric ArcGIS layer id.
 */
export function resolveCatalogLayerForDataset(
  layerMap: Map<string, CatalogLayer>,
  datasetId: number,
  preference: CatalogSublayerPreference = 'latest',
): CatalogLayer | null {
  const preferredKey =
    typeof preference === 'number'
      ? `service-${datasetId}-layer-${preference}`
      : preference === 'latest'
        ? `service-${datasetId}-layer-0`
        : `service-${datasetId}-layer-1`;

  const preferredChild = layerMap.get(preferredKey);
  if (preferredChild && matchesPreference(preferredChild, preference)) {
    return preferredChild;
  }

  const service = layerMap.get(`service-${datasetId}`);
  const siblings = service?.catalogMeta?.siblingLayers ?? [];
  if (siblings.length > 0) {
    return pickPreferredSibling(siblings, preference, layerMap) ?? service ?? null;
  }

  if (preferredChild) return preferredChild;

  const direct = layerMap.get(`dataset-${datasetId}`);
  if (direct && !isServiceContainer(direct)) return direct;

  // Last resort: scan the map (covers multi-row service groups keyed as dataset-*).
  const candidates: CatalogLayer[] = [];
  let serviceFallback: CatalogLayer | null = null;

  for (const layer of layerMap.values()) {
    if (layer.catalogMeta?.datasetId !== datasetId) continue;

    if (layer.catalogMeta.parentServiceId) {
      candidates.push(layer);
      continue;
    }

    if (isServiceContainer(layer)) {
      serviceFallback ??= layer;
      if (layer.catalogMeta.siblingLayers?.length) {
        return (
          pickPreferredSibling(layer.catalogMeta.siblingLayers, preference, layerMap)
          ?? layer
        );
      }
      continue;
    }

    return layer;
  }

  if (candidates.length > 0) {
    return pickPreferredSibling(candidates, preference, layerMap) ?? candidates[0];
  }

  return serviceFallback ?? direct ?? null;
}

/**
 * Historical browsing from Live Monitoring: dendra-format datastreams open on
 * their Stations/Locations layer; everything else keeps the live sublayer id.
 */
export function resolveHistoricalCatalogLayer(
  layerMap: Map<string, CatalogLayer>,
  datasetId: number,
  liveLayerId = 0,
): CatalogLayer | null {
  const probe = findAnyLayerForDataset(layerMap, datasetId);
  const preference: CatalogSublayerPreference =
    probe?.catalogMeta?.catalogTag === 'dendra_format' ? 'locations' : liveLayerId;
  return resolveCatalogLayerForDataset(layerMap, datasetId, preference);
}
