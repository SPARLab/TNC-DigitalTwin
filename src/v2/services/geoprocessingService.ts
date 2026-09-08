// ============================================================================
// Geoprocessing helpers — catalog rasters, GP job submit/poll, occurrences.
//
// Jobs on this server typically require a portal token. Until v2 sign-in
// exists, a token stored by the twin_models mockup (`dev_token`) is reused.
// Requests still go out without one so a public service would just work.
// ============================================================================

import {
  DATASETS_TABLE_URL,
  DEFAULT_SDM_INPUTS,
  GP_SERVICES,
  RASTERS_TABLE_URL,
  STORED_TOKEN_KEY,
} from '../config/geoprocessing';
import type { CatalogRaster, GpMessage, OccurrenceFeature } from '../components/Experiences/types';

export function readStoredArcGisToken(): string | null {
  try {
    return localStorage.getItem(STORED_TOKEN_KEY);
  } catch {
    return null;
  }
}

function appendToken(params: URLSearchParams, token: string | null): void {
  if (token) params.set('token', token);
}

function isAuthError(message: string): boolean {
  return /token|auth|access|permission|sign-in|couldn't access/i.test(message);
}

function explainError(message: string, label: string): Error {
  if (isAuthError(message)) {
    return new Error(`The ${label} service requires sign-in.`);
  }
  return new Error(message);
}

interface QueryResponse<T> {
  features?: { attributes: T }[];
  error?: { message?: string };
}

interface RasterRow {
  id: number | null;
  dataset_id: number | null;
  title: string | null;
  url: string | null;
  resolution: number | null;
  scope: string | null;
  thematic_category: string | null;
  units: string | null;
  value_min: number | null;
  value_max: number | null;
  is_active: number | null;
}

interface DatasetTitleRow {
  id: number | null;
  display_title: string | null;
}

const RASTER_FIELDS_WITHOUT_SCOPE = [
  'id',
  'dataset_id',
  'title',
  'url',
  'resolution',
  'thematic_category',
  'units',
  'value_min',
  'value_max',
  'is_active',
];

const KNOWN_SCOPES = new Set(['preserve', 'sbcounty', 'tricounty']);

function parseScope(value: string | null): CatalogRaster['scope'] {
  const normalized = value?.trim().toLowerCase() ?? '';
  if (KNOWN_SCOPES.has(normalized)) {
    return normalized as CatalogRaster['scope'];
  }
  return null;
}

function mapRasterRows(
  rows: RasterRow[],
  displayTitles: Map<number, string>,
): CatalogRaster[] {
  return rows
    .filter((row) => row.is_active !== 0 && row.id != null && row.url)
    .map((row) => {
      const fromDataset =
        row.dataset_id != null ? displayTitles.get(row.dataset_id)?.trim() : '';
      return {
        id: row.id as number,
        title: fromDataset || row.title?.trim() || 'Untitled raster',
        url: row.url as string,
        resolution: row.resolution,
        scope: parseScope(row.scope),
        thematicCategory: row.thematic_category?.trim() || 'Other',
        units: row.units?.trim() || '',
        valueMin: row.value_min,
        valueMax: row.value_max,
      };
    })
    .sort((a, b) => a.title.localeCompare(b.title));
}

async function fetchDatasetDisplayTitles(
  datasetIds: number[],
  token: string | null,
): Promise<Map<number, string>> {
  const uniqueIds = [...new Set(datasetIds.filter((id) => Number.isFinite(id)))];
  const titles = new Map<number, string>();
  if (uniqueIds.length === 0) return titles;

  const params = new URLSearchParams({
    f: 'json',
    where: `id IN (${uniqueIds.join(',')})`,
    outFields: 'id,display_title',
    returnGeometry: 'false',
    orderByFields: 'id',
    resultRecordCount: String(Math.max(uniqueIds.length, 50)),
  });
  appendToken(params, token);

  const response = await fetch(`${DATASETS_TABLE_URL}/query?${params.toString()}`);
  const json = (await response.json().catch(() => null)) as QueryResponse<DatasetTitleRow> | null;
  if (!json || json.error) return titles;

  for (const feature of json.features ?? []) {
    const id = feature.attributes.id;
    const title = feature.attributes.display_title?.trim();
    if (id != null && title) titles.set(id, title);
  }
  return titles;
}

async function queryRasters(outFields: string[], token: string | null): Promise<QueryResponse<RasterRow>> {
  const params = new URLSearchParams({
    f: 'json',
    where: '1=1',
    outFields: outFields.join(','),
    returnGeometry: 'false',
    orderByFields: 'title',
    resultRecordCount: '400',
  });
  appendToken(params, token);

  const response = await fetch(`${RASTERS_TABLE_URL}/query?${params.toString()}`);
  const json = (await response.json().catch(() => null)) as QueryResponse<RasterRow> | null;
  if (!json) {
    throw new Error(`Raster catalog query failed: HTTP ${response.status}`);
  }
  if (!response.ok && !json.error) {
    throw new Error(`Raster catalog query failed: HTTP ${response.status}`);
  }
  return json;
}

export async function fetchCatalogRasters(token: string | null): Promise<CatalogRaster[]> {
  const withScope = [...RASTER_FIELDS_WITHOUT_SCOPE, 'scope'];
  let json: QueryResponse<RasterRow>;

  try {
    json = await queryRasters(withScope, token);
  } catch {
    json = { error: { message: 'scope field unavailable' } };
  }

  // `scope` is a new column; older service definitions reject it in outFields.
  if (json.error) {
    json = await queryRasters(RASTER_FIELDS_WITHOUT_SCOPE, token);
  }

  if (json.error) {
    throw explainError(json.error.message ?? 'Query failed', 'raster catalog');
  }

  const rows = json.features?.map((feature) => feature.attributes) ?? [];
  const datasetIds = rows
    .map((row) => row.dataset_id)
    .filter((id): id is number => id != null);

  let displayTitles = new Map<number, string>();
  try {
    displayTitles = await fetchDatasetDisplayTitles(datasetIds, token);
  } catch {
    // Keep templated raster titles if the datasets table is unreachable.
  }

  return mapRasterRows(rows, displayTitles);
}

interface CategoryLabelResult {
  categories: Record<string, number>;
  labels: Record<string, string>;
}

export async function fetchCategoryLabels(
  imageServerUrl: string,
): Promise<CategoryLabelResult | null> {
  try {
    const response = await fetch(`${imageServerUrl}/rasterAttributeTable?f=json`);
    const data = await response.json();
    if (data.error || !data.features) return null;

    const fields: { name: string; type: string }[] = data.fields ?? [];
    const valueField = fields.find((field) => field.name === 'Value')?.name ?? 'Value';
    const labelField = fields.find(
      (field) =>
        /class|name|label|description/i.test(field.name) && field.type === 'esriFieldTypeString',
    )?.name;
    if (!labelField) return null;

    const categories: Record<string, number> = {};
    const labels: Record<string, string> = {};
    for (const feature of data.features) {
      const value = String(feature.attributes[valueField]);
      categories[value] = 0;
      labels[value] = feature.attributes[labelField] || '';
    }
    return { categories, labels };
  } catch {
    return null;
  }
}

export async function submitGpJob(
  serviceUrl: string,
  task: string,
  payload: Record<string, string>,
  token: string | null,
  label: string,
): Promise<string> {
  const body = new URLSearchParams({ ...payload, f: 'json' });
  appendToken(body, token);

  const response = await fetch(`${serviceUrl}/${encodeURIComponent(task)}/submitJob`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  });
  const data = await response.json();
  if (data.error) {
    const message =
      typeof data.error === 'string'
        ? data.error
        : data.error.message ?? JSON.stringify(data.error);
    throw explainError(message, label);
  }
  if (!data.jobId) {
    throw new Error(`The ${label} service did not return a job id.`);
  }
  return data.jobId as string;
}

export interface GpJobSnapshot {
  status: string;
  messages: GpMessage[];
}

export async function pollGpJob(
  serviceUrl: string,
  task: string,
  jobId: string,
  token: string | null,
): Promise<GpJobSnapshot> {
  const params = new URLSearchParams({ f: 'json' });
  appendToken(params, token);
  const response = await fetch(
    `${serviceUrl}/${encodeURIComponent(task)}/jobs/${jobId}?${params.toString()}`,
  );
  const data = await response.json();
  if (data.error) {
    throw new Error(data.error.message ?? 'Job status query failed');
  }
  return {
    status: data.jobStatus ?? 'esriJobSubmitted',
    messages: data.messages ?? [],
  };
}

export function parseJobFilename(
  messages: GpMessage[],
  pattern: 'saved-to' | 'raster-written',
): string | null {
  const regex =
    pattern === 'saved-to'
      ? /Saved to:\s*(.+)/i
      : /Raster written to:\s*(.+)/i;

  for (const message of messages) {
    const match = message.description?.match(regex);
    if (!match) continue;
    const parts = match[1].trim().replace(/\\/g, '/').split('/');
    return parts[parts.length - 1] || null;
  }
  return null;
}

const OCCURRENCE_PAGE = 5000;

export async function fetchOccurrenceFeatures(species: string): Promise<OccurrenceFeature[]> {
  const itemsUrl = `${DEFAULT_SDM_INPUTS.occurrences.replace(/\/$/, '')}/items`;
  const features: OccurrenceFeature[] = [];
  let offset = 0;

  while (true) {
    const params = new URLSearchParams({
      species,
      limit: String(OCCURRENCE_PAGE),
      offset: String(offset),
      f: 'json',
    });
    const response = await fetch(`${itemsUrl}?${params.toString()}`);
    const data = await response.json();
    const batch: OccurrenceFeature[] = data.features ?? [];
    if (batch.length === 0) break;
    features.push(...batch);
    if ((data.numberReturned ?? batch.length) < OCCURRENCE_PAGE) break;
    offset += OCCURRENCE_PAGE;
  }

  return features;
}

export { GP_SERVICES };
