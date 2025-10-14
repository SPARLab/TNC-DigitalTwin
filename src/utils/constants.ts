// Application constants
import categoryMappings from '../data-sources/tnc-arcgis/category_mappings.json';

export const APP_NAME = 'Dangermond Preserve Data Catalog';
export const APP_VERSION = '1.0.0';

// Import main categories from the TNC category mappings (single source of truth)
// These are the master categories that all data sources map onto
const TNC_MAIN_CATEGORIES = categoryMappings.main_categories as readonly string[];

// Add Wildlife and Vegetation as legacy categories for iNaturalist/CalFlora compatibility
// All categories will map external data onto these master categories
export const DATA_CATEGORIES = [
  'Wildlife',
  'Vegetation',
  ...TNC_MAIN_CATEGORIES
] as const;

export const DATA_SOURCES = [
  'iNaturalist (Public API)',
  'iNaturalist (TNC Layers)',
  'eBird',
  'CalFlora',
  'TNC ArcGIS Hub',
  'LiDAR'
] as const;

// Map categories to their available data sources
// Wildlife and Vegetation are legacy categories that map to older data sources
// All TNC main categories map to TNC ArcGIS Hub
export const CATEGORY_DATA_SOURCES: Record<string, readonly string[]> = {
  // Legacy categories for iNaturalist, eBird, and CalFlora
  'Wildlife': ['iNaturalist (Public API)', 'iNaturalist (TNC Layers)', 'eBird'],
  'Vegetation': ['CalFlora', 'iNaturalist (Public API)', 'iNaturalist (TNC Layers)'],
  
  // TNC main categories - all map to TNC ArcGIS Hub
  ...TNC_MAIN_CATEGORIES.reduce((acc, category) => {
    // Land use category gets LiDAR in addition to TNC ArcGIS Hub
    if (category === 'Land use and land (geography?)') {
      acc[category] = ['TNC ArcGIS Hub', 'LiDAR'];
    } else {
      acc[category] = ['TNC ArcGIS Hub'];
    }
    return acc;
  }, {} as Record<string, string[]>)
} as const;

// Validate that all data categories have a source mapping
DATA_CATEGORIES.forEach(category => {
  if (!CATEGORY_DATA_SOURCES[category]) {
    console.warn(`⚠️ Category "${category}" is missing a data source mapping in CATEGORY_DATA_SOURCES.`);
  }
});

console.log(`✅ Loaded ${TNC_MAIN_CATEGORIES.length} TNC main categories + 2 legacy categories = ${DATA_CATEGORIES.length} total categories`);

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
