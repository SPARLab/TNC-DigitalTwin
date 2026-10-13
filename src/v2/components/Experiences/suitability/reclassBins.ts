// ============================================================================
// Continuous reclass breaks from a layer's pixel histogram.
// ============================================================================

import type { HistogramBin } from '../../../services/rasterHistogram';
import type { ReclassBin } from '../types';

export type BinScheme = 'equal-interval' | 'quantile' | 'defined-interval';

export const MAX_RECLASS_BINS = 12;

export interface HistogramLike {
  bins: Array<Pick<HistogramBin, 'min' | 'max' | 'count'>>;
}

export function histogramValueRange(
  histogram: HistogramLike,
): { min: number; max: number } | null {
  const occupied = histogram.bins
    .filter((bin) => bin.count > 0 && Number.isFinite(bin.min) && Number.isFinite(bin.max))
    .sort((a, b) => a.min - b.min);
  if (occupied.length === 0) return null;
  return {
    min: occupied[0].min,
    max: occupied[occupied.length - 1].max,
  };
}

/** The 0–100 thirds created before a layer's real range is known. */
export function isUntouchedDefaultBins(bins: ReclassBin[]): boolean {
  if (bins.length === 0) return true;
  if (bins.length !== 3) return false;
  const [first, middle, last] = bins;
  return (
    first.min === 0
    && first.score === 1
    && middle.score === 3
    && last.max === 100
    && last.score === 5
    && first.max === middle.min
    && middle.max === last.min
  );
}

export function suggestedInterval(min: number, max: number): number {
  const span = max - min;
  if (!(span > 0)) return 1;
  const raw = span / 3;
  const magnitude = 10 ** Math.floor(Math.log10(raw));
  const nice = [1, 2, 2.5, 5, 10].map((step) => step * magnitude);
  return nice.reduce((best, candidate) =>
    Math.abs(candidate - raw) < Math.abs(best - raw) ? candidate : best,
  );
}

function clampBinCount(count: number): number {
  if (!Number.isFinite(count)) return 3;
  return Math.min(MAX_RECLASS_BINS, Math.max(2, Math.round(count)));
}

function roundBinEdge(value: number): number {
  const abs = Math.abs(value);
  const digits = abs >= 100 ? 2 : abs >= 10 ? 2 : abs >= 1 ? 3 : 4;
  return Number(value.toFixed(digits));
}

function suitabilityScores(count: number, scaleMax: number): number[] {
  const high = Math.max(1, Math.round(scaleMax) || 1);
  if (count <= 1) return [high];
  return Array.from({ length: count }, (_, index) =>
    Math.round(1 + (index * (high - 1)) / (count - 1)),
  );
}

function binsFromEdges(edges: number[], scaleMax: number): ReclassBin[] {
  const unique: number[] = [];
  for (const edge of edges) {
    if (!Number.isFinite(edge)) continue;
    if (unique.length === 0 || edge > unique[unique.length - 1]) unique.push(edge);
  }
  if (unique.length < 2) return [];
  const scores = suitabilityScores(unique.length - 1, scaleMax);
  return scores.map((score, index) => ({
    min: index === 0 ? unique[0] : unique[index],
    max: index === scores.length - 1 ? unique[unique.length - 1] : unique[index + 1],
    score,
  }));
}

function tidyInterior(edges: number[]): number[] {
  return edges.map((edge, index) =>
    index === 0 || index === edges.length - 1 ? edge : roundBinEdge(edge),
  );
}

export function equalIntervalBins(
  min: number,
  max: number,
  count: number,
  scaleMax: number,
): ReclassBin[] {
  const classes = clampBinCount(count);
  if (!(max > min)) return [{ min, max, score: Math.max(1, scaleMax) }];
  const step = (max - min) / classes;
  const edges = Array.from({ length: classes + 1 }, (_, index) => {
    if (index === 0) return min;
    if (index === classes) return max;
    return min + index * step;
  });
  return binsFromEdges(tidyInterior(edges), scaleMax);
}

export function quantileBins(
  histogram: HistogramLike,
  count: number,
  scaleMax: number,
): ReclassBin[] {
  const range = histogramValueRange(histogram);
  if (!range) return [];
  const classes = clampBinCount(count);
  const occupied = histogram.bins
    .filter((bin) => bin.count > 0 && Number.isFinite(bin.min) && Number.isFinite(bin.max))
    .sort((a, b) => a.min - b.min);
  const total = occupied.reduce((sum, bin) => sum + bin.count, 0);
  if (total <= 0) return equalIntervalBins(range.min, range.max, classes, scaleMax);

  const edges = [range.min];
  for (let klass = 1; klass < classes; klass += 1) {
    const target = (total * klass) / classes;
    let cumulative = 0;
    let edge = range.max;
    for (const bin of occupied) {
      const next = cumulative + bin.count;
      if (next >= target) {
        const span = bin.max - bin.min;
        const fraction = bin.count > 0 ? (target - cumulative) / bin.count : 1;
        edge = span === 0 ? bin.min : bin.min + Math.min(1, Math.max(0, fraction)) * span;
        break;
      }
      cumulative = next;
    }
    edges.push(edge);
  }
  edges.push(range.max);
  return binsFromEdges(tidyInterior(edges), scaleMax);
}

export type DistributeResult =
  | { ok: true; bins: ReclassBin[] }
  | { ok: false; message: string };

export function distributeReclassBins(options: {
  scheme: BinScheme;
  histogram: HistogramLike;
  binCount: number;
  interval: number;
  scaleMax: number;
}): DistributeResult {
  const range = histogramValueRange(options.histogram);
  if (!range) {
    return { ok: false, message: 'This layer has no value range yet.' };
  }

  if (options.scheme === 'defined-interval') {
    if (!(options.interval > 0)) {
      return { ok: false, message: 'Enter an interval greater than 0.' };
    }
    const count = Math.ceil((range.max - range.min) / options.interval);
    if (count > MAX_RECLASS_BINS) {
      const minimum = roundBinEdge((range.max - range.min) / MAX_RECLASS_BINS);
      return {
        ok: false,
        message: `That interval would create ${count} bins. Use at least ${minimum}.`,
      };
    }
    const classes = Math.max(1, count);
    const edges = [range.min];
    for (let index = 1; index < classes; index += 1) {
      edges.push(range.min + index * options.interval);
    }
    edges.push(range.max);
    const bins = binsFromEdges(tidyInterior(edges), options.scaleMax);
    return bins.length > 0 ? { ok: true, bins } : { ok: false, message: 'Could not build bins for that interval.' };
  }

  const bins = options.scheme === 'quantile'
    ? quantileBins(options.histogram, options.binCount, options.scaleMax)
    : equalIntervalBins(range.min, range.max, options.binCount, options.scaleMax);
  return bins.length > 0
    ? { ok: true, bins }
    : { ok: false, message: 'Could not build bins from this layer.' };
}
