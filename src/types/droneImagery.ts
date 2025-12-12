/**
 * Type definitions for DroneDeploy imagery metadata (v2 API)
 */

/**
 * Raw record from the DroneDeploy_Metadata_v2 FeatureServer
 */
export interface DroneImageryRecord {
  objectid: number;
  project_name: string;
  plan_id: string;
  plan_name: string;
  /** Unix timestamp in milliseconds */
  date_captured: string;
  wmts_link: string;
  wmts_item_id: string;
  collection_link: string | null;
  collection_item_id: string | null;
  /** Unix timestamp in milliseconds */
  last_updated: string;
  record_type: string;
  /** WKT POLYGON - master bounding box for all layers in a project */
  project_bounds: string | null;
  /** WKT POLYGON - individual layer extent */
  plan_geometry: string | null;
  /** Azure Blob Storage URL for raw TIF download */
  azure_blob_url: string | null;
}

/**
 * Processed drone imagery metadata with parsed dates
 */
export interface DroneImageryMetadata {
  id: number;
  projectName: string;
  planId: string;
  planName: string;
  dateCaptured: Date;
  lastUpdated: Date;
  wmts: {
    link: string;
    itemId: string;
    serviceUrl?: string;
  };
  imageCollection?: {
    link: string;
    itemId: string;
  };
  recordType: string;
  /** Parsed polygon rings from plan_geometry WKT */
  planGeometry?: number[][][];
  /** Azure Blob Storage URL for raw TIF download */
  tifUrl?: string;
}

/**
 * Grouped drone imagery by project
 */
export interface DroneImageryProject {
  projectName: string;
  imageryLayers: DroneImageryMetadata[];
  /** Earliest capture date across all layers */
  dateRangeStart: Date;
  /** Latest capture date across all layers */
  dateRangeEnd: Date;
  layerCount: number;
  hasImageCollections: boolean;
  /** Parsed polygon rings from project_bounds WKT (master bounding box) */
  projectBounds?: number[][][];
}

/**
 * State for the drone imagery carousel
 */
export interface DroneImageryCarouselState {
  isOpen: boolean;
  project: DroneImageryProject | null;
  currentLayerIndex: number;
}

/**
 * Response from the DroneDeploy_Metadata FeatureServer query
 */
export interface DroneImageryQueryResponse {
  features: Array<{
    attributes: DroneImageryRecord;
  }>;
  exceededTransferLimit: boolean;
  objectIdFieldName: string;
  fields: Array<{
    name: string;
    type: string;
    alias: string;
  }>;
}
