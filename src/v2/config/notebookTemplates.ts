// ============================================================================
// Notebook template metadata for the Notebooks gallery.
// Ported from the twin_models webapp mockup (notebooks/templates.js); the cell
// contents and the Pyodide runtime arrive in a later phase.
// ============================================================================

export interface NotebookTemplateSummary {
  id: string;
  title: string;
  description: string;
  tags: string[];
}

export const NOTEBOOK_TEMPLATES: NotebookTemplateSummary[] = [
  {
    id: 'suitability-custom',
    title: 'Custom Suitability Analysis',
    description:
      'Run a weighted raster overlay with custom reclassification rules using ' +
      'datasets from the Dangermond Preserve data catalog.',
    tags: ['suitability', 'raster', 'geoprocessing'],
  },
  {
    id: 'sdm-workflow',
    title: 'Species Distribution Modeling',
    description:
      'End-to-end SDM workflow: query GBIF occurrences, fetch environmental ' +
      'predictors, and run a Random Forest model.',
    tags: ['sdm', 'random forest', 'species', 'GBIF'],
  },
  {
    id: 'catalog-api',
    title: 'Working with the Data Catalog API',
    description:
      'Programmatic access to catalog datasets: querying metadata, fetching ' +
      'raster info, and discovering available layers.',
    tags: ['API', 'catalog', 'metadata', 'python'],
  },
  {
    id: 'raster-analysis',
    title: 'Raster Extraction & Analysis',
    description:
      'Buffer point locations and extract raster values from imagery layers in ' +
      'the catalog for custom analysis.',
    tags: ['raster', 'extraction', 'buffer', 'analysis'],
  },
  {
    id: 'change-detection',
    title: 'Land Cover Change Detection',
    description:
      'Compare multi-date NLCD layers to detect land cover transitions and ' +
      'generate change statistics.',
    tags: ['NLCD', 'land cover', 'temporal', 'change'],
  },
];
