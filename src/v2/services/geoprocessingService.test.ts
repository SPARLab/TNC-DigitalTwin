import { describe, expect, it } from 'vitest';
import { parseRunAnalysis, pickRasterDisplayTitle } from './geoprocessingService';

describe('pickRasterDisplayTitle', () => {
  it('prefers curated layer_name over service-style raster titles', () => {
    expect(
      pickRasterDisplayTitle({
        title: 'JLDP_Soil_Hydrologic_Group_10m',
        layer_name: 'SSURGO Soil Hydrologic Group',
        dataset_id: 247,
      }),
    ).toBe('SSURGO Soil Hydrologic Group');
  });

  it('keeps band-specific raster titles when layer_name is a short code', () => {
    expect(
      pickRasterDisplayTitle({
        title: 'Bio01 Mean Annual Air Temperature - Baseline - 1981-2010',
        layer_name: 'bio01',
        dataset_id: 319,
      }),
    ).toBe('Bio01 Mean Annual Air Temperature - Baseline - 1981-2010');
  });

  it('falls back to dataset display_title for slug-only raster titles', () => {
    const titles = new Map([[100, 'NLCD Land Cover']]);
    expect(
      pickRasterDisplayTitle(
        {
          title: 'JLDP_NLCD_LandCover_30m',
          layer_name: null,
          dataset_id: 100,
        },
        titles,
      ),
    ).toBe('NLCD Land Cover');
  });

  it('falls back to raster title when nothing else is available', () => {
    expect(
      pickRasterDisplayTitle({
        title: 'JLDP_NLCD_LandCover_30m',
        layer_name: null,
        dataset_id: null,
      }),
    ).toBe('JLDP_NLCD_LandCover_30m');
  });
});

describe('parseRunAnalysis', () => {
  const analysis = {
    type: 'suitability_run_analysis',
    scale_max: 5,
    cells: { total: 10, scored: 8, nodata: 2 },
    histogram: { bin_edges: [1, 5], counts: [8], percent: [100], area_km2: [8] },
    bands: [],
    layers: [],
    classes: [],
  };

  it('reads the tool JSON string', () => {
    expect(parseRunAnalysis(JSON.stringify(analysis))?.scale_max).toBe(5);
  });

  it('accepts an already parsed object', () => {
    expect(parseRunAnalysis(analysis)?.cells.scored).toBe(8);
  });

  it('rejects other payloads', () => {
    expect(parseRunAnalysis('not json')).toBeNull();
    expect(parseRunAnalysis(null)).toBeNull();
    expect(parseRunAnalysis(JSON.stringify({ ...analysis, type: 'suitability_summary' }))).toBeNull();
    expect(parseRunAnalysis(JSON.stringify({ type: 'suitability_run_analysis' }))).toBeNull();
  });
});