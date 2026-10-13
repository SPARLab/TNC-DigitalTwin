import { beforeEach, describe, expect, it } from 'vitest';
import {
  MAX_STORED_RUNS,
  RUN_TTL_MS,
  loadStoredRuns,
  pruneRuns,
  runsStorageKey,
  saveStoredRuns,
} from './completedRunsStorage';
import type { CompletedRun } from './types';

const NOW = 1_800_000_000_000;
const KEY = runsStorageKey('suitability-test');

function run(jobId: string, addedAt: number, patch: Partial<CompletedRun> = {}): CompletedRun {
  return {
    jobId,
    mapServerUrl: `https://example.test/${jobId}/MapServer`,
    title: `Run ${jobId}`,
    summary: '',
    record: null,
    analysis: null,
    visible: true,
    selected: false,
    pngUrl: `https://example.test/${jobId}.png`,
    tifUrl: `https://example.test/${jobId}.tif`,
    addedAt,
    ...patch,
  };
}

describe('completedRunsStorage', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('restores runs and the active run after a reload', () => {
    saveStoredRuns(KEY, [run('b', NOW - 1000), run('a', NOW - 5000)], 'a', NOW);
    const restored = loadStoredRuns(KEY, NOW + 1000);
    expect(restored.runs.map((item) => item.jobId)).toEqual(['b', 'a']);
    expect(restored.runs[0].tifUrl).toBe('https://example.test/b.tif');
    expect(restored.activeRunId).toBe('a');
  });

  it('drops runs older than a day', () => {
    const fresh = run('fresh', NOW - RUN_TTL_MS + 60_000);
    const stale = run('stale', NOW - RUN_TTL_MS - 60_000);
    expect(pruneRuns([stale, fresh], NOW).map((item) => item.jobId)).toEqual(['fresh']);

    saveStoredRuns(KEY, [fresh], 'fresh', NOW);
    // Two minutes later the run has expired.
    expect(loadStoredRuns(KEY, NOW + 120_000).runs).toEqual([]);
  });

  it('falls back to the newest run when the active one is gone', () => {
    saveStoredRuns(KEY, [run('a', NOW - 1000)], 'missing', NOW);
    expect(loadStoredRuns(KEY, NOW).activeRunId).toBe('a');
  });

  it('keeps at most MAX_STORED_RUNS, newest first', () => {
    const many = Array.from({ length: MAX_STORED_RUNS + 5 }, (_, index) => run(`r${index}`, NOW - index * 1000));
    saveStoredRuns(KEY, many, null, NOW);
    const restored = loadStoredRuns(KEY, NOW);
    expect(restored.runs).toHaveLength(MAX_STORED_RUNS);
    expect(restored.runs[0].jobId).toBe('r0');
  });

  it('clears storage once no runs remain', () => {
    saveStoredRuns(KEY, [run('a', NOW)], 'a', NOW);
    saveStoredRuns(KEY, [], null, NOW);
    expect(window.localStorage.getItem(KEY)).toBeNull();
  });

  it('ignores corrupt or foreign data', () => {
    window.localStorage.setItem(KEY, '{not json');
    expect(loadStoredRuns(KEY, NOW).runs).toEqual([]);
    window.localStorage.setItem(KEY, JSON.stringify({ version: 99, runs: [run('a', NOW)] }));
    expect(loadStoredRuns(KEY, NOW).runs).toEqual([]);
    window.localStorage.setItem(
      KEY,
      JSON.stringify({ version: 1, activeRunId: null, runs: [{ nope: true }, run('ok', NOW)] }),
    );
    expect(loadStoredRuns(KEY, NOW).runs.map((item) => item.jobId)).toEqual(['ok']);
  });
});
