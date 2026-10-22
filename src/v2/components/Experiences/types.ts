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
  /** Mosaic item tag, e.g. bio13, when this raster is one variable in a stack. */
  mosaicTag?: string | null;
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

/** One input as it was configured when a suitability run was submitted. */
export interface SuitabilityRunInput {
  title: string;
  url: string;
  weight: number;
  type: LayerReclassConfig['type'];
  bins?: ReclassBin[];
  categories?: Record<string, number>;
  categoryLabels?: Record<string, string>;
  rescaleMin?: number;
  rescaleMax?: number;
  invert?: boolean;
}

/** Parameters to keep with a finished suitability raster. */
export interface SuitabilityRunRecord {
  name: string;
  extent: RasterScope;
  extentLabel: string;
  scaleMax: number;
  layers: SuitabilityRunInput[];
}

/** One suitability score (1..scale) and its share of the cells. */
export interface AnalysisScoreShare {
  score: number;
  count: number;
  percent: number | null;
}

/** One input layer's distribution inside one suitability band. */
export interface AnalysisBandInput {
  /** 1-based position among the submitted layers. */
  index: number;
  /** Service name, e.g. SBC_Soil_Drainage_Class_1000m. */
  name: string;
  weight: number;
  type: LayerReclassConfig['type'];
  /** Cells in the band where this input had a score. */
  cells: number;
  /** Share of the band's cells this input covered. */
  coverage_percent: number | null;
  mean_score: number | null;
  /** Share of the input's cells at each reclassified score. */
  score_distribution: AnalysisScoreShare[];
  /** Categorical inputs: most common pixel values. */
  values?: { value: number; count: number; percent: number | null }[];
  other?: { classes: number; count: number; percent: number | null };
  /** Continuous and rescale inputs: raw pixel value summary and histogram. */
  value_stats?: {
    min: number | null;
    max: number | null;
    mean: number | null;
    median: number | null;
    p10: number | null;
    p90: number | null;
  };
  value_histogram?: {
    bin_edges: (number | null)[];
    counts: number[];
    percent: (number | null)[];
  };
}

/** Cells whose final suitability falls in [min, max) (max included in the last band). */
export interface AnalysisBand {
  label: string;
  min: number;
  max: number;
  max_inclusive: boolean;
  cells: number;
  percent: number | null;
  area_km2: number | null;
  mean_score?: number | null;
  inputs: AnalysisBandInput[];
}

/**
 * Written by the Weighted Raster Overlay tool as its "Run Analysis (JSON)"
 * output (parameter run_analysis in suitability_modeler.pyt).
 */
export interface SuitabilityRunAnalysis {
  type: 'suitability_run_analysis';
  run: string;
  scale_max: number;
  cell_size: number | null;
  cells: { total: number; scored: number; nodata: number };
  area_km2: { cell: number | null; scored: number | null };
  stats: {
    min: number | null;
    max: number | null;
    mean: number | null;
    median: number | null;
    std: number | null;
  };
  histogram: {
    bin_edges: (number | null)[];
    counts: number[];
    percent: (number | null)[];
    area_km2: (number | null)[];
  };
  classes: (AnalysisScoreShare & { area_km2: number | null })[];
  layers: {
    index: number;
    name: string;
    weight: number;
    type: LayerReclassConfig['type'];
    weight_share: number | null;
  }[];
  bands: AnalysisBand[];
}

/** Output Type choices of the SDM Random Forest tool. */
export type SdmOutputType = 'Probability' | 'Binary';

export interface ResultLayerInfo {
  jobId: string;
  mapServerUrl: string;
  groupTitle: string;
  title: string;
  summary?: string;
  /** Present for suitability runs. SDM results do not carry this snapshot. */
  record?: SuitabilityRunRecord | null;
  /** SDM runs only. Decides which legend the colored display raster gets. */
  outputType?: SdmOutputType | null;
  /** Distribution analysis from the tool. Absent on jobs from before it existed. */
  analysis?: SuitabilityRunAnalysis | null;
  /** Rendered map image. This is a PNG even when a TIFF was requested. */
  pngUrl?: string | null;
  /** GeoTIFF copied into the public output directory. Absent on older jobs. */
  tifUrl?: string | null;
}

/** One finished geoprocessing job kept beside the map. */
export interface CompletedRun {
  jobId: string;
  mapServerUrl: string;
  title: string;
  summary: string;
  record: SuitabilityRunRecord | null;
  /** SDM runs only. */
  outputType?: SdmOutputType | null;
  analysis: SuitabilityRunAnalysis | null;
  visible: boolean;
  /** Marked as an input for a later comparison. No analysis runs from this yet. */
  selected: boolean;
  pngUrl: string | null;
  tifUrl: string | null;
  addedAt: number;
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
  datasetId?: number | null;
  mosaicTag?: string | null;
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
