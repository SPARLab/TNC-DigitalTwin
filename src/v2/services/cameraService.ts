// ============================================================================
// Camera Service — latest ALERTCalifornia camera locations and frames.
//
// Source: ALERTCalifornia_Camera_Feed/FeatureServer, hosted on ArcGIS Online.
// Layer 0 is the camera points; layer 1 is the viewshed polygon for each
// camera. The statewide feed is huge, so we only ask for cameras that sit
// inside a preserve-centred envelope (Dangermond 1 and 2 today).
// ============================================================================

import { CacheTTL, getCachedOrFetch } from '../../services/cacheService';

/** Service directory name, used to match this renderer to its catalog row. */
export const CAMERA_SERVICE_PATH = 'ALERTCalifornia_Camera_Feed';

const CAMERA_SERVICE_ROOT =
  'https://services8.arcgis.com/X84q166Srnyl4JMV/arcgis/rest/services/ALERTCalifornia_Camera_Feed/FeatureServer';

const CAMERA_LAYER_URL = `${CAMERA_SERVICE_ROOT}/0`;
const VIEWSHED_LAYER_URL = `${CAMERA_SERVICE_ROOT}/1`;

/**
 * Rough box around the preserve. Statewide ALERTCalifornia has a thousand-plus
 * cameras; Live Monitoring only wants the ones that can actually see this land.
 */
export const PRESERVE_CAMERA_ENVELOPE = {
  xmin: -120.65,
  ymin: 34.38,
  xmax: -120.25,
  ymax: 34.62,
};

export interface CameraStation {
  objectId: number;
  cameraName: string;
  siteId: string;
  isOnline: boolean;
  isActive: boolean;
  longitude: number;
  latitude: number;
  /** Geographic pan in degrees, clockwise from north. Null if unpublished. */
  pan: number | null;
  viewTime: string | null;
  /** Epoch ms of `viewTime` (last PTZ / view update), when it parses. */
  viewedAt: number | null;
  /**
   * Epoch ms of the latest JPEG, from ALERTCalifornia `last_frame_ts`.
   * `viewTime` on the feature service is when the camera last moved, not when
   * the frame was captured — they often disagree by hours.
   */
  capturedAt: number | null;
  imageUrl: string | null;
  cameraUrl: string | null;
}

export interface CameraViewshed {
  cameraName: string;
  objectId: number;
  rings: number[][][];
}

export interface CameraSnapshot {
  cameras: CameraStation[];
  viewsheds: CameraViewshed[];
}

interface CameraFeatureAttributes {
  OBJECTID: number;
  cameraName: string | null;
  siteId: string | null;
  isOnline: string | null;
  isActive: string | null;
  positionPan: number | null;
  viewTime: string | null;
  imageURL: string | null;
  cameraURL: string | null;
}

interface CameraQueryResponse {
  features?: {
    attributes: CameraFeatureAttributes;
    geometry?: { x: number; y: number };
  }[];
  error?: { message?: string };
}

interface ViewshedQueryResponse {
  features?: {
    attributes: { OBJECTID: number; cameraName: string | null };
    geometry?: { rings?: number[][][] };
  }[];
  error?: { message?: string };
}

const CAMERA_OUT_FIELDS = [
  'OBJECTID',
  'cameraName',
  'siteId',
  'isOnline',
  'isActive',
  'positionPan',
  'viewTime',
  'imageURL',
  'cameraURL',
].join(',');

const FRAME_INDEX_URL =
  'https://cameras.alertcalifornia.org/public-camera-data/all_cameras-v3.json';

/** Display timestamps in Pacific, matching the cameras' local clock. */
const DISPLAY_TIME_ZONE = 'America/Los_Angeles';

/**
 * ALERTCalifornia stores PTZ view time as `"2026-09-04 00:20:50-07:00"`.
 * Inserting the ISO `T` is enough for `Date.parse`.
 */
export function parseViewTime(value: string | null | undefined): number | null {
  if (!value) return null;
  const parsed = Date.parse(value.replace(' ', 'T'));
  return Number.isNaN(parsed) ? null : parsed;
}

export function formatCameraTimestamp(epochMs: number | null | undefined): string | null {
  if (!epochMs) return null;
  return new Date(epochMs).toLocaleString('en-US', {
    timeZone: DISPLAY_TIME_ZONE,
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    timeZoneName: 'short',
  });
}

/** Prefers the JPEG capture time; `viewTime` is only a PTZ fallback. */
export function describeCameraTime(camera: {
  capturedAt: number | null;
  viewedAt: number | null;
  viewTime: string | null;
}): string {
  const captured = formatCameraTimestamp(camera.capturedAt);
  if (captured) return `captured ${captured}`;
  const viewed = formatCameraTimestamp(camera.viewedAt);
  if (viewed) return `view updated ${viewed}`;
  return camera.viewTime ?? 'time unknown';
}

export function extractAxisId(camera: {
  cameraUrl: string | null;
  imageUrl: string | null;
}): string | null {
  if (camera.cameraUrl) {
    try {
      const id = new URL(camera.cameraUrl).searchParams.get('id');
      if (id) return id;
    } catch {
      // Fall through to the image URL.
    }
  }

  if (camera.imageUrl) {
    const match = camera.imageUrl.match(/\/public-camera-data\/([^/]+)\//);
    if (match) return match[1];
  }

  return null;
}

function toEpochMs(unixValue: number): number {
  return unixValue < 1e12 ? unixValue * 1000 : unixValue;
}

/** Bypass CDN caching of `latest-frame.jpg` when the snapshot is refreshed. */
export function withImageCacheBust(url: string, cacheKey: number): string {
  const separator = url.includes('?') ? '&' : '?';
  return `${url}${separator}t=${cacheKey}`;
}

function envelopeParams(): Record<string, string> {
  const { xmin, ymin, xmax, ymax } = PRESERVE_CAMERA_ENVELOPE;
  return {
    geometry: `${xmin},${ymin},${xmax},${ymax}`,
    geometryType: 'esriGeometryEnvelope',
    inSR: '4326',
    spatialRel: 'esriSpatialRelIntersects',
  };
}

async function parseJson<T extends { error?: { message?: string } }>(
  response: Response,
  label: string,
): Promise<T> {
  if (!response.ok) {
    throw new Error(`${label} failed: HTTP ${response.status}`);
  }

  const json = (await response.json()) as T;
  if (json.error) {
    throw new Error(`${label} error: ${json.error.message ?? 'Unknown error'}`);
  }
  return json;
}

function toCamera(feature: NonNullable<CameraQueryResponse['features']>[number]): CameraStation | null {
  const attributes = feature.attributes;
  const longitude = feature.geometry?.x;
  const latitude = feature.geometry?.y;
  if (longitude == null || latitude == null || attributes.OBJECTID == null) return null;

  return {
    objectId: attributes.OBJECTID,
    cameraName: attributes.cameraName?.trim() || `Camera ${attributes.OBJECTID}`,
    siteId: attributes.siteId?.trim() || '',
    isOnline: attributes.isOnline?.toLowerCase() === 'online',
    isActive: attributes.isActive?.toLowerCase() === 'active',
    longitude,
    latitude,
    pan: attributes.positionPan,
    viewTime: attributes.viewTime,
    viewedAt: parseViewTime(attributes.viewTime),
    capturedAt: null,
    imageUrl: attributes.imageURL?.trim() || null,
    cameraUrl: attributes.cameraURL?.trim() || null,
  };
}

async function requestCameras(): Promise<CameraStation[]> {
  const params = new URLSearchParams({
    f: 'json',
    where: '1=1',
    outFields: CAMERA_OUT_FIELDS,
    returnGeometry: 'true',
    outSR: '4326',
    resultRecordCount: '200',
    ...envelopeParams(),
  });

  const json = await parseJson<CameraQueryResponse>(
    await fetch(`${CAMERA_LAYER_URL}/query?${params.toString()}`),
    'Camera query',
  );

  const cameras: CameraStation[] = [];
  for (const feature of json.features ?? []) {
    const camera = toCamera(feature);
    if (camera) cameras.push(camera);
  }

  cameras.sort((a, b) => a.cameraName.localeCompare(b.cameraName));
  return cameras;
}

function sqlList(values: string[]): string {
  return values
    .map((value) => `'${value.replace(/'/g, "''")}'`)
    .join(',');
}

async function requestViewsheds(cameras: CameraStation[]): Promise<CameraViewshed[]> {
  if (cameras.length === 0) return [];

  const names = cameras.map((camera) => camera.cameraName);
  const params = new URLSearchParams({
    f: 'json',
    where: `cameraName IN (${sqlList(names)})`,
    outFields: 'OBJECTID,cameraName',
    returnGeometry: 'true',
    outSR: '4326',
    // Viewsheds are dense; this keeps the polygon light enough to draw quickly.
    maxAllowableOffset: '0.00008',
  });

  try {
    const json = await parseJson<ViewshedQueryResponse>(
      await fetch(`${VIEWSHED_LAYER_URL}/query?${params.toString()}`),
      'Viewshed query',
    );

    const byName = new Map(cameras.map((camera) => [camera.cameraName, camera.objectId]));
    const viewsheds: CameraViewshed[] = [];

    for (const feature of json.features ?? []) {
      const cameraName = feature.attributes.cameraName?.trim();
      const rings = feature.geometry?.rings;
      if (!cameraName || !rings?.length) continue;

      const objectId = byName.get(cameraName);
      if (objectId == null) continue;

      viewsheds.push({ cameraName, objectId, rings });
    }

    return viewsheds;
  } catch (caught) {
    // Cameras without a viewshed are still useful; don't fail the whole snapshot.
    console.warn('[cameraService] Could not load viewsheds:', caught);
    return [];
  }
}

async function requestFrameTimes(axisIds: string[]): Promise<Map<string, number>> {
  const wanted = new Set(axisIds);
  const times = new Map<string, number>();
  if (wanted.size === 0) return times;

  try {
    const json = await parseJson<{
      features?: { properties?: { id?: string; last_frame_ts?: number } }[];
      error?: { message?: string };
    }>(await fetch(FRAME_INDEX_URL), 'Camera frame index');

    for (const feature of json.features ?? []) {
      const id = feature.properties?.id;
      const timestamp = feature.properties?.last_frame_ts;
      if (!id || !wanted.has(id) || typeof timestamp !== 'number') continue;
      times.set(id, toEpochMs(timestamp));
    }
  } catch (caught) {
    console.warn('[cameraService] Could not load latest-frame timestamps:', caught);
  }

  return times;
}

async function requestLatestCameras(): Promise<CameraSnapshot> {
  const cameras = await requestCameras();
  if (cameras.length === 0) {
    throw new Error('No ALERTCalifornia cameras are reporting near the preserve.');
  }

  const axisIds = cameras
    .map((camera) => extractAxisId(camera))
    .filter((id): id is string => id != null);

  const [viewsheds, frameTimes] = await Promise.all([
    requestViewsheds(cameras),
    requestFrameTimes(axisIds),
  ]);

  for (const camera of cameras) {
    const axisId = extractAxisId(camera);
    if (!axisId) continue;
    camera.capturedAt = frameTimes.get(axisId) ?? null;
  }

  return { cameras, viewsheds };
}

export async function fetchLatestCameras(): Promise<CameraSnapshot> {
  return getCachedOrFetch('cameras-latest', {}, requestLatestCameras, CacheTTL.SHORT);
}
