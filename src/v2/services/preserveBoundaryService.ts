// ============================================================================
// Preserve boundary geometry.
//
// The catalog's "Dangermond Preserve Simple Boundary" serves two jobs on the
// monitoring map: a light outline showing where the preserve is, and the clip
// region for the interpolated surfaces so they stop at a meaningful edge instead
// of a raster rectangle.
//
// The clip uses a buffered copy. Stations sit inside the preserve, so clipping to
// the boundary exactly would shave the surface right where the outermost stations
// are; a buffer keeps them comfortably covered.
// ============================================================================

import Polygon from '@arcgis/core/geometry/Polygon';
import { geodesicBuffer } from '@arcgis/core/geometry/geometryEngine';
import { getCachedOrFetch, CacheTTL } from '../../services/cacheService';
import type { GeoExtent } from '../components/Monitoring/internal/windField';

/** Layer 2 of the service; ids 0 and 1 are not published. */
export const PRESERVE_BOUNDARY_LAYER_URL =
  'https://services.arcgis.com/F7DSX1DSNSiWmOqh/arcgis/rest/services/jldp_boundary/FeatureServer/2';

/** Outer ring first, then any holes, as [longitude, latitude] pairs. */
export type BoundaryRing = [number, number][];

export interface PreserveBoundary {
  /** The boundary as published, for the outline. */
  rings: BoundaryRing[];
  /** Buffered outward by `bufferKm`, for clipping surfaces. */
  clipRings: BoundaryRing[];
  /** Bounding box of the buffered rings. */
  clipExtent: GeoExtent;
}

interface QueryResponse {
  features?: { geometry?: { rings?: number[][][] } }[];
  error?: { message?: string };
}

function toRings(raw: number[][][]): BoundaryRing[] {
  return raw
    .filter((ring) => ring.length >= 4)
    .map((ring) => ring.map(([longitude, latitude]) => [longitude, latitude] as [number, number]));
}

function getRingsExtent(rings: BoundaryRing[]): GeoExtent {
  let xmin = Number.POSITIVE_INFINITY;
  let ymin = Number.POSITIVE_INFINITY;
  let xmax = Number.NEGATIVE_INFINITY;
  let ymax = Number.NEGATIVE_INFINITY;

  for (const ring of rings) {
    for (const [longitude, latitude] of ring) {
      if (longitude < xmin) xmin = longitude;
      if (longitude > xmax) xmax = longitude;
      if (latitude < ymin) ymin = latitude;
      if (latitude > ymax) ymax = latitude;
    }
  }

  return { xmin, ymin, xmax, ymax };
}

async function requestBoundary(bufferKm: number): Promise<PreserveBoundary> {
  const params = new URLSearchParams({
    f: 'json',
    where: '1=1',
    returnGeometry: 'true',
    outFields: '',
    // Requested in WGS84 so the rings can be used directly for clipping and
    // buffering without a projection round trip.
    outSR: '4326',
  });

  const response = await fetch(`${PRESERVE_BOUNDARY_LAYER_URL}/query?${params}`);
  if (!response.ok) {
    throw new Error(`Preserve boundary request failed: ${response.status}`);
  }

  const payload = (await response.json()) as QueryResponse;
  if (payload.error) {
    throw new Error(payload.error.message ?? 'Preserve boundary request failed.');
  }

  const raw = payload.features?.[0]?.geometry?.rings;
  if (!raw?.length) throw new Error('Preserve boundary returned no geometry.');

  const rings = toRings(raw);

  const polygon = new Polygon({ rings, spatialReference: { wkid: 4326 } });
  const buffered = geodesicBuffer(polygon, bufferKm, 'kilometers');
  const bufferedPolygon = Array.isArray(buffered) ? buffered[0] : buffered;

  // Fall back to the unbuffered boundary rather than failing outright: a slightly
  // tight clip is better than no surface at all.
  const clipRings = bufferedPolygon
    ? toRings(bufferedPolygon.rings as number[][][])
    : rings;

  return { rings, clipRings, clipExtent: getRingsExtent(clipRings) };
}

export async function fetchPreserveBoundary(bufferKm = 1): Promise<PreserveBoundary> {
  return getCachedOrFetch(
    'preserve-boundary',
    { bufferKm },
    () => requestBoundary(bufferKm),
    // The property line does not move.
    CacheTTL.VERY_LONG,
  );
}
