// ============================================================================
// dendraCatalogExpand — reshape dendra_format service children from ArcGIS
// Latest/Locations into Stations + one catalog row per measure column.
// ============================================================================

import type { CatalogLayer } from '../types';
import { prettifyLatestField } from '../services/dendraStationService';

export const DENDRA_LATEST_ACTIVE_WINDOW_MS = 7 * 24 * 60 * 60 * 1000;

const MEASURE_METADATA_FIELDS = new Set([
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
  'timestamp_utc',
]);

const SENTINEL_MAX = -999;

function isNumericEsriField(type: string | undefined): boolean {
  return /esriFieldType(Double|Single|Integer|SmallInteger)/i.test(type ?? '');
}

function isValidMeasureNumber(value: unknown): boolean {
  if (typeof value !== 'number' || !Number.isFinite(value)) return false;
  if (value <= SENTINEL_MAX) return false;
  return true;
}

/** ArcGIS DATE literal for "now − 7 days" (used on Latest.latest_time). */
export function dendraLatestActiveSinceLiteral(nowMs = Date.now()): string {
  const since = new Date(nowMs - DENDRA_LATEST_ACTIVE_WINDOW_MS);
  return since.toISOString().slice(0, 19).replace('T', ' ');
}

export function isWithinDendraLatestActiveWindow(
  latestTimeMs: number | null | undefined,
  nowMs = Date.now(),
): boolean {
  if (latestTimeMs == null || !Number.isFinite(latestTimeMs)) return false;
  return latestTimeMs >= nowMs - DENDRA_LATEST_ACTIVE_WINDOW_MS;
}

/** Extract chartable/live measure column names from a Latest layer `?f=json` payload. */
export function measureFieldsFromLatestMeta(meta: {
  fields?: Array<{ name?: string; type?: string }>;
}): string[] {
  const fields = meta.fields ?? [];
  return fields
    .filter((field) => {
      const name = (field.name ?? '').trim();
      if (!name || MEASURE_METADATA_FIELDS.has(name.toLowerCase())) return false;
      return isNumericEsriField(field.type);
    })
    .map((field) => (field.name ?? '').trim())
    .filter(Boolean);
}

/**
 * Probe Latest rows with recent `latest_time` and return measure fields that
 * still have at least one valid numeric reading.
 */
export async function fetchRecentActiveMeasureFields(
  featureServerUrl: string,
  latestLayerId: number,
  measureFields: string[],
): Promise<Set<string>> {
  const active = new Set<string>();
  if (measureFields.length === 0) return active;

  const safeFields = measureFields.filter((field) => /^[A-Za-z_][A-Za-z0-9_]*$/.test(field));
  if (safeFields.length === 0) return active;

  const sinceLiteral = dendraLatestActiveSinceLiteral();
  const where = `latest_time >= DATE '${sinceLiteral}'`;
  const outFields = ['latest_time', ...safeFields].join(',');
  const url =
    `${featureServerUrl.replace(/\/+$/, '')}/${latestLayerId}/query`
    + `?where=${encodeURIComponent(where)}`
    + `&outFields=${encodeURIComponent(outFields)}`
    + '&returnGeometry=false&resultRecordCount=2000&f=json';

  const res = await fetch(url);
  if (!res.ok) throw new Error(`Latest activity probe failed: HTTP ${res.status}`);
  const json = await res.json();
  if (json?.error) throw new Error(json.error.message ?? 'Latest activity probe failed');

  const nowMs = Date.now();
  for (const feature of json.features ?? []) {
    const attrs = (feature.attributes ?? {}) as Record<string, unknown>;
    const latestTime = typeof attrs.latest_time === 'number' ? attrs.latest_time : null;
    if (!isWithinDendraLatestActiveWindow(latestTime, nowMs)) continue;
    for (const field of safeFields) {
      if (isValidMeasureNumber(attrs[field])) active.add(field);
    }
  }
  return active;
}

export function findDendraLocationsChild(children: CatalogLayer[]): CatalogLayer | undefined {
  return children.find((child) => {
    if (child.catalogMeta?.dendraRole === 'stations') return true;
    return /location|station/i.test(child.name);
  });
}

export function findDendraLatestChild(children: CatalogLayer[]): CatalogLayer | undefined {
  return children.find((child) => {
    if (child.catalogMeta?.dendraRole === 'measure' || child.catalogMeta?.valueField) return true;
    return /latest/i.test(child.name);
  });
}

/**
 * Replace ArcGIS Latest/Locations siblings with:
 *   Stations
 *   ├── Depth To Groundwater
 *   ├── Groundwater Elevation
 *   └── …
 *
 * Each measure row points at the same Latest `layerIdInService` with a distinct
 * `valueField` for map badges + browse defaults.
 */
export function expandDendraFormatChildren(args: {
  parentId: string;
  locations: CatalogLayer;
  latest: CatalogLayer;
  measureFields: string[];
  /** When provided, measures missing from this set are marked inactive. */
  activeMeasureFields?: Set<string> | null;
}): CatalogLayer[] {
  const { parentId, locations, latest, measureFields, activeMeasureFields = null } = args;
  if (!locations.catalogMeta || !latest.catalogMeta) return [locations, latest];

  const stations: CatalogLayer = {
    ...locations,
    id: `${parentId}-stations`,
    name: 'Stations',
    catalogMeta: {
      ...locations.catalogMeta,
      parentServiceId: parentId,
      dendraRole: 'stations',
      valueField: undefined,
      isInactive: undefined,
      siblingLayers: undefined,
    },
  };

  const measures: CatalogLayer[] = measureFields.length > 0
    ? measureFields.map((fieldKey) => {
      const isInactive = activeMeasureFields != null
        ? !activeMeasureFields.has(fieldKey)
        : false;
      return {
        ...latest,
        id: `${parentId}-measure-${fieldKey}`,
        name: prettifyLatestField(fieldKey),
        catalogMeta: {
          ...latest.catalogMeta!,
          parentServiceId: parentId,
          layerIdInService: latest.catalogMeta!.layerIdInService,
          dendraRole: 'measure' as const,
          valueField: fieldKey,
          isInactive,
          siblingLayers: undefined,
        },
      };
    })
    : [{
      ...latest,
      id: `${parentId}-latest`,
      name: latest.name.replace(/\s*latest\s*/i, '').trim() || 'Latest readings',
      catalogMeta: {
        ...latest.catalogMeta,
        parentServiceId: parentId,
        dendraRole: 'measure' as const,
        isInactive: false,
        siblingLayers: undefined,
      },
    }];

  const children = [stations, ...measures];
  for (const child of children) {
    if (!child.catalogMeta) continue;
    child.catalogMeta.siblingLayers = children.filter((sibling) => sibling.id !== child.id);
  }
  return children;
}
