// ============================================================================
// Instructional copy + fixed extent/resolution options for Suitability wizard.
// ============================================================================

import type { RasterScope } from '../types';

export const SUITABILITY_INTRO = {
  headline: 'Suitability Modeler',
  summary:
    'Want to find the suitable areas for conservation management, research or '
    + 'restoration? Map suitable areas using environmental layers from our data '
    + 'catalog to answer the questions you have. Each layer is scored and '
    + 'blended into one map that rates every spot from least to most suitable.',
  examplesLead: 'It can help answer questions like:',
  examples: [
    'Where is the best place to put field instruments or focus invasive species removal?',
    'Where are flooding or fire most likely to occur?',
    'How might the landscape change, such as habitat connectivity or where a species lives?',
  ],
  dataLink: 'What data can you use?',
  howItWorks: [
    'Choose an analysis extent and a shared grid resolution.',
    'Select the raster layers that represent your criteria.',
    'Set a suitability scale, weights, and reclassification rules per layer.',
    'Run a weighted overlay: each cell becomes Σ(weight × score) / Σ(weights).',
  ],
} as const;

/**
 * The layers a run can use, shown in a pop-up rather than on the intro. The
 * extents and cell sizes in it are read from EXTENT_GUIDE, so they follow the
 * published grids.
 */
export const SUITABILITY_DATA_EXPLAINER = {
  title: 'What data can you use?',
  intro:
    'Layers come from the raster datasets in our data catalog. Pick an area '
    + 'and a cell size, and the layers made for that grid can be combined.',
  categoriesTitle: 'Data categories',
  categoriesBody: 'The catalog covers broad groups of data, and more are added over time.',
  categories: ['Terrain', 'Soils', 'Land cover', 'Climate', 'Biodiversity'],
  extentsTitle: 'Areas and cell sizes',
  extentsBody:
    'Each layer is prepared for one or more areas, and for each area at one '
    + 'or more cell sizes. The cell size is how big one square of the map is: '
    + 'smaller cells show more local detail, larger cells run faster.',
  extentsNote:
    'You choose one area and one cell size for the whole run. A layer is used '
    + 'at that cell size, and a layer made for a larger area is cut down to '
    + 'fit. A layer made only for a smaller area can\u2019t be stretched, so '
    + 'it is greyed out in the list.',
} as const;

/**
 * Detailed description of the weighted overlay, shown from the "?" beside step
 * four. Mirrors twin_models/suitability/suitability_modeler.pyt: keep the two in
 * step if the tool's scoring or NoData handling changes.
 */
export const WEIGHTED_OVERLAY_EXPLAINER = {
  title: 'How the weighted overlay works',
  intro:
    'The weighted overlay turns your input layers into one suitability score per '
    + 'map cell, on the 1 to N scale you choose, where a higher score means more '
    + 'suitable.',
  steps: [
    {
      title: 'Clip to the analysis extent',
      body:
        'Every input is cut to the extent you chose (preserve, Santa Barbara County, '
        + 'or tri-county) without resampling. All inputs must share the same grid, '
        + 'which is why you pick one resolution up front.',
    },
    {
      title: 'Score each layer',
      body:
        'Each layer is converted to scores from 1 to N using the rule you set for it. '
        + 'Cells a rule does not cover get no score from that layer.',
      rules: [
        {
          name: 'Categorical',
          body: 'Each pixel value (for example a land-cover class) gets the score you assigned. Values you did not list get no score.',
        },
        {
          name: 'Continuous',
          body: 'Value ranges each get a score. A range includes its lower bound but not its upper bound, except the top of the highest range, which is included. Values outside every range get no score.',
        },
        {
          name: 'Rescale',
          body: 'Values between a minimum and maximum are stretched evenly onto 1 to N, and values beyond them are held at the ends. Invert flips it, so high values score low.',
        },
      ],
    },
    {
      title: 'Weight and combine',
      body:
        'Each cell’s suitability is the weighted average of its layer scores: '
        + 'Σ(weight × score) ÷ Σ(weights). Because it is an average, the result stays '
        + 'on the same 1 to N scale, and only the ratio between weights matters '
        + '(weights of 3 and 1 behave like 75% and 25%).',
    },
    {
      title: 'Handle missing data',
      body:
        'Only layers that have a score in a cell are counted there. A cell missing '
        + 'one layer is averaged over the remaining layers rather than blanked out, '
        + 'so a sparse layer does not erase the map. A cell with no scores at all is '
        + 'NoData. A layer with weight 0, or with no scores anywhere, is left out.',
    },
    {
      title: 'Output',
      body:
        'The result is a raster of scores from 1 to N, drawn from low to high '
        + 'suitability. The run also records how the scores are distributed, and for '
        + 'each band (1–2, 2–3, and so on) what the input layers looked like, which '
        + 'you can see in the analysis after a run.',
    },
  ],
  example: {
    title: 'Example',
    body:
      'Slope (weight 3) scores 5 in a cell and soil drainage (weight 1) scores 1. '
      + 'The cell’s suitability is (3 × 5 + 1 × 1) ÷ (3 + 1) = 4.0. If drainage had no '
      + 'data there, only slope would count and the cell would score 5.0.',
  },
} as const;

/** Published analysis grids per extent (meters). 1000 displays as 1km. */
export const SCOPE_RESOLUTIONS_M: Record<RasterScope, readonly number[]> = {
  preserve: [2, 10, 30, 100, 500, 1000],
  sbcounty: [100, 500, 1000],
  tricounty: [100, 500, 1000],
};

export function formatResolutionLabel(meters: number): string {
  if (meters >= 1000 && meters % 1000 === 0) {
    return `${meters / 1000}km`;
  }
  return `${meters}m`;
}

export function resolutionsForScope(scope: RasterScope): number[] {
  return [...SCOPE_RESOLUTIONS_M[scope]];
}

export function defaultResolutionForScope(scope: RasterScope): number {
  const available = SCOPE_RESOLUTIONS_M[scope];
  if (available.includes(30)) return 30;
  if (available.includes(100)) return 100;
  return available[0];
}

/** Keep the current cell size when the new mask publishes it. */
export function resolutionForScopeChange(
  current: number | null,
  nextScope: RasterScope,
): number {
  const available = SCOPE_RESOLUTIONS_M[nextScope];
  if (current != null && available.includes(current)) return current;
  return defaultResolutionForScope(nextScope);
}

export const EXTENT_GUIDE: Record<
  RasterScope,
  { label: string; resolutionsLabel: string }
> = {
  preserve: {
    label: 'Dangermond Preserve',
    resolutionsLabel: SCOPE_RESOLUTIONS_M.preserve
      .map(formatResolutionLabel)
      .join(', '),
  },
  sbcounty: {
    label: 'Santa Barbara County',
    resolutionsLabel: SCOPE_RESOLUTIONS_M.sbcounty
      .map(formatResolutionLabel)
      .join(', '),
  },
  tricounty: {
    label: 'Tri-County',
    resolutionsLabel: SCOPE_RESOLUTIONS_M.tricounty
      .map(formatResolutionLabel)
      .join(', '),
  },
};

export const RESOLUTION_GUIDE = {
  title: 'Grid resolution',
  body:
    'Resolution is the cell size of the analysis grid. Finer cells (smaller '
    + 'meters) capture more local detail but produce larger rasters and longer '
    + 'jobs. Coarser cells are faster and better matched to regional climate data. '
    + 'Not every dataset is templated at every resolution — incompatible layers '
    + 'in the catalog below are greyed out for your current pick.',
} as const;

export const CONFIGURE_GUIDE = {
  scale: {
    title: 'Suitability scale',
    body:
      'The scale sets the range of output scores (for example 1–5 or 1–10). '
      + 'Every reclass bin or category maps into this scale. Higher numbers mean '
      + '“more suitable” for your question — define what that means in your bins.',
  },
  weight: {
    title: 'Layer weights',
    body:
      'Weights control relative importance. A layer with weight 6 contributes '
      + 'twice as much as one with weight 3. The overlay divides by the sum of '
      + 'weights, so absolute numbers matter less than their ratios.',
  },
  reclass: {
    title: 'Reclassification',
    body:
      'Raw raster values rarely sit on your suitability scale. Reclass maps them:',
    modes: [
      {
        name: 'Continuous bins',
        detail:
          'Split numeric ranges (e.g. slope 0–5°, 5–15°, 15°+) and assign each '
          + 'bin a suitability score.',
      },
      {
        name: 'Categorical',
        detail:
          'Map discrete classes (land-cover codes, soil groups) to scores. Unscored '
          + 'classes contribute 0.',
      },
      {
        name: 'Rescale',
        detail:
          'Stretch a numeric min–max linearly onto the suitability scale. Optionally '
          + 'invert when lower raw values are more suitable (e.g. distance).',
      },
    ],
  },
  formula:
    'Final cell value = Σ(weightᵢ × scoreᵢ) / Σ(weightᵢ). Cells missing a layer '
    + 'follow the geoprocessing service’s NoData rules for that job.',
} as const;
