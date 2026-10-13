import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { RunSettingsView, formatCellSize, relativeWeights } from './RunSettingsView';
import type { SuitabilityRunInput, SuitabilityRunRecord } from '../types';

const layers: SuitabilityRunInput[] = [
  {
    title: 'SSURGO Drainage Class',
    url: 'a',
    weight: 3,
    type: 'categorical',
    categories: { '2': 5, '6': 1 },
    categoryLabels: { '6': 'Well drained' },
  },
  {
    title: 'Soil Erodibility',
    url: 'b',
    weight: 1,
    type: 'continuous',
    bins: [{ min: 0, max: 0.2, score: 4 }],
  },
  { title: 'Slope', url: 'c', weight: 0, type: 'rescale', rescaleMin: 0, rescaleMax: 30, invert: true },
];

const record = {
  name: 'demo',
  extent: 'sbcounty',
  extentLabel: 'Santa Barbara County',
  scaleMax: 5,
  layers,
} as SuitabilityRunRecord;

describe('RunSettingsView', () => {
  it('computes each layer share of the total weight', () => {
    expect(relativeWeights(layers)).toEqual([75, 25, 0]);
    expect(relativeWeights([{ ...layers[0], weight: 0 }])).toEqual([0]);
  });

  it('formats cell size in metres or degrees', () => {
    expect(formatCellSize(1000)).toBe('1,000 m');
    expect(formatCellSize(0.009)).toBe('0.009°');
    expect(formatCellSize(null)).toBeNull();
  });

  it('recaps extent, resolution and every layer with its scoring', () => {
    const html = renderToStaticMarkup(<RunSettingsView record={record} cellSize={1000} />);
    expect(html).toContain('Santa Barbara County');
    expect(html).toContain('1,000 m');
    expect(html).toContain('SSURGO Drainage Class');
    expect(html).toContain('75%');
    expect(html).toContain('Well drained (6)');
    expect(html).toContain('Value 2');
    expect(html).toContain('Score per value range');
    expect(html).toContain('inverted');
  });

  it('starts each layer collapsed', () => {
    const html = renderToStaticMarkup(<RunSettingsView record={record} cellSize={null} />);
    expect(html).toContain('aria-expanded="false"');
  });
});
