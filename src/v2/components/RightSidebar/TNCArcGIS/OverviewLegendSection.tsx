// ============================================================================
// OverviewLegendSection — the layer's legend (symbology), shown under the
// opacity control on the layer info page. Display-only: filtering by legend
// entry stays on the map legend widget.
// ============================================================================

import { Loader2 } from 'lucide-react';
import type { CatalogLayer } from '../../../types';
import { TNCArcGISLegendBody } from '../../FloatingWidgets/TNCArcGISLegendWidget/TNCArcGISLegendBody';
import { useTNCArcGISLegend } from '../../FloatingWidgets/TNCArcGISLegendWidget/useTNCArcGISLegend';

interface OverviewLegendSectionProps {
  targetLayer: CatalogLayer;
}

export function OverviewLegendSection({ targetLayer }: OverviewLegendSectionProps) {
  const { legendData, legendLoading, legendError } = useTNCArcGISLegend(targetLayer);

  return (
    <div id="tnc-arcgis-overview-legend-container" className="rounded-lg border border-gray-200 bg-white p-3">
      <div id="tnc-arcgis-overview-legend-header" className="flex items-center justify-between gap-3">
        <h4
          id="tnc-arcgis-overview-legend-title"
          className="text-xs font-semibold uppercase tracking-wide text-gray-600"
        >
          Legend
        </h4>
        {legendLoading && (
          <Loader2
            id="tnc-arcgis-overview-legend-loading-spinner"
            className="h-3.5 w-3.5 animate-spin text-gray-500"
            aria-label="Loading legend"
          />
        )}
      </div>

      <div className="mt-2">
        {legendLoading && !legendData ? null : (
          <TNCArcGISLegendBody
            idPrefix="tnc-arcgis-overview-legend"
            legendData={legendData}
            legendError={legendError}
            wrapLabels
            maxHeightClass="max-h-72"
          />
        )}
      </div>
    </div>
  );
}
