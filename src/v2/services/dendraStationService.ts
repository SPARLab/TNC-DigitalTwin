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

/** Combined payload returned by fetchServiceData */
export interface DendraServiceData {
  stations: DendraStation[];
  summaries: DendraSummary[];
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
  return `${protocol}${base}/${servicePath}/FeatureServer`;
}

/** Generic ArcGIS table/layer query */
async function queryTable<T>(serviceUrl: string, tableIndex: number): Promise<T[]> {
  const url = `${serviceUrl}/${tableIndex}/query?where=1=1&outFields=*&f=json`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Dendra query failed: HTTP ${res.status}`);

  const json: ArcGISQueryResponse<T> = await res.json();
  if (json.error) throw new Error(`Dendra query error: ${json.error.message}`);

  return (json.features ?? []).map(f => f.attributes);
}

// ── Public API ───────────────────────────────────────────────────────────────

/** Fetch stations (Layer 0) from a Dendra sensor service */
export async function fetchStations(serviceUrl: string): Promise<DendraStation[]> {
  return queryTable<DendraStation>(serviceUrl, 0);
}

/** Fetch datastream summaries (Table 2) from a Dendra sensor service */
export async function fetchSummaries(serviceUrl: string): Promise<DendraSummary[]> {
  return queryTable<DendraSummary>(serviceUrl, 2);
}

/**
 * Fetch both stations and summaries in parallel.
 * This is the primary entry point for the DendraContext warmCache.
 */
export async function fetchServiceData(serviceUrl: string): Promise<DendraServiceData> {
  const [stations, summaries] = await Promise.all([
    fetchStations(serviceUrl),
    fetchSummaries(serviceUrl),
  ]);
  return { stations, summaries };
}

/** Get summaries for a specific station */
export function getSummariesForStation(
  summaries: DendraSummary[],
  stationId: number,
): DendraSummary[] {
  return summaries.filter(s => s.station_id === stationId);
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

/** Format a number with appropriate precision */
export function formatValue(value: number | null, unit?: string): string {
  if (value === null || value === undefined) return '—';
  const formatted = Number.isInteger(value) ? value.toString() : value.toFixed(2);
  return unit ? `${formatted} ${unit}` : formatted;
}
