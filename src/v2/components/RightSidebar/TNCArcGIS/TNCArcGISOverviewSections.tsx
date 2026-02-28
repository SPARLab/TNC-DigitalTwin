import { useState, useEffect, useRef } from 'react';
import type { MouseEvent as ReactMouseEvent } from 'react';
import { ExternalLink, Eye, EyeOff, X } from 'lucide-react';
import type { CatalogLayer } from '../../../types';

type SourceIframeStatus = 'idle' | 'loading' | 'ready' | 'blocked';

interface OverviewContextCardProps {
  featureServiceName: string;
  currentLayerName: string;
  compactCurrentLayer?: boolean;
}

interface OverviewDescriptionSectionProps {
  description: string;
}

interface ServiceLayerListSectionProps {
  siblingLayers: CatalogLayer[];
  targetLayerId?: string;
  pinnedLayerCount: number;
  visibleLayerCount: number;
  onLayerSelect: (_layerId: string) => void;
  onInspectLayer: (_event: ReactMouseEvent, _layerId: string) => void;
  formatLayerLabel: (_layerName: string, _layerIdInService?: number) => string;
  isLayerVisible: (_layerId: string) => boolean;
}

interface OverviewMetadataSectionProps {
  sourceLabel: string;
  renderStatusLabel: string;
}

interface OverviewOpacityControlProps {
  sliderOpacityPercent: number;
  onChangeOpacity: (_nextPercent: number) => void;
}

interface OverviewInspectActionProps {
  isUnifiedServiceWorkspace: boolean;
  onInspectCurrentLayer: () => void;
}

interface OverviewSourceCardProps {
  sourceUrl: string;
  rawServiceUrl: string;
  sourceFallbackText: string;
  onOpenOverlay: () => void;
}

interface OverviewSourceOverlayProps {
  sourceUrl: string;
  sourceIframeStatus: SourceIframeStatus;
  onClose: () => void;
  onLoad: () => void;
  onError: () => void;
  onRetryEmbed: () => void;
}

export function OverviewContextCard({
  featureServiceName,
  currentLayerName,
  compactCurrentLayer = false,
}: OverviewContextCardProps) {
  return (
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
        <p
          id="tnc-arcgis-overview-context-layer-value"
          className={compactCurrentLayer ? 'text-sm text-gray-800 leading-tight' : 'text-base text-gray-800 leading-tight'}
        >
          {currentLayerName}
        </p>
      </div>
    </div>
  );
}

// ~5 lines of text-sm (0.875rem) at leading-relaxed (1.625) ≈ 7.1rem.
// A touch of extra headroom keeps the last visible line from being clipped.
const COLLAPSED_MAX_HEIGHT = '7.5rem';

export function OverviewDescriptionSection({ description }: OverviewDescriptionSectionProps) {
  const [expanded, setExpanded] = useState(false);
  const [fullHeight, setFullHeight] = useState(0);
  const contentRef = useRef<HTMLDivElement>(null);

  // Collapse back to preview when the layer changes.
  useEffect(() => { setExpanded(false); }, [description]);

  // Measure the full scrollHeight while the container can render unrestricted.
  // We read it once per description change; the DOM is settled by this point.
  useEffect(() => {
    const el = contentRef.current;
    if (!el) return;
    setFullHeight(el.scrollHeight);
  }, [description]);

  const paragraphs = description.split(/\n+/).map(p => p.trim()).filter(Boolean);
  const showToggle = description.length > 200;

  return (
    <div id="tnc-arcgis-overview-description-block" className="space-y-2">
      <h3 id="tnc-arcgis-overview-title" className="text-sm font-semibold text-gray-900">
        Feature Service Overview
      </h3>

      <div id="tnc-arcgis-overview-description-container" className="relative">
        <div
          id="tnc-arcgis-overview-description"
          ref={contentRef}
          className="overflow-hidden transition-[max-height] duration-300 ease-in-out text-sm text-gray-600 leading-relaxed space-y-4"
          style={{ maxHeight: expanded ? fullHeight : COLLAPSED_MAX_HEIGHT }}
        >
          {paragraphs.map((para, i) => (
            <p key={i}>{para}</p>
          ))}
        </div>

        {/* Fade mask at the bottom of the collapsed state */}
        {showToggle && !expanded && (
          <div
            id="tnc-arcgis-overview-description-fade"
            className="pointer-events-none absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-white to-transparent"
          />
        )}
      </div>

      {showToggle && (
        <button
          id="tnc-arcgis-overview-description-toggle"
          type="button"
          onClick={() => setExpanded(prev => !prev)}
          className="text-xs font-medium text-emerald-700 hover:text-emerald-800 transition-colors"
        >
          {expanded ? 'See less ↑' : 'See more ↓'}
        </button>
      )}
    </div>
  );
}

export function ServiceLayerListSection({
  siblingLayers,
  targetLayerId,
  pinnedLayerCount,
  visibleLayerCount,
  onLayerSelect,
  onInspectLayer,
  formatLayerLabel,
  isLayerVisible,
}: ServiceLayerListSectionProps) {
  return (
    <div id="tnc-arcgis-service-overview-layer-list-block" className="space-y-2">
      <h4 id="tnc-arcgis-service-overview-layer-list-title" className="text-xs font-semibold uppercase tracking-wide text-gray-500">
        {siblingLayers.length} {siblingLayers.length === 1 ? 'layer' : 'layers'} • {pinnedLayerCount} pinned • {visibleLayerCount} visible
      </h4>
      <ul
        id="tnc-arcgis-service-overview-layer-list"
        className="max-h-56 overflow-y-auto space-y-2 rounded-lg border border-gray-200 bg-gray-50 p-2"
      >
        {siblingLayers.map((layer) => {
          const isSelectedLayer = targetLayerId === layer.id;
          return (
            <li
              id={`tnc-arcgis-service-overview-layer-${layer.id}`}
              key={layer.id}
              className="list-none"
            >
              <button
                id={`tnc-arcgis-service-overview-layer-name-${layer.id}`}
                type="button"
                onClick={() => onLayerSelect(layer.id)}
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
                      onClick={(event) => onInspectLayer(event, layer.id)}
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
  );
}

export function OverviewMetadataSection({ sourceLabel, renderStatusLabel }: OverviewMetadataSectionProps) {
  return (
    <div id="tnc-arcgis-overview-metadata" className="bg-slate-50 rounded-lg p-4">
      <dl id="tnc-arcgis-overview-metadata-list" className="grid grid-cols-2 gap-y-3 gap-x-4 text-sm">
        <dt id="tnc-arcgis-overview-source-label" className="text-gray-500">Source</dt>
        <dd id="tnc-arcgis-overview-source-value" className="text-gray-900 font-medium text-right truncate" title={sourceLabel}>
          {sourceLabel}
        </dd>
        <dt id="tnc-arcgis-overview-type-label" className="text-gray-500">Status</dt>
        <dd id="tnc-arcgis-overview-type-value" className="text-gray-900 font-medium text-right">
          {renderStatusLabel}
        </dd>
      </dl>
    </div>
  );
}

export function OverviewOpacityControl({ sliderOpacityPercent, onChangeOpacity }: OverviewOpacityControlProps) {
  return (
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
        onChange={(event) => onChangeOpacity(Number(event.target.value))}
        className="mt-2 w-full accent-emerald-600 cursor-pointer"
        aria-label="Adjust layer opacity"
      />
    </div>
  );
}

export function OverviewInspectAction({
  isUnifiedServiceWorkspace,
  onInspectCurrentLayer,
}: OverviewInspectActionProps) {
  const actionRootId = isUnifiedServiceWorkspace
    ? 'tnc-arcgis-service-overview-actions'
    : 'tnc-arcgis-overview-actions';
  const actionButtonId = isUnifiedServiceWorkspace
    ? 'tnc-arcgis-service-overview-open-layer-cta'
    : 'tnc-arcgis-overview-open-layer-cta';

  return (
    <div id={actionRootId} className="grid grid-cols-1 gap-3">
      <button
        id={actionButtonId}
        type="button"
        onClick={onInspectCurrentLayer}
        className="w-full py-3 rounded-lg border border-emerald-200 bg-emerald-50 text-emerald-700 text-sm font-medium text-center min-h-[44px] hover:bg-emerald-100 transition-colors"
      >
        Inspect Current Layer
      </button>
    </div>
  );
}

export function OverviewSourceCard({
  sourceUrl,
  rawServiceUrl,
  sourceFallbackText,
  onOpenOverlay,
}: OverviewSourceCardProps) {
  return (
    <div id="tnc-arcgis-overview-source-card" className="rounded-lg border border-slate-200 bg-slate-50 p-3 space-y-2">
      <h4 id="tnc-arcgis-overview-source-title" className="text-xs font-semibold uppercase tracking-wide text-gray-600">
        Source
      </h4>
      <div id="tnc-arcgis-overview-source-url" className="text-xs text-gray-700 break-all">
        {sourceUrl || sourceFallbackText}
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
          onClick={onOpenOverlay}
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
  );
}

export function OverviewSourceOverlay({
  sourceUrl,
  sourceIframeStatus,
  onClose,
  onLoad,
  onError,
  onRetryEmbed,
}: OverviewSourceOverlayProps) {
  return (
    <div
      id="tnc-arcgis-overview-source-overlay-backdrop"
      className="fixed inset-0 z-[100] bg-black/45 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        id="tnc-arcgis-overview-source-overlay-panel"
        className="w-full max-w-5xl h-[80vh] rounded-xl bg-white shadow-2xl border border-gray-200 flex flex-col overflow-hidden"
        onClick={(event) => event.stopPropagation()}
      >
        <div id="tnc-arcgis-overview-source-overlay-header" className="flex items-center justify-between border-b border-gray-200 px-3 py-2">
          <h3 id="tnc-arcgis-overview-source-overlay-title" className="text-sm font-semibold text-gray-900">
            TNC ArcGIS Source Viewer
          </h3>
          <button
            id="tnc-arcgis-overview-source-overlay-close-button"
            type="button"
            onClick={onClose}
            className="p-1 rounded-md hover:bg-gray-100"
            aria-label="Close source overlay"
          >
            <X className="w-4 h-4 text-gray-600" />
          </button>
        </div>
        {sourceIframeStatus === 'blocked' ? (
          <div
            id="tnc-arcgis-overview-source-overlay-fallback"
            className="h-full flex flex-col items-center justify-center gap-3 p-6 text-center bg-slate-50"
          >
            <p id="tnc-arcgis-overview-source-overlay-fallback-title" className="text-sm font-semibold text-gray-900">
              Embedded preview is blocked by the source site.
            </p>
            <p id="tnc-arcgis-overview-source-overlay-fallback-copy" className="max-w-xl text-xs text-gray-600">
              This source likely disallows iframe embedding via browser security headers. Open it in a new tab to continue.
            </p>
            <div id="tnc-arcgis-overview-source-overlay-fallback-actions" className="flex items-center gap-2">
              <a
                id="tnc-arcgis-overview-source-overlay-fallback-new-tab-link"
                href={sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-md border border-blue-200 bg-blue-50 px-3 py-2 text-xs font-semibold text-blue-700 hover:bg-blue-100 inline-flex items-center gap-1"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                Open in New Tab
              </a>
              <button
                id="tnc-arcgis-overview-source-overlay-fallback-retry-button"
                type="button"
                onClick={onRetryEmbed}
                className="rounded-md border border-gray-300 bg-white px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-100"
              >
                Retry Embed
              </button>
            </div>
          </div>
        ) : (
          <div id="tnc-arcgis-overview-source-overlay-iframe-shell" className="relative h-full">
            {sourceIframeStatus === 'loading' && (
              <div
                id="tnc-arcgis-overview-source-overlay-loading-banner"
                className="absolute left-1/2 top-3 z-10 -translate-x-1/2 rounded-full border border-slate-200 bg-white/95 px-3 py-1 text-xs text-slate-600 shadow-sm"
              >
                Loading source preview...
              </div>
            )}
            <iframe
              id="tnc-arcgis-overview-source-overlay-iframe"
              src={sourceUrl}
              title="TNC ArcGIS Source"
              onLoad={onLoad}
              onError={onError}
              className={`w-full h-full border-0 transition-opacity ${
                sourceIframeStatus === 'ready' ? 'opacity-100' : 'opacity-60'
              }`}
            />
          </div>
        )}
      </div>
    </div>
  );
}
