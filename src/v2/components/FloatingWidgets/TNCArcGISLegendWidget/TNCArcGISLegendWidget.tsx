import { useEffect, useMemo, useState, type KeyboardEvent } from 'react';
import { ChevronDown, ChevronRight, Loader2 } from 'lucide-react';
import { useCatalog } from '../../../context/CatalogContext';
import { useLayers } from '../../../context/LayerContext';
import { SelectAllClearAllActions } from '../../shared/SelectAllClearAllActions';
import { DraggableWidget } from '../shared/DraggableWidget';
import { LegendCloseButton } from '../shared/LegendCloseButton';
import { TNCArcGISLegendBody } from './TNCArcGISLegendBody';
import { getLegendTargetLayer, useTNCArcGISLegend } from './useTNCArcGISLegend';

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
  const [selectedLegendValues, setSelectedLegendValues] = useState<Array<string | number>>([]);

  const { activeLayer, syncTNCArcGISFilters, isLayerPinned, pinLayer, getPinnedByLayerId } = useLayers();
  const { layerMap } = useCatalog();
  const activeCatalogLayer = activeLayer ? layerMap.get(activeLayer.layerId) : undefined;
  const targetLayer = useMemo(
    () => getLegendTargetLayer(activeCatalogLayer, activeLayer?.selectedSubLayerId),
    [activeCatalogLayer, activeLayer?.selectedSubLayerId],
  );
  const { legendData, legendLoading, legendError } = useTNCArcGISLegend(targetLayer);

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
  const allLegendValuesSelected = canFilterByLegend
    && selectedLegendValues.length === filterableLegendItems.length;
  const noLegendValuesSelected = selectedLegendValues.length === 0;
  const pinned = targetLayer ? isLayerPinned(targetLayer.id) : false;

  useEffect(() => {
    if (!targetLayer || !canFilterByLegend || !legendData?.filterField) return;
    const whereClause = buildLegendWhereClause(legendData.filterField, selectedLegendValues);
    const existing = getPinnedByLayerId(targetLayer.id)?.tncArcgisFilters;
    syncTNCArcGISFilters(
      targetLayer.id,
      {
        whereClause,
        fields: [],
        imageryVariable: existing?.imageryVariable,
        imageryDimensionName: existing?.imageryDimensionName,
        imageryDimensionValue: existing?.imageryDimensionValue,
      },
      undefined,
      // Legend filtering is a map-level interaction, so keep the root
      // TNC ArcGIS filter state in sync (map layer definitionExpression reads root).
      undefined,
    );
  }, [
    canFilterByLegend,
    legendData?.filterField,
    pinned,
    selectedLegendValues,
    syncTNCArcGISFilters,
    targetLayer,
    getPinnedByLayerId,
  ]);

  if (!activeLayer || activeLayer.dataSource !== 'tnc-arcgis' || !targetLayer) return null;

  const ensurePinnedForLegendFiltering = () => {
    if (!pinned) {
      pinLayer(targetLayer.id);
    }
  };
  const toggleLegendValue = (value: string | number | undefined) => {
    if (value === undefined) return;
    ensurePinnedForLegendFiltering();
    setSelectedLegendValues(prev => (
      prev.includes(value)
        ? prev.filter(entry => entry !== value)
        : [...prev, value]
    ));
  };

  const selectAllLegendValues = () => {
    ensurePinnedForLegendFiltering();
    setSelectedLegendValues(filterableLegendItems.map(item => item.value!));
  };

  const clearLegendValues = () => {
    ensurePinnedForLegendFiltering();
    setSelectedLegendValues([]);
  };
  const toggleExpanded = () => setIsExpanded(prev => !prev);
  const handleHeaderKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      toggleExpanded();
    }
  };

  return (
    <DraggableWidget
      id="tnc-arcgis-legend-widget"
      className="absolute bottom-6 right-6 bg-white rounded-lg shadow-lg border border-gray-300 z-30 w-legend-widget max-w-legend-fit"
    >
      <div
        id="tnc-arcgis-legend-widget-header" data-drag-handle
        className={`flex items-center justify-between px-4 py-3 bg-gray-50 cursor-pointer ${
          isExpanded ? 'border-b border-gray-200 rounded-t-lg' : 'rounded-lg'
        }`}
        role="button"
        tabIndex={0}
        aria-expanded={isExpanded}
        aria-controls="tnc-arcgis-legend-widget-content"
        onClick={toggleExpanded}
        onKeyDown={handleHeaderKeyDown}
      >
        <div id="tnc-arcgis-legend-widget-header-left" className="flex items-center gap-2 min-w-0">
          <span
            id="tnc-arcgis-legend-widget-expand-toggle"
            className="p-0.5 rounded text-gray-600"
            aria-hidden="true"
          >
            {isExpanded
              ? <ChevronDown className="w-4 h-4 text-gray-600" />
              : <ChevronRight className="w-4 h-4 text-gray-600" />}
          </span>
          <h3 id="tnc-arcgis-legend-widget-title" className="text-sm font-semibold text-gray-900 truncate">
            Legend
          </h3>
          {legendLoading && <Loader2 id="tnc-arcgis-legend-widget-loading-spinner" className="w-4 h-4 animate-spin text-gray-500" />}
        </div>
        <div className="flex flex-shrink-0 items-center gap-1">
          {canFilterByLegend && (
            <SelectAllClearAllActions
              idPrefix="tnc-arcgis-legend-widget"
              onSelectAll={selectAllLegendValues}
              onClearAll={clearLegendValues}
              disableSelectAll={allLegendValuesSelected}
              disableClearAll={noLegendValuesSelected}
              stopPropagation
            />
          )}
          <LegendCloseButton id="tnc-arcgis-legend-widget-close-button" />
        </div>
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

          <TNCArcGISLegendBody
            idPrefix="tnc-arcgis-legend-widget"
            legendData={legendData}
            legendError={legendError}
            canFilter={canFilterByLegend}
            selectedValues={selectedLegendValues}
            onToggleValue={toggleLegendValue}
          />

          {canFilterByLegend && (
            <p id="tnc-arcgis-legend-widget-filter-hint" className="px-1 text-[11px] text-gray-500">
              {pinned
                ? 'Legend selections update this layer filter.'
                : 'Legend filtering will auto-pin this layer when you select an item.'}
            </p>
          )}
        </div>
      )}
    </DraggableWidget>
  );
}
