import { useEffect } from 'react';
import type Layer from '@arcgis/core/layers/Layer';
import type { ActiveLayer, PinnedLayer } from '../../types';
import { useCatalog } from '../../context/CatalogContext';
import { useTNCArcGIS } from '../../context/TNCArcGISContext';
import { registerTNCArcGISLayer } from '../../components/Map/layers';
import {
  applyImagerySliceToLayer,
  sliceSelectionFromFilters,
} from '../../utils/imagerySliceUtils';

export function useTNCArcGISMapBehavior(
  getManagedLayer: (layerId: string) => Layer | undefined,
  pinnedLayers: PinnedLayer[],
  activeLayer: ActiveLayer | null,
  mapReady: number,
) {
  const { layerMap } = useCatalog();
  const { imagerySliceSelection } = useTNCArcGIS();

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

  useEffect(() => {
    const appliedLayerIds = new Set<string>();

    // Prefer live picker selection (includes stretch stats).
    if (imagerySliceSelection) {
      applyImagerySliceToLayer(
        getManagedLayer(imagerySliceSelection.layerId),
        imagerySliceSelection,
      );
      appliedLayerIds.add(imagerySliceSelection.layerId);
    }

    for (const pinned of pinnedLayers) {
      if (appliedLayerIds.has(pinned.layerId)) continue;
      const catalogLayer = layerMap.get(pinned.layerId);
      if (!catalogLayer?.catalogMeta?.hasImageServer) continue;
      const fromPinned = sliceSelectionFromFilters(pinned.layerId, pinned.tncArcgisFilters);
      if (!fromPinned) continue;
      applyImagerySliceToLayer(getManagedLayer(pinned.layerId), fromPinned);
    }
  }, [
    pinnedLayers,
    imagerySliceSelection,
    getManagedLayer,
    layerMap,
    mapReady,
    activeLayer,
  ]);
}
