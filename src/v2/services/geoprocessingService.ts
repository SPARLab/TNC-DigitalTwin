// ============================================================================
// Geoprocessing helpers — catalog rasters, GP job submit/poll, occurrences.
//
// Jobs on this server typically require a portal token. Until v2 sign-in
// exists, a token stored by the twin_models mockup (`dev_token`) is reused.
// Requests still go out without one so a public service would just work.
// ============================================================================

import {
  ARCGIS_SERVER_URL,
  DATASETS_TABLE_URL,
  DEFAULT_SDM_INPUTS,
  GP_SERVICES,
  RASTERS_TABLE_URL,
  STORED_TOKEN_KEY,
} from '../config/geoprocessing';
import type {
  CatalogRaster,
  GpMessage,
  OccurrenceFeature,
  RunDownload,
  SdmCommonAreas,
  SdmComparison,
  SdmSummary,
  SuitabilityRunAnalysis,
} from '../components/Experiences/types';
import { bioclimMosaicTag } from './mosaicSelection';

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
  /** Curated short label (e.g. "SSURGO Drainage Class"); often empty on climate bands. */
  layer_name: string | null;
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
  'layer_name',
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

/** True when the string looks like a human label rather than a service slug / band code. */
function isHumanRasterLabel(value: string): boolean {
  return /\s/.test(value);
}

/**
 * Prefer the short analysis label over service-style slugs.
 *
 * Order: human `layer_name` → human raster `title` → dataset `display_title` →
 * any remaining layer_name / title. Dataset titles alone are not ideal for
 * multi-band stacks (they collapse Bio01/Bio02 to one CHELSA name).
 */
export function pickRasterDisplayTitle(
  row: Pick<RasterRow, 'title' | 'layer_name' | 'dataset_id'>,
  displayTitles: Map<number, string> = new Map(),
): string {
  const layerName = row.layer_name?.trim() || '';
  const rasterTitle = row.title?.trim() || '';
  const fromDataset =
    row.dataset_id != null ? displayTitles.get(row.dataset_id)?.trim() || '' : '';

  if (layerName && isHumanRasterLabel(layerName)) return layerName;
  if (rasterTitle && isHumanRasterLabel(rasterTitle)) return rasterTitle;
  if (fromDataset) return fromDataset;
  return layerName || rasterTitle || 'Untitled raster';
}

function mapRasterRows(
  rows: RasterRow[],
  displayTitles: Map<number, string>,
): CatalogRaster[] {
  return rows
    .filter((row) => row.is_active !== 0 && row.id != null && row.url)
    .map((row) => ({
      id: row.id as number,
      title: pickRasterDisplayTitle(row, displayTitles),
      url: row.url as string,
      resolution: row.resolution,
      scope: parseScope(row.scope),
      datasetId: row.dataset_id,
      thematicCategory: row.thematic_category?.trim() || 'Other',
      units: row.units?.trim() || '',
      valueMin: row.value_min,
      valueMax: row.value_max,
      mosaicTag: bioclimMosaicTag(row.layer_name, row.title),
    }))
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

export interface GpMapExtent {
  xmin: number;
  ymin: number;
  xmax: number;
  ymax: number;
  spatialReference?: { wkid?: number; latestWkid?: number };
}

/** Result drawing the GP map service actually produced for an output raster. */
export async function fetchGpOutputMapImage(
  serviceUrl: string,
  task: string,
  jobId: string,
  paramName: string,
  token: string | null,
): Promise<GpMapExtent | null> {
  const params = new URLSearchParams({ f: 'json' });
  appendToken(params, token);
  const response = await fetch(
    `${serviceUrl}/${encodeURIComponent(task)}/jobs/${jobId}/results/${encodeURIComponent(paramName)}?${params.toString()}`,
  );
  const data = await response.json();
  const extent = data?.value?.mapImage?.extent as GpMapExtent | undefined;
  if (!extent || !Number.isFinite(extent.xmin) || !Number.isFinite(extent.xmax)) return null;
  return extent;
}

/**
 * Name of the Weighted Raster Overlay output that carries the run analysis.
 * Keep in sync with `name="run_analysis"` in suitability_modeler.pyt.
 */
export const RUN_ANALYSIS_PARAM = 'run_analysis';

/**
 * Accept the tool's JSON string (or an already parsed object). Returns null for
 * anything that is not a run analysis, so older jobs and bad payloads are skipped.
 */
export function parseRunAnalysis(value: unknown): SuitabilityRunAnalysis | null {
  let parsed: unknown = value;
  if (typeof value === 'string') {
    try {
      parsed = JSON.parse(value);
    } catch {
      return null;
    }
  }
  if (!parsed || typeof parsed !== 'object') return null;
  const candidate = parsed as Partial<SuitabilityRunAnalysis>;
  if (candidate.type !== 'suitability_run_analysis') return null;
  if (!Array.isArray(candidate.bands) || !candidate.histogram || !candidate.cells) return null;
  return candidate as SuitabilityRunAnalysis;
}

/** Run analysis for a finished job, or null when the tool did not write one. */
export async function fetchGpRunAnalysis(
  serviceUrl: string,
  task: string,
  jobId: string,
  token: string | null,
): Promise<SuitabilityRunAnalysis | null> {
  const params = new URLSearchParams({ f: 'json' });
  appendToken(params, token);
  const response = await fetch(
    `${serviceUrl}/${encodeURIComponent(task)}/jobs/${jobId}/results/${encodeURIComponent(RUN_ANALYSIS_PARAM)}?${params.toString()}`,
  );
  const data = await response.json().catch(() => null);
  if (!data || data.error) return null;
  return parseRunAnalysis(data.value);
}

/**
 * PNG the map service actually writes. Requesting format=tiff on this service
 * still returns a .png href, so that response is never offered as a TIFF.
 */
/**
 * Map service export for a job's output. `f=json` answers with a link to a temporary
 * image; `f=image` answers with the image itself, which is the one to save later
 * because the temporary file is cleaned up by the server.
 */
export function gpJobExportUrl(
  mapServerUrl: string,
  jobId: string,
  extent: GpMapExtent,
  format: 'json' | 'image' = 'json',
): string {
  const sr = extent.spatialReference?.latestWkid ?? extent.spatialReference?.wkid ?? 32611;
  const params = new URLSearchParams({
    bbox: [extent.xmin, extent.ymin, extent.xmax, extent.ymax].join(','),
    bboxSR: String(sr),
    imageSR: String(sr),
    size: '1024,1024',
    format: 'png',
    transparent: 'true',
    f: format,
  });
  return `${mapServerUrl}/jobs/${jobId}/export?${params.toString()}`;
}

export async function fetchGpJobPngUrl(
  mapServerUrl: string,
  jobId: string,
  extent: GpMapExtent,
): Promise<string | null> {
  const response = await fetch(gpJobExportUrl(mapServerUrl, jobId, extent));
  const data = await response.json();
  return typeof data?.href === 'string' && data.href.startsWith('http') ? data.href : null;
}

const PUBLIC_TIFF = /Public TIFF:\s*(\S+)/i;

function publicTiffUrl(value: string): string | null {
  const url = /^https?:\/\//i.test(value)
    ? value
    : `${ARCGIS_SERVER_URL}/rest/directories/${value.replace(/^\/+/, '')}`;
  return /\.tiff?($|\?)/i.test(url) ? url : null;
}

/** GeoTIFF copied into arcgisoutput by the suitability tool. */
export function tiffUrlFromMessages(messages: GpMessage[]): string | null {
  for (const message of [...messages].reverse()) {
    const match = message.description?.match(PUBLIC_TIFF);
    if (!match) continue;
    const url = publicTiffUrl(match[1].trim());
    if (url) return url;
  }
  return null;
}

/** Plain labels for the file suffixes the SDM tools publish ("<jobId>_<suffix>.tif"). */
const SDM_TIFF_LABELS: Record<string, string> = {
  sdm_result: 'Habitat suitability',
  sdm_difference: 'Difference (B − A)',
  sdm_threshold_change: 'Threshold change',
  sdm_common_count: 'Runs suitable (count)',
  sdm_common: 'Suitable in every run',
};

/** Every GeoTIFF a job published, in the order it announced them. */
export function tiffDownloadsFromMessages(messages: GpMessage[]): RunDownload[] {
  const downloads: RunDownload[] = [];
  const seen = new Set<string>();
  for (const message of messages) {
    const match = message.description?.match(PUBLIC_TIFF);
    if (!match) continue;
    const url = publicTiffUrl(match[1].trim());
    if (!url || seen.has(url)) continue;
    seen.add(url);
    const suffix = url.match(/_(sdm_[a-z_]+)\.tiff?/i)?.[1]?.toLowerCase();
    downloads.push({ label: (suffix && SDM_TIFF_LABELS[suffix]) || 'GeoTIFF', url });
  }
  return downloads;
}

/** Name of the JSON output every SDM tool writes. */
export const SDM_SUMMARY_PARAM = 'summary_json';

/**
 * Accept a tool's JSON output as a string or an already parsed object. Returns
 * null unless it is an object whose `type` is the expected one.
 */
function parseTypedJson<T extends { type: string }>(value: unknown, type: T['type']): T | null {
  let parsed: unknown = value;
  if (typeof value === 'string') {
    try {
      parsed = JSON.parse(value);
    } catch {
      return null;
    }
  }
  if (!parsed || typeof parsed !== 'object') return null;
  return (parsed as { type?: unknown }).type === type ? (parsed as T) : null;
}

export const parseSdmSummary = (value: unknown) => parseTypedJson<SdmSummary>(value, 'sdm_summary');
export const parseSdmComparison = (value: unknown) =>
  parseTypedJson<SdmComparison>(value, 'sdm_comparison');
export const parseSdmCommonAreas = (value: unknown) =>
  parseTypedJson<SdmCommonAreas>(value, 'sdm_common_suitability');

/** One output parameter of a finished job (a JSON string, object, or raster descriptor). */
export async function fetchGpResultValue(
  serviceUrl: string,
  task: string,
  jobId: string,
  paramName: string,
  token: string | null,
): Promise<unknown> {
  const params = new URLSearchParams({ f: 'json' });
  appendToken(params, token);
  const response = await fetch(
    `${serviceUrl}/${encodeURIComponent(task)}/jobs/${jobId}/results/${encodeURIComponent(paramName)}?${params.toString()}`,
  );
  const data = await response.json().catch(() => null);
  if (!data || data.error) return null;
  return data.value ?? null;
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
