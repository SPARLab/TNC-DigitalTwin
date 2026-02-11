// ============================================================================
// Layer Registry — Dummy data for Phase 0
// Maps TNC's 13 domain categories + "Research Datasets" to layers.
// ============================================================================

import type { Category, CatalogLayer } from '../types';

/** All catalog layers indexed by id */
const LAYERS: CatalogLayer[] = [
  // Species
  { id: 'animl-camera-traps', name: 'Camera Traps (ANiML)', categoryId: 'species', dataSource: 'animl', icon: 'Camera' },
  { id: 'inaturalist-obs', name: 'iNaturalist Observations', categoryId: 'species', dataSource: 'inaturalist', icon: 'Leaf' },
  { id: 'ebird-sightings', name: 'eBird Sightings', categoryId: 'species', dataSource: 'ebird', icon: 'Bird' },
  // Fire
  { id: 'fire-perimeters', name: 'Fire Perimeters', categoryId: 'fire', dataSource: 'tnc-arcgis', icon: 'Flame' },
  { id: 'fire-severity', name: 'Fire Severity Zones', categoryId: 'fire', dataSource: 'tnc-arcgis', icon: 'Flame' },
  { id: 'prescribed-burns', name: 'Prescribed Burns', categoryId: 'fire', dataSource: 'tnc-arcgis', icon: 'Flame' },
  // Freshwater
  { id: 'water-sensors', name: 'Water Level Sensors (Dendra)', categoryId: 'freshwater', dataSource: 'dendra', icon: 'Droplets' },
  { id: 'streams-rivers', name: 'Streams & Rivers', categoryId: 'freshwater', dataSource: 'tnc-arcgis', icon: 'Droplets' },
  // Research and Sensor Equipment
  { id: 'dendra-weather', name: 'Weather Stations (Dendra)', categoryId: 'research-sensor', dataSource: 'dendra', icon: 'Thermometer' },
  { id: 'dendra-soil', name: 'Soil Sensors (Dendra)', categoryId: 'research-sensor', dataSource: 'dendra', icon: 'Thermometer' },
  { id: 'drone-imagery', name: 'Drone Imagery', categoryId: 'research-sensor', dataSource: 'drone', icon: 'Plane' },
  { id: 'lidar-scans', name: 'LiDAR Scans', categoryId: 'research-sensor', dataSource: 'lidar', icon: 'Scan' },
  // Boundaries
  { id: 'preserve-boundary', name: 'Preserve Boundary', categoryId: 'boundaries', dataSource: 'tnc-arcgis', icon: 'Square' },
  { id: 'marine-protected', name: 'Marine Protected Areas', categoryId: 'boundaries', dataSource: 'tnc-arcgis', icon: 'Square' },
  // Earth Observations
  { id: 'satellite-imagery', name: 'Satellite Imagery', categoryId: 'earth-obs', dataSource: 'tnc-arcgis', icon: 'Satellite' },
  // Elevation and Bathymetry
  { id: 'elevation-dem', name: 'Digital Elevation Model', categoryId: 'elevation', dataSource: 'tnc-arcgis', icon: 'Mountain' },
  { id: 'bathymetry', name: 'Coastal Bathymetry', categoryId: 'elevation', dataSource: 'tnc-arcgis', icon: 'Mountain' },
  // Infrastructure
  { id: 'roads-trails', name: 'Roads & Trails', categoryId: 'infrastructure', dataSource: 'tnc-arcgis', icon: 'Route' },
  // Land Cover
  { id: 'vegetation-communities', name: 'Vegetation Communities', categoryId: 'land-cover', dataSource: 'tnc-arcgis', icon: 'TreePine' },
  { id: 'habitat-types', name: 'Habitat Types', categoryId: 'land-cover', dataSource: 'tnc-arcgis', icon: 'TreePine' },
  // Oceans and Coasts
  { id: 'kelp-forest', name: 'Kelp Forest Extent', categoryId: 'oceans', dataSource: 'tnc-arcgis', icon: 'Waves' },
  { id: 'coastal-erosion', name: 'Coastal Erosion', categoryId: 'oceans', dataSource: 'tnc-arcgis', icon: 'Waves' },
  { id: 'tide-stations', name: 'Tide Monitoring Stations', categoryId: 'oceans', dataSource: 'dendra', icon: 'Waves' },
  // Soils and Geology
  { id: 'soil-types', name: 'Soil Types', categoryId: 'soils', dataSource: 'tnc-arcgis', icon: 'Layers' },
  // Threats and Hazards
  { id: 'invasive-species', name: 'Invasive Species Risk', categoryId: 'threats', dataSource: 'tnc-arcgis', icon: 'AlertTriangle' },
  { id: 'oil-gas-wells', name: 'Oil & Gas Wells', categoryId: 'threats', dataSource: 'tnc-arcgis', icon: 'AlertTriangle' },
  // Weather and Climate
  { id: 'weather-stations', name: 'Weather Stations', categoryId: 'weather', dataSource: 'dendra', icon: 'CloudSun' },
  { id: 'climate-projections', name: 'Climate Projections', categoryId: 'weather', dataSource: 'tnc-arcgis', icon: 'CloudSun' },
  // Research Datasets (DataOne)
  { id: 'dataone-datasets', name: 'DataOne Datasets', categoryId: 'research-datasets', dataSource: 'dataone', icon: 'BookOpen' },
];

/** The 13 TNC domain categories + Research Datasets (Research Datasets at bottom) */
export const CATEGORIES: Category[] = [
  { id: 'boundaries', name: 'Boundaries', icon: 'Square', layers: [] },
  { id: 'earth-obs', name: 'Earth Observations', icon: 'Satellite', layers: [] },
  { id: 'elevation', name: 'Elevation and Bathymetry', icon: 'Mountain', layers: [] },
  { id: 'fire', name: 'Fire', icon: 'Flame', layers: [] },
  { id: 'freshwater', name: 'Freshwater', icon: 'Droplets', layers: [] },
  { id: 'infrastructure', name: 'Infrastructure', icon: 'Route', layers: [] },
  { id: 'land-cover', name: 'Land Cover', icon: 'TreePine', layers: [] },
  { id: 'oceans', name: 'Oceans and Coasts', icon: 'Waves', layers: [] },
  { id: 'research-sensor', name: 'Research and Sensor Equipment', icon: 'Thermometer', layers: [] },
  { id: 'soils', name: 'Soils and Geology', icon: 'Layers', layers: [] },
  { id: 'species', name: 'Species', icon: 'PawPrint', layers: [] },
  { id: 'threats', name: 'Threats and Hazards', icon: 'AlertTriangle', layers: [] },
  { id: 'weather', name: 'Weather and Climate', icon: 'CloudSun', layers: [] },
  { id: 'research-datasets', name: 'Research Datasets', icon: 'BookOpen', layers: [] },
].map(cat => ({
  ...cat,
  layers: LAYERS.filter(l => l.categoryId === cat.id),
}));

/** Quick lookup: layer by id */
export const LAYER_MAP = new Map(LAYERS.map(l => [l.id, l]));

/** DataOne dataset counts per domain (DFT-045 shortcut rows) */
export const DATAONE_DOMAIN_COUNTS: Record<string, number> = {
  species: 15,
  fire: 8,
  freshwater: 12,
  'land-cover': 6,
  oceans: 4,
  'research-sensor': 3,
  soils: 2,
  weather: 7,
  boundaries: 1,
  'earth-obs': 0,
  elevation: 0,
  infrastructure: 0,
  threats: 3,
};
