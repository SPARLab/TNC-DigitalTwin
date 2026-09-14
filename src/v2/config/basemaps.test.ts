import { describe, expect, it } from 'vitest';
import { isBasemapId, resolveBasemap } from './basemaps';

describe('resolveBasemap', () => {
  it('uses topo in 2D and satellite in 3D until the user picks one', () => {
    expect(resolveBasemap(null, '2d')).toBe('topo-vector');
    expect(resolveBasemap(null, '3d')).toBe('satellite');
  });

  it('keeps an explicit choice across 2D and 3D', () => {
    expect(resolveBasemap('dark-gray-vector', '2d')).toBe('dark-gray-vector');
    expect(resolveBasemap('dark-gray-vector', '3d')).toBe('dark-gray-vector');
  });
});

describe('isBasemapId', () => {
  it('accepts known Esri basemap ids', () => {
    expect(isBasemapId('dark-gray-vector')).toBe(true);
    expect(isBasemapId('hybrid')).toBe(false);
    expect(isBasemapId(null)).toBe(false);
  });
});
