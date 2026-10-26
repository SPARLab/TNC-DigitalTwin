// ============================================================================
// Species names — search the "Species Common Names" table (one row per species in
// the GBIF data, with an English common name where GBIF has one). Served live from
// the database, so new species and name changes appear without a front-end release.
// ============================================================================

import { GBIF_SPECIES_NAMES_URL } from './gbifEndpoints';

export type SpeciesKingdomFilter = 'Animalia' | 'Plantae' | 'Fungi' | 'all';

/** Sub-filter used when the kingdom is Animalia. Based on `taxonomic_class`. */
export type AnimalGroup =
  | 'mammals'
  | 'birds'
  | 'insects'
  | 'reptiles'
  | 'amphibians'
  | 'fish'
  | 'other'
  | 'all';

/** Display order of the animal groups; the first is the picker's default. */
export const ANIMAL_GROUPS: { id: AnimalGroup; label: string }[] = [
  { id: 'mammals', label: 'Mammals' },
  { id: 'birds', label: 'Birds' },
  { id: 'insects', label: 'Insects' },
  { id: 'reptiles', label: 'Reptiles' },
  { id: 'amphibians', label: 'Amphibians' },
  { id: 'fish', label: 'Fish' },
  { id: 'other', label: 'Other' },
  { id: 'all', label: 'All' },
];

export const DEFAULT_ANIMAL_GROUP: AnimalGroup = ANIMAL_GROUPS[0].id;

const REPTILE_CLASSES = ['Squamata', 'Testudines', 'Crocodylia', 'Rhynchocephalia'];
// Ray-finned fishes have no class in the GBIF backbone (NULL here), so fish is the
// jawless/cartilaginous/lancelet classes plus a NULL class.
const FISH_CLASSES = ['Elasmobranchii', 'Holocephali', 'Myxini', 'Petromyzonti', 'Leptocardii'];

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
    case 'fish':
      return `(taxonomic_class IS NULL OR taxonomic_class IN (${inList(FISH_CLASSES)}))`;
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

/** Minimum model points the SDM tool needs to run (MIN_PRESENCE in sdm_rf_tool.pyt). */
export const SDM_MIN_MODEL_POINTS = 10;

/** Choices for the "model points" filter. */
export const MODEL_POINT_FILTERS: { min: number; label: string }[] = [
  { min: SDM_MIN_MODEL_POINTS, label: `Ready to model (${SDM_MIN_MODEL_POINTS}+ points)` },
  { min: 30, label: '30+ points' },
  { min: 100, label: '100+ points' },
  { min: 0, label: 'Any species (may be too few to model)' },
];

export const DEFAULT_MIN_MODEL_POINTS = MODEL_POINT_FILTERS[0].min;

export interface SpeciesNameSearch {
  kingdom: SpeciesKingdomFilter;
  /** Only applied when kingdom is 'Animalia'. */
  animalGroup?: AnimalGroup;
  /** Only species with at least this many model points. 0 = no filter. */
  minModelPoints?: number;
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
   * republished); the list is then unfiltered by point count.
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
  minModelPoints: number,
  search: string,
): string {
  const clauses = ['species IS NOT NULL'];
  if (minModelPoints > 0) {
    clauses.push(`model_points >= ${Math.floor(minModelPoints)}`);
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
  minModelPoints = DEFAULT_MIN_MODEL_POINTS,
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
    buildWhere(kingdom, animalGroup, minModelPoints, search),
    `${baseFields},model_points`,
  );
  if (json.error) {
    // The published table may predate the model_points field (before the service is
    // republished); fall back to the unfiltered list so the picker keeps working.
    modelPointsAvailable = false;
    json = await runQuery(buildWhere(kingdom, animalGroup, 0, search), baseFields);
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
