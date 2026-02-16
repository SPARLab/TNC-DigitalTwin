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
