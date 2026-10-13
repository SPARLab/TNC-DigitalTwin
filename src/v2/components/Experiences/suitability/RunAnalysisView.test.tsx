import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { RunAnalysisView, formatPercent, mergeBins, scoreColor } from './RunAnalysisView';
import type { SuitabilityRunAnalysis, SuitabilityRunRecord } from '../types';

const scoreShare = (counts: number[]) =>
  counts.map((count, index) => ({ score: index + 1, count, percent: count }));

const analysis: SuitabilityRunAnalysis = {
  type: 'suitability_run_analysis',
  run: 'demo',
  scale_max: 5,
  cell_size: 1000,
  cells: { total: 100, scored: 80, nodata: 20 },
  area_km2: { cell: 1, scored: 80 },
  stats: { min: 1, max: 5, mean: 2.4, median: 2.2, std: 0.9 },
  histogram: {
    bin_edges: [1, 2, 3, 4, 5],
    counts: [10, 40, 20, 10],
    percent: [12.5, 50, 25, 12.5],
    area_km2: [10, 40, 20, 10],
  },
  classes: [
    { score: 1, count: 10, percent: 12.5, area_km2: 10 },
    { score: 2, count: 40, percent: 50, area_km2: 40 },
  ],
  layers: [
    { index: 1, name: 'Drainage', weight: 4, type: 'categorical', weight_share: 57.1 },
    { index: 2, name: 'Erodibility', weight: 3, type: 'continuous', weight_share: 42.9 },
  ],
  bands: [
    { label: '1–2', min: 1, max: 2, max_inclusive: false, cells: 0, percent: 0, area_km2: 0, inputs: [] },
    {
      label: '4–5',
      min: 4,
      max: 5,
      max_inclusive: true,
      cells: 10,
      percent: 12.5,
      area_km2: 10,
      inputs: [
        {
          index: 1,
          name: 'Drainage',
          weight: 4,
          type: 'categorical',
          cells: 10,
          coverage_percent: 100,
          mean_score: 4.5,
          score_distribution: scoreShare([0, 0, 0, 50, 50]),
          values: [{ value: 6, count: 9, percent: 90 }],
          other: { classes: 2, count: 1, percent: 10 },
        },
        {
          index: 2,
          name: 'Erodibility',
          weight: 3,
          type: 'continuous',
          cells: 8,
          coverage_percent: 80,
          mean_score: 4.1,
          score_distribution: scoreShare([0, 10, 10, 40, 40]),
          value_stats: { min: 0.1, max: 0.4, mean: 0.3, median: 0.3, p10: 0.2, p90: 0.4 },
          value_histogram: { bin_edges: [0.1, 0.25, 0.4], counts: [2, 6], percent: [25, 75] },
        },
      ],
    },
  ],
};

const record = {
  name: 'demo',
  extent: 'sbcounty',
  extentLabel: 'Santa Barbara County',
  scaleMax: 5,
  layers: [
    {
      title: 'SSURGO Drainage Class',
      url: 'x',
      weight: 4,
      type: 'categorical',
      categoryLabels: { '6': 'Well drained' },
    },
    { title: 'Soil Erodibility', url: 'y', weight: 3, type: 'continuous' },
  ],
} as SuitabilityRunRecord;

describe('RunAnalysisView', () => {
  it('opens on the best band that has cells and names inputs from the run record', () => {
    const html = renderToStaticMarkup(<RunAnalysisView analysis={analysis} record={record} />);
    expect(html).toContain('Suitability 4–5');
    expect(html).toContain('SSURGO Drainage Class');
    expect(html).toContain('Well drained');
    expect(html).toContain('Soil Erodibility');
    expect(html).toContain('2 other classes');
  });

  it('merges fine histogram bins into contiguous, wider bars', () => {
    const edges = Array.from({ length: 17 }, (_, index) => 1 + index * 0.25);
    const counts = Array.from({ length: 16 }, (_, index) => (index % 2 === 0 ? 4 : 0));
    const percents = counts.map((count) => count);
    const bins = mergeBins(edges, counts, percents, 8);
    expect(bins).toHaveLength(8);
    expect(bins[0]).toMatchObject({ low: 1, high: 1.5, count: 4 });
    expect(bins[7].high).toBe(5);
    expect(bins.reduce((sum, bin) => sum + bin.count, 0)).toBe(32);
    expect(mergeBins([0, 1, 2], [3, 4], [30, 40], 8)).toHaveLength(2);
  });

  it('renders collapsible sections that start open', () => {
    const html = renderToStaticMarkup(<RunAnalysisView analysis={analysis} record={record} />);
    expect(html).toContain('aria-expanded="true"');
    expect(html).toContain('Suitability distribution');
  });

  it('draws the overall distribution as one bar per whole-point band', () => {
    const html = renderToStaticMarkup(<RunAnalysisView analysis={analysis} record={record} />);
    // The fixture has two bands, so two bars labelled by their score interval.
    const barLabels = html.match(/<span class="min-w-0 flex-1 truncate text-center tabular-nums">[^<]+<\/span>/g);
    expect(barLabels).toHaveLength(2);
    expect(barLabels?.[0]).toContain('1\u20132');
    expect(barLabels?.[1]).toContain('4\u20135');
  });

  it('falls back to service names without a run record', () => {
    const html = renderToStaticMarkup(<RunAnalysisView analysis={analysis} record={null} />);
    expect(html).toContain('Drainage');
  });

  it('formats percentages and ramp colors', () => {
    expect(formatPercent(null)).toBe('–');
    expect(formatPercent(0.04)).toBe('<0.1%');
    expect(formatPercent(45.2)).toBe('45%');
    expect(scoreColor(1, 5)).toBe('rgb(215, 25, 28)');
    expect(scoreColor(5, 5)).toBe('rgb(26, 150, 65)');
  });
});
