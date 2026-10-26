// ============================================================================
// Instructional copy for the Species Distribution Model experience: the
// left-hand wizard and the three analysis tabs on the right.
// ============================================================================

export const SDM_INTRO = {
  headline: 'Species Distribution Model',
  summary:
    'Estimate where a species could live by relating the places it has been '
    + 'recorded to the climate in those places. A random forest learns that '
    + 'pattern, then scores every 1 km cell for how suitable its climate is.',
  examples:
    'Use it to see where a species is likely to occur beyond where it has been '
    + 'seen, or how its suitable habitat may shift under a warmer, drier future.',
  dataOverview:
    'Species records come from GBIF occurrences in the Santa Barbara, Ventura '
    + 'and San Luis Obispo county area. Climate comes from eight CHELSA V2.1 '
    + 'bioclimatic variables (temperature and precipitation measures) at 1 km.',
  howItWorks: [
    'Pick a species. Its records are matched to the climate where each was seen and compared with random background locations.',
    'Pick one or more climate scenarios and time periods to map habitat onto.',
    'Choose whether to map a probability or a suitable / unsuitable answer.',
    'Run the model. It is fitted once, then applied to each climate you chose. Results are listed in the panel on the right, where you can also compare runs.',
  ],
} as const;

export const SDM_SPECIES_STEP = {
  title: 'Species',
  body:
    'Search by common or scientific name. Use the filters to narrow the list '
    + 'to a group of animals, plants or fungi, or to species with more records, '
    + 'since a model built from only a few records is less reliable.',
  occurrences:
    'The record count shows how many occurrences were found. Show plots them on '
    + 'the map so you can see where the model is learning from.',
} as const;

export const SDM_SCENARIO_STEP = {
  title: 'Climate scenario',
  body:
    'The model always learns from today’s climate (1981–2010). The scenario you '
    + 'pick here is where that learned pattern is applied. Choose Current climate '
    + 'to map today’s habitat, or a future scenario to see where suitable climate '
    + 'may move. The model is never trained on future climate.',
  multiple:
    'Tick as many as you like. The model is trained once and applied to each, '
    + 'so extra climates add little time and the results can be compared '
    + 'fairly.',
  scenarios:
    'The SSP scenarios describe how much greenhouse gas is emitted: SSP1-2.6 is '
    + 'low, SSP3-7.0 high and SSP5-8.5 very high. Each has three time periods.',
  preview:
    'Add any variable to the map to see the climate the model will use for this '
    + 'scenario. Add several, then use the Layers panel on the map to switch '
    + 'between them.',
} as const;

export const SDM_OUTPUT_STEP = {
  title: 'Output',
  body: 'Choose how the result is expressed. You can run the model again with the other choice.',
  probability:
    'Every cell gets a suitability score from 0 to 1. Keeps all the detail, '
    + 'which makes it the best choice for comparing runs. You pick the cutoff '
    + 'for “suitable” later.',
  binary:
    'Every cell is marked suitable (1) or unsuitable (0), using the cutoff the '
    + 'model chose as the best separator of records from background. Easier to '
    + 'read, but the detail is lost.',
  comparison:
    'To compare or combine runs later they must all use the same output type.',
  model:
    'The model is fitted once per species and kept for a few days. Running '
    + 'the same species again, with other climates or the other output type, '
    + 'reuses it instead of fitting again.',
} as const;

export const SDM_ANALYSIS_TABS = {
  summary: {
    label: 'Run summary',
    body:
      'Every finished model run is listed here. Pick one to put it on the map and '
      + 'see how well the model fit, how much of the region is suitable, and the '
      + 'same figures inside the Dangermond Preserve.',
  },
  compare: {
    label: 'Compare',
    body:
      'Compare two runs of the same output type, for example one species now and '
      + 'in 2071–2100. The map shows either how much suitability rose or fell, or '
      + 'which cells became suitable or stopped being suitable at a threshold you set.',
  },
  common: {
    label: 'Common areas',
    body:
      'Find where several runs agree, for example habitat that stays suitable in '
      + 'every scenario. The map shows how many of the chosen runs are suitable in '
      + 'each cell, and the results give the area suitable in all of them.',
  },
} as const;
