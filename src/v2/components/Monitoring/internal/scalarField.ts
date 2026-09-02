// ============================================================================
// Scalar IDW interpolation.
//
// The wind field interpolates a vector (u/v); this interpolates a single value
// per cell for temperature, humidity, pressure, and rainfall. It also records
// the distance to the nearest station per cell so the renderer can fade out
// where the estimate is barely supported by data.
// ============================================================================

import type { GeoExtent } from './windField';

export interface ScalarSamplePoint {
  longitude: number;
  latitude: number;
  value: number;
}

export interface ScalarField {
  values: Float32Array;
  /** Degrees to the closest station for each cell. */
  nearestDistance: Float32Array;
  min: number;
  max: number;
  cols: number;
  rows: number;
  extent: GeoExtent;
}

/**
 * Lower than the wind field's power of 4. Scalars like temperature vary smoothly
 * in space, so aggressive weighting would produce bullseyes around each station.
 */
const IDW_POWER = 2;

export function buildScalarField(
  points: ScalarSamplePoint[],
  extent: GeoExtent,
  cols: number,
  rows: number,
): ScalarField {
  const values = new Float32Array(cols * rows);
  const nearestDistance = new Float32Array(cols * rows);

  const dxStep = (extent.xmax - extent.xmin) / cols;
  const dyStep = (extent.ymax - extent.ymin) / rows;

  let min = Number.POSITIVE_INFINITY;
  let max = Number.NEGATIVE_INFINITY;

  for (let row = 0; row < rows; row++) {
    const latitude = extent.ymax - (row + 0.5) * dyStep;

    for (let col = 0; col < cols; col++) {
      const longitude = extent.xmin + (col + 0.5) * dxStep;

      let weightSum = 0;
      let valueSum = 0;
      let closest = Number.POSITIVE_INFINITY;

      for (const point of points) {
        const dx = longitude - point.longitude;
        const dy = latitude - point.latitude;
        const distance = Math.sqrt(dx * dx + dy * dy);
        if (distance < closest) closest = distance;

        const weight = 1 / Math.pow(distance || 1e-8, IDW_POWER);
        valueSum += weight * point.value;
        weightSum += weight;
      }

      const index = row * cols + col;
      const value = valueSum / weightSum;

      values[index] = value;
      nearestDistance[index] = closest;

      if (value < min) min = value;
      if (value > max) max = value;
    }
  }

  return { values, nearestDistance, min, max, cols, rows, extent };
}

/**
 * Normalize against the observed station range rather than the interpolated
 * range: IDW never exceeds its inputs, so using station min/max keeps the legend
 * honest about what was actually measured.
 */
export function normalize(value: number, min: number, max: number): number {
  // A flat field sits at the bottom of the ramp, not the middle: mid-ramp would
  // colour an unchanging variable as though it were halfway up its scale.
  if (max - min < 1e-9) return 0;
  return (value - min) / (max - min);
}

/** Fallback spacing in degrees when there is only one station to work with. */
const FALLBACK_SPACING_DEGREES = 0.02;

/**
 * Median distance between a station and its closest neighbour, in degrees.
 *
 * This is the natural length scale of the network, so the renderer derives its
 * fade distances from it rather than hard-coding values that would be wrong the
 * moment stations are added or a variable reports from a different subset.
 */
export function getMedianNearestNeighbourDistance(
  points: { longitude: number; latitude: number }[],
): number {
  if (points.length < 2) return FALLBACK_SPACING_DEGREES;

  const nearest: number[] = [];

  for (let i = 0; i < points.length; i++) {
    let best = Number.POSITIVE_INFINITY;

    for (let j = 0; j < points.length; j++) {
      if (i === j) continue;
      const dx = points[i].longitude - points[j].longitude;
      const dy = points[i].latitude - points[j].latitude;
      const distance = Math.sqrt(dx * dx + dy * dy);
      if (distance < best) best = distance;
    }

    if (Number.isFinite(best)) nearest.push(best);
  }

  if (nearest.length === 0) return FALLBACK_SPACING_DEGREES;

  nearest.sort((a, b) => a - b);
  return nearest[Math.floor(nearest.length / 2)] || FALLBACK_SPACING_DEGREES;
}
