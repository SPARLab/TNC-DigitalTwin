import { describe, expect, it } from 'vitest';
import {
  distributeReclassBins,
  equalIntervalBins,
  histogramValueRange,
  isUntouchedDefaultBins,
  quantileBins,
} from './reclassBins';

const skewed = {
  bins: [
    { min: 0.2, max: 0.3, count: 80 },
    { min: 0.3, max: 0.4, count: 15 },
    { min: 0.4, max: 0.5, count: 5 },
  ],
};

describe('histogramValueRange', () => {
  it('uses occupied bins and ignores empty edges', () => {
    expect(histogramValueRange({
      bins: [
        { min: 0, max: 10, count: 0 },
        { min: 10, max: 20, count: 4 },
        { min: 20, max: 30, count: 2 },
        { min: 30, max: 40, count: 0 },
      ],
    })).toEqual({ min: 10, max: 30 });
  });
});

describe('equalIntervalBins', () => {
  it('splits the layer range instead of 0–100', () => {
    const bins = equalIntervalBins(0.2, 0.5, 3, 5);
    expect(bins.map((bin) => bin.min)).toEqual([0.2, 0.3, 0.4]);
    expect(bins.map((bin) => bin.max)).toEqual([0.3, 0.4, 0.5]);
    expect(bins.map((bin) => bin.score)).toEqual([1, 3, 5]);
  });
});

describe('quantileBins', () => {
  it('puts roughly equal pixel counts in each bin', () => {
    const bins = quantileBins(skewed, 3, 5);
    expect(bins[0].min).toBe(0.2);
    expect(bins[bins.length - 1].max).toBe(0.5);
    expect(bins[0].max).toBeLessThan(0.3);
    expect(bins[1].max).toBeLessThan(0.4);
  });
});

describe('distributeReclassBins', () => {
  it('builds a defined interval and keeps the remainder in the last bin', () => {
    const result = distributeReclassBins({
      scheme: 'defined-interval',
      histogram: { bins: [{ min: 0, max: 10, count: 20 }] },
      binCount: 3,
      interval: 3,
      scaleMax: 5,
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.bins.map((bin) => [bin.min, bin.max])).toEqual([
      [0, 3],
      [3, 6],
      [6, 9],
      [9, 10],
    ]);
  });

  it('rejects an interval that would create too many bins', () => {
    const result = distributeReclassBins({
      scheme: 'defined-interval',
      histogram: skewed,
      binCount: 3,
      interval: 0.001,
      scaleMax: 5,
    });
    expect(result.ok).toBe(false);
  });
});

describe('isUntouchedDefaultBins', () => {
  it('recognizes the placeholder 0–100 thirds', () => {
    expect(isUntouchedDefaultBins([])).toBe(true);
    expect(isUntouchedDefaultBins([
      { min: 0, max: 33.3333, score: 1 },
      { min: 33.3333, max: 66.6667, score: 3 },
      { min: 66.6667, max: 100, score: 5 },
    ])).toBe(true);
    expect(isUntouchedDefaultBins([
      { min: 0.2, max: 0.3, score: 1 },
      { min: 0.3, max: 0.4, score: 3 },
      { min: 0.4, max: 0.5, score: 5 },
    ])).toBe(false);
  });
});
