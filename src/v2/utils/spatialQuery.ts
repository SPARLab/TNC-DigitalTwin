export type LonLat = [number, number];

export interface SpatialPolygon {
  id: string;
  ring: LonLat[];
  createdAt: number;
}

function normalizeRing(rawRing: LonLat[]): LonLat[] {
  if (rawRing.length < 3) return [];
  const first = rawRing[0];
  const last = rawRing[rawRing.length - 1];
  const isClosed = first[0] === last[0] && first[1] === last[1];
  return isClosed ? rawRing : [...rawRing, first];
}

export function createSpatialPolygon(ring: LonLat[]): SpatialPolygon | null {
  const normalizedRing = normalizeRing(ring);
  if (normalizedRing.length < 4) return null;
  return {
    id: crypto.randomUUID(),
    ring: normalizedRing,
    createdAt: Date.now(),
  };
}

export function isPointInsideSpatialPolygon(
  polygon: SpatialPolygon | null | undefined,
  longitude: number,
  latitude: number,
): boolean {
  if (!polygon) return true;
  const ring = polygon.ring;
  if (ring.length < 4) return true;

  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i, i += 1) {
    const [xi, yi] = ring[i];
    const [xj, yj] = ring[j];

    const intersects = ((yi > latitude) !== (yj > latitude))
      && (longitude < ((xj - xi) * (latitude - yi)) / ((yj - yi) || Number.EPSILON) + xi);
    if (intersects) inside = !inside;
  }
  return inside;
}
