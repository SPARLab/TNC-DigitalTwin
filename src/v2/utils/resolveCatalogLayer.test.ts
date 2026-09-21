import { describe, expect, it } from 'vitest';
import type { CatalogLayer } from '../types';
import {
  matchesPreference,
  resolveCatalogLayerForDataset,
  resolveHistoricalCatalogLayer,
} from './resolveCatalogLayer';

function child(
  datasetId: number,
  layerIdInService: number,
  name: string,
  parentServiceId: string,
): CatalogLayer {
  return {
    id: `service-${datasetId}-layer-${layerIdInService}`,
    name,
    categoryId: 'cat',
    dataSource: 'dendra',
    icon: 'Thermometer',
    catalogMeta: {
      datasetId,
      serverBaseUrl: 'https://example.com/server/rest/services',
      servicePath: `Service_${datasetId}`,
      hasFeatureServer: true,
      hasMapServer: false,
      hasImageServer: false,
      layerIdInService,
      isMultiLayerService: true,
      parentServiceId,
      catalogTag: 'dendra_format',
    },
  };
}

function buildService(datasetId: number, layers: Array<{ id: number; name: string }>) {
  const parentId = `service-${datasetId}`;
  const siblings = layers.map((layer) => child(datasetId, layer.id, layer.name, parentId));
  for (const sibling of siblings) {
    sibling.catalogMeta!.siblingLayers = siblings.filter((entry) => entry.id !== sibling.id);
  }
  const parent: CatalogLayer = {
    id: parentId,
    name: `Service ${datasetId}`,
    categoryId: 'cat',
    dataSource: 'dendra',
    icon: 'Thermometer',
    catalogMeta: {
      datasetId,
      serverBaseUrl: 'https://example.com/server/rest/services',
      servicePath: `Service_${datasetId}`,
      hasFeatureServer: true,
      hasMapServer: false,
      hasImageServer: false,
      isMultiLayerService: true,
      siblingLayers: siblings,
      catalogTag: 'dendra_format',
    },
  };
  const layerMap = new Map<string, CatalogLayer>();
  layerMap.set(parent.id, parent);
  for (const sibling of siblings) layerMap.set(sibling.id, sibling);
  return { layerMap, siblings };
}

describe('resolveCatalogLayer preference matching', () => {
  it('matches Latest / Locations by name even when ids are swapped', () => {
    const locations = child(1, 0, 'Discharge Locations', 'service-1');
    const latest = child(1, 1, 'Discharge Latest', 'service-1');

    expect(matchesPreference(locations, 'locations')).toBe(true);
    expect(matchesPreference(locations, 'latest')).toBe(false);
    expect(matchesPreference(latest, 'latest')).toBe(true);
    expect(matchesPreference(latest, 'locations')).toBe(false);
  });

  it('resolves creek-style services (Locations=0, Latest=1)', () => {
    const { layerMap, siblings } = buildService(286, [
      { id: 0, name: 'Discharge Locations' },
      { id: 1, name: 'Discharge Latest' },
    ]);

    expect(resolveCatalogLayerForDataset(layerMap, 286, 'locations')?.id).toBe(siblings[0].id);
    expect(resolveCatalogLayerForDataset(layerMap, 286, 'latest')?.id).toBe(siblings[1].id);
    expect(resolveHistoricalCatalogLayer(layerMap, 286)?.id).toBe(siblings[0].id);
  });

  it('resolves classic `_Datastreams` services (Latest=0, Locations=1)', () => {
    const { layerMap, siblings } = buildService(184, [
      { id: 0, name: 'Rainfall Latest' },
      { id: 1, name: 'Rainfall Locations' },
    ]);

    expect(resolveCatalogLayerForDataset(layerMap, 184, 'latest')?.id).toBe(siblings[0].id);
    expect(resolveCatalogLayerForDataset(layerMap, 184, 'locations')?.id).toBe(siblings[1].id);
    expect(resolveHistoricalCatalogLayer(layerMap, 184)?.id).toBe(siblings[1].id);
  });
});
