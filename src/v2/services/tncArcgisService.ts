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

export interface ArcGISLegendItem {
  label: string;
  value?: string | number;
  imageData?: string;
  contentType?: string;
  width?: number;
  height?: number;
  swatchColor?: string;
  minValue?: number;
  maxValue?: number;
}

export interface ArcGISLayerLegend {
  layerId: number;
  layerName: string;
  rendererType: 'simple' | 'uniqueValue' | 'classBreaks';
  filterField?: string;
  items: ArcGISLegendItem[];
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

function toCssRgba(color: unknown): string | undefined {
  if (!Array.isArray(color) || color.length < 3) return undefined;
  const [r, g, b, a] = color;
  if (typeof r !== 'number' || typeof g !== 'number' || typeof b !== 'number') return undefined;
  const alpha = typeof a === 'number' ? Math.max(0, Math.min(1, a / 255)) : 1;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function getSymbolSwatchColor(symbol: unknown): string | undefined {
  if (!isObject(symbol)) return undefined;
  const fillColor = toCssRgba(symbol.color);
  if (fillColor) return fillColor;
  if (isObject(symbol.outline)) {
    const outlineColor = toCssRgba(symbol.outline.color);
    if (outlineColor) return outlineColor;
  }
  return undefined;
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

  const serviceUrl = `${base}/${path}/${type}`;
  if (type === 'ImageServer') {
    return serviceUrl;
  }

  const layerId = Number.isInteger(meta.layerIdInService) ? meta.layerIdInService : 0;
  return `${serviceUrl}/${layerId}`;
}

/** Build service-level ArcGIS REST URL (without /layerId suffix). */
export function buildServiceRootUrl(meta: CatalogLayer['catalogMeta']): string {
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

  return `${base}/${path}/${type}`;
}

function parseLegendEndpointLayers(payload: Record<string, unknown>): ArcGISLayerLegend[] {
  const rawLayers = payload.layers;
  if (!Array.isArray(rawLayers)) return [];

  return rawLayers
    .map((raw): ArcGISLayerLegend | null => {
      if (!isObject(raw)) return null;
      const layerId = raw.layerId;
      if (typeof layerId !== 'number' || !Number.isFinite(layerId)) return null;

      const layerName = typeof raw.layerName === 'string' && raw.layerName.trim()
        ? raw.layerName.trim()
        : `Layer ${layerId}`;

      const legendRaw = Array.isArray(raw.legend) ? raw.legend : [];
      const items: ArcGISLegendItem[] = legendRaw
        .map((entry): ArcGISLegendItem | null => {
          if (!isObject(entry)) return null;
          const label = typeof entry.label === 'string' ? entry.label.trim() : '';
          const imageData = typeof entry.imageData === 'string' && entry.imageData.trim()
            ? entry.imageData
            : undefined;
          const contentType = typeof entry.contentType === 'string' ? entry.contentType : undefined;
          const width = typeof entry.width === 'number' && Number.isFinite(entry.width) ? entry.width : undefined;
          const height = typeof entry.height === 'number' && Number.isFinite(entry.height) ? entry.height : undefined;
          return {
            label: label || 'Legend item',
            imageData,
            contentType,
            width,
            height,
          };
        })
        .filter((entry): entry is ArcGISLegendItem => !!entry);

      return {
        layerId,
        layerName,
        rendererType: items.length > 1 ? 'uniqueValue' : 'simple',
        items,
      };
    })
    .filter((layer): layer is ArcGISLayerLegend => !!layer);
}

function parseRendererLegend(
  payload: Record<string, unknown>,
  fallbackLayerId: number,
): ArcGISLayerLegend | null {
  const layerName = typeof payload.name === 'string' && payload.name.trim()
    ? payload.name.trim()
    : `Layer ${fallbackLayerId}`;

  const drawingInfo = isObject(payload.drawingInfo) ? payload.drawingInfo : null;
  const renderer = drawingInfo && isObject(drawingInfo.renderer) ? drawingInfo.renderer : null;
  if (!renderer) return null;

  const rendererType = typeof renderer.type === 'string' ? renderer.type : '';
  if (rendererType === 'uniqueValue') {
    const uniqueValueInfos = Array.isArray(renderer.uniqueValueInfos) ? renderer.uniqueValueInfos : [];
    const filterField = typeof renderer.field1 === 'string' && renderer.field1.trim()
      ? renderer.field1
      : (typeof renderer.field === 'string' && renderer.field.trim() ? renderer.field : undefined);
    const items: ArcGISLegendItem[] = uniqueValueInfos
      .map((entry): ArcGISLegendItem | null => {
        if (!isObject(entry)) return null;
        const label = typeof entry.label === 'string' ? entry.label.trim() : '';
        const value = typeof entry.value === 'string' || typeof entry.value === 'number'
          ? entry.value
          : undefined;
        const swatchColor = getSymbolSwatchColor(entry.symbol);
        return {
          label: label || (value !== undefined ? String(value) : 'Legend item'),
          value,
          swatchColor,
        };
      })
      .filter((entry): entry is ArcGISLegendItem => !!entry);

    return {
      layerId: fallbackLayerId,
      layerName,
      rendererType: 'uniqueValue',
      filterField,
      items,
    };
  }

  if (rendererType === 'classBreaks') {
    const classBreakInfos = Array.isArray(renderer.classBreakInfos) ? renderer.classBreakInfos : [];
    const items: ArcGISLegendItem[] = classBreakInfos
      .map((entry): ArcGISLegendItem | null => {
        if (!isObject(entry)) return null;
        const label = typeof entry.label === 'string' ? entry.label.trim() : '';
        const minValue = typeof entry.classMinValue === 'number' ? entry.classMinValue : undefined;
        const maxValue = typeof entry.classMaxValue === 'number' ? entry.classMaxValue : undefined;
        const swatchColor = getSymbolSwatchColor(entry.symbol);
        return {
          label: label || 'Range',
          minValue,
          maxValue,
          swatchColor,
        };
      })
      .filter((entry): entry is ArcGISLegendItem => !!entry);

    return {
      layerId: fallbackLayerId,
      layerName,
      rendererType: 'classBreaks',
      items,
    };
  }

  const simpleLabel = typeof renderer.label === 'string' && renderer.label.trim()
    ? renderer.label.trim()
    : layerName;
  return {
    layerId: fallbackLayerId,
    layerName,
    rendererType: 'simple',
    items: [{
      label: simpleLabel,
      swatchColor: getSymbolSwatchColor(renderer.symbol),
    }],
  };
}

/** Fetch legend entries for the selected ArcGIS layer. */
export async function fetchLayerLegend(meta: CatalogLayer['catalogMeta']): Promise<ArcGISLayerLegend | null> {
  if (!meta) return null;
  const targetLayerId = Number.isInteger(meta.layerIdInService) ? meta.layerIdInService : 0;
  const serviceRootUrl = buildServiceRootUrl(meta);

  // Strategy 1: Try /legend endpoint at the service root.
  try {
    const legendUrl = `${serviceRootUrl}/legend?f=json`;
    const legendJson = await fetchArcGisJson(legendUrl, 'Legend fetch failed');
    const parsedLayers = parseLegendEndpointLayers(legendJson);
    if (parsedLayers.length > 0) {
      return parsedLayers.find(layer => layer.layerId === targetLayerId) ?? parsedLayers[0];
    }
  } catch {
    // Fall through to renderer-based parsing.
  }

  // Strategy 2: Fallback to layer metadata renderer (V1 behavior).
  const layerUrl = `${buildServiceUrl(meta).replace(/\/+$/, '')}?f=json`;
  const layerJson = await fetchArcGisJson(layerUrl, 'Layer metadata fetch failed');
  return parseRendererLegend(layerJson, targetLayerId);
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
