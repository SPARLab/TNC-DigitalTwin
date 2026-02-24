export interface CalFloraObservation {
  objectId: number;
  calfloraId: string | null;
  plant: string;
  county: string | null;
  observationDate: string | null;
  elevation: string | null;
  observer: string | null;
  photoUrl: string | null;
  associatedSpecies: string | null;
  habitat: string | null;
  notes: string | null;
  citation: string | null;
  locationQuality: string | null;
  coordinates: [number, number] | null;
}

export interface CalFloraBrowseFilters {
  searchText?: string;
  county?: string;
  startDate?: string;
  endDate?: string;
  hasPhoto?: boolean;
}

interface ArcGISFeature<T> {
  attributes?: T;
  geometry?: {
    x?: number;
    y?: number;
  };
}

interface ArcGISQueryResponse<T> {
  features?: Array<ArcGISFeature<T>>;
  count?: number;
  error?: {
    message?: string;
  };
}

interface ArcGISAttributeRow {
  objectid?: number;
  id?: string;
  plant?: string;
  county?: string;
  date_?: string;
  elevation?: string;
  observer?: string;
  photo?: string;
  associated_species?: string;
  habitat?: string;
  notes?: string;
  citation?: string;
  location_quality?: string;
}

const FEATURE_LAYER_URL =
  'https://dangermondpreserve-spatial.com/server/rest/services/Hosted/CalFlora_Dangermond_Observations_Clean/FeatureServer/0';

const OUT_FIELDS = [
  'objectid',
  'id',
  'plant',
  'county',
  'date_',
  'elevation',
  'observer',
  'photo',
  'associated_species',
  'habitat',
  'notes',
  'citation',
  'location_quality',
].join(',');

function normalizeText(value: string | undefined): string | undefined {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

function escapeSqlLike(value: string): string {
  return value.replace(/'/g, "''");
}

function toObservation(feature: ArcGISFeature<ArcGISAttributeRow>): CalFloraObservation | null {
  const attrs = feature.attributes;
  if (!attrs || typeof attrs.objectid !== 'number' || !attrs.plant) return null;

  const x = feature.geometry?.x;
  const y = feature.geometry?.y;
  const coordinates =
    typeof x === 'number' && Number.isFinite(x) && typeof y === 'number' && Number.isFinite(y)
      ? ([x, y] as [number, number])
      : null;

  return {
    objectId: attrs.objectid,
    calfloraId: attrs.id ?? null,
    plant: attrs.plant,
    county: attrs.county ?? null,
    observationDate: attrs.date_ ?? null,
    elevation: attrs.elevation ?? null,
    observer: attrs.observer ?? null,
    photoUrl: attrs.photo ?? null,
    associatedSpecies: attrs.associated_species ?? null,
    habitat: attrs.habitat ?? null,
    notes: attrs.notes ?? null,
    citation: attrs.citation ?? null,
    locationQuality: attrs.location_quality ?? null,
    coordinates,
  };
}

function parseResponse<T>(raw: ArcGISQueryResponse<T>): ArcGISQueryResponse<T> {
  if (raw.error?.message) {
    throw new Error(`CalFlora query failed: ${raw.error.message}`);
  }
  return raw;
}

async function runQuery<T>(params: URLSearchParams, signal?: AbortSignal): Promise<ArcGISQueryResponse<T>> {
  const response = await fetch(`${FEATURE_LAYER_URL}/query?${params.toString()}`, { signal });
  if (!response.ok) {
    throw new Error(`CalFlora query failed: HTTP ${response.status}`);
  }
  const json = (await response.json()) as ArcGISQueryResponse<T>;
  return parseResponse(json);
}

class CalfloraV2Service {
  buildWhereClause(filters: CalFloraBrowseFilters): string {
    const clauses: string[] = ['1=1'];
    const searchText = normalizeText(filters.searchText);
    const county = normalizeText(filters.county);
    const startDate = normalizeText(filters.startDate);
    const endDate = normalizeText(filters.endDate);

    if (searchText) {
      const escaped = escapeSqlLike(searchText.toUpperCase());
      clauses.push(`UPPER(plant) LIKE '%${escaped}%'`);
    }
    if (county) {
      clauses.push(`county = '${escapeSqlLike(county)}'`);
    }
    if (startDate) {
      clauses.push(`date_ >= '${escapeSqlLike(startDate)}'`);
    }
    if (endDate) {
      clauses.push(`date_ <= '${escapeSqlLike(endDate)}'`);
    }
    if (filters.hasPhoto) {
      clauses.push(`photo IS NOT NULL AND photo <> ''`);
    }

    return clauses.join(' AND ');
  }

  async getOverviewCount(): Promise<number> {
    const params = new URLSearchParams({
      where: '1=1',
      returnCountOnly: 'true',
      f: 'json',
    });
    const response = await runQuery<ArcGISAttributeRow>(params);
    return typeof response.count === 'number' ? response.count : 0;
  }

  async getFilterOptions(): Promise<{ counties: string[] }> {
    const params = new URLSearchParams({
      where: '1=1',
      outFields: 'county',
      returnGeometry: 'false',
      resultRecordCount: '2000',
      f: 'json',
    });
    const response = await runQuery<ArcGISAttributeRow>(params);
    const countySet = new Set<string>();
    for (const feature of response.features ?? []) {
      const county = normalizeText(feature.attributes?.county);
      if (county) countySet.add(county);
    }
    return { counties: Array.from(countySet).sort((a, b) => a.localeCompare(b)) };
  }

  async queryObservations(options: {
    page: number;
    pageSize: number;
    filters: CalFloraBrowseFilters;
    signal?: AbortSignal;
  }): Promise<{ observations: CalFloraObservation[]; totalCount: number }> {
    const { page, pageSize, filters, signal } = options;
    const whereClause = this.buildWhereClause(filters);
    const offset = Math.max(0, page) * Math.max(1, pageSize);

    const countParams = new URLSearchParams({
      where: whereClause,
      returnCountOnly: 'true',
      f: 'json',
    });
    const listParams = new URLSearchParams({
      where: whereClause,
      outFields: OUT_FIELDS,
      returnGeometry: 'true',
      outSR: '4326',
      orderByFields: 'date_ DESC, objectid DESC',
      resultOffset: String(offset),
      resultRecordCount: String(pageSize),
      f: 'json',
    });

    const [countResponse, listResponse] = await Promise.all([
      runQuery<ArcGISAttributeRow>(countParams, signal),
      runQuery<ArcGISAttributeRow>(listParams, signal),
    ]);

    const observations = (listResponse.features ?? [])
      .map(toObservation)
      .filter((item): item is CalFloraObservation => !!item);

    return {
      observations,
      totalCount: typeof countResponse.count === 'number' ? countResponse.count : observations.length,
    };
  }

  async getObservationByObjectId(objectId: number): Promise<CalFloraObservation | null> {
    const params = new URLSearchParams({
      where: `objectid = ${objectId}`,
      outFields: OUT_FIELDS,
      returnGeometry: 'true',
      outSR: '4326',
      resultRecordCount: '1',
      f: 'json',
    });

    const response = await runQuery<ArcGISAttributeRow>(params);
    const first = response.features?.[0];
    if (!first) return null;
    return toObservation(first);
  }
}

export const calfloraV2Service = new CalfloraV2Service();
