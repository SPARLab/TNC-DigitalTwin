/**
 * Type definitions for DataONE research datasets
 * 
 * Based on actual Feature Service schema from:
 * - DataONE_Datasets: https://dangermondpreserve-spatial.com/server/rest/services/Hosted/DataONE_Datasets/FeatureServer
 *   - Layer 0 (Lite): Fast list loading - latest versions only, no abstracts
 *   - Layer 1 (Latest): Full metadata for detail views - latest versions only  
 *   - Layer 2 (AllVersions): All versions - query by series_id for version history
 */

/**
 * Files summary parsed from JSON string in files_summary field
 * Format: {"total": 3, "by_ext": {"csv": 2, "pdf": 1}, "size_bytes": 22583}
 */
export interface FilesSummary {
  total: number;
  byExtension: Record<string, number>;
  sizeBytes: number;
}

/**
 * Lite layer record - minimal info for fast list loading
 * Used for paginated list view (Layer 0)
 */
export interface DataOneLiteRecord {
  objectid: number;
  dataone_id: string;
  title: string;
  dataset_url: string | null;
  tnc_category: string | null;
  tnc_categories: string | null;
  tnc_confidence: number | null;
  date_uploaded: number | null; // Unix timestamp in milliseconds
  begin_date: number | null;
  end_date: number | null;
  center_lat: number | null;
  center_lon: number | null;
  datasource: string | null; // Repository (PISCO, LTER, etc.)
  // Version tracking fields
  series_id: string;
  is_latest_version: number; // 1 = latest, 0 = older
  version_count: number;
  files_summary: string | null; // JSON string
  authors?: string | null; // Optional on layer 0 depending service schema rollout
  // External URL - for metadata-only datasets that link to another repository (e.g., PANGAEA)
  external_url: string | null;
}

/**
 * Catalog layer record - basic info for list display (legacy alias)
 * @deprecated Use DataOneLiteRecord instead
 */
export type DataOneCatalogRecord = DataOneLiteRecord;

/**
 * Latest/AllVersions layer record - full metadata
 * Used for the details sidebar (Layer 1) and version history (Layer 2)
 */
export interface DataOneFullRecord extends DataOneLiteRecord {
  abstract: string | null;
  keywords: string | null;
  authors: string | null;
  site: string | null;
  project: string | null;
  funding: string | null;
  north_bound: number | null;
  south_bound: number | null;
  east_bound: number | null;
  west_bound: number | null;
  date_published: number | null;
  date_modified: number | null;
  data_url: string | null;
  size_bytes: number | null;
  rights_holder: string | null;
}

/**
 * Detail layer record (legacy alias)
 * @deprecated Use DataOneFullRecord instead
 */
export type DataOneDetailRecord = DataOneFullRecord;

/**
 * Processed dataset for UI display
 */
export interface DataOneDataset {
  id: number;
  dataoneId: string;
  title: string;
  datasetUrl: string | null;
  tncCategory: string | null;
  tncCategories: string[];
  tncConfidence: number | null;
  dateUploaded: Date | null;
  temporalCoverage: {
    beginDate: Date | null;
    endDate: Date | null;
  };
  centerLat: number | null;
  centerLon: number | null;
  repository: string | null;
  // Computed geometry for map display
  geometry?: {
    type: 'Point';
    coordinates: [number, number]; // [longitude, latitude]
  };
  // Version tracking fields
  seriesId: string;
  isLatestVersion: boolean;
  versionCount: number;
  filesSummary: FilesSummary | null;
  authors?: string[];
  // External URL for metadata-only datasets (e.g., PANGAEA links)
  externalUrl: string | null;
  // Whether this is a metadata-only record (no files, just a pointer to external source)
  isMetadataOnly: boolean;
}

/**
 * Extended dataset with full detail fields
 */
export interface DataOneDatasetDetail extends DataOneDataset {
  abstract: string | null;
  keywords: string[];
  authors: string[];
  site: string | null;
  project: string | null;
  funding: string | null;
  spatialCoverage: {
    north: number | null;
    south: number | null;
    east: number | null;
    west: number | null;
  } | null;
  datePublished: Date | null;
  dateModified: Date | null;
  dataUrl: string | null;
  sizeBytes: number | null;
  rightsHolder: string | null;
  // File info loaded on-demand from DataONE API
  fileInfo?: DataOneFileInfo;
}

/**
 * Version history entry for a dataset
 */
export interface DataOneVersionEntry {
  dataoneId: string;
  dateUploaded: Date | null;
  filesSummary: FilesSummary | null;
  // Version number is derived from position in sorted list (newest = highest)
}

/**
 * File information from DataONE API (loaded on-demand)
 */
export interface DataOneFileInfo {
  fileCount: number;
  fileTypes: string[];
  totalSize: number;
  loading?: boolean;
  error?: string;
}

/**
 * Query options for DataONE service
 */
export interface DataOneQueryOptions {
  /** Text search (searches title) */
  searchText?: string;
  /** Filter by repository source (PISCO, LTER, etc.) */
  repository?: string;
  /** Optional author text filter */
  author?: string;
  /** Spatial filter - point radius around Dangermond Preserve */
  spatialExtent?: {
    xmin: number;
    ymin: number;
    xmax: number;
    ymax: number;
  };
  /** Temporal filter - start date */
  startDate?: string;
  /** Temporal filter - end date */
  endDate?: string;
  /** Page size for pagination */
  pageSize?: number;
  /** Page number (0-indexed) */
  pageNumber?: number;
  /** Whether to apply the default 20-mile radius filter */
  usePreserveRadius?: boolean;
  /** Filter by TNC category */
  tncCategory?: string;
  /** Optional request cancellation support */
  signal?: AbortSignal;
}

/**
 * Query response with pagination info
 */
export interface DataOneQueryResponse {
  datasets: DataOneDataset[];
  totalCount: number;
  pageSize: number;
  pageNumber: number;
  totalPages: number;
}

/**
 * Response from ArcGIS Feature Service query
 */
export interface DataOneArcGISResponse {
  features: Array<{
    attributes: DataOneLiteRecord | DataOneFullRecord;
    geometry?: {
      x: number;
      y: number;
    };
  }>;
  exceededTransferLimit?: boolean;
  error?: {
    code: number;
    message: string;
    details: string[];
  };
}
