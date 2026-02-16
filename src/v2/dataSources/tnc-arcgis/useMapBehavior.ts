import type Layer from '@arcgis/core/layers/Layer';
import type { ActiveLayer, PinnedLayer } from '../../types';
import { useCatalog } from '../../context/CatalogContext';
import { registerTNCArcGISLayer } from '../../components/Map/layers';

export function useTNCArcGISMapBehavior(
  _getManagedLayer: (layerId: string) => Layer | undefined,
  _pinnedLayers: PinnedLayer[],
  _activeLayer: ActiveLayer | null,
  _mapReady: number,
) {
  const { layerMap } = useCatalog();

  // Register all concrete TNC ArcGIS layer IDs during render so map effects
  // can resolve them immediately in the same render cycle.
  for (const [layerId, layer] of layerMap.entries()) {
    const isServiceParent = !!(
      layer.catalogMeta?.isMultiLayerService &&
      !layer.catalogMeta?.parentServiceId &&
      layer.catalogMeta?.siblingLayers &&
      layer.catalogMeta.siblingLayers.length > 0
    );

    if (layer.dataSource !== 'tnc-arcgis' || isServiceParent) continue;
    registerTNCArcGISLayer(layerId, layer);
  }
}
