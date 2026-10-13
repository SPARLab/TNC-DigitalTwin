import { describe, expect, it } from 'vitest';
import type { CatalogRaster } from '../types';
import {
  findVariantForSelection,
  groupRastersIntoFamilies,
  rasterCoversAnalysis,
  rasterFamilyKey,
  retainCompatibleSelection,
} from './rasterFamilies';
import { resolutionForScopeChange } from './wizardCopy';

function raster(partial: Partial<CatalogRaster> & Pick<CatalogRaster, 'id' | 'title'>): CatalogRaster {
  return {
    url: `https://example.com/${partial.id}`,
    resolution: 30,
    scope: 'preserve',
    datasetId: partial.id,
    thematicCategory: 'Soils',
    units: 'category',
    valueMin: 1,
    valueMax: 4,
    ...partial,
  };
}

describe('rasterFamilies', () => {
  it('groups resolution variants of the same product', () => {
    const families = groupRastersIntoFamilies([
      raster({ id: 1, title: 'SSURGO Soil Hydrologic Group', resolution: 10, scope: 'preserve' }),
      raster({ id: 2, title: 'SSURGO Soil Hydrologic Group', resolution: 30, scope: 'preserve' }),
      raster({
        id: 3,
        title: 'SSURGO Soil Hydrologic Group',
        resolution: 1000,
        scope: 'sbcounty',
      }),
      raster({ id: 4, title: 'JLDP DTM 2018 10m', resolution: 10, thematicCategory: 'Terrain', units: 'm' }),
      raster({ id: 5, title: 'JLDP DTM 2018 30m', resolution: 30, thematicCategory: 'Terrain', units: 'm' }),
    ]);

    const soil = families.find((family) => family.title.includes('Hydrologic'));
    const dtm = families.find((family) => /dtm/i.test(family.title));

    expect(soil?.variants).toHaveLength(3);
    expect(dtm?.variants).toHaveLength(2);
    expect(rasterFamilyKey(raster({ id: 4, title: 'JLDP DTM 2018 10m' }))).toBe(
      rasterFamilyKey(raster({ id: 5, title: 'JLDP DTM 2018 30m' })),
    );
  });

  it('finds the variant matching extent and resolution', () => {
    const [family] = groupRastersIntoFamilies([
      raster({ id: 1, title: 'SSURGO Drainage Class', resolution: 10, scope: 'preserve' }),
      raster({ id: 2, title: 'SSURGO Drainage Class', resolution: 1000, scope: 'tricounty' }),
    ]);

    expect(findVariantForSelection(family, 'preserve', 10)?.id).toBe(1);
    expect(findVariantForSelection(family, 'preserve', 30)).toBeNull();
    expect(findVariantForSelection(family, 'tricounty', 1000)?.id).toBe(2);
  });

  it('allows wider extents to clip down to the analysis mask at the same resolution', () => {
    const families = groupRastersIntoFamilies([
      raster({ id: 1, title: 'NLCD Land Cover', resolution: 100, scope: 'preserve' }),
      raster({ id: 2, title: 'NLCD Land Cover', resolution: 100, scope: 'sbcounty' }),
      raster({ id: 3, title: 'NLCD Land Cover', resolution: 100, scope: 'tricounty' }),
      raster({ id: 4, title: 'CHELSA Bio01', resolution: 1000, scope: 'tricounty', thematicCategory: 'Climate' }),
    ]);
    const family = families.find((entry) => entry.title.includes('NLCD'));
    expect(family).toBeDefined();

    // Native preserve wins when several 100 m variants can cover it.
    expect(findVariantForSelection(family!, 'preserve', 100)?.id).toBe(1);
    expect(findVariantForSelection(family!, 'sbcounty', 100)?.id).toBe(2);
    expect(findVariantForSelection(family!, 'tricounty', 100)?.id).toBe(3);

    const climate = groupRastersIntoFamilies([
      raster({ id: 4, title: 'CHELSA Bio01', resolution: 1000, scope: 'tricounty', thematicCategory: 'Climate' }),
    ])[0];
    expect(findVariantForSelection(climate, 'preserve', 1000)?.id).toBe(4);
    expect(findVariantForSelection(climate, 'sbcounty', 1000)?.id).toBe(4);
    expect(findVariantForSelection(climate, 'tricounty', 100)).toBeNull();

    expect(rasterCoversAnalysis('tricounty', 'preserve', 1000, 1000)).toBe(true);
    expect(rasterCoversAnalysis('sbcounty', 'preserve', 100, 100)).toBe(true);
    expect(rasterCoversAnalysis('preserve', 'sbcounty', 100, 100)).toBe(false);
    expect(rasterCoversAnalysis('sbcounty', 'tricounty', 1000, 1000)).toBe(false);
  });

  it('keeps a covering raster and swaps to a wider variant when the mask grows', () => {
    const catalog = [
      raster({ id: 1, title: 'NLCD Land Cover', resolution: 100, scope: 'preserve' }),
      raster({ id: 2, title: 'NLCD Land Cover', resolution: 100, scope: 'sbcounty' }),
      raster({ id: 4, title: 'CHELSA Bio01', resolution: 1000, scope: 'tricounty', thematicCategory: 'Climate' }),
    ];

    const widened = retainCompatibleSelection(
      [catalog[0], catalog[2]],
      catalog,
      'sbcounty',
      100,
    );
    expect(widened.layers.map((layer) => layer.id)).toEqual([2]);
    expect(widened.idMap.get(1)).toBe(2);
    expect(widened.idMap.has(4)).toBe(false);

    const narrowed = retainCompatibleSelection([catalog[1], catalog[2]], catalog, 'preserve', 100);
    expect(narrowed.layers.map((layer) => layer.id)).toEqual([2]);
    expect(narrowed.idMap.get(2)).toBe(2);
    expect(narrowed.idMap.has(4)).toBe(false);
  });
});

describe('resolutionForScopeChange', () => {
  it('keeps the current cell size when the new mask publishes it', () => {
    expect(resolutionForScopeChange(100, 'sbcounty')).toBe(100);
    expect(resolutionForScopeChange(100, 'preserve')).toBe(100);
    expect(resolutionForScopeChange(30, 'sbcounty')).toBe(100);
  });
});
