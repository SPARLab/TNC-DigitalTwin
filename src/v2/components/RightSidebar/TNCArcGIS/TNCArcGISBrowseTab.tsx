import { useMemo } from 'react';
import { useCatalog } from '../../../context/CatalogContext';
import { useLayers } from '../../../context/LayerContext';
import type { CatalogLayer } from '../../../types';

function getTargetLayer(activeLayer: CatalogLayer | undefined, selectedSubLayerId: string | undefined): CatalogLayer | null {
  if (!activeLayer) return null;
  const isServiceParent = !!(
    activeLayer.catalogMeta?.isMultiLayerService
    && !activeLayer.catalogMeta?.parentServiceId
    && activeLayer.catalogMeta?.siblingLayers
    && activeLayer.catalogMeta.siblingLayers.length > 0
  );

  if (!isServiceParent) return activeLayer;
  const siblings = activeLayer.catalogMeta?.siblingLayers ?? [];
  return siblings.find(layer => layer.id === selectedSubLayerId) ?? siblings[0] ?? null;
}

export function TNCArcGISBrowseTab() {
  const { activeLayer } = useLayers();
  const { layerMap } = useCatalog();

  const activeCatalogLayer = activeLayer ? layerMap.get(activeLayer.layerId) : undefined;
  const targetLayer = useMemo(
    () => getTargetLayer(activeCatalogLayer, activeLayer?.selectedSubLayerId),
    [activeCatalogLayer, activeLayer?.selectedSubLayerId],
  );

  if (!activeLayer || activeLayer.dataSource !== 'tnc-arcgis') {
    return (
      <div id="tnc-arcgis-browse-not-tnc-root" className="space-y-3">
        <p id="tnc-arcgis-browse-not-tnc-text" className="text-sm text-gray-600">
          Activate a TNC ArcGIS layer to view source details.
        </p>
      </div>
    );
  }

  if (!targetLayer) {
    return (
      <div id="tnc-arcgis-browse-no-target-root" className="space-y-3">
        <p id="tnc-arcgis-browse-no-target-text" className="text-sm text-gray-600">
          Select a specific service layer to view source details.
        </p>
      </div>
    );
  }

  return (
    <div id="tnc-arcgis-browse-tab" className="space-y-4">
      <div id="tnc-arcgis-browse-legend-location-card" className="rounded-lg border border-gray-200 bg-white p-3">
        <h3 id="tnc-arcgis-browse-legend-location-title" className="text-sm font-semibold text-gray-900">
          Legend
        </h3>
        <p id="tnc-arcgis-browse-legend-location-note" className="mt-1 text-xs text-gray-600">
          The legend appears as a floating widget in the map area (bottom-right).
        </p>
      </div>
    </div>
  );
}
