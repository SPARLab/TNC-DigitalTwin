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
  confidence: 'low' | 'medium';
  evidence: string;
}

export interface MotusMovementContext {
  stations: MotusStationPoint[];
  legs: MotusInferredLeg[];
  disclaimer: string;
}

type ArcGISFeature = { attributes?: Record<string, unknown> };

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

function buildDetectionWhereClause(filters: MotusBrowseFilters, tagIds?: number[]): string {
  const clauses: string[] = ['1=1'];
  if (tagIds && tagIds.length > 0) clauses.push(`tag_id IN (${tagIds.join(',')})`);
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

async function queryDetectionCountByTagIds(tagIds: number[], filters: MotusBrowseFilters): Promise<number> {
  if (tagIds.length === 0) return 0;
  const where = buildDetectionWhereClause(filters, tagIds);
  const json = await queryArcgis(TAG_DETECTIONS_TABLE_URL, {
    where,
    returnCountOnly: true,
    returnGeometry: false,
    f: 'json',
  });
  return typeof json.count === 'number' ? json.count : 0;
}

async function queryDetectionCountsByTagIds(
  tagIds: number[],
  filters: MotusBrowseFilters,
  signal?: AbortSignal,
): Promise<Map<number, number>> {
  const result = new Map<number, number>();
  if (tagIds.length === 0) return result;

  const chunks = chunk(tagIds, CHUNK_SIZE);
  for (const tagChunk of chunks) {
    const where = buildDetectionWhereClause(filters, tagChunk);
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

class MotusService {
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

    const withCounts = await Promise.all(
      candidateSpecies.map(async (species) => {
        const detectionCount = await queryDetectionCountByTagIds(species.tagIds, filters);
        return {
          speciesEnglish: species.speciesEnglish,
          speciesScientific: species.speciesScientific,
          tagCount: species.tagIds.length,
          detectionCount,
        };
      }),
    );

    return withCounts.sort((a, b) => b.detectionCount - a.detectionCount || b.tagCount - a.tagCount);
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
    const countsByTag = await queryDetectionCountsByTagIds(tagIds, filters, signal);

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
      .sort((a, b) => b.detectionCount - a.detectionCount || a.tagId - b.tagId);
  }

  async getTaggedAnimalDetail(tagId: number, filters: MotusBrowseFilters, signal?: AbortSignal): Promise<MotusTaggedAnimalDetail | null> {
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
    const [stationsJson, deploymentsJson, detectionsJson] = await Promise.all([
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
          outFields: 'id,station_id,name,latitude,longitude',
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
          outFields: 'node_num,antenna,ts_begin',
          returnGeometry: false,
          orderByFields: 'ts_begin ASC',
          resultRecordCount: 2000,
          f: 'json',
        },
        signal,
      ),
    ]);

    const stations: MotusStationPoint[] = [];
    const byStationId = new Map<number, MotusStationPoint>();
    const stationRows = Array.isArray(stationsJson.features) ? (stationsJson.features as ArcGISFeature[]) : [];
    for (const feature of stationRows) {
      const stationId = toFiniteNumber(feature.attributes?.station_id);
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

    const deploymentRows = Array.isArray(deploymentsJson.features) ? (deploymentsJson.features as ArcGISFeature[]) : [];
    for (const feature of deploymentRows) {
      const stationId = toFiniteNumber(feature.attributes?.station_id);
      if (stationId == null || byStationId.has(stationId)) continue;
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

    const detections = Array.isArray(detectionsJson.features) ? (detectionsJson.features as ArcGISFeature[]) : [];
    const stationByNode = new Map<string, MotusStationPoint>();
    for (const station of stations) {
      if (station.stationId != null) {
        stationByNode.set(String(station.stationId), station);
        stationByNode.set(station.stationId.toString(16), station);
      }
      stationByNode.set(station.name.toLowerCase().replace(/\s+/g, ''), station);
    }

    const inferredStations: MotusStationPoint[] = [];
    for (const detection of detections) {
      const nodeNumRaw = toSafeString(detection.attributes?.node_num);
      if (!nodeNumRaw) continue;
      const normalizedNode = nodeNumRaw.toLowerCase().replace(/^0+/, '');
      const match = stationByNode.get(normalizedNode);
      if (!match) continue;
      const previous = inferredStations[inferredStations.length - 1];
      if (!previous || previous.id !== match.id) inferredStations.push(match);
    }

    const legs: MotusInferredLeg[] = [];
    for (let index = 1; index < inferredStations.length; index += 1) {
      const from = inferredStations[index - 1];
      const to = inferredStations[index];
      if (from.id === to.id) continue;
      legs.push({
        id: `motus-leg-${tagId}-${index}`,
        from,
        to,
        confidence: 'low',
        evidence: 'Node-level inference from detection table (schema lacks explicit station foreign key)',
      });
    }

    const disclaimer = legs.length > 0
      ? 'Movement legs are inferred from detections and should be treated as low-confidence shortest-path context.'
      : 'No valid station-to-station inference available for this selection. Receiver stations are shown without path legs.';

    return { stations, legs, disclaimer };
  }
}

export const motusService = new MotusService();
