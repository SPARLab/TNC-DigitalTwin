import { describe, expect, it } from 'vitest';
import { continuousStretchOptions, stretchLegendFromRenderer } from './stretchLegend';

describe('stretchLegendFromRenderer', () => {
  it('reads a low-to-high algorithmic ramp', () => {
    expect(
      stretchLegendFromRenderer({
        type: 'raster-stretch',
        statistics: [{ min: 0.21, max: 0.48, avg: 0.3, stddev: 0.04 }],
        colorRamp: {
          fromColor: { r: 255, g: 255, b: 204 },
          toColor: [8, 48, 107],
        },
      }),
    ).toEqual({
      min: 0.21,
      max: 0.48,
      colors: ['rgb(255, 255, 204)', 'rgb(8, 48, 107)'],
    });
  });

  it('joins multipart ramps and ignores classified renderers', () => {
    expect(
      stretchLegendFromRenderer({
        type: 'raster-stretch',
        statistics: [{ min: 0, max: 1 }],
        colorRamp: {
          colorRamps: [
            { fromColor: [255, 255, 255], toColor: [120, 180, 80] },
            { fromColor: [120, 180, 80], toColor: [20, 60, 140] },
          ],
        },
      })?.colors,
    ).toEqual(['rgb(255, 255, 255)', 'rgb(120, 180, 80)', 'rgb(20, 60, 140)']);

    expect(stretchLegendFromRenderer({ type: 'raster-colormap' })).toBeNull();
  });

  it('reads the min-max range from customStatistics', () => {
    const options = continuousStretchOptions(0.2, 0.5);
    expect(options.customStatistics[0]).toMatchObject({ min: 0.2, max: 0.5 });
    expect(options.colorRamp.fromColor.slice(0, 3)).toEqual([219, 234, 254]);
    expect(options.colorRamp.toColor.slice(0, 3)).toEqual([109, 40, 217]);
    expect(
      stretchLegendFromRenderer({
        type: 'raster-stretch',
        customStatistics: options.customStatistics,
        colorRamp: {
          fromColor: options.colorRamp.fromColor,
          toColor: options.colorRamp.toColor,
        },
      }),
    ).toMatchObject({ min: 0.2, max: 0.5 });
  });
});
