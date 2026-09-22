import { describe, expect, it } from 'vitest';
import {
  formatAxisNumber,
  inferYAxisDecimals,
  resolveYAxisDomain,
} from './DendraMultiSeriesChart';

describe('Dendra overview chart axis precision', () => {
  it('caps decimals at 3 for small rainfall-scale values', () => {
    expect(inferYAxisDecimals([0, 0.02])).toBe(3);
    expect(inferYAxisDecimals([0, 0.0001])).toBeLessThanOrEqual(3);
    expect(formatAxisNumber(0.02, 3)).toBe('0.020');
  });

  it('uses coarser decimals for large magnitudes', () => {
    expect(inferYAxisDecimals([12, 48])).toBe(1);
    expect(inferYAxisDecimals([120, 480])).toBe(0);
  });

  it('uses whole numbers for all-zero / flat noise series', () => {
    expect(inferYAxisDecimals([0, 0])).toBe(0);
    expect(inferYAxisDecimals([0, -0])).toBe(0);
    expect(formatAxisNumber(-0.0000004, 6)).toBe('0');
    expect(formatAxisNumber(0, 3)).toBe('0');
  });

  it('expands all-zero data into a readable positive domain', () => {
    expect(resolveYAxisDomain(0, 0)).toEqual({ yMin: 0, yMax: 1 });
  });
});
