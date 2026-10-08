// ============================================================================
// Instructional copy + fixed extent/resolution options for Suitability wizard.
// ============================================================================

import type { RasterScope } from '../types';

export const SUITABILITY_INTRO = {
  headline: 'Suitability Modeler',
  summary:
    'Score how well places meet a set of criteria by combining environmental '
    + 'rasters into one weighted suitability surface. Use it when you need a '
    + 'transparent, map-based ranking rather than a black-box prediction.',
  useCases: [
    {
      title: 'Habitat or restoration siting',
      detail:
        'Combine slope, soils, land cover, and climate layers to highlight areas '
        + 'that match a species’ or project’s requirements.',
    },
    {
      title: 'Infrastructure or access planning',
      detail:
        'Trade off terrain, hydrology, and land-cover constraints to shortlist '
        + 'feasible corridors or facility locations.',
    },
    {
      title: 'Scenario comparison',
      detail:
        'Change weights or reclass rules and re-run to see how priorities shift '
        + 'across the preserve, county, or tri-county extent.',
    },
  ],
  dataOverview:
    'Analysis layers come from the Digital Twin raster catalog: elevation and '
    + 'terrain derivatives, soils (SSURGO), land cover, species-richness surfaces, '
    + 'and CHELSA bioclimate stacks. Each product is templated for one or more '
    + 'extents and cell sizes — not every layer exists everywhere at every '
    + 'resolution.',
  howItWorks: [
    'Choose an analysis extent and a shared grid resolution.',
    'Select the raster layers that represent your criteria.',
    'Set a suitability scale, weights, and reclassification rules per layer.',
    'Run a weighted overlay: each cell becomes Σ(weight × score) / Σ(weights).',
  ],
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
