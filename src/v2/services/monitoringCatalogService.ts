// ============================================================================
// Monitoring Catalog Service — resolves which datasets belong on the Live
// Monitoring page from the Data Catalog's `live_tag` column.
//
// The full registry (useCatalogRegistry) queries four tables and probes service
// metadata to build the catalog sidebar. Monitoring needs none of that, so this
// asks the datasets table a single question: which rows carry a live_tag, and
// what service backs each one?
// ============================================================================

import { CacheTTL, getCachedOrFetch } from '../../services/cacheService';

const DATASETS_TABLE_URL =
  'https://dangermondpreserve-spatial.com/server/rest/services/Dangermond_Preserve_Data_Catalog/FeatureServer/1';

export interface LiveTaggedDataset {
  datasetId: number;
  /** Section heading, taken verbatim from `live_tag`. */
  liveTag: string;
  /** Service directory name — the key that matches a dataset to a renderer. */
  servicePath: string;
  displayTitle: string;
  /** Sublayer holding the "Latest" features. */
  layerId: number;
  displayOrder: number;
}

interface RawRow {
  id: number | null;
  display_title: string | null;
  service_path: string | null;
  layer_id: number | null;
  live_tag: string | null;
  display_order: number | null;
  is_visible: number | null;
}

interface QueryResponse {
  features?: { attributes: RawRow }[];
  error?: { message?: string };
}

const OUT_FIELDS = [
  'id',
  'display_title',
  'service_path',
  'layer_id',
  'live_tag',
  'display_order',
  'is_visible',
].join(',');

async function requestLiveTaggedDatasets(): Promise<LiveTaggedDataset[]> {
  const params = new URLSearchParams({
    f: 'json',
    // Unset tags appear as both nulls and empty strings depending on the row.
    where: "live_tag IS NOT NULL AND live_tag <> ''",
    outFields: OUT_FIELDS,
    returnGeometry: 'false',
    orderByFields: 'display_order',
    resultRecordCount: '200',
  });

  const response = await fetch(`${DATASETS_TABLE_URL}/query?${params.toString()}`);
  if (!response.ok) {
    throw new Error(`Monitoring catalog query failed: HTTP ${response.status}`);
  }

  const json: QueryResponse = await response.json();
  if (json.error) {
    throw new Error(`Monitoring catalog query error: ${json.error.message ?? 'Unknown error'}`);
  }

  const datasets: LiveTaggedDataset[] = [];

  for (const feature of json.features ?? []) {
    const row = feature.attributes;
    if (row.is_visible === 0) continue;

    const servicePath = row.service_path?.trim();
    const liveTag = row.live_tag?.trim();
    // Without a service path there is nothing to bind a renderer to.
    if (!servicePath || !liveTag || row.id == null) continue;

    datasets.push({
      datasetId: row.id,
      liveTag,
      servicePath,
      displayTitle: row.display_title?.trim() || servicePath,
      // Some rows leave layer_id unset; the "Latest" layer is 0 on every
      // datastream service, so that is the safe default.
      layerId: row.layer_id ?? 0,
      displayOrder: row.display_order ?? 0,
    });
  }

  return datasets;
}

export async function fetchLiveTaggedDatasets(): Promise<LiveTaggedDataset[]> {
  return getCachedOrFetch(
    'monitoring-live-tagged-datasets',
    {},
    requestLiveTaggedDatasets,
    // Tags change when the management app is edited, not minute to minute. The
    // cache is in-memory, so a page reload still picks up a fresh tag straight away.
    CacheTTL.LONG,
  );
}
