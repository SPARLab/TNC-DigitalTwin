// ============================================================================
// GBIF endpoints — the "Tricounty Species Occurrences" query-layer service.
// Live views over the database; Data-Pipeline/publishing/registered_services/gbif.json
// defines what it publishes. Layer ids come from the map the publisher builds, so
// re-check them (…/FeatureServer?f=json) if the service is republished.
// ============================================================================

export const GBIF_FEATURE_SERVER_URL =
  'https://dangermondpreserve-spatial.com/server/rest/services/Tricounty_Species_Occurrences/FeatureServer';

/** Point layer: GBIF records in and around the Dangermond Preserve (used by the map). */
export const GBIF_PRESERVE_LAYER_URL = `${GBIF_FEATURE_SERVER_URL}/1`;

/** Non-spatial table: one row per species with its common name, kingdom and class. */
export const GBIF_SPECIES_NAMES_URL = `${GBIF_FEATURE_SERVER_URL}/2`;
