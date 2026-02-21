import { useEffect, useMemo, useState, type MouseEvent as ReactMouseEvent } from 'react';
import { ExternalLink, Eye, EyeOff, Pin, X } from 'lucide-react';
import { useCatalog } from '../../../context/CatalogContext';
import { useLayers } from '../../../context/LayerContext';
import { buildServiceUrl, fetchServiceDescription } from '../../../services/tncArcgisService';
import type { CatalogLayer } from '../../../types';

interface TNCArcGISOverviewTabProps {
  loading: boolean;
  onBrowseClick: () => void;
  onInspectBrowseClick?: () => void;
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

export function TNCArcGISOverviewTab({ loading, onBrowseClick, onInspectBrowseClick }: TNCArcGISOverviewTabProps) {
  const {
    activeLayer,
    activateLayer,
    setActiveServiceSubLayer,
    isLayerPinned,
    isLayerVisible,
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
    () => serviceContextLayer?.catalogMeta?.siblingLayers ?? [],
    [serviceContextLayer],
  );
  const isUnifiedServiceWorkspace = siblingLayers.length > 0;

  const catalogDescription = serviceContextLayer?.catalogMeta?.description?.trim() || '';
  const [resolvedDescription, setResolvedDescription] = useState(catalogDescription);
  const description = resolvedDescription || 'No description available yet.';
  const featureServiceName = serviceContextLayer?.name || activeCatalogLayer?.name || 'Unknown service';
  const currentLayerName = targetLayer?.name || activeCatalogLayer?.name || 'Unknown layer';
  const servicePath = serviceContextLayer?.catalogMeta?.servicePath || 'Unknown service path';
  const serverBaseUrl = serviceContextLayer?.catalogMeta?.serverBaseUrl || 'Unknown host';
  const sourceLabel = `${serverBaseUrl}/${servicePath}`;
  const targetLayerPinned = targetLayer ? isLayerPinned(targetLayer.id) : false;
  const targetLayerPinnedEntry = targetLayer ? getPinnedByLayerId(targetLayer.id) : undefined;
  const targetLayerCanPin = !!targetLayer;
  const sliderOpacityPercent = targetLayer ? Math.round(getLayerOpacity(targetLayer.id) * 100) : 100;
  const pinnedLayerCount = siblingLayers.filter(layer => isLayerPinned(layer.id)).length;
  const visibleLayerCount = siblingLayers.filter(layer => isLayerVisible(layer.id)).length;
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

  useEffect(() => {
    let cancelled = false;
    setResolvedDescription(catalogDescription);

    const serviceMeta = serviceContextLayer?.catalogMeta;
    if (!serviceMeta?.hasFeatureServer) return () => { cancelled = true; };

    fetchServiceDescription(serviceMeta)
      .then((serviceDescription) => {
        if (cancelled || !serviceDescription) return;
        setResolvedDescription(serviceDescription);
      })
      .catch(() => {
        // Keep catalog description fallback when metadata fetch fails.
      });

    return () => {
      cancelled = true;
    };
  }, [serviceContextLayer, catalogDescription]);

  const formatLayerLabel = (layerName: string, layerIdInService?: number) => (
    typeof layerIdInService === 'number'
      ? `${layerName} (Layer ${layerIdInService})`
      : layerName
  );

  const handlePinActiveLayer = () => {
    if (!targetLayer) return;
    pinLayer(targetLayer.id);
  };
  const handleUnpinActiveLayer = () => {
    if (!targetLayerPinnedEntry) return;
    unpinLayer(targetLayerPinnedEntry.id);
  };
  const handleLayerListSelect = (layerId: string) => {
    if (activeLayer?.isService) {
      setActiveServiceSubLayer(layerId);
      return;
    }
    activateLayer(layerId);
  };
  const handleInlinePinToggle = (event: ReactMouseEvent, layerId: string) => {
    event.stopPropagation();
    const pinnedEntry = getPinnedByLayerId(layerId);
    if (pinnedEntry) {
      unpinLayer(pinnedEntry.id);
    } else {
      pinLayer(layerId);
    }
  };
  const handleInspectLayer = (event: ReactMouseEvent, layerId: string) => {
    event.stopPropagation();
    handleLayerListSelect(layerId);
    if (onInspectBrowseClick) {
      onInspectBrowseClick();
      return;
    }
    onBrowseClick();
  };

  return (
    <div id="tnc-arcgis-overview-tab" className="space-y-5">
      {isUnifiedServiceWorkspace ? (
        <>
          <div id="tnc-arcgis-overview-context-card" className="rounded-lg border border-gray-200 bg-gray-50 p-3 space-y-3">
            <div id="tnc-arcgis-overview-context-service-block" className="space-y-1">
              <h4 id="tnc-arcgis-overview-context-service-label" className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                Feature Service
              </h4>
              <p id="tnc-arcgis-overview-context-service-value" className="text-base font-semibold text-gray-900 leading-tight">
                {featureServiceName}
              </p>
            </div>
            <div id="tnc-arcgis-overview-context-layer-block" className="space-y-1">
              <h4 id="tnc-arcgis-overview-context-layer-label" className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                Current Layer
              </h4>
              <p id="tnc-arcgis-overview-context-layer-value" className="text-base text-gray-800 leading-tight">
                {currentLayerName}
              </p>
            </div>
          </div>

          <div id="tnc-arcgis-overview-description-block" className="space-y-2">
            <h3 id="tnc-arcgis-overview-title" className="text-sm font-semibold text-gray-900">
              Feature Service Overview
            </h3>
            <p id="tnc-arcgis-overview-description" className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">
              {description}
            </p>
          </div>

          <div id="tnc-arcgis-service-overview-layer-list-block" className="space-y-2">
            <h4 id="tnc-arcgis-service-overview-layer-list-title" className="text-xs font-semibold uppercase tracking-wide text-gray-500">
              {siblingLayers.length} {siblingLayers.length === 1 ? 'layer' : 'layers'} • {pinnedLayerCount} pinned • {visibleLayerCount} visible
            </h4>
            <ul
              id="tnc-arcgis-service-overview-layer-list"
              className="max-h-56 overflow-y-auto space-y-2 rounded-lg border border-gray-200 bg-gray-50 p-2"
            >
              {siblingLayers.map(layer => {
                const isSelectedLayer = targetLayer?.id === layer.id;

                return (
                  <li
                    id={`tnc-arcgis-service-overview-layer-${layer.id}`}
                    key={layer.id}
                    className="list-none"
                  >
                    <button
                      id={`tnc-arcgis-service-overview-layer-name-${layer.id}`}
                      type="button"
                      onClick={() => handleLayerListSelect(layer.id)}
                      className={`group w-full text-left rounded-lg border p-3 transition-colors ${
                        isSelectedLayer
                          ? 'border-amber-300 bg-amber-50 ring-1 ring-amber-200'
                          : 'border-gray-200 bg-white hover:border-gray-300'
                      }`}
                    >
                      <div
                        id={`tnc-arcgis-service-overview-layer-title-row-${layer.id}`}
                        className="flex items-start justify-between gap-2"
                      >
                        <p className="text-sm font-medium text-gray-900 min-w-0 truncate">
                          {formatLayerLabel(layer.name, layer.catalogMeta?.layerIdInService)}
                        </p>
                        <div
                          id={`tnc-arcgis-service-overview-layer-state-icons-${layer.id}`}
                          className="flex items-center gap-2 flex-shrink-0 translate-y-[1px]"
                        >
                          <span
                            id={`tnc-arcgis-service-overview-layer-inspect-button-${layer.id}`}
                            onClick={(event) => handleInspectLayer(event, layer.id)}
                            className={`inline-flex items-center justify-center rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide transition ${
                              isSelectedLayer
                                ? 'opacity-100 text-emerald-700 bg-emerald-100 hover:bg-emerald-200'
                                : 'opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 text-emerald-700 bg-emerald-100 hover:bg-emerald-200'
                            }`}
                            title="Inspect layer in Browse tab"
                            role="button"
                            aria-label={`Inspect ${layer.name}`}
                          >
                            Inspect
                          </span>
                          {isLayerPinned(layer.id) ? (
                            <span
                              id={`tnc-arcgis-service-overview-layer-pin-button-${layer.id}`}
                              onClick={(event) => handleInlinePinToggle(event, layer.id)}
                              className="inline-flex items-center justify-center rounded text-blue-600 hover:text-blue-400 transition-colors cursor-pointer"
                              title="Unpin layer"
                              role="button"
                              aria-label="Unpin layer"
                            >
                              <Pin
                                id={`tnc-arcgis-service-overview-layer-pin-icon-${layer.id}`}
                                className="h-3.5 w-3.5 fill-blue-600 hover:fill-blue-400"
                              />
                            </span>
                          ) : isSelectedLayer ? (
                            <span
                              id={`tnc-arcgis-service-overview-layer-pin-button-${layer.id}`}
                              onClick={(event) => handleInlinePinToggle(event, layer.id)}
                              className="inline-flex items-center justify-center rounded text-amber-600 hover:text-amber-700 transition-colors cursor-pointer"
                              title="Pin layer"
                              role="button"
                              aria-label="Pin layer"
                            >
                              <Pin
                                id={`tnc-arcgis-service-overview-layer-pin-outline-icon-${layer.id}`}
                                className="h-3.5 w-3.5"
                              />
                            </span>
                          ) : null}
                          <span
                            id={`tnc-arcgis-service-overview-layer-visibility-icon-container-${layer.id}`}
                            className="inline-flex items-center justify-center"
                            title={isLayerVisible(layer.id) ? 'Visible on map' : 'Hidden on map'}
                          >
                            {isLayerVisible(layer.id) ? (
                              <Eye
                                id={`tnc-arcgis-service-overview-layer-eye-icon-${layer.id}`}
                                className="h-3.5 w-3.5 text-emerald-700"
                              />
                            ) : (
                              <EyeOff
                                id={`tnc-arcgis-service-overview-layer-eye-off-icon-${layer.id}`}
                                className="h-3.5 w-3.5 text-gray-400"
                              />
                            )}
                          </span>
                        </div>
                      </div>
                    </button>
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

          {targetLayerCanPin && (
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
                  if (!targetLayer) return;
                  const nextPercent = Number(event.target.value);
                  setLayerOpacity(targetLayer.id, nextPercent / 100);
                }}
                className="mt-2 w-full accent-emerald-600 cursor-pointer"
                aria-label="Adjust layer opacity"
              />
            </div>
          )}

          <div id="tnc-arcgis-service-overview-actions" className="grid grid-cols-1 gap-3">
            {targetLayerPinned ? (
              <button
                id="tnc-arcgis-overview-unpin-cta"
                type="button"
                onClick={handleUnpinActiveLayer}
                className="w-full py-3 rounded-lg border border-emerald-200 bg-emerald-50 text-emerald-700 text-sm font-medium text-center min-h-[44px] hover:bg-emerald-100 transition-colors"
              >
                Unpin Layer
              </button>
            ) : !targetLayerCanPin ? (
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
            <button
              id="tnc-arcgis-service-overview-open-layer-cta"
              type="button"
              onClick={() => {
                if (onInspectBrowseClick) {
                  onInspectBrowseClick();
                  return;
                }
                onBrowseClick();
              }}
              className="w-full py-3 rounded-lg border border-emerald-200 bg-emerald-50 text-emerald-700 text-sm font-medium text-center min-h-[44px] hover:bg-emerald-100 transition-colors"
            >
              Inspect Current Layer
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
      <div id="tnc-arcgis-overview-context-card" className="rounded-lg border border-gray-200 bg-gray-50 p-3 space-y-3">
        <div id="tnc-arcgis-overview-context-service-block" className="space-y-1">
          <h4 id="tnc-arcgis-overview-context-service-label" className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
            Feature Service
          </h4>
          <p id="tnc-arcgis-overview-context-service-value" className="text-base font-semibold text-gray-900 leading-tight">
            {featureServiceName}
          </p>
        </div>
        <div id="tnc-arcgis-overview-context-layer-block" className="space-y-1">
          <h4 id="tnc-arcgis-overview-context-layer-label" className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
            Current Layer
          </h4>
          <p id="tnc-arcgis-overview-context-layer-value" className="text-sm text-gray-800 leading-tight">
            {currentLayerName}
          </p>
        </div>
      </div>

      <div id="tnc-arcgis-overview-description-block" className="space-y-2">
        <h3 id="tnc-arcgis-overview-title" className="text-sm font-semibold text-gray-900">
          Feature Service Overview
        </h3>
        <p id="tnc-arcgis-overview-description" className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">
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

          {targetLayerCanPin && (
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
                  if (!targetLayer) return;
                  const nextPercent = Number(event.target.value);
                  setLayerOpacity(targetLayer.id, nextPercent / 100);
                }}
                className="mt-2 w-full accent-emerald-600 cursor-pointer"
                aria-label="Adjust layer opacity"
              />
            </div>
          )}

          <div id="tnc-arcgis-overview-actions" className="grid grid-cols-1 gap-3">
            {targetLayerPinned ? (
              <button
                id="tnc-arcgis-overview-unpin-cta"
                type="button"
                onClick={handleUnpinActiveLayer}
                className="w-full py-3 rounded-lg border border-emerald-200 bg-emerald-50 text-emerald-700 text-sm font-medium text-center min-h-[44px] hover:bg-emerald-100 transition-colors"
              >
                Unpin Layer
              </button>
            ) : !targetLayerCanPin ? (
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
            <button
              id="tnc-arcgis-overview-open-layer-cta"
              type="button"
              onClick={() => {
                if (onInspectBrowseClick) {
                  onInspectBrowseClick();
                  return;
                }
                onBrowseClick();
              }}
              className="w-full py-3 rounded-lg border border-emerald-200 bg-emerald-50 text-emerald-700 text-sm font-medium text-center min-h-[44px] hover:bg-emerald-100 transition-colors"
            >
              Inspect Current Layer
            </button>
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
