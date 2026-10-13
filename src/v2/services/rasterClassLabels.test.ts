import zlib from 'node:zlib';
import { describe, expect, it } from 'vitest';
import {
  filterLabelsToPresent,
  labelsFromLegend,
  samplePngCenterColor,
  swatchesFromLegend,
} from './rasterClassLabels';

function solidPng(width: number, height: number, red: number, green: number, blue: number): Uint8Array {
  const stride = 1 + width * 3;
  const raw = Buffer.alloc(stride * height);
  for (let row = 0; row < height; row += 1) {
    const start = row * stride;
    for (let column = 0; column < width; column += 1) {
      const index = start + 1 + column * 3;
      raw[index] = red;
      raw[index + 1] = green;
      raw[index + 2] = blue;
    }
  }
  const idat = zlib.deflateSync(raw);
  const chunk = (type: string, data: Buffer) => {
    const typeBytes = Buffer.from(type);
    const length = Buffer.alloc(4);
    length.writeUInt32BE(data.length);
    const crc = Buffer.alloc(4);
    crc.writeUInt32BE(zlib.crc32(Buffer.concat([typeBytes, data])));
    return Buffer.concat([length, typeBytes, data, crc]);
  };
  const header = Buffer.alloc(13);
  header.writeUInt32BE(width, 0);
  header.writeUInt32BE(height, 4);
  header[8] = 8;
  header[9] = 2;
  return new Uint8Array(Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk('IHDR', header),
    chunk('IDAT', idat),
    chunk('IEND', Buffer.alloc(0)),
  ]));
}

describe('filterLabelsToPresent', () => {
  const legend = {
    categories: { '11': 0, '12': 0, '42': 0 },
    labels: { '11': 'Open Water', '12': 'Perennial Snow/Ice', '42': 'Evergreen Forest' },
  };

  it('drops legend classes that have no pixels in the raster', () => {
    expect(filterLabelsToPresent(legend, new Set([11, 42]))).toEqual({
      categories: { '11': 0, '42': 0 },
      labels: { '11': 'Open Water', '42': 'Evergreen Forest' },
    });
  });

  it('keeps the full legend when class counts are unavailable', () => {
    expect(filterLabelsToPresent(legend, null)).toBe(legend);
    expect(filterLabelsToPresent(legend, new Set())).toBe(legend);
  });
});

describe('labelsFromLegend', () => {
  it('uses numeric legend values when the label is a class name', () => {
    const result = labelsFromLegend([
      { label: 'Forest', values: ['41'] },
      { label: 'Water', values: [11] },
    ]);
    expect(result?.labels).toEqual({ '41': 'Forest', '11': 'Water' });
  });

  it('maps USA NLCD legend names onto the land-cover codes', () => {
    const result = labelsFromLegend([
      { label: 'Open Water', values: ['Open Water'] },
      { label: 'Evergreen Forest', values: ['Evergreen Forest'] },
      { label: 'Mixed Forest', values: ['Mixed Forest'] },
      { label: 'Shrub/Scrub', values: ['Shrub/Scrub'] },
      { label: 'Developed Open Space', values: ['Developed Open Space'] },
      { label: 'Developed Low Intensity', values: ['Developed Low Intensity'] },
      { label: 'Developed Medium Intensity', values: ['Developed Medium Intensity'] },
      { label: 'Developed High Intensity', values: ['Developed High Intensity'] },
      { label: 'Grassland/Herbaceous', values: ['Grassland/Herbaceous'] },
      { label: 'Pasture/Hay', values: ['Pasture/Hay'] },
      { label: 'Cultivated Crops', values: ['Cultivated Crops'] },
      { label: 'Woody Wetlands', values: ['Woody Wetlands'] },
      { label: 'Emergent Herbaceous Wetlands', values: ['Emergent Herbaceous Wetlands'] },
    ]);
    expect(result?.labels['11']).toBe('Open Water');
    expect(result?.labels['42']).toBe('Evergreen Forest');
    expect(result?.labels['43']).toBe('Mixed Forest');
    expect(result?.labels['52']).toBe('Shrub/Scrub');
    expect(result?.labels['95']).toBe('Emergent Herbaceous Wetlands');
  });

  it('pairs NLCD names with the legend swatch color', () => {
    const swatches = swatchesFromLegend([
      { label: 'Open Water', values: ['Open Water'], color: [26, 91, 171] },
      { label: 'Evergreen Forest', values: ['Evergreen Forest'], color: [41, 86, 29] },
      { label: 'Mixed Forest', values: ['Mixed Forest'], color: [23, 128, 64] },
      { label: 'Shrub/Scrub', values: ['Shrub/Scrub'], color: [239, 207, 168] },
      { label: 'Developed Open Space', values: ['Developed Open Space'], color: [242, 152, 144] },
      { label: 'Developed Low Intensity', values: ['Developed Low Intensity'], color: [255, 107, 126] },
      { label: 'Developed Medium Intensity', values: ['Developed Medium Intensity'], color: [237, 2, 42] },
      { label: 'Developed High Intensity', values: ['Developed High Intensity'], color: [159, 6, 27] },
    ]);
    expect(swatches?.find((swatch) => swatch.value === 11)?.color).toEqual([26, 91, 171]);
    expect(swatches?.find((swatch) => swatch.value === 42)).toEqual({
      value: 42,
      label: 'Evergreen Forest',
      color: [41, 86, 29],
    });
  });

  it('reads the center color of a legend swatch', async () => {
    await expect(samplePngCenterColor(solidPng(4, 4, 26, 91, 171))).resolves.toEqual([26, 91, 171]);
  });

  it('ignores legends that are only pixel codes', () => {
    expect(labelsFromLegend([
      { label: '11', values: ['11'] },
      { label: '42', values: ['42'] },
    ])).toBeNull();
  });
});
