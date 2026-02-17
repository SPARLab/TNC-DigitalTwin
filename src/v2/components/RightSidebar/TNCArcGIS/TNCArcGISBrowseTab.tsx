import { useMemo, useState } from 'react';
import { useCatalog } from '../../../context/CatalogContext';
import { useLayers } from '../../../context/LayerContext';
import { ExternalLink, X } from 'lucide-react';
import { buildServiceUrl } from '../../../services/tncArcgisService';
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
  const [isSourceOverlayOpen, setIsSourceOverlayOpen] = useState(false);

  const sourceUrl = useMemo(() => {
    if (!targetLayer?.catalogMeta) return '';
    try {
      return buildServiceUrl(targetLayer.catalogMeta);
    } catch {
      return '';
    }
  }, [targetLayer?.catalogMeta]);

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

      <div id="tnc-arcgis-browse-source-card" className="rounded-lg border border-slate-200 bg-slate-50 p-3 space-y-2">
        <h4 id="tnc-arcgis-browse-source-title" className="text-xs font-semibold uppercase tracking-wide text-gray-600">
          Source
        </h4>
        <div id="tnc-arcgis-browse-source-url" className="text-xs text-gray-700 break-all">
          {sourceUrl || 'No source URL available.'}
        </div>
        <div id="tnc-arcgis-browse-source-actions" className="grid grid-cols-2 gap-2">
          <button
            id="tnc-arcgis-browse-open-overlay-button"
            type="button"
            onClick={() => setIsSourceOverlayOpen(true)}
            disabled={!sourceUrl}
            className="rounded-md border border-gray-300 bg-white px-2 py-2 text-xs font-medium text-gray-700 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Open Overlay
          </button>
          <a
            id="tnc-arcgis-browse-open-new-tab-link"
            href={sourceUrl || '#'}
            target="_blank"
            rel="noopener noreferrer"
            className={`rounded-md border px-2 py-2 text-xs font-medium flex items-center justify-center gap-1 ${
              sourceUrl
                ? 'border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100'
                : 'border-gray-200 bg-gray-100 text-gray-400 pointer-events-none'
            }`}
          >
            <ExternalLink className="w-3.5 h-3.5" />
            New Tab
          </a>
        </div>
        <p id="tnc-arcgis-browse-source-help" className="text-[11px] text-gray-500">
          If ArcGIS blocks iframe embedding, use New Tab.
        </p>
      </div>

      {isSourceOverlayOpen && sourceUrl && (
        <div
          id="tnc-arcgis-browse-source-overlay-backdrop"
          className="fixed inset-0 z-[100] bg-black/45 flex items-center justify-center p-4"
          onClick={() => setIsSourceOverlayOpen(false)}
        >
          <div
            id="tnc-arcgis-browse-source-overlay-panel"
            className="w-full max-w-5xl h-[80vh] rounded-xl bg-white shadow-2xl border border-gray-200 flex flex-col overflow-hidden"
            onClick={event => event.stopPropagation()}
          >
            <div id="tnc-arcgis-browse-source-overlay-header" className="flex items-center justify-between border-b border-gray-200 px-3 py-2">
              <h3 id="tnc-arcgis-browse-source-overlay-title" className="text-sm font-semibold text-gray-900">
                ArcGIS Source Viewer
              </h3>
              <button
                id="tnc-arcgis-browse-source-overlay-close-button"
                type="button"
                onClick={() => setIsSourceOverlayOpen(false)}
                className="p-1 rounded-md hover:bg-gray-100"
                aria-label="Close source overlay"
              >
                <X className="w-4 h-4 text-gray-600" />
              </button>
            </div>
            <iframe
              id="tnc-arcgis-browse-source-overlay-iframe"
              src={sourceUrl}
              title="ArcGIS Service Source"
              className="w-full h-full border-0"
            />
          </div>
        </div>
        )}
    </div>
  );
}
