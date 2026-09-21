import type Layer from '@arcgis/core/layers/Layer';
import type { ActiveLayer, CatalogLayer } from '../../../../types';

export type DefinitionExpressionLayer = Layer & { definitionExpression?: string };
export type MapImageSublayerLike = { definitionExpression?: string };
export type MapImageLayerLike = Layer & {
  sublayers?: { getItemAt?: (index: number) => MapImageSublayerLike | undefined } | MapImageSublayerLike[];
};

export function normalizeWhereClause(whereClause?: string): string {
  const normalized = whereClause?.trim();
  return normalized ? normalized : '1=1';
}

export function getFirstMapImageSublayer(layer: Layer): MapImageSublayerLike | undefined {
  const mapImageLayer = layer as MapImageLayerLike;
  const sublayers = mapImageLayer.sublayers;
  if (!sublayers) return undefined;
  if (Array.isArray(sublayers)) return sublayers[0];
  if (typeof sublayers.getItemAt === 'function') return sublayers.getItemAt(0);
  return undefined;
}

export function getConcreteActiveLayerId(activeLayer: ActiveLayer | null, layerMap: Map<string, CatalogLayer>): string | null {
  if (!activeLayer) return null;
  if (!activeLayer.isService) return activeLayer.layerId;
  const serviceLayer = layerMap.get(activeLayer.layerId);
  const siblingLayers = serviceLayer?.catalogMeta?.siblingLayers ?? [];
  if (activeLayer.selectedSubLayerId && siblingLayers.some(sibling => sibling.id === activeLayer.selectedSubLayerId)) {
    return activeLayer.selectedSubLayerId;
  }
  // Dendra service parents: prefer Locations (station dots) by name. Creek
  // gauges publish Locations at layer 0; classic `_Datastreams` put Latest at 0.
  if (serviceLayer?.dataSource === 'dendra') {
    const locations = siblingLayers.find((sibling) => /location|station/i.test(sibling.name));
    if (locations) return locations.id;
  }
  return siblingLayers[0]?.id ?? null;
}
