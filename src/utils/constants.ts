// Application constants
import categoryMappings from '../data-sources/tnc-arcgis/category_mappings.json';

export const APP_NAME = 'Dangermond Preserve Data Catalog';

// Feature Flags
// Set to true to re-enable the Tags filter dropdown in the subheader
export const ENABLE_TAGS_FILTER = false;
export const APP_VERSION = '1.0.0';

// Import main categories from the TNC category mappings (single source of truth)
// These are the master categories that all data sources map onto
const TNC_MAIN_CATEGORIES = categoryMappings.main_categories as readonly string[];

// Use TNC main categories as the official data categories
export const DATA_CATEGORIES = TNC_MAIN_CATEGORIES;

export const DATA_SOURCES = [
  'iNaturalist (Public API)',
  'iNaturalist (TNC Layers)',
  'eBird',
  'CalFlora',
  'TNC ArcGIS Hub',
  'LiDAR',
  'Dendra Stations',
  'Animl',
  'Drone Imagery',
  'DataONE'
] as const;

// Map categories to their available data sources
// Merges TNC ArcGIS Hub data with legacy sources (iNaturalist, eBird, CalFlora) into official TNC categories
export const CATEGORY_DATA_SOURCES: Record<string, readonly string[]> = {
  // All TNC main categories map to TNC ArcGIS Hub by default
  ...TNC_MAIN_CATEGORIES.reduce((acc, category) => {
    acc[category] = ['TNC ArcGIS Hub'];
    return acc;
  }, {} as Record<string, string[]>),
  
  // Species category includes wildlife observation sources and research datasets
  'Species': ['TNC ArcGIS Hub', 'iNaturalist (Public API)', 'iNaturalist (TNC Layers)', 'eBird', 'Animl', 'DataONE'],
  
  // Land Cover category includes plant observation sources
  'Land Cover': ['TNC ArcGIS Hub', 'CalFlora', 'iNaturalist (Public API)', 'iNaturalist (TNC Layers)', 'DataONE'],
  
  // Boundaries category
  'Boundaries': ['TNC ArcGIS Hub'],
  
  // Elevation and Bathymetry includes LiDAR
  'Elevation and Bathymetry': ['TNC ArcGIS Hub', 'LiDAR'],
  
  // Earth Observations includes Drone Imagery
  'Earth Observations': ['TNC ArcGIS Hub', 'Drone Imagery'],
  
  // Research and Sensor Equipment includes Dendra Stations and Animl camera traps
  'Research and Sensor Equipment': ['TNC ArcGIS Hub', 'Dendra Stations', 'Animl'],
  
  // Oceans and Coasts includes oceanographic research datasets
  'Oceans and Coasts': ['TNC ArcGIS Hub', 'DataONE'],
  
  // Weather and Climate includes climate research datasets
  'Weather and Climate': ['TNC ArcGIS Hub', 'DataONE'],
  
  // Freshwater includes freshwater research datasets
  'Freshwater': ['TNC ArcGIS Hub', 'DataONE'],
  
  // Soils and Geology
  'Soils and Geology': ['TNC ArcGIS Hub'],
  
  // Infrastructure
  'Infrastructure': ['TNC ArcGIS Hub'],
  
  // Threats and Hazards
  'Threats and Hazards': ['TNC ArcGIS Hub'],
  
  // Fire
  'Fire': ['TNC ArcGIS Hub']
} as const;

// Validate that all data categories have a source mapping
DATA_CATEGORIES.forEach(category => {
  if (!CATEGORY_DATA_SOURCES[category]) {
    console.warn(`⚠️ Category "${category}" is missing a data source mapping in CATEGORY_DATA_SOURCES.`);
  }
});

console.log(`✅ Loaded ${DATA_CATEGORIES.length} TNC main categories`);

export const SPATIAL_FILTERS = [
  'Draw Area',
  'Current View', 
  'Dangermond Preserve',
  'Dangermond + Margin'
] as const;

export const TIME_RANGES = [
  '2020-2024',
  '2023-2024',
  '2022-2023',
  'Last 6 months',
  'Custom Range'
] as const;

// Map settings
export const DEFAULT_MAP_CENTER = {
  lat: 34.4669,
  lng: -120.0707
} as const;

export const DEFAULT_MAP_ZOOM = 12;
