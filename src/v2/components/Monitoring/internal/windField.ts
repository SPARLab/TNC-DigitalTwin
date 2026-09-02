// ============================================================================
// Wind field interpolation.
//
// The stations are sparse points, so we inverse-distance-weight them into a
// continuous UV grid that both the particle overlay and the grid renderer
// sample from.
// ============================================================================

import type { WindReading } from '../../../services/windService';

export interface GeoExtent {
  xmin: number;
  xmax: number;
  ymin: number;
  ymax: number;
}

export interface WindField {
  /** Eastward component of the FROM vector, one entry per cell. */
  u: Float32Array;
  /** Northward component of the FROM vector, one entry per cell. */
  v: Float32Array;
  speeds: Float32Array;
  maxSpeed: number;
  cols: number;
  rows: number;
  extent: GeoExtent;
}

export interface FieldSample {
  u: number;
  v: number;
  speed: number;
  /** Speed normalized to 0-1 against the field maximum, for colour ramps. */
  t: number;
}

const DEFAULT_COLS = 80;
const DEFAULT_ROWS = 60;

/**
 * A high power keeps each station's reading dominant near itself rather than
 * smearing the whole preserve toward the mean.
 */
const IDW_POWER = 4;

/** Degrees of padding around the station bounding box. */
export const FIELD_PADDING_DEGREES = 0.03;

/** Minimal shape shared by every sensor reading, so this works for all variables. */
export interface GeoPoint {
  longitude: number;
  latitude: number;
}

export function getStationsExtent(
  readings: GeoPoint[],
  padding = FIELD_PADDING_DEGREES,
): GeoExtent {
  const longitudes = readings.map((reading) => reading.longitude);
  const latitudes = readings.map((reading) => reading.latitude);

  return {
    xmin: Math.min(...longitudes) - padding,
    xmax: Math.max(...longitudes) + padding,
    ymin: Math.min(...latitudes) - padding,
    ymax: Math.max(...latitudes) + padding,
  };
}

/**
 * Note the stored vector points the way the wind comes FROM, matching the raw
 * reading. Consumers that draw motion must negate it.
 */
export function buildWindField(
  readings: WindReading[],
  extent: GeoExtent,
  cols = DEFAULT_COLS,
  rows = DEFAULT_ROWS,
): WindField {
  const u = new Float32Array(cols * rows);
  const v = new Float32Array(cols * rows);
  const speeds = new Float32Array(cols * rows);

  const dxStep = (extent.xmax - extent.xmin) / cols;
  const dyStep = (extent.ymax - extent.ymin) / rows;

  let maxSpeed = 0;

  for (let row = 0; row < rows; row++) {
    const latitude = extent.ymax - (row + 0.5) * dyStep;

    for (let col = 0; col < cols; col++) {
      const longitude = extent.xmin + (col + 0.5) * dxStep;

      let weightSum = 0;
      let uSum = 0;
      let vSum = 0;

      for (const reading of readings) {
        const dx = longitude - reading.longitude;
        const dy = latitude - reading.latitude;
        // Guard against a cell landing exactly on a station.
        const distance = Math.sqrt(dx * dx + dy * dy) || 1e-8;
        const weight = 1 / Math.pow(distance, IDW_POWER);

        const radians = (reading.windDirectionAvg * Math.PI) / 180;
        const speed = reading.windSpeedAvg;
        uSum += weight * speed * Math.sin(radians);
        vSum += weight * speed * Math.cos(radians);
        weightSum += weight;
      }

      const index = row * cols + col;
      const cellU = uSum / weightSum;
      const cellV = vSum / weightSum;
      const cellSpeed = Math.sqrt(cellU * cellU + cellV * cellV);

      u[index] = cellU;
      v[index] = cellV;
      speeds[index] = cellSpeed;
      if (cellSpeed > maxSpeed) maxSpeed = cellSpeed;
    }
  }

  return { u, v, speeds, maxSpeed: maxSpeed || 1, cols, rows, extent };
}

export function sampleField(
  field: WindField,
  longitude: number,
  latitude: number,
): FieldSample | null {
  const { u, v, speeds, maxSpeed, cols, rows, extent } = field;

  const fx = ((longitude - extent.xmin) / (extent.xmax - extent.xmin)) * cols;
  const fy = ((extent.ymax - latitude) / (extent.ymax - extent.ymin)) * rows;

  const col = Math.floor(fx);
  const row = Math.floor(fy);
  if (col < 0 || col >= cols || row < 0 || row >= rows) return null;

  const index = row * cols + col;
  return {
    u: u[index],
    v: v[index],
    speed: speeds[index],
    t: speeds[index] / maxSpeed,
  };
}

export interface Rgb {
  r: number;
  g: number;
  b: number;
}

/**
 * Shared speed ramp — deep purple when calm through magenta to yellow when
 * strong. Every wind renderer and the legend read from here so they cannot
 * drift apart.
 */
export function getSpeedColor(t: number): Rgb {
  const clamped = Math.max(0, Math.min(1, t));
  return {
    r: Math.round(100 + clamped * 155),
    g: Math.round(20 + clamped * 235),
    b: Math.round(180 - clamped * 150),
  };
}

export function getSpeedColorCss(t: number, alpha = 1): string {
  const { r, g, b } = getSpeedColor(t);
  return alpha === 1 ? `rgb(${r}, ${g}, ${b})` : `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

/** ArcGIS symbol colours want a `[r, g, b, a]` tuple with 0-255 alpha. */
export function getSpeedColorArray(t: number, alpha = 255): [number, number, number, number] {
  const { r, g, b } = getSpeedColor(t);
  return [r, g, b, alpha];
}
