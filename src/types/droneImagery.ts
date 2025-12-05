/**
 * Type definitions for DroneDeploy imagery metadata
 */

/**
 * Raw record from the DroneDeploy_Metadata FeatureServer
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
    serviceUrl?: string; // To be fetched from item metadata
  };
  imageCollection?: {
    link: string;
    itemId: string;
  };
  recordType: string;
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
