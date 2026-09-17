import { describe, expect, it } from 'vitest';
import { isTiledImageServerUrl } from './tncArcgisLayer';

describe('isTiledImageServerUrl', () => {
  it('detects Living Atlas tiled ImageServer hosts', () => {
    expect(
      isTiledImageServerUrl(
        'https://tiledimageservices.arcgis.com/P3ePLMYs2RVChkJx/arcgis/rest/services/CHELSA_Bioclimate_Projections__Isothermality__Bio3_/ImageServer',
      ),
    ).toBe(true);
    expect(
      isTiledImageServerUrl(
        'https://tiledimageservices7.arcgis.com/org/arcgis/rest/services/SomeLayer/ImageServer',
      ),
    ).toBe(true);
  });

  it('rejects dynamic ImageServers and MapServers', () => {
    expect(
      isTiledImageServerUrl(
        'https://dangermondpreserve-spatial.com/image/rest/services/Hosted/full_env_1980_2010_stack/ImageServer',
      ),
    ).toBe(false);
    expect(
      isTiledImageServerUrl(
        'https://services.arcgis.com/P3ePLMYs2RVChkJx/arcgis/rest/services/World_Street_Map/MapServer',
      ),
    ).toBe(false);
  });
});
