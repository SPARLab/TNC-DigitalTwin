// ============================================================================
// Sensor Service — latest readings for the scalar weather variables.
//
// Each Dangermond_*_Datastreams service exposes a "Latest" point layer with one
// row per station. Three quirks have to be handled for the data to be usable:
//
//   1. Not every station reports an average. Many log only the interval
//      extremes, so a min/max midpoint stands in when no average is present.
//   2. Loggers write sentinel values (-7999, -99990) for missing readings, which
//      would wreck both the interpolation and the colour ramp.
//   3. Barometric pressure varies with station elevation far more than with
//      weather, so it is corrected to sea level before being compared.
// ============================================================================

import { CacheTTL, getCachedOrFetch } from '../../services/cacheService';
import { fetchGroundElevations } from './terrainService';
import {
  CONDUCTIVITY_RAMP,
  DISCHARGE_RAMP,
  GROUNDWATER_RAMP,
  HUMIDITY_RAMP,
  PRESSURE_RAMP,
  RAINFALL_RAMP,
  SOIL_MOISTURE_RAMP,
  SOLAR_RAMP,
  TEMPERATURE_RAMP,
  type ColorRamp,
} from '../components/Monitoring/internal/colorRamps';

const SERVICES_BASE = 'https://dangermondpreserve-spatial.com/server/rest/services';

export type SensorVariableId =
  | 'temp'
  | 'humidity'
  | 'precip'
  | 'pressure'
  | 'solar'
  | 'groundwater'
  | 'discharge'
  | 'streamLevel'
  | 'gaugeHeight'
  | 'waterTemp'
  | 'conductivity'
  | 'soilTemp'
  | 'soilMoisture';

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
  /**
   * Sublayer holding the one-row-per-station "Latest" view.
   *
   * The weather services put it first; the creek services put Locations there
   * and Latest at 1, so it cannot be assumed.
   */
  layerId?: number;
  /** SI unit as stored by the service. */
  unit: string;
  /** Value columns in priority order; the first valid one wins. */
  valueFields: string[];
  /** Used when no `valueFields` entry is populated. */
  midpointFallbacks?: MidpointFallback[];
  /**
   * Multiplier converting the stored value into `unit`, for services that
   * publish in something other than the unit we display.
   */
  scaleToUnit?: number;
  /**
   * Take the magnitude of the stored value. Only for sources whose sign
   * convention is inconsistent between stations, where the sign carries no
   * information and taking it literally produces impossible readings.
   */
  useMagnitude?: boolean;
  /** Readings outside this range are treated as instrument faults, in scaled units. */
  plausibleRange: [number, number];
  /** Correct to mean sea level using station elevation. */
  normalizeToSeaLevel?: boolean;
  /**
   * Treat the reading as a depth below ground and convert it to the elevation of
   * the water table, by subtracting it from the station's ground elevation.
   *
   * Depth below ground is not comparable between stations across varying
   * terrain, whereas the resulting elevation is a continuous physical surface
   * and is what may legitimately be interpolated.
   */
  deriveHeadFromDepth?: boolean;
  /** Sanity range applied after a transform, in `unit`. */
  transformedRange?: [number, number];
  /** Stations dropped by name, for known-bad metadata. Matched case-insensitively. */
  excludeStations?: string[];
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
  /**
   * Whether interpolating between stations says anything true. Defaults to yes.
   *
   * Set false where the quantity is controlled by something the stations do not
   * sample. Groundwater is the case in point: 25 wells over 10 km of hill country
   * cannot resolve a water table that is governed by geology and topography, and
   * an interpolated sheet between them looks far more authoritative than it is.
   */
  supportsInterpolation?: boolean;
  /**
   * Fixed bounds for the colour ramp, instead of the range across stations.
   *
   * A network of stations supplies its own scale, but a single gage does not:
   * its low and high are the same number, which would peg the ramp at one end
   * and make the colour say nothing. An absolute scale gives the reading a
   * reference instead.
   */
  displayRange?: [number, number];
  /**
   * Some soil-moisture loggers publish volumetric fraction (0-1) and others
   * publish percent (0-100). Values in (0, 1] are scaled to percent so the
   * badges stay on one scale.
   */
  fractionAsPercent?: boolean;
  /**
   * Caveat shown in the legend, for a reading whose name does not fully describe
   * it. Use where a user would otherwise draw the wrong conclusion from the
   * number, not to restate the label.
   */
  note?: string;
}

/**
 * Bounds to map values onto the colour ramp with.
 *
 * Separate from the snapshot's observed min and max, which stay honest about
 * what the stations actually reported.
 */
export function getRampBounds(
  config: SensorVariableConfig,
  snapshot: ScalarSnapshot,
): [number, number] {
  return config.displayRange ?? [snapshot.min, snapshot.max];
}

/**
 * True when the reading is itself an elevation in metres above sea level, rather
 * than a property measured at the surface. Such a reading has a vertical extent
 * the 3D scene can draw, from the ground down to the measured level.
 */
export function isElevationValued(config: SensorVariableConfig | null): boolean {
  return config?.deriveHeadFromDepth === true;
}

/** Whether to offer the interpolated surface for this variable. */
export function allowsInterpolation(config: SensorVariableConfig | null): boolean {
  return config !== null && config.supportsInterpolation !== false;
}

export const SENSOR_VARIABLES: Record<SensorVariableId, SensorVariableConfig> = {
  temp: {
    id: 'temp',
    label: 'Air Temperature',
    servicePath: 'Dangermond_Air_Temp_Datastreams',
    unit: '°C',
    valueFields: ['air_temp_avg'],
    midpointFallbacks: [{ maxField: 'air_temp_max', minField: 'air_temp_min' }],
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
    midpointFallbacks: [{ maxField: 'relative_humidity_max', minField: 'relative_humidity_min' }],
    plausibleRange: [0, 100],
    ramp: HUMIDITY_RAMP,
    decimals: 0,
  },
  pressure: {
    id: 'pressure',
    label: 'Barometric Pressure',
    servicePath: 'Dangermond_Barometric_Pressure_Datastreams',
    unit: 'hPa',
    valueFields: ['barometric_pressure_avg', 'barometric_pressure'],
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
    // Interval totals only. `rainfall_cumulative` and `cumulative_daily_rainfall`
    // sit alongside this column but mix accumulation windows across stations, so
    // they are deliberately excluded rather than kept as fallbacks — picking one
    // up would paint a plausible-looking surface off incomparable numbers.
    valueFields: ['rainfall'],
    plausibleRange: [0, 500],
    ramp: RAINFALL_RAMP,
    decimals: 1,
    // A tenth of a millimetre is the resolution of a tipping bucket, so anything
    // under it is no measurable rain.
    absenceBelow: 0.1,
  },
  solar: {
    id: 'solar',
    label: 'Solar Radiation',
    servicePath: 'Dangermond_Solar_Radiation_Datastreams',
    unit: 'W/m²',
    // "total" here is the datastream's name, not an accumulation — this is an
    // instantaneous irradiance average, so it is safe to use directly.
    valueFields: ['total_solar_radiation_avg'],
    midpointFallbacks: [
      { maxField: 'total_solar_radiation_max', minField: 'total_solar_radiation_min' },
    ],
    // Pyranometers read slightly negative at night from thermal offset, so a
    // small negative margin is legitimate. Beyond that the sensor is faulty.
    // The upper bound stays above the ~1000 clear-sky ceiling because cloud-edge
    // reflection produces brief genuine spikes.
    plausibleRange: [-20, 1500],
    ramp: SOLAR_RAMP,
    decimals: 0,
  },
  groundwater: {
    id: 'groundwater',
    label: 'Groundwater Elevation',
    servicePath: 'Dangermond_Groundwater_Datastreams',
    unit: 'm',
    // `groundwater_elevation` is published alongside this, but only 5 of 33 wells
    // populate it and two of those disagree with surveyed ground elevation by 14
    // and 57 m, so head is recomputed from depth instead of being trusted.
    valueFields: ['depth_to_groundwater'],
    // Depth is stored in feet while `elevation` is in metres, so mixing them
    // without this factor silently produces a 3.3x error.
    scaleToUnit: 0.3048,
    // Five wells report depth as negative. Taken literally that puts the water
    // table 11-96 m above ground, which is not credible when every neighbouring
    // well in the same field reports positive depths.
    useMagnitude: true,
    // Depth below ground, in metres. The deepest well is ~161 m.
    plausibleRange: [0, 610],
    deriveHeadFromDepth: true,
    // Water-table elevation. The preserve's 2 m terrain model tops out at 621 m.
    transformedRange: [-50, 650],
    // Its recorded elevation is 37.7 m below the terrain model, and that error
    // propagates straight into the derived head.
    excludeStations: ['Dangermond Test Well'],
    ramp: GROUNDWATER_RAMP,
    decimals: 1,
    supportsInterpolation: false,
  },
  discharge: {
    id: 'discharge',
    label: 'Jalama Creek Discharge',
    servicePath: 'Dangermond_Creek_Discharge',
    // Locations sits at 0 on this service; Latest is the second layer.
    layerId: 1,
    unit: 'm³/s',
    valueFields: ['discharge'],
    // Published as ft³/s by the USGS gage.
    scaleToUnit: 0.0283168,
    // The record runs from 0.01 to 3580 ft³/s, i.e. 0.0003 to 101 m³/s.
    plausibleRange: [0, 150],
    ramp: DISCHARGE_RAMP,
    // Summer baseflow is thousandths of a cumec, so two decimals would round the
    // creek to a standstill for months at a time.
    decimals: 3,
    // One gage, so there is nothing to interpolate between.
    supportsInterpolation: false,
    // Covers everything up to a modest storm. Floods peg the top of the ramp,
    // which is the right reading for them anyway.
    displayRange: [0, 5],
  },
  streamLevel: {
    id: 'streamLevel',
    label: 'Jalama Creek Stream Level',
    servicePath: 'Dangermond_Creek_Stream_Level',
    layerId: 1,
    unit: 'm',
    valueFields: ['stream_level'],
    // Published in feet, as USGS parameter 63160.
    scaleToUnit: 0.3048,
    // A water-surface elevation, so bounded around the gage's own datum rather
    // than around zero. Wide enough to admit a flood.
    plausibleRange: [20, 40],
    ramp: DISCHARGE_RAMP,
    // The whole record spans 13 cm, so a coarser figure would never move.
    decimals: 2,
    supportsInterpolation: false,
    // Effectively the observed range, which keeps the colour meaningful at the
    // centimetre scale this gage actually varies over.
    displayRange: [26.3, 26.5],
    note: 'Water-surface elevation on the NAVD88 datum, not the depth of the water. It moves through only 13 cm across the whole record, so Gauge Height is the easier way to watch this gage rise and fall.',
  },
  gaugeHeight: {
    id: 'gaugeHeight',
    label: 'Jalama Creek Gauge Height',
    servicePath: 'Dangermond_Creek_Gauge_Height',
    layerId: 1,
    unit: 'm',
    valueFields: ['gauge_height'],
    // Published in feet, as USGS parameter 00065.
    scaleToUnit: 0.3048,
    plausibleRange: [0, 10],
    ramp: DISCHARGE_RAMP,
    decimals: 2,
    supportsInterpolation: false,
    // The record runs 0.91-3.55 m, so this is very nearly the observed range.
    displayRange: [0.9, 3.6],
    note: 'Height of the water above the gage datum, which is the same measurement as Stream Level on a datum that makes the rise and fall legible: 0.9 m is a creek at rest and 3.5 m is the highest it has been recorded.',
  },
  waterTemp: {
    id: 'waterTemp',
    label: 'Jalama Creek Water Temperature',
    servicePath: 'Dangermond_Creek_Water_Temperature',
    layerId: 1,
    unit: '°C',
    valueFields: ['water_temp'],
    plausibleRange: [-5, 45],
    ramp: TEMPERATURE_RAMP,
    decimals: 1,
    supportsInterpolation: false,
    // The record runs 7.6-26.7 °C; this rounds outward from that.
    displayRange: [5, 30],
  },
  conductivity: {
    id: 'conductivity',
    label: 'Electrical Conductivity',
    servicePath: 'Dangermond_Electrical_Conductivity_Datastreams',
    // Bulk soil conductivity at up to three depths. The combined average is
    // preferred; where a station never populated it, the shallowest probe stands in.
    valueFields: [
      'electrical_conductivity_avg',
      'electrical_conductivity_1_avg',
      'electrical_conductivity_2_avg',
      'electrical_conductivity_3_avg',
    ],
    unit: 'dS/m',
    /*
     * The depth probes carry Campbell fault codes at both signs, reaching 7999 and
     * -7392. Negative sentinels are caught upstream but a positive one is only a
     * large number, so the upper bound has to do that work. Three orders of
     * magnitude above the combined average's observed ceiling of 0.034 dS/m is
     * loose enough for wet ground and tight enough to reject a fault.
     */
    plausibleRange: [0, 5],
    ramp: CONDUCTIVITY_RAMP,
    decimals: 3,
    supportsInterpolation: false,
    note: 'Bulk soil conductivity, a measure of dissolved ions, taken at up to three depths and reported in dS/m as published by Dendra. Zero is a real reading here rather than a missing one: dry ground barely conducts, which is why most stations sit at the bottom of the scale by late summer.',
  },
  soilTemp: {
    id: 'soilTemp',
    label: 'Soil Temperature',
    servicePath: 'Dangermond_Soil_Temp_Datastreams',
    unit: '°C',
    // The combined average is what we want on the map. Depth-specific probes
    // stand in only when a station never populated that column.
    valueFields: ['soil_temp_avg', 'soil_temp_1_avg', 'soil_temp_2_avg', 'soil_temp_3_avg'],
    // Logger zeros at dead probes would otherwise plot as freezing.
    plausibleRange: [0.5, 55],
    ramp: TEMPERATURE_RAMP,
    decimals: 1,
    supportsInterpolation: false,
  },
  soilMoisture: {
    id: 'soilMoisture',
    label: 'Soil Moisture',
    servicePath: 'Dangermond_Soil_Moisture_Datastreams',
    unit: '%',
    valueFields: [
      'soil_moisture_avg',
      'soil_moisture_1_avg',
      'soil_moisture_2_avg',
      'soil_moisture_3_avg',
    ],
    plausibleRange: [0.05, 80],
    fractionAsPercent: true,
    ramp: SOIL_MOISTURE_RAMP,
    decimals: 1,
    supportsInterpolation: false,
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
  derivation:
    | 'reported'
    | 'midpoint'
    | 'sea-level'
    | 'midpoint+sea-level'
    | 'derived-head';
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

type Feature = { attributes: Attributes; geometry?: { x: number; y: number } };

/** Coordinate key used to hand a sampled elevation back to its station. */
function locationKey(longitude: number, latitude: number): string {
  return `${longitude},${latitude}`;
}

/**
 * Sample the terrain model for stations that report no elevation of their own.
 *
 * Only worth doing for variables that actually need an elevation; for the rest a
 * missing value costs nothing. Failures are non-fatal — those stations simply
 * drop out, exactly as they would have without this.
 */
async function sampleMissingElevations(features: Feature[]): Promise<Map<string, number>> {
  const pending: { key: string; longitude: number; latitude: number }[] = [];
  const seen = new Set<string>();

  for (const feature of features) {
    const attributes = feature.attributes;
    if (readNumber(attributes, 'elevation') !== null) continue;

    const longitude = feature.geometry?.x ?? readNumber(attributes, 'longitude');
    const latitude = feature.geometry?.y ?? readNumber(attributes, 'latitude');
    if (longitude == null || latitude == null) continue;

    const key = locationKey(longitude, latitude);
    if (seen.has(key)) continue;
    seen.add(key);
    pending.push({ key, longitude, latitude });
  }

  if (pending.length === 0) return new Map();

  try {
    const elevations = await fetchGroundElevations(pending);
    const resolved = new Map<string, number>();
    pending.forEach((point, index) => {
      const elevation = elevations[index];
      if (elevation !== null && elevation !== undefined) resolved.set(point.key, elevation);
    });

    if (resolved.size > 0) {
      console.info(
        `[sensorService] Filled ${resolved.size} of ${pending.length} missing station elevations from the terrain model.`,
      );
    }
    return resolved;
  } catch (caught) {
    console.warn('[sensorService] Terrain elevation lookup failed:', caught);
    return new Map();
  }
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

  const layerId = config.layerId ?? 0;
  const url =
    `${SERVICES_BASE}/${config.servicePath}/FeatureServer/${layerId}/query?${params.toString()}`;
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

  const excluded = new Set(
    (config.excludeStations ?? []).map((name) => name.trim().toLowerCase()),
  );

  const needsElevation = config.normalizeToSeaLevel === true || config.deriveHeadFromDepth === true;
  const sampledElevations = needsElevation
    ? await sampleMissingElevations(json.features ?? [])
    : new Map<string, number>();

  for (const feature of json.features ?? []) {
    const attributes = feature.attributes;
    const stationName = String(attributes.station_name ?? '').trim();

    if (excluded.has(stationName.toLowerCase())) continue;

    const longitude = feature.geometry?.x ?? readNumber(attributes, 'longitude');
    const latitude = feature.geometry?.y ?? readNumber(attributes, 'latitude');
    if (longitude == null || latitude == null) continue;

    const resolved = resolveValue(attributes, config);
    if (!resolved) continue;

    const magnitude = config.useMagnitude ? Math.abs(resolved.value) : resolved.value;
    let scaled = magnitude * (config.scaleToUnit ?? 1);
    if (config.fractionAsPercent && scaled > 0 && scaled <= 1) {
      scaled *= 100;
    }

    const [lowerBound, upperBound] = config.plausibleRange;
    if (scaled < lowerBound || scaled > upperBound) continue;

    const key = stationName || `${longitude},${latitude}`;
    if (seenStations.has(key)) continue;
    seenStations.add(key);

    const elevationMetres =
      readNumber(attributes, 'elevation')
      ?? sampledElevations.get(locationKey(longitude, latitude))
      ?? null;

    let value = scaled;
    let derivation: ScalarReading['derivation'] = resolved.isMidpoint ? 'midpoint' : 'reported';

    if (config.normalizeToSeaLevel) {
      // Without an elevation we cannot compare this station to the others.
      if (elevationMetres === null) continue;
      value = toSeaLevelPressure(value, elevationMetres);
      derivation = resolved.isMidpoint ? 'midpoint+sea-level' : 'sea-level';
    }

    if (config.deriveHeadFromDepth) {
      // A depth is only meaningful once placed on a shared datum, so a station
      // without a ground elevation cannot contribute.
      if (elevationMetres === null) continue;
      value = elevationMetres - scaled;
      derivation = 'derived-head';
    }

    if (config.transformedRange) {
      const [transformedLow, transformedHigh] = config.transformedRange;
      if (value < transformedLow || value > transformedHigh) continue;
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
