// ============================================================================
// LayerRowLegend — the layer's legend entries, shown inside its row in the Map
// Layers list while the layer is on the map. Only TNC ArcGIS layers have a
// fetchable legend here; other data sources keep their own legend widget.
// Quiet by design: nothing is shown while loading or if the legend is unavailable.
// ============================================================================

import { useCatalog } from '../../../context/CatalogContext';
import type { CatalogLayer } from '../../../types';
import { useLayerLegendsVisible } from './layerLegendsPreference';
import { TNCArcGISLegendBody } from '../TNCArcGISLegendWidget/TNCArcGISLegendBody';
import { useTNCArcGISLegend } from '../TNCArcGISLegendWidget/useTNCArcGISLegend';

function TNCArcGISRowLegend({ layer }: { layer: CatalogLayer }) {
  const { legendData, legendError } = useTNCArcGISLegend(layer);

  if (legendError || !legendData || legendData.items.length === 0) return null;

  return (
    <div
      id={`layer-row-legend-${layer.id}`}
      className="border-t border-gray-200/80 px-2 pb-2 pt-1.5"
      onClick={(event) => event.stopPropagation()}
    >
      <TNCArcGISLegendBody
        idPrefix={`layer-row-legend-${layer.id}`}
        legendData={legendData}
        legendError={null}
        wrapLabels
        compact
        maxHeightClass="max-h-40"
      />
    </div>
  );
}

interface LayerRowLegendProps {
  layerId: string;
  /** Whether the layer is currently drawn on the map. */
  isOnMap: boolean;
}

export function LayerRowLegend({ layerId, isOnMap }: LayerRowLegendProps) {
  const { layerMap } = useCatalog();
  const legendsVisible = useLayerLegendsVisible();
  const layer = layerMap.get(layerId);

  if (!legendsVisible || !isOnMap || !layer || layer.dataSource !== 'tnc-arcgis') return null;
  return <TNCArcGISRowLegend layer={layer} />;
}
