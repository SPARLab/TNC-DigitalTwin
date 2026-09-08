// ============================================================================
// Terrain Service — ground elevation from the preserve's own 2 m digital terrain
// model, used to fill in stations whose recorded elevation is missing.
//
// The station metadata is normally excellent: across the 33 groundwater wells it
// agrees with this model to a mean of 0.17 m. But a few rows have no elevation at
// all, and any quantity measured relative to the ground (depth to water, station
// pressure) cannot be placed on a shared datum without one.
// ============================================================================

import { CacheTTL, getCachedOrFetch } from '../../services/cacheService';

const DTM_URL =
  'https://dangermondpreserve-spatial.com/image/rest/services/Hosted/JLDP_Digital_Terrain_Model_2018/ImageServer';

/** Returned locations are matched back to inputs within roughly 50 m. */
const MATCH_TOLERANCE_DEGREES = 5e-4;

export interface TerrainQueryPoint {
  longitude: number;
  latitude: number;
}

interface RawSample {
  location?: { x: number; y: number };
  value?: string;
}

interface SamplesResponse {
  samples?: RawSample[];
  error?: { message?: string };
}

/**
 * `getSamples` accepts a multipoint, so any number of stations costs one request.
 * It may reorder or omit samples, hence matching by location rather than index.
 */
async function requestGroundElevations(
  points: TerrainQueryPoint[],
): Promise<(number | null)[]> {
  const geometry = JSON.stringify({
    points: points.map((point) => [point.longitude, point.latitude]),
    spatialReference: { wkid: 4326 },
  });

  const body = new URLSearchParams({
    f: 'json',
    geometry,
    geometryType: 'esriGeometryMultipoint',
    returnFirstValueOnly: 'true',
  });

  const response = await fetch(`${DTM_URL}/getSamples`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  });
  if (!response.ok) {
    throw new Error(`Terrain sample failed: HTTP ${response.status}`);
  }

  const json: SamplesResponse = await response.json();
  if (json.error) {
    throw new Error(`Terrain sample error: ${json.error.message ?? 'Unknown error'}`);
  }

  const samples = (json.samples ?? []).flatMap((sample) => {
    if (!sample.location || sample.value == null) return [];
    const value = Number.parseFloat(sample.value);
    if (!Number.isFinite(value)) return [];
    return [{ x: sample.location.x, y: sample.location.y, value }];
  });

  return points.map((point) => {
    let best: number | null = null;
    let bestDistance = Number.POSITIVE_INFINITY;

    for (const sample of samples) {
      const distance = Math.hypot(sample.x - point.longitude, sample.y - point.latitude);
      if (distance < bestDistance) {
        bestDistance = distance;
        best = sample.value;
      }
    }

    return bestDistance <= MATCH_TOLERANCE_DEGREES ? best : null;
  });
}

/**
 * Ground elevation in metres for each point, or null where the model has no
 * coverage. Terrain does not change, so results are cached for the session.
 */
export async function fetchGroundElevations(
  points: TerrainQueryPoint[],
): Promise<(number | null)[]> {
  if (points.length === 0) return [];

  return getCachedOrFetch(
    'terrain-ground-elevation',
    { points: points.map((point) => `${point.longitude},${point.latitude}`).sort() },
    () => requestGroundElevations(points),
    CacheTTL.VERY_LONG,
  );
}
