import { describe, expect, it } from 'vitest';
import {
  parseRunAnalysis,
  parseSdmCommonAreas,
  parseSdmComparison,
  parseSdmSummary,
  pickRasterDisplayTitle,
  tiffDownloadsFromMessages,
} from './geoprocessingService';

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
describe('SDM tool JSON', () => {
  const summary = { type: 'sdm_summary', run: 'Taxidea taxus', output_type: 'Binary' };
  const comparison = { type: 'sdm_comparison', output_type: 'Probability' };
  const common = { type: 'sdm_common_suitability', output_type: 'Binary' };

  it('reads an object (as the server returns it) or a JSON string', () => {
    expect(parseSdmSummary(summary)?.run).toBe('Taxidea taxus');
    expect(parseSdmSummary(JSON.stringify(summary))?.output_type).toBe('Binary');
    expect(parseSdmComparison(comparison)?.output_type).toBe('Probability');
    expect(parseSdmCommonAreas(JSON.stringify(common))?.output_type).toBe('Binary');
  });

  it('rejects the wrong tool, bad text and empty values', () => {
    expect(parseSdmSummary(comparison)).toBeNull();
    expect(parseSdmComparison(common)).toBeNull();
    expect(parseSdmCommonAreas(summary)).toBeNull();
    expect(parseSdmSummary('not json')).toBeNull();
    expect(parseSdmSummary(null)).toBeNull();
    expect(parseSdmSummary(7)).toBeNull();
  });
});

describe('tiffDownloadsFromMessages', () => {
  const message = (description: string) => ({ type: 'esriJobMessageTypeInformative', description });

  it('lists every published GeoTIFF with a plain label', () => {
    const downloads = tiffDownloadsFromMessages([
      message('Comparing a (A) with b (B)'),
      message('Public TIFF: arcgisoutput/SDM_Random_Forest_GPServer/j1_sdm_difference.tif'),
      message('Public TIFF: arcgisoutput/SDM_Random_Forest_GPServer/j1_sdm_threshold_change.tif'),
    ]);
    expect(downloads.map((item) => item.label)).toEqual(['Difference (B − A)', 'Threshold change']);
    expect(downloads[0].url).toMatch(/^https:\/\/.+\/rest\/directories\/arcgisoutput\/.+j1_sdm_difference\.tif$/);
  });

  it('skips repeats and anything that is not a TIFF', () => {
    const line = 'Public TIFF: arcgisoutput/SDM_Random_Forest_GPServer/j1_sdm_result.tif';
    expect(tiffDownloadsFromMessages([message(line), message(line)])).toHaveLength(1);
    expect(tiffDownloadsFromMessages([message('Public TIFF: arcgisoutput/x/j1.png')])).toEqual([]);
    expect(tiffDownloadsFromMessages([])).toEqual([]);
  });
});
