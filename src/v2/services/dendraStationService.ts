// ============================================================================
// Dendra Station Service — Queries per-type sensor feature services.
//
// Catalog `dendra_format` services (e.g. Dangermond_*_Datastreams) expose:
//   Layer 0: * Latest     (live readings — used by Live Monitoring)
//   Layer 1: * Locations  (station points — used by catalog browse/map)
//   Table 2: * Data       (time-series readings)
//
// Station browse targets Locations (outFields=* so schema variants still load).
// Chartable types come from Latest ∪ Data value columns. Time series read the
// service Data table (wide columns keyed by those same field names).
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
  dataTableId: number | null;
}

const serviceIndexCache = new Map<string, FeatureServerIndex>();

/**
 * New `_Datastreams` services expose:
 *   Layer *: * Latest   (live readings — wrong for station browse)
 *   Layer *: * Locations (stations — correct)
 *   Table *: * Data     (time series, wide measure columns)
 * Layer ids vary (e.g. creek has Locations at 0 / Latest at 1). Resolve by name.
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
  const tables: Array<{ id: number; name?: string }> = json.tables ?? [];
  const locations = layers.find((layer) => /location|station/i.test(layer.name ?? ''));
  const latest = layers.find((layer) => /latest/i.test(layer.name ?? ''));
  const dataTable = tables.find((table) => /data/i.test(table.name ?? '')) ?? tables[0];
  const stationsLayerId = locations?.id ?? layers[0]?.id ?? 0;
  const index: FeatureServerIndex = {
    stationsLayerId,
    latestLayerId: latest?.id ?? null,
    dataTableId: dataTable?.id ?? null,
  };
  serviceIndexCache.set(serviceUrl, index);
  console.log(
    `[Dendra] Resolved layers for ${serviceUrl} → stations=${stationsLayerId}` +
      (locations?.name ? ` ("${locations.name}")` : '') +
      `, latest=${index.latestLayerId ?? 'none'}` +
      (latest?.name ? ` ("${latest.name}")` : '') +
      `, data=${index.dataTableId ?? 'none'}` +
      (dataTable?.name ? ` ("${dataTable.name}")` : ''),
  );
  return index;
}

async function resolveStationsLayerId(serviceUrl: string): Promise<number> {
  return (await resolveServiceIndex(serviceUrl)).stationsLayerId;
}

async function resolveLatestLayerId(serviceUrl: string): Promise<number | null> {
  return (await resolveServiceIndex(serviceUrl)).latestLayerId;
}

async function resolveDataTableId(serviceUrl: string): Promise<number | null> {
  return (await resolveServiceIndex(serviceUrl)).dataTableId;
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
  // Services without `is_active` (e.g. creek gauges) should still appear when
  // "active only" is on — treat missing as active rather than inactive.
  const isActive = readNullableNumber(raw.is_active);
  return {
    station_id: stationId,
    dendra_st_id: readNullableString(raw.dendra_st_id) ?? '',
    station_name: stationName,
    station_description: readNullableString(raw.station_description),
    latitude,
    longitude,
    elevation: readNullableNumber(raw.elevation),
    time_zone: readNullableString(raw.time_zone) ?? '',
    is_active: isActive ?? 1,
    sensor_id: readNullableNumber(raw.sensor_id),
    sensor_name: readNullableString(raw.sensor_name) ?? category,
    sensor_thing_type_id: readNullableString(raw.sensor_thing_type_id),
    category,
    datastream_count: readNullableNumber(raw.datastream_count) ?? 0,
  };
}

// ── Public API ───────────────────────────────────────────────────────────────

/**
 * Fetch stations (Locations layer) from a Dendra sensor service.
 *
 * Uses `outFields=*` so schema variants (creek Locations without dendra_st_id /
 * station_description / is_active, or with monitoring_location_id) do not
 * 400 the query. Optional fields are normalized to safe defaults.
 */
export async function fetchStations(serviceUrl: string): Promise<DendraStation[]> {
  const stationsLayerId = await resolveStationsLayerId(serviceUrl);
  const rows = await queryTable<Record<string, unknown>>(serviceUrl, stationsLayerId, {
    returnGeometry: false,
  });
  return rows.map(normalizeStation).filter((row): row is DendraStation => row != null);
}

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
  'unit_of_measure',
  'datastream_count',
  'time_zone',
  'is_active',
  'dendra_st_id',
  'station_description',
  'monitoring_location_id',
  'approval_status',
  'qualifier',
  'geometry',
]);

/** Extra non-measure columns on the wide Data table. */
const DATA_METADATA_FIELDS = new Set([
  ...LATEST_METADATA_FIELDS,
  'timestamp_utc',
  'observed_at',
]);

/** Stable numeric id for a Latest/Data value column (panel pinning keys). */
function stableFieldId(fieldKey: string): number {
  let hash = 0;
  for (let i = 0; i < fieldKey.length; i += 1) {
    hash = ((hash << 5) - hash + fieldKey.charCodeAt(i)) | 0;
  }
  return Math.abs(hash) || 1;
}

/** Reject unexpected SQL identifiers before interpolating into where/outFields. */
function assertSafeFieldName(fieldKey: string): string {
  const trimmed = fieldKey.trim();
  if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(trimmed)) {
    throw new Error(`Invalid datastream field "${fieldKey}"`);
  }
  return trimmed;
}

function isNumericEsriField(type: string | undefined): boolean {
  return /esriFieldType(Double|Single|Integer|SmallInteger)/i.test(type ?? '');
}

/** Discover chartable measure columns from the Latest layer schema. */
async function discoverLatestValueFields(serviceUrl: string): Promise<string[]> {
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
  return fields
    .filter((field) => {
      const name = (field.name ?? '').trim();
      if (!name || LATEST_METADATA_FIELDS.has(name.toLowerCase())) return false;
      return isNumericEsriField(field.type);
    })
    .map((field) => (field.name ?? '').trim())
    .filter(Boolean);
}

/** Discover chartable measure columns from the Data table schema. */
async function discoverDataValueFields(serviceUrl: string): Promise<string[]> {
  const dataTableId = await resolveDataTableId(serviceUrl);
  if (dataTableId == null) return [];

  const metaRes = await fetch(`${serviceUrl}/${dataTableId}?f=json`);
  if (!metaRes.ok) {
    throw new Error(`Data table metadata failed: HTTP ${metaRes.status}`);
  }
  const meta = await metaRes.json();
  if (meta.error) {
    throw new Error(`Data table metadata error: ${meta.error.message}`);
  }

  const fields: Array<{ name?: string; type?: string }> = meta.fields ?? [];
  return fields
    .filter((field) => {
      const name = (field.name ?? '').trim();
      if (!name || DATA_METADATA_FIELDS.has(name.toLowerCase())) return false;
      return isNumericEsriField(field.type);
    })
    .map((field) => (field.name ?? '').trim())
    .filter(Boolean);
}

/**
 * Chartable fields = Latest ∪ Data numeric measure columns.
 * Covers merges where historical columns land on Data before Latest.
 */
async function discoverChartableValueFields(serviceUrl: string): Promise<string[]> {
  const [latestFields, dataFields] = await Promise.all([
    discoverLatestValueFields(serviceUrl).catch((err) => {
      console.warn('[Dendra] Latest field discovery failed:', err);
      return [] as string[];
    }),
    discoverDataValueFields(serviceUrl).catch((err) => {
      console.warn('[Dendra] Data field discovery failed:', err);
      return [] as string[];
    }),
  ]);
  const seen = new Set<string>();
  const merged: string[] = [];
  for (const field of [...latestFields, ...dataFields]) {
    const key = field.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    merged.push(field);
  }
  return merged;
}

async function readStationUnit(
  serviceUrl: string,
  stationId: number,
): Promise<string> {
  const latestLayerId = await resolveLatestLayerId(serviceUrl);
  if (latestLayerId == null) return '';
  try {
    const rows = await queryTable<Record<string, unknown>>(serviceUrl, latestLayerId, {
      where: `station_id=${stationId}`,
      returnGeometry: false,
      resultRecordCount: 1,
    });
    const row = rows[0];
    if (!row) return '';
    return (
      readNullableString(row.unit)
      ?? readNullableString(row.unit_of_measure)
      ?? ''
    );
  } catch {
    return '';
  }
}

/** Snake_case key comparable to Latest layer value columns. */
export function toLatestFieldKey(datastreamName: string): string {
  return datastreamName
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

/** Whether a datastream display name maps to a Latest value column. */
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

/** Estimate cadence from recent non-null samples of a Data-table value column. */
async function estimateFrequencyFromDataColumn(
  serviceUrl: string,
  dataTableId: number,
  fieldKey: string,
  sampleStationId?: number,
): Promise<string | null> {
  try {
    const field = assertSafeFieldName(fieldKey);
    const whereParts = [`${field} IS NOT NULL`];
    if (sampleStationId != null && Number.isFinite(sampleStationId)) {
      whereParts.push(`station_id=${sampleStationId}`);
    }
    const where = whereParts.join(' AND ');
    const url =
      `${serviceUrl}/${dataTableId}/query?where=${encodeURIComponent(where)}` +
      '&outFields=timestamp_utc&orderByFields=timestamp_utc%20DESC&resultRecordCount=6&returnGeometry=false&f=json';
    const res = await fetch(url);
    if (!res.ok) return null;
    const json = await res.json();
    if (json.error) return null;
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
 * Discover chartable datastream types from Latest ∪ Data measure columns,
 * then enrich cadence from the service Data table (or field-name hints).
 */
export async function fetchDatastreamTypeCatalog(
  serviceUrl: string,
  sampleStationIds: number[] = [],
): Promise<DendraDatastreamType[]> {
  const fieldKeys = await discoverChartableValueFields(serviceUrl);
  if (fieldKeys.length === 0) return [];

  const dataTableId = await resolveDataTableId(serviceUrl);
  const sampleStationId = sampleStationIds.find((id) => Number.isFinite(id));

  const types: DendraDatastreamType[] = [];
  for (const fieldKey of fieldKeys) {
    let frequencyLabel = inferFrequencyFromText(fieldKey, prettifyLatestField(fieldKey));
    if (!frequencyLabel && dataTableId != null) {
      frequencyLabel = await estimateFrequencyFromDataColumn(
        serviceUrl,
        dataTableId,
        fieldKey,
        sampleStationId,
      );
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
 * Summaries are synthesized from Latest value columns (one per measure field).
 * `dendra_ds_id` is the Data/Latest column name used by chart queries.
 */
export async function fetchSummariesForStation(
  serviceUrl: string,
  stationId: number,
  options?: {
    categoryHint?: string | null;
    latestValueFields?: string[] | null;
  },
): Promise<DendraSummary[]> {
  let fieldKeys = (options?.latestValueFields ?? [])
    .map((field) => field.trim())
    .filter(Boolean);

  if (fieldKeys.length === 0) {
    fieldKeys = await discoverChartableValueFields(serviceUrl);
  }

  if (fieldKeys.length === 0) return [];

  const unit = await readStationUnit(serviceUrl, stationId);

  return fieldKeys.map((fieldKey) => ({
    datastream_id: stableFieldId(fieldKey),
    dendra_ds_id: fieldKey,
    datastream_name: prettifyLatestField(fieldKey),
    variable: fieldKey,
    unit,
    station_id: stationId,
    station_name: '',
    total_records: 0,
    first_reading_time: null,
    last_reading_time: null,
    min_value: null,
    max_value: null,
    avg_value: null,
  }));
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

export interface TimeSeriesDateWindow {
  startDate: string;
  endDate: string;
}

export interface TimeSeriesExtent {
  minTs: number;
  maxTs: number;
}

/** Progressive load plan: recent window first, then one older backfill fetch. */
export interface ProgressiveTimeSeriesPlan {
  window: TimeSeriesDateWindow | null;
  initial: TimeSeriesDateWindow | null;
  backfill: TimeSeriesDateWindow | null;
}

const MS_PER_DAY = 24 * 60 * 60 * 1000;
const DEFAULT_INITIAL_RENDER_DAYS = 30;

function parseDateUtc(date: string): number | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return null;
  return Date.parse(`${date}T00:00:00.000Z`);
}

function toDateUtc(epochMs: number): string {
  return new Date(epochMs).toISOString().slice(0, 10);
}

function toArcGisDateLiteral(date: string, useDayEnd: boolean): string | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return null;
  return `${date} ${useDayEnd ? '23:59:59' : '00:00:00'}`;
}

function buildTimeSeriesWhere(
  stationId: number,
  field: string,
  options?: DendraTimeSeriesQueryOptions,
): string {
  const whereParts = [`station_id=${stationId}`, `${field} IS NOT NULL`];
  const startLiteral = options?.startDate ? toArcGisDateLiteral(options.startDate, false) : null;
  const endLiteral = options?.endDate ? toArcGisDateLiteral(options.endDate, true) : null;
  if (startLiteral) whereParts.push(`timestamp_utc >= DATE '${startLiteral}'`);
  if (endLiteral) whereParts.push(`timestamp_utc <= DATE '${endLiteral}'`);
  return whereParts.join(' AND ');
}

/**
 * Cheap min/max timestamp probe for a station + measure column.
 * Used to clamp long requested ranges onto years that actually have data.
 */
export async function fetchTimeSeriesExtent(
  serviceUrl: string,
  stationId: number,
  valueField: string,
  options?: DendraTimeSeriesQueryOptions,
): Promise<TimeSeriesExtent | null> {
  const dataTableId = await resolveDataTableId(serviceUrl);
  if (dataTableId == null) return null;

  const field = assertSafeFieldName(valueField);
  const where = buildTimeSeriesWhere(stationId, field, options);
  const outStatistics = JSON.stringify([
    { statisticType: 'min', onStatisticField: 'timestamp_utc', outStatisticFieldName: 'min_ts' },
    { statisticType: 'max', onStatisticField: 'timestamp_utc', outStatisticFieldName: 'max_ts' },
  ]);
  const url =
    `${serviceUrl}/${dataTableId}/query?where=${encodeURIComponent(where)}` +
    `&outStatistics=${encodeURIComponent(outStatistics)}` +
    `&f=json`;

  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Dendra time series extent failed: HTTP ${res.status}`);
  }
  const json = await res.json();
  if (json.error) {
    throw new Error(`Dendra time series extent error: ${json.error.message}`);
  }

  const attrs = json.features?.[0]?.attributes as { min_ts?: unknown; max_ts?: unknown } | undefined;
  const minTs = Number(attrs?.min_ts);
  const maxTs = Number(attrs?.max_ts);
  if (!Number.isFinite(minTs) || !Number.isFinite(maxTs)) return null;
  return { minTs, maxTs };
}

/**
 * Clamp the requested range to actual data, then split into a recent paint
 * window plus a single older backfill (ArcGIS still pages at 2000 rows).
 */
export async function planProgressiveTimeSeries(
  serviceUrl: string,
  stationId: number,
  valueField: string,
  requested: TimeSeriesDateWindow,
  initialDays = DEFAULT_INITIAL_RENDER_DAYS,
): Promise<ProgressiveTimeSeriesPlan> {
  const empty: ProgressiveTimeSeriesPlan = { window: null, initial: null, backfill: null };
  const userStart = parseDateUtc(requested.startDate);
  const userEnd = parseDateUtc(requested.endDate);
  if (userStart == null || userEnd == null || userEnd < userStart) return empty;

  const extent = await fetchTimeSeriesExtent(serviceUrl, stationId, valueField, requested);
  if (!extent) return empty;

  const extentStart = toDateUtc(extent.minTs);
  const extentEnd = toDateUtc(extent.maxTs);
  const startDate = requested.startDate > extentStart ? requested.startDate : extentStart;
  const endDate = requested.endDate < extentEnd ? requested.endDate : extentEnd;
  if (startDate > endDate) return empty;

  const startMs = parseDateUtc(startDate);
  const endMs = parseDateUtc(endDate);
  if (startMs == null || endMs == null) return empty;

  const initialStartMs = Math.max(startMs, endMs - (initialDays - 1) * MS_PER_DAY);
  const initial: TimeSeriesDateWindow = {
    startDate: toDateUtc(initialStartMs),
    endDate,
  };
  const backfill: TimeSeriesDateWindow | null = initialStartMs > startMs
    ? {
      startDate,
      endDate: toDateUtc(initialStartMs - MS_PER_DAY),
    }
    : null;

  return {
    window: { startDate, endDate },
    initial,
    backfill,
  };
}

/**
 * Fetch time-series data for a Latest/Data value column on the active service.
 *
 * Reads the service Data table (wide format): station_id + timestamp_utc + measure
 * columns. `valueField` is the column name (also stored on summaries as dendra_ds_id).
 *
 * ArcGIS maxRecordCount is 2000 — unconstrained opens take the most recent window.
 */
export async function fetchTimeSeries(
  serviceUrl: string,
  stationId: number,
  datastreamName: string,
  valueField: string,
  options?: DendraTimeSeriesQueryOptions,
): Promise<TimeSeriesResult> {
  const dataTableId = await resolveDataTableId(serviceUrl);
  if (dataTableId == null) {
    throw new Error('This service has no Data table for time-series queries');
  }

  const field = assertSafeFieldName(valueField);
  const where = buildTimeSeriesWhere(stationId, field, options);
  const hasServerDateBounds = Boolean(options?.startDate || options?.endDate);

  const parsePoints = (features: { attributes: Record<string, unknown> }[]) =>
    features
      .map((feature) => ({
        timestamp: Number(feature.attributes.timestamp_utc),
        value: Number(feature.attributes[field]),
      }))
      .filter((point) => Number.isFinite(point.timestamp) && Number.isFinite(point.value));

  let points: DendraTimeSeriesPoint[];

  if (!hasServerDateBounds) {
    const url =
      `${serviceUrl}/${dataTableId}/query?where=${encodeURIComponent(where)}` +
      `&outFields=timestamp_utc,${encodeURIComponent(field)}` +
      `&orderByFields=timestamp_utc DESC` +
      `&resultRecordCount=2000` +
      `&f=json`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Dendra time series query failed: HTTP ${res.status}`);
    const json = await res.json();
    if (json.error) throw new Error(`Dendra time series error: ${json.error.message}`);
    const features: { attributes: Record<string, unknown> }[] = json.features ?? [];
    points = parsePoints(features).reverse();
  } else {
    const batchSize = 2000;
    const batches: DendraTimeSeriesPoint[] = [];
    let offset = 0;

    while (true) {
      const url =
        `${serviceUrl}/${dataTableId}/query?where=${encodeURIComponent(where)}` +
        `&outFields=timestamp_utc,${encodeURIComponent(field)}` +
        `&orderByFields=timestamp_utc ASC` +
        `&resultRecordCount=${batchSize}` +
        `&resultOffset=${offset}` +
        `&f=json`;
      const res = await fetch(url);
      if (!res.ok) throw new Error(`Dendra time series query failed: HTTP ${res.status}`);
      const json = await res.json();
      if (json.error) throw new Error(`Dendra time series error: ${json.error.message}`);
      const features: { attributes: Record<string, unknown> }[] = json.features ?? [];
      if (features.length === 0) break;

      batches.push(...parsePoints(features));
      if (features.length < batchSize) break;
      offset += batchSize;
    }

    points = batches;
  }

  if (points.length > 0) {
    console.log(
      `[Dendra TimeSeries] ${points.length} pts · station=${stationId} · ${field}` +
        (options?.startDate || options?.endDate
          ? ` · ${options.startDate ?? '…'}→${options.endDate ?? '…'}`
          : ''),
    );
  }
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

/** Normalize station names for display (e.g., "Dangermond_Oaks" / "Dangermond Oaks" → "Oaks"). */
export function formatStationDisplayName(stationName: string | null | undefined): string {
  if (!stationName) return 'Unknown';
  const trimmed = stationName.trim();
  // Strip a leading preserve prefix when it is a separate token (space, underscore, or hyphen).
  const withoutPrefix = trimmed.replace(/^dangermond(?=[_\s-]|$)/i, '').replace(/^[_\s-]+/, '');
  return withoutPrefix.replace(/_/g, ' ').replace(/\s+/g, ' ').trim() || 'Unknown';
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
