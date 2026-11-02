// ============================================================================
// Species names — search the "Species Common Names" table (one row per species in
// the GBIF data, with an English common name where GBIF has one). Served live from
// the database, so new species and name changes appear without a front-end release.
// ============================================================================

import { GBIF_SPECIES_NAMES_URL } from './gbifEndpoints';
import { NON_TERRESTRIAL_SPECIES } from './nonTerrestrialSpecies';

export type SpeciesKingdomFilter = 'Animalia' | 'Plantae' | 'Fungi' | 'all';

/** Sub-filter used when the kingdom is Animalia. Based on `taxonomic_class`. */
export type AnimalGroup =
  | 'mammals'
  | 'birds'
  | 'insects'
  | 'reptiles'
  | 'amphibians'
  | 'other'
  | 'all';

/** Display order of the animal groups; the first is the picker's default. */
export const ANIMAL_GROUPS: { id: AnimalGroup; label: string }[] = [
  { id: 'mammals', label: 'Mammals' },
  { id: 'birds', label: 'Birds' },
  { id: 'insects', label: 'Insects' },
  { id: 'reptiles', label: 'Reptiles' },
  { id: 'amphibians', label: 'Amphibians' },
  { id: 'other', label: 'Other' },
  { id: 'all', label: 'All' },
];

export const DEFAULT_ANIMAL_GROUP: AnimalGroup = ANIMAL_GROUPS[0].id;

const REPTILE_CLASSES = ['Squamata', 'Testudines', 'Crocodylia', 'Rhynchocephalia'];
// Ray-finned fishes have no class in the GBIF backbone (NULL here), so fish is the
// jawless/cartilaginous/lancelet classes plus a NULL class.
// The SDM is for land species and the land mask cannot tell a fish in a creek or off the
// shore from a land record (a 1 km cell is mostly land), so fish are left out of the
// picker altogether (see notFishClause).
const FISH_CLASSES = ['Elasmobranchii', 'Holocephali', 'Myxini', 'Petromyzonti', 'Leptocardii'];

// Land animals that GBIF gives no class, so the NULL-class rule would take them for fish.
const NULL_CLASS_LAND_SPECIES = [
  'Calephelis nemesis', // Fatal Metalmark (butterfly)
  'Bipalium kewense', // Hammerhead Flatworm
];

/** Keeps every row except animals that are fish (a NULL class counts as fish, see above). */
function notFishClause(): string {
  return (
    `(kingdom IS NULL OR kingdom <> 'Animalia' OR ` +
    `(taxonomic_class IS NOT NULL AND taxonomic_class NOT IN (${inList(FISH_CLASSES)})) OR ` +
    `species IN (${inList(NULL_CLASS_LAND_SPECIES)}))`
  );
}

function inList(values: string[]): string {
  return values.map((v) => `'${v}'`).join(', ');
}

function animalGroupClause(group: AnimalGroup): string | null {
  switch (group) {
    case 'mammals':
      return `taxonomic_class = 'Mammalia'`;
    case 'birds':
      return `taxonomic_class = 'Aves'`;
    case 'insects':
      return `taxonomic_class = 'Insecta'`;
    case 'amphibians':
      return `taxonomic_class = 'Amphibia'`;
    case 'reptiles':
      return `taxonomic_class IN (${inList(REPTILE_CLASSES)})`;
    case 'other':
      return (
        `taxonomic_class IS NOT NULL AND taxonomic_class NOT IN (` +
        inList(['Mammalia', 'Aves', 'Insecta', 'Amphibia', ...REPTILE_CLASSES, ...FISH_CLASSES]) +
        `)`
      );
    case 'all':
    default:
      return null;
  }
}

export interface SpeciesName {
  /** Scientific name; this is what the occurrence layers and the SDM tool match on. */
  species: string;
  commonName: string | null;
  kingdom: string | null;
  taxonomicClass: string | null;
  /**
   * Presence points the SDM tool would train on: tri-county records thinned to one per
   * predictor-grid cell. null if the service doesn't report it.
   */
  modelPoints: number | null;
}

/**
 * Minimum model points the SDM tool needs to run (MIN_PRESENCE in sdm_rf_tool.pyt). The
 * picker only lists species that have at least this many, so every species it offers can
 * be modeled.
 */
export const SDM_MIN_MODEL_POINTS = 10;

export interface SpeciesNameSearch {
  kingdom: SpeciesKingdomFilter;
  /** Only applied when kingdom is 'Animalia'. */
  animalGroup?: AnimalGroup;
  /** Matches scientific or common names, case-insensitive. */
  search?: string;
  offset?: number;
  limit?: number;
  signal?: AbortSignal;
}

export interface SpeciesNamePage {
  items: SpeciesName[];
  hasMore: boolean;
  /**
   * False when the published table has no model_points field yet (service not
   * republished); the list is then not limited to species with enough points.
   */
  modelPointsAvailable: boolean;
}

/** "Bobcat (Lynx rufus)", or just the scientific name when there is no common name. */
export function formatSpeciesLabel(species: string, commonName: string | null | undefined): string {
  return commonName ? `${commonName} (${species})` : species;
}

function escapeSql(value: string): string {
  return value.replace(/'/g, "''");
}

function buildWhere(
  kingdom: SpeciesKingdomFilter,
  animalGroup: AnimalGroup,
  requireModelPoints: boolean,
  search: string,
): string {
  const clauses = [
    'species IS NOT NULL',
    notFishClause(),
    `species NOT IN (${inList(NON_TERRESTRIAL_SPECIES)})`,
  ];
  if (requireModelPoints) {
    clauses.push(`model_points >= ${SDM_MIN_MODEL_POINTS}`);
  }
  if (kingdom !== 'all') clauses.push(`kingdom = '${kingdom}'`);
  if (kingdom === 'Animalia') {
    const groupClause = animalGroupClause(animalGroup);
    if (groupClause) clauses.push(groupClause);
  }

  const term = search.trim();
  if (term.length > 0) {
    const pattern = `%${escapeSql(term.toUpperCase())}%`;
    clauses.push(`(UPPER(species) LIKE '${pattern}' OR UPPER(common_name) LIKE '${pattern}')`);
  } else {
    // With nothing typed, list species people can recognise first
    clauses.push('common_name IS NOT NULL');
  }
  return clauses.join(' AND ');
}

export async function searchSpeciesNames({
  kingdom,
  animalGroup = DEFAULT_ANIMAL_GROUP,
  search = '',
  offset = 0,
  limit = 100,
  signal,
}: SpeciesNameSearch): Promise<SpeciesNamePage> {
  const runQuery = async (where: string, outFields: string) => {
    const params = new URLSearchParams({
      where,
      outFields,
      returnGeometry: 'false',
      // NULL common names sort last, so named species come first
      orderByFields: 'common_name, species',
      resultOffset: String(offset),
      // One extra row tells us whether another page exists
      resultRecordCount: String(limit + 1),
      f: 'json',
    });
    const response = await fetch(`${GBIF_SPECIES_NAMES_URL}/query?${params.toString()}`, { signal });
    if (!response.ok) {
      throw new Error(`Species lookup failed: ${response.status} ${response.statusText}`);
    }
    return response.json();
  };

  const baseFields = 'species,common_name,kingdom,taxonomic_class';
  let modelPointsAvailable = true;
  let json = await runQuery(
    buildWhere(kingdom, animalGroup, true, search),
    `${baseFields},model_points`,
  );
  if (json.error) {
    // The published table may predate the model_points field (before the service is
    // republished); fall back to the list without the point count so the picker keeps working.
    modelPointsAvailable = false;
    json = await runQuery(buildWhere(kingdom, animalGroup, false, search), baseFields);
  }
  if (json.error) {
    throw new Error(
      typeof json.error.message === 'string' && json.error.message.trim()
        ? json.error.message.trim()
        : 'Species lookup failed',
    );
  }

  const rows: SpeciesName[] = (json.features ?? [])
    .map((feature: { attributes?: Record<string, unknown> }) => feature.attributes ?? {})
    .filter((a: Record<string, unknown>) => typeof a.species === 'string' && a.species.trim().length > 0)
    .map((a: Record<string, unknown>) => ({
      species: String(a.species).trim(),
      commonName: typeof a.common_name === 'string' && a.common_name.trim() ? a.common_name.trim() : null,
      kingdom: typeof a.kingdom === 'string' ? a.kingdom : null,
      taxonomicClass: typeof a.taxonomic_class === 'string' ? a.taxonomic_class : null,
      modelPoints: typeof a.model_points === 'number' ? a.model_points : null,
    }));

  return { items: rows.slice(0, limit), hasMore: rows.length > limit, modelPointsAvailable };
}
