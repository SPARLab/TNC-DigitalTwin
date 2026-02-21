import { useEffect, useMemo, useState } from 'react';
import { useCatalog } from '../../../context/CatalogContext';
import { useLayers } from '../../../context/LayerContext';
import { useTNCArcGIS } from '../../../context/TNCArcGISContext';
import { buildServiceUrl, queryFeatures } from '../../../services/tncArcgisService';
import { BrowseBackButton } from '../shared/BrowseBackButton';
import type { BrowseTabProps } from '../../../dataSources/types';
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

export function TNCArcGISBrowseTab({ showBackToOverview = false, onBackToOverview }: BrowseTabProps) {
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
  const serviceContextLayer = useMemo(() => {
    if (!activeCatalogLayer) return undefined;
    if (activeCatalogLayer.catalogMeta?.isMultiLayerService && !activeCatalogLayer.catalogMeta?.parentServiceId) {
      return activeCatalogLayer;
    }
    const parentServiceId = activeCatalogLayer.catalogMeta?.parentServiceId;
    if (!parentServiceId) return activeCatalogLayer;
    return layerMap.get(parentServiceId) ?? activeCatalogLayer;
  }, [activeCatalogLayer, layerMap]);
  const columnDefinitions = useMemo(() => {
    if (!schema?.fields) return [];
    return schema.fields
      .map((field) => {
        const name = typeof field.name === 'string' ? field.name.trim() : '';
        const type = typeof field.type === 'string' ? field.type.trim() : '';
        if (!name) return null;
        const readableType = type.startsWith('esriFieldType')
          ? type.replace('esriFieldType', '').toLowerCase()
          : (type || 'unknown');
        return { name, type: readableType };
      })
      .filter((field): field is { name: string; type: string } => !!field);
  }, [schema]);
  const isFeatureLayer = !!targetLayer?.catalogMeta?.hasFeatureServer;
  const isCurrentLayerTableOpen = isTableOverlayOpen && tableOverlayLayerId === targetLayer?.id;
  const featureServiceName = serviceContextLayer?.name || activeCatalogLayer?.name || 'Unknown service';
  const currentLayerName = targetLayer?.name || activeCatalogLayer?.name || 'Unknown layer';

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
      {/* Back button — shared component, same styling as Dendra */}
      {showBackToOverview && onBackToOverview && (
        <BrowseBackButton
          id="tnc-arcgis-browse-back-to-overview-button"
          label="Back to Layers"
          onClick={onBackToOverview}
        />
      )}

      {/* Layer context — current layer (primary) + feature service (secondary), gray bg */}
      <div id="tnc-arcgis-browse-layer-context-card" className="rounded-lg bg-gray-50 border border-gray-200 p-3">
        <dl id="tnc-arcgis-browse-layer-context-grid" className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
          <div id="tnc-arcgis-browse-layer-context-layer-block">
            <dt id="tnc-arcgis-browse-layer-context-layer-label" className="text-gray-500">Current layer</dt>
            <dd id="tnc-arcgis-browse-layer-context-layer-value" className="text-sm font-bold text-gray-900 leading-tight mt-0.5">
              {currentLayerName}
            </dd>
          </div>
          <div id="tnc-arcgis-browse-layer-context-service-block">
            <dt id="tnc-arcgis-browse-layer-context-service-label" className="text-gray-500">Feature service</dt>
            <dd id="tnc-arcgis-browse-layer-context-service-value" className="text-sm font-base text-gray-900 leading-tight mt-0.5">
              {featureServiceName}
            </dd>
          </div>
        </dl>
      </div>

      {/* Open Table Overlay action — positioned between context and snapshot */}
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
        className="w-full py-2.5 rounded-lg border border-emerald-300 bg-emerald-50 text-emerald-800 text-sm font-semibold hover:bg-emerald-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {isCurrentLayerTableOpen ? 'Close Table Overlay' : 'Open Table Overlay'}
      </button>

      {/* Table snapshot — rows, columns, full field list */}
      <div id="tnc-arcgis-browse-table-snapshot-card" className="rounded-lg border border-gray-200 bg-white p-3 space-y-3">
        <h3 id="tnc-arcgis-browse-table-snapshot-title" className="text-xs font-semibold uppercase tracking-wide text-gray-500">
          Table Snapshot
        </h3>

        {isFeatureLayer ? (
          <>
            <dl id="tnc-arcgis-browse-table-snapshot-grid" className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
              <div id="tnc-arcgis-browse-table-snapshot-rows-block">
                <dt id="tnc-arcgis-browse-table-snapshot-rows-label" className="text-gray-500">Rows</dt>
                <dd id="tnc-arcgis-browse-table-snapshot-rows-value" className="text-sm font-semibold text-gray-900">
                  {isSummaryLoading ? 'Loading...' : rowCount !== null ? rowCount.toLocaleString() : '—'}
                </dd>
              </div>
              <div id="tnc-arcgis-browse-table-snapshot-columns-block">
                <dt id="tnc-arcgis-browse-table-snapshot-columns-label" className="text-gray-500">Columns</dt>
                <dd id="tnc-arcgis-browse-table-snapshot-columns-value" className="text-sm font-semibold text-gray-900">
                  {columnDefinitions.length.toLocaleString()}
                </dd>
              </div>
            </dl>

            {columnDefinitions.length > 0 && (
              <div id="tnc-arcgis-browse-table-snapshot-fields-block" className="space-y-1.5">
                <p id="tnc-arcgis-browse-table-snapshot-fields-title" className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                  Fields ({columnDefinitions.length})
                </p>
                <ul id="tnc-arcgis-browse-table-snapshot-fields-list" className="space-y-1">
                  {columnDefinitions.map((field, index) => (
                    <li
                      id={`tnc-arcgis-browse-table-snapshot-field-${index}`}
                      key={`${field.name}-${index}`}
                      className="flex items-center justify-between gap-2 rounded border border-gray-200 bg-gray-50 px-2 py-1 text-[11px]"
                    >
                      <span id={`tnc-arcgis-browse-table-snapshot-field-name-${index}`} className="text-gray-800 truncate">
                        {field.name}
                      </span>
                      <span
                        id={`tnc-arcgis-browse-table-snapshot-field-type-${index}`}
                        className="inline-flex items-center rounded bg-white px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-gray-600 border border-gray-200 shrink-0"
                      >
                        {field.type}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {summaryError && (
              <p id="tnc-arcgis-browse-table-snapshot-error" className="text-[11px] text-amber-700">
                {summaryError}
              </p>
            )}
          </>
        ) : (
          <p id="tnc-arcgis-browse-table-snapshot-non-feature" className="text-xs text-amber-800 rounded-md border border-amber-200 bg-amber-50 p-2">
            This layer is not a FeatureServer layer, so table inspection is unavailable.
          </p>
        )}
      </div>
    </div>
  );
}
