// ============================================================================
// Sensor Service — latest readings for the scalar weather variables.
//
// Each Dangermond_*_Datastreams service exposes a "Latest" point layer with one
// row per station. Three quirks have to be handled for the data to be usable:
//
//   1. The same measurement is spread across several near-duplicate columns
//      because station models report under different datastream names, so we
//      coalesce candidates in priority order.
//   2. Loggers write sentinel values (-7999, -99990) for missing readings, which
//      would wreck both the interpolation and the colour ramp.
//   3. Barometric pressure varies with station elevation far more than with
//      weather, so it is corrected to sea level before being compared.
// ============================================================================

import { CacheTTL, getCachedOrFetch } from '../../services/cacheService';
import {
  HUMIDITY_RAMP,
  PRESSURE_RAMP,
  RAINFALL_RAMP,
  TEMPERATURE_RAMP,
  type ColorRamp,
} from '../components/Monitoring/internal/colorRamps';

const SERVICES_BASE = 'https://dangermondpreserve-spatial.com/server/rest/services';

export type SensorVariableId = 'temp' | 'humidity' | 'precip' | 'pressure';

/**
 * A pair of fields whose midpoint estimates the mean, used when a station
 * reports only the interval extremes.
 */
interface MidpointFallback {
  maxField: string;
  minField: string;
}

export interface SensorVariableConfig {
  id: SensorVariableId;
  label: string;
  servicePath: string;
  /** SI unit as stored by the service. */
  unit: string;
  /** Value columns in priority order; the first valid one wins. */
  valueFields: string[];
  /** Used when no `valueFields` entry is populated. */
  midpointFallbacks?: MidpointFallback[];
  /** Readings outside this range are treated as instrument faults. */
  plausibleRange: [number, number];
  /** Correct to mean sea level using station elevation. */
  normalizeToSeaLevel?: boolean;
  ramp: ColorRamp;
  decimals: number;
  /**
   * Values below this are treated as "nothing happening" and left unpainted.
   *
   * Only meaningful for quantities where zero is absence rather than a point on
   * a scale: a dry preserve must not render as a surface implying rain
   * everywhere, whereas 0 °C is a real temperature.
   */
  absenceBelow?: number;
}

export const SENSOR_VARIABLES: Record<SensorVariableId, SensorVariableConfig> = {
  temp: {
    id: 'temp',
    label: 'Air Temperature',
    servicePath: 'Dangermond_Air_Temp_Datastreams',
    unit: '°C',
    valueFields: [
      'air_temp_avg',
      'air_temperature_average',
      'air_temperature_avg',
      'air_temperature_average_1_min_interval',
    ],
    midpointFallbacks: [
      { maxField: 'air_temp_max', minField: 'air_temp_min' },
      { maxField: 'air_temperature_max', minField: 'air_temperature_min' },
      { maxField: 'air_temperature_maximum', minField: 'air_temperature_minimum' },
    ],
    plausibleRange: [-30, 60],
    ramp: TEMPERATURE_RAMP,
    decimals: 1,
  },
  humidity: {
    id: 'humidity',
    label: 'Relative Humidity',
    servicePath: 'Dangermond_Humidity_Datastreams',
    unit: '%',
    valueFields: ['relative_humidity_avg'],
    // Only a few stations report an average, but most report the hourly extremes.
    midpointFallbacks: [
      { maxField: 'relative_humidity_max', minField: 'relative_humidity_min' },
      { maxField: 'relative_humidity_maximum', minField: 'relative_humidity_minimum' },
    ],
    plausibleRange: [0, 100],
    ramp: HUMIDITY_RAMP,
    decimals: 0,
  },
  pressure: {
    id: 'pressure',
    label: 'Barometric Pressure',
    servicePath: 'Dangermond_Barometric_Pressure_Datastreams',
    unit: 'hPa',
    valueFields: [
      'barometric_pressure_avg',
      'barometric_pressure_average',
      'barometric_pressure_2',
      'barometric_pressure',
    ],
    // Station readings at 6-469 m span ~50 hPa purely from elevation.
    plausibleRange: [900, 1080],
    normalizeToSeaLevel: true,
    ramp: PRESSURE_RAMP,
    decimals: 1,
  },
  precip: {
    id: 'precip',
    label: 'Precipitation',
    servicePath: 'Dangermond_Rainfall_Datastreams',
    unit: 'mm',
    // Interval totals only. The cumulative columns mix accumulation windows
    // across stations and are not comparable, so they are deliberately excluded.
    valueFields: ['rainfall', 'rainfall_sum'],
    plausibleRange: [0, 500],
    ramp: RAINFALL_RAMP,
    decimals: 1,
    // A tenth of a millimetre is the resolution of a tipping bucket, so anything
    // under it is no measurable rain.
    absenceBelow: 0.1,
  },
};

export interface ScalarReading {
  stationId: number;
  stationName: string;
  longitude: number;
  latitude: number;
  elevationMetres: number | null;
  observedAt: number;
  /** Value used for display and interpolation, in the variable's unit. */
  value: number;
  /** What the service reported before any correction. */
  rawValue: number;
  /** Set when `value` was estimated rather than reported directly. */
  derivation: 'reported' | 'midpoint' | 'sea-level' | 'midpoint+sea-level';
  sourceField: string;
}

export interface ScalarSnapshot {
  variableId: SensorVariableId;
  readings: ScalarReading[];
  observedAt: number;
  /** Range across reporting stations, for ramp normalization. */
  min: number;
  max: number;
}

type Attributes = Record<string, number | string | null>;

interface QueryResponse {
  features?: { attributes: Attributes; geometry?: { x: number; y: number } }[];
  error?: { message?: string };
}

/**
 * Loggers emit large negative sentinels for missing data. Anything this far
 * below zero is a fault code rather than a reading.
 */
function isSentinel(value: number): boolean {
  return value <= -999;
}

function readNumber(attributes: Attributes, field: string): number | null {
  const value = attributes[field];
  if (typeof value !== 'number' || !Number.isFinite(value)) return null;
  if (isSentinel(value)) return null;
  return value;
}

/**
 * Reduce station pressure to mean sea level with the standard atmosphere
 * relation, so stations at different elevations become comparable.
 */
export function toSeaLevelPressure(pressureHpa: number, elevationMetres: number): number {
  return pressureHpa / Math.pow(1 - 2.25577e-5 * elevationMetres, 5.25588);
}

function buildOutFields(config: SensorVariableConfig): string {
  const fields = new Set([
    'station_id',
    'station_name',
    'latitude',
    'longitude',
    'elevation',
    'latest_time',
    ...config.valueFields,
  ]);

  for (const fallback of config.midpointFallbacks ?? []) {
    fields.add(fallback.maxField);
    fields.add(fallback.minField);
  }

  return [...fields].join(',');
}

/** Resolve the best available value for one station, or null if none is usable. */
function resolveValue(
  attributes: Attributes,
  config: SensorVariableConfig,
): { value: number; sourceField: string; isMidpoint: boolean } | null {
  for (const field of config.valueFields) {
    const value = readNumber(attributes, field);
    if (value !== null) return { value, sourceField: field, isMidpoint: false };
  }

  for (const fallback of config.midpointFallbacks ?? []) {
    const max = readNumber(attributes, fallback.maxField);
    const min = readNumber(attributes, fallback.minField);
    if (max !== null && min !== null) {
      return {
        value: (max + min) / 2,
        sourceField: `${fallback.minField} / ${fallback.maxField}`,
        isMidpoint: true,
      };
    }
  }

  return null;
}

async function requestSnapshot(variableId: SensorVariableId): Promise<ScalarSnapshot> {
  const config = SENSOR_VARIABLES[variableId];

  const params = new URLSearchParams({
    f: 'json',
    where: '1=1',
    outFields: buildOutFields(config),
    returnGeometry: 'true',
    outSR: '4326',
    resultRecordCount: '400',
  });

  const url = `${SERVICES_BASE}/${config.servicePath}/FeatureServer/0/query?${params.toString()}`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`${config.label} query failed: HTTP ${response.status}`);
  }

  const json: QueryResponse = await response.json();
  if (json.error) {
    const message = json.error.message ?? 'Unknown error';
    if (/token|auth|access|permission/i.test(message)) {
      throw new Error(`The ${config.label} service now requires sign-in.`);
    }
    throw new Error(`${config.label} query error: ${message}`);
  }

  const readings: ScalarReading[] = [];
  // Several services list a station more than once; duplicates at identical
  // coordinates would skew the interpolation toward that spot.
  const seenStations = new Set<string>();

  for (const feature of json.features ?? []) {
    const attributes = feature.attributes;
    const stationName = String(attributes.station_name ?? '').trim();

    const longitude = feature.geometry?.x ?? readNumber(attributes, 'longitude');
    const latitude = feature.geometry?.y ?? readNumber(attributes, 'latitude');
    if (longitude == null || latitude == null) continue;

    const resolved = resolveValue(attributes, config);
    if (!resolved) continue;

    const [lowerBound, upperBound] = config.plausibleRange;
    if (resolved.value < lowerBound || resolved.value > upperBound) continue;

    const key = stationName || `${longitude},${latitude}`;
    if (seenStations.has(key)) continue;
    seenStations.add(key);

    const elevationMetres = readNumber(attributes, 'elevation');

    let value = resolved.value;
    let derivation: ScalarReading['derivation'] = resolved.isMidpoint ? 'midpoint' : 'reported';

    if (config.normalizeToSeaLevel) {
      // Without an elevation we cannot compare this station to the others.
      if (elevationMetres === null) continue;
      value = toSeaLevelPressure(value, elevationMetres);
      derivation = resolved.isMidpoint ? 'midpoint+sea-level' : 'sea-level';
    }

    readings.push({
      stationId: Number(attributes.station_id ?? 0),
      stationName: stationName || 'Unknown station',
      longitude,
      latitude,
      elevationMetres,
      observedAt: readNumber(attributes, 'latest_time') ?? 0,
      value,
      rawValue: resolved.value,
      derivation,
      sourceField: resolved.sourceField,
    });
  }

  if (readings.length === 0) {
    throw new Error(`No stations are reporting valid ${config.label.toLowerCase()} readings.`);
  }

  const values = readings.map((reading) => reading.value);

  return {
    variableId,
    readings,
    observedAt: Math.max(...readings.map((reading) => reading.observedAt)),
    min: Math.min(...values),
    max: Math.max(...values),
  };
}

export async function fetchSensorSnapshot(
  variableId: SensorVariableId,
): Promise<ScalarSnapshot> {
  return getCachedOrFetch(
    `sensor-latest-${variableId}`,
    {},
    () => requestSnapshot(variableId),
    CacheTTL.SHORT,
  );
}
