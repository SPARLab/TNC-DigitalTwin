// ============================================================================
// Wind Service — latest hourly readings from the Dangermond wind datastreams.
//
// Source: Dangermond_Wind_Datastreams/FeatureServer/0, one point feature per
// weather station holding its most recent aggregated reading. Publicly
// readable, so no token is attached.
// ============================================================================

import { CacheTTL, getCachedOrFetch } from '../../services/cacheService';

const WIND_LATEST_URL =
  'https://dangermondpreserve-spatial.com/server/rest/services/Dangermond_Wind_Datastreams/FeatureServer/0';

/**
 * `windDirectionAvg` follows the meteorological convention: degrees the wind is
 * coming FROM, clockwise from north. Use `getGoingBearing` before drawing
 * anything that should point the way the air is travelling.
 */
export interface WindReading {
  stationId: number;
  stationName: string;
  longitude: number;
  latitude: number;
  /** Epoch ms of the reading. */
  observedAt: number;
  /** Degrees the wind blows FROM, 0-360 clockwise from north. */
  windDirectionAvg: number;
  /** Metres per second. */
  windSpeedAvg: number;
  /** Metres per second. */
  windSpeedMax: number;
}

export interface WindSnapshot {
  readings: WindReading[];
  /** Newest `observedAt` across all reporting stations. */
  observedAt: number;
}

interface WindFeatureAttributes {
  station_id: number;
  station_name: string | null;
  latitude: number | null;
  longitude: number | null;
  latest_time: number | null;
  wind_direction_avg: number | null;
  wind_speed_avg: number | null;
  wind_speed_max: number | null;
}

interface WindQueryResponse {
  features?: { attributes: WindFeatureAttributes; geometry?: { x: number; y: number } }[];
  error?: { message?: string };
}

const OUT_FIELDS = [
  'station_id',
  'station_name',
  'latitude',
  'longitude',
  'latest_time',
  'wind_direction_avg',
  'wind_speed_avg',
  'wind_speed_max',
].join(',');

/** Convert a FROM bearing into the direction the air is travelling toward. */
export function getGoingBearing(fromBearingDegrees: number): number {
  return (fromBearingDegrees + 180) % 360;
}

const COMPASS_POINTS = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'] as const;

export function getCompassLabel(bearingDegrees: number): string {
  const normalized = ((bearingDegrees % 360) + 360) % 360;
  return COMPASS_POINTS[Math.round(normalized / 45) % 8];
}

async function requestLatestWind(): Promise<WindSnapshot> {
  const params = new URLSearchParams({
    f: 'json',
    where: 'wind_direction_avg IS NOT NULL AND wind_speed_avg IS NOT NULL',
    outFields: OUT_FIELDS,
    returnGeometry: 'true',
    outSR: '4326',
    resultRecordCount: '200',
  });

  const response = await fetch(`${WIND_LATEST_URL}/query?${params.toString()}`);
  if (!response.ok) {
    throw new Error(`Wind query failed: HTTP ${response.status}`);
  }

  const json: WindQueryResponse = await response.json();
  if (json.error) {
    const message = json.error.message ?? 'Unknown error';
    if (/token|auth|access|permission/i.test(message)) {
      throw new Error('This wind service now requires sign-in.');
    }
    throw new Error(`Wind query error: ${message}`);
  }

  const readings: WindReading[] = [];
  for (const feature of json.features ?? []) {
    const attributes = feature.attributes;
    const longitude = feature.geometry?.x ?? attributes.longitude;
    const latitude = feature.geometry?.y ?? attributes.latitude;

    // A station without coordinates cannot be placed or interpolated.
    if (longitude == null || latitude == null) continue;

    readings.push({
      stationId: attributes.station_id,
      stationName: attributes.station_name ?? `Station ${attributes.station_id}`,
      longitude,
      latitude,
      observedAt: attributes.latest_time ?? 0,
      windDirectionAvg: attributes.wind_direction_avg ?? 0,
      windSpeedAvg: attributes.wind_speed_avg ?? 0,
      windSpeedMax: attributes.wind_speed_max ?? 0,
    });
  }

  if (readings.length === 0) {
    throw new Error('No wind stations are reporting current readings.');
  }

  return {
    readings,
    observedAt: Math.max(...readings.map((reading) => reading.observedAt)),
  };
}

export async function fetchLatestWind(): Promise<WindSnapshot> {
  return getCachedOrFetch('wind-latest', {}, requestLatestWind, CacheTTL.SHORT);
}
