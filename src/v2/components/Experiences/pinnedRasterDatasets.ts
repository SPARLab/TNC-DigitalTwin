// ============================================================================
// Match catalog pinned layers to rasters via the original dataset id.
// Filters on those pins are ignored — only identity matters.
// ============================================================================

import type { CatalogLayer, PinnedLayer } from '../../types';

export function datasetIdsFromPinnedLayers(
  pinnedLayers: PinnedLayer[],
  layerMap: Map<string, CatalogLayer>,
): Set<number> {
  const ids = new Set<number>();

  for (const pinned of pinnedLayers) {
    const layer = layerMap.get(pinned.layerId);
    const metaId = layer?.catalogMeta?.datasetId;
    if (metaId != null) ids.add(metaId);

    const fromKey = /^dataset-(\d+)$/.exec(pinned.layerId);
    if (fromKey) ids.add(Number(fromKey[1]));

    for (const sibling of layer?.catalogMeta?.siblingLayers ?? []) {
      if (sibling.catalogMeta?.datasetId != null) {
        ids.add(sibling.catalogMeta.datasetId);
      }
    }
  }

  return ids;
}
