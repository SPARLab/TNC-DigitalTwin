// ============================================================================
// Experience registry — models and simulations surfaced on the Experiences page.
// Ported from the twin_models webapp mockup (tools/registry.js). Suitability
// and Species Distribution Modeling have working control panels; remaining
// simulations stay marked unavailable until their geoprocessing services exist.
// ============================================================================

import { Bug, Compass, Droplets, Flame, Layers, Sprout, TreePine } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export type ExperienceKind = 'model' | 'simulation';

export interface ExperienceCategory {
  id: string;
  label: string;
  icon: LucideIcon;
}

export interface ExperienceDefinition {
  id: string;
  name: string;
  description: string;
  icon: LucideIcon;
  categoryId: string;
  kind: ExperienceKind;
  /** Consumes continuously updating sensor or forecast inputs. */
  usesRealTimeData: boolean;
  /** False once the experience has a working control panel wired up. */
  comingSoon: boolean;
  /** Card thumbnail. Falls back to the shared model still if omitted. */
  image: string;
  /** Workspace map centre, [longitude, latitude]. */
  mapCenter: [number, number];
  mapZoom: number;
  /** Which geoprocessing panel to mount. Unset entries stay coming-soon. */
  panel?: 'suitability' | 'sdm';
}

const DEFAULT_THUMBNAIL = '/modelpic.jpg';
const PRESERVE_CENTER: [number, number] = [-120.45, 34.55];

export const EXPERIENCE_CATEGORIES: ExperienceCategory[] = [
  { id: 'general', label: 'General', icon: Compass },
  { id: 'biodiversity', label: 'Biodiversity & Species Management', icon: TreePine },
  { id: 'water', label: 'Water', icon: Droplets },
  { id: 'fire', label: 'Fire', icon: Flame },
];

export const EXPERIENCES: ExperienceDefinition[] = [
  {
    id: 'suitability',
    name: 'Suitability Modeler',
    description:
      'Run a weighted raster overlay across catalog layers with custom ' +
      'reclassification rules to score habitat or siting suitability.',
    icon: Layers,
    categoryId: 'general',
    kind: 'model',
    usesRealTimeData: false,
    comingSoon: false,
    image: DEFAULT_THUMBNAIL,
    mapCenter: PRESERVE_CENTER,
    mapZoom: 13,
    panel: 'suitability',
  },
  {
    id: 'sdm',
    name: 'Species Distribution Model',
    description:
      'Fit a Random Forest distribution model from occurrence records and ' +
      'environmental predictors, including future climate scenarios.',
    icon: Sprout,
    categoryId: 'biodiversity',
    kind: 'model',
    usesRealTimeData: false,
    comingSoon: false,
    image: DEFAULT_THUMBNAIL,
    mapCenter: PRESERVE_CENTER,
    mapZoom: 10,
    panel: 'sdm',
  },
  {
    id: 'ice-plant-control',
    name: 'Ice Plant Control',
    description:
      'Model ice plant (Carpobrotus) invasion risk and prioritize removal ' +
      'areas based on spread dynamics and native habitat impact.',
    icon: Bug,
    categoryId: 'biodiversity',
    kind: 'simulation',
    usesRealTimeData: false,
    comingSoon: true,
    image: DEFAULT_THUMBNAIL,
    mapCenter: PRESERVE_CENTER,
    mapZoom: 10,
  },
  {
    id: 'water-budget',
    name: 'Water Budget',
    description:
      'Simulate watershed-scale water balance including precipitation, ' +
      'evapotranspiration, runoff, and groundwater recharge.',
    icon: Droplets,
    categoryId: 'water',
    kind: 'simulation',
    usesRealTimeData: true,
    comingSoon: true,
    image: DEFAULT_THUMBNAIL,
    mapCenter: PRESERVE_CENTER,
    mapZoom: 12,
  },
  {
    id: 'dam-removal',
    name: 'Dam Removal',
    description:
      'Model hydrological and ecological impacts of dam removal on stream ' +
      'connectivity and sediment transport.',
    icon: Droplets,
    categoryId: 'water',
    kind: 'simulation',
    usesRealTimeData: false,
    comingSoon: true,
    image: DEFAULT_THUMBNAIL,
    mapCenter: PRESERVE_CENTER,
    mapZoom: 13,
  },
  {
    id: 'flood',
    name: 'Flood Inundation',
    description:
      'Simulate flood inundation extent and depth under various ' +
      'precipitation scenarios and sea-level rise projections.',
    icon: Droplets,
    categoryId: 'water',
    kind: 'simulation',
    usesRealTimeData: true,
    comingSoon: true,
    image: DEFAULT_THUMBNAIL,
    mapCenter: PRESERVE_CENTER,
    mapZoom: 12,
  },
  {
    id: 'wildfire-spread',
    name: 'Wildfire Spread Simulation',
    description:
      'Simulate wildfire spread across the preserve using fuel models, ' +
      'topography, and weather conditions.',
    icon: Flame,
    categoryId: 'fire',
    kind: 'simulation',
    usesRealTimeData: true,
    comingSoon: true,
    image: DEFAULT_THUMBNAIL,
    mapCenter: PRESERVE_CENTER,
    mapZoom: 11,
  },
];

export function getExperienceById(id: string): ExperienceDefinition | null {
  return EXPERIENCES.find((experience) => experience.id === id) ?? null;
}

export function getExperiencesByCategory(categoryId: string): ExperienceDefinition[] {
  return EXPERIENCES.filter((experience) => experience.categoryId === categoryId);
}
