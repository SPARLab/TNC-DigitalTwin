/**
 * DataONE Service
 * Queries ArcGIS Feature Services for DataONE research dataset metadata
 * and DataONE API for file-level information and downloads
 * 
 * Feature Service: https://dangermondpreserve-spatial.com/server/rest/services/Hosted/DataONE_Datasets/FeatureServer
 * - Layer 0 (Lite): Latest versions with lightweight fields - fast initial load (~12k records)
 * - Layer 1 (Latest): Latest versions with full metadata including abstracts
 * - Layer 2 (AllVersions): All versions for version history lookup by series_id (~22k records)
 */

import type {
  DataOneLiteRecord,
  DataOneFullRecord,
  DataOneDataset,
  DataOneDatasetDetail,
  DataOneQueryOptions,
  DataOneQueryResponse,
  DataOneArcGISResponse,
  DataOneFileInfo,
  DataOneVersionEntry,
  FilesSummary,
} from '../types/dataone';

// Re-export types for consumers
export type {
  DataOneDataset,
  DataOneDatasetDetail,
  DataOneQueryOptions,
  DataOneQueryResponse,
  DataOneFileInfo,
  DataOneVersionEntry,
  FilesSummary,
};

// ArcGIS Feature Service endpoints (new consolidated service)
const BASE_SERVICE_URL =
  'https://dangermondpreserve-spatial.com/server/rest/services/Hosted/DataONE_Datasets/FeatureServer';
const LITE_LAYER_URL = `${BASE_SERVICE_URL}/0`;      // Fast list loading, no abstracts
const LATEST_LAYER_URL = `${BASE_SERVICE_URL}/1`;    // Full metadata, latest versions only
const ALL_VERSIONS_LAYER_URL = `${BASE_SERVICE_URL}/2`; // All versions for history

// Dangermond Preserve center coordinates for default radius filter
// Calculated from actual preserve bounds: W -120.498, E -120.357, S 34.415, N 34.570
const PRESERVE_CENTER = {
  lat: 34.4925,
  lng: -120.4275,
};

// ~20 miles in degrees (approximate)
const RADIUS_DEGREES = 0.29;

/**
 * Parse comma-separated string into array
 */
function parseCommaList(str: string | null): string[] {
  if (!str) return [];
  return str.split(',').map((s) => s.trim()).filter(Boolean);
}

/**
 * Parse Unix timestamp (milliseconds) to Date object
 */
function parseTimestamp(timestamp: number | null): Date | null {
  if (timestamp === null) return null;
  const date = new Date(timestamp);
  return isNaN(date.getTime()) ? null : date;
}

/**
 * Parse files_summary JSON string
 * Format: {"total": 3, "by_ext": {"csv": 2, "pdf": 1}, "size_bytes": 22583}
 */
function parseFilesSummary(jsonStr: string | null): FilesSummary | null {
  if (!jsonStr) return null;
  try {
    const parsed = JSON.parse(jsonStr);
    return {
      total: parsed.total || 0,
      byExtension: parsed.by_ext || {},
      sizeBytes: parsed.size_bytes || 0,
    };
  } catch {
    console.warn('Failed to parse files_summary:', jsonStr);
    return null;
  }
}

/**
 * Convert lite record to processed dataset for list display
 */
function liteRecordToDataset(record: DataOneLiteRecord): DataOneDataset {
  const filesSummary = parseFilesSummary(record.files_summary);
  // Metadata-only if no files_summary or total is 0
  const isMetadataOnly = !filesSummary || filesSummary.total === 0;
  
  return {
    id: record.objectid,
    dataoneId: record.dataone_id,
    title: record.title,
    datasetUrl: record.dataset_url,
    tncCategory: record.tnc_category,
    tncCategories: parseCommaList(record.tnc_categories),
    tncConfidence: record.tnc_confidence,
    dateUploaded: parseTimestamp(record.date_uploaded),
    temporalCoverage: {
      beginDate: parseTimestamp(record.begin_date),
      endDate: parseTimestamp(record.end_date),
    },
    centerLat: record.center_lat,
    centerLon: record.center_lon,
    repository: record.datasource,
    // Computed geometry from center coordinates
    geometry: record.center_lat !== null && record.center_lon !== null
      ? {
          type: 'Point',
          coordinates: [record.center_lon, record.center_lat],
        }
      : undefined,
    // Version tracking fields
    seriesId: record.series_id,
    isLatestVersion: record.is_latest_version === 1,
    versionCount: record.version_count,
    filesSummary,
    // External URL for metadata-only datasets
    externalUrl: record.external_url,
    isMetadataOnly,
  };
}

/**
 * Convert full record to dataset detail
 */
function fullRecordToDatasetDetail(record: DataOneFullRecord): DataOneDatasetDetail {
  const base = liteRecordToDataset(record);
  return {
    ...base,
    abstract: record.abstract,
    keywords: parseCommaList(record.keywords),
    authors: parseCommaList(record.authors),
    site: record.site,
    project: record.project,
    funding: record.funding,
    spatialCoverage: record.north_bound !== null
      ? {
          north: record.north_bound,
          south: record.south_bound,
          east: record.east_bound,
          west: record.west_bound,
        }
      : null,
    datePublished: parseTimestamp(record.date_published),
    dateModified: parseTimestamp(record.date_modified),
    dataUrl: record.data_url,
    sizeBytes: record.size_bytes,
    rightsHolder: record.rights_holder,
  };
}

/**
 * Build where clause for spatial filter using center_lat/center_lon
 */
function buildWhereClause(options: DataOneQueryOptions): string {
  const conditions: string[] = ['1=1'];

  // Apply 20-mile radius around preserve by default (using center point)
  if (options.usePreserveRadius !== false && !options.spatialExtent) {
    const north = PRESERVE_CENTER.lat + RADIUS_DEGREES;
    const south = PRESERVE_CENTER.lat - RADIUS_DEGREES;
    const east = PRESERVE_CENTER.lng + RADIUS_DEGREES;
    const west = PRESERVE_CENTER.lng - RADIUS_DEGREES;

    // Filter by center_lat and center_lon being within our search area
    conditions.push(
      `(center_lat >= ${south} AND center_lat <= ${north} AND ` +
        `center_lon >= ${west} AND center_lon <= ${east})`
    );
  } else if (options.spatialExtent) {
    const { xmin, ymin, xmax, ymax } = options.spatialExtent;
    conditions.push(
      `(center_lat >= ${ymin} AND center_lat <= ${ymax} AND ` +
        `center_lon >= ${xmin} AND center_lon <= ${xmax})`
    );
  }

  // Text search on title (lite layer doesn't have keywords)
  if (options.searchText) {
    const searchTerm = options.searchText.replace(/'/g, "''");
    conditions.push(`title LIKE '%${searchTerm}%'`);
  }

  // Repository filter
  if (options.repository) {
    conditions.push(`datasource = '${options.repository}'`);
  }

  // TNC category filter
  if (options.tncCategory) {
    const category = options.tncCategory.replace(/'/g, "''");
    conditions.push(`(tnc_category = '${category}' OR tnc_categories LIKE '%${category}%')`);
  }

  // Temporal filters using begin_date and end_date
  if (options.startDate) {
    conditions.push(`end_date >= '${options.startDate}'`);
  }
  if (options.endDate) {
    conditions.push(`begin_date <= '${options.endDate}'`);
  }

  return conditions.join(' AND ');
}

class DataOneService {
  /**
   * Get total count of datasets matching filters (uses Lite layer)
   */
  async countDatasets(options: DataOneQueryOptions = {}): Promise<number> {
    const whereClause = buildWhereClause(options);

    const params = new URLSearchParams({
      where: whereClause,
      returnCountOnly: 'true',
      f: 'json',
    });

    const url = `${LITE_LAYER_URL}/query?${params}`;
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Failed to count DataONE datasets: ${response.statusText}`);
    }

    const data = await response.json();
    
    // Check for API-level error
    if (data.error) {
      throw new Error(`DataONE API error: ${data.error.message || 'Unknown error'}`);
    }
    
    return data.count || 0;
  }

  /**
   * Query datasets with pagination (uses Lite layer for fast queries)
   * Returns only latest versions (~12k instead of ~22k records)
   */
  async queryDatasets(options: DataOneQueryOptions = {}): Promise<DataOneQueryResponse> {
    const pageSize = options.pageSize || 20;
    const pageNumber = options.pageNumber || 0;
    const offset = pageNumber * pageSize;

    const whereClause = buildWhereClause(options);

    // First get total count
    const totalCount = await this.countDatasets(options);

    // Then fetch page of results from Lite layer
    const params = new URLSearchParams({
      where: whereClause,
      outFields: '*',
      returnGeometry: 'false',
      orderByFields: 'date_uploaded DESC',
      resultRecordCount: String(pageSize),
      resultOffset: String(offset),
      f: 'json',
    });

    const url = `${LITE_LAYER_URL}/query?${params}`;
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Failed to query DataONE datasets: ${response.statusText}`);
    }

    const data: DataOneArcGISResponse = await response.json();

    // Guard against API error or undefined features
    if (data.error) {
      throw new Error(`DataONE API error: ${data.error.message || 'Unknown error'}`);
    }
    if (!data.features) {
      throw new Error('DataONE API error: No features returned');
    }

    const datasets = data.features.map((feature) =>
      liteRecordToDataset(feature.attributes as DataOneLiteRecord)
    );

    return {
      datasets,
      totalCount,
      pageSize,
      pageNumber,
      totalPages: Math.ceil(totalCount / pageSize),
    };
  }

  /**
   * Get full details for a single dataset by series_id (uses Latest layer)
   */
  async getDatasetDetails(dataoneId: string): Promise<DataOneDatasetDetail | null> {
    const params = new URLSearchParams({
      where: `dataone_id = '${dataoneId}'`,
      outFields: '*',
      returnGeometry: 'false',
      f: 'json',
    });

    const url = `${LATEST_LAYER_URL}/query?${params}`;
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Failed to get DataONE dataset details: ${response.statusText}`);
    }

    const data: DataOneArcGISResponse = await response.json();

    if (data.error) {
      throw new Error(`DataONE API error: ${data.error.message || 'Unknown error'}`);
    }

    if (!data.features || data.features.length === 0) {
      return null;
    }

    return fullRecordToDatasetDetail(data.features[0].attributes as DataOneFullRecord);
  }

  /**
   * Get full details for a specific version (uses AllVersions layer)
   */
  async getVersionDetails(dataoneId: string): Promise<DataOneDatasetDetail | null> {
    const params = new URLSearchParams({
      where: `dataone_id = '${dataoneId}'`,
      outFields: '*',
      returnGeometry: 'false',
      f: 'json',
    });

    const url = `${ALL_VERSIONS_LAYER_URL}/query?${params}`;
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Failed to get version details: ${response.statusText}`);
    }

    const data: DataOneArcGISResponse = await response.json();

    if (data.error) {
      throw new Error(`DataONE API error: ${data.error.message || 'Unknown error'}`);
    }

    if (!data.features || data.features.length === 0) {
      return null;
    }

    return fullRecordToDatasetDetail(data.features[0].attributes as DataOneFullRecord);
  }

  /**
   * Get version history for a dataset by series_id (uses AllVersions layer)
   * Returns all versions sorted by date_uploaded DESC (newest first)
   */
  async queryVersionHistory(seriesId: string): Promise<DataOneVersionEntry[]> {
    const escapedSeriesId = seriesId.replace(/'/g, "''");
    
    const params = new URLSearchParams({
      where: `series_id = '${escapedSeriesId}'`,
      outFields: 'dataone_id,date_uploaded,files_summary',
      returnGeometry: 'false',
      orderByFields: 'date_uploaded DESC',
      f: 'json',
    });

    const url = `${ALL_VERSIONS_LAYER_URL}/query?${params}`;
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Failed to get version history: ${response.statusText}`);
    }

    const data: DataOneArcGISResponse = await response.json();

    if (data.error) {
      throw new Error(`DataONE API error: ${data.error.message || 'Unknown error'}`);
    }

    if (!data.features) {
      return [];
    }

    return data.features.map((feature) => {
      const attrs = feature.attributes as DataOneLiteRecord;
      return {
        dataoneId: attrs.dataone_id,
        dateUploaded: parseTimestamp(attrs.date_uploaded),
        filesSummary: parseFilesSummary(attrs.files_summary),
      };
    });
  }

  /**
   * Get all dataset locations for map display (optimized for clustering)
   * Returns minimal data for up to 5000 datasets
   */
  async getAllDatasetsForMap(options: DataOneQueryOptions = {}): Promise<Array<{
    id: number;
    dataoneId: string;
    title: string;
    repository: string | null;
    geometry: { type: 'Point'; coordinates: [number, number] } | undefined;
  }>> {
    const whereClause = buildWhereClause(options);

    const params = new URLSearchParams({
      where: whereClause,
      outFields: 'objectid,dataone_id,title,datasource,center_lat,center_lon',
      returnGeometry: 'false',
      resultRecordCount: '5000',
      f: 'json',
    });

    const url = `${LITE_LAYER_URL}/query?${params}`;
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Failed to get DataONE map data: ${response.statusText}`);
    }

    const data: DataOneArcGISResponse = await response.json();

    if (data.error || !data.features) {
      return [];
    }

    return data.features
      .map((feature) => {
        const attrs = feature.attributes as DataOneLiteRecord;
        return {
          id: attrs.objectid,
          dataoneId: attrs.dataone_id,
          title: attrs.title,
          repository: attrs.datasource,
          geometry: attrs.center_lat !== null && attrs.center_lon !== null
            ? { type: 'Point' as const, coordinates: [attrs.center_lon, attrs.center_lat] as [number, number] }
            : undefined,
        };
      })
      .filter((d) => d.geometry !== undefined);
  }

  /**
   * Get all unique repositories for filter dropdown
   */
  async getRepositories(): Promise<string[]> {
    const params = new URLSearchParams({
      where: '1=1',
      outFields: 'datasource',
      returnDistinctValues: 'true',
      orderByFields: 'datasource',
      f: 'json',
    });

    const url = `${LITE_LAYER_URL}/query?${params}`;
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Failed to get DataONE repositories: ${response.statusText}`);
    }

    const data: DataOneArcGISResponse = await response.json();

    if (data.error || !data.features) {
      return [];
    }

    return data.features
      .map((f) => (f.attributes as DataOneLiteRecord).datasource)
      .filter((r): r is string => r !== null && r.trim() !== '')
      .sort();
  }

  /**
   * Fetch file information from DataONE API (on-demand)
   * This queries the DataONE Solr index for objects in the dataset's resource map
   */
  async getFileInfo(dataoneId: string): Promise<DataOneFileInfo> {
    try {
      // Query DataONE Solr for objects in this resource map
      const encodedId = encodeURIComponent(dataoneId);
      const url = `https://cn.dataone.org/cn/v2/query/solr/?q=resourceMap:*${encodedId}*&fl=formatId,size&rows=1000&wt=json`;

      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`DataONE API error: ${response.statusText}`);
      }

      const data = await response.json();
      const docs = data.response?.docs || [];

      // Extract file types and sizes
      const fileTypes = new Set<string>();
      let totalSize = 0;

      for (const doc of docs) {
        if (doc.formatId) {
          // Extract readable format name from formatId
          const formatName = doc.formatId.split('/').pop() || doc.formatId;
          fileTypes.add(formatName);
        }
        if (doc.size) {
          totalSize += doc.size;
        }
      }

      return {
        fileCount: docs.length,
        fileTypes: Array.from(fileTypes).sort(),
        totalSize,
      };
    } catch (error) {
      console.warn('Failed to fetch DataONE file info:', error);
      return {
        fileCount: 0,
        fileTypes: [],
        totalSize: 0,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Get download URL for a dataset (BagIt ZIP archive)
   * Note: This requires knowing the Member Node URL, which we may need to look up
   */
  getDownloadUrl(dataoneId: string, memberNodeUrl?: string): string {
    const mn = memberNodeUrl || 'https://knb.ecoinformatics.org/knb/d1/mn';
    const encodedId = encodeURIComponent(dataoneId);
    return `${mn}/v2/packages/application%2Fbagit-097/${encodedId}`;
  }

  /**
   * Get datasets as GeoJSON for map display
   */
  async getDatasetGeoJSON(options: DataOneQueryOptions = {}): Promise<{
    type: 'FeatureCollection';
    features: Array<{
      type: 'Feature';
      id: number;
      properties: {
        objectid: number;
        dataoneId: string;
        title: string;
        repository: string | null;
      };
      geometry: { type: 'Point'; coordinates: [number, number] };
    }>;
  }> {
    // Fetch all datasets within spatial extent (no pagination for map)
    const whereClause = buildWhereClause(options);

    const params = new URLSearchParams({
      where: whereClause,
      outFields: 'objectid,dataone_id,title,datasource,center_lat,center_lon',
      returnGeometry: 'false',
      resultRecordCount: '2000',
      f: 'json',
    });

    const url = `${LITE_LAYER_URL}/query?${params}`;
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Failed to get DataONE GeoJSON: ${response.statusText}`);
    }

    const data: DataOneArcGISResponse = await response.json();

    if (data.error || !data.features) {
      return { type: 'FeatureCollection', features: [] };
    }

    // Convert to GeoJSON features with center points
    const features = data.features
      .map((feature) => {
        const attrs = feature.attributes as DataOneLiteRecord;

        if (attrs.center_lat === null || attrs.center_lon === null) {
          return null;
        }

        return {
          type: 'Feature' as const,
          id: attrs.objectid,
          properties: {
            objectid: attrs.objectid,
            dataoneId: attrs.dataone_id,
            title: attrs.title,
            repository: attrs.datasource,
          },
          geometry: {
            type: 'Point' as const,
            coordinates: [attrs.center_lon, attrs.center_lat] as [number, number],
          },
        };
      })
      .filter((f): f is NonNullable<typeof f> => f !== null);

    return {
      type: 'FeatureCollection',
      features,
    };
  }
}

// Export singleton instance
export const dataOneService = new DataOneService();
