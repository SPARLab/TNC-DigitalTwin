import { useEffect, useMemo, useRef, useState } from 'react';
import FeatureTable from '@arcgis/core/widgets/FeatureTable';
import FeatureLayer from '@arcgis/core/layers/FeatureLayer';
import { useMap } from '../../../context/MapContext';
import { useCatalog } from '../../../context/CatalogContext';
import { useTNCArcGIS } from '../../../context/TNCArcGISContext';
import { buildServiceUrl } from '../../../services/tncArcgisService';

type DefinitionExpressionLayer = __esri.Layer & { definitionExpression?: string };

function getLayerDefinitionExpression(layer: __esri.Layer | undefined): string | undefined {
  const expression = (layer as DefinitionExpressionLayer | undefined)?.definitionExpression;
  if (!expression || typeof expression !== 'string') return undefined;
  const trimmed = expression.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

export function TNCArcGISTableOverlay() {
  const { viewRef, mapReady } = useMap();
  const { layerMap } = useCatalog();
  const {
    tableOverlayLayerId,
    isTableOverlayOpen,
    closeTableOverlay,
  } = useTNCArcGIS();
  const tableContainerRef = useRef<HTMLDivElement | null>(null);
  const featureTableRef = useRef<FeatureTable | null>(null);
  const fallbackFeatureLayerRef = useRef<FeatureLayer | null>(null);
  const [tableError, setTableError] = useState<string | null>(null);

  const targetLayer = useMemo(
    () => (tableOverlayLayerId ? layerMap.get(tableOverlayLayerId) : undefined),
    [tableOverlayLayerId, layerMap],
  );

  useEffect(() => {
    if (!isTableOverlayOpen) return;
    const view = viewRef.current;
    const tableLayerId = tableOverlayLayerId;
    if (!view?.map || !tableContainerRef.current || !tableLayerId || !targetLayer?.catalogMeta) return;

    let cancelled = false;

    const mountFeatureTable = async () => {
      featureTableRef.current?.destroy();
      featureTableRef.current = null;
      fallbackFeatureLayerRef.current?.destroy();
      fallbackFeatureLayerRef.current = null;

      const map = view.map;
      if (!map) return;
      const mapLayer = map.findLayerById(`v2-${tableLayerId}`) ?? map.findLayerById(tableLayerId);
      let tableLayer: FeatureLayer | null = null;

      // Always use a dedicated table layer instance so FeatureTable lifecycle
      // never mutates/destroys the live map layer.
      try {
        const serviceUrl = buildServiceUrl(targetLayer.catalogMeta);
        const fallbackLayer = new FeatureLayer({
          id: `v2-table-overlay-${tableLayerId}`,
          url: serviceUrl,
          outFields: ['*'],
          definitionExpression: getLayerDefinitionExpression(mapLayer ?? undefined),
        });
        await fallbackLayer.load();
        fallbackFeatureLayerRef.current = fallbackLayer;
        tableLayer = fallbackLayer;
      } catch {
        tableLayer = null;
      }

      if (!tableLayer) {
        if (!cancelled) {
          setTableError('Unable to load table rows for this layer.');
        }
        return;
      }

      if (cancelled) return;
      setTableError(null);
      featureTableRef.current = new FeatureTable({
        container: tableContainerRef.current as HTMLDivElement,
        layer: tableLayer,
        view,
        visibleElements: {
          menuItems: {
            clearSelection: true,
            refreshData: true,
            toggleColumns: true,
          },
        },
      });
    };

    void mountFeatureTable();

    return () => {
      cancelled = true;
      featureTableRef.current?.destroy();
      featureTableRef.current = null;
      fallbackFeatureLayerRef.current?.destroy();
      fallbackFeatureLayerRef.current = null;
    };
  }, [isTableOverlayOpen, tableOverlayLayerId, viewRef, mapReady, targetLayer]);

  if (!isTableOverlayOpen || !tableOverlayLayerId) {
    return null;
  }

  return (
    <div
      id="tnc-arcgis-table-overlay-root"
      className="absolute inset-0 z-[75] pointer-events-none"
      aria-live="polite"
    >
      <section
        id="tnc-arcgis-table-overlay-panel"
        className="pointer-events-auto absolute left-4 right-4 bottom-4 h-[42vh] min-h-[280px] rounded-xl border border-gray-300 bg-white shadow-2xl flex flex-col overflow-hidden"
      >
        <header
          id="tnc-arcgis-table-overlay-header"
          className="flex items-center justify-between gap-3 border-b border-gray-200 px-3 py-2 bg-gray-50"
        >
          <div id="tnc-arcgis-table-overlay-header-text" className="min-w-0">
            <h3 id="tnc-arcgis-table-overlay-title" className="text-sm font-semibold text-gray-900 truncate">
              Layer Table
            </h3>
            <p id="tnc-arcgis-table-overlay-subtitle" className="text-xs text-gray-600 truncate">
              {targetLayer?.name || 'Selected layer'}
            </p>
          </div>
          <button
            id="tnc-arcgis-table-overlay-close-button"
            type="button"
            onClick={closeTableOverlay}
            className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-gray-300 text-base font-semibold text-gray-700 hover:bg-gray-100"
            aria-label="Close layer table overlay"
          >
            X
          </button>
        </header>

        {tableError ? (
          <div
            id="tnc-arcgis-table-overlay-error"
            className="m-3 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900"
          >
            {tableError}
          </div>
        ) : (
          <div
            id="tnc-arcgis-table-overlay-table-container"
            ref={tableContainerRef}
            className="flex-1 min-h-0"
          />
        )}
      </section>
    </div>
  );
}
