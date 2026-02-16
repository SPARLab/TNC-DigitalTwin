// ============================================================================
// useCatalogRegistry — Fetches the Data Catalog FeatureServer on mount and
// builds the dynamic Category / CatalogLayer tree that powers the sidebar.
//
// Data Catalog service:
//   Table 0: Categories (id, name, parent_id, display_order, icon)
//   Table 1: Datasets  (id, service_name, display_title, server_base_url, …)
//   Table 2: Dataset Categories (junction: dataset_id ↔ category_id)
//
// After fetching, the hook:
//   1. Builds a hierarchical category tree (parents → subcategories)
//   2. Maps datasets → CatalogLayer with data source detection
//   3. Injects "synthetic" external layers (iNaturalist etc.)
//   4. Returns { categories, layerMap, loading, error }
// ============================================================================

import { useState, useEffect } from 'react';
import type { Category, CatalogLayer, DataSource } from '../types';
import { CATEGORY_ICON_MAP, EXTERNAL_LAYERS } from '../data/layerRegistry';

const BASE =
  'https://dangermondpreserve-spatial.com/server/rest/services/Dangermond_Preserve_Data_Catalog/FeatureServer';

// ── Raw row types ────────────────────────────────────────────────────────────

interface RawCategory {
  id: number;
  name: string;
  description: string | null;
  icon: string | null;
  parent_id: number | null;
  display_order: number;
}

interface RawDataset {
  id: number;
  server_base_url: string | null;
  service_path: string | null;
  service_name: string | null;
  has_feature_server: number;
  has_map_server: number;
  has_image_server: number;
  display_title: string | null;
  description: string | null;
  thumbnail_url: string | null;
  layer_id: number | null;
  display_order: number;
  is_visible: number;
  is_default_on: number;
}

interface RawJunction {
  id: number;
  dataset_id: number;
  category_id: number;
}

interface ArcGISServiceLayer {
  id: number;
  name: string;
}

const SERVICE_DISCOVERY_TIMEOUT_MS = 1200;
const MAX_SERVICE_DISCOVERY_CANDIDATES = 12;

// ── Hook return type ─────────────────────────────────────────────────────────

export interface CatalogRegistryState {
  categories: Category[];
  layerMap: Map<string, CatalogLayer>;
  loading: boolean;
  error: string | null;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

/** Query a FeatureServer table and return all feature attributes. */
async function queryTable<T>(tableId: number): Promise<T[]> {
  const url = `${BASE}/${tableId}/query?where=1=1&outFields=*&f=json`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Catalog table ${tableId}: HTTP ${res.status}`);
  const json = await res.json();
  if (json.error) throw new Error(`Catalog table ${tableId}: ${json.error.message}`);
  return (json.features ?? []).map((f: { attributes: T }) => f.attributes);
}

/** Convert a catalog dataset ID to a stable layer ID string. */
function toLayerId(datasetId: number): string {
  return `dataset-${datasetId}`;
}

/** Convert a service key to a stable service layer ID string. */
function toServiceLayerId(serviceDatasetId: number): string {
  return `service-${serviceDatasetId}`;
}

/** Build stable key used to group datasets by underlying service endpoint. */
function serviceKeyForDataset(d: RawDataset): string | null {
  if (!d.server_base_url || !d.service_path) return null;
  return `${d.server_base_url}/${d.service_path}`;
}

/** Group datasets by service endpoint for multi-layer service detection. */
function detectMultiLayerServices(datasets: RawDataset[]): Map<string, RawDataset[]> {
  const serviceGroups = new Map<string, RawDataset[]>();
  for (const d of datasets) {
    const serviceKey = serviceKeyForDataset(d);
    if (!serviceKey) continue;
    const group = serviceGroups.get(serviceKey) ?? [];
    group.push(d);
    serviceGroups.set(serviceKey, group);
  }
  return serviceGroups;
}

function sanitizeArcGisBaseUrl(serverBaseUrl: string): string {
  const trimmed = serverBaseUrl.trim().replace(/\/+$/, '');
  if (!trimmed) return '';
  return /\/rest\/services$/i.test(trimmed) ? trimmed : `${trimmed}/rest/services`;
}

function buildFeatureServiceMetadataUrl(d: RawDataset): string | null {
  if (!d.server_base_url || !d.service_path) return null;
  const base = sanitizeArcGisBaseUrl(d.server_base_url);
  const path = d.service_path.trim().replace(/^\/+/, '').replace(/\/+$/, '');
  if (!base || !path) return null;
  return `${base}/${path}/FeatureServer?f=json`;
}

async function fetchFeatureServiceLayers(d: RawDataset): Promise<ArcGISServiceLayer[]> {
  const metadataUrl = buildFeatureServiceMetadataUrl(d);
  if (!metadataUrl) return [];

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), SERVICE_DISCOVERY_TIMEOUT_MS);

  let res: Response;
  try {
    res = await fetch(metadataUrl, { signal: controller.signal });
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      return [];
    }
    console.warn('[CatalogRegistry] Feature service discovery failed (network):', error);
    return [];
  } finally {
    clearTimeout(timeoutId);
  }

  if (!res.ok) {
    console.warn(`[CatalogRegistry] Feature service discovery failed: HTTP ${res.status}`);
    return [];
  }

  let json: unknown;
  try {
    json = await res.json();
  } catch (error) {
    console.warn('[CatalogRegistry] Feature service discovery failed (malformed JSON):', error);
    return [];
  }

  if (!json || typeof json !== 'object') return [];
  const layers = (json as { layers?: unknown }).layers;
  if (!Array.isArray(layers)) return [];

  return layers
    .map((layer): ArcGISServiceLayer | null => {
      if (!layer || typeof layer !== 'object') return null;
      const id = (layer as { id?: unknown }).id;
      const name = (layer as { name?: unknown }).name;
      if (typeof id !== 'number' || !Number.isFinite(id)) return null;
      return {
        id,
        name: typeof name === 'string' && name.trim() ? name.trim() : `Layer ${id}`,
      };
    })
    .filter((layer): layer is ArcGISServiceLayer => !!layer)
    .sort((a, b) => a.id - b.id);
}

/** Detect the data source adapter key from service URL patterns. */
function detectDataSource(d: RawDataset): DataSource {
  const path = d.service_path ?? '';
  const base = d.server_base_url ?? '';

  // Dendra per-type sensor services on preserve server
  if (base.includes('dangermondpreserve-spatial.com') && path.includes('_Sensor')) {
    return 'dendra';
  }
  // Dendra pressure level sensors (no "_Sensor" suffix but same schema)
  if (base.includes('dangermondpreserve-spatial.com') && path.includes('Pressure_Level')) {
    return 'dendra';
  }

  // Default: TNC ArcGIS hosted or external ArcGIS service
  return 'tnc-arcgis';
}

/** Pick an icon for a dataset based on its data source. */
function datasetIcon(ds: DataSource): string {
  switch (ds) {
    case 'dendra': return 'Thermometer';
    case 'inaturalist': return 'Leaf';
    case 'animl': return 'Camera';
    case 'dataone': return 'BookOpen';
    default: return 'Map';
  }
}

// ── Hook ─────────────────────────────────────────────────────────────────────

export function useCatalogRegistry(): CatalogRegistryState {
  const [state, setState] = useState<CatalogRegistryState>({
    categories: [],
    layerMap: new Map(),
    loading: true,
    error: null,
  });

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        // Fetch all three tables in parallel
        const [rawCats, rawDatasets, rawJunctions] = await Promise.all([
          queryTable<RawCategory>(0),
          queryTable<RawDataset>(1),
          queryTable<RawJunction>(2),
        ]);

        if (cancelled) return;

        // ── Build junction lookup: categoryId → datasetIds ───────────────
        const catToDatasets = new Map<number, number[]>();
        for (const j of rawJunctions) {
          const arr = catToDatasets.get(j.category_id) ?? [];
          arr.push(j.dataset_id);
          catToDatasets.set(j.category_id, arr);
        }

        // ── Build dataset lookup ─────────────────────────────────────────
        const datasetById = new Map<number, RawDataset>();
        for (const d of rawDatasets) datasetById.set(d.id, d);
        const serviceGroups = detectMultiLayerServices(rawDatasets);

        // Discover ArcGIS sublayers when catalog rows represent only a service
        // container (single row + missing layer_id). This keeps large services
        // like Coastal_and_Marine usable without requiring immediate catalog backfill.
        const serviceDiscoveryCandidates = rawDatasets.filter((d) => {
          if (d.is_visible === 0) return false;
          if (detectDataSource(d) !== 'tnc-arcgis') return false;
          if (d.has_feature_server !== 1) return false;
          if (d.layer_id !== null) return false;
          const serviceKey = serviceKeyForDataset(d);
          if (!serviceKey) return false;
          const grouped = serviceGroups.get(serviceKey) ?? [];
          return grouped.length === 1;
        });

        const prioritizedDiscoveryCandidates = serviceDiscoveryCandidates
          .sort((a, b) => {
            const aText = `${a.service_name ?? ''} ${a.service_path ?? ''}`.toLowerCase();
            const bText = `${b.service_name ?? ''} ${b.service_path ?? ''}`.toLowerCase();
            const aPriority = /(coastal|marine)/.test(aText) ? 0 : /data/.test(aText) ? 1 : 2;
            const bPriority = /(coastal|marine)/.test(bText) ? 0 : /data/.test(bText) ? 1 : 2;
            if (aPriority !== bPriority) return aPriority - bPriority;
            return a.display_order - b.display_order;
          })
          .slice(0, MAX_SERVICE_DISCOVERY_CANDIDATES);

        const discoveredLayersByServiceKey = new Map<string, ArcGISServiceLayer[]>();
        await Promise.all(
          prioritizedDiscoveryCandidates.map(async (d) => {
            const serviceKey = serviceKeyForDataset(d);
            if (!serviceKey || discoveredLayersByServiceKey.has(serviceKey)) return;
            const layers = await fetchFeatureServiceLayers(d);
            discoveredLayersByServiceKey.set(serviceKey, layers);
          }),
        );

        // ── Create CatalogLayer for every visible dataset ────────────────
        const allLayers = new Map<string, CatalogLayer>();

        // Helper: create a CatalogLayer from a raw dataset + category
        const layerFromDataset = (d: RawDataset, categoryId: string): CatalogLayer => {
          const id = toLayerId(d.id);
          const ds = detectDataSource(d);
          return {
            id,
            name: d.display_title || d.service_name || `Dataset ${d.id}`,
            categoryId,
            dataSource: ds,
            icon: datasetIcon(ds),
            catalogMeta: {
              datasetId: d.id,
              serverBaseUrl: d.server_base_url ?? '',
              servicePath: d.service_path ?? '',
              hasFeatureServer: d.has_feature_server === 1,
              hasMapServer: d.has_map_server === 1,
              hasImageServer: d.has_image_server === 1,
              description: d.description ?? undefined,
              layerIdInService: d.layer_id ?? undefined,
            },
          };
        };

        /** Build category layer rows and synthesize service parents for multi-layer TNC services. */
        const buildLayersForCategory = (datasetIds: number[], categoryId: string): CatalogLayer[] => {
          const layers: CatalogLayer[] = [];
          const visibleDatasets = datasetIds
            .map(dsId => datasetById.get(dsId))
            .filter((d): d is RawDataset => !!d && d.is_visible !== 0);
          const seenServiceKeys = new Set<string>();

          for (const d of visibleDatasets) {
            const ds = detectDataSource(d);
            const serviceKey = serviceKeyForDataset(d);

            // Only group TNC ArcGIS layers with a valid service key.
            if (ds !== 'tnc-arcgis' || !serviceKey) {
              const layer = layerFromDataset(d, categoryId);
              layers.push(layer);
              allLayers.set(layer.id, layer);
              continue;
            }

            if (seenServiceKeys.has(serviceKey)) continue;
            seenServiceKeys.add(serviceKey);

            const serviceRows = (serviceGroups.get(serviceKey) ?? [])
              .filter(row => row.is_visible !== 0 && detectDataSource(row) === 'tnc-arcgis')
              .sort((a, b) => a.display_order - b.display_order);

            if (serviceRows.length <= 1) {
              const discoveredLayers = discoveredLayersByServiceKey.get(serviceKey) ?? [];
              if (discoveredLayers.length > 1) {
                const serviceDatasetId = d.id;
                const serviceId = toServiceLayerId(serviceDatasetId);

                const children = discoveredLayers.map((discoveredLayer): CatalogLayer => ({
                  id: `${serviceId}-layer-${discoveredLayer.id}`,
                  name: discoveredLayer.name,
                  categoryId,
                  dataSource: 'tnc-arcgis',
                  icon: datasetIcon('tnc-arcgis'),
                  catalogMeta: {
                    datasetId: d.id,
                    serverBaseUrl: d.server_base_url ?? '',
                    servicePath: d.service_path ?? '',
                    hasFeatureServer: d.has_feature_server === 1,
                    hasMapServer: d.has_map_server === 1,
                    hasImageServer: d.has_image_server === 1,
                    description: d.description ?? undefined,
                    layerIdInService: discoveredLayer.id,
                    isMultiLayerService: true,
                    parentServiceId: serviceId,
                  },
                }));

                for (const child of children) {
                  if (!child.catalogMeta) continue;
                  child.catalogMeta.siblingLayers = children.filter(sibling => sibling.id !== child.id);
                }

                const parent: CatalogLayer = {
                  id: serviceId,
                  name: d.service_name || d.display_title || `Service ${serviceDatasetId}`,
                  categoryId,
                  dataSource: 'tnc-arcgis',
                  icon: datasetIcon('tnc-arcgis'),
                  catalogMeta: {
                    datasetId: serviceDatasetId,
                    serverBaseUrl: d.server_base_url ?? '',
                    servicePath: d.service_path ?? '',
                    hasFeatureServer: d.has_feature_server === 1,
                    hasMapServer: d.has_map_server === 1,
                    hasImageServer: d.has_image_server === 1,
                    description: d.description ?? undefined,
                    isMultiLayerService: true,
                    siblingLayers: children,
                  },
                };

                layers.push(parent, ...children);
                allLayers.set(parent.id, parent);
                for (const child of children) allLayers.set(child.id, child);
                continue;
              }

              if (discoveredLayers.length === 1) {
                const discovered = discoveredLayers[0];
                const layer = layerFromDataset(
                  {
                    ...d,
                    layer_id: discovered.id,
                    display_title: d.display_title || discovered.name,
                  },
                  categoryId,
                );
                layers.push(layer);
                allLayers.set(layer.id, layer);
                continue;
              }

              const layer = layerFromDataset(d, categoryId);
              layers.push(layer);
              allLayers.set(layer.id, layer);
              continue;
            }

            const serviceDatasetId = serviceRows[0].id;
            const serviceId = toServiceLayerId(serviceDatasetId);

            const children = serviceRows.map((row): CatalogLayer => ({
              id: toLayerId(row.id),
              name: row.display_title || row.service_name || `Dataset ${row.id}`,
              categoryId,
              dataSource: 'tnc-arcgis',
              icon: datasetIcon('tnc-arcgis'),
              catalogMeta: {
                datasetId: row.id,
                serverBaseUrl: row.server_base_url ?? '',
                servicePath: row.service_path ?? '',
                hasFeatureServer: row.has_feature_server === 1,
                hasMapServer: row.has_map_server === 1,
                hasImageServer: row.has_image_server === 1,
                description: row.description ?? undefined,
                layerIdInService: row.layer_id ?? undefined,
                isMultiLayerService: true,
                parentServiceId: serviceId,
              },
            }));

            // Attach sibling references after all children exist.
            for (const child of children) {
              if (!child.catalogMeta) continue;
              child.catalogMeta.siblingLayers = children.filter(sibling => sibling.id !== child.id);
            }

            const parent: CatalogLayer = {
              id: serviceId,
              name: serviceRows[0].service_name || serviceRows[0].display_title || `Service ${serviceDatasetId}`,
              categoryId,
              dataSource: 'tnc-arcgis',
              icon: datasetIcon('tnc-arcgis'),
              catalogMeta: {
                datasetId: serviceDatasetId,
                serverBaseUrl: serviceRows[0].server_base_url ?? '',
                servicePath: serviceRows[0].service_path ?? '',
                hasFeatureServer: serviceRows[0].has_feature_server === 1,
                hasMapServer: serviceRows[0].has_map_server === 1,
                hasImageServer: serviceRows[0].has_image_server === 1,
                description: serviceRows[0].description ?? undefined,
                isMultiLayerService: true,
                siblingLayers: children,
              },
            };

            layers.push(parent, ...children);
            allLayers.set(parent.id, parent);
            for (const child of children) allLayers.set(child.id, child);
          }

          // Keep sorting consistent with catalog display_order. Parent + children
          // are grouped by their first child's dataset display order.
          layers.sort((a, b) => {
            const da = datasetById.get(a.catalogMeta!.datasetId)!;
            const db = datasetById.get(b.catalogMeta!.datasetId)!;
            return da.display_order - db.display_order;
          });
          return layers;
        };

        // ── Build category tree ──────────────────────────────────────────
        // Sort raw categories by display_order
        rawCats.sort((a, b) => a.display_order - b.display_order);

        // Separate top-level vs subcategories
        const topLevel = rawCats.filter(c => c.parent_id === null);
        const children = rawCats.filter(c => c.parent_id !== null);

        // Group children by parent_id
        const childrenByParent = new Map<number, RawCategory[]>();
        for (const c of children) {
          const arr = childrenByParent.get(c.parent_id!) ?? [];
          arr.push(c);
          childrenByParent.set(c.parent_id!, arr);
        }

        // Build Category objects
        const categories: Category[] = topLevel.map(raw => {
          const catId = String(raw.id);
          const icon = CATEGORY_ICON_MAP[raw.name] ?? raw.icon ?? 'Folder';

          // Layers directly in this top-level category
          const directDatasetIds = catToDatasets.get(raw.id) ?? [];
          const directLayers = buildLayersForCategory(directDatasetIds, catId);

          // Subcategories
          const subs = childrenByParent.get(raw.id) ?? [];
          const subcategories: Category[] = subs.map(sub => {
            const subCatId = String(sub.id);
            const subIcon = CATEGORY_ICON_MAP[sub.name] ?? sub.icon ?? icon;
            const subDatasetIds = catToDatasets.get(sub.id) ?? [];
            const subLayers = buildLayersForCategory(subDatasetIds, subCatId);
            return {
              id: subCatId,
              name: sub.name,
              icon: subIcon,
              layers: subLayers,
              parentId: catId,
            };
          });

          return {
            id: catId,
            name: raw.name,
            icon,
            layers: directLayers,
            subcategories: subcategories.length > 0 ? subcategories : undefined,
          };
        });

        // ── Inject synthetic external layers ─────────────────────────────
        for (const ext of EXTERNAL_LAYERS) {
          allLayers.set(ext.id, ext);
          const cat = categories.find(c => c.id === ext.categoryId);
          if (cat) {
            cat.layers.push(ext);
          }
        }

        // ── Filter out empty "Uncategorized" if it has no layers ─────────
        const finalCategories = categories.filter(
          c => c.layers.length > 0 || (c.subcategories && c.subcategories.length > 0),
        );

        setState({
          categories: finalCategories,
          layerMap: allLayers,
          loading: false,
          error: null,
        });
      } catch (err) {
        if (cancelled) return;
        console.error('[CatalogRegistry] Failed to load catalog:', err);
        setState(prev => ({
          ...prev,
          loading: false,
          error: err instanceof Error ? err.message : 'Failed to load data catalog',
        }));
      }
    }

    load();
    return () => { cancelled = true; };
  }, []);

  return state;
}
