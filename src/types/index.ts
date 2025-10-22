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
export interface CartItem {
  id: string;                    // unique ID (timestamp + source)
  dataSource: 'inaturalist' | 'dendra' | 'calflora' | 'ebird';
  title: string;                 // user-friendly description
  query: {
    // Spatial filters
    spatialFilter?: 'preserve-only' | 'expanded' | 'custom';
    customPolygon?: string;      // GeoJSON string if custom
    
    // Time range
    timeRange?: string;           // e.g., "Last 30 days"
    startDate?: string;
    endDate?: string;
    
    // Data source-specific filters
    additionalFilters?: Record<string, any>;
  };
  itemCount: number;             // number of records in this query
  addedAt: number;               // timestamp when added
  previewData?: any[];           // first 5-10 records for preview
}

export interface ExportFormat {
  format: 'csv' | 'json' | 'geojson';
  filename: string;
  data: any[];
}
