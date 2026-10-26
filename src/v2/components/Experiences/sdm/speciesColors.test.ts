import { describe, expect, it } from 'vitest';
import { SPECIES_COLORS, hexToRgba, speciesColorFor } from './speciesColors';

describe('speciesColorFor', () => {
  it('gives each species its own color and keeps it', () => {
    const assigned = new Map<string, number>();
    const bobcat = speciesColorFor(assigned, 'Lynx rufus');
    const fox = speciesColorFor(assigned, 'Urocyon cinereoargenteus');
    expect(bobcat).not.toBe(fox);
    expect(speciesColorFor(assigned, 'Lynx rufus')).toBe(bobcat);
    expect(speciesColorFor(assigned, 'Urocyon cinereoargenteus')).toBe(fox);
  });

  it('starts over after the last color', () => {
    const assigned = new Map<string, number>();
    SPECIES_COLORS.forEach((_, index) => speciesColorFor(assigned, `species ${index}`));
    expect(speciesColorFor(assigned, 'one more')).toBe(SPECIES_COLORS[0]);
  });
});

describe('hexToRgba', () => {
  it('reads the channels', () => {
    expect(hexToRgba('#2563eb', 0.5)).toEqual([37, 99, 235, 0.5]);
  });
});
