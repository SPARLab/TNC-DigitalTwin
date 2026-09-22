import { describe, expect, it } from 'vitest';
import type { CatalogLayer } from '../types';
import {
  expandDendraFormatChildren,
  isWithinDendraLatestActiveWindow,
  measureFieldsFromLatestMeta,
} from './dendraCatalogExpand';

function baseChild(id: string, name: string, layerIdInService: number): CatalogLayer {
  return {
    id,
    name,
    categoryId: 'cat',
    dataSource: 'dendra',
    icon: 'Thermometer',
    catalogMeta: {
      datasetId: 1,
      serverBaseUrl: 'https://example.com/server/rest/services',
      servicePath: 'Groundwater',
      hasFeatureServer: true,
      hasMapServer: false,
      hasImageServer: false,
      layerIdInService,
      isMultiLayerService: true,
      parentServiceId: 'service-1',
      catalogTag: 'dendra_format',
    },
  };
}

describe('dendraCatalogExpand', () => {
  it('extracts numeric measure fields from Latest metadata', () => {
    expect(measureFieldsFromLatestMeta({
      fields: [
        { name: 'station_id', type: 'esriFieldTypeOID' },
        { name: 'latitude', type: 'esriFieldTypeDouble' },
        { name: 'depth_to_groundwater', type: 'esriFieldTypeDouble' },
        { name: 'groundwater_elevation', type: 'esriFieldTypeDouble' },
        { name: 'category', type: 'esriFieldTypeString' },
      ],
    })).toEqual(['depth_to_groundwater', 'groundwater_elevation']);
  });

  it('expands Latest/Locations into Stations + measure rows', () => {
    const locations = baseChild('service-1-layer-1', 'Groundwater Locations', 1);
    const latest = baseChild('service-1-layer-0', 'Groundwater Latest', 0);
    const children = expandDendraFormatChildren({
      parentId: 'service-1',
      locations,
      latest,
      measureFields: ['depth_to_groundwater', 'groundwater_elevation'],
      activeMeasureFields: new Set(['depth_to_groundwater']),
    });

    expect(children.map((child) => child.name)).toEqual([
      'Stations',
      'Depth To Groundwater',
      'Groundwater Elevation',
    ]);
    expect(children[0].catalogMeta?.dendraRole).toBe('stations');
    expect(children[1].catalogMeta?.valueField).toBe('depth_to_groundwater');
    expect(children[1].catalogMeta?.isInactive).toBe(false);
    expect(children[2].catalogMeta?.isInactive).toBe(true);
    expect(children[1].catalogMeta?.layerIdInService).toBe(0);
    expect(children[2].catalogMeta?.layerIdInService).toBe(0);
    expect(children[1].catalogMeta?.siblingLayers?.map((sibling) => sibling.id)).toEqual([
      'service-1-stations',
      'service-1-measure-groundwater_elevation',
    ]);
  });

  it('treats missing latest_time as outside the active window', () => {
    expect(isWithinDendraLatestActiveWindow(null)).toBe(false);
    expect(isWithinDendraLatestActiveWindow(Date.now())).toBe(true);
    expect(isWithinDendraLatestActiveWindow(Date.now() - 8 * 24 * 60 * 60 * 1000)).toBe(false);
  });
});
