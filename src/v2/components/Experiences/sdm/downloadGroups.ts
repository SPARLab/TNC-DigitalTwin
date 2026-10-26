// ============================================================================
// The runs a user can download, listed by species.
//
// Each species has its model runs, comparisons and common-areas results. A
// common-areas result that combines species is listed under each of them, so it
// is found from any; ticking it in one place ticks it in all.
// ============================================================================

import { combinedSpecies, runKind, runSpeciesKey, runSpeciesLabel } from '../sdmRuns';
import type { CompletedRun, SdmRunKind } from '../types';

export const DOWNLOAD_KINDS: readonly SdmRunKind[] = ['model', 'comparison', 'common'];

export interface DownloadGroup {
  /** The species' scientific name, or "other" for runs with no species. */
  key: string;
  label: string;
  runs: Record<SdmRunKind, CompletedRun[]>;
}

export const OTHER_GROUP_KEY = 'other';

/** Species in the order their newest run was made, each with its runs by kind. */
export function downloadGroups(runs: CompletedRun[]): DownloadGroup[] {
  const groups = new Map<string, DownloadGroup>();
  const groupFor = (key: string, label: string) => {
    let group = groups.get(key);
    if (!group) {
      group = { key, label, runs: { model: [], comparison: [], common: [] } };
      groups.set(key, group);
    }
    return group;
  };

  for (const run of runs) {
    const kind = runKind(run);
    if (!kind) continue;
    const key = runSpeciesKey(run);
    const species = key
      ? [{ key, label: runSpeciesLabel(run) ?? key }]
      : kind === 'common'
        ? combinedSpecies(run)
        : [];
    if (species.length === 0) {
      groupFor(OTHER_GROUP_KEY, 'Other runs').runs[kind].push(run);
      continue;
    }
    for (const { key: speciesKey, label } of species) groupFor(speciesKey, label).runs[kind].push(run);
  }
  return [...groups.values()];
}
