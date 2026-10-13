import { describe, expect, it } from 'vitest';
import {
  bioclimMosaicTag,
  mosaicRuleForTag,
  mosaicRuleQueryValue,
  resolveMosaicRule,
} from './mosaicSelection';

describe('bioclimMosaicTag', () => {
  it('reads the short layer code and a titled bio variable', () => {
    expect(bioclimMosaicTag('bio13', 'Bio13 Precipitation amount')).toBe('bio13');
    expect(bioclimMosaicTag(null, 'Bio01 Mean Annual Air Temperature - Baseline')).toBe('bio01');
    expect(bioclimMosaicTag('bio1')).toBe('bio01');
  });

  it('ignores rasters that are not mosaic bioclim items', () => {
    expect(bioclimMosaicTag('SSURGO Soil Hydrologic Group', 'JLDP_Soil_Hydrologic_Group_10m')).toBeNull();
    expect(mosaicRuleForTag(null)).toBeNull();
  });

  it('falls back to a where clause when no object id is known', () => {
    const rule = mosaicRuleForTag('bio13');
    expect(rule?.method).toBe('none');
    if (rule?.method !== 'none') return;
    expect(rule.where).toContain("Tag = 'bio13'");
    expect(rule.where).toContain("Tag = 'Bio13'");
    const query = mosaicRuleQueryValue(rule);
    expect(query).toContain('esriMosaicNone');
  });

  it('locks the catalog object id for the requested variable', async () => {
    const original = globalThis.fetch;
    globalThis.fetch = (async (input: RequestInfo | URL) => {
      const url = String(input);
      const where = new URL(url).searchParams.get('where') ?? '';
      const features = where.includes("Tag = 'bio13'")
        ? [{ attributes: { OBJECTID: 42, Tag: 'bio13', Name: 'Bio13 Precipitation amount' } }]
        : [{ attributes: { OBJECTID: 1, Tag: 'bio01', Name: 'Bio01 Mean Annual Air Temperature' } }];
      return new Response(JSON.stringify({ features }));
    }) as typeof fetch;

    try {
      const rule = await resolveMosaicRule({
        rasterUrl: 'https://example.com/stack/ImageServer',
        tag: 'bio13',
        token: null,
      });
      expect(rule).toEqual({
        method: 'lock-raster',
        lockRasterIds: [42],
        operation: 'first',
      });
      expect(mosaicRuleQueryValue(rule)).toContain('esriMosaicLockRaster');
      expect(mosaicRuleQueryValue(rule)).toContain('42');
    } finally {
      globalThis.fetch = original;
    }
  });
});
