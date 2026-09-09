// ============================================================================
// Shared types for experience geoprocessing panels and the workspace map.
// ============================================================================

export type RasterScope = 'preserve' | 'sbcounty' | 'tricounty';

export const RASTER_SCOPE_OPTIONS: { value: RasterScope; label: string }[] = [
  { value: 'preserve', label: 'Preserve' },
  { value: 'sbcounty', label: 'Santa Barbara County' },
  { value: 'tricounty', label: 'TriCounty' },
];

export interface CatalogRaster {
  id: number;
  title: string;
  url: string;
  resolution: number | null;
  /** Coverage of the raster: preserve, Santa Barbara County, or tri-county. */
  scope: RasterScope | null;
  /** Original catalog dataset id, used to match pinned Data Catalog layers. */
  datasetId: number | null;
  thematicCategory: string;
  units: string;
  valueMin: number | null;
  valueMax: number | null;
}

export interface ReclassBin {
  min: number;
  max: number;
  score: number;
}

export interface LayerReclassConfig {
  weight: number;
  type: 'continuous' | 'categorical' | 'rescale';
  bins: ReclassBin[];
  categories: Record<string, number>;
  categoryLabels: Record<string, string>;
  rescaleMin: number;
  rescaleMax: number;
  invert: boolean;
}

export interface ResultLayerInfo {
  jobId: string;
  mapServerUrl: string;
  groupTitle: string;
  title: string;
}

export interface OccurrenceFeature {
  geometry?: { coordinates?: [number, number] };
  properties?: {
    species?: string;
    eventdate?: string;
    basisofrecord?: string;
    occurrence_status?: string;
    taxonomic_class?: string;
  };
}

export interface PointsAction {
  action: 'add' | 'remove';
  species: string;
  features?: OccurrenceFeature[];
}

export interface PreviewAction {
  action: 'add' | 'remove';
  rasterId: number;
  url?: string;
  title?: string;
}

export interface GpJobRecord {
  id: string;
  status: string;
  summary: string;
  scenario?: string;
  defaultFilename: string;
  jobsDirectory: string;
  filenamePattern: 'saved-to' | 'raster-written';
  result: ResultLayerInfo;
}

export interface GpMessage {
  type?: string;
  description?: string;
}
