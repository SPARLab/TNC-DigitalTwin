import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { SdmDistributionChart, shareAtOrAbove } from './SdmDistributionChart';

const histogram = {
  bin_edges: [0, 0.25, 0.5, 0.75, 1],
  counts: [4, 3, 2, 1],
  percent: [40, 30, 20, 10],
  area_km2: [null, null, null, null],
};

describe('shareAtOrAbove', () => {
  it('adds up the bins at or above the threshold', () => {
    expect(shareAtOrAbove(histogram, 0.5)).toBe(30);
    expect(shareAtOrAbove(histogram, 0)).toBe(100);
    expect(shareAtOrAbove(histogram, 1)).toBe(0);
  });

  it('counts part of the bin the threshold falls inside', () => {
    expect(shareAtOrAbove(histogram, 0.625)).toBeCloseTo(10 + 10);
  });
});

describe('SdmDistributionChart', () => {
  it('lists each run with the share of cells it would call suitable', () => {
    const { getByText } = render(
      <SdmDistributionChart
        series={[{ id: 'a', label: 'Current', color: '#059669', histogram }]}
        threshold={0.5}
      />,
    );
    expect(getByText('Current')).toBeTruthy();
    expect(getByText('30% suitable')).toBeTruthy();
  });

  it('draws no threshold line without a threshold', () => {
    const { container } = render(
      <SdmDistributionChart series={[{ id: 'a', label: 'Current', color: '#059669', histogram }]} />,
    );
    expect(container.querySelector('[data-testid="threshold-line"]')).toBeNull();
  });
});

