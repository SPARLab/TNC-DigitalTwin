import { describe, expect, it } from 'vitest';
import {
  commonProblem,
  commonTitle,
  compareProblem,
  compareTitle,
  formatThresholdValue,
  isModelRun,
  isValidThreshold,
  modelThresholdList,
  runDisplayTitle,
  runKind,
  runLegendTitle,
  runsOfSpecies,
  sharedSpecies,
  showRun,
  speciesOptions,
} from './sdmRuns';
import type { CompletedRun, SdmOutputType, SdmSummary } from './types';

function run(jobId: string, patch: Partial<CompletedRun> = {}): CompletedRun {
  return {
    jobId,
    mapServerUrl: 'https://example.test/MapServer',
    title: `Bobcat (Lynx rufus) · ${jobId}`,
    summary: 'Bobcat (Lynx rufus)',
    record: null,
    analysis: null,
    visible: true,
    selected: false,
    pngUrl: null,
    tifUrl: null,
    addedAt: 1,
    outputType: 'Probability',
    kind: 'model',
    species: 'Lynx rufus',
    scenario: jobId,
    ...patch,
  };
}

function withThreshold(value: number | null): Partial<CompletedRun> {
  return {
    sdmSummary: { model: { optimal_threshold: value } } as unknown as SdmSummary,
  };
}

describe('runKind', () => {
  it('treats a run with an output type but no kind as a model run', () => {
    expect(runKind({ outputType: 'Binary' })).toBe('model');
  });

  it('uses the stored kind, and has none for suitability runs', () => {
    expect(runKind({ kind: 'comparison', outputType: 'Probability' })).toBe('comparison');
    expect(runKind({})).toBeNull();
  });

  it('only model runs can be compared', () => {
    expect(isModelRun(run('a'))).toBe(true);
    expect(isModelRun(run('b', { kind: 'common' }))).toBe(false);
    expect(isModelRun(run('c', { kind: undefined, outputType: null }))).toBe(false);
  });
});

describe('compareProblem', () => {
  it('accepts two different runs of one output type', () => {
    expect(compareProblem(run('a'), run('b'))).toBeNull();
  });

  it('asks for two runs', () => {
    expect(compareProblem(run('a'), undefined)).toMatch(/two runs/i);
  });

  it('rejects the same run twice', () => {
    expect(compareProblem(run('a'), run('a'))).toMatch(/different/i);
  });

  it('rejects mixed output types', () => {
    const binary: SdmOutputType = 'Binary';
    expect(compareProblem(run('a'), run('b', { outputType: binary }))).toMatch(/same output type/i);
  });
});

describe('commonProblem', () => {
  it('needs at least two runs', () => {
    expect(commonProblem([run('a')])).toMatch(/at least two/i);
    expect(commonProblem([run('a'), run('b')])).toBeNull();
  });

  it('caps the number of runs at the tool limit', () => {
    const many = Array.from({ length: 51 }, (_, index) => run(`r${index}`));
    expect(commonProblem(many)).toMatch(/at most 50/i);
  });

  it('rejects mixed output types', () => {
    expect(commonProblem([run('a'), run('b', { outputType: 'Binary' })])).toMatch(/mix/i);
  });
});

describe('modelThresholdList', () => {
  it('lists each run\'s threshold in order for the Threshold Per Run field', () => {
    const runs = [run('a', withThreshold(0.651)), run('b', withThreshold(0.58))];
    expect(modelThresholdList(runs)).toBe('0.651, 0.58');
  });

  it('is null when any run has no stored threshold, or no runs are given', () => {
    expect(modelThresholdList([run('a', withThreshold(0.6)), run('b')])).toBeNull();
    expect(modelThresholdList([run('a', withThreshold(null))])).toBeNull();
    expect(modelThresholdList([])).toBeNull();
  });
});

describe('thresholds', () => {
  it('formats without trailing zeros or long tails', () => {
    expect(formatThresholdValue(0.5)).toBe('0.5');
    expect(formatThresholdValue(0.65123456)).toBe('0.651');
    expect(formatThresholdValue(1)).toBe('1');
  });

  it('accepts values above 0 and up to 1, like the tools', () => {
    expect(isValidThreshold(0.5)).toBe(true);
    expect(isValidThreshold(1)).toBe(true);
    expect(isValidThreshold(0)).toBe(false);
    expect(isValidThreshold(1.2)).toBe(false);
    expect(isValidThreshold(Number.NaN)).toBe(false);
  });
});

describe('titles', () => {
  it('names a same-species comparison by its scenarios', () => {
    expect(compareTitle(run('a', { scenario: 'Current (1981–2010)' }), run('b', { scenario: 'SSP5-8.5 (2071–2100)' }))).toBe(
      'Compare · Bobcat (Lynx rufus): Current (1981–2010) → SSP5-8.5 (2071–2100)',
    );
  });

  it('falls back to both full titles for different species', () => {
    const a = run('a');
    const b = run('b', { species: 'Puma concolor' });
    expect(compareTitle(a, b)).toBe(`Compare · ${a.title} → ${b.title}`);
  });

  it('names common areas by species and run count', () => {
    expect(commonTitle([run('a'), run('b'), run('c')])).toBe('Common areas · Bobcat (Lynx rufus) (3 runs)');
    expect(commonTitle([run('a'), run('b', { species: 'Puma concolor' })])).toBe('Common areas · 2 runs');
  });
});

describe('species grouping and short titles', () => {
  const bobcat = (id: string) =>
    run(id, { species: 'Bobcat (Lynx rufus)', speciesKey: 'Lynx rufus' });
  const fox = (id: string) =>
    run(id, { species: 'Gray fox', speciesKey: 'Urocyon cinereoargenteus' });

  it('lists each species with a model run once, in run order', () => {
    const options = speciesOptions([fox('f1'), bobcat('b1'), fox('f2')]);
    expect(options).toEqual([
      { key: 'Urocyon cinereoargenteus', label: 'Gray fox' },
      { key: 'Lynx rufus', label: 'Bobcat (Lynx rufus)' },
    ]);
  });

  it('keeps the runs of one species, matching old runs by label', () => {
    const old = run('old', { species: 'Bobcat (Lynx rufus)', speciesKey: undefined });
    const kept = runsOfSpecies([bobcat('b1'), fox('f1'), old], options0());
    expect(kept.map((item) => item.jobId)).toEqual(['b1', 'old']);
  });

  function options0() {
    return { key: 'Lynx rufus', label: 'Bobcat (Lynx rufus)' };
  }

  it('names a model run by its scenario and a comparison by A to B', () => {
    expect(runDisplayTitle(bobcat('b1'))).toBe('b1 · Probability');
    const comparison = run('c1', { kind: 'comparison', scenario: 'Current → SSP5' });
    expect(runDisplayTitle(comparison)).toBe('Current → SSP5 · Probability');
  });

  it('names a common-areas result by how many runs and species it combines', () => {
    const inputs = [bobcat('a'), bobcat('b'), fox('c')].map(({ jobId, title, species, speciesKey }) => ({
      jobId,
      title,
      species,
      speciesKey,
    }));
    const common = run('x', { kind: 'common', scenario: undefined, inputRuns: inputs });
    expect(runDisplayTitle(common)).toBe('3 runs · 2 species · Probability');
    expect(runDisplayTitle({ ...common, inputRuns: inputs.slice(0, 2) })).toBe(
      '2 runs · Probability',
    );
  });

  it('puts the species back in the legend heading', () => {
    expect(runLegendTitle(bobcat('b1'))).toBe('Bobcat (Lynx rufus) · b1 · Probability');
    const comparison = run('c1', {
      kind: 'comparison',
      species: 'Bobcat (Lynx rufus)',
      scenario: 'A → B',
    });
    expect(runLegendTitle(comparison)).toBe('Compare · Bobcat (Lynx rufus) · A → B · Probability');
  });

  it('finds a species shared by every run', () => {
    expect(sharedSpecies([bobcat('a'), bobcat('b')])).toEqual({
      species: 'Bobcat (Lynx rufus)',
      speciesKey: 'Lynx rufus',
    });
    expect(sharedSpecies([bobcat('a'), fox('b')])).toBeUndefined();
  });
});

describe('showRun', () => {
  const visible = (runs: CompletedRun[]) => runs.filter((item) => item.visible).map((item) => item.jobId);

  it('turns off the same species\' other model runs only', () => {
    const runs = [
      run('a', { visible: false }),
      run('b'),
      run('other', { speciesKey: 'Other', species: 'Other' }),
      run('cmp', { kind: 'comparison' }),
    ];
    expect(visible(showRun(runs, 'a'))).toEqual(['a', 'other', 'cmp']);
  });

  it('leaves other runs alone when a comparison is turned on', () => {
    const runs = [run('a'), run('cmp', { kind: 'comparison', visible: false })];
    expect(visible(showRun(runs, 'cmp'))).toEqual(['a', 'cmp']);
  });
});
