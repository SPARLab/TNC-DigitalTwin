const MOTUS_FEATURE_SERVER_BASE =
  'https://dangermondpreserve-spatial.com/server/rest/services/Dangermond_Preserve_Wildlife_Telemetry/FeatureServer';

const TAGGED_ANIMALS_LAYER_URL = `${MOTUS_FEATURE_SERVER_BASE}/0`;
const STATION_DEPLOYMENTS_LAYER_URL = `${MOTUS_FEATURE_SERVER_BASE}/1`;
const RECEIVER_STATIONS_LAYER_URL = `${MOTUS_FEATURE_SERVER_BASE}/2`;
const TAG_DETECTIONS_TABLE_URL = `${MOTUS_FEATURE_SERVER_BASE}/3`;

const DEFAULT_MAX_SPECIES = 40;
const CHUNK_SIZE = 90;

export interface MotusBrowseFilters {
  startDate?: string;
  endDate?: string;
  minHitCount?: number;
  minMotusFilter?: number;
}

export interface MotusSpeciesSummary {
  speciesEnglish: string;
  speciesScientific: string;
  tagCount: number;
  detectionCount: number;
}

export interface MotusTaggedAnimalSummary {
  tagId: number;
  deployId: number | null;
  speciesEnglish: string;
  speciesScientific: string;
  deploymentStart: string | null;
  deploymentEnd: string | null;
  detectionCount: number;
}

export interface MotusTaggedAnimalDetail extends MotusTaggedAnimalSummary {
  markerNumber: string | null;
  bandNumber: string | null;
  sex: string | null;
  age: string | null;
  attachment: string | null;
  latitude: number | null;
  longitude: number | null;
  detectionWindowStart: string | null;
  detectionWindowEnd: string | null;
  averageHitCount: number | null;
  minHitCountObserved: number | null;
  maxHitCountObserved: number | null;
  motusFilterBreakdown: Array<{ filterValue: string; count: number }>;
}

export interface MotusStationPoint {
  id: number;
  stationId: number | null;
  name: string;
  latitude: number;
  longitude: number;
}

export interface MotusInferredLeg {
  id: string;
  from: MotusStationPoint;
  to: MotusStationPoint;
  kind: 'inferred' | 'context';
  stepIndex: number;
  startDate: string | null;
  endDate: string | null;
  confidence: 'low' | 'medium';
  evidence: string;
}

export interface MotusMovementContext {
  stations: MotusStationPoint[];
  legs: MotusInferredLeg[];
  disclaimer: string;
}

type ArcGISFeature = { attributes?: Record<string, unknown> };
type BoundaryPolygon = [number, number][];

function escapeSql(value: string): string {
  return value.replace(/'/g, "''");
}

function toIsoDate(value: unknown): string | null {
  if (typeof value !== 'number' || !Number.isFinite(value)) return null;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed.toISOString().slice(0, 10);
}

function toFiniteNumber(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function toSafeString(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

function toTimestamp(value: unknown): number | null {
  if (typeof value !== 'number' || !Number.isFinite(value)) return null;
  return value;
}

function toIntegerKey(value: unknown): string | null {
  const parsed = toFiniteNumber(value);
  if (parsed == null) return null;
  return String(Math.floor(Math.abs(parsed)));
}

function pointInPolygon(longitude: number, latitude: number, polygon: BoundaryPolygon): boolean {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i, i += 1) {
    const [xi, yi] = polygon[i];
    const [xj, yj] = polygon[j];
    const intersects = ((yi > latitude) !== (yj > latitude))
      && (longitude < ((xj - xi) * (latitude - yi)) / ((yj - yi) || Number.EPSILON) + xi);
    if (intersects) inside = !inside;
  }
  return inside;
}

async function queryArcgis(
  url: string,
  params: Record<string, string | number | boolean>,
  signal?: AbortSignal,
): Promise<Record<string, unknown>> {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => query.set(key, String(value)));
  const response = await fetch(`${url}/query?${query.toString()}`, { signal });
  if (!response.ok) {
    throw new Error(`MOTUS query failed: ${response.status} ${response.statusText}`);
  }
  const json = (await response.json()) as { error?: { message?: string; details?: unknown } };
  if (json.error) {
    const message = typeof json.error.message === 'string' ? json.error.message : 'MOTUS service error';
    const details = Array.isArray(json.error.details)
      ? json.error.details.filter((detail): detail is string => typeof detail === 'string')
      : [];
    throw new Error(details.length ? `${message} ${details.join(' ')}` : message);
  }
  return json as Record<string, unknown>;
}

function buildDetectionWhereClause(filters: MotusBrowseFilters, tagIds?: number[], deviceIds?: number[]): string {
  const clauses: string[] = ['1=1'];
  if (tagIds && tagIds.length > 0) clauses.push(`tag_id IN (${tagIds.join(',')})`);
  if (deviceIds && deviceIds.length > 0) clauses.push(`device_id IN (${deviceIds.join(',')})`);
  if (filters.startDate) clauses.push(`ts_begin >= DATE '${escapeSql(filters.startDate)}'`);
  if (filters.endDate) clauses.push(`ts_end <= DATE '${escapeSql(filters.endDate)}'`);
  if (typeof filters.minHitCount === 'number') clauses.push(`hit_count >= ${Math.max(0, Math.floor(filters.minHitCount))}`);
  if (typeof filters.minMotusFilter === 'number') clauses.push(`motus_filter >= ${filters.minMotusFilter}`);
  return clauses.join(' AND ');
}

function chunk<T>(values: T[], chunkSize: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < values.length; i += chunkSize) {
    chunks.push(values.slice(i, i + chunkSize));
  }
  return chunks;
}

async function queryDetectionCountsByTagIds(
  tagIds: number[],
  filters: MotusBrowseFilters,
  deviceIds?: number[],
  signal?: AbortSignal,
): Promise<Map<number, number>> {
  const result = new Map<number, number>();
  if (tagIds.length === 0) return result;
  if (deviceIds && deviceIds.length === 0) return result;

  const chunks = chunk(tagIds, CHUNK_SIZE);
  for (const tagChunk of chunks) {
    const where = buildDetectionWhereClause(filters, tagChunk, deviceIds);
    const json = await queryArcgis(
      TAG_DETECTIONS_TABLE_URL,
      {
        where,
        outStatistics: JSON.stringify([
          {
            statisticType: 'count',
            onStatisticField: 'id',
            outStatisticFieldName: 'detection_count',
          },
        ]),
        groupByFieldsForStatistics: 'tag_id',
        returnGeometry: false,
        resultRecordCount: 2000,
        f: 'json',
      },
      signal,
    );

    const features = Array.isArray(json.features) ? (json.features as ArcGISFeature[]) : [];
    for (const feature of features) {
      const tagId = toFiniteNumber(feature.attributes?.tag_id);
      const detectionCount = toFiniteNumber(feature.attributes?.detection_count);
      if (tagId == null || detectionCount == null) continue;
      result.set(tagId, (result.get(tagId) || 0) + detectionCount);
    }
  }

  return result;
}

async function queryDetectionCountByTagIds(
  tagIds: number[],
  filters: MotusBrowseFilters,
  deviceIds?: number[],
  signal?: AbortSignal,
): Promise<number> {
  if (tagIds.length === 0) return 0;
  const counts = await queryDetectionCountsByTagIds(tagIds, filters, deviceIds, signal);
  return Array.from(counts.values()).reduce((sum, count) => sum + count, 0);
}

let cachedDangermondDeviceIds: number[] | null = null;
let cachedDangermondBoundaryPolygon: BoundaryPolygon | null = null;

async function getDangermondBoundaryPolygon(signal?: AbortSignal): Promise<BoundaryPolygon> {
  if (cachedDangermondBoundaryPolygon) return cachedDangermondBoundaryPolygon;
  const response = await fetch('/dangermond-preserve-boundary.geojson', { signal });
  if (!response.ok) {
    throw new Error(`Failed to load Dangermond preserve boundary: ${response.status} ${response.statusText}`);
  }
  const json = await response.json() as {
    features?: Array<{ geometry?: { type?: string; coordinates?: unknown } }>;
  };
  const firstFeature = Array.isArray(json.features) ? json.features[0] : undefined;
  const coordinates = firstFeature?.geometry?.coordinates;
  const polygon = Array.isArray(coordinates) && Array.isArray(coordinates[0])
    ? (coordinates[0] as BoundaryPolygon)
    : [];
  if (polygon.length < 3) {
    throw new Error('Dangermond preserve boundary polygon is missing or invalid.');
  }
  cachedDangermondBoundaryPolygon = polygon;
  return polygon;
}

async function getDangermondDeviceIds(signal?: AbortSignal): Promise<number[]> {
  if (cachedDangermondDeviceIds) return cachedDangermondDeviceIds;
  const boundary = await getDangermondBoundaryPolygon(signal);
  const json = await queryArcgis(
    STATION_DEPLOYMENTS_LAYER_URL,
    {
      where: '1=1',
      outFields: 'device_id,latitude,longitude',
      returnGeometry: false,
      resultRecordCount: 2000,
      f: 'json',
    },
    signal,
  );
  const features = Array.isArray(json.features) ? (json.features as ArcGISFeature[]) : [];
  const unique = Array.from(
    new Set(
      features
        .filter((feature) => {
          const latitude = toFiniteNumber(feature.attributes?.latitude);
          const longitude = toFiniteNumber(feature.attributes?.longitude);
          if (latitude == null || longitude == null) return false;
          return pointInPolygon(longitude, latitude, boundary);
        })
        .map((feature) => toFiniteNumber(feature.attributes?.device_id))
        .filter((value): value is number => value != null),
    ),
  ).sort((a, b) => a - b);
  cachedDangermondDeviceIds = unique;
  return unique;
}

async function getPreserveLinkedTagIds(
  candidateTagIds: number[] | undefined,
  signal?: AbortSignal,
): Promise<Set<number>> {
  const dangermondDeviceIds = await getDangermondDeviceIds(signal);
  if (dangermondDeviceIds.length === 0) return new Set<number>();

  const clauses: string[] = ['1=1', `device_id IN (${dangermondDeviceIds.join(',')})`];
  if (candidateTagIds && candidateTagIds.length > 0) {
    clauses.push(`tag_id IN (${candidateTagIds.join(',')})`);
  }
  const where = clauses.join(' AND ');

  const json = await queryArcgis(
    TAG_DETECTIONS_TABLE_URL,
    {
      where,
      outStatistics: JSON.stringify([
        { statisticType: 'count', onStatisticField: 'id', outStatisticFieldName: 'detection_count' },
      ]),
      groupByFieldsForStatistics: 'tag_id',
      returnGeometry: false,
      resultRecordCount: 2000,
      f: 'json',
    },
    signal,
  );

  const features = Array.isArray(json.features) ? (json.features as ArcGISFeature[]) : [];
  const preserveLinkedTagIds = new Set<number>();
  for (const feature of features) {
    const tagId = toFiniteNumber(feature.attributes?.tag_id);
    const detectionCount = toFiniteNumber(feature.attributes?.detection_count) || 0;
    if (tagId != null && detectionCount > 0) preserveLinkedTagIds.add(tagId);
  }

  return preserveLinkedTagIds;
}

class MotusService {
  async getReceiverStations(signal?: AbortSignal): Promise<MotusStationPoint[]> {
    const stationsJson = await queryArcgis(
      RECEIVER_STATIONS_LAYER_URL,
      {
        where: '1=1',
        outFields: 'id,station_id,station_name,site_name,latitude,longitude',
        returnGeometry: false,
        resultRecordCount: 200,
        f: 'json',
      },
      signal,
    );

    const stationRows = Array.isArray(stationsJson.features) ? (stationsJson.features as ArcGISFeature[]) : [];
    const stations: MotusStationPoint[] = [];
    for (const feature of stationRows) {
      const latitude = toFiniteNumber(feature.attributes?.latitude);
      const longitude = toFiniteNumber(feature.attributes?.longitude);
      if (latitude == null || longitude == null) continue;
      stations.push({
        id: toFiniteNumber(feature.attributes?.id) || stations.length + 1,
        stationId: toFiniteNumber(feature.attributes?.station_id),
        name: toSafeString(feature.attributes?.station_name) || toSafeString(feature.attributes?.site_name) || 'Receiver station',
        latitude,
        longitude,
      });
    }
    return stations;
  }

  async getSpeciesSummaries(filters: MotusBrowseFilters, signal?: AbortSignal): Promise<MotusSpeciesSummary[]> {
    const taggedJson = await queryArcgis(
      TAGGED_ANIMALS_LAYER_URL,
      {
        where: '1=1',
        outFields: 'tag_id,species_english,species_scientific',
        returnGeometry: false,
        resultRecordCount: 2000,
        orderByFields: 'species_english ASC, tag_id ASC',
        f: 'json',
      },
      signal,
    );
    const taggedFeatures = Array.isArray(taggedJson.features) ? (taggedJson.features as ArcGISFeature[]) : [];

    const bySpecies = new Map<string, { scientific: string; tagIds: number[] }>();
    for (const feature of taggedFeatures) {
      const speciesEnglish = toSafeString(feature.attributes?.species_english) || 'Unknown species';
      const speciesScientific = toSafeString(feature.attributes?.species_scientific) || 'Unknown scientific name';
      const tagId = toFiniteNumber(feature.attributes?.tag_id);
      if (tagId == null) continue;
      const existing = bySpecies.get(speciesEnglish);
      if (existing) {
        existing.tagIds.push(tagId);
      } else {
        bySpecies.set(speciesEnglish, { scientific: speciesScientific, tagIds: [tagId] });
      }
    }

    const candidateSpecies = Array.from(bySpecies.entries())
      .map(([speciesEnglish, value]) => ({
        speciesEnglish,
        speciesScientific: value.scientific,
        tagIds: Array.from(new Set(value.tagIds)).sort((a, b) => a - b),
      }))
      .sort((a, b) => a.speciesEnglish.localeCompare(b.speciesEnglish))
      .slice(0, DEFAULT_MAX_SPECIES);

    const preserveLinkedTagIds = await getPreserveLinkedTagIds(
      candidateSpecies.flatMap((species) => species.tagIds),
      signal,
    );

    const withCounts = await Promise.all(
      candidateSpecies.map(async (species) => {
        const eligibleTagIds = species.tagIds.filter((tagId) => preserveLinkedTagIds.has(tagId));
        const detectionCount = await queryDetectionCountByTagIds(eligibleTagIds, filters, undefined, signal);
        return {
          speciesEnglish: species.speciesEnglish,
          speciesScientific: species.speciesScientific,
          tagCount: eligibleTagIds.length,
          detectionCount,
        };
      }),
    );

    return withCounts
      .filter((species) => species.tagCount > 0)
      .sort((a, b) => b.detectionCount - a.detectionCount || b.tagCount - a.tagCount);
  }

  async getTaggedAnimalsForSpecies(
    speciesEnglish: string,
    filters: MotusBrowseFilters,
    signal?: AbortSignal,
  ): Promise<MotusTaggedAnimalSummary[]> {
    const where = `species_english = '${escapeSql(speciesEnglish)}'`;
    const json = await queryArcgis(
      TAGGED_ANIMALS_LAYER_URL,
      {
        where,
        outFields: 'tag_id,deploy_id,species_english,species_scientific,ts_start,ts_end',
        returnGeometry: false,
        resultRecordCount: 2000,
        orderByFields: 'tag_id ASC',
        f: 'json',
      },
      signal,
    );

    const features = Array.isArray(json.features) ? (json.features as ArcGISFeature[]) : [];
    const tagIds = features
      .map((feature) => toFiniteNumber(feature.attributes?.tag_id))
      .filter((value): value is number => value != null);
    const preserveLinkedTagIds = await getPreserveLinkedTagIds(tagIds, signal);
    const eligibleTagIds = tagIds.filter((tagId) => preserveLinkedTagIds.has(tagId));
    const countsByTag = await queryDetectionCountsByTagIds(eligibleTagIds, filters, undefined, signal);

    const byTagId = new Map<number, MotusTaggedAnimalSummary>();
    for (const feature of features) {
      const tagId = toFiniteNumber(feature.attributes?.tag_id);
      if (tagId == null) continue;

      const nextRow: MotusTaggedAnimalSummary = {
        tagId,
        deployId: toFiniteNumber(feature.attributes?.deploy_id),
        speciesEnglish: toSafeString(feature.attributes?.species_english) || speciesEnglish,
        speciesScientific: toSafeString(feature.attributes?.species_scientific) || 'Unknown scientific name',
        deploymentStart: toIsoDate(feature.attributes?.ts_start),
        deploymentEnd: toIsoDate(feature.attributes?.ts_end),
        detectionCount: countsByTag.get(tagId) || 0,
      };

      const existing = byTagId.get(tagId);
      if (!existing) {
        byTagId.set(tagId, nextRow);
        continue;
      }

      // Keep one stable row per tag_id to avoid duplicate React keys in browse lists.
      byTagId.set(tagId, {
        ...existing,
        deployId: existing.deployId ?? nextRow.deployId,
        deploymentStart: existing.deploymentStart ?? nextRow.deploymentStart,
        deploymentEnd: existing.deploymentEnd ?? nextRow.deploymentEnd,
      });
    }

    return Array.from(byTagId.values())
      .filter((row) => preserveLinkedTagIds.has(row.tagId))
      .sort((a, b) => b.detectionCount - a.detectionCount || a.tagId - b.tagId);
  }

  async getTaggedAnimalDetail(tagId: number, filters: MotusBrowseFilters, signal?: AbortSignal): Promise<MotusTaggedAnimalDetail | null> {
    const preserveLinkedTagIds = await getPreserveLinkedTagIds([tagId], signal);
    if (!preserveLinkedTagIds.has(tagId)) return null;
    const animalJson = await queryArcgis(
      TAGGED_ANIMALS_LAYER_URL,
      {
        where: `tag_id = ${tagId}`,
        outFields: 'tag_id,deploy_id,species_english,species_scientific,ts_start,ts_end,marker_number,band_number,sex,age,attachment,latitude,longitude',
        returnGeometry: false,
        resultRecordCount: 1,
        f: 'json',
      },
      signal,
    );
    const animalFeature = Array.isArray(animalJson.features) ? (animalJson.features as ArcGISFeature[])[0] : undefined;
    if (!animalFeature?.attributes) return null;

    const where = buildDetectionWhereClause(filters, [tagId]);
    const [windowStatsJson, filterBreakdownJson] = await Promise.all([
      queryArcgis(
        TAG_DETECTIONS_TABLE_URL,
        {
          where,
          outStatistics: JSON.stringify([
            { statisticType: 'count', onStatisticField: 'id', outStatisticFieldName: 'detection_count' },
            { statisticType: 'min', onStatisticField: 'ts_begin', outStatisticFieldName: 'min_ts_begin' },
            { statisticType: 'max', onStatisticField: 'ts_end', outStatisticFieldName: 'max_ts_end' },
            { statisticType: 'avg', onStatisticField: 'hit_count', outStatisticFieldName: 'avg_hit_count' },
            { statisticType: 'min', onStatisticField: 'hit_count', outStatisticFieldName: 'min_hit_count' },
            { statisticType: 'max', onStatisticField: 'hit_count', outStatisticFieldName: 'max_hit_count' },
          ]),
          returnGeometry: false,
          f: 'json',
        },
        signal,
      ),
      queryArcgis(
        TAG_DETECTIONS_TABLE_URL,
        {
          where,
          outStatistics: JSON.stringify([
            { statisticType: 'count', onStatisticField: 'id', outStatisticFieldName: 'detection_count' },
          ]),
          groupByFieldsForStatistics: 'motus_filter',
          returnGeometry: false,
          resultRecordCount: 20,
          f: 'json',
        },
        signal,
      ),
    ]);

    const windowStatsFeature = Array.isArray(windowStatsJson.features) ? (windowStatsJson.features as ArcGISFeature[])[0] : undefined;
    const windowStats = windowStatsFeature?.attributes || {};
    const filterRows = Array.isArray(filterBreakdownJson.features) ? (filterBreakdownJson.features as ArcGISFeature[]) : [];
    const breakdown = filterRows
      .map((feature) => {
        const value = feature.attributes?.motus_filter;
        const count = toFiniteNumber(feature.attributes?.detection_count) || 0;
        return {
          filterValue: value == null || value === '' ? 'unknown' : String(value),
          count,
        };
      })
      .sort((a, b) => b.count - a.count);

    const detectionCount = toFiniteNumber(windowStats.detection_count) || 0;
    return {
      tagId,
      deployId: toFiniteNumber(animalFeature.attributes.deploy_id),
      speciesEnglish: toSafeString(animalFeature.attributes.species_english) || 'Unknown species',
      speciesScientific: toSafeString(animalFeature.attributes.species_scientific) || 'Unknown scientific name',
      deploymentStart: toIsoDate(animalFeature.attributes.ts_start),
      deploymentEnd: toIsoDate(animalFeature.attributes.ts_end),
      markerNumber: toSafeString(animalFeature.attributes.marker_number),
      bandNumber: toSafeString(animalFeature.attributes.band_number),
      sex: toSafeString(animalFeature.attributes.sex),
      age: toSafeString(animalFeature.attributes.age),
      attachment: toSafeString(animalFeature.attributes.attachment),
      latitude: toFiniteNumber(animalFeature.attributes.latitude),
      longitude: toFiniteNumber(animalFeature.attributes.longitude),
      detectionCount,
      detectionWindowStart: toIsoDate(windowStats.min_ts_begin),
      detectionWindowEnd: toIsoDate(windowStats.max_ts_end),
      averageHitCount: toFiniteNumber(windowStats.avg_hit_count),
      minHitCountObserved: toFiniteNumber(windowStats.min_hit_count),
      maxHitCountObserved: toFiniteNumber(windowStats.max_hit_count),
      motusFilterBreakdown: breakdown,
    };
  }

  async getMovementContextForTag(tagId: number, filters: MotusBrowseFilters, signal?: AbortSignal): Promise<MotusMovementContext> {
    const preserveLinkedTagIds = await getPreserveLinkedTagIds([tagId], signal);
    if (!preserveLinkedTagIds.has(tagId)) {
      return {
        stations: [],
        legs: [],
        disclaimer: 'This tag has never been detected by Dangermond preserve receivers, so journey rendering is disabled.',
      };
    }

    const dangermondDeviceIds = await getDangermondDeviceIds(signal);

    // Fetch filtered detections + unfiltered preserve detections in parallel so the
    // Dangermond leg always renders even when its hit_count / motus_filter is below
    // the browse thresholds.
    const [stationsJson, deploymentsJson, detectionsJson, preserveDetectionsJson] = await Promise.all([
      queryArcgis(
        RECEIVER_STATIONS_LAYER_URL,
        {
          where: '1=1',
          outFields: 'id,station_id,station_name,site_name,latitude,longitude',
          returnGeometry: false,
          resultRecordCount: 200,
          f: 'json',
        },
        signal,
      ),
      queryArcgis(
        STATION_DEPLOYMENTS_LAYER_URL,
        {
          where: '1=1',
          outFields: 'id,station_id,name,latitude,longitude,device_id,serial_number,ts_start,ts_end',
          returnGeometry: false,
          resultRecordCount: 500,
          f: 'json',
        },
        signal,
      ),
      queryArcgis(
        TAG_DETECTIONS_TABLE_URL,
        {
          where: buildDetectionWhereClause(filters, [tagId]),
          outFields: 'device_id,ts_begin,ts_end',
          returnGeometry: false,
          orderByFields: 'ts_begin ASC',
          resultRecordCount: 2000,
          f: 'json',
        },
        signal,
      ),
      dangermondDeviceIds.length > 0
        ? queryArcgis(
            TAG_DETECTIONS_TABLE_URL,
            {
              where: `tag_id = ${tagId} AND device_id IN (${dangermondDeviceIds.join(',')})`,
              outFields: 'device_id,ts_begin,ts_end',
              returnGeometry: false,
              orderByFields: 'ts_begin ASC',
              resultRecordCount: 500,
              f: 'json',
            },
            signal,
          )
        : Promise.resolve({ features: [] }),
    ]);

    const deploymentRows = Array.isArray(deploymentsJson.features) ? (deploymentsJson.features as ArcGISFeature[]) : [];
    const stations: MotusStationPoint[] = [];
    const byStationId = new Map<number, MotusStationPoint>();
    const stationRows = Array.isArray(stationsJson.features) ? (stationsJson.features as ArcGISFeature[]) : [];
    for (const feature of stationRows) {
      const stationId = toFiniteNumber(feature.attributes?.station_id);
      if (stationId == null) continue;
      const latitude = toFiniteNumber(feature.attributes?.latitude);
      const longitude = toFiniteNumber(feature.attributes?.longitude);
      if (latitude == null || longitude == null) continue;
      const station: MotusStationPoint = {
        id: toFiniteNumber(feature.attributes?.id) || stations.length + 1,
        stationId,
        name: toSafeString(feature.attributes?.station_name) || toSafeString(feature.attributes?.site_name) || 'Receiver station',
        latitude,
        longitude,
      };
      stations.push(station);
      if (stationId != null) byStationId.set(stationId, station);
    }

    const deploymentRowsByDevice = new Map<
      string,
      Array<{ station: MotusStationPoint; tsStart: number | null; tsEnd: number | null }>
    >();
    for (const feature of deploymentRows) {
      const stationId = toFiniteNumber(feature.attributes?.station_id);
      if (stationId == null) continue;
      if (byStationId.has(stationId)) continue;
      const latitude = toFiniteNumber(feature.attributes?.latitude);
      const longitude = toFiniteNumber(feature.attributes?.longitude);
      if (latitude == null || longitude == null) continue;
      const fallbackStation: MotusStationPoint = {
        id: toFiniteNumber(feature.attributes?.id) || stations.length + 1,
        stationId,
        name: toSafeString(feature.attributes?.name) || `Station ${stationId}`,
        latitude,
        longitude,
      };
      stations.push(fallbackStation);
      byStationId.set(stationId, fallbackStation);
    }

    for (const feature of deploymentRows) {
      const stationId = toFiniteNumber(feature.attributes?.station_id);
      const deviceKey = toIntegerKey(feature.attributes?.device_id);
      if (stationId == null || !deviceKey) continue;
      const station = byStationId.get(stationId);
      if (!station) continue;
      const existing = deploymentRowsByDevice.get(deviceKey) || [];
      existing.push({
        station,
        tsStart: toTimestamp(feature.attributes?.ts_start),
        tsEnd: toTimestamp(feature.attributes?.ts_end),
      });
      deploymentRowsByDevice.set(deviceKey, existing);
    }

    const resolveStationFromDevice = (deviceId: unknown, tsBegin: number | null, tsEnd: number | null): MotusStationPoint | null => {
      const key = toIntegerKey(deviceId);
      if (!key) return null;
      const candidates = deploymentRowsByDevice.get(key);
      if (!candidates || candidates.length === 0) return null;
      if (candidates.length === 1) return candidates[0].station;

      const targetTs = tsBegin ?? tsEnd;
      if (targetTs == null) return candidates[0].station;

      const activeCandidates = candidates.filter((candidate) => {
        const startsBefore = candidate.tsStart == null || targetTs >= candidate.tsStart;
        const endsAfter = candidate.tsEnd == null || targetTs <= candidate.tsEnd;
        return startsBefore && endsAfter;
      });
      if (activeCandidates.length === 1) return activeCandidates[0].station;
      if (activeCandidates.length > 1) return activeCandidates[0].station;

      return [...candidates]
        .sort((a, b) => (b.tsStart ?? Number.NEGATIVE_INFINITY) - (a.tsStart ?? Number.NEGATIVE_INFINITY))[0]
        .station;
    };

    // Merge preserve detections into the filtered set so the Dangermond leg always
    // appears even when quality thresholds would exclude it.
    const filteredDetections = Array.isArray(detectionsJson.features) ? (detectionsJson.features as ArcGISFeature[]) : [];
    const preserveDetections = Array.isArray(preserveDetectionsJson.features) ? (preserveDetectionsJson.features as ArcGISFeature[]) : [];
    const seenDetectionKeys = new Set(
      filteredDetections.map((f) => `${toFiniteNumber(f.attributes?.device_id)}_${toFiniteNumber(f.attributes?.ts_begin)}`),
    );
    const merged = [...filteredDetections];
    for (const pd of preserveDetections) {
      const key = `${toFiniteNumber(pd.attributes?.device_id)}_${toFiniteNumber(pd.attributes?.ts_begin)}`;
      if (!seenDetectionKeys.has(key)) {
        merged.push(pd);
        seenDetectionKeys.add(key);
      }
    }
    merged.sort((a, b) => (toFiniteNumber(a.attributes?.ts_begin) ?? 0) - (toFiniteNumber(b.attributes?.ts_begin) ?? 0));
    const detections = merged;
    const inferredObservations: Array<{
      station: MotusStationPoint;
      tsBegin: number | null;
      tsEnd: number | null;
    }> = [];
    let matchedByDevice = 0;
    for (const detection of detections) {
      const tsBegin = toFiniteNumber(detection.attributes?.ts_begin);
      const tsEnd = toFiniteNumber(detection.attributes?.ts_end);
      const stationByDevice = resolveStationFromDevice(detection.attributes?.device_id, tsBegin, tsEnd);
      const matchedStation = stationByDevice;
      if (!matchedStation) continue;

      const previous = inferredObservations[inferredObservations.length - 1];
      if (!previous || previous.station.id !== matchedStation.id) {
        inferredObservations.push({ station: matchedStation, tsBegin, tsEnd });
      } else {
        previous.tsEnd = Math.max(previous.tsEnd ?? 0, tsEnd ?? 0) || previous.tsEnd;
        previous.tsBegin = previous.tsBegin ?? tsBegin;
      }

      matchedByDevice += 1;
    }

    const legs: MotusInferredLeg[] = [];
    for (let index = 1; index < inferredObservations.length; index += 1) {
      const fromObservation = inferredObservations[index - 1];
      const toObservation = inferredObservations[index];
      if (fromObservation.station.id === toObservation.station.id) continue;
      const confidence: MotusInferredLeg['confidence'] = 'medium';
      const evidence = 'Time-ordered station transition inferred from sequential detections linked via receiver device_id (medium confidence; still not an exact flight trajectory).';
      legs.push({
        id: `motus-leg-${tagId}-${index}`,
        from: fromObservation.station,
        to: toObservation.station,
        kind: 'inferred',
        stepIndex: index,
        startDate: toIsoDate(fromObservation.tsBegin ?? fromObservation.tsEnd),
        endDate: toIsoDate(toObservation.tsBegin ?? toObservation.tsEnd),
        confidence,
        evidence,
      });
    }

    const hasInferredLegs = legs.some((leg) => leg.kind === 'inferred');
    const matchedCount = matchedByDevice;
    const totalDetections = detections.length;
    const disclaimer = hasInferredLegs
      ? `This tag is preserve-eligible (detected at Dangermond at least once). Journeys are inferred from all time-ordered receiver detections in the selected window (${matchedByDevice.toLocaleString()} mapped detections). Paths are inferred context, not exact flight trajectories.`
      : totalDetections > 0
        ? `This preserve-eligible tag has detections in the selected window, but no station-to-station journey could be inferred. ${totalDetections.toLocaleString()} detections were evaluated; ${matchedCount.toLocaleString()} mapped to known receiver stations.`
        : 'This preserve-eligible tag has no detections in the selected window. Receiver stations are shown without path legs.';

    return { stations, legs, disclaimer };
  }
}

export const motusService = new MotusService();
