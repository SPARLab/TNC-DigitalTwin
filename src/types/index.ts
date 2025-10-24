export interface Dataset {
  id: string;
  title: string;
  description: string;
  source: string;
  date: string;
  category: 'Wildlife' | 'Vegetation' | 'Climate' | 'Hydrology';
  icon: string;
}

export interface FilterState {
  category: string;
  source: string;
  spatialFilter: string;
  timeRange: string;
  daysBack?: number; // Number of days back from current date
  startDate?: string; // Custom start date (YYYY-MM-DD)
  endDate?: string; // Custom end date (YYYY-MM-DD)
  qualityGrade?: 'research' | 'needs_id' | 'casual';
  iconicTaxa?: string[];
  customPolygon?: {
    rings: number[][][];
    spatialReference: { wkid: number };
  };
}

export interface DataLayer {
  id: string;
  name: string;
  color: string;
  visible: boolean;
}

export interface ObservationGroup {
  category: 'Flora' | 'Fauna';
  count: number;
  subcategories: {
    name: string;
    iconicTaxon: string;
    count: number;
    observations: Array<{
      id: number;
      commonName: string | null;
      scientificName: string;
      observedOn: string;
      observer: string;
      photoUrl: string | null;
      qualityGrade: string;
      uri: string;
    }>;
  }[];
}

export interface CalFloraGroup {
  category: 'Native Plants' | 'Invasive Plants';
  count: number;
  subcategories: {
    name: string;
    nativeStatus: 'native' | 'invasive' | 'non-native' | 'unknown';
    count: number;
    plants: Array<{
      id: string;
      commonName: string | null;
      scientificName: string;
      family: string | null;
      nativeStatus: 'native' | 'invasive' | 'non-native' | 'unknown';
      calIpcRating: string | null;
      county: string | null;
      observationDate: string | null;
      dataSource: string;
      photoUrl?: string | null;
    }>;
  }[];
}

// Dendra Station Types
export interface DendraStation {
  id: number;
  dendra_st_id: string;
  name: string;
  full_name: string | null;
  description: string | null;
  slug: string;
  station_type: string;
  latitude: number;
  longitude: number;
  elevation: number | null;
  time_zone: string;
  utc_offset: number;
  is_active: number;
  is_stationary: number;
  is_enabled: number;
  is_geo_protected: number;
  is_hidden: number;
  state: string;
  organization_id: string;
  version_id: string;
  created_at: number;
  updated_at: number;
  created_by: string;
  updated_by: string;
  geometry: {
    x: number;
    y: number;
  };
}

export interface DendraDatastream {
  id: number;
  dendra_ds_id: string;
  station_id: number;
  name: string;
  description: string | null;
  variable: string;
  medium: string;
  unit: string | null;
  source_type: string;
  state: string;
  is_enabled: number;
  created_at: number;
  updated_at: number;
}

export interface DendraDatapoint {
  id: number;
  datastream_id: number;
  timestamp_utc: number;
  value: number;
}

export interface DendraDatastreamMetadata {
  firstTimestamp: number | null;
  lastTimestamp: number | null;
  datapointCount: number;
  minValue: number | null;
  maxValue: number | null;
}

export interface DendraDatastreamWithMetadata extends DendraDatastream {
  metadata: DendraDatastreamMetadata;
}

export interface DendraDatastreamWithStation extends DendraDatastream {
  stationName: string;
}

export interface DendraStationWithMetadata extends DendraStation {
  datastreamCount: number;
  firstTimestamp: number | null;
  lastTimestamp: number | null;
}

// Shopping Cart Types

/**
 * iNaturalist-specific query filters
 * Based on iNaturalist API v1: https://api.inaturalist.org/v1/docs/
 */
export interface INaturalistCustomFilters {
  /** 
   * Filter by observation quality grade (Public API only, works client-side)
   * - research: Has community identification to species level with 2/3 agreement
   * - needs_id: Needs community identification
   * - casual: Does not meet research grade criteria
   */
  qualityGrade?: 'research' | 'needs_id' | 'casual';
  
  /** 
   * Filter by major taxonomic groups (iconic taxa) (works client-side)
   * Examples: Aves (birds), Mammalia (mammals), Plantae (plants), etc.
   */
  iconicTaxa?: string[];
  
  /** 
   * Search by taxon scientific or common name (works client-side)
   * Note: Names are not unique, may match multiple taxa
   */
  taxonName?: string;
  
  /** 
   * Filter observations by photo presence (works client-side)
   * - 'any': Include all observations (default)
   * - 'with': Only include observations that have photos
   * - 'without': Only include observations without photos
   */
  photoFilter?: 'any' | 'with' | 'without';
  
  /**
   * Filter by months (1-12) (works client-side)
   * Useful for seasonal analysis and migration patterns
   */
  months?: number[];
}

/**
 * CalFlora-specific query filters (future implementation)
 */
export interface CalFloraCustomFilters {
  /** Filter by native status: native, invasive, non-native */
  nativeStatus?: 'native' | 'invasive' | 'non-native';
  
  /** California Invasive Plant Council (Cal-IPC) rating */
  calIpcRating?: string;
  
  // Additional filters to be defined
}

/**
 * eBird-specific query filters (future implementation)
 */
export interface EBirdCustomFilters {
  /** Include only verified observations */
  verifiedOnly?: boolean;
  
  /** Filter by breeding codes */
  breedingCodes?: string[];
  
  // Additional filters to be defined
}

/**
 * Dendra-specific query filters (future implementation)
 */
export interface DendraCustomFilters {
  /** Filter by datastream variable type (temperature, humidity, etc.) */
  variableTypes?: string[];
  
  /** Filter by measurement medium (air, soil, water, etc.) */
  mediums?: string[];
  
  // Additional filters to be defined
}

/**
 * Shopping cart item representing a saved query
 * Stores query parameters (not data) for re-execution during export
 */
export interface CartItem {
  /** Unique identifier for this cart item */
  id: string;
  
  /** Data source identifier */
  dataSource: 'inaturalist' | 'dendra' | 'calflora' | 'ebird';
  
  /** User-friendly title describing this query */
  title: string;
  
  /** Core filters from the subheader (shared across all data sources) */
  coreFilters: {
    /** Data category (e.g., 'Ecological / Biological (Species?)') */
    category: string;
    
    /** Data source name (e.g., 'iNaturalist', 'CalFlora') */
    source: string;
    
    /** Spatial filter selection (e.g., 'Dangermond Preserve', 'Expanded Area') */
    spatialFilter: string;
    
    /** Human-readable time range description */
    timeRange: string;
    
    /** Number of days back from current date (for relative time ranges) */
    daysBack?: number;
    
    /** Custom start date (YYYY-MM-DD format) */
    startDate?: string;
    
    /** Custom end date (YYYY-MM-DD format) */
    endDate?: string;
    
    /** Custom polygon for spatial filtering (ArcGIS format) */
    customPolygon?: {
      rings: number[][][];
      spatialReference: { wkid: number };
    };
  };
  
  /** Data source-specific custom filters (only one will be populated per item) */
  customFilters: {
    /** iNaturalist-specific filters */
    inaturalist?: INaturalistCustomFilters;
    
    /** CalFlora-specific filters (future) */
    calflora?: CalFloraCustomFilters;
    
    /** eBird-specific filters (future) */
    ebird?: EBirdCustomFilters;
    
    /** Dendra-specific filters (future) */
    dendra?: DendraCustomFilters;
  };
  
  /** Estimated record count at time of adding to cart (for display purposes) */
  estimatedCount?: number;
  
  /** Timestamp when this item was added to cart */
  addedAt: number;
}

export interface ExportFormat {
  format: 'csv' | 'json' | 'geojson';
  filename: string;
  data: any[];
}
