// ============================================================================
// Geoprocessing endpoints used by the Experiences workspace.
// Ported from twin_models/webapp/src/config/endpoints.js.
// ============================================================================

export const ARCGIS_SERVER_URL = 'https://dangermondpreserve-spatial.com/server';

export const GP_SERVICES = {
  sdmRandomForest: {
    url: `${ARCGIS_SERVER_URL}/rest/services/SDM_Random_Forest/GPServer`,
    task: 'SDM Random Forest',
    mapServer: `${ARCGIS_SERVER_URL}/rest/services/SDM_Random_Forest/MapServer`,
    jobsDirectory: `${ARCGIS_SERVER_URL}/rest/directories/arcgisjobs/sdm_random_forest_gpserver`,
  },
  suitabilityModeler: {
    url: `${ARCGIS_SERVER_URL}/rest/services/Weighted_Raster_Overlay/GPServer`,
    task: 'Weighted Raster Overlay',
    mapServer: `${ARCGIS_SERVER_URL}/rest/services/Weighted_Raster_Overlay/MapServer`,
    jobsDirectory: `${ARCGIS_SERVER_URL}/rest/directories/arcgisjobs/weightedrasteroverlay_gpserver`,
  },
} as const;

export const DATASETS_TABLE_URL =
  `${ARCGIS_SERVER_URL}/rest/services/Dangermond_Preserve_Data_Catalog/FeatureServer/1`;

export const RASTERS_TABLE_URL =
  `${ARCGIS_SERVER_URL}/rest/services/Dangermond_Preserve_Data_Catalog/FeatureServer/4`;

const CHELSA_MOSAIC_BASE =
  'https://dangermondpreserve-spatial.com/image/rest/services/Hosted';

/**
 * CHELSA bioclimatic mosaics, one ImageServer per climate scenario and time
 * period (Data-Pipeline publish_chelsa_mosaics.py). The SDM GP tool pulls its
 * fixed set of variables (SDM_PREDICTOR_VARIABLES) from the mosaic selected
 * here. The user picks a scenario first, then one of its periods.
 */
export const CLIMATE_SCENARIOS = [
  {
    id: 'current',
    label: 'Current climate',
    hint: 'Observed climate normals.',
    mosaicTag: 'baseline',
    periods: ['1981–2010'],
  },
  {
    id: 'ssp126',
    label: 'SSP1-2.6 (low emissions)',
    hint: 'Projected climate under SSP1-2.6.',
    mosaicTag: 'ssp126',
    periods: ['2011–2040', '2041–2070', '2071–2100'],
  },
  {
    id: 'ssp370',
    label: 'SSP3-7.0 (high emissions)',
    hint: 'Projected climate under SSP3-7.0.',
    mosaicTag: 'ssp370',
    periods: ['2011–2040', '2041–2070', '2071–2100'],
  },
  {
    id: 'ssp585',
    label: 'SSP5-8.5 (very high emissions)',
    hint: 'Projected climate under SSP5-8.5.',
    mosaicTag: 'ssp585',
    periods: ['2011–2040', '2041–2070', '2071–2100'],
  },
] as const;

export type ClimateScenarioId = (typeof CLIMATE_SCENARIOS)[number]['id'];

/** ImageServer URL of the mosaic for a scenario and period (e.g. "2041–2070"). */
export function climateMosaicUrl(
  scenario: (typeof CLIMATE_SCENARIOS)[number],
  period: string,
): string {
  const years = period.replace('–', '_');
  return `${CHELSA_MOSAIC_BASE}/CHELSA_${scenario.mosaicTag}_${years}/ImageServer`;
}

/**
 * Predictor variables the SDM uses. Fixed by the model developers and mirrored
 * by PREDICTOR_TAGS in twin_models/sdms/scripts/arcgis/sdm_rf_tool.pyt.
 */
export const SDM_PREDICTOR_VARIABLES = [
  { tag: 'bio01', label: 'Mean Annual Air Temperature', units: '°C' },
  { tag: 'bio03', label: 'Isothermality', units: '' },
  { tag: 'bio05', label: 'Max Air Temperature of Warmest Month', units: '°C' },
  { tag: 'bio06', label: 'Min Air Temperature of Coldest Month', units: '°C' },
  { tag: 'bio14', label: 'Precipitation of Driest Month', units: 'mm' },
  { tag: 'bio15', label: 'Precipitation Seasonality', units: 'CV' },
  { tag: 'bio16', label: 'Precipitation of Wettest Quarter', units: 'mm' },
  { tag: 'bio18', label: 'Precipitation of Warmest Quarter', units: 'mm' },
] as const;

export const DEFAULT_SDM_INPUTS = {
  occurrences:
    'https://ca-gbif-featureserv.delightfulmeadow-1b7f96ac.westus2.azurecontainerapps.io/collections/gbif.tricounty_occurrences_arcgis_view',
  backgroundPoints:
    'https://dangermondpreserve-spatial.com/server/rest/services/Hosted/sampled_background_points/FeatureServer/0',
};

/** Stored by the twin_models mockup login. Used until v2 sign-in exists. */
export const STORED_TOKEN_KEY = 'dev_token';
