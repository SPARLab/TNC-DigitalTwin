import { describe, expect, it } from 'vitest';
import type { CatalogLayer } from '../types';
import { resolveDendraSidebarPanelKey } from './resolveDendraServiceTitle';

function dendraChild(id: string, parentServiceId: string): CatalogLayer {
  return {
    id,
    name: id.includes('latest') ? 'Discharge Latest' : 'Discharge Locations',
    categoryId: 'cat',
    dataSource: 'dendra',
    icon: 'Thermometer',
    catalogMeta: {
      datasetId: 1,
      serverBaseUrl: 'https://example.com/server/rest/services',
      servicePath: 'Discharge',
      hasFeatureServer: true,
      hasMapServer: false,
      hasImageServer: false,
      parentServiceId,
      catalogTag: 'dendra_format',
    },
  };
}

describe('resolveDendraSidebarPanelKey', () => {
  it('shares one key for Latest and Locations siblings', () => {
    const parentId = 'service-99';
    const latest = dendraChild('service-99-layer-1', parentId);
    const locations = dendraChild('service-99-layer-0', parentId);
    const layerMap = new Map<string, CatalogLayer>([
      [latest.id, latest],
      [locations.id, locations],
    ]);

    expect(resolveDendraSidebarPanelKey(layerMap, latest.id)).toBe(parentId);
    expect(resolveDendraSidebarPanelKey(layerMap, locations.id)).toBe(parentId);
  });

  it('falls back to layer id when parentServiceId is missing', () => {
    const layer: CatalogLayer = {
      id: 'dataset-10',
      name: 'Weather Stations',
      categoryId: 'cat',
      dataSource: 'dendra',
      icon: 'Thermometer',
    };
    const layerMap = new Map([[layer.id, layer]]);
    expect(resolveDendraSidebarPanelKey(layerMap, layer.id)).toBe(layer.id);
  });

  it('returns null for non-dendra layers', () => {
    const layer: CatalogLayer = {
      id: 'drone-1',
      name: 'Flight',
      categoryId: 'cat',
      dataSource: 'drone',
      icon: 'Plane',
    };
    const layerMap = new Map([[layer.id, layer]]);
    expect(resolveDendraSidebarPanelKey(layerMap, layer.id)).toBeNull();
  });
});
