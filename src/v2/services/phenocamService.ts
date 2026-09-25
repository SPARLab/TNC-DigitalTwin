// ============================================================================
// PhenoCam Service — Query Dangermond_PhenoCam_Imagery FeatureServer.
//
// Layer 0: PhenoCam Cameras (site points)
// Layer 1: PhenoCam Latest Image (latest_image_url per camera)
// Table 2: PhenoCam Images (timestamped archive)
// ============================================================================

import { CacheTTL, getCachedOrFetch } from '../../services/cacheService';

export const PHENOCAM_SERVICE_PATH = 'Dangermond_PhenoCam_Imagery';
export const PHENOCAM_DEFAULT_SERVICE_URL =
  `https://dangermondpreserve-spatial.com/server/rest/services/${PHENOCAM_SERVICE_PATH}/FeatureServer`;

export const PHENOCAM_CAMERAS_LAYER_ID = 0;
export const PHENOCAM_LATEST_LAYER_ID = 1;
export const PHENOCAM_IMAGES_TABLE_ID = 2;

export interface PhenoCamera {
  id: number;
  sitename: string;
  siteLabel: string;
  latitude: number;
  longitude: number;
  elevation: number | null;
  active: boolean;
  imageCount: number;
  dateFirst: number | null;
  dateLast: number | null;
  acknowledgment: string | null;
}

export interface PhenoLatestImage {
  cameraId: number;
  sitename: string;
  siteLabel: string;
  latitude: number;
  longitude: number;
  latestImageUrl: string;
  latestImageName: string | null;
  latestTimeLocal: number | null;
  latestTimeUtc: number | null;
  acknowledgment: string | null;
}

export interface PhenoImage {
  id: number;
  cameraId: number;
  sitename: string;
  siteLabel: string;
  imageUrl: string;
  imageName: string | null;
  timestampLocal: number | null;
  timestampUtc: number | null;
}

export interface PhenoImageQuery {
  cameraId?: number | null;
  /** Inclusive YYYY-MM-DD (local calendar day, applied to timestamp_utc). */
  startDate?: string | null;
  endDate?: string | null;
  resultOffset?: number;
  resultRecordCount?: number;
}

type Attributes = Record<string, string | number | null | undefined>;

interface QueryResponse {
  features?: { attributes: Attributes; geometry?: { x: number; y: number } }[];
  count?: number;
  error?: { message?: string };
}

function readNumber(attrs: Attributes, ...keys: string[]): number | null {
  for (const key of keys) {
    const value = attrs[key];
    if (typeof value === 'number' && Number.isFinite(value)) return value;
  }
  return null;
}

function readString(attrs: Attributes, ...keys: string[]): string | null {
  for (const key of keys) {
    const value = attrs[key];
    if (typeof value === 'string' && value.trim()) return value.trim();
  }
  return null;
}

function dayStartUtcMs(ymd: string): number {
  return Date.parse(`${ymd}T00:00:00.000Z`);
}

function dayEndUtcMs(ymd: string): number {
  return Date.parse(`${ymd}T23:59:59.999Z`);
}

export function buildPhenoCamServiceUrl(serverBaseUrl: string, servicePath: string): string {
  const base = serverBaseUrl.trim().replace(/\/+$/, '');
  const path = servicePath.trim().replace(/^\/+/, '').replace(/\/+$/, '');
  const protocol = base.startsWith('http') ? '' : 'https://';
  const withRest = /\/rest\/services$/i.test(base) ? base : `${base}/rest/services`;
  return `${protocol}${withRest}/${path}/FeatureServer`;
}

function layerQueryUrl(
  serviceUrl: string,
  layerId: number,
  params: Record<string, string>,
): string {
  const qs = new URLSearchParams({ f: 'json', ...params });
  return `${serviceUrl.replace(/\/+$/, '')}/${layerId}/query?${qs.toString()}`;
}

async function queryLayer(
  serviceUrl: string,
  layerId: number,
  params: Record<string, string>,
): Promise<QueryResponse> {
  const response = await fetch(layerQueryUrl(serviceUrl, layerId, params));
  if (!response.ok) throw new Error(`PhenoCam query failed (${response.status})`);
  const payload = (await response.json()) as QueryResponse;
  if (payload.error?.message) throw new Error(payload.error.message);
  return payload;
}

function parseCamera(feature: { attributes: Attributes; geometry?: { x: number; y: number } }): PhenoCamera | null {
  const attrs = feature.attributes ?? {};
  const id = readNumber(attrs, 'id', 'OBJECTID', 'objectid');
  const latitude = readNumber(attrs, 'latitude') ?? feature.geometry?.y ?? null;
  const longitude = readNumber(attrs, 'longitude') ?? feature.geometry?.x ?? null;
  if (id == null || latitude == null || longitude == null) return null;
  const siteLabel = readString(attrs, 'site_label', 'sitename') ?? `Camera ${id}`;
  const sitename = readString(attrs, 'sitename') ?? siteLabel;
  return {
    id,
    sitename,
    siteLabel,
    latitude,
    longitude,
    elevation: readNumber(attrs, 'elevation'),
    active: readNumber(attrs, 'active') === 1,
    imageCount: readNumber(attrs, 'image_count') ?? 0,
    dateFirst: readNumber(attrs, 'date_first'),
    dateLast: readNumber(attrs, 'date_last'),
    acknowledgment: readString(attrs, 'site_acknowledgment'),
  };
}

function parseLatest(feature: { attributes: Attributes; geometry?: { x: number; y: number } }): PhenoLatestImage | null {
  const attrs = feature.attributes ?? {};
  const cameraId = readNumber(attrs, 'camera_id', 'id');
  const imageUrl = readString(attrs, 'latest_image_url', 'image_url');
  const latitude = readNumber(attrs, 'latitude') ?? feature.geometry?.y ?? null;
  const longitude = readNumber(attrs, 'longitude') ?? feature.geometry?.x ?? null;
  if (cameraId == null || !imageUrl || latitude == null || longitude == null) return null;
  const siteLabel = readString(attrs, 'site_label', 'sitename') ?? `Camera ${cameraId}`;
  return {
    cameraId,
    sitename: readString(attrs, 'sitename') ?? siteLabel,
    siteLabel,
    latitude,
    longitude,
    latestImageUrl: imageUrl,
    latestImageName: readString(attrs, 'latest_image_name', 'image_name'),
    latestTimeLocal: readNumber(attrs, 'latest_time_local'),
    latestTimeUtc: readNumber(attrs, 'latest_time_utc'),
    acknowledgment: readString(attrs, 'site_acknowledgment'),
  };
}

function parseImage(feature: { attributes: Attributes }): PhenoImage | null {
  const attrs = feature.attributes ?? {};
  const id = readNumber(attrs, 'id', 'OBJECTID', 'objectid');
  const cameraId = readNumber(attrs, 'camera_id');
  const imageUrl = readString(attrs, 'image_url');
  if (id == null || cameraId == null || !imageUrl) return null;
  const siteLabel = readString(attrs, 'site_label', 'sitename') ?? `Camera ${cameraId}`;
  return {
    id,
    cameraId,
    sitename: readString(attrs, 'sitename') ?? siteLabel,
    siteLabel,
    imageUrl,
    imageName: readString(attrs, 'image_name'),
    timestampLocal: readNumber(attrs, 'timestamp_local'),
    timestampUtc: readNumber(attrs, 'timestamp_utc'),
  };
}

export async function fetchPhenoCameras(serviceUrl: string): Promise<PhenoCamera[]> {
  return getCachedOrFetch(
    'phenocam-cameras',
    { serviceUrl },
    async () => {
      const payload = await queryLayer(serviceUrl, PHENOCAM_CAMERAS_LAYER_ID, {
        where: '1=1',
        outFields: '*',
        returnGeometry: 'true',
        outSR: '4326',
      });
      return (payload.features ?? [])
        .map(parseCamera)
        .filter((camera): camera is PhenoCamera => camera != null)
        .sort((a, b) => a.siteLabel.localeCompare(b.siteLabel));
    },
    CacheTTL.MEDIUM,
  );
}

export async function fetchPhenoLatestImages(serviceUrl: string): Promise<PhenoLatestImage[]> {
  return getCachedOrFetch(
    'phenocam-latest',
    { serviceUrl },
    async () => {
      const payload = await queryLayer(serviceUrl, PHENOCAM_LATEST_LAYER_ID, {
        where: '1=1',
        outFields: '*',
        returnGeometry: 'true',
        outSR: '4326',
      });
      return (payload.features ?? [])
        .map(parseLatest)
        .filter((image): image is PhenoLatestImage => image != null)
        .sort((a, b) => a.siteLabel.localeCompare(b.siteLabel));
    },
    CacheTTL.SHORT,
  );
}

function buildImagesWhere(query: PhenoImageQuery): string {
  const clauses: string[] = ['1=1'];
  if (query.cameraId != null && Number.isFinite(query.cameraId)) {
    clauses.push(`camera_id = ${query.cameraId}`);
  }
  if (query.startDate) {
    const startMs = dayStartUtcMs(query.startDate);
    if (Number.isFinite(startMs)) clauses.push(`timestamp_utc >= ${startMs}`);
  }
  if (query.endDate) {
    const endMs = dayEndUtcMs(query.endDate);
    if (Number.isFinite(endMs)) clauses.push(`timestamp_utc <= ${endMs}`);
  }
  return clauses.join(' AND ');
}

export async function fetchPhenoImages(
  serviceUrl: string,
  query: PhenoImageQuery = {},
): Promise<PhenoImage[]> {
  const payload = await queryLayer(serviceUrl, PHENOCAM_IMAGES_TABLE_ID, {
    where: buildImagesWhere(query),
    outFields: '*',
    returnGeometry: 'false',
    orderByFields: 'timestamp_utc DESC',
    resultOffset: String(query.resultOffset ?? 0),
    resultRecordCount: String(query.resultRecordCount ?? 48),
  });
  return (payload.features ?? [])
    .map(parseImage)
    .filter((image): image is PhenoImage => image != null);
}

export async function countPhenoImages(
  serviceUrl: string,
  query: PhenoImageQuery = {},
): Promise<number> {
  const payload = await queryLayer(serviceUrl, PHENOCAM_IMAGES_TABLE_ID, {
    where: buildImagesWhere(query),
    returnCountOnly: 'true',
  });
  return typeof payload.count === 'number' ? payload.count : 0;
}

export function formatPhenoTimestamp(epochMs: number | null | undefined): string {
  if (epochMs == null || !Number.isFinite(epochMs)) return '—';
  return new Date(epochMs).toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}
