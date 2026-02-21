export interface GBIFOccurrence {
  id: number;
  gbifKey: string | null;
  scientificName: string | null;
  species: string | null;
  genus: string | null;
  family: string | null;
  order: string | null;
  taxonomicClass: string | null;
  phylum: string | null;
  kingdom: string | null;
  basisOfRecord: string | null;
  datasetName: string | null;
  recordedBy: string | null;
  eventDate: string | null;
  primaryImageUrl: string | null;
  referencesUrl: string | null;
  country: string | null;
  stateProvince: string | null;
  occurrenceStatus: string | null;
  issuesJson: string | null;
  mediaJson: string | null;
  mediaUrls: string[];
  coordinates: [number, number] | null;
}

export interface GBIFFilters {
  searchText?: string;
  kingdom?: string;
  taxonomicClass?: string;
  family?: string;
  basisOfRecord?: string;
  datasetName?: string;
  startDate?: string;
  endDate?: string;
}

export interface GBIFQueryOptions extends GBIFFilters {
  page: number;
  pageSize: number;
  signal?: AbortSignal;
}

export interface GBIFQueryResponse {
  occurrences: GBIFOccurrence[];
  totalCount: number;
}

const BASE_URL =
  'https://dangermondpreserve-spatial.com/server/rest/services/Hosted/GBIF_Hosted/FeatureServer/0';
const GBIF_API_BASE_URL = 'https://api.gbif.org/v1';

const SEARCH_FIELDS = ['scientific_name', 'species', 'genus', 'family', 'dataset_name', 'recorded_by'];

function escapeSql(value: string): string {
  return value.replace(/'/g, "''");
}

function normalizeDate(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const trimmed = String(raw).trim();
  if (!trimmed) return null;
  const dequoted = trimmed.replace(/^"+|"+$/g, '');
  return dequoted || null;
}

function normalizeGbifKey(raw: unknown): string | null {
  if (typeof raw === 'string') {
    const trimmed = raw.trim();
    return trimmed.length > 0 ? trimmed : null;
  }
  if (typeof raw === 'number' && Number.isFinite(raw)) return String(raw);
  if (typeof raw === 'bigint') return raw.toString();
  return null;
}

function isHttpUrl(raw: unknown): raw is string {
  return typeof raw === 'string' && /^https?:\/\//i.test(raw);
}

function isImageLikeUrl(url: string): boolean {
  const normalized = url.toLowerCase();
  return (
    /\.(jpg|jpeg|png|webp|gif)(\?|$)/.test(normalized) ||
    normalized.includes('image') ||
    normalized.includes('photos/')
  );
}

function extractMediaUrls(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  const urls = raw
    .map((entry) => {
      if (!entry || typeof entry !== 'object') return null;
      const item = entry as { type?: unknown; format?: unknown; identifier?: unknown; references?: unknown };
      const mediaType = typeof item.type === 'string' ? item.type.toLowerCase() : '';
      const mediaFormat = typeof item.format === 'string' ? item.format.toLowerCase() : '';
      const identifier = isHttpUrl(item.identifier) ? item.identifier : null;
      const references = isHttpUrl(item.references) ? item.references : null;
      const candidate = identifier ?? references;
      if (!candidate) return null;
      const looksLikeImage = mediaType.includes('image') || mediaFormat.startsWith('image/') || isImageLikeUrl(candidate);
      return looksLikeImage ? candidate : null;
    })
    .filter((value): value is string => !!value);
  return Array.from(new Set(urls));
}

function parseMediaUrlsFromJson(raw: unknown): string[] {
  if (typeof raw !== 'string') return [];
  const trimmed = raw.trim();
  if (!trimmed || trimmed === '[]') return [];
  try {
    const parsed = JSON.parse(trimmed);
    return extractMediaUrls(parsed);
  } catch {
    return [];
  }
}

function toOccurrence(feature: {
  attributes: Record<string, unknown>;
  geometry?: { x?: number; y?: number };
}): GBIFOccurrence {
  const a = feature.attributes ?? {};
  const lon = typeof feature.geometry?.x === 'number' ? feature.geometry.x : Number.NaN;
  const lat = typeof feature.geometry?.y === 'number' ? feature.geometry.y : Number.NaN;
  const mediaJson = typeof a.media_json === 'string' ? a.media_json : null;
  const parsedMediaUrls = parseMediaUrlsFromJson(mediaJson);
  const primaryImageUrl =
    typeof a.primary_image_url === 'string' && isImageLikeUrl(a.primary_image_url) ? a.primary_image_url : null;
  const mediaUrls = Array.from(new Set([...(primaryImageUrl ? [primaryImageUrl] : []), ...parsedMediaUrls]));
  return {
    id: Number(a.id),
    gbifKey: normalizeGbifKey(a.gbif_key),
    scientificName: typeof a.scientific_name === 'string' ? a.scientific_name : null,
    species: typeof a.species === 'string' ? a.species : null,
    genus: typeof a.genus === 'string' ? a.genus : null,
    family: typeof a.family === 'string' ? a.family : null,
    order: typeof a.order === 'string' ? a.order : null,
    taxonomicClass: typeof a.taxonomic_class === 'string' ? a.taxonomic_class : null,
    phylum: typeof a.phylum === 'string' ? a.phylum : null,
    kingdom: typeof a.kingdom === 'string' ? a.kingdom : null,
    basisOfRecord: typeof a.basis_of_record === 'string' ? a.basis_of_record : null,
    datasetName: typeof a.dataset_name === 'string' ? a.dataset_name : null,
    recordedBy: typeof a.recorded_by === 'string' ? a.recorded_by : null,
    eventDate: normalizeDate(typeof a.event_date_json === 'string' ? a.event_date_json : null),
    primaryImageUrl,
    referencesUrl: typeof a.references_url === 'string' ? a.references_url : null,
    country: typeof a.country === 'string' ? a.country : null,
    stateProvince: typeof a.state_province === 'string' ? a.state_province : null,
    occurrenceStatus: typeof a.occurrence_status === 'string' ? a.occurrence_status : null,
    issuesJson: typeof a.issues_json === 'string' ? a.issues_json : null,
    mediaJson,
    mediaUrls,
    coordinates: Number.isFinite(lon) && Number.isFinite(lat) ? [lon, lat] : null,
  };
}

function buildWhereClause(filters: GBIFFilters): string {
  const clauses: string[] = ['1=1'];

  if (filters.searchText && filters.searchText.trim().length >= 2) {
    const term = `%${escapeSql(filters.searchText.trim())}%`;
    const searchParts = SEARCH_FIELDS.map((field) => `${field} LIKE '${term}'`);
    clauses.push(`(${searchParts.join(' OR ')})`);
  }

  if (filters.kingdom) clauses.push(`kingdom = '${escapeSql(filters.kingdom)}'`);
  if (filters.taxonomicClass) clauses.push(`taxonomic_class = '${escapeSql(filters.taxonomicClass)}'`);
  if (filters.family) clauses.push(`family = '${escapeSql(filters.family)}'`);
  if (filters.basisOfRecord) clauses.push(`basis_of_record = '${escapeSql(filters.basisOfRecord)}'`);
  if (filters.datasetName) clauses.push(`dataset_name = '${escapeSql(filters.datasetName)}'`);

  const startYear = filters.startDate ? Number.parseInt(filters.startDate.slice(0, 4), 10) : Number.NaN;
  const endYear = filters.endDate ? Number.parseInt(filters.endDate.slice(0, 4), 10) : Number.NaN;
  if (Number.isFinite(startYear)) clauses.push(`year >= ${startYear}`);
  if (Number.isFinite(endYear)) clauses.push(`year <= ${endYear}`);

  return clauses.join(' AND ');
}

async function queryArcgis(params: Record<string, string | number | boolean>, signal?: AbortSignal) {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => query.set(key, String(value)));
  const response = await fetch(`${BASE_URL}/query?${query.toString()}`, { signal });
  if (!response.ok) {
    throw new Error(`GBIF query failed: ${response.status} ${response.statusText}`);
  }
  const json = await response.json();
  if (json.error) {
    const errorMessage =
      typeof json.error.message === 'string' && json.error.message.trim()
        ? json.error.message.trim()
        : 'GBIF service error';
    const details = Array.isArray(json.error.details)
      ? json.error.details.filter((detail: unknown): detail is string => typeof detail === 'string' && detail.trim().length > 0)
      : [];
    throw new Error(details.length > 0 ? `${errorMessage} ${details.join(' ')}` : errorMessage);
  }
  return json;
}

async function queryDistinct(fieldName: string, limit = 200): Promise<string[]> {
  const json = await queryArcgis({
    where: `${fieldName} IS NOT NULL`,
    outFields: fieldName,
    returnGeometry: false,
    returnDistinctValues: true,
    orderByFields: fieldName,
    resultRecordCount: limit,
    f: 'json',
  });

  const values = (json.features ?? [])
    .map((feature: { attributes?: Record<string, unknown> }) => feature.attributes?.[fieldName])
    .filter((value: unknown): value is string => typeof value === 'string' && value.trim().length > 0);
  return Array.from(new Set<string>(values)).sort((a: string, b: string) => a.localeCompare(b));
}

class GBIFService {
  buildWhereClause(filters: GBIFFilters): string {
    return buildWhereClause(filters);
  }

  async queryOccurrences(options: GBIFQueryOptions): Promise<GBIFQueryResponse> {
    const where = buildWhereClause(options);
    const page = Math.max(0, options.page);
    const pageSize = Math.max(1, Math.min(options.pageSize, 100));
    const offset = page * pageSize;

    const countPromise = queryArcgis(
      {
        where,
        returnCountOnly: true,
        f: 'json',
      },
      options.signal,
    ).catch(() => null);

    const dataJson = await queryArcgis(
      {
        where,
        outFields:
          'id,gbif_key,scientific_name,species,genus,family,taxonomic_class,phylum,kingdom,basis_of_record,dataset_name,recorded_by,event_date_json,primary_image_url,media_json,references_url,country,state_province,occurrence_status,issues_json',
        returnGeometry: true,
        orderByFields: 'year DESC, month DESC, day DESC, id DESC',
        resultRecordCount: pageSize,
        resultOffset: offset,
        f: 'json',
      },
      options.signal,
    );
    const countJson = await countPromise;
    const occurrences = (dataJson.features ?? []).map(toOccurrence);
    if (import.meta.env.DEV) {
      const pageRowsWithRawMediaJson = occurrences.filter((occurrence) => {
        const raw = occurrence.mediaJson?.trim() ?? '';
        return raw.length > 0 && raw !== '[]';
      }).length;
      const pageRowsWithParsedImageUrls = occurrences.filter((occurrence) => occurrence.mediaUrls.length > 0).length;
      // Dev-only breadcrumb to quickly confirm if a browse page is expected to show thumbnails.
      console.debug('[GBIF queryOccurrences]', {
        page: options.page,
        pageSize,
        results: occurrences.length,
        pageRowsWithRawMediaJson,
        pageRowsWithParsedImageUrls,
        where,
      });
    }
    const countFromService = typeof countJson?.count === 'number' ? countJson.count : null;
    const fallbackCount = offset + occurrences.length + (occurrences.length === pageSize ? 1 : 0);

    return {
      totalCount: countFromService ?? fallbackCount,
      occurrences,
    };
  }

  async getOccurrenceById(id: number, signal?: AbortSignal): Promise<GBIFOccurrence | null> {
    const json = await queryArcgis(
      {
        where: `id = ${id}`,
        outFields: '*',
        returnGeometry: true,
        resultRecordCount: 1,
        f: 'json',
      },
      signal,
    );
    const feature = (json.features ?? [])[0];
    return feature ? toOccurrence(feature) : null;
  }

  async getOverviewCount(): Promise<number> {
    try {
      const json = await queryArcgis({
        where: '1=1',
        returnCountOnly: true,
        f: 'json',
      });
      return typeof json.count === 'number' ? json.count : 0;
    } catch {
      return 0;
    }
  }

  async getFilterOptions() {
    const [kingdoms, families, basisOptions, datasetNames] = await Promise.all([
      queryDistinct('kingdom').catch(() => []),
      queryDistinct('family').catch(() => []),
      queryDistinct('basis_of_record').catch(() => []),
      queryDistinct('dataset_name').catch(() => []),
    ]);

    return {
      kingdoms,
      families,
      basisOptions,
      datasetNames,
    };
  }

  async getMediaUrlsByGbifKey(gbifKey: string, signal?: AbortSignal): Promise<string[]> {
    const trimmedKey = gbifKey.trim();
    if (!trimmedKey) return [];

    const response = await fetch(`${GBIF_API_BASE_URL}/occurrence/${encodeURIComponent(trimmedKey)}`, { signal });
    if (!response.ok) return [];

    const json = (await response.json()) as { media?: unknown };
    return extractMediaUrls(json.media);
  }
}

export const gbifService = new GBIFService();
