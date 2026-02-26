// ============================================================================
// Dendra Station Service — Queries per-type sensor feature services.
//
// Dan's Data Catalog has 10 Dendra sensor services, each with:
//   Layer 0: Station Locations (point features)
//   Table 1: Sensor Data (time series readings — deferred to task 3.5)
//   Table 2: Sensor Summary (pre-computed per-datastream stats)
//
// All 10 services share identical schema. This service takes a base URL
// and fetches from the appropriate table/layer.
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
  sensor_id: number;
  sensor_name: string;
  sensor_thing_type_id: string | null;
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

/** Generic ArcGIS table/layer query */
async function queryTable<T>(
  serviceUrl: string,
  tableIndex: number,
  options?: {
    where?: string;
    outFields?: string[];
    returnGeometry?: boolean;
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

// ── Public API ───────────────────────────────────────────────────────────────

/** Fetch stations (Layer 0) from a Dendra sensor service */
export async function fetchStations(serviceUrl: string): Promise<DendraStation[]> {
  return queryTable<DendraStation>(serviceUrl, 0, {
    outFields: [
      'station_id',
      'dendra_st_id',
      'station_name',
      'station_description',
      'latitude',
      'longitude',
      'elevation',
      'time_zone',
      'is_active',
      'sensor_id',
      'sensor_name',
      'sensor_thing_type_id',
      'datastream_count',
    ],
    returnGeometry: false,
  });
}

const SUMMARY_OUT_FIELDS = [
  'datastream_id',
  'dendra_ds_id',
  'datastream_name',
  'variable',
  'unit',
  'station_id',
  'station_name',
  'total_records',
  'first_reading_time',
  'last_reading_time',
  'min_value',
  'max_value',
  'avg_value',
];

/** Fetch summaries for a single station (on-demand drill-down query) */
export async function fetchSummariesForStation(
  serviceUrl: string,
  stationId: number,
): Promise<DendraSummary[]> {
  return queryTable<DendraSummary>(serviceUrl, 2, {
    where: `station_id=${stationId}`,
    outFields: SUMMARY_OUT_FIELDS,
    returnGeometry: false,
  });
}

// ── Time Series (via legacy v0 service) ──────────────────────────────────────
//
// Per-type service Table 1 is not yet populated. Time series data lives in
// the legacy monolithic Dendra_Stations service:
//   Table 3: Datastreams  → has dendra_ds_id (matches v2 Summary.dendra_ds_id)
//   Table 4: Datapoints   → has datastream_id, timestamp_utc, value
//
// Bridge: v2 Summary.dendra_ds_id → v0 Table 3 → get id → v0 Table 4 data.

const V0_BASE = 'https://dangermondpreserve-spatial.com/server/rest/services/Dendra_Stations/FeatureServer';

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
  return datastreamName.trim().toLowerCase().replace(/\s+/g, '_');
}

// ── Formatting ───────────────────────────────────────────────────────────────

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
