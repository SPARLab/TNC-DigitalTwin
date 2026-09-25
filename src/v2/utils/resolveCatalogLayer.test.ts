import { describe, expect, it } from 'vitest';
import type { CatalogLayer } from '../types';
import {
  matchesPreference,
  resolveCatalogLayerForDataset,
  resolveCatalogMeasureLayer,
  resolveHistoricalCatalogLayer,
} from './resolveCatalogLayer';

function child(
  datasetId: number,
  layerIdInService: number,
  name: string,
  parentServiceId: string,
  extras?: Partial<NonNullable<CatalogLayer['catalogMeta']>>,
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
      ...extras,
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
  return { layerMap, siblings, parent };
}

/** Stations + measure rows as produced by expandDendraFormatChildren. */
function buildExpandedService(
  datasetId: number,
  measures: Array<{ field: string; label: string }>,
) {
  const parentId = `service-${datasetId}`;
  const stations: CatalogLayer = {
    id: `${parentId}-stations`,
    name: 'Stations',
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
      layerIdInService: 0,
      isMultiLayerService: true,
      parentServiceId: parentId,
      catalogTag: 'dendra_format',
      dendraRole: 'stations',
    },
  };
  const measureLayers = measures.map((measure) => ({
    id: `${parentId}-measure-${measure.field}`,
    name: measure.label,
    categoryId: 'cat',
    dataSource: 'dendra' as const,
    icon: 'Thermometer',
    catalogMeta: {
      datasetId,
      serverBaseUrl: 'https://example.com/server/rest/services',
      servicePath: `Service_${datasetId}`,
      hasFeatureServer: true,
      hasMapServer: false,
      hasImageServer: false,
      layerIdInService: 1,
      isMultiLayerService: true,
      parentServiceId: parentId,
      catalogTag: 'dendra_format' as const,
      dendraRole: 'measure' as const,
      valueField: measure.field,
    },
  }));
  const siblings = [stations, ...measureLayers];
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
  return { layerMap, stations, measureLayers };
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

  it('opens the matching measure row when valueField is provided', () => {
    const { layerMap, stations, measureLayers } = buildExpandedService(286, [
      { field: 'discharge', label: 'Discharge' },
      { field: 'gauge_height', label: 'Gauge Height' },
      { field: 'water_temp', label: 'Water Temperature' },
    ]);

    expect(resolveCatalogMeasureLayer(layerMap, 286, 'gauge_height')?.id).toBe(
      measureLayers[1].id,
    );
    expect(resolveHistoricalCatalogLayer(layerMap, 286, 0, 'gauge_height')?.id).toBe(
      measureLayers[1].id,
    );
    expect(resolveHistoricalCatalogLayer(layerMap, 286, 0, 'discharge')?.name).toBe('Discharge');
    // No valueField → Stations (legacy historical default).
    expect(resolveHistoricalCatalogLayer(layerMap, 286)?.id).toBe(stations.id);
  });
});
