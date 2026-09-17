import { describe, expect, it } from 'vitest';
import {
  formatImageryDimensionLabel,
  sliceSelectionFromFilters,
} from './imagerySliceUtils';

describe('imagerySliceUtils', () => {
  it('formats StdTime epoch values as UTC years', () => {
    expect(formatImageryDimensionLabel(817776000000, 'StdTime')).toBe('1995');
    expect(formatImageryDimensionLabel(1764547200000, 'StdTime')).toBe('2025');
    expect(formatImageryDimensionLabel(3658003200000, 'StdTime')).toBe('2085');
  });

  it('reads slice selection from TNC ArcGIS filters', () => {
    expect(sliceSelectionFromFilters('dataset-1', {
      whereClause: '1=1',
      imageryVariable: 'SSP126',
      imageryDimensionName: 'StdTime',
      imageryDimensionValue: 817776000000,
    })).toEqual({
      layerId: 'dataset-1',
      variableName: 'SSP126',
      dimensionName: 'StdTime',
      dimensionValue: 817776000000,
    });

    expect(sliceSelectionFromFilters('dataset-1', { whereClause: '1=1' })).toBeNull();
  });
});
