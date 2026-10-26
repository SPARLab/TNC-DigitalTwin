// ============================================================================
// sdmRuns — which finished SDM jobs can feed the comparison tools, and the
// titles and threshold lists for the jobs that compare them.
// ============================================================================

import { SDM_COMPARE_DEFAULTS } from '../../config/geoprocessing';
import type { CompletedRun, SdmInputRun, SdmOutputType, SdmRunKind } from './types';

/**
 * What a kept run is. Runs saved before comparisons existed have an output type
 * but no kind: those are model runs. Suitability runs are neither.
 */
export function runKind(run: Pick<CompletedRun, 'kind' | 'outputType'>): SdmRunKind | null {
  if (run.kind) return run.kind;
  return run.outputType ? 'model' : null;
}

/** A finished model run that Compare and Common Areas can take as input. */
export function isModelRun(run: CompletedRun): boolean {
  return runKind(run) === 'model' && run.outputType != null;
}

export function modelRuns(runs: CompletedRun[]): CompletedRun[] {
  return runs.filter(isModelRun);
}

/** The cutoff the model chose for this run (Youden's J), when its summary is known. */
export function modelThreshold(run: CompletedRun): number | null {
  const value = run.sdmSummary?.model?.optimal_threshold;
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

/** "Current (1981–2010)" for a run; older runs fall back to their whole title. */
export function runScenario(run: CompletedRun): string {
  return run.scenario || run.title;
}

function sameSpecies(runs: CompletedRun[]): boolean {
  const first = runs[0]?.species;
  return Boolean(first) && runs.every((run) => run.species === first);
}

export function compareTitle(a: CompletedRun, b: CompletedRun): string {
  if (sameSpecies([a, b]) && a.summary) {
    return `Compare · ${a.summary}: ${runScenario(a)} → ${runScenario(b)}`;
  }
  return `Compare · ${a.title} → ${b.title}`;
}

export function commonTitle(runs: CompletedRun[]): string {
  const count = `${runs.length} runs`;
  if (sameSpecies(runs) && runs[0].summary) {
    return `Common areas · ${runs[0].summary} (${count})`;
  }
  return `Common areas · ${count}`;
}

/** A short name for the output rasters, safe for the tool's Output Raster field. */
export function outputName(prefix: string): string {
  return `${prefix}_${Date.now().toString(36)}`;
}

/** Number as the tools take it: no trailing zeros, at most three decimals. */
export function formatThresholdValue(value: number): string {
  return String(Number(value.toFixed(3)));
}

/**
 * One threshold per run, in the same order as the runs, for the tool's
 * "Threshold Per Run" field. Null when any run has no known model threshold.
 */
export function modelThresholdList(runs: CompletedRun[]): string | null {
  const values = runs.map(modelThreshold);
  if (values.length === 0 || values.some((value) => value == null)) return null;
  return values.map((value) => formatThresholdValue(value as number)).join(', ');
}

export function isValidThreshold(value: number): boolean {
  return Number.isFinite(value) && value > 0 && value <= 1;
}

function outputTypes(runs: CompletedRun[]): SdmOutputType[] {
  return [...new Set(runs.map((run) => run.outputType).filter((type): type is SdmOutputType => type != null))];
}

/** Why two runs cannot be compared, or null when they can. */
export function compareProblem(a: CompletedRun | undefined, b: CompletedRun | undefined): string | null {
  if (!a || !b) return 'Choose two runs.';
  if (a.jobId === b.jobId) return 'Choose two different runs.';
  if (a.outputType !== b.outputType) {
    return `Run A is a ${a.outputType} run and run B is a ${b.outputType} run. Compare two runs with the same output type.`;
  }
  return null;
}

/** Why these runs cannot be combined, or null when they can. */
export function commonProblem(runs: CompletedRun[]): string | null {
  if (runs.length < 2) return 'Choose at least two runs.';
  if (runs.length > SDM_COMPARE_DEFAULTS.maxCommonRuns) {
    return `Choose at most ${SDM_COMPARE_DEFAULTS.maxCommonRuns} runs.`;
  }
  if (outputTypes(runs).length > 1) {
    return 'The chosen runs mix Probability and Binary output. Choose runs of one type.';
  }
  return null;
}

// --- Species and titles --------------------------------------------------
// A run's own title carries the species, the scenario and the output type. Once
// runs are grouped by species, the species is the heading and the rest is what
// tells the runs apart.

/** The species a run belongs to, or null when it spans several. */
export function runSpeciesKey(run: Pick<CompletedRun, 'speciesKey' | 'species'>): string | null {
  return run.speciesKey ?? run.species ?? null;
}

export function runSpeciesLabel(run: Pick<CompletedRun, 'speciesKey' | 'species'>): string | null {
  return run.species ?? run.speciesKey ?? null;
}

export interface SpeciesOption {
  key: string;
  label: string;
}

/** The species that have a model run, in the order their newest run was made. */
export function speciesOptions(runs: CompletedRun[]): SpeciesOption[] {
  const seen = new Map<string, SpeciesOption>();
  for (const run of modelRuns(runs)) {
    const key = runSpeciesKey(run);
    if (key && !seen.has(key)) seen.set(key, { key, label: runSpeciesLabel(run) ?? key });
  }
  return [...seen.values()];
}

/**
 * The runs of one species. A run matches on the scientific name or the label, so
 * runs saved before the scientific name was kept still group with newer ones.
 */
export function runsOfSpecies(runs: CompletedRun[], species: SpeciesOption | null): CompletedRun[] {
  if (!species) return [];
  return runs.filter(
    (run) => runSpeciesKey(run) === species.key || runSpeciesLabel(run) === species.label,
  );
}

/** The species and scenario of a run, in the form the map tool sends with a job. */
export function inputRunOf(run: CompletedRun): SdmInputRun {
  return {
    jobId: run.jobId,
    title: run.title,
    species: run.species,
    speciesKey: run.speciesKey,
    scenario: run.scenario,
  };
}

/** The species shared by every run, or undefined when they differ or are unknown. */
export function sharedSpecies(
  runs: CompletedRun[],
): { species: string; speciesKey: string } | undefined {
  const first = runs[0];
  const key = first ? runSpeciesKey(first) : null;
  if (!first || !key || !runs.every((run) => runSpeciesKey(run) === key)) return undefined;
  return { species: runSpeciesLabel(first) ?? key, speciesKey: key };
}

/**
 * What identifies a run once its species is the heading: a model run's scenario,
 * a comparison's "A → B", or how many runs a common-areas result combines.
 */
export function runDisplayTitle(run: CompletedRun): string {
  const kind = runKind(run);
  const type = run.outputType ? ` · ${run.outputType}` : '';
  if (kind === 'model' || kind === 'comparison') return `${run.scenario || run.title}${type}`;
  if (kind === 'common') {
    const inputs = run.inputRuns ?? [];
    if (inputs.length === 0) return run.title;
    const species = new Set(
      inputs.map((input) => input.speciesKey ?? input.species).filter(Boolean),
    );
    const count = `${inputs.length} runs`;
    return `${species.size > 1 ? `${count} · ${species.size} species` : count}${type}`;
  }
  return run.title;
}

/** A heading for a run away from its species group, such as in the map legend. */
export function runLegendTitle(run: CompletedRun): string {
  const kind = runKind(run);
  const display = runDisplayTitle(run);
  const species = runSpeciesLabel(run);
  if (kind === 'model') return [species, display].filter(Boolean).join(' · ');
  if (kind === 'comparison') return ['Compare', species, display].filter(Boolean).join(' · ');
  if (kind === 'common') return ['Common areas', species, display].filter(Boolean).join(' · ');
  return run.title;
}

/** An input run's name: its scenario, with the species first when runs of several mix. */
export function inputRunLabel(input: SdmInputRun, withSpecies = false): string {
  const name = input.scenario || input.title;
  return withSpecies && input.species ? `${input.species} · ${name}` : name;
}

/** Whether the input runs cover more than one species. */
export function spansSpecies(inputs: SdmInputRun[] | undefined): boolean {
  return new Set((inputs ?? []).map((input) => input.speciesKey ?? input.species).filter(Boolean)).size > 1;
}

/**
 * Put one run on the map. Model runs of a species show one at a time, so the
 * species' other model runs go off. Every other run is left as it is.
 */
export function showRun(runs: CompletedRun[], jobId: string): CompletedRun[] {
  const target = runs.find((run) => run.jobId === jobId);
  if (!target) return runs;
  const exclusive = runKind(target) === 'model';
  const key = runSpeciesKey(target);
  return runs.map((run) => {
    if (run.jobId === jobId) return run.visible ? run : { ...run, visible: true };
    const sibling = exclusive && runKind(run) === 'model' && runSpeciesKey(run) === key;
    return sibling && run.visible ? { ...run, visible: false } : run;
  });
}
/** The species a common-areas result combines, in the order its runs were chosen. */
export function combinedSpecies(run: CompletedRun): { key: string; label: string }[] {
  const found = new Map<string, string>();
  for (const input of run.inputRuns ?? []) {
    const key = input.speciesKey ?? input.species;
    if (key && !found.has(key)) found.set(key, input.species ?? key);
  }
  return [...found].map(([key, label]) => ({ key, label }));
}
