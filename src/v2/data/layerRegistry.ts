// ============================================================================
// Layer Registry — Static config used alongside the dynamic Data Catalog.
//
// The dynamic catalog (useCatalogRegistry) is the source of truth for
// categories and layers. This file provides:
//   1. Icon mapping for catalog category names → Lucide icon names
//   2. External/synthetic layers that aren't in the Data Catalog
//      (iNaturalist, DataOne, etc. — external APIs, not ArcGIS services)
// ============================================================================

import type { CatalogLayer } from '../types';

/**
 * Map catalog category *names* (exactly as returned by the FeatureServer)
 * to Lucide icon names. Falls back to 'Folder' if unmapped.
 */
export const CATEGORY_ICON_MAP: Record<string, string> = {
  // Top-level categories
  'Boundaries': 'Square',
  'Climate': 'CloudSun',
  'Earth Observations': 'Satellite',
  'Elevation and Bathymetry': 'Mountain',
  'Fire': 'Flame',
  'Freshwater': 'Droplets',
  'Infrastructure': 'Route',
  'Land Cover': 'TreePine',
  'Oceans and Coasts': 'Waves',
  'Research and Sensor Equipment': 'Thermometer',
  'Soils and Geology': 'Layers',
  'Species': 'PawPrint',
  'Uncategorized': 'HelpCircle',
  // Subcategories (inherit parent icon unless overridden)
  'Risk': 'ShieldAlert',
  'History': 'Clock',
  'Water Balance': 'Droplets',
  'Watershed Boundaries': 'MapPin',
  'Hydrologic Features': 'Droplets',
  'Transit': 'Route',
  'Agriculture': 'Wheat',
  'Water': 'Droplets',
  'Marine': 'Anchor',
  'Management': 'Settings',
  'Administrative': 'Building',
  'Habitats': 'Trees',
  'Restoration': 'Sprout',
};

/**
 * Layers from external APIs that don't appear in the ArcGIS Data Catalog.
 * These are injected into the dynamic catalog at load time so they show
 * up in the sidebar alongside catalog datasets.
 *
 * categoryId must match a catalog category id (numeric string).
 */
export const EXTERNAL_LAYERS: CatalogLayer[] = [
  {
    id: 'inaturalist-obs',
    name: 'iNaturalist Observations',
    categoryId: '38', // Species
    dataSource: 'inaturalist',
    icon: 'Leaf',
  },
  {
    id: 'animl-camera-traps',
    name: 'Camera Traps (ANiML)',
    categoryId: '38',
    dataSource: 'animl',
    icon: 'Camera',
  },
  // Future external layers (uncomment when adapters are ready):
  // { id: 'dataone-datasets', name: 'DataOne Datasets', categoryId: '39', dataSource: 'dataone', icon: 'BookOpen' },
  // { id: 'ebird-sightings', name: 'eBird Sightings', categoryId: '38', dataSource: 'ebird', icon: 'Bird' },
];
