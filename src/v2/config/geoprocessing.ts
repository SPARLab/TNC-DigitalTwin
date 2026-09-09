// ============================================================================
// Geoprocessing endpoints used by the Experiences workspace.
// Ported from twin_models/webapp/src/config/endpoints.js.
// ============================================================================

export const ARCGIS_SERVER_URL = 'https://dangermondpreserve-spatial.com/server';

export const GP_SERVICES = {
  sdmRandomForest: {
    url: `${ARCGIS_SERVER_URL}/rest/services/SDMRandomForest/GPServer`,
    task: 'SDM Random Forest',
    mapServer: `${ARCGIS_SERVER_URL}/rest/services/SDMRandomForest/MapServer`,
    jobsDirectory: `${ARCGIS_SERVER_URL}/rest/directories/arcgisjobs/sdmrandomforest_gpserver`,
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

export const PREDICTOR_STACKS = [
  {
    id: 'current',
    label: 'Current (1980–2010)',
    url: 'https://dangermondpreserve-spatial.com/image/rest/services/Hosted/full_env_1980_2010_stack/ImageServer',
  },
  {
    id: 'ssp126',
    label: 'SSP1-2.6 (2040–2070)',
    url: 'https://dangermondpreserve-spatial.com/image/rest/services/Hosted/sdmfinal_env_ssp126_2040_2070_stack/ImageServer',
  },
  {
    id: 'ssp370',
    label: 'SSP3-7.0 (2040–2070)',
    url: 'https://dangermondpreserve-spatial.com/image/rest/services/Hosted/sdmfinal_env_ssp370_2040_2070_stack/ImageServer',
  },
  {
    id: 'ssp585',
    label: 'SSP5-8.5 (2040–2070)',
    url: 'https://dangermondpreserve-spatial.com/image/rest/services/Hosted/sdmfinal_env_ssp585_2040_2070_stack/ImageServer',
  },
] as const;

export const DEFAULT_SDM_INPUTS = {
  occurrences:
    'https://ca-gbif-featureserv.delightfulmeadow-1b7f96ac.westus2.azurecontainerapps.io/collections/gbif.tricounty_occurrences_arcgis_view',
  backgroundPoints:
    'https://dangermondpreserve-spatial.com/server/rest/services/Hosted/sampled_background_points/FeatureServer/0',
};

/** Stored by the twin_models mockup login. Used until v2 sign-in exists. */
export const STORED_TOKEN_KEY = 'dev_token';
