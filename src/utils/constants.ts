// Application constants
export const APP_NAME = 'Dangermond Preserve Data Catalog';
export const APP_VERSION = '1.0.0';

// Filter options
export const DATA_CATEGORIES = [
  'Wildlife',
  'Vegetation'
] as const;

export const DATA_SOURCES = [
  'iNaturalist (Public API)',
  'iNaturalist (TNC Layers)',
  'eBird',
  'CalFlora'
] as const;

// Map categories to their available data sources
export const CATEGORY_DATA_SOURCES = {
  'Wildlife': ['iNaturalist (Public API)', 'iNaturalist (TNC Layers)', 'eBird'],
  'Vegetation': ['CalFlora', 'iNaturalist (Public API)', 'iNaturalist (TNC Layers)']
} as const;

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
