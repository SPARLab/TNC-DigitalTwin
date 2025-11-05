// Application constants
import categoryMappings from '../data-sources/tnc-arcgis/category_mappings.json';

export const APP_NAME = 'Dangermond Preserve Data Catalog';
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
  'Animl'
] as const;

// Map categories to their available data sources
// Merges TNC ArcGIS Hub data with legacy sources (iNaturalist, eBird, CalFlora) into official TNC categories
export const CATEGORY_DATA_SOURCES: Record<string, readonly string[]> = {
  // All TNC main categories map to TNC ArcGIS Hub by default
  ...TNC_MAIN_CATEGORIES.reduce((acc, category) => {
    acc[category] = ['TNC ArcGIS Hub'];
    return acc;
  }, {} as Record<string, string[]>),
  
  // Ecological / Biological category includes wildlife observation sources
  'Ecological / Biological (Species?)': ['TNC ArcGIS Hub', 'iNaturalist (Public API)', 'iNaturalist (TNC Layers)', 'eBird', 'Animl'],
  
  // Vegetation / habitat category includes plant observation sources
  'Vegetation / habitat': ['TNC ArcGIS Hub', 'CalFlora', 'iNaturalist (Public API)', 'iNaturalist (TNC Layers)'],
  
  // Land use category includes LiDAR
  'Land use and land (geography?)': ['TNC ArcGIS Hub', 'LiDAR'],
  
  // Real-time & Remote Sensing includes Dendra Stations and Animl camera traps
  'Real-time & Remote Sensing': ['TNC ArcGIS Hub', 'Dendra Stations', 'Animl']
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
