/**
 * DataONE Service
 * Queries ArcGIS Feature Services for DataONE research dataset metadata
 * and DataONE API for file-level information and downloads
 * 
 * Feature Services:
 * - Catalog: https://dangermondpreserve-spatial.com/server/rest/services/Hosted/DataONE_Catalog/FeatureServer/0
 * - Detail: https://dangermondpreserve-spatial.com/server/rest/services/Hosted/DataONE_Detail/FeatureServer/0
 */

import type {
  DataOneCatalogRecord,
  DataOneDetailRecord,
  DataOneDataset,
  DataOneDatasetDetail,
  DataOneQueryOptions,
  DataOneQueryResponse,
  DataOneArcGISResponse,
  DataOneFileInfo,
} from '../types/dataone';

// Re-export types for consumers
export type { DataOneDataset, DataOneDatasetDetail, DataOneQueryOptions, DataOneQueryResponse, DataOneFileInfo };

// ArcGIS Feature Service endpoints
const CATALOG_SERVICE_URL =
  'https://dangermondpreserve-spatial.com/server/rest/services/Hosted/DataONE_Catalog/FeatureServer/0';
const DETAIL_SERVICE_URL =
  'https://dangermondpreserve-spatial.com/server/rest/services/Hosted/DataONE_Detail/FeatureServer/0';

// Dangermond Preserve center coordinates for default radius filter
const PRESERVE_CENTER = {
  lat: 34.4669,
  lng: -120.0707,
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
 * Parse date string to Date object
 */
function parseDate(dateStr: string | null): Date | null {
  if (!dateStr) return null;
  const date = new Date(dateStr);
  return isNaN(date.getTime()) ? null : date;
}

/**
 * Convert catalog record to processed dataset for list display
 */
function catalogRecordToDataset(record: DataOneCatalogRecord): DataOneDataset {
  return {
    id: record.objectid,
    dataoneId: record.dataone_id,
    title: record.title,
    datasetUrl: record.dataset_url,
    tncCategory: record.tnc_category,
    tncCategories: parseCommaList(record.tnc_categories),
    tncConfidence: record.tnc_confidence,
    dateUploaded: parseDate(record.date_uploaded),
    temporalCoverage: {
      beginDate: parseDate(record.begin_date),
      endDate: parseDate(record.end_date),
    },
    centerLat: record.center_lat,
    centerLon: record.center_lon,
    repository: record.datasource,
    // Create geometry from center coordinates if available
    geometry: record.center_lat !== null && record.center_lon !== null
      ? {
          type: 'Point',
          coordinates: [record.center_lon, record.center_lat],
        }
      : undefined,
  };
}

/**
 * Convert detail record to full dataset detail
 */
function detailRecordToDatasetDetail(record: DataOneDetailRecord): DataOneDatasetDetail {
  const base = catalogRecordToDataset(record);
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
    datePublished: parseDate(record.date_published),
    dateModified: parseDate(record.date_modified),
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

  // Text search on title (catalog layer doesn't have keywords)
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
   * Get total count of datasets matching filters
   */
  async countDatasets(options: DataOneQueryOptions = {}): Promise<number> {
    const whereClause = buildWhereClause(options);

    const params = new URLSearchParams({
      where: whereClause,
      returnCountOnly: 'true',
      f: 'json',
    });

    const url = `${CATALOG_SERVICE_URL}/query?${params}`;
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
   * Query datasets with pagination (uses Catalog layer for fast queries)
   */
  async queryDatasets(options: DataOneQueryOptions = {}): Promise<DataOneQueryResponse> {
    const pageSize = options.pageSize || 20;
    const pageNumber = options.pageNumber || 0;
    const offset = pageNumber * pageSize;

    const whereClause = buildWhereClause(options);

    // First get total count
    const totalCount = await this.countDatasets(options);

    // Then fetch page of results
    const params = new URLSearchParams({
      where: whereClause,
      outFields: '*',
      returnGeometry: 'false',
      orderByFields: 'date_uploaded DESC',
      resultRecordCount: String(pageSize),
      resultOffset: String(offset),
      f: 'json',
    });

    const url = `${CATALOG_SERVICE_URL}/query?${params}`;
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
      catalogRecordToDataset(feature.attributes as DataOneCatalogRecord)
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
   * Get full details for a single dataset (uses Detail layer)
   */
  async getDatasetDetails(dataoneId: string): Promise<DataOneDatasetDetail | null> {
    const params = new URLSearchParams({
      where: `dataone_id = '${dataoneId}'`,
      outFields: '*',
      returnGeometry: 'false',
      f: 'json',
    });

    const url = `${DETAIL_SERVICE_URL}/query?${params}`;
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

    return detailRecordToDatasetDetail(data.features[0].attributes as DataOneDetailRecord);
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

    const url = `${CATALOG_SERVICE_URL}/query?${params}`;
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
        const attrs = feature.attributes as DataOneCatalogRecord;
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

    const url = `${CATALOG_SERVICE_URL}/query?${params}`;
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Failed to get DataONE repositories: ${response.statusText}`);
    }

    const data: DataOneArcGISResponse = await response.json();

    if (data.error || !data.features) {
      return [];
    }

    return data.features
      .map((f) => (f.attributes as DataOneCatalogRecord).datasource)
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

    const url = `${CATALOG_SERVICE_URL}/query?${params}`;
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
        const attrs = feature.attributes as DataOneCatalogRecord;

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
