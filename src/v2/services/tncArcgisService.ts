import type { CatalogLayer } from '../types';

export interface LayerSchema {
  fields: Array<Record<string, unknown>>;
  geometryType?: string;
  extent?: Record<string, unknown>;
  description?: string;
  copyrightText?: string;
}

export interface FeatureQueryResult {
  features: Array<Record<string, unknown>>;
  count: number;
}

interface ArcGISResponseError {
  message?: string;
  details?: unknown;
}

interface ArcGISJsonWithError {
  error?: ArcGISResponseError;
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function sanitizeArcGisBaseUrl(serverBaseUrl: string): string {
  const trimmed = serverBaseUrl.trim().replace(/\/+$/, '');
  if (!trimmed) {
    throw new Error('Invalid service URL: missing server base URL');
  }

  return /\/rest\/services$/i.test(trimmed) ? trimmed : `${trimmed}/rest/services`;
}

function getArcGISErrorMessage(payload: unknown): string | null {
  if (!isObject(payload)) return null;
  const maybeError = (payload as ArcGISJsonWithError).error;
  if (!isObject(maybeError)) return null;

  const message = typeof maybeError.message === 'string' ? maybeError.message : 'Unknown ArcGIS error';
  const details = Array.isArray(maybeError.details)
    ? maybeError.details.filter(detail => typeof detail === 'string').join(' ')
    : '';

  return details ? `${message} ${details}` : message;
}

async function fetchArcGisJson(url: string, operation: string): Promise<Record<string, unknown>> {
  let response: Response;
  try {
    response = await fetch(url);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown network error';
    throw new Error(`${operation}: network failure (${message})`);
  }

  if (!response.ok) {
    throw new Error(`${operation}: HTTP ${response.status}`);
  }

  let json: unknown;
  try {
    json = await response.json();
  } catch {
    throw new Error(`${operation}: malformed JSON response`);
  }

  if (!isObject(json)) {
    throw new Error(`${operation}: malformed response payload`);
  }

  const arcgisError = getArcGISErrorMessage(json);
  if (arcgisError) {
    throw new Error(`ArcGIS error: ${arcgisError}`);
  }

  return json;
}

/** Build full service URL from catalog metadata */
export function buildServiceUrl(meta: CatalogLayer['catalogMeta']): string {
  if (!meta) {
    throw new Error('Invalid service URL: missing catalog metadata');
  }

  const base = sanitizeArcGisBaseUrl(meta.serverBaseUrl);
  const path = meta.servicePath.trim().replace(/^\/+/, '').replace(/\/+$/, '');
  if (!path) {
    throw new Error('Invalid service URL: missing service path');
  }

  const type = meta.hasFeatureServer ? 'FeatureServer'
    : meta.hasMapServer ? 'MapServer'
      : meta.hasImageServer ? 'ImageServer'
        : null;

  if (!type) {
    throw new Error('Invalid service URL: no ArcGIS service type configured');
  }

  const layerId = Number.isInteger(meta.layerIdInService) ? meta.layerIdInService : 0;
  return `${base}/${path}/${type}/${layerId}`;
}

/** Fetch layer schema (fields, extent, geometry type) */
export async function fetchLayerSchema(url: string): Promise<LayerSchema> {
  const endpoint = `${url.replace(/\/+$/, '')}?f=json`;
  const json = await fetchArcGisJson(endpoint, 'Schema fetch failed');

  const rawFields = json.fields;
  if (rawFields !== undefined && !Array.isArray(rawFields)) {
    throw new Error('Schema fetch failed: malformed fields list');
  }

  const fields = (rawFields ?? []).filter(isObject);
  const geometryType = typeof json.geometryType === 'string' ? json.geometryType : undefined;
  const extent = isObject(json.extent) ? json.extent : undefined;
  const description = typeof json.description === 'string' ? json.description : undefined;
  const copyrightText = typeof json.copyrightText === 'string' ? json.copyrightText : undefined;

  return { fields, geometryType, extent, description, copyrightText };
}

/** Query features with WHERE clause */
export async function queryFeatures(
  url: string,
  where: string,
  options?: {
    outFields?: string[];
    returnGeometry?: boolean;
    returnCountOnly?: boolean;
  },
): Promise<FeatureQueryResult> {
  const safeWhere = where.trim() || '1=1';
  const params = new URLSearchParams({
    where: safeWhere,
    outFields: options?.outFields?.join(',') ?? '*',
    returnGeometry: String(options?.returnGeometry ?? true),
    returnCountOnly: String(options?.returnCountOnly ?? false),
    f: 'json',
  });

  const endpoint = `${url.replace(/\/+$/, '')}/query?${params.toString()}`;
  const json = await fetchArcGisJson(endpoint, 'Query failed');

  const rawFeatures = json.features;
  if (rawFeatures !== undefined && !Array.isArray(rawFeatures)) {
    throw new Error('Query failed: malformed features payload');
  }

  const features = (rawFeatures ?? []).filter(isObject);
  const countFromResponse = typeof json.count === 'number' ? json.count : undefined;

  return {
    features,
    count: countFromResponse ?? features.length,
  };
}

/** Validate WHERE clause by running count-only query */
export async function validateWhereClause(
  url: string,
  where: string,
): Promise<{ valid: boolean; count?: number; error?: string }> {
  try {
    const result = await queryFeatures(url, where, { returnCountOnly: true, returnGeometry: false });
    return { valid: true, count: result.count };
  } catch (error) {
    return {
      valid: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
