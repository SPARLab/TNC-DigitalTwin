import { useMemo, useState } from 'react';
import { ExternalLink, X } from 'lucide-react';
import { useCatalog } from '../../../context/CatalogContext';
import { useLayers } from '../../../context/LayerContext';
import { buildServiceUrl } from '../../../services/tncArcgisService';
import type { CatalogLayer } from '../../../types';

interface TNCArcGISOverviewTabProps {
  loading: boolean;
  onBrowseClick: () => void;
}

function normalizeDescription(value: string | undefined): string {
  return (value ?? '').trim().replace(/\s+/g, ' ').toLowerCase();
}

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

export function TNCArcGISOverviewTab({ loading, onBrowseClick }: TNCArcGISOverviewTabProps) {
  const {
    activeLayer,
    setActiveServiceSubLayer,
    isLayerPinned,
    pinLayer,
    unpinLayer,
    getPinnedByLayerId,
    getLayerOpacity,
    setLayerOpacity,
  } = useLayers();
  const { layerMap } = useCatalog();
  const [isSourceOverlayOpen, setIsSourceOverlayOpen] = useState(false);
  const activeCatalogLayer = activeLayer ? layerMap.get(activeLayer.layerId) : undefined;
  const targetLayer = useMemo(
    () => getTargetLayer(activeCatalogLayer, activeLayer?.selectedSubLayerId),
    [activeCatalogLayer, activeLayer?.selectedSubLayerId],
  );
  const serviceContextLayer = useMemo(() => {
    if (!activeCatalogLayer) return undefined;
    if (activeCatalogLayer.catalogMeta?.isMultiLayerService && !activeCatalogLayer.catalogMeta?.parentServiceId) {
      return activeCatalogLayer;
    }
    const parentServiceId = activeCatalogLayer.catalogMeta?.parentServiceId;
    if (!parentServiceId) return activeCatalogLayer;
    return layerMap.get(parentServiceId) ?? activeCatalogLayer;
  }, [activeCatalogLayer, layerMap]);

  const siblingLayers = useMemo(
    () => activeCatalogLayer?.catalogMeta?.siblingLayers ?? [],
    [activeCatalogLayer],
  );
  const isServiceOverview = !!(activeLayer?.isService && siblingLayers.length > 0);

  const description = serviceContextLayer?.catalogMeta?.description || 'No description available yet.';
  const normalizedServiceDescription = normalizeDescription(serviceContextLayer?.catalogMeta?.description);
  const servicePath = serviceContextLayer?.catalogMeta?.servicePath || 'Unknown service path';
  const serverBaseUrl = serviceContextLayer?.catalogMeta?.serverBaseUrl || 'Unknown host';
  const sourceLabel = `${serverBaseUrl}/${servicePath}`;
  const activeLayerPinned = activeLayer ? isLayerPinned(activeLayer.layerId) : false;
  const activeLayerPinnedEntry = activeLayer ? getPinnedByLayerId(activeLayer.layerId) : undefined;
  const activeLayerCanPin = !!activeLayer && !activeLayer.isService;
  const sliderOpacityPercent = activeLayer ? Math.round(getLayerOpacity(activeLayer.layerId) * 100) : 100;
  const serviceSearchUrl = useMemo(() => {
    const searchLabel = serviceContextLayer?.name || targetLayer?.name;
    if (!searchLabel) return '';
    return `https://dangermondpreserve-tnc.hub.arcgis.com/search?collection=Dataset&q=${encodeURIComponent(searchLabel)}`;
  }, [serviceContextLayer?.name, targetLayer?.name]);
  const rawServiceUrl = useMemo(() => {
    if (!targetLayer?.catalogMeta) return '';
    try {
      return buildServiceUrl(targetLayer.catalogMeta);
    } catch {
      return '';
    }
  }, [targetLayer?.catalogMeta]);
  const sourceUrl = useMemo(() => {
    return serviceSearchUrl || rawServiceUrl;
  }, [serviceSearchUrl, rawServiceUrl]);

  const formatLayerLabel = (layerName: string, layerIdInService?: number) => (
    typeof layerIdInService === 'number'
      ? `${layerName} (Layer ${layerIdInService})`
      : layerName
  );

  const handlePinActiveLayer = () => {
    if (!activeLayer) return;
    pinLayer(activeLayer.layerId);
  };
  const handleUnpinActiveLayer = () => {
    if (!activeLayerPinnedEntry) return;
    unpinLayer(activeLayerPinnedEntry.id);
  };

  return (
    <div id="tnc-arcgis-overview-tab" className="space-y-5">
      {isServiceOverview ? (
        <>
          <div id="tnc-arcgis-overview-hierarchy-card" className="rounded-lg border border-amber-200 bg-amber-50 p-3 space-y-2">
            <h4 id="tnc-arcgis-overview-hierarchy-title" className="text-xs font-semibold uppercase tracking-wide text-amber-800">
              Current Context
            </h4>
            <div id="tnc-arcgis-overview-hierarchy-layer" className="text-sm text-gray-900">
              <span className="font-medium">Layer:</span> {targetLayer?.name || 'No layer selected'}
            </div>
            <div id="tnc-arcgis-overview-hierarchy-service" className="text-sm text-gray-700">
              <span className="font-medium">Service:</span> {serviceContextLayer?.name || activeCatalogLayer?.name || 'Unknown service'}
            </div>
            <div id="tnc-arcgis-overview-hierarchy-catalog" className="text-xs text-gray-600">
              <span className="font-medium">Catalog:</span> TNC ArcGIS Feature Services
            </div>
          </div>

          <div id="tnc-arcgis-overview-description-block" className="space-y-2">
            <h3 id="tnc-arcgis-overview-title" className="text-sm font-semibold text-gray-900">
              TNC ArcGIS Service
            </h3>
            <p id="tnc-arcgis-overview-description" className="text-sm text-gray-600 leading-relaxed">
              {description}
            </p>
          </div>

          <div id="tnc-arcgis-service-overview-layer-list-block" className="space-y-2">
            <h4 id="tnc-arcgis-service-overview-layer-list-title" className="text-xs font-semibold uppercase tracking-wide text-gray-500">
              Layer Selection
            </h4>
            <p id="tnc-arcgis-service-overview-layer-list-help" className="text-xs text-gray-600 leading-relaxed">
              Pick a layer here or in the left sidebar. Selection stays synced both ways.
            </p>
            <label
              id="tnc-arcgis-service-overview-layer-select-label"
              htmlFor="tnc-arcgis-service-overview-layer-select"
              className="text-xs font-medium text-gray-700"
            >
              Active layer
            </label>
            <select
              id="tnc-arcgis-service-overview-layer-select"
              value={targetLayer?.id || ''}
              onChange={(event) => {
                if (!event.target.value) return;
                setActiveServiceSubLayer(event.target.value);
              }}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            >
              {siblingLayers.map(layer => (
                <option key={layer.id} value={layer.id}>
                  {formatLayerLabel(layer.name, layer.catalogMeta?.layerIdInService)}
                </option>
              ))}
            </select>
            <ul id="tnc-arcgis-service-overview-layer-list" className="space-y-2">
              {siblingLayers.map(layer => {
                const layerDescription = layer.catalogMeta?.description;
                const hasDistinctLayerDescription = !!(
                  normalizeDescription(layerDescription)
                  && normalizeDescription(layerDescription) !== normalizedServiceDescription
                );

                return (
                  <li
                    id={`tnc-arcgis-service-overview-layer-${layer.id}`}
                    key={layer.id}
                    className={`rounded-lg border bg-white p-3 transition-colors ${
                      targetLayer?.id === layer.id ? 'border-emerald-300 ring-1 ring-emerald-200' : 'border-gray-200'
                    }`}
                  >
                    <p
                      id={`tnc-arcgis-service-overview-layer-name-${layer.id}`}
                      className="text-sm font-medium text-gray-900"
                    >
                      {formatLayerLabel(layer.name, layer.catalogMeta?.layerIdInService)}
                    </p>
                    {hasDistinctLayerDescription && (
                      <p
                        id={`tnc-arcgis-service-overview-layer-description-${layer.id}`}
                        className="mt-1 text-xs text-gray-600 leading-relaxed"
                      >
                        {layerDescription}
                      </p>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>

          <div id="tnc-arcgis-overview-metadata" className="bg-slate-50 rounded-lg p-4">
            <dl id="tnc-arcgis-overview-metadata-list" className="grid grid-cols-2 gap-y-3 gap-x-4 text-sm">
              <dt id="tnc-arcgis-overview-source-label" className="text-gray-500">Source</dt>
              <dd id="tnc-arcgis-overview-source-value" className="text-gray-900 font-medium text-right truncate" title={sourceLabel}>
                {sourceLabel}
              </dd>
              <dt id="tnc-arcgis-overview-type-label" className="text-gray-500">Status</dt>
              <dd id="tnc-arcgis-overview-type-value" className="text-gray-900 font-medium text-right">
                {loading ? 'Loading metadata...' : 'Ready'}
              </dd>
            </dl>
          </div>

          <div id="tnc-arcgis-service-overview-actions" className="grid grid-cols-2 gap-3">
            <button
              id="tnc-arcgis-service-overview-open-layer-cta"
              type="button"
              onClick={onBrowseClick}
              className="col-span-2 w-full py-3 rounded-lg border border-emerald-200 bg-emerald-50 text-emerald-700 text-sm font-medium text-center min-h-[44px] hover:bg-emerald-100 transition-colors"
            >
              Browse Selected Layer
            </button>
          </div>

          <div id="tnc-arcgis-overview-source-card" className="rounded-lg border border-slate-200 bg-slate-50 p-3 space-y-2">
            <h4 id="tnc-arcgis-overview-source-title" className="text-xs font-semibold uppercase tracking-wide text-gray-600">
              Source
            </h4>
            <div id="tnc-arcgis-overview-source-url" className="text-xs text-gray-700 break-all">
              {sourceUrl || 'Select a specific layer to view source URL.'}
            </div>
            {rawServiceUrl && sourceUrl !== rawServiceUrl && (
              <div id="tnc-arcgis-overview-raw-source-url" className="text-[11px] text-gray-500 break-all">
                REST endpoint: {rawServiceUrl}
              </div>
            )}
            <div id="tnc-arcgis-overview-source-actions" className="grid grid-cols-2 gap-2">
              <button
                id="tnc-arcgis-overview-open-overlay-button"
                type="button"
                onClick={() => setIsSourceOverlayOpen(true)}
                disabled={!sourceUrl}
                className="rounded-md border border-gray-300 bg-white px-2 py-2 text-xs font-medium text-gray-700 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Open Overlay
              </button>
              <a
                id="tnc-arcgis-overview-open-new-tab-link"
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
            <p id="tnc-arcgis-overview-source-help" className="text-[11px] text-gray-500">
              Opens the TNC Hub search page first; use New Tab if embedding is blocked.
            </p>
          </div>
        </>
      ) : (
        <>
      <div id="tnc-arcgis-overview-hierarchy-card" className="rounded-lg border border-amber-200 bg-amber-50 p-3 space-y-2">
        <h4 id="tnc-arcgis-overview-hierarchy-title" className="text-xs font-semibold uppercase tracking-wide text-amber-800">
          Current Context
        </h4>
        <div id="tnc-arcgis-overview-hierarchy-layer" className="text-sm text-gray-900">
          <span className="font-medium">Layer:</span> {targetLayer?.name || activeCatalogLayer?.name || 'Unknown layer'}
        </div>
        <div id="tnc-arcgis-overview-hierarchy-service" className="text-sm text-gray-700">
          <span className="font-medium">Service:</span> {serviceContextLayer?.name || activeCatalogLayer?.name || 'Unknown service'}
        </div>
        <div id="tnc-arcgis-overview-hierarchy-catalog" className="text-xs text-gray-600">
          <span className="font-medium">Catalog:</span> TNC ArcGIS Feature Services
        </div>
      </div>

      <div id="tnc-arcgis-overview-description-block" className="space-y-2">
        <h3 id="tnc-arcgis-overview-title" className="text-sm font-semibold text-gray-900">
          TNC ArcGIS Service
        </h3>
        <p id="tnc-arcgis-overview-description" className="text-sm text-gray-600 leading-relaxed">
          {description}
        </p>
      </div>

      <div id="tnc-arcgis-overview-metadata" className="bg-slate-50 rounded-lg p-4">
        <dl id="tnc-arcgis-overview-metadata-list" className="grid grid-cols-2 gap-y-3 gap-x-4 text-sm">
          <dt id="tnc-arcgis-overview-source-label" className="text-gray-500">Source</dt>
          <dd id="tnc-arcgis-overview-source-value" className="text-gray-900 font-medium text-right truncate" title={sourceLabel}>
            {sourceLabel}
          </dd>
          <dt id="tnc-arcgis-overview-type-label" className="text-gray-500">Status</dt>
          <dd id="tnc-arcgis-overview-type-value" className="text-gray-900 font-medium text-right">
            {loading ? 'Loading metadata...' : 'Ready'}
          </dd>
        </dl>
      </div>

          {activeLayerCanPin && (
            <div id="tnc-arcgis-overview-opacity-control-container" className="rounded-lg border border-gray-200 bg-white p-3">
              <div id="tnc-arcgis-overview-opacity-control-header" className="flex items-center justify-between gap-3">
                <label
                  id="tnc-arcgis-overview-opacity-control-label"
                  htmlFor="tnc-arcgis-overview-opacity-control-slider"
                  className="text-xs font-semibold uppercase tracking-wide text-gray-600"
                >
                  Layer Opacity
                </label>
                <span id="tnc-arcgis-overview-opacity-control-value" className="text-xs text-gray-700 font-medium">
                  {sliderOpacityPercent}%
                </span>
              </div>
              <input
                id="tnc-arcgis-overview-opacity-control-slider"
                type="range"
                min={0}
                max={100}
                step={5}
                value={sliderOpacityPercent}
                onChange={event => {
                  if (!activeLayer) return;
                  const nextPercent = Number(event.target.value);
                  setLayerOpacity(activeLayer.layerId, nextPercent / 100);
                }}
                className="mt-2 w-full accent-emerald-600 cursor-pointer"
                aria-label="Adjust layer opacity"
              />
            </div>
          )}

          <div id="tnc-arcgis-overview-actions" className="grid grid-cols-1 gap-3">
            {activeLayerPinned ? (
              <button
                id="tnc-arcgis-overview-unpin-cta"
                type="button"
                onClick={handleUnpinActiveLayer}
                className="w-full py-3 rounded-lg border border-emerald-200 bg-emerald-50 text-emerald-700 text-sm font-medium text-center min-h-[44px] hover:bg-emerald-100 transition-colors"
              >
                Unpin Layer
              </button>
            ) : !activeLayerCanPin ? (
              <div
                id="tnc-arcgis-overview-service-badge"
                className="w-full py-3 rounded-lg border border-gray-300 bg-gray-50 text-gray-700 text-sm font-medium text-center min-h-[44px] flex items-center justify-center"
              >
                Service selected
              </div>
            ) : (
              <button
                id="tnc-arcgis-overview-pin-cta"
                type="button"
                onClick={handlePinActiveLayer}
                className="w-full py-3 border border-blue-200 text-blue-700 font-medium rounded-lg hover:bg-blue-50 transition-colors text-sm min-h-[44px]"
              >
                Pin Layer
              </button>
            )}
          </div>

          <div id="tnc-arcgis-overview-source-card" className="rounded-lg border border-slate-200 bg-slate-50 p-3 space-y-2">
            <h4 id="tnc-arcgis-overview-source-title" className="text-xs font-semibold uppercase tracking-wide text-gray-600">
              Source
            </h4>
            <div id="tnc-arcgis-overview-source-url" className="text-xs text-gray-700 break-all">
              {sourceUrl || 'No source URL available.'}
            </div>
            {rawServiceUrl && sourceUrl !== rawServiceUrl && (
              <div id="tnc-arcgis-overview-raw-source-url" className="text-[11px] text-gray-500 break-all">
                REST endpoint: {rawServiceUrl}
              </div>
            )}
            <div id="tnc-arcgis-overview-source-actions" className="grid grid-cols-2 gap-2">
              <button
                id="tnc-arcgis-overview-open-overlay-button"
                type="button"
                onClick={() => setIsSourceOverlayOpen(true)}
                disabled={!sourceUrl}
                className="rounded-md border border-gray-300 bg-white px-2 py-2 text-xs font-medium text-gray-700 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Open Overlay
              </button>
              <a
                id="tnc-arcgis-overview-open-new-tab-link"
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
            <p id="tnc-arcgis-overview-source-help" className="text-[11px] text-gray-500">
              Opens the TNC Hub search page first; use New Tab if embedding is blocked.
            </p>
          </div>
        </>
      )}

      {isSourceOverlayOpen && sourceUrl && (
        <div
          id="tnc-arcgis-overview-source-overlay-backdrop"
          className="fixed inset-0 z-[100] bg-black/45 flex items-center justify-center p-4"
          onClick={() => setIsSourceOverlayOpen(false)}
        >
          <div
            id="tnc-arcgis-overview-source-overlay-panel"
            className="w-full max-w-5xl h-[80vh] rounded-xl bg-white shadow-2xl border border-gray-200 flex flex-col overflow-hidden"
            onClick={event => event.stopPropagation()}
          >
            <div id="tnc-arcgis-overview-source-overlay-header" className="flex items-center justify-between border-b border-gray-200 px-3 py-2">
              <h3 id="tnc-arcgis-overview-source-overlay-title" className="text-sm font-semibold text-gray-900">
                TNC ArcGIS Source Viewer
              </h3>
              <button
                id="tnc-arcgis-overview-source-overlay-close-button"
                type="button"
                onClick={() => setIsSourceOverlayOpen(false)}
                className="p-1 rounded-md hover:bg-gray-100"
                aria-label="Close source overlay"
              >
                <X className="w-4 h-4 text-gray-600" />
              </button>
            </div>
            <iframe
              id="tnc-arcgis-overview-source-overlay-iframe"
              src={sourceUrl}
              title="TNC ArcGIS Source"
              className="w-full h-full border-0"
            />
          </div>
        </div>
      )}
    </div>
  );
}
