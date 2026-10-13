import { describe, expect, it } from 'vitest';
import {
  fetchRasterHistogram,
  histogramFromClassCounts,
  histogramFromCounts,
  histogramFromSamples,
  mergeBoundaryPolygons,
  pointInPolygon,
  sampleDimensions,
} from './rasterHistogram';

describe('histogramFromCounts', () => {
  it('builds equal-width bins and drops empty edges', () => {
    const histogram = histogramFromCounts(0, 100, [0, 10, 0, 30, 0], false);
    expect(histogram.total).toBe(40);
    expect(histogram.bins.map((bin) => bin.count)).toEqual([10, 0, 30]);
    expect(histogram.bins[0].min).toBeCloseTo(20);
    expect(histogram.bins[2].max).toBeCloseTo(80);
  });

  it('labels integer classes and drops empty ones', () => {
    const histogram = histogramFromCounts(11, 15, [4, 0, 9, 1], true);
    expect(histogram.bins.map((bin) => bin.label)).toEqual(['11', '13', '14']);
    expect(histogram.bins.map((bin) => bin.count)).toEqual([4, 9, 1]);
  });
});

describe('histogramFromClassCounts', () => {
  it('sorts classes and skips empty rows', () => {
    const histogram = histogramFromClassCounts([
      { value: 52, count: 10 },
      { value: 11, count: 0 },
      { value: 21, count: 4 },
    ]);
    expect(histogram.bins.map((bin) => bin.label)).toEqual(['21', '52']);
    expect(histogram.total).toBe(14);
  });
});

describe('mergeBoundaryPolygons', () => {
  it('combines rings from every feature', () => {
    const polygon = mergeBoundaryPolygons(
      [
        { geometry: { rings: [[[0, 0], [1, 0], [1, 1], [0, 0]]] } },
        { geometry: { rings: [[[2, 2], [3, 2], [3, 3], [2, 2]]] } },
        { geometry: null },
      ],
      3857,
    );
    expect(polygon?.rings).toHaveLength(2);
    expect(polygon?.spatialReference.wkid).toBe(3857);
  });

  it('returns null when the boundary has no rings', () => {
    expect(mergeBoundaryPolygons([{ geometry: {} }], 4326)).toBeNull();
  });
});

describe('pointInPolygon', () => {
  const square = [[[0, 0], [4, 0], [4, 4], [0, 4], [0, 0]]];

  it('includes points inside the ring and excludes the outside', () => {
    expect(pointInPolygon(2, 2, square)).toBe(true);
    expect(pointInPolygon(5, 2, square)).toBe(false);
  });
});

describe('histogramFromSamples', () => {
  it('counts only samples inside the boundary', () => {
    const values = [11, 99, 11, 99];
    const histogram = histogramFromSamples(values, 2, 2, {
      xmin: 0,
      ymin: 0,
      xmax: 2,
      ymax: 2,
    }, {
      categorical: true,
      rings: [[[0, 0], [1, 0], [1, 2], [0, 2], [0, 0]]],
      approximate: false,
    });
    expect(histogram.bins).toEqual([
      expect.objectContaining({ label: '11', count: 2 }),
    ]);
    expect(histogram.total).toBe(2);
  });
});

describe('fetchRasterHistogram', () => {
  it('uses the raster attribute table for a categorical full extent', async () => {
    const original = globalThis.fetch;
    globalThis.fetch = (async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes('rasterAttributeTable')) {
        return new Response(
          JSON.stringify({
            features: [
              { attributes: { Value: 52, Count: 2 } },
              { attributes: { Value: 11, Count: 5 } },
            ],
          }),
        );
      }
      throw new Error(`unexpected ${url}`);
    }) as typeof fetch;

    try {
      const histogram = await fetchRasterHistogram({
        url: 'https://example.com/test/NLCD/ImageServer',
        extent: 'full',
        scope: 'preserve',
        resolutionMeters: 100,
        categorical: true,
        token: null,
      });
      expect(histogram.bins.map((bin) => bin.label)).toEqual(['11', '52']);
      expect(histogram.total).toBe(7);
      expect(histogram.approximate).toBe(false);
    } finally {
      globalThis.fetch = original;
    }
  });
});

describe('sampleDimensions', () => {
  it('keeps native size under the sample cap', () => {
    expect(sampleDimensions(1000, 500, 100)).toEqual({
      width: 10,
      height: 5,
      approximate: false,
    });
  });

  it('scales down rasters that exceed the sample cap', () => {
    const sample = sampleDimensions(100_000, 100_000, 10);
    expect(sample.approximate).toBe(true);
    expect(sample.width * sample.height).toBeLessThanOrEqual(250_000 * 1.05);
  });
});
