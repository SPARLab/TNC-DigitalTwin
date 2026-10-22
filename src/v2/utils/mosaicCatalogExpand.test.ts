import { describe, expect, it } from 'vitest';
import type { CatalogLayer } from '../types';
import { rangeFromHistogramBins } from '../services/mosaicVariableRange';
import { mosaicRuleForTag } from '../services/mosaicSelection';
import {
  expandMosaicVariableChildren,
  isImageryMosaicCatalogTag,
  isMosaicVariableLayer,
} from './mosaicCatalogExpand';

function mosaicRow(): CatalogLayer {
  return {
    id: 'dataset-319',
    name: 'CHELSA V2.1 Bioclim - Baseline (1981-2010) [tricounty 1000m]',
    categoryId: 'cat',
    dataSource: 'tnc-arcgis',
    icon: 'Map',
    catalogMeta: {
      datasetId: 319,
      serverBaseUrl: 'https://example.com/image/rest/services',
      servicePath: 'Hosted/CHELSA_baseline_1981_2010',
      hasFeatureServer: false,
      hasMapServer: false,
      hasImageServer: true,
      catalogTag: 'imagery_mosaic',
    },
  };
}

describe('mosaicCatalogExpand', () => {
  it('recognizes the imagery_mosaic catalog tag', () => {
    expect(isImageryMosaicCatalogTag('imagery_mosaic')).toBe(true);
    expect(isImageryMosaicCatalogTag(' imagery_mosaic ')).toBe(true);
    expect(isImageryMosaicCatalogTag('dendra_format')).toBe(false);
    expect(isImageryMosaicCatalogTag(null)).toBe(false);
  });

  it('expands a mosaic row into one child per bioclim variable', () => {
    const children = expandMosaicVariableChildren({ parentId: 'service-319', parent: mosaicRow() });

    expect(children).toHaveLength(19);
    expect(children[0].id).toBe('service-319-mosaic-bio01');
    expect(children[0].name).toBe('Bio01 · Mean Annual Air Temperature');
    expect(children[11].catalogMeta).toMatchObject({
      parentServiceId: 'service-319',
      isMultiLayerService: true,
      mosaicTag: 'bio12',
      mosaicUnits: 'mm',
      datasetId: 319,
      hasImageServer: true,
    });
    expect(children.map((child) => child.name)).toEqual(
      [...children.map((child) => child.name)].sort((a, b) => a.localeCompare(b)),
    );
  });

  it('links each child to its siblings, excluding itself', () => {
    const children = expandMosaicVariableChildren({ parentId: 'service-319', parent: mosaicRow() });
    const first = children[0].catalogMeta?.siblingLayers ?? [];

    expect(first).toHaveLength(18);
    expect(first.some((sibling) => sibling.id === children[0].id)).toBe(false);
  });

  it('identifies mosaic variable rows but not the parent', () => {
    const parent = mosaicRow();
    const [child] = expandMosaicVariableChildren({ parentId: 'service-319', parent });

    expect(isMosaicVariableLayer(child)).toBe(true);
    expect(isMosaicVariableLayer(parent)).toBe(false);
  });

  it('filters a tag by Name as well as Tag, since published items carry Tag = Dataset', () => {
    const rule = mosaicRuleForTag('bio12');

    expect(rule).toMatchObject({ method: 'none' });
    expect(rule && 'where' in rule ? rule.where : '').toContain("Name LIKE '%bio12%'");
  });
});

describe('rangeFromHistogramBins', () => {
  const bin = (min: number, max: number, count: number) => ({ min, max, count, label: '' });

  it('spans the first to the last populated bin', () => {
    expect(rangeFromHistogramBins([bin(0, 1, 0), bin(1, 2, 5), bin(2, 3, 0), bin(3, 4, 2), bin(4, 5, 0)]))
      .toEqual({ min: 1, max: 4 });
  });

  it('returns null for empty or flat histograms', () => {
    expect(rangeFromHistogramBins([])).toBeNull();
    expect(rangeFromHistogramBins([bin(0, 1, 0)])).toBeNull();
    expect(rangeFromHistogramBins([bin(3, 3, 9)])).toBeNull();
  });
});
