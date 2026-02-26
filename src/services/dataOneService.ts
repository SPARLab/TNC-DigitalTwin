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
  DataOneFileInfo,
  DataOneVersionEntry,
  FilesSummary,
} from '../types/dataone';
import { fetchArcGisResponse, fetchJson } from './dataone/client';
import {
  datasetMatchesFileTypeFilters,
  normalizeFileTypeFilters,
  parseDelimitedList,
  parseFilesSummary,
  parseTimestamp,
} from './dataone/normalizers';
import {
  ALL_VERSIONS_LAYER_URL,
  buildWhereClause,
  LATEST_LAYER_URL,
  LITE_LAYER_URL,
  shouldUseLatestLayerForSearch,
} from './dataone/queries';

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


/**
 * De-duplicate datasets by dataone_id.
 * Keeps the first seen record, but upgrades to a better candidate when found.
 */
function dedupeDatasetsByDataoneId(datasets: DataOneDataset[]): DataOneDataset[] {
  const byId = new Map<string, DataOneDataset>();

  for (const dataset of datasets) {
    const existing = byId.get(dataset.dataoneId);
    if (!existing) {
      byId.set(dataset.dataoneId, dataset);
      continue;
    }

    const existingTime = existing.dateUploaded?.getTime() ?? 0;
    const nextTime = dataset.dateUploaded?.getTime() ?? 0;
    const preferIncoming =
      (!existing.isLatestVersion && dataset.isLatestVersion) ||
      (nextTime > existingTime) ||
      (nextTime === existingTime && dataset.id > existing.id);

    if (preferIncoming) {
      byId.set(dataset.dataoneId, dataset);
    }
  }

  return Array.from(byId.values());
}

/**
 * De-duplicate version history entries by dataone_id.
 */
function dedupeVersionEntries(entries: DataOneVersionEntry[]): DataOneVersionEntry[] {
  const byId = new Map<string, DataOneVersionEntry>();
  for (const entry of entries) {
    const existing = byId.get(entry.dataoneId);
    if (!existing) {
      byId.set(entry.dataoneId, entry);
      continue;
    }
    const existingTime = existing.dateUploaded?.getTime() ?? 0;
    const nextTime = entry.dateUploaded?.getTime() ?? 0;
    if (nextTime >= existingTime) {
      byId.set(entry.dataoneId, entry);
    }
  }
  return Array.from(byId.values()).sort(
    (left, right) => (right.dateUploaded?.getTime() ?? 0) - (left.dateUploaded?.getTime() ?? 0)
  );
}

/**
 * Convert lite record to processed dataset for list display
 */
function liteRecordToDataset(record: DataOneLiteRecord): DataOneDataset {
  const filesSummary = parseFilesSummary(record.files_summary);
  // Metadata-only if no files_summary or total is 0
  const isMetadataOnly = !filesSummary || filesSummary.total === 0;
  const abstractValue =
    'abstract' in record && typeof record.abstract === 'string'
      ? record.abstract
      : null;
  
  return {
    id: record.objectid,
    dataoneId: record.dataone_id,
    title: record.title,
    datasetUrl: record.dataset_url,
    tncCategory: record.tnc_category,
    tncCategories: parseDelimitedList(record.tnc_categories),
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
    authors: parseDelimitedList(record.authors),
    // External URL for metadata-only datasets
    externalUrl: record.external_url,
    abstract: abstractValue,
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
    keywords: parseDelimitedList(record.keywords),
    authors: parseDelimitedList(record.authors),
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

class DataOneService {
  private async queryAllDatasetsForClientFiltering(
    options: DataOneQueryOptions = {},
  ): Promise<DataOneDataset[]> {
    const useLatestLayer = shouldUseLatestLayerForSearch(options);
    const whereClause = buildWhereClause(options, useLatestLayer);
    const queryLayerUrl = useLatestLayer ? LATEST_LAYER_URL : LITE_LAYER_URL;

    const params = new URLSearchParams({
      where: whereClause,
      outFields: '*',
      returnGeometry: 'false',
      orderByFields: 'date_uploaded DESC',
      resultRecordCount: '5000',
      f: 'json',
    });

    const url = `${queryLayerUrl}/query?${params}`;
    const data = await fetchArcGisResponse(url, 'Failed to query DataONE datasets', options.signal);
    if (data.error) {
      throw new Error(`DataONE API error: ${data.error.message || 'Unknown error'}`);
    }
    if (!data.features) return [];

    const datasets = dedupeDatasetsByDataoneId(
      data.features.map((feature) => liteRecordToDataset(feature.attributes as DataOneLiteRecord)),
    );

    const fileTypeFilters = normalizeFileTypeFilters(options);
    if (fileTypeFilters.length === 0) return datasets;
    return datasets.filter((dataset) => datasetMatchesFileTypeFilters(dataset, fileTypeFilters));
  }

  /**
   * Get total count of datasets matching filters (uses Lite layer)
   */
  async countDatasets(options: DataOneQueryOptions = {}): Promise<number> {
    const fileTypeFilters = normalizeFileTypeFilters(options);
    if (fileTypeFilters.length > 0) {
      const clientFiltered = await this.queryAllDatasetsForClientFiltering(options);
      return clientFiltered.length;
    }

    const useLatestLayer = shouldUseLatestLayerForSearch(options);
    const whereClause = buildWhereClause(options, useLatestLayer);
    const countLayerUrl = useLatestLayer ? LATEST_LAYER_URL : LITE_LAYER_URL;

    const params = new URLSearchParams({
      where: whereClause,
      returnCountOnly: 'true',
      f: 'json',
    });

    const url = `${countLayerUrl}/query?${params}`;
    const data = await fetchArcGisResponse(url, 'Failed to count DataONE datasets', options.signal);
    
    // Check for API-level error
    if (data.error) {
      throw new Error(`DataONE API error: ${data.error.message || 'Unknown error'}`);
    }
    
    const count = (data as { count?: unknown }).count;
    return typeof count === 'number' && Number.isFinite(count) ? count : 0;
  }

  /**
   * Query datasets with pagination (uses Lite layer for fast queries)
   * Returns only latest versions (~12k instead of ~22k records)
   */
  async queryDatasets(options: DataOneQueryOptions = {}): Promise<DataOneQueryResponse> {
    const pageSize = options.pageSize || 20;
    const pageNumber = options.pageNumber || 0;
    const offset = pageNumber * pageSize;
    const fileTypeFilters = normalizeFileTypeFilters(options);

    if (fileTypeFilters.length > 0) {
      const clientFiltered = await this.queryAllDatasetsForClientFiltering(options);
      const totalCount = clientFiltered.length;
      const datasets = clientFiltered.slice(offset, offset + pageSize);
      return {
        datasets,
        totalCount,
        pageSize,
        pageNumber,
        totalPages: Math.ceil(totalCount / pageSize),
      };
    }

    const useLatestLayer = shouldUseLatestLayerForSearch(options);
    const whereClause = buildWhereClause(options, useLatestLayer);
    const queryLayerUrl = useLatestLayer ? LATEST_LAYER_URL : LITE_LAYER_URL;

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

    const url = `${queryLayerUrl}/query?${params}`;
    const data = await fetchArcGisResponse(url, 'Failed to query DataONE datasets', options.signal);

    // Guard against API error or undefined features
    if (data.error) {
      throw new Error(`DataONE API error: ${data.error.message || 'Unknown error'}`);
    }
    if (!data.features) {
      throw new Error('DataONE API error: No features returned');
    }

    const datasets = dedupeDatasetsByDataoneId(
      data.features.map((feature) => liteRecordToDataset(feature.attributes as DataOneLiteRecord))
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
    const data = await fetchArcGisResponse(url, 'Failed to get DataONE dataset details');

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
    const data = await fetchArcGisResponse(url, 'Failed to get version details');

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
    const data = await fetchArcGisResponse(url, 'Failed to get version history');

    if (data.error) {
      throw new Error(`DataONE API error: ${data.error.message || 'Unknown error'}`);
    }

    if (!data.features) {
      return [];
    }

    return dedupeVersionEntries(
      data.features.map((feature) => {
        const attrs = feature.attributes as DataOneLiteRecord;
        return {
          dataoneId: attrs.dataone_id,
          dateUploaded: parseTimestamp(attrs.date_uploaded),
          filesSummary: parseFilesSummary(attrs.files_summary),
        };
      })
    );
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
    const data = await fetchArcGisResponse(url, 'Failed to get DataONE map data', options.signal);

    if (data.error || !data.features) {
      return [];
    }

    const deduped = dedupeDatasetsByDataoneId(
      data.features.map((feature) => liteRecordToDataset(feature.attributes as DataOneLiteRecord))
    );

    return deduped
      .map((dataset) => ({
        id: dataset.id,
        dataoneId: dataset.dataoneId,
        title: dataset.title,
        repository: dataset.repository,
        geometry: dataset.geometry,
      }))
      .filter((dataset) => dataset.geometry !== undefined);
  }

  /**
   * Get DataONE datasets for v2 map layer rendering.
   * Returns Lite-layer records with center coordinates and filter metadata.
   */
  async getDatasetsForMapLayer(options: DataOneQueryOptions = {}): Promise<DataOneDataset[]> {
    const datasets = await this.queryAllDatasetsForClientFiltering(options);
    return datasets.filter((dataset) => dataset.centerLat != null && dataset.centerLon != null);
  }

  /**
   * Fetch one dataset from the Lite layer by DataONE identifier.
   * Used when opening detail view from map-marker clicks.
   */
  async getDatasetByDataoneId(dataoneId: string): Promise<DataOneDataset | null> {
    const escapedId = dataoneId.replace(/'/g, "''");
    const params = new URLSearchParams({
      where: `dataone_id = '${escapedId}'`,
      outFields: '*',
      returnGeometry: 'false',
      resultRecordCount: '1',
      f: 'json',
    });

    const url = `${LITE_LAYER_URL}/query?${params}`;
    const data = await fetchArcGisResponse(url, 'Failed to fetch DataONE dataset by id');
    if (data.error || !data.features || data.features.length === 0) return null;
    return liteRecordToDataset(data.features[0].attributes as DataOneLiteRecord);
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
    const data = await fetchArcGisResponse(url, 'Failed to get DataONE repositories');

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
      const escapedId = dataoneId
        .replace(/\\/g, '\\\\')
        .replace(/"/g, '\\"');
      const params = new URLSearchParams({
        q: `resourceMap:"${escapedId}"`,
        fl: 'formatId,size',
        rows: '1000',
        wt: 'json',
      });
      const url = `https://cn.dataone.org/cn/v2/query/solr/?${params.toString()}`;

      const data = await fetchJson(url, 'DataONE API error') as {
        response?: { docs?: Array<{ formatId?: string; size?: number }> };
      };
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
    const data = await fetchArcGisResponse(url, 'Failed to get DataONE GeoJSON');

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
