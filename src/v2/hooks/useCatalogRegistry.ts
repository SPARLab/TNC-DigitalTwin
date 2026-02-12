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

        // ── Create CatalogLayer for every visible dataset ────────────────
        const allLayers = new Map<string, CatalogLayer>();

        // Helper: create a CatalogLayer from a raw dataset + category
        function layerFromDataset(d: RawDataset, categoryId: string): CatalogLayer {
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
        }

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
          const directLayers: CatalogLayer[] = [];
          for (const dsId of directDatasetIds) {
            const d = datasetById.get(dsId);
            if (!d || d.is_visible === 0) continue;
            const layer = layerFromDataset(d, catId);
            directLayers.push(layer);
            allLayers.set(layer.id, layer);
          }

          // Subcategories
          const subs = childrenByParent.get(raw.id) ?? [];
          const subcategories: Category[] = subs.map(sub => {
            const subCatId = String(sub.id);
            const subIcon = CATEGORY_ICON_MAP[sub.name] ?? sub.icon ?? icon;
            const subDatasetIds = catToDatasets.get(sub.id) ?? [];
            const subLayers: CatalogLayer[] = [];
            for (const dsId of subDatasetIds) {
              const d = datasetById.get(dsId);
              if (!d || d.is_visible === 0) continue;
              const layer = layerFromDataset(d, subCatId);
              subLayers.push(layer);
              allLayers.set(layer.id, layer);
            }
            // Sort by display_order within catalog
            subLayers.sort((a, b) => {
              const da = datasetById.get(a.catalogMeta!.datasetId)!;
              const db = datasetById.get(b.catalogMeta!.datasetId)!;
              return da.display_order - db.display_order;
            });
            return {
              id: subCatId,
              name: sub.name,
              icon: subIcon,
              layers: subLayers,
              parentId: catId,
            };
          });

          // Sort direct layers by display_order
          directLayers.sort((a, b) => {
            const da = datasetById.get(a.catalogMeta!.datasetId)!;
            const db = datasetById.get(b.catalogMeta!.datasetId)!;
            return da.display_order - db.display_order;
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
