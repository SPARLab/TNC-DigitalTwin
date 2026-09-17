// ============================================================================
// Dendra Latest labels — monitoring-style value badges for catalog Latest layers.
// ============================================================================

import GraphicsLayer from '@arcgis/core/layers/GraphicsLayer';
import { createScalarBadgeLayer } from '../../Monitoring/internal/scalarGraphicsLayers';
import { createValueBadgeLayer, type BadgePoint } from '../../Monitoring/internal/valueBadgeLayer';
import { getSpeedColorArray } from '../../Monitoring/internal/windField';
import { resolveRendererBinding } from '../../../config/monitoringRenderers';
import {
  fetchSensorSnapshot,
  SENSOR_VARIABLES,
  type SensorVariableId,
} from '../../../services/sensorService';
import { fetchLatestWind } from '../../../services/windService';
import { formatStationDisplayName } from '../../../services/dendraStationService';
import { CacheTTL, getCachedOrFetch } from '../../../../services/cacheService';

const SENTINEL_MAX = -999;

interface GenericLatestReading {
  stationId: number;
  stationName: string;
  longitude: number;
  latitude: number;
  value: number;
  unit: string;
  field: string;
  observedAt: number | null;
}

type Attributes = Record<string, number | string | null>;

interface QueryResponse {
  features?: { attributes: Attributes; geometry?: { x: number; y: number } }[];
  error?: { message?: string };
}

function isScalarId(id: string): id is SensorVariableId {
  return Object.prototype.hasOwnProperty.call(SENSOR_VARIABLES, id);
}

function readNumber(attributes: Attributes, field: string): number | null {
  const value = attributes[field];
  if (typeof value !== 'number' || !Number.isFinite(value)) return null;
  if (value <= SENTINEL_MAX) return null;
  return value;
}

function pickValueField(attributes: Attributes): { field: string; value: number } | null {
  const keys = Object.keys(attributes);
  const preferred = keys.filter((key) =>
    /(_avg|average|value|reading|depth|discharge|level|height|rainfall|temp|moisture|conductivity|radiation|pressure|humidity)$/i.test(key)
    || /^(temp|humidity|pressure|rainfall|discharge|value)$/i.test(key),
  );
  const candidates = [...preferred, ...keys];
  const skip = /^(objectid|station_id|sensor_id|fid|id|latitude|longitude|elevation|shape|globalid)$/i;

  for (const field of candidates) {
    if (skip.test(field)) continue;
    const value = readNumber(attributes, field);
    if (value !== null) return { field, value };
  }
  return null;
}

async function fetchGenericLatestReadings(
  serviceUrl: string,
  layerId: number,
): Promise<GenericLatestReading[]> {
  const url =
    `${serviceUrl.replace(/\/+$/, '')}/${layerId}/query`
    + '?where=1%3D1&outFields=*&returnGeometry=true&outSR=4326&f=json';

  const response = await fetch(url);
  if (!response.ok) throw new Error(`Latest query failed (${response.status})`);
  const payload = (await response.json()) as QueryResponse;
  if (payload.error?.message) throw new Error(payload.error.message);

  const readings: GenericLatestReading[] = [];
  for (const feature of payload.features ?? []) {
    const attrs = feature.attributes ?? {};
    const picked = pickValueField(attrs);
    if (!picked) continue;

    const longitude = typeof attrs.longitude === 'number'
      ? attrs.longitude
      : feature.geometry?.x;
    const latitude = typeof attrs.latitude === 'number'
      ? attrs.latitude
      : feature.geometry?.y;
    if (typeof longitude !== 'number' || typeof latitude !== 'number') continue;

    const stationId = typeof attrs.station_id === 'number' ? attrs.station_id : readings.length;
    const stationName = typeof attrs.station_name === 'string'
      ? attrs.station_name
      : `Station ${stationId}`;
    const unit = typeof attrs.unit === 'string' ? attrs.unit : '';
    const observedAt = typeof attrs.latest_time === 'number'
      ? attrs.latest_time
      : typeof attrs.observed_at === 'number'
        ? attrs.observed_at
        : null;

    readings.push({
      stationId,
      stationName,
      longitude,
      latitude,
      value: picked.value,
      unit,
      field: picked.field,
      observedAt,
    });
  }
  return readings;
}

function applyBadgeGraphics(target: GraphicsLayer, source: GraphicsLayer): void {
  target.removeAll();
  target.addMany(source.graphics.toArray());
  // Detach temporary layer without destroying shared symbol resources mid-copy.
  source.removeAll();
}

function buildGenericBadgeLayer(readings: GenericLatestReading[], title: string): GraphicsLayer {
  const values = readings.map((reading) => reading.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;

  const points: BadgePoint[] = readings.map((reading) => {
    const displayName = formatStationDisplayName(reading.stationName);
    const text = Number.isInteger(reading.value)
      ? String(reading.value)
      : reading.value.toFixed(Math.abs(reading.value) >= 100 ? 0 : 1);
    return {
      longitude: reading.longitude,
      latitude: reading.latitude,
      t: (reading.value - min) / range,
      text,
      unit: reading.unit || undefined,
      caption: displayName,
      stationId: reading.stationId,
      stationName: displayName,
      popupTitle: displayName,
      popupContent: `
        <p style="margin:0"><b>${text}${reading.unit ? ` ${reading.unit}` : ''}</b></p>
        <p style="margin:4px 0 0;color:#6b7280;font-size:12px">Field: <code>${reading.field}</code></p>
      `,
    };
  });

  return createValueBadgeLayer(points, {
    title,
    colorFor: (t) => {
      const [r, g, b] = getSpeedColorArray(t);
      return { r, g, b };
    },
    size: 40,
  });
}

/**
 * Populate a catalog GraphicsLayer with monitoring-style Latest value badges.
 */
export async function populateDendraLatestLabels(
  layer: GraphicsLayer,
  options: {
    serviceUrl: string;
    servicePath: string;
    latestLayerId: number;
    title: string;
  },
): Promise<void> {
  const { serviceUrl, servicePath, latestLayerId, title } = options;
  const binding = resolveRendererBinding(servicePath);

  if (binding?.renderer === 'scalar-surface' && isScalarId(binding.variableKey)) {
    const snapshot = await fetchSensorSnapshot(binding.variableKey);
    const config = SENSOR_VARIABLES[binding.variableKey];
    const badges = createScalarBadgeLayer(snapshot, config);
    applyBadgeGraphics(layer, badges);
    layer.title = `${title} — Latest`;
    return;
  }

  if (binding?.renderer === 'wind-vector-field') {
    const wind = await fetchLatestWind();
    if (wind.readings.length === 0) {
      layer.removeAll();
      return;
    }
    const speeds = wind.readings.map((reading) => reading.windSpeedAvg);
    const min = Math.min(...speeds);
    const max = Math.max(...speeds);
    const range = max - min || 1;
    const points: BadgePoint[] = wind.readings.map((reading) => {
      const displayName = formatStationDisplayName(reading.stationName);
      const text = reading.windSpeedAvg.toFixed(1);
      return {
        longitude: reading.longitude,
        latitude: reading.latitude,
        t: (reading.windSpeedAvg - min) / range,
        text,
        unit: 'm/s',
        caption: displayName,
        stationId: reading.stationId,
        stationName: displayName,
        popupTitle: displayName,
        popupContent: `
          <p style="margin:0"><b>${text} m/s</b></p>
          <p style="margin:4px 0 0;color:#6b7280;font-size:12px">
            Direction: ${Math.round(reading.windDirectionAvg)}°
          </p>
        `,
      };
    });
    const badges = createValueBadgeLayer(points, {
      title: `${title} — Latest`,
      size: 40,
    });
    applyBadgeGraphics(layer, badges);
    return;
  }

  const cacheKey = `dendra-latest-generic-${servicePath}-${latestLayerId}`;
  const readings = await getCachedOrFetch(
    cacheKey,
    {},
    () => fetchGenericLatestReadings(serviceUrl, latestLayerId),
    CacheTTL.SHORT,
  );
  if (readings.length === 0) {
    layer.removeAll();
    return;
  }
  const badges = buildGenericBadgeLayer(readings, `${title} — Latest`);
  applyBadgeGraphics(layer, badges);
}
