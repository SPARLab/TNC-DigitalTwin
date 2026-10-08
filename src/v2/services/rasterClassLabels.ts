// ============================================================================
// Class names for categorical analysis rasters.
//
// Templated copies often keep only the pixel code. The source catalog
// ImageServer legend still has the class names. NLCD legends publish those
// names without the codes, so names are joined back to the USGS class codes.
// ============================================================================

import { DATASETS_TABLE_URL } from '../config/geoprocessing';
import { fetchCategoryLabels } from './geoprocessingService';

export interface ClassLegendEntry {
  label: string;
  values?: Array<string | number>;
  /** Center pixel of the legend swatch, when the service sent one. */
  color?: [number, number, number] | null;
}

export interface ClassSwatch {
  value: number;
  label: string;
  color: [number, number, number];
}

export interface ClassLabelResult {
  categories: Record<string, number>;
  labels: Record<string, string>;
}

/** NLCD legend wording → pixel code. Keys are normalizeLegendKey() output. */
const NLCD_CLASS_CODES: Record<string, number> = {
  'open water': 11,
  'perennial snow ice': 12,
  'perennial ice snow': 12,
  'developed open space': 21,
  'developed low intensity': 22,
  'developed medium intensity': 23,
  'developed high intensity': 24,
  'barren land': 31,
  'barren land rock sand clay': 31,
  'deciduous forest': 41,
  'evergreen forest': 42,
  'mixed forest': 43,
  'dwarf scrub': 51,
  'shrub scrub': 52,
  'shrubland': 52,
  'grassland herbaceous': 71,
  'sedge herbaceous': 72,
  lichens: 73,
  moss: 74,
  'pasture hay': 81,
  'cultivated crops': 82,
  'woody wetlands': 90,
  'emergent herbaceous wetlands': 95,
};

export function normalizeLegendKey(label: string): string {
  return label
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function isNumericLabel(label: string): boolean {
  return /^-?\d+(\.\d+)?$/.test(label.trim());
}

function numericLegendValue(entry: ClassLegendEntry): number | null {
  const raw = entry.values?.[0];
  if (typeof raw === 'number' && Number.isFinite(raw)) return raw;
  if (typeof raw === 'string' && isNumericLabel(raw)) return Number(raw);
  return null;
}

/**
 * Map a legend to pixel-code → class name.
 * Prefers explicit numeric legend values. Falls back to NLCD names when the
 * legend lists class names only, which is how the USA NLCD image service works.
 */
export function labelsFromLegend(entries: ClassLegendEntry[]): ClassLabelResult | null {
  const direct: Record<string, string> = {};
  for (const entry of entries) {
    const label = entry.label?.trim();
    if (!label || isNumericLabel(label)) continue;
    const value = numericLegendValue(entry);
    if (value == null) continue;
    direct[String(value)] = label;
  }
  if (Object.keys(direct).length > 0) return toResult(direct);

  const thematic: Record<string, string> = {};
  let named = 0;
  for (const entry of entries) {
    const label = entry.label?.trim();
    if (!label || isNumericLabel(label)) continue;
    named += 1;
    const code = NLCD_CLASS_CODES[normalizeLegendKey(label)];
    if (code == null) continue;
    thematic[String(code)] = label;
  }
  if (named > 0 && Object.keys(thematic).length >= Math.min(8, named)) {
    return toResult(thematic);
  }
  return null;
}

/** Join legend names to pixel codes and keep each class's swatch color. */
export function swatchesFromLegend(entries: ClassLegendEntry[]): ClassSwatch[] | null {
  const labeled = labelsFromLegend(entries);
  if (!labeled) return null;
  const colorByLabel = new Map<string, [number, number, number]>();
  for (const entry of entries) {
    const label = entry.label?.trim();
    if (label && entry.color) colorByLabel.set(label, entry.color);
  }
  const swatches: ClassSwatch[] = [];
  for (const [value, label] of Object.entries(labeled.labels)) {
    const color = colorByLabel.get(label);
    if (!color) continue;
    swatches.push({ value: Number(value), label, color });
  }
  return swatches.length > 0 ? swatches.sort((a, b) => a.value - b.value) : null;
}

function toResult(labels: Record<string, string>): ClassLabelResult {
  const categories: Record<string, number> = {};
  for (const value of Object.keys(labels)) categories[value] = 0;
  return { categories, labels };
}

/**
 * Keep legend classes that actually occur in the raster.
 * `present` is null when the service has no class counts; the full legend stays.
 * An empty intersection also keeps the legend so a code mismatch cannot blank the list.
 */
export function filterLabelsToPresent(
  result: ClassLabelResult,
  present: ReadonlySet<number> | null,
): ClassLabelResult {
  if (!present || present.size === 0) return result;
  const labels: Record<string, string> = {};
  const categories: Record<string, number> = {};
  for (const [value, label] of Object.entries(result.labels)) {
    const code = Number(value);
    if (!Number.isFinite(code) || !present.has(code)) continue;
    labels[value] = label;
    categories[value] = result.categories[value] ?? 0;
  }
  if (Object.keys(labels).length === 0) return result;
  return { categories, labels };
}

function appendToken(params: URLSearchParams, token: string | null): void {
  if (token) params.set('token', token);
}

function imageServerUrl(serverBaseUrl: string, servicePath: string): string | null {
  const base = serverBaseUrl.trim().replace(/\/+$/, '');
  const path = servicePath.trim().replace(/^\/+/, '').replace(/\/+$/, '');
  if (!base || !path) return null;
  const root = /\/rest\/services$/i.test(base) ? base : `${base}/rest/services`;
  return `${root}/${path}/ImageServer`;
}

async function readJson(response: Response): Promise<Record<string, unknown> | null> {
  return (await response.json().catch(() => null)) as Record<string, unknown> | null;
}

async function fetchLegendEntries(
  imageServerUrlValue: string,
  token: string | null,
): Promise<ClassLegendEntry[]> {
  const params = new URLSearchParams({ f: 'json' });
  appendToken(params, token);
  const response = await fetch(
    `${imageServerUrlValue.replace(/\/+$/, '')}/legend?${params.toString()}`,
  );
  const json = await readJson(response);
  if (!json || json.error) return [];
  const layers = Array.isArray(json.layers) ? json.layers : [];
  const first = layers.find((layer) => layer && typeof layer === 'object') as
    | { legend?: unknown }
    | undefined;
  const legend = Array.isArray(first?.legend) ? first.legend : [];
  const entries: ClassLegendEntry[] = [];
  for (const entry of legend) {
    if (!entry || typeof entry !== 'object') continue;
    const label = (entry as { label?: unknown }).label;
    const values = (entry as { values?: unknown }).values;
    const imageData = (entry as { imageData?: unknown }).imageData;
    if (typeof label !== 'string') continue;
    entries.push({
      label,
      values: Array.isArray(values)
        ? values.filter((value): value is string | number =>
            typeof value === 'string' || typeof value === 'number',
          )
        : undefined,
      color: typeof imageData === 'string' ? await sampleLegendSwatch(imageData) : null,
    });
  }
  return entries;
}

async function fetchDatasetImageServer(
  datasetId: number,
  token: string | null,
): Promise<string | null> {
  const params = new URLSearchParams({
    f: 'json',
    where: `id=${datasetId}`,
    outFields: 'id,server_base_url,service_path,has_image_server',
    returnGeometry: 'false',
  });
  appendToken(params, token);
  const response = await fetch(`${DATASETS_TABLE_URL}/query?${params.toString()}`);
  const json = await readJson(response);
  if (!json || json.error) return null;
  const features = Array.isArray(json.features) ? json.features : [];
  const attributes = (features[0] as { attributes?: Record<string, unknown> } | undefined)?.attributes;
  if (!attributes || attributes.has_image_server === 0) return null;
  const base = typeof attributes.server_base_url === 'string' ? attributes.server_base_url : '';
  const path = typeof attributes.service_path === 'string' ? attributes.service_path : '';
  return imageServerUrl(base, path);
}

function numericAttribute(attributes: Record<string, unknown>, name: string): number | null {
  const key = Object.keys(attributes).find((candidate) => candidate.toLowerCase() === name);
  const value = key ? attributes[key] : undefined;
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

/** Pixel codes with a positive count in the analysis raster's attribute table. */
async function fetchPresentClassValues(
  rasterUrl: string,
  token: string | null,
): Promise<Set<number> | null> {
  const params = new URLSearchParams({ f: 'json' });
  appendToken(params, token);
  const response = await fetch(
    `${rasterUrl.replace(/\/+$/, '')}/rasterAttributeTable?${params.toString()}`,
  );
  const json = await readJson(response);
  if (!json || json.error || !Array.isArray(json.features)) return null;

  const present = new Set<number>();
  let sawCount = false;
  for (const feature of json.features) {
    const attributes = (feature as { attributes?: Record<string, unknown> } | null)?.attributes;
    if (!attributes) continue;
    const value = numericAttribute(attributes, 'value');
    const count = numericAttribute(attributes, 'count');
    if (value == null || count == null) continue;
    sawCount = true;
    if (count > 0) present.add(value);
  }
  return sawCount ? present : null;
}

const labelCache = new Map<string, ClassLabelResult | null>();

async function resolveClassLabels(options: {
  rasterUrl: string;
  datasetId: number | null;
  token: string | null;
}): Promise<ClassLabelResult | null> {
  const fromTable = await fetchCategoryLabels(options.rasterUrl);
  if (fromTable && Object.keys(fromTable.labels).length > 0) return fromTable;

  const ownLegend = labelsFromLegend(await fetchLegendEntries(options.rasterUrl, options.token));
  if (ownLegend) return ownLegend;

  if (options.datasetId == null) return null;

  const sourceUrl = await fetchDatasetImageServer(options.datasetId, options.token);
  if (!sourceUrl || sourceUrl === options.rasterUrl.replace(/\/+$/, '')) return null;

  return labelsFromLegend(await fetchLegendEntries(sourceUrl, options.token));
}

export async function fetchRasterClassLabels(options: {
  rasterUrl: string;
  datasetId: number | null;
  token: string | null;
}): Promise<ClassLabelResult | null> {
  const cacheKey = `${options.rasterUrl}|${options.datasetId ?? ''}`;
  if (labelCache.has(cacheKey)) return labelCache.get(cacheKey) ?? null;

  const labels = await resolveClassLabels(options);
  if (!labels) {
    labelCache.set(cacheKey, null);
    return null;
  }

  const present = await fetchPresentClassValues(options.rasterUrl, options.token).catch(() => null);
  const filtered = filterLabelsToPresent(labels, present);
  labelCache.set(cacheKey, filtered);
  return filtered;
}

const swatchCache = new Map<string, ClassSwatch[] | null>();

/**
 * Class colors from the source image service legend.
 * Templated copies often invent their own unique-value colors; this restores
 * the original swatches (for example NLCD land-cover colors).
 */
export async function fetchRasterClassSwatches(options: {
  rasterUrl: string;
  datasetId: number | null;
  token: string | null;
}): Promise<ClassSwatch[] | null> {
  const cacheKey = `${options.rasterUrl}|${options.datasetId ?? ''}`;
  if (swatchCache.has(cacheKey)) return swatchCache.get(cacheKey) ?? null;

  const own = swatchesFromLegend(await fetchLegendEntries(options.rasterUrl, options.token));
  if (own) {
    swatchCache.set(cacheKey, own);
    return own;
  }

  if (options.datasetId == null) {
    swatchCache.set(cacheKey, null);
    return null;
  }

  const sourceUrl = await fetchDatasetImageServer(options.datasetId, options.token);
  if (!sourceUrl) {
    swatchCache.set(cacheKey, null);
    return null;
  }

  const source = swatchesFromLegend(await fetchLegendEntries(sourceUrl, options.token));
  swatchCache.set(cacheKey, source);
  return source;
}

/** Center pixel of a legend PNG swatch. */
export async function samplePngCenterColor(bytes: Uint8Array): Promise<[number, number, number] | null> {
  if (bytes.length < 24) return null;
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  let offset = 8;
  let width = 0;
  let height = 0;
  let colorType = 0;
  const idatParts: Uint8Array[] = [];

  while (offset + 8 <= bytes.length) {
    const length = view.getUint32(offset);
    const type = String.fromCharCode(
      bytes[offset + 4],
      bytes[offset + 5],
      bytes[offset + 6],
      bytes[offset + 7],
    );
    if (type === 'IHDR') {
      width = view.getUint32(offset + 8);
      height = view.getUint32(offset + 12);
      colorType = bytes[offset + 17];
    } else if (type === 'IDAT') {
      idatParts.push(bytes.subarray(offset + 8, offset + 8 + length));
    } else if (type === 'IEND') {
      break;
    }
    offset += 12 + length;
  }

  const channels = colorType === 6 ? 4 : colorType === 2 ? 3 : 0;
  if (!width || !height || !channels || idatParts.length === 0) return null;

  const raw = new Uint8Array(await inflateZlib(concatBytes(idatParts)));
  const stride = width * channels;
  let position = 0;
  let previous = new Uint8Array(stride);
  let center: [number, number, number] | null = null;
  const centerRow = Math.floor(height / 2);
  const centerColumn = Math.floor(width / 2) * channels;

  for (let row = 0; row < height; row += 1) {
    const filter = raw[position];
    position += 1;
    const scanline = new Uint8Array(stride);
    for (let index = 0; index < stride; index += 1) {
      const rawByte = raw[position];
      position += 1;
      const left = index >= channels ? scanline[index - channels] : 0;
      const up = previous[index];
      const upLeft = index >= channels ? previous[index - channels] : 0;
      scanline[index] = unfilterByte(filter, rawByte, left, up, upLeft);
    }
    if (row === centerRow) {
      center = [scanline[centerColumn], scanline[centerColumn + 1], scanline[centerColumn + 2]];
    }
    previous = scanline;
  }
  return center;
}

function unfilterByte(filter: number, value: number, left: number, up: number, upLeft: number): number {
  if (filter === 1) return (value + left) & 255;
  if (filter === 2) return (value + up) & 255;
  if (filter === 3) return (value + Math.floor((left + up) / 2)) & 255;
  if (filter === 4) {
    const estimate = left + up - upLeft;
    const leftDistance = Math.abs(estimate - left);
    const upDistance = Math.abs(estimate - up);
    const diagonalDistance = Math.abs(estimate - upLeft);
    const predictor = leftDistance <= upDistance && leftDistance <= diagonalDistance
      ? left
      : upDistance <= diagonalDistance
        ? up
        : upLeft;
    return (value + predictor) & 255;
  }
  return value;
}

function concatBytes(parts: Uint8Array[]): Uint8Array {
  const total = parts.reduce((sum, part) => sum + part.length, 0);
  const merged = new Uint8Array(total);
  let offset = 0;
  for (const part of parts) {
    merged.set(part, offset);
    offset += part.length;
  }
  return merged;
}

async function inflateZlib(data: Uint8Array): Promise<ArrayBuffer> {
  const source = new ReadableStream<Uint8Array>({
    start(controller) {
      controller.enqueue(data);
      controller.close();
    },
  });
  const decompressed = source.pipeThrough(new DecompressionStream('deflate'));
  const reader = decompressed.getReader();
  const parts: Uint8Array[] = [];
  let total = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    if (value) {
      parts.push(value);
      total += value.length;
    }
  }
  const merged = new Uint8Array(total);
  let offset = 0;
  for (const part of parts) {
    merged.set(part, offset);
    offset += part.length;
  }
  return merged.buffer;
}

async function sampleLegendSwatch(imageData: string): Promise<[number, number, number] | null> {
  const payload = imageData.includes(',') ? imageData.slice(imageData.indexOf(',') + 1) : imageData;
  try {
    const binary = atob(payload);
    const bytes = new Uint8Array(binary.length);
    for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index);
    return await samplePngCenterColor(bytes);
  } catch {
    return null;
  }
}
