import type Layer from '@arcgis/core/layers/Layer';
import type { ActiveLayer, PinnedLayer } from '../../types';
import { useCatalog } from '../../context/CatalogContext';
import { registerTNCArcGISLayer } from '../../components/Map/layers';

export function useMotusMapBehavior(
  _getManagedLayer: (layerId: string) => Layer | undefined,
  _pinnedLayers: PinnedLayer[],
  _activeLayer: ActiveLayer | null,
  _mapReady: number,
) {
  const { layerMap } = useCatalog();

  // Register all concrete MOTUS ArcGIS layers during render so map effects
  // can resolve them in the same cycle as active/pinned layer state updates.
  for (const [layerId, layer] of layerMap.entries()) {
    const isServiceParent = !!(
      layer.catalogMeta?.isMultiLayerService &&
      !layer.catalogMeta?.parentServiceId &&
      layer.catalogMeta?.siblingLayers &&
      layer.catalogMeta.siblingLayers.length > 0
    );

    if (layer.dataSource !== 'motus' || isServiceParent) continue;
    registerTNCArcGISLayer(layerId, layer);
  }
}
