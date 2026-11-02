// ============================================================================
// Shared types for experience geoprocessing panels and the workspace map.
// ============================================================================

import type { GpMapExtent } from '../../services/geoprocessingService';

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

/** What an SDM job produced: a model run, a two-run comparison, or common areas. */
export type SdmRunKind = 'model' | 'comparison' | 'common';

/** Which colored raster of a comparison is drawn on the map. */
export type SdmComparisonView = 'difference' | 'threshold-change';

// ---- JSON written by the SDM tools (sdm_rf_tool.pyt) ----------------------

export interface SdmHistogram {
  bin_edges: (number | null)[];
  counts: number[];
  percent: (number | null)[];
  area_km2: (number | null)[];
}

export interface SdmSuitableArea {
  /** Probability runs: the cutoff the area is counted at. */
  threshold?: number | null;
  cells: number;
  percent: number | null;
  area_km2: number | null;
}

/** Figures for one region: the whole grid, or the Preserve alone. */
export interface SdmRegionSummary {
  stats?: {
    min: number | null;
    max: number | null;
    mean: number | null;
    median: number | null;
    std: number | null;
    percentiles: Record<'p5' | 'p25' | 'p50' | 'p75' | 'p95', number | null>;
  };
  histogram?: SdmHistogram;
  suitable?: SdmSuitableArea;
  unsuitable?: SdmSuitableArea;
}

/**
 * Written by SDM Random Forest as its "summary_json" output. Binary runs carry
 * suitable and unsuitable area; probability runs carry stats and a histogram.
 */
export interface SdmSummary extends SdmRegionSummary {
  type: 'sdm_summary';
  run: string;
  output_type: SdmOutputType;
  cell_size: number | null;
  cells: { total: number; mapped: number; nodata: number };
  area_km2: { cell: number | null; mapped: number | null };
  model?: {
    /** The saved model this run was predicted from. Runs sharing it share one fit. */
    model_id?: string | null;
    species: string;
    auc: number | null;
    /** The cutoff the model chose (Youden's J). Binary output uses it. */
    optimal_threshold: number | null;
    presence_cells: number;
    background_points: number;
    records_found: number;
    trained_on?: string | null;
    projected_onto?: string | null;
  };
  /** Absent or null when no Preserve boundary was given or the cells did not overlap. */
  preserve?:
    | (SdmRegionSummary & {
        note?: string;
        cells: { in_preserve: number; mapped: number; nodata: number };
        area_km2: { cell: number | null; mapped: number | null };
      })
    | null;
}

export interface SdmChangeCounts {
  cells: number;
  percent: number | null;
  area_km2: number | null;
  mean_change?: number | null;
}

export interface SdmChange {
  min_change: number | null;
  increased: SdmChangeCounts;
  decreased: SdmChangeCounts;
  unchanged: SdmChangeCounts;
  net_area_km2: number | null;
}

/** 0 stayed unsuitable, 1 lost, 2 gained, 3 stayed suitable. */
export interface SdmTransitionClass {
  value: number;
  label: string;
  color: number[];
  count: number;
  percent: number | null;
  area_km2: number | null;
}

export interface SdmSuitableCells {
  a: number;
  b: number;
  both: number;
  lost: number;
  gained: number;
  area_km2_a: number | null;
  area_km2_b: number | null;
  area_km2_both: number | null;
  area_km2_lost: number | null;
  area_km2_gained: number | null;
  net_area_km2: number | null;
  percent_of_a_lost: number | null;
  percent_of_b_gained: number | null;
}

export interface SdmAgreement {
  jaccard: number | null;
  percent_agreement: number | null;
  mean_value_a?: number | null;
  mean_value_b?: number | null;
  mean_difference?: number | null;
  mean_abs_difference?: number | null;
  value_correlation?: number | null;
}

export interface SdmComparisonRegion {
  change: SdmChange;
  classes: SdmTransitionClass[];
  suitable_cells: SdmSuitableCells;
  agreement: SdmAgreement;
}

/** Written by Compare SDM Runs as its "summary_json" output. */
export interface SdmComparison extends SdmComparisonRegion {
  type: 'sdm_comparison';
  output_type: SdmOutputType;
  run_a: string;
  run_b: string;
  threshold: { value: number | null; applies_to: string };
  cell_size: number | null;
  cells: { compared: number; mapped_in_a_only: number; mapped_in_b_only: number };
  area_km2: { cell: number | null };
  difference: {
    min: number | null;
    max: number | null;
    mean: number | null;
    std: number | null;
    /** The difference display raster spans -limit to +limit. */
    display_limit: number | null;
    histogram: SdmHistogram;
  };
  preserve?: (SdmComparisonRegion & { note?: string; cells: { compared: number } }) | null;
}

export interface SdmCountClass {
  runs_suitable: number;
  label: string;
  color: number[];
  cells: number;
  percent: number | null;
  area_km2: number | null;
}

export interface SdmCommonRunFigures {
  run: string;
  threshold: number | null;
  suitable_cells: number;
  suitable_area_km2: number | null;
  percent_also_suitable_in_all: number | null;
}

/** Written by Find Common Suitable Areas as its "summary_json" output. */
export interface SdmCommonAreas {
  type: 'sdm_common_suitability';
  output_type: SdmOutputType;
  runs: SdmCommonRunFigures[];
  run_count: number;
  cell_size: number | null;
  cells: { mapped_in_all_runs: number; mapped_total: number[] };
  area_km2: { cell: number | null; mapped_in_all_runs: number | null };
  common: { cells: number; percent_of_mapped: number | null; area_km2: number | null };
  any: { cells: number; area_km2: number | null; jaccard_all: number | null };
  by_count: SdmCountClass[];
  pairs: {
    run_a: string;
    run_b: string;
    both_cells: number;
    area_km2_both: number | null;
    jaccard: number | null;
  }[];
  preserve?: {
    note?: string;
    cells: { mapped_in_all_runs: number };
    common: { cells: number; percent_of_mapped: number | null; area_km2: number | null };
    by_count: SdmCountClass[];
    runs: { run: string; suitable_cells: number; suitable_area_km2: number | null }[];
  } | null;
}

/** A file offered for download beside a finished run. */
export interface RunDownload {
  label: string;
  url: string;
}

/** The runs a comparison or common-areas result was made from. */
export interface SdmInputRun {
  jobId: string;
  title: string;
  /** The species' display label, such as "Bobcat (Lynx rufus)". */
  species?: string;
  /** The species' scientific name. */
  speciesKey?: string;
  /** Climate scenario and period label. */
  scenario?: string;
}

/** SDM details shared by a submitted job and the run kept after it finishes. */
export interface SdmRunDetails {
  /** What the job produced. Runs saved before this existed are model runs. */
  kind?: SdmRunKind;
  /**
   * The species' display label, such as "Bobcat (Lynx rufus)". Set on model
   * runs, and on comparisons and common areas whose runs share one species.
   */
  species?: string;
  /** The species' scientific name, which groups its runs and layers together. */
  speciesKey?: string;
  /** Climate scenario and period label. A comparison's reads "A → B". */
  scenario?: string;
  /** From the model run's summary. Absent on older jobs. */
  sdmSummary?: SdmSummary | null;
  comparison?: SdmComparison | null;
  common?: SdmCommonAreas | null;
  /** Comparison and common-areas results: the runs that went in. */
  inputRuns?: SdmInputRun[];
  /** Every GeoTIFF the job published, with a plain label. */
  downloads?: RunDownload[];
  /** Where the job's output sits, so the map image can be exported again on demand. */
  mapExtent?: GpMapExtent | null;
}

export interface ResultLayerInfo extends SdmRunDetails {
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
export interface CompletedRun extends SdmRunDetails {
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
  /** Comparisons only: which colored raster the map shows. */
  view?: SdmComparisonView;
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
  /**
   * `release` means the species was let go in the picker. The workspace turns it
   * into `hide` when the species has runs, so its records stay in the layer
   * list, and into `remove` when it has none.
   */
  action: 'add' | 'remove' | 'hide' | 'release';
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
