// ============================================================================
// Instructional copy for the Species Distribution Model experience: the
// left-hand wizard and the three analysis tabs on the right.
// ============================================================================

export const SDM_INTRO = {
  headline: 'Where will species be in the future?',
  summary:
    'Choose a terrestrial species and see where it may be found across Santa Barbara, '
    + 'San Luis Obispo and Ventura Counties as the climate changes.',
  howItWorks: [
    'Pick a terrestrial species.',
    'Pick one or more climates: today, or a future scenario.',
    'Choose a map of how likely the species is to live in each place, or a simple suitable / unsuitable map.',
    'Run it. The maps appear on the map and in the panel on the right, where you can also compare them.',
  ],
  learnMore: 'How does this model work?',
} as const;

/** The longer explanation, shown in a pop-up rather than on the intro. */
export const SDM_EXPLAINER = {
  title: 'How the species model works',
  intro:
    'This is a species distribution model for terrestrial (land) species, mapped '
    + 'across Santa Barbara, San Luis Obispo and Ventura Counties. It finds the '
    + 'climate a species has been seen in, then looks for places with a similar '
    + 'climate.',
  sections: [
    {
      title: 'What it estimates',
      body:
        'For every 1 km cell it gives a score for how suitable the climate is '
        + 'for the species. A random forest learns the pattern by comparing the '
        + 'climate where the species has been recorded with the climate at '
        + 'random places. Use it to see where a species could occur beyond where '
        + 'it has been seen, or how its suitable area may shift in a warmer, '
        + 'drier future.',
    },
    {
      title: 'Where the data comes from',
      body:
        'Species records come from GBIF occurrences in Santa Barbara, San Luis '
        + 'Obispo and Ventura Counties, and the map covers the same three '
        + 'counties. Climate comes from eight '
        + 'CHELSA V2.1 bioclimatic variables (temperature and precipitation '
        + 'measures) at 1 km.',
    },
    {
      title: 'How future climates are handled',
      body:
        'The model only learns from today’s climate (1981–2010). A future '
        + 'scenario is never used for learning: the same model is applied to it, '
        + 'so the map shows where the climate the species lives in today could '
        + 'be found later. A model is fitted once per species and reused for '
        + 'each climate you choose.',
    },
    {
      title: 'Reading the result',
      body:
        'Probability maps give every cell a score from 0 to 1, which keeps all '
        + 'the detail. Binary maps mark each cell suitable or unsuitable using '
        + 'the cutoff the model chose as the best separator of records from '
        + 'random places, which is easier to read but loses detail. The summary '
        + 'on the right also reports the same figures inside the Dangermond '
        + 'Preserve.',
    },
    {
      title: 'Things to keep in mind',
      body:
        'The model is built for land species, so open water is left out of '
        + 'the records, the training and the map. The map covers the land of '
        + 'Santa Barbara, San Luis Obispo and Ventura Counties only, and a '
        + 'cell on the shore is kept if any of it is land. Within the land it '
        + 'uses climate '
        + 'only. It does not know about vegetation, barriers or other '
        + 'species, so a suitable cell is a place the species could live, not '
        + 'a place it does. Species with few records '
        + 'give less reliable results, and 1 km cells are coarse for small '
        + 'areas.',
    },
  ],
} as const;

export const SDM_SPECIES_STEP = {
  title: 'Species',
  body:
    'Search for a terrestrial species recorded in Santa Barbara, San Luis Obispo '
    + 'or Ventura County by common or scientific name. Use the '
    + 'filters to narrow the list to a group of animals, plants or fungi. Fish and '
    + 'marine mammals are not listed, and neither are species with too few '
    + 'records to model. A model built from only a few records is less reliable.',
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
