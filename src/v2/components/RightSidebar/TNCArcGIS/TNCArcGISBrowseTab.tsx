import { useEffect, useMemo, useState } from 'react';
import { useCatalog } from '../../../context/CatalogContext';
import { useLayers } from '../../../context/LayerContext';
import { useTNCArcGIS } from '../../../context/TNCArcGISContext';
import { buildServiceUrl, queryFeatures } from '../../../services/tncArcgisService';
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
  const {
    loadSchema,
    getSchema,
    openTableOverlay,
    tableOverlayLayerId,
    isTableOverlayOpen,
    closeTableOverlay,
  } = useTNCArcGIS();
  const [rowCount, setRowCount] = useState<number | null>(null);
  const [summaryError, setSummaryError] = useState<string | null>(null);
  const [isSummaryLoading, setIsSummaryLoading] = useState(false);

  const activeCatalogLayer = activeLayer ? layerMap.get(activeLayer.layerId) : undefined;
  const targetLayer = useMemo(
    () => getTargetLayer(activeCatalogLayer, activeLayer?.selectedSubLayerId),
    [activeCatalogLayer, activeLayer?.selectedSubLayerId],
  );
  const schema = targetLayer ? getSchema(targetLayer.id) : undefined;
  const columns = useMemo(() => {
    if (!schema?.fields) return [];
    return schema.fields
      .map((field) => {
        const name = typeof field.name === 'string' ? field.name : '';
        return name.trim();
      })
      .filter((name) => !!name);
  }, [schema]);
  const isFeatureLayer = !!targetLayer?.catalogMeta?.hasFeatureServer;
  const isCurrentLayerTableOpen = isTableOverlayOpen && tableOverlayLayerId === targetLayer?.id;

  useEffect(() => {
    let cancelled = false;
    if (!targetLayer || !isFeatureLayer) {
      setRowCount(null);
      setSummaryError(null);
      setIsSummaryLoading(false);
      return;
    }

    setIsSummaryLoading(true);
    setSummaryError(null);

    const loadSummary = async () => {
      await loadSchema(targetLayer);
      if (!targetLayer.catalogMeta) return;
      const serviceUrl = buildServiceUrl(targetLayer.catalogMeta);
      const countResult = await queryFeatures(serviceUrl, '1=1', {
        returnCountOnly: true,
        returnGeometry: false,
      });
      if (cancelled) return;
      setRowCount(countResult.count);
    };

    loadSummary()
      .catch((error) => {
        if (cancelled) return;
        const message = error instanceof Error ? error.message : 'Unable to load table summary.';
        setSummaryError(message);
      })
      .finally(() => {
        if (cancelled) return;
        setIsSummaryLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [targetLayer, isFeatureLayer, loadSchema]);

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
      <div id="tnc-arcgis-browse-inspect-layer-card" className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 space-y-3">
        <div id="tnc-arcgis-browse-inspect-layer-header" className="space-y-1">
          <h3 id="tnc-arcgis-browse-inspect-layer-title" className="text-sm font-semibold text-emerald-900">
            Inspect Current Layer
          </h3>
          <p id="tnc-arcgis-browse-inspect-layer-subtitle" className="text-xs text-emerald-800">
            Open the ArcGIS table overlay to inspect records directly on the map.
          </p>
        </div>

        {isFeatureLayer ? (
          <div id="tnc-arcgis-browse-inspect-layer-summary" className="rounded-md border border-emerald-200 bg-white p-2.5">
            <dl id="tnc-arcgis-browse-inspect-layer-summary-grid" className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
              <div id="tnc-arcgis-browse-inspect-layer-observations-block">
                <dt id="tnc-arcgis-browse-inspect-layer-observations-label" className="text-gray-500">Rows</dt>
                <dd id="tnc-arcgis-browse-inspect-layer-observations-value" className="text-sm font-semibold text-gray-900">
                  {isSummaryLoading ? 'Loading...' : rowCount !== null ? rowCount.toLocaleString() : '—'}
                </dd>
              </div>
              <div id="tnc-arcgis-browse-inspect-layer-columns-block">
                <dt id="tnc-arcgis-browse-inspect-layer-columns-label" className="text-gray-500">Columns</dt>
                <dd id="tnc-arcgis-browse-inspect-layer-columns-value" className="text-sm font-semibold text-gray-900">
                  {columns.length.toLocaleString()}
                </dd>
              </div>
            </dl>

            {columns.length > 0 && (
              <p id="tnc-arcgis-browse-inspect-layer-columns-preview" className="mt-2 text-[11px] text-gray-600">
                {columns.slice(0, 5).join(', ')}
                {columns.length > 5 ? ` +${columns.length - 5} more` : ''}
              </p>
            )}

            {summaryError && (
              <p id="tnc-arcgis-browse-inspect-layer-summary-error" className="mt-2 text-[11px] text-amber-700">
                {summaryError}
              </p>
            )}
          </div>
        ) : (
          <p id="tnc-arcgis-browse-inspect-layer-non-feature-message" className="text-xs text-amber-800 rounded-md border border-amber-200 bg-amber-50 p-2">
            This layer is not a FeatureServer layer, so table inspection is unavailable.
          </p>
        )}

        <button
          id="tnc-arcgis-browse-open-table-overlay-button"
          type="button"
          onClick={() => {
            if (!targetLayer) return;
            if (isCurrentLayerTableOpen) {
              closeTableOverlay();
              return;
            }
            openTableOverlay(targetLayer.id);
          }}
          disabled={!isFeatureLayer}
          className="w-full py-2.5 rounded-lg border border-emerald-300 bg-white text-emerald-800 text-sm font-semibold hover:bg-emerald-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isCurrentLayerTableOpen ? 'Close Table Overlay' : 'Open Table Overlay'}
        </button>
      </div>

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
