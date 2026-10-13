import { describe, expect, it } from 'vitest';
import {
  buildDistributionSvg,
  buildLayersCsv,
  buildSettingsJson,
  hasResults,
  packageStem,
  scoringSummary,
} from './resultsPackage';
import type { CompletedRun, SuitabilityRunAnalysis, SuitabilityRunInput, SuitabilityRunRecord } from '../types';

const layers: SuitabilityRunInput[] = [
  {
    title: 'SSURGO Drainage, Class',
    url: 'a',
    weight: 3,
    type: 'categorical',
    categories: { '2': 5, '6': 1 },
    categoryLabels: { '6': 'Well drained' },
  },
  { title: 'Soil Erodibility', url: 'b', weight: 1, type: 'continuous', bins: [{ min: 0, max: 0.2, score: 4 }] },
  { title: 'Slope', url: 'c', weight: 0, type: 'rescale', rescaleMin: 0, rescaleMax: 30, invert: true },
];

const record = {
  name: 'Demo <run>',
  extent: 'sbcounty',
  extentLabel: 'Santa Barbara County',
  scaleMax: 5,
  layers,
} as SuitabilityRunRecord;

const analysis = {
  type: 'suitability_run_analysis',
  run: 'demo',
  scale_max: 5,
  cell_size: 1000,
  cells: { total: 100, scored: 80, nodata: 20 },
  area_km2: { cell: 1, scored: 80 },
  stats: { min: 1, max: 5, mean: 2.4, median: 2.2, std: 0.9 },
  histogram: { bin_edges: [1, 5], counts: [80], percent: [100], area_km2: [80] },
  classes: [],
  layers: [],
  bands: [
    { label: '1-2', min: 1, max: 2, max_inclusive: false, cells: 20, percent: 25, area_km2: 20, inputs: [] },
    { label: '2-3', min: 2, max: 3, max_inclusive: false, cells: 0, percent: 0, area_km2: 0, inputs: [] },
    { label: '3-4', min: 3, max: 4, max_inclusive: false, cells: 60, percent: 75, area_km2: 60, inputs: [] },
  ],
} as unknown as SuitabilityRunAnalysis;

describe('resultsPackage', () => {
  it('cleans file names', () => {
    expect(packageStem('A/B:C?')).toBe('ABC');
    expect(packageStem('  ')).toBe('suitability-run');
  });

  it('draws one bar per band, with escaped titles', () => {
    const svg = buildDistributionSvg(analysis, 'Demo <run> & more');
    expect(svg.startsWith('<svg')).toBe(true);
    expect(svg).toContain('Demo &lt;run&gt; &amp; more');
    // Three band rectangles plus the white background.
    expect(svg.match(/<rect /g)).toHaveLength(4);
    expect(svg).toContain('1\u20132');
    expect(svg).toContain('75%');
  });

  it('writes layers, weight shares and scoring to CSV', () => {
    const csv = buildLayersCsv(record);
    const lines = csv.trim().split('\r\n');
    expect(lines[0]).toBe('layer,weight,relative_weight_percent,scoring_type,scoring');
    expect(lines).toHaveLength(4);
    expect(lines[1]).toContain('"SSURGO Drainage, Class",3,75.0,categorical');
    expect(lines[1]).toContain('Well drained (6) = 1');
    expect(lines[3]).toContain('inverted');
  });

  it('summarizes scoring per layer type', () => {
    expect(scoringSummary(layers[1], 5)).toBe('0-0.2 = 4');
  });

  it('records relative weights in the settings JSON', () => {
    const parsed = JSON.parse(buildSettingsJson(record, 1000));
    expect(parsed.cell_size).toBe(1000);
    expect(parsed.layers.map((layer: { relative_weight_percent: number }) => layer.relative_weight_percent)).toEqual([
      75, 25, 0,
    ]);
  });

  it('offers results only when a run has something to export', () => {
    const base = { tifUrl: null, pngUrl: null, record: null } as unknown as CompletedRun;
    expect(hasResults(base)).toBe(false);
    expect(hasResults({ ...base, tifUrl: 'x' })).toBe(true);
    expect(hasResults({ ...base, record })).toBe(true);
  });
});
