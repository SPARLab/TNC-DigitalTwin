// ============================================================================
// resolveCatalogLayer — map a Data Catalog dataset id to the CatalogLayer that
// can be activated / pinned on the map.
//
// Single-layer rows are keyed `dataset-{id}`. Multi-layer FeatureServers (common
// for live datastreams: Latest + Locations) are keyed `service-{id}` with
// children `service-{id}-layer-{n}`, so a naive dataset- id lookup misses them.
//
// Layer order is NOT stable across services:
//   Classic `_Datastreams`: Latest = 0, Locations = 1
//   Creek gauges:          Locations = 0, Latest = 1
// Prefer sublayer *names* over numeric ids when resolving Latest vs Locations.
// ============================================================================

import type { CatalogLayer } from '../types';
import { CATALOG_FORMAT_TAGS } from './catalogFormatTags';

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

function isLatestNamed(name: string | undefined): boolean {
  return /latest/i.test(name ?? '');
}

function isLocationsNamed(name: string | undefined): boolean {
  return /location|station/i.test(name ?? '');
}

/**
 * Match a child layer to a Latest / Locations preference.
 * Names win over conventional layer ids so creek-style (Locations=0) services
 * resolve correctly alongside classic `_Datastreams` (Latest=0) services.
 */
export function matchesPreference(
  layer: CatalogLayer,
  preference: CatalogSublayerPreference,
): boolean {
  const layerId = layer.catalogMeta?.layerIdInService;
  const name = layer.name;

  if (typeof preference === 'number') {
    return layerId === preference;
  }

  if (preference === 'latest') {
    if (layer.catalogMeta?.dendraRole === 'measure' || layer.catalogMeta?.valueField) return true;
    if (layer.catalogMeta?.dendraRole === 'stations') return false;
    if (isLatestNamed(name)) return true;
    if (isLocationsNamed(name)) return false;
    // Legacy fallback when names are opaque: Latest was published as layer 0.
    return layerId === 0;
  }

  if (layer.catalogMeta?.dendraRole === 'stations') return true;
  if (layer.catalogMeta?.dendraRole === 'measure' || layer.catalogMeta?.valueField) return false;
  if (isLocationsNamed(name)) return true;
  if (isLatestNamed(name)) return false;
  // Legacy fallback: Locations was published as layer 1.
  return layerId === 1;
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
  if (typeof preference === 'number') {
    const byId = layerMap.get(`service-${datasetId}-layer-${preference}`);
    if (byId) return byId;
  }

  const service = layerMap.get(`service-${datasetId}`);
  const siblings = service?.catalogMeta?.siblingLayers ?? [];
  if (siblings.length > 0) {
    return pickPreferredSibling(siblings, preference, layerMap) ?? service ?? null;
  }

  // Direct key guesses for classic ordering — only accept when the name agrees.
  if (preference === 'latest' || preference === 'locations') {
    for (const layerIndex of [0, 1]) {
      const candidate = layerMap.get(`service-${datasetId}-layer-${layerIndex}`);
      if (candidate && matchesPreference(candidate, preference)) {
        return candidate;
      }
    }
  }

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
    probe?.catalogMeta?.catalogTag === CATALOG_FORMAT_TAGS.dendra ? 'locations' : liveLayerId;
  return resolveCatalogLayerForDataset(layerMap, datasetId, preference);
}
