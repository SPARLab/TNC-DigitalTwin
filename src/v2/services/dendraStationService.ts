// ============================================================================
// Dendra Station Service — Queries per-type sensor feature services.
//
// Catalog `dendra_format` services (e.g. Dangermond_*_Datastreams) expose:
//   Layer 0: * Latest     (live readings — used by Live Monitoring)
//   Layer 1: * Locations  (station points — used by catalog browse/map)
//   Table 2: * Data       (time-series readings)
//
// Station browse always targets the Locations layer. Datastream lists and chart
// points bridge through the legacy Dendra_Stations FeatureServer.
// ============================================================================

// ── Types (matching the new per-type service schema) ─────────────────────────

export interface DendraStation {
  station_id: number;
  dendra_st_id: string;
  station_name: string;
  station_description: string | null;
  latitude: number;
  longitude: number;
  elevation: number | null;
  time_zone: string;
  is_active: number; // 1 = active
  /** Present on older schemas; new Locations layers expose `category` instead. */
  sensor_id: number | null;
  sensor_name: string | null;
  sensor_thing_type_id: string | null;
  category: string | null;
  datastream_count: number;
}

export interface DendraSummary {
  datastream_id: number;
  dendra_ds_id: string;
  datastream_name: string;
  variable: string;
  unit: string;
  station_id: number;
  station_name: string;
  total_records: number;
  first_reading_time: number | null; // epoch ms
  last_reading_time: number | null;
  min_value: number | null;
  max_value: number | null;
  avg_value: number | null;
}

/** A chartable value column discovered from the service Latest layer. */
export interface DendraDatastreamType {
  /** Latest-layer field name, e.g. `rainfall_cumulative`. */
  fieldKey: string;
  /** Human label, e.g. `Rainfall Cumulative`. */
  label: string;
  /** Cadence tag when known, e.g. `10 min` / `Daily`. */
  frequencyLabel: string | null;
}

/** A single time-series reading: timestamp + value */
export interface DendraTimeSeriesPoint {
  timestamp: number; // epoch ms
  value: number;
}

// ── ArcGIS response types ────────────────────────────────────────────────────

interface ArcGISFeature<T> {
  attributes: T;
  geometry?: { x: number; y: number };
}

interface ArcGISQueryResponse<T> {
  features?: ArcGISFeature<T>[];
  error?: { message: string };
}

// ── Helpers ──────────────────────────────────────────────────────────────────

/** Build a full FeatureServer URL from catalog metadata */
export function buildServiceUrl(serverBaseUrl: string, servicePath: string): string {
  const base = serverBaseUrl.replace(/\/+$/, '');
  const protocol = base.startsWith('http') ? '' : 'https://';
  // serverBaseUrl from catalog already includes /server/rest/services
  const url = `${protocol}${base}/${servicePath}/FeatureServer`;
  console.log(`[Dendra buildServiceUrl] base="${serverBaseUrl}", path="${servicePath}" → ${url}`);
  return url;
}

interface FeatureServerIndex {
  stationsLayerId: number;
  latestLayerId: number | null;
}

const serviceIndexCache = new Map<string, FeatureServerIndex>();

/**
 * New `_Datastreams` services expose:
 *   Layer 0: * Latest   (live readings — wrong for station browse)
 *   Layer 1: * Locations (stations — correct)
 *   Table 2: * Data     (time series)
 * Older per-type services used Layer 0 for stations. Resolve by name first.
 */
async function resolveServiceIndex(serviceUrl: string): Promise<FeatureServerIndex> {
  const cached = serviceIndexCache.get(serviceUrl);
  if (cached) return cached;

  const res = await fetch(`${serviceUrl}?f=json`);
  if (!res.ok) {
    throw new Error(`Dendra service metadata failed: HTTP ${res.status}`);
  }
  const json = await res.json();
  if (json.error) {
    throw new Error(`Dendra service metadata error: ${json.error.message}`);
  }

  const layers: Array<{ id: number; name?: string }> = json.layers ?? [];
  const locations = layers.find((layer) => /location|station/i.test(layer.name ?? ''));
  const latest = layers.find((layer) => /latest/i.test(layer.name ?? ''));
  const stationsLayerId = locations?.id ?? layers[0]?.id ?? 0;
  const index: FeatureServerIndex = {
    stationsLayerId,
    latestLayerId: latest?.id ?? null,
  };
  serviceIndexCache.set(serviceUrl, index);
  console.log(
    `[Dendra] Resolved layers for ${serviceUrl} → stations=${stationsLayerId}` +
      (locations?.name ? ` ("${locations.name}")` : '') +
      `, latest=${index.latestLayerId ?? 'none'}` +
      (latest?.name ? ` ("${latest.name}")` : ''),
  );
  return index;
}

async function resolveStationsLayerId(serviceUrl: string): Promise<number> {
  return (await resolveServiceIndex(serviceUrl)).stationsLayerId;
}

async function resolveLatestLayerId(serviceUrl: string): Promise<number | null> {
  return (await resolveServiceIndex(serviceUrl)).latestLayerId;
}

/** Generic ArcGIS table/layer query */
async function queryTable<T>(
  serviceUrl: string,
  tableIndex: number,
  options?: {
    where?: string;
    outFields?: string[];
    returnGeometry?: boolean;
    resultRecordCount?: number;
  },
): Promise<T[]> {
  const params = new URLSearchParams({
    where: options?.where ?? '1=1',
    outFields: options?.outFields?.join(',') ?? '*',
    f: 'json',
  });
  if (typeof options?.returnGeometry === 'boolean') {
    params.set('returnGeometry', String(options.returnGeometry));
  }
  if (typeof options?.resultRecordCount === 'number') {
    params.set('resultRecordCount', String(options.resultRecordCount));
  }

  const url = `${serviceUrl}/${tableIndex}/query?${params.toString()}`;
  console.log(`[Dendra Query] Requesting: ${url}`);
  const res = await fetch(url);
  if (!res.ok) {
    console.error(`[Dendra Query] HTTP ${res.status} for ${url}`);
    throw new Error(`Dendra query failed: HTTP ${res.status}`);
  }

  const json: ArcGISQueryResponse<T> = await res.json();
  if (json.error) {
    console.error(`[Dendra Query] Error response:`, json.error);
    throw new Error(`Dendra query error: ${json.error.message}`);
  }
  return (json.features ?? []).map(f => f.attributes);
}

function readNullableString(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

function readNullableNumber(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

function normalizeStation(raw: Record<string, unknown>): DendraStation | null {
  const stationId = readNullableNumber(raw.station_id);
  const stationName = readNullableString(raw.station_name);
  const latitude = readNullableNumber(raw.latitude);
  const longitude = readNullableNumber(raw.longitude);
  if (stationId == null || !stationName || latitude == null || longitude == null) return null;

  const category = readNullableString(raw.category);
  return {
    station_id: stationId,
    dendra_st_id: readNullableString(raw.dendra_st_id) ?? '',
    station_name: stationName,
    station_description: readNullableString(raw.station_description),
    latitude,
    longitude,
    elevation: readNullableNumber(raw.elevation),
    time_zone: readNullableString(raw.time_zone) ?? '',
    is_active: readNullableNumber(raw.is_active) ?? 0,
    sensor_id: readNullableNumber(raw.sensor_id),
    sensor_name: readNullableString(raw.sensor_name) ?? category,
    sensor_thing_type_id: readNullableString(raw.sensor_thing_type_id),
    category,
    datastream_count: readNullableNumber(raw.datastream_count) ?? 0,
  };
}

/** Fields present on Locations layers in the new `_Datastreams` services. */
const STATION_OUT_FIELDS = [
  'station_id',
  'dendra_st_id',
  'station_name',
  'station_description',
  'latitude',
  'longitude',
  'elevation',
  'time_zone',
  'is_active',
  'category',
  'datastream_count',
];

// ── Public API ───────────────────────────────────────────────────────────────

/** Fetch stations (Locations layer) from a Dendra sensor service */
export async function fetchStations(serviceUrl: string): Promise<DendraStation[]> {
  const stationsLayerId = await resolveStationsLayerId(serviceUrl);
  const rows = await queryTable<Record<string, unknown>>(serviceUrl, stationsLayerId, {
    outFields: STATION_OUT_FIELDS,
    returnGeometry: false,
  });
  return rows.map(normalizeStation).filter((row): row is DendraStation => row != null);
}

// Legacy monolithic service — datastream catalog + datapoints for charts.
const V0_BASE = 'https://dangermondpreserve-spatial.com/server/rest/services/Dendra_Stations/FeatureServer';

const LATEST_METADATA_FIELDS = new Set([
  'objectid',
  'station_id',
  'station_name',
  'latitude',
  'longitude',
  'elevation',
  'category',
  'latest_time',
  'observed_at',
  'shape',
  'globalid',
  'fid',
  'id',
  'sensor_id',
  'unit',
  'datastream_count',
]);

/** Snake_case key comparable to Latest layer value columns. */
export function toLatestFieldKey(datastreamName: string): string {
  return datastreamName
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

/** Whether a legacy datastream name maps to a Latest value column. */
export function datastreamMatchesLatestField(
  datastreamName: string,
  fieldKey: string,
  allFieldKeys: string[] = [],
): boolean {
  const resolved = resolveLatestFieldForDatastream(
    datastreamName,
    allFieldKeys.length > 0 ? allFieldKeys : [fieldKey],
  );
  return resolved != null && resolved.toLowerCase() === fieldKey.trim().toLowerCase();
}

/**
 * Map a datastream display name onto the best (longest) Latest column.
 * e.g. "Ranchbot Cumulative Daily Rainfall" → cumulative_daily_rainfall
 *      "Rainfall" → rainfall (not rainfall_cumulative)
 */
export function resolveLatestFieldForDatastream(
  datastreamName: string,
  fieldKeys: string[],
): string | null {
  const column = toLatestFieldKey(datastreamName);
  if (!column) return null;
  const sorted = [...fieldKeys]
    .map((field) => field.trim().toLowerCase())
    .filter(Boolean)
    .sort((a, b) => b.length - a.length);

  for (const field of sorted) {
    if (column === field) return field;
    if (column.endsWith(`_${field}`)) return field;
  }
  return null;
}

/** Title-case a Latest field for UI labels. */
export function prettifyLatestField(fieldKey: string): string {
  return fieldKey
    .split('_')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function inferFrequencyFromText(...parts: Array<string | null | undefined>): string | null {
  const text = parts.filter(Boolean).join(' ').toLowerCase();
  if (!text) return null;
  if (/\bdaily\b/.test(text)) return 'Daily';
  if (/\bhourly\b/.test(text)) return 'Hourly';
  if (/\b15[\s-]?min/.test(text)) return '15 min';
  if (/\b10[\s-]?min/.test(text)) return '10 min';
  if (/\b5[\s-]?min/.test(text)) return '5 min';
  if (/\b30[\s-]?min/.test(text)) return '30 min';
  return null;
}

function formatIntervalMinutes(medianMin: number): string {
  if (medianMin >= 1300 && medianMin <= 1560) return 'Daily';
  if (medianMin >= 50 && medianMin <= 70) return 'Hourly';
  if (medianMin < 90) return `${Math.max(1, Math.round(medianMin))} min`;
  if (medianMin < 1440) {
    const hours = Math.round(medianMin / 60);
    return hours === 1 ? 'Hourly' : `${hours} hr`;
  }
  const days = Math.round(medianMin / 1440);
  return days === 1 ? 'Daily' : `${days} day`;
}

async function estimateFrequencyFromDatapoints(datastreamId: number): Promise<string | null> {
  try {
    const url =
      `${V0_BASE}/4/query?where=${encodeURIComponent(`datastream_id=${datastreamId}`)}` +
      '&outFields=timestamp_utc&orderByFields=timestamp_utc%20DESC&resultRecordCount=6&returnGeometry=false&f=json';
    const res = await fetch(url);
    if (!res.ok) return null;
    const json = await res.json();
    const times = (json.features ?? [])
      .map((feature: { attributes?: { timestamp_utc?: number } }) => feature.attributes?.timestamp_utc)
      .filter((value: unknown): value is number => typeof value === 'number' && Number.isFinite(value));
    if (times.length < 2) return null;
    const deltasMin: number[] = [];
    for (let i = 0; i < times.length - 1; i += 1) {
      const delta = (times[i]! - times[i + 1]!) / 60_000;
      if (delta > 0 && delta < 60 * 24 * 40) deltasMin.push(delta);
    }
    if (deltasMin.length === 0) return null;
    deltasMin.sort((a, b) => a - b);
    const median = deltasMin[Math.floor(deltasMin.length / 2)]!;
    return formatIntervalMinutes(median);
  } catch {
    return null;
  }
}

/**
 * Discover chartable datastream types from the service's Latest layer columns,
 * then enrich with cadence by matching legacy Datastreams rows.
 */
export async function fetchDatastreamTypeCatalog(
  serviceUrl: string,
  sampleStationIds: number[] = [],
): Promise<DendraDatastreamType[]> {
  const latestLayerId = await resolveLatestLayerId(serviceUrl);
  if (latestLayerId == null) return [];

  const metaRes = await fetch(`${serviceUrl}/${latestLayerId}?f=json`);
  if (!metaRes.ok) {
    throw new Error(`Latest layer metadata failed: HTTP ${metaRes.status}`);
  }
  const meta = await metaRes.json();
  if (meta.error) {
    throw new Error(`Latest layer metadata error: ${meta.error.message}`);
  }

  const fields: Array<{ name?: string; type?: string }> = meta.fields ?? [];
  const fieldKeys = fields
    .filter((field) => {
      const name = (field.name ?? '').trim();
      if (!name || LATEST_METADATA_FIELDS.has(name.toLowerCase())) return false;
      return /esriFieldType(Double|Single|Integer|SmallInteger)/i.test(field.type ?? '');
    })
    .map((field) => (field.name ?? '').trim())
    .filter(Boolean);

  if (fieldKeys.length === 0) return [];

  type CatalogRow = {
    id: number;
    name: string;
    description: string | null;
  };
  const sampleIds = sampleStationIds.filter((id) => Number.isFinite(id)).slice(0, 8);
  const catalogRows: CatalogRow[] = [];
  for (const stationId of sampleIds) {
    const rows = await queryTable<{
      id: number;
      name: string;
      description: string | null;
    }>(V0_BASE, 3, {
      where: `station_id=${stationId}`,
      outFields: ['id', 'name', 'description'],
      returnGeometry: false,
      resultRecordCount: 500,
    });
    catalogRows.push(...rows);
  }

  const types: DendraDatastreamType[] = [];
  for (const fieldKey of fieldKeys) {
    const matches = catalogRows.filter((row) =>
      datastreamMatchesLatestField(row.name, fieldKey, fieldKeys),
    );
    const representative = matches[0];
    let frequencyLabel = inferFrequencyFromText(
      representative?.name,
      representative?.description,
    );
    if (!frequencyLabel && representative?.id != null) {
      frequencyLabel = await estimateFrequencyFromDatapoints(representative.id);
    }
    types.push({
      fieldKey,
      label: prettifyLatestField(fieldKey),
      frequencyLabel,
    });
  }

  return types.sort((a, b) => a.label.localeCompare(b.label));
}

/**
 * Fetch datastream summaries for a station.
 *
 * New `_Datastreams` FeatureServers no longer publish a Summary table — Table 2
 * is raw time-series Data. List datastreams from the legacy Dendra_Stations
 * service (same bridge used for chart points), optionally narrowed to Latest
 * value columns (preferred) or a category token hint.
 */
export async function fetchSummariesForStation(
  _serviceUrl: string,
  stationId: number,
  options?: {
    categoryHint?: string | null;
    latestValueFields?: string[] | null;
  },
): Promise<DendraSummary[]> {
  const rows = await queryTable<{
    id: number;
    dendra_ds_id: string;
    station_id: number;
    name: string;
    variable: string | null;
    unit: string | null;
  }>(V0_BASE, 3, {
    where: `station_id=${stationId}`,
    outFields: ['id', 'dendra_ds_id', 'station_id', 'name', 'variable', 'unit'],
    returnGeometry: false,
    resultRecordCount: 500,
  });

  const valueFields = (options?.latestValueFields ?? [])
    .map((field) => field.trim().toLowerCase())
    .filter(Boolean);

  let sourceRows = rows;
  if (valueFields.length > 0) {
    const matched = rows.filter((row) =>
      valueFields.some((field) => datastreamMatchesLatestField(row.name, field, valueFields)),
    );
    if (matched.length > 0) {
      sourceRows = matched;
    } else {
      // Fall back to category token filter when Latest fields don't match names.
      const hint = options?.categoryHint?.trim().toLowerCase();
      if (hint) {
        const tokens = hint.split(/[^a-z0-9]+/).filter((token) => token.length >= 3);
        const byHint = rows.filter((row) => {
          const haystack = `${row.name ?? ''} ${row.variable ?? ''}`.toLowerCase();
          return tokens.some((token) => haystack.includes(token));
        });
        if (byHint.length > 0) sourceRows = byHint;
      }
    }
  } else {
    const hint = options?.categoryHint?.trim().toLowerCase();
    if (hint) {
      const tokens = hint.split(/[^a-z0-9]+/).filter((token) => token.length >= 3);
      const filtered = rows.filter((row) => {
        const haystack = `${row.name ?? ''} ${row.variable ?? ''}`.toLowerCase();
        return tokens.some((token) => haystack.includes(token));
      });
      if (filtered.length > 0) sourceRows = filtered;
    }
  }

  return sourceRows.map((row) => ({
    datastream_id: row.id,
    dendra_ds_id: row.dendra_ds_id,
    datastream_name: row.name,
    variable: row.variable ?? '',
    unit: row.unit ?? '',
    station_id: row.station_id,
    station_name: '',
    total_records: 0,
    first_reading_time: null,
    last_reading_time: null,
    min_value: null,
    max_value: null,
    avg_value: null,
  }));
}

// ── Time Series (via legacy v0 service) ──────────────────────────────────────
//
// Chart data bridges through Dendra_Stations:
//   Table 3: Datastreams  → has dendra_ds_id (matches Summary.dendra_ds_id)
//   Table 4: Datapoints   → has datastream_id, timestamp_utc, value
//
// Bridge: Summary.dendra_ds_id → v0 Table 3 → get id → v0 Table 4 data.

/** Cache: dendra_ds_id → v0 numeric datastream id */
const dsIdCache = new Map<string, number>();

/** Resolve a v2 dendra_ds_id to the v0 numeric datastream id */
async function resolveV0DatastreamId(dendraDsId: string): Promise<number> {
  const cached = dsIdCache.get(dendraDsId);
  if (cached !== undefined) return cached;

  const where = `dendra_ds_id='${dendraDsId}'`;
  const url = `${V0_BASE}/3/query?where=${encodeURIComponent(where)}&outFields=id&f=json`;

  const res = await fetch(url);
  if (!res.ok) throw new Error(`v0 datastream lookup failed: HTTP ${res.status}`);

  const json = await res.json();
  if (json.error) throw new Error(`v0 datastream lookup error: ${json.error.message}`);

  const features: { attributes: { id: number } }[] = json.features ?? [];
  if (features.length === 0) {
    throw new Error(`No v0 datastream found for dendra_ds_id "${dendraDsId}"`);
  }

  const v0Id = features[0].attributes.id;
  dsIdCache.set(dendraDsId, v0Id);
  return v0Id;
}

/** Return value from fetchTimeSeries — includes which datastream was resolved */
export interface TimeSeriesResult {
  points: DendraTimeSeriesPoint[];
  datastreamName: string;
}

export interface DendraTimeSeriesQueryOptions {
  startDate?: string;
  endDate?: string;
}

function toArcGisDateLiteral(date: string, useDayEnd: boolean): string | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return null;
  return `${date} ${useDayEnd ? '23:59:59' : '00:00:00'}`;
}

/**
 * Fetch time-series data for a specific datastream.
 *
 * Bridges from the v2 per-type Summary (dendra_ds_id) to the v0 legacy
 * service (datapoints table) to get actual readings.
 *
 * ArcGIS maxRecordCount is 2000 — we fetch the most recent non-null points.
 */
export async function fetchTimeSeries(
  _serviceUrl: string,
  _stationId: number,
  datastreamName: string,
  dendraDsId: string,
  options?: DendraTimeSeriesQueryOptions,
): Promise<TimeSeriesResult> {
  console.log(`[Dendra TimeSeries] Resolving dendra_ds_id "${dendraDsId}" → v0 datastream...`);

  const v0DsId = await resolveV0DatastreamId(dendraDsId);
  console.log(`[Dendra TimeSeries] Resolved to v0 datastream id=${v0DsId}, fetching points...`);

  // Some legacy datastreams have long stretches of null values. If we query
  // oldest-first without a value filter, ArcGIS can return a 2000-row window
  // containing only nulls, which renders as an empty chart despite counts.
  const whereParts = [`datastream_id=${v0DsId}`, 'value IS NOT NULL'];
  const startLiteral = options?.startDate ? toArcGisDateLiteral(options.startDate, false) : null;
  const endLiteral = options?.endDate ? toArcGisDateLiteral(options.endDate, true) : null;
  if (startLiteral) whereParts.push(`timestamp_utc >= DATE '${startLiteral}'`);
  if (endLiteral) whereParts.push(`timestamp_utc <= DATE '${endLiteral}'`);
  const where = whereParts.join(' AND ');

  const hasServerDateBounds = Boolean(startLiteral || endLiteral);
  const parsePoints = (features: { attributes: { timestamp_utc: number; value: number } }[]) =>
    features
      .map((feature) => ({
        timestamp: feature.attributes.timestamp_utc,
        value: Number(feature.attributes.value),
      }))
      .filter((point) => point.timestamp != null && Number.isFinite(point.value));

  let points: DendraTimeSeriesPoint[];

  if (!hasServerDateBounds) {
    // Legacy fallback for unconstrained chart opens: get most recent 2000 points.
    const url =
      `${V0_BASE}/4/query?where=${encodeURIComponent(where)}` +
      `&outFields=timestamp_utc,value` +
      `&orderByFields=timestamp_utc DESC` +
      `&resultRecordCount=2000` +
      `&f=json`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Dendra time series query failed: HTTP ${res.status}`);
    const json = await res.json();
    if (json.error) throw new Error(`Dendra time series error: ${json.error.message}`);
    const features: { attributes: { timestamp_utc: number; value: number } }[] = json.features ?? [];
    points = parsePoints(features).reverse();
  } else {
    // For explicit date windows, page through full result set in ascending order.
    const batchSize = 2000;
    const batches: DendraTimeSeriesPoint[] = [];
    let offset = 0;

    while (true) {
      const url =
        `${V0_BASE}/4/query?where=${encodeURIComponent(where)}` +
        `&outFields=timestamp_utc,value` +
        `&orderByFields=timestamp_utc ASC` +
        `&resultRecordCount=${batchSize}` +
        `&resultOffset=${offset}` +
        `&f=json`;
      const res = await fetch(url);
      if (!res.ok) throw new Error(`Dendra time series query failed: HTTP ${res.status}`);
      const json = await res.json();
      if (json.error) throw new Error(`Dendra time series error: ${json.error.message}`);
      const features: { attributes: { timestamp_utc: number; value: number } }[] = json.features ?? [];
      if (features.length === 0) break;

      batches.push(...parsePoints(features));
      if (features.length < batchSize) break;
      offset += batchSize;
    }

    points = batches;
  }

  console.log(`[Dendra TimeSeries] Got ${points.length} points for "${datastreamName}"`);
  return { points, datastreamName };
}

/** Derive the Table 1 column name from a datastream name (e.g., "Air Temp Avg" → "air_temp_avg") */
export function toColumnName(datastreamName: string): string {
  return normalizeDatastreamTypeName(datastreamName).toLowerCase().replace(/\s+/g, '_');
}

// ── Formatting ───────────────────────────────────────────────────────────────

/**
 * Collapse whitespace in datastream names for type pickers / matching.
 * Source data sometimes publishes near-duplicates like "Rainfall Cumulative"
 * vs "Rainfall  Cumulative" (double space).
 */
export function normalizeDatastreamTypeName(name: string | null | undefined): string {
  return (name ?? '').trim().replace(/\s+/g, ' ');
}

/** Case-insensitive key for comparing datastream type names. */
export function datastreamTypeKey(name: string | null | undefined): string {
  return normalizeDatastreamTypeName(name).toLowerCase();
}

/** Normalize station names for display (e.g., "dangermond_Oaks" -> "Oaks"). */
export function formatStationDisplayName(stationName: string | null | undefined): string {
  if (!stationName) return 'Unknown';
  return stationName.replace(/^dangermond_/i, '').replace(/_/g, ' ').trim() || 'Unknown';
}

/** Format an epoch timestamp to a readable date string */
export function formatTimestamp(epochMs: number | null): string {
  if (!epochMs) return '—';
  return new Date(epochMs).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

/** Format a number with appropriate precision. Handles string values from ArcGIS JSON. */
export function formatValue(value: number | string | null | undefined, unit?: string): string {
  if (value === null || value === undefined) return '—';
  const num = typeof value === 'number' ? value : Number(value);
  if (Number.isNaN(num)) return '—';
  const formatted = Number.isInteger(num) ? num.toString() : num.toFixed(2);
  return unit ? `${formatted} ${unit}` : formatted;
}
