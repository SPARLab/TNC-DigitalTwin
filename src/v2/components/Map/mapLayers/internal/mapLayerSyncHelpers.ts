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
  // Dendra service parents: prefer Stations / Locations (station dots).
  if (serviceLayer?.dataSource === 'dendra') {
    const stations = siblingLayers.find((sibling) =>
      sibling.catalogMeta?.dendraRole === 'stations'
      || /location|station/i.test(sibling.name),
    );
    if (stations) return stations.id;
  }
  return siblingLayers[0]?.id ?? null;
}
