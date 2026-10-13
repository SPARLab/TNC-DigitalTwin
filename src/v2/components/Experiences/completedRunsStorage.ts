// ============================================================================
// completedRunsStorage — keep finished runs across a page refresh.
//
// Runs are stored in localStorage with the links to their results and dropped
// a day after they finished: the geoprocessing server deletes job output on a
// similar schedule, so older links would only point at nothing.
// ============================================================================

import type { CompletedRun } from './types';

/** How long a finished run is kept. */
export const RUN_TTL_MS = 24 * 60 * 60 * 1000;

/** Cap on stored runs so one experience cannot fill the browser's quota. */
export const MAX_STORED_RUNS = 20;

const STORAGE_VERSION = 1;

interface StoredRuns {
  version: number;
  activeRunId: string | null;
  runs: CompletedRun[];
}

export interface RestoredRuns {
  runs: CompletedRun[];
  activeRunId: string | null;
}

export function runsStorageKey(experienceId: string): string {
  return `v2-experience-runs:${experienceId}`;
}

function isStoredRun(value: unknown): value is CompletedRun {
  if (!value || typeof value !== 'object') return false;
  const run = value as Partial<CompletedRun>;
  return (
    typeof run.jobId === 'string'
    && typeof run.mapServerUrl === 'string'
    && typeof run.title === 'string'
    && typeof run.addedAt === 'number'
  );
}

/** Newest first, within the TTL, at most MAX_STORED_RUNS. */
export function pruneRuns(runs: CompletedRun[], now: number): CompletedRun[] {
  return runs
    .filter((run) => now - run.addedAt < RUN_TTL_MS)
    .sort((a, b) => b.addedAt - a.addedAt)
    .slice(0, MAX_STORED_RUNS);
}

function storage(): Storage | null {
  try {
    return typeof window === 'undefined' ? null : window.localStorage;
  } catch {
    return null;
  }
}

export function loadStoredRuns(key: string, now: number = Date.now()): RestoredRuns {
  const empty: RestoredRuns = { runs: [], activeRunId: null };
  const store = storage();
  if (!store) return empty;
  try {
    const raw = store.getItem(key);
    if (!raw) return empty;
    const parsed = JSON.parse(raw) as Partial<StoredRuns>;
    if (parsed.version !== STORAGE_VERSION || !Array.isArray(parsed.runs)) return empty;
    const runs = pruneRuns(parsed.runs.filter(isStoredRun), now).map((run) => ({
      ...run,
      record: run.record ?? null,
      analysis: run.analysis ?? null,
      pngUrl: run.pngUrl ?? null,
      tifUrl: run.tifUrl ?? null,
      summary: run.summary ?? '',
      visible: Boolean(run.visible),
      selected: Boolean(run.selected),
    }));
    const activeRunId = runs.some((run) => run.jobId === parsed.activeRunId)
      ? (parsed.activeRunId as string)
      : (runs[0]?.jobId ?? null);
    return { runs, activeRunId };
  } catch {
    return empty;
  }
}

export function saveStoredRuns(
  key: string,
  runs: CompletedRun[],
  activeRunId: string | null,
  now: number = Date.now(),
): void {
  const store = storage();
  if (!store) return;
  try {
    const kept = pruneRuns(runs, now);
    if (kept.length === 0) {
      store.removeItem(key);
      return;
    }
    const write = (items: CompletedRun[]) =>
      store.setItem(
        key,
        JSON.stringify({ version: STORAGE_VERSION, activeRunId, runs: items } satisfies StoredRuns),
      );
    try {
      write(kept);
    } catch {
      // Quota exceeded: keep only the newest run rather than nothing.
      write(kept.slice(0, 1));
    }
  } catch {
    // Storage unavailable or full. The runs stay in memory for this session.
  }
}
