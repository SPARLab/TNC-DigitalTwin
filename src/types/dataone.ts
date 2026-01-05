/**
 * Type definitions for DataONE research datasets
 * 
 * Based on actual Feature Service schema from:
 * - Catalog: https://dangermondpreserve-spatial.com/server/rest/services/Hosted/DataONE_Catalog/FeatureServer/0
 * - Detail: https://dangermondpreserve-spatial.com/server/rest/services/Hosted/DataONE_Detail/FeatureServer/0
 */

/**
 * Catalog layer record - basic info for list display
 * Used for fast queries in the paginated list view
 */
export interface DataOneCatalogRecord {
  objectid: number;
  dataone_id: string;
  title: string;
  dataset_url: string | null;
  tnc_category: string | null;
  tnc_categories: string | null;
  tnc_confidence: number | null;
  date_uploaded: string | null; // ISO date string
  begin_date: string | null;
  end_date: string | null;
  center_lat: number | null;
  center_lon: number | null;
  datasource: string | null; // Repository (PISCO, LTER, etc.)
}

/**
 * Detail layer record - full metadata
 * Used for the details sidebar
 */
export interface DataOneDetailRecord extends DataOneCatalogRecord {
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
  date_published: string | null;
  date_modified: string | null;
  data_url: string | null;
  size_bytes: number | null;
  rights_holder: string | null;
}

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
    attributes: DataOneCatalogRecord | DataOneDetailRecord;
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
