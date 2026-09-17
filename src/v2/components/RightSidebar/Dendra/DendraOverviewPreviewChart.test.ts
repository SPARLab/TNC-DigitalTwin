import { describe, expect, it } from 'vitest';
import { formatAxisNumber, inferYAxisDecimals } from './DendraMultiSeriesChart';

describe('Dendra overview chart axis precision', () => {
  it('uses finer decimals for small rainfall-scale values', () => {
    expect(inferYAxisDecimals([0, 0.02])).toBeGreaterThanOrEqual(3);
    expect(formatAxisNumber(0.02, 3)).toBe('0.020');
  });

  it('uses coarser decimals for large magnitudes', () => {
    expect(inferYAxisDecimals([12, 48])).toBe(1);
    expect(inferYAxisDecimals([120, 480])).toBe(0);
  });
});
