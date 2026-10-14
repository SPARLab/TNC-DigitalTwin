// ============================================================================
// useTNCArcGISLegend — loads the legend for one TNC ArcGIS layer. Shared by the
// map legend widget and the layer info (Overview) panel so both show the same thing.
// ============================================================================

import { useEffect, useState } from 'react';
import { useLayers } from '../../../context/LayerContext';
import { useTNCArcGIS } from '../../../context/TNCArcGISContext';
import { fetchLayerLegend, type ArcGISLayerLegend } from '../../../services/tncArcgisService';
import type { CatalogLayer } from '../../../types';
import { getNhdPlusFlowlineLegend, isNhdPlusFlowlinesLayer } from '../../Map/layers/nhdPlusFlowlinesStyle';

/** The concrete layer a legend describes: a service's selected (or first) sub-layer. */
export function getLegendTargetLayer(
  activeLayer: CatalogLayer | undefined,
  selectedSubLayerId: string | undefined,
): CatalogLayer | null {
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

export interface TNCArcGISLegendState {
  legendData: ArcGISLayerLegend | null;
  legendLoading: boolean;
  legendError: string | null;
}

export function useTNCArcGISLegend(targetLayer: CatalogLayer | null): TNCArcGISLegendState {
  const [legendLoading, setLegendLoading] = useState(false);
  const [legendError, setLegendError] = useState<string | null>(null);
  const [legendData, setLegendData] = useState<ArcGISLayerLegend | null>(null);
  const { getPinnedByLayerId } = useLayers();
  const { imagerySliceSelection } = useTNCArcGIS();

  const imageryVariable = (
    imagerySliceSelection
    && imagerySliceSelection.layerId === targetLayer?.id
      ? imagerySliceSelection.variableName
      : getPinnedByLayerId(targetLayer?.id ?? '')?.tncArcgisFilters?.imageryVariable
  ) || undefined;

  useEffect(() => {
    let cancelled = false;
    async function loadLegend() {
      if (!targetLayer?.catalogMeta) {
        setLegendData(null);
        setLegendError('Legend unavailable: missing ArcGIS metadata.');
        return;
      }
      setLegendLoading(true);
      setLegendError(null);
      try {
        const legend = isNhdPlusFlowlinesLayer(targetLayer)
          ? getNhdPlusFlowlineLegend()
          : await fetchLayerLegend(targetLayer.catalogMeta, { variableName: imageryVariable });
        if (cancelled) return;
        setLegendData(legend);
        if (!legend || legend.items.length === 0) {
          setLegendError('No legend entries returned for this layer.');
        }
      } catch (error) {
        if (cancelled) return;
        setLegendData(null);
        setLegendError(error instanceof Error ? error.message : 'Legend fetch failed.');
      } finally {
        if (!cancelled) setLegendLoading(false);
      }
    }
    void loadLegend();
    return () => { cancelled = true; };
  }, [targetLayer, imageryVariable]);

  return { legendData, legendLoading, legendError };
}
