import { useCallback, useEffect, useMemo, useState } from 'react';
import { ChevronDown, ChevronRight, Loader2 } from 'lucide-react';
import { useCatalog } from '../../../context/CatalogContext';
import { useLayers } from '../../../context/LayerContext';
import { fetchLayerLegend, type ArcGISLegendItem, type ArcGISLayerLegend } from '../../../services/tncArcgisService';
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

function LegendSwatch({ item, index }: { item: ArcGISLegendItem; index: number }) {
  const [imgFailed, setImgFailed] = useState(false);
  const handleError = useCallback(() => setImgFailed(true), []);

  const hasSrc = !imgFailed && (item.imageData || item.imageUrl);
  if (hasSrc) {
    return (
      <img
        id={`tnc-arcgis-legend-widget-swatch-image-${index}`}
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
      id={`tnc-arcgis-legend-widget-swatch-fallback-${index}`}
      className="w-3 h-3 rounded-full"
      style={{ backgroundColor: item.swatchColor || '#9ca3af' }}
    />
  );
}

function buildLegendWhereClause(field: string, selectedValues: Array<string | number>): string {
  if (!field.trim() || selectedValues.length === 0) return '1=1';
  const conditions = selectedValues.map(value => {
    if (typeof value === 'number') return `${field} = ${value}`;
    const escaped = value.replace(/'/g, "''");
    return `${field} = '${escaped}'`;
  });
  return conditions.length === 1 ? conditions[0] : `(${conditions.join(' OR ')})`;
}

export function TNCArcGISLegendWidget() {
  const [isExpanded, setIsExpanded] = useState(true);
  const [legendLoading, setLegendLoading] = useState(false);
  const [legendError, setLegendError] = useState<string | null>(null);
  const [legendData, setLegendData] = useState<ArcGISLayerLegend | null>(null);
  const [selectedLegendValues, setSelectedLegendValues] = useState<Array<string | number>>([]);

  const { activeLayer, syncTNCArcGISFilters, isLayerPinned } = useLayers();
  const { layerMap } = useCatalog();
  const activeCatalogLayer = activeLayer ? layerMap.get(activeLayer.layerId) : undefined;
  const targetLayer = useMemo(
    () => getTargetLayer(activeCatalogLayer, activeLayer?.selectedSubLayerId),
    [activeCatalogLayer, activeLayer?.selectedSubLayerId],
  );

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
        const legend = await fetchLayerLegend(targetLayer.catalogMeta);
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
  }, [targetLayer]);

  useEffect(() => {
    setSelectedLegendValues([]);
  }, [legendData?.layerId, targetLayer?.id]);

  const filterableLegendItems = useMemo(
    () => (legendData?.items ?? []).filter(
      item => typeof item.value === 'string' || typeof item.value === 'number',
    ),
    [legendData?.items],
  );

  const canFilterByLegend = !!(
    legendData
    && legendData.rendererType === 'uniqueValue'
    && legendData.filterField
    && filterableLegendItems.length > 0
  );

  useEffect(() => {
    if (!targetLayer || !canFilterByLegend || !legendData?.filterField) return;
    const whereClause = buildLegendWhereClause(legendData.filterField, selectedLegendValues);
    syncTNCArcGISFilters(
      targetLayer.id,
      { whereClause, fields: [] },
      undefined,
      activeLayer?.viewId,
    );
  }, [
    activeLayer?.viewId,
    canFilterByLegend,
    legendData?.filterField,
    selectedLegendValues,
    syncTNCArcGISFilters,
    targetLayer,
  ]);

  if (!activeLayer || activeLayer.dataSource !== 'tnc-arcgis' || !targetLayer) return null;

  const pinned = isLayerPinned(targetLayer.id);
  const toggleLegendValue = (value: string | number | undefined) => {
    if (value === undefined) return;
    setSelectedLegendValues(prev => (
      prev.includes(value)
        ? prev.filter(entry => entry !== value)
        : [...prev, value]
    ));
  };

  const selectAllLegendValues = () => {
    setSelectedLegendValues(filterableLegendItems.map(item => item.value!));
  };

  const clearLegendValues = () => {
    setSelectedLegendValues([]);
  };

  return (
    <div
      id="tnc-arcgis-legend-widget"
      className="absolute bottom-6 right-6 bg-white rounded-lg shadow-lg border border-gray-300 z-30 w-72"
    >
      <div
        id="tnc-arcgis-legend-widget-header"
        className="flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-gray-50 rounded-t-lg"
      >
        <div id="tnc-arcgis-legend-widget-header-left" className="flex items-center gap-2 min-w-0">
          <button
            id="tnc-arcgis-legend-widget-expand-toggle"
            type="button"
            onClick={() => setIsExpanded(prev => !prev)}
            className="p-0.5 hover:bg-gray-200 rounded transition-colors"
            aria-label={isExpanded ? 'Collapse legend' : 'Expand legend'}
          >
            {isExpanded
              ? <ChevronDown className="w-4 h-4 text-gray-600" />
              : <ChevronRight className="w-4 h-4 text-gray-600" />}
          </button>
          <h3 id="tnc-arcgis-legend-widget-title" className="text-sm font-semibold text-gray-900 truncate">
            Legend
          </h3>
          {legendLoading && <Loader2 id="tnc-arcgis-legend-widget-loading-spinner" className="w-4 h-4 animate-spin text-gray-500" />}
        </div>
        {canFilterByLegend && (
          <div id="tnc-arcgis-legend-widget-filter-actions" className="flex items-center gap-1.5">
            <button
              id="tnc-arcgis-legend-widget-select-all-button"
              type="button"
              onClick={selectAllLegendValues}
              className="rounded-md border border-gray-300 bg-white px-2 py-1 text-[11px] font-medium text-gray-700 hover:bg-gray-100"
            >
              Select All
            </button>
            <button
              id="tnc-arcgis-legend-widget-clear-all-button"
              type="button"
              onClick={clearLegendValues}
              className="rounded-md border border-gray-300 bg-white px-2 py-1 text-[11px] font-medium text-gray-700 hover:bg-gray-100"
            >
              Clear All
            </button>
          </div>
        )}
      </div>

      {isExpanded && (
        <div id="tnc-arcgis-legend-widget-content" className="p-2 space-y-2">
          <p
            id="tnc-arcgis-legend-widget-layer-name"
            className="text-xs text-gray-600 px-1 truncate font-medium"
            title={targetLayer.name}
          >
            {targetLayer.name}
          </p>

          {legendError ? (
            <div id="tnc-arcgis-legend-widget-error" className="px-2 py-2 text-sm text-amber-700">
              {legendError}
            </div>
          ) : (
            <div id="tnc-arcgis-legend-widget-items" className="space-y-1 max-h-[26rem] overflow-y-auto">
              {(legendData?.items ?? []).map((item, index) => (
                <div
                  id={`tnc-arcgis-legend-widget-item-${index}`}
                  key={`${legendData?.layerId ?? 'layer'}-legend-${index}`}
                  onClick={() => canFilterByLegend && toggleLegendValue(item.value)}
                  className={`flex items-center gap-2 rounded-md px-2 py-1.5 ${
                    canFilterByLegend ? 'cursor-pointer hover:bg-blue-50' : 'hover:bg-gray-50'
                  } ${
                    item.value !== undefined && selectedLegendValues.includes(item.value)
                      ? 'bg-blue-100 border border-blue-200'
                      : ''
                  }`}
                >
                  <div
                    id={`tnc-arcgis-legend-widget-swatch-${index}`}
                    className="w-7 h-7 border border-gray-200 rounded bg-white flex items-center justify-center flex-shrink-0 overflow-hidden"
                  >
                    <LegendSwatch item={item} index={index} />
                  </div>
                  <span
                    id={`tnc-arcgis-legend-widget-label-${index}`}
                    className="text-sm text-gray-700 truncate min-w-0"
                    title={item.label}
                  >
                    {item.label || `Legend item ${index + 1}`}
                  </span>
                  {item.value !== undefined && selectedLegendValues.includes(item.value) && (
                    <span
                      id={`tnc-arcgis-legend-widget-selected-indicator-${index}`}
                      className="ml-auto text-xs font-semibold text-blue-700"
                    >
                      Selected
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}

          {canFilterByLegend && (
            <p id="tnc-arcgis-legend-widget-filter-hint" className="px-1 text-[11px] text-gray-500">
              {pinned
                ? 'Legend selections update this layer filter.'
                : 'Pin this layer to apply legend selections to the map.'}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
