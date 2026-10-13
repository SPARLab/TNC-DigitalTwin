// ============================================================================
// Pixel histograms for suitability rasters.
//
// Full extent uses the service histogram (or the raster attribute table for
// categories). These image services do not allow computeHistograms, so the
// analysis extent is counted from raw pixels that fall inside the boundary.
// ============================================================================

import ImageryLayer from '@arcgis/core/layers/ImageryLayer';
import Extent from '@arcgis/core/geometry/Extent';
import { ANALYSIS_EXTENT_BOUNDARIES } from '../components/Experiences/analysisExtentLayer';
import type { RasterScope } from '../components/Experiences/types';
import { layerRasterInfo } from './layerRasterInfo';
import {
  mosaicRuleQueryValue,
  resolveMosaicRule,
  type MosaicRuleJson,
} from './mosaicSelection';

export type HistogramExtent = 'analysis' | 'full';

export interface HistogramBin {
  min: number;
  max: number;
  count: number;
  label: string;
}

export interface PixelHistogram {
  bins: HistogramBin[];
  total: number;
  bandCount: number;
  /** True when counts come from a downsampled pixel request. */
  approximate: boolean;
}

interface EsriPolygon {
  rings: number[][][];
  spatialReference: { wkid: number };
}

interface ArcGisError {
  error?: { message?: string; details?: string[] };
}

const GEOGRAPHIC_WKIDS = new Set([4326, 4269, 4267]);
const MAX_SAMPLE_PIXELS = 250_000;
const histogramCache = new Map<string, PixelHistogram>();
const wkidCache = new Map<string, number>();
const boundaryCache = new Map<string, EsriPolygon>();
const layerCache = new Map<string, ImageryLayer>();

function appendToken(params: URLSearchParams, token: string | null): void {
  if (token) params.set('token', token);
}

function serviceRoot(url: string): string {
  return url.trim().replace(/\/+$/, '');
}

function arcgisMessage(error: ArcGisError['error'], fallback: string): string {
  const detail = error?.details?.filter(Boolean).join(' ');
  if (error?.message && detail) return `${error.message} ${detail}`;
  return error?.message || fallback;
}

export function formatHistogramValue(value: number): string {
  if (!Number.isFinite(value)) return '—';
  const abs = Math.abs(value);
  const digits = abs >= 100 ? 0 : abs >= 10 ? 1 : abs >= 1 ? 2 : 3;
  return value.toLocaleString('en-US', { maximumFractionDigits: digits });
}

export function histogramFromClassCounts(
  rows: Array<{ value: number; count: number }>,
): PixelHistogram {
  const bins = rows
    .filter((row) => row.count > 0 && Number.isFinite(row.value))
    .sort((a, b) => a.value - b.value)
    .map((row) => ({
      min: row.value,
      max: row.value,
      count: row.count,
      label: formatHistogramValue(row.value),
    }));
  return {
    bins,
    total: bins.reduce((sum, bin) => sum + bin.count, 0),
    bandCount: 1,
    approximate: false,
  };
}

/** Equal-width bins from an ImageServer histogram. Drops empty edges. */
export function histogramFromCounts(
  min: number,
  max: number,
  counts: number[],
  categorical: boolean,
): PixelHistogram {
  if (!Number.isFinite(min) || !Number.isFinite(max) || counts.length === 0) {
    return { bins: [], total: 0, bandCount: 1, approximate: false };
  }

  const width = counts.length === 1 ? 0 : (max - min) / counts.length;
  const bins: HistogramBin[] = counts.map((count, index) => {
    const start = min + index * width;
    const end = index === counts.length - 1 ? max : min + (index + 1) * width;
    const label =
      categorical && width <= 1.01
        ? String(Math.floor(start + 1e-6))
        : `${formatHistogramValue(start)}–${formatHistogramValue(end)}`;
    return { min: start, max: end, count: Number(count) || 0, label };
  });

  const trimmed = categorical ? bins.filter((bin) => bin.count > 0) : trimEmptyEdges(bins);
  const nonempty = trimmed.filter((bin) => bin.count > 0);
  const sparse = nonempty.length > 0 && nonempty.length < trimmed.length * 0.3;
  const visible = categorical || sparse ? nonempty : trimmed;

  return {
    bins: downsampleBins(visible, categorical ? 40 : 48),
    total: counts.reduce((sum, count) => sum + (Number(count) || 0), 0),
    bandCount: 1,
    approximate: false,
  };
}

function trimEmptyEdges(bins: HistogramBin[]): HistogramBin[] {
  let start = 0;
  let end = bins.length;
  while (start < end && bins[start].count === 0) start += 1;
  while (end > start && bins[end - 1].count === 0) end -= 1;
  return bins.slice(start, end);
}

function downsampleBins(bins: HistogramBin[], maxBins: number): HistogramBin[] {
  if (bins.length <= maxBins) return bins;
  const groupSize = Math.ceil(bins.length / maxBins);
  const grouped: HistogramBin[] = [];
  for (let index = 0; index < bins.length; index += groupSize) {
    const slice = bins.slice(index, index + groupSize);
    const min = slice[0].min;
    const max = slice[slice.length - 1].max;
    grouped.push({
      min,
      max,
      count: slice.reduce((sum, bin) => sum + bin.count, 0),
      label: `${formatHistogramValue(min)}–${formatHistogramValue(max)}`,
    });
  }
  return grouped;
}

export function mergeBoundaryPolygons(
  features: Array<{ geometry?: { rings?: number[][][] } | null }>,
  wkid: number,
): EsriPolygon | null {
  const rings = features.flatMap((feature) => feature.geometry?.rings ?? []);
  if (rings.length === 0) return null;
  return { rings, spatialReference: { wkid } };
}

/** Even-odd test so holes in a boundary are excluded. */
export function pointInPolygon(x: number, y: number, rings: number[][][]): boolean {
  let inside = false;
  for (const ring of rings) {
    for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
      const yi = ring[i][1];
      const yj = ring[j][1];
      if ((yi > y) === (yj > y)) continue;
      const xi = ring[i][0];
      const xj = ring[j][0];
      const xIntersect = ((xj - xi) * (y - yi)) / (yj - yi) + xi;
      if (x < xIntersect) inside = !inside;
    }
  }
  return inside;
}

export function sampleDimensions(
  extentWidth: number,
  extentHeight: number,
  pixelSize: number,
): { width: number; height: number; approximate: boolean } {
  const nativeWidth = Math.max(1, Math.round(extentWidth / Math.max(pixelSize, 1e-9)));
  const nativeHeight = Math.max(1, Math.round(extentHeight / Math.max(pixelSize, 1e-9)));
  const nativeCount = nativeWidth * nativeHeight;
  if (nativeCount <= MAX_SAMPLE_PIXELS) {
    return { width: nativeWidth, height: nativeHeight, approximate: false };
  }
  const scale = Math.sqrt(MAX_SAMPLE_PIXELS / nativeCount);
  return {
    width: Math.max(1, Math.round(nativeWidth * scale)),
    height: Math.max(1, Math.round(nativeHeight * scale)),
    approximate: true,
  };
}

interface SampleExtent {
  xmin: number;
  ymin: number;
  xmax: number;
  ymax: number;
}

export function histogramFromSamples(
  values: ArrayLike<number>,
  width: number,
  height: number,
  extent: SampleExtent,
  options: {
    categorical: boolean;
    mask?: ArrayLike<number> | null;
    rings?: number[][][] | null;
    noDataValue?: number | null;
    approximate: boolean;
  },
): PixelHistogram {
  const counts = new Map<number, number>();
  let min = Infinity;
  let max = -Infinity;
  let total = 0;
  const cellWidth = (extent.xmax - extent.xmin) / width;
  const cellHeight = (extent.ymax - extent.ymin) / height;

  for (let row = 0; row < height; row += 1) {
    for (let col = 0; col < width; col += 1) {
      const index = row * width + col;
      if (options.mask && options.mask[index] === 0) continue;
      const value = values[index];
      if (!Number.isFinite(value) || value === options.noDataValue) continue;
      if (options.rings) {
        const x = extent.xmin + (col + 0.5) * cellWidth;
        const y = extent.ymax - (row + 0.5) * cellHeight;
        if (!pointInPolygon(x, y, options.rings)) continue;
      }
      total += 1;
      if (options.categorical) {
        const key = Math.round(value);
        counts.set(key, (counts.get(key) ?? 0) + 1);
      } else {
        if (value < min) min = value;
        if (value > max) max = value;
      }
    }
  }

  if (total === 0) {
    return { bins: [], total: 0, bandCount: 1, approximate: options.approximate };
  }

  if (options.categorical && counts.size <= 40) {
    return {
      ...histogramFromClassCounts(
        [...counts.entries()].map(([value, count]) => ({ value, count })),
      ),
      approximate: options.approximate,
    };
  }

  const binCount = 32;
  const span = max - min || 1;
  const binWidth = span / binCount;
  const bins = Array.from({ length: binCount }, () => 0);
  for (let row = 0; row < height; row += 1) {
    for (let col = 0; col < width; col += 1) {
      const index = row * width + col;
      if (options.mask && options.mask[index] === 0) continue;
      const value = values[index];
      if (!Number.isFinite(value) || value === options.noDataValue) continue;
      if (options.rings) {
        const x = extent.xmin + (col + 0.5) * cellWidth;
        const y = extent.ymax - (row + 0.5) * cellHeight;
        if (!pointInPolygon(x, y, options.rings)) continue;
      }
      const binIndex = Math.min(binCount - 1, Math.max(0, Math.floor((value - min) / binWidth)));
      bins[binIndex] += 1;
    }
  }

  const parsed = histogramFromCounts(min, max, bins, false);
  return { ...parsed, approximate: options.approximate };
}

async function readJson(response: Response): Promise<ArcGisError & Record<string, unknown>> {
  const json = (await response.json().catch(() => null)) as
    | (ArcGisError & Record<string, unknown>)
    | null;
  if (!json) {
    throw new Error(`Histogram request failed: HTTP ${response.status}`);
  }
  return json;
}

async function imageServiceWkid(url: string, token: string | null): Promise<number> {
  const cached = wkidCache.get(url);
  if (cached != null) return cached;

  const params = new URLSearchParams({ f: 'json' });
  appendToken(params, token);
  const response = await fetch(`${serviceRoot(url)}?${params.toString()}`);
  const json = await readJson(response);
  if (json.error) {
    throw new Error(arcgisMessage(json.error, 'Could not read the raster service.'));
  }
  const spatialReference = json.spatialReference as
    | { wkid?: number; latestWkid?: number }
    | undefined;
  const wkid = spatialReference?.latestWkid ?? spatialReference?.wkid;
  if (typeof wkid !== 'number') {
    throw new Error('Could not read the raster spatial reference.');
  }
  wkidCache.set(url, wkid);
  return wkid;
}

function simplifyOffset(wkid: number, resolutionMeters: number | null): number {
  const meters = Math.max(resolutionMeters ?? 100, 50);
  return GEOGRAPHIC_WKIDS.has(wkid) ? meters / 111_320 : meters;
}

async function analysisPolygon(
  scope: RasterScope,
  wkid: number,
  resolutionMeters: number | null,
  token: string | null,
): Promise<EsriPolygon> {
  const cacheKey = `${scope}:${wkid}`;
  const cached = boundaryCache.get(cacheKey);
  if (cached) return cached;

  const params = new URLSearchParams({
    f: 'json',
    where: '1=1',
    outFields: '',
    returnGeometry: 'true',
    outSR: String(wkid),
    maxAllowableOffset: String(simplifyOffset(wkid, resolutionMeters)),
  });
  appendToken(params, token);

  const response = await fetch(
    `${ANALYSIS_EXTENT_BOUNDARIES[scope].url}/query?${params.toString()}`,
  );
  const json = await readJson(response);
  if (json.error) {
    throw new Error(arcgisMessage(json.error, 'Could not load the analysis extent.'));
  }
  const features =
    (json.features as Array<{ geometry?: { rings?: number[][][] } }> | undefined) ?? [];
  const polygon = mergeBoundaryPolygons(features, wkid);
  if (!polygon) {
    throw new Error('The analysis extent has no polygon geometry.');
  }
  boundaryCache.set(cacheKey, polygon);
  return polygon;
}

function appendMosaicRule(params: URLSearchParams, rule: MosaicRuleJson | null): void {
  const encoded = mosaicRuleQueryValue(rule);
  if (encoded) params.set('mosaicRule', encoded);
}

async function fetchAttributeTable(
  url: string,
  token: string | null,
  mosaicRule: MosaicRuleJson | null,
): Promise<PixelHistogram | null> {
  const params = new URLSearchParams({ f: 'json' });
  appendToken(params, token);
  appendMosaicRule(params, mosaicRule);
  const response = await fetch(`${serviceRoot(url)}/rasterAttributeTable?${params.toString()}`);
  const json = await readJson(response);
  if (json.error || !Array.isArray(json.features)) return null;

  const rows = (json.features as Array<{ attributes?: Record<string, unknown> }>)
    .map((feature) => feature.attributes ?? {})
    .map((attributes) => ({
      value: numericField(attributes, 'value'),
      count: numericField(attributes, 'count'),
    }))
    .filter((row): row is { value: number; count: number } => row.value != null && row.count != null);

  if (rows.length === 0) return null;
  return histogramFromClassCounts(rows);
}

function numericField(attributes: Record<string, unknown>, name: string): number | null {
  const key = Object.keys(attributes).find((candidate) => candidate.toLowerCase() === name);
  const value = key ? attributes[key] : undefined;
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

async function fetchStoredHistogram(
  url: string,
  categorical: boolean,
  token: string | null,
  mosaicRule: MosaicRuleJson | null,
): Promise<PixelHistogram | null> {
  const params = new URLSearchParams({ f: 'json' });
  appendToken(params, token);
  appendMosaicRule(params, mosaicRule);
  const response = await fetch(`${serviceRoot(url)}/histograms?${params.toString()}`);
  const json = await readJson(response);
  if (json.error) return null;
  const histograms = json.histograms as
    | Array<{ min?: number; max?: number; counts?: number[] }>
    | undefined;
  const first = histograms?.[0];
  if (!first || !Array.isArray(first.counts) || first.counts.length === 0) return null;

  const min = Number(first.min);
  const max = Number(first.max);
  const width = first.counts.length === 1 ? 0 : (max - min) / first.counts.length;
  if (categorical && width > 1.01) return null;

  const parsed = histogramFromCounts(min, max, first.counts, categorical);
  return { ...parsed, bandCount: Math.max(histograms?.length ?? 1, 1) };
}

function imageryLayerFor(
  url: string,
  token: string | null,
  mosaicRule: MosaicRuleJson | null,
): ImageryLayer {
  const key = `${url}|${token ?? ''}|${mosaicRuleQueryValue(mosaicRule) ?? ''}`;
  const existing = layerCache.get(key);
  if (existing) return existing;
  const layer = new ImageryLayer({
    url,
    customParameters: token ? { token } : undefined,
    ...(mosaicRule ? { mosaicRule } : {}),
  });
  layerCache.set(key, layer);
  return layer;
}

function polygonExtent(polygon: EsriPolygon): { xmin: number; ymin: number; xmax: number; ymax: number } {
  let xmin = Infinity;
  let ymin = Infinity;
  let xmax = -Infinity;
  let ymax = -Infinity;
  for (const ring of polygon.rings) {
    for (const point of ring) {
      if (point[0] < xmin) xmin = point[0];
      if (point[0] > xmax) xmax = point[0];
      if (point[1] < ymin) ymin = point[1];
      if (point[1] > ymax) ymax = point[1];
    }
  }
  return { xmin, ymin, xmax, ymax };
}

async function histogramFromLayerPixels(options: {
  url: string;
  token: string | null;
  mosaicRule: MosaicRuleJson | null;
  categorical: boolean;
  resolutionMeters: number | null;
  rings: number[][][] | null;
  extent: SampleExtent;
}): Promise<PixelHistogram> {
  const layer = imageryLayerFor(options.url, options.token, options.mosaicRule);
  await layer.load();
  const rasterInfo = layerRasterInfo(layer);
  const pixelSize = rasterInfo?.pixelSize?.x || options.resolutionMeters || 100;
  const noData = rasterInfo?.noDataValue;
  const noDataValue = typeof noData === 'number' ? noData : null;
  const sample = sampleDimensions(
    options.extent.xmax - options.extent.xmin,
    options.extent.ymax - options.extent.ymin,
    pixelSize,
  );
  const extent = new Extent({
    xmin: options.extent.xmin,
    ymin: options.extent.ymin,
    xmax: options.extent.xmax,
    ymax: options.extent.ymax,
    spatialReference: layer.spatialReference ?? undefined,
  });
  const pixelData = (await layer.fetchPixels(extent, sample.width, sample.height)) as {
    pixelBlock?: {
      pixels?: ArrayLike<number>[] | ArrayLike<number>;
      width?: number;
      height?: number;
      mask?: ArrayLike<number> | null;
    };
    extent?: SampleExtent;
  };
  const block = pixelData?.pixelBlock;
  const rawPixels = block?.pixels;
  const values = Array.isArray(rawPixels) ? rawPixels[0] : rawPixels;
  const width = block?.width ?? sample.width;
  const height = block?.height ?? sample.height;
  if (!values || width < 1 || height < 1) {
    throw new Error('The raster service did not return pixel values.');
  }
  const returned = pixelData.extent ?? options.extent;
  return histogramFromSamples(values, width, height, returned, {
    categorical: options.categorical,
    mask: block?.mask,
    rings: options.rings,
    noDataValue,
    approximate: sample.approximate,
  });
}

export async function fetchRasterHistogram(options: {
  url: string;
  extent: HistogramExtent;
  scope: RasterScope;
  resolutionMeters: number | null;
  categorical: boolean;
  mosaicTag?: string | null;
  token: string | null;
  signal?: AbortSignal;
}): Promise<PixelHistogram> {
  const mosaicTag = options.mosaicTag ?? null;
  // Precomputed /histograms is the mosaic default (Bio01). Per-item charts
  // have to sample the locked raster instead.
  const mosaicRule = mosaicTag
    ? await resolveMosaicRule({ rasterUrl: options.url, tag: mosaicTag, token: options.token })
    : null;
  const cacheKey = [
    options.url,
    mosaicRuleQueryValue(mosaicRule) ?? '',
    options.extent,
    options.extent === 'analysis' ? options.scope : '',
    options.categorical ? 'cat' : 'cont',
  ].join('|');
  const cached = histogramCache.get(cacheKey);
  if (cached) return cached;

  if (options.signal?.aborted) {
    throw new DOMException('Aborted', 'AbortError');
  }

  let result: PixelHistogram | null = null;
  if (options.extent === 'full' && !mosaicRule) {
    if (options.categorical) {
      result = await fetchAttributeTable(options.url, options.token, null);
    }
    if (!result) {
      result = await fetchStoredHistogram(options.url, options.categorical, options.token, null);
    }
  }
  if (!result && options.extent === 'full') {
    const layer = imageryLayerFor(options.url, options.token, mosaicRule);
    await layer.load();
    const full = layer.fullExtent;
    if (!full) throw new Error('The raster has no extent.');
    result = await histogramFromLayerPixels({
      url: options.url,
      token: options.token,
      mosaicRule,
      categorical: options.categorical,
      resolutionMeters: options.resolutionMeters,
      rings: null,
      extent: { xmin: full.xmin, ymin: full.ymin, xmax: full.xmax, ymax: full.ymax },
    });
  } else if (!result) {
    const wkid = await imageServiceWkid(options.url, options.token);
    const polygon = await analysisPolygon(
      options.scope,
      wkid,
      options.resolutionMeters,
      options.token,
    );
    result = await histogramFromLayerPixels({
      url: options.url,
      token: options.token,
      mosaicRule,
      categorical: options.categorical,
      resolutionMeters: options.resolutionMeters,
      rings: polygon.rings,
      extent: polygonExtent(polygon),
    });
  }

  if (options.signal?.aborted) {
    throw new DOMException('Aborted', 'AbortError');
  }
  if (!result) {
    throw new Error('The raster service did not return a histogram.');
  }
  histogramCache.set(cacheKey, result);
  return result;
}
