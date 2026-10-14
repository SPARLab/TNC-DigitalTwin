// ============================================================================
// TNCArcGISLegendBody — the legend entries themselves (swatches + labels, or a
// continuous color ramp). Used by the map legend widget, where entries can filter
// the layer, and by the layer info panel, where they are display-only.
// ============================================================================

import { useCallback, useState } from 'react';
import type { ArcGISLayerLegend, ArcGISLegendItem } from '../../../services/tncArcgisService';

function LegendSwatch({ item, index, idPrefix }: { item: ArcGISLegendItem; index: number; idPrefix: string }) {
  const [imgFailed, setImgFailed] = useState(false);
  const handleError = useCallback(() => setImgFailed(true), []);

  const hasSrc = !imgFailed && (item.imageData || item.imageUrl);
  if (hasSrc) {
    return (
      <img
        id={`${idPrefix}-swatch-image-${index}`}
        src={
          item.imageData
            ? `data:${item.contentType || 'image/png'};base64,${item.imageData}`
            : item.imageUrl
        }
        alt={item.label || `Legend ${index + 1}`}
        className="max-w-full max-h-full object-contain"
        onError={handleError}
      />
    );
  }
  return (
    <span
      id={`${idPrefix}-swatch-fallback-${index}`}
      className="w-5 h-1 rounded-full"
      style={{ backgroundColor: item.swatchColor || '#9ca3af' }}
    />
  );
}

interface TNCArcGISLegendBodyProps {
  /** Prefix for element ids, e.g. `tnc-arcgis-legend-widget`. */
  idPrefix: string;
  legendData: ArcGISLayerLegend | null;
  legendError: string | null;
  /** Legend entries act as filter toggles (map legend widget only). */
  canFilter?: boolean;
  selectedValues?: Array<string | number>;
  onToggleValue?: (value: string | number | undefined) => void;
  /** Let long labels wrap instead of being cut off with an ellipsis. */
  wrapLabels?: boolean;
  /** Tailwind max-height class for the scrolling entry list. */
  maxHeightClass?: string;
  /** Smaller swatches, text and spacing, for use inside a list row. */
  compact?: boolean;
}

export function TNCArcGISLegendBody({
  idPrefix,
  legendData,
  legendError,
  canFilter = false,
  selectedValues = [],
  onToggleValue,
  wrapLabels = false,
  maxHeightClass = 'max-h-[26rem]',
  compact = false,
}: TNCArcGISLegendBodyProps) {
  if (legendError) {
    return (
      <div id={`${idPrefix}-error`} className="px-2 py-2 text-sm text-amber-700">
        {legendError}
      </div>
    );
  }

  if (legendData?.rendererType === 'continuous' && legendData.gradientCss) {
    return (
      <div id={`${idPrefix}-ramp`} className="px-1 py-1 space-y-2">
        <p className="text-[11px] text-gray-500">{legendData.rampTitle ?? 'Value'}</p>
        <div
          id={`${idPrefix}-gradient`}
          className="h-3 w-full rounded-full border border-gray-200"
          style={{ background: legendData.gradientCss }}
        />
        <div className="flex justify-between text-[11px] text-gray-600">
          <span>{legendData.rampLowLabel ?? 'Low'}</span>
          <span>{legendData.rampHighLabel ?? 'High'}</span>
        </div>
        {legendData.items.filter(item => item.label.toLowerCase().includes('no ')).map((item, index) => (
          <div
            id={`${idPrefix}-nodata-${index}`}
            key={`nodata-${index}`}
            className="flex items-center gap-2 pt-1"
          >
            <span
              className="w-5 h-0.5 rounded-full"
              style={{ backgroundColor: item.swatchColor || '#9ca3af' }}
            />
            <span className="text-xs text-gray-600">{item.label}</span>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div id={`${idPrefix}-items`} className={`space-y-1 overflow-y-auto ${maxHeightClass}`}>
      {(legendData?.items ?? []).map((item, index) => (
        <div
          id={`${idPrefix}-item-${index}`}
          key={`${legendData?.layerId ?? 'layer'}-legend-${index}`}
          onClick={() => canFilter && onToggleValue?.(item.value)}
          className={`flex items-center gap-2 rounded-md px-2 ${compact ? 'py-0.5' : 'py-1.5'} border border-transparent ${
            canFilter ? 'cursor-pointer hover:bg-blue-50' : 'hover:bg-gray-50'
          } ${
            item.value !== undefined && selectedValues.includes(item.value)
              ? 'bg-blue-100 border-blue-200'
              : ''
          }`}
        >
          <div
            id={`${idPrefix}-swatch-${index}`}
            className={`${compact ? 'w-5 h-5' : 'w-7 h-7'} border border-gray-200 rounded bg-white flex items-center justify-center flex-shrink-0 overflow-hidden`}
          >
            <LegendSwatch item={item} index={index} idPrefix={idPrefix} />
          </div>
          <span
            id={`${idPrefix}-label-${index}`}
            className={`${compact ? 'text-xs' : 'text-sm'} text-gray-700 min-w-0 ${wrapLabels ? 'break-words' : 'truncate'}`}
            title={item.label}
          >
            {item.label || `Legend item ${index + 1}`}
          </span>
        </div>
      ))}
    </div>
  );
}
