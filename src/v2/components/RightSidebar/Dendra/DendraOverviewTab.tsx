// ============================================================================
// DendraOverviewTab — Description, metadata, REST/table actions, week preview,
// condensed raw-data + live-monitoring callouts, Browse CTA.
// ============================================================================

import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Activity, ChevronDown, ChevronRight, Table2 } from 'lucide-react';
import { useCatalog } from '../../../context/CatalogContext';
import { useLayers } from '../../../context/LayerContext';
import { useTNCArcGIS } from '../../../context/TNCArcGISContext';
import { buildServiceUrl, fetchServiceDescription } from '../../../services/tncArcgisService';
import { SafeHtml } from '../../shared/SafeHtml';
import { looksLikeHtml } from '../../../utils/safeHtml';
import { formatCatalogSourcePath } from '../../../utils/catalogSourceLabel';
import { isDendraLatestCatalogLayer, resolveDendraServiceTitle } from '../../../utils/resolveDendraServiceTitle';
import { resolveRendererBinding } from '../../../config/monitoringRenderers';
import { publishMonitoringSensorFocus } from '../../../alerts/monitoringSensorIntent';
import { OverviewSourceOverlay } from '../TNCArcGIS/TNCArcGISOverviewSections';
import { DendraOverviewPreviewChart } from './DendraOverviewPreviewChart';
import { DendraRawDataCaution } from './DendraRawDataCaution';
import type { CatalogLayer } from '../../../types';

type SourceIframeStatus = 'idle' | 'loading' | 'ready' | 'blocked';

interface DendraOverviewTabProps {
  stationCount: number;
  loading: boolean;
  layerTitle: string | null;
  onBrowseClick: () => void;
}

function resolveServiceContextLayer(
  activeCatalogLayer: CatalogLayer | undefined,
  layerMap: Map<string, CatalogLayer>,
): CatalogLayer | undefined {
  if (!activeCatalogLayer) return undefined;
  if (activeCatalogLayer.catalogMeta?.isMultiLayerService && !activeCatalogLayer.catalogMeta?.parentServiceId) {
    return activeCatalogLayer;
  }
  const parentServiceId = activeCatalogLayer.catalogMeta?.parentServiceId;
  if (!parentServiceId) return activeCatalogLayer;
  return layerMap.get(parentServiceId) ?? activeCatalogLayer;
}

function resolveTableTargetLayer(
  activeCatalogLayer: CatalogLayer | undefined,
  serviceContextLayer: CatalogLayer | undefined,
  selectedSubLayerId: string | undefined,
): CatalogLayer | null {
  if (!activeCatalogLayer) return null;
  const siblings = serviceContextLayer?.catalogMeta?.siblingLayers ?? [];
  if (siblings.length > 0) {
    if (selectedSubLayerId) {
      const selected = siblings.find((layer) => layer.id === selectedSubLayerId);
      if (selected) return selected;
    }
    if (isDendraLatestCatalogLayer(activeCatalogLayer)) return activeCatalogLayer;
    const latest = siblings.find((layer) => isDendraLatestCatalogLayer(layer));
    if (latest) return latest;
    return siblings[0] ?? activeCatalogLayer;
  }
  return activeCatalogLayer;
}

export function DendraOverviewTab({
  stationCount, loading, layerTitle, onBrowseClick,
}: DendraOverviewTabProps) {
  const navigate = useNavigate();
  const countDisplay = loading ? '...' : stationCount.toLocaleString();
  const { activeLayer } = useLayers();
  const { layerMap } = useCatalog();
  const {
    openTableOverlay,
    closeTableOverlay,
    isTableOverlayOpen,
    tableOverlayLayerId,
  } = useTNCArcGIS();

  const activeCatalogLayer = activeLayer?.dataSource === 'dendra'
    ? layerMap.get(activeLayer.layerId)
    : undefined;
  const serviceContextLayer = useMemo(
    () => resolveServiceContextLayer(activeCatalogLayer, layerMap),
    [activeCatalogLayer, layerMap],
  );
  const tableTargetLayer = useMemo(
    () => resolveTableTargetLayer(
      activeCatalogLayer,
      serviceContextLayer,
      activeLayer?.selectedSubLayerId,
    ),
    [activeCatalogLayer, serviceContextLayer, activeLayer?.selectedSubLayerId],
  );

  const serviceTitle = activeLayer?.dataSource === 'dendra'
    ? (resolveDendraServiceTitle(layerMap, activeLayer.layerId) ?? layerTitle)
    : layerTitle;
  const currentLayerName = tableTargetLayer?.name
    ?? activeCatalogLayer?.name
    ?? serviceTitle
    ?? '—';
  const catalogDescription = serviceContextLayer?.catalogMeta?.description?.trim()
    || activeCatalogLayer?.catalogMeta?.description?.trim()
    || '';
  const [resolvedDescription, setResolvedDescription] = useState(catalogDescription);
  const [isSourceOverlayOpen, setIsSourceOverlayOpen] = useState(false);
  const [sourceIframeStatus, setSourceIframeStatus] = useState<SourceIframeStatus>('idle');
  const [liveMonitoringExpanded, setLiveMonitoringExpanded] = useState(false);

  const sourceUrl = useMemo(() => {
    if (!tableTargetLayer?.catalogMeta) return '';
    try {
      return buildServiceUrl(tableTargetLayer.catalogMeta);
    } catch {
      return '';
    }
  }, [tableTargetLayer?.catalogMeta]);

  const sourceLabel = formatCatalogSourcePath(serviceContextLayer ?? tableTargetLayer ?? activeCatalogLayer);
  const isTableOpen = isTableOverlayOpen && tableOverlayLayerId === tableTargetLayer?.id;

  const monitoringTarget = useMemo(() => {
    const meta = (serviceContextLayer ?? activeCatalogLayer)?.catalogMeta;
    if (!meta?.servicePath) return null;
    const binding = resolveRendererBinding(meta.servicePath);
    if (!binding) return null;
    return {
      datasetId: meta.datasetId,
      servicePath: meta.servicePath,
      sensorId: binding.variableKey,
      displayName: serviceTitle ?? 'this dataset',
    };
  }, [serviceContextLayer, activeCatalogLayer, serviceTitle]);

  useEffect(() => {
    let cancelled = false;
    setResolvedDescription(catalogDescription);

    const serviceMeta = serviceContextLayer?.catalogMeta ?? activeCatalogLayer?.catalogMeta;
    if (!serviceMeta?.hasFeatureServer) return () => { cancelled = true; };

    fetchServiceDescription(serviceMeta)
      .then((serviceDescription) => {
        if (cancelled || !serviceDescription) return;
        setResolvedDescription(serviceDescription);
      })
      .catch(() => {
        // Keep catalog/fallback description when metadata fetch fails.
      });

    return () => {
      cancelled = true;
    };
  }, [serviceContextLayer, activeCatalogLayer, catalogDescription]);

  useEffect(() => {
    if (!isSourceOverlayOpen || !sourceUrl || sourceIframeStatus !== 'loading') return undefined;
    const timeoutId = window.setTimeout(() => {
      setSourceIframeStatus((current) => (current === 'loading' ? 'blocked' : current));
    }, 4500);
    return () => window.clearTimeout(timeoutId);
  }, [isSourceOverlayOpen, sourceUrl, sourceIframeStatus]);

  const handleOpenLiveMonitoring = () => {
    if (!monitoringTarget) return;
    publishMonitoringSensorFocus({
      datasetId: monitoringTarget.datasetId,
      servicePath: monitoringTarget.servicePath,
      sensorId: monitoringTarget.sensorId,
    });
    navigate('/monitoring');
  };

  const handleOpenSourceOverlay = () => {
    if (!sourceUrl) return;
    setSourceIframeStatus('loading');
    setIsSourceOverlayOpen(true);
  };

  const handleToggleTable = () => {
    if (!tableTargetLayer) return;
    if (isTableOpen) {
      closeTableOverlay();
      return;
    }
    openTableOverlay(tableTargetLayer.id);
  };

  return (
    <div id="dendra-overview-tab" className="flex min-h-full flex-col">
      <div id="dendra-overview-content" className="flex-1 space-y-4 pb-4">
        {monitoringTarget && (
          <div
            id="dendra-overview-live-monitoring"
            className="rounded-md border border-sky-200 bg-sky-50"
          >
            <div className="flex items-center gap-2 px-2.5 py-1.5">
              <button
                id="dendra-overview-live-monitoring-toggle"
                type="button"
                onClick={() => setLiveMonitoringExpanded((prev) => !prev)}
                className="flex min-w-0 flex-1 items-center gap-2 text-left text-xs text-sky-950 hover:text-sky-900"
                aria-expanded={liveMonitoringExpanded}
              >
                <Activity className="h-3.5 w-3.5 shrink-0 text-sky-700" aria-hidden />
                <span className="min-w-0 flex-1 truncate font-medium">
                  Live monitoring available
                </span>
                {liveMonitoringExpanded
                  ? <ChevronDown className="h-3.5 w-3.5 shrink-0 text-sky-700" />
                  : <ChevronRight className="h-3.5 w-3.5 shrink-0 text-sky-700" />}
              </button>
              <button
                id="dendra-overview-live-monitoring-cta"
                type="button"
                onClick={handleOpenLiveMonitoring}
                className="shrink-0 rounded-md border border-sky-300 bg-white px-2 py-1 text-[11px] font-semibold text-sky-900 hover:bg-sky-100"
              >
                Open
              </button>
            </div>
            {liveMonitoringExpanded && (
              <p
                id="dendra-overview-live-monitoring-body"
                className="border-t border-sky-200/80 px-2.5 py-2 text-[11px] leading-relaxed text-sky-950/90"
              >
                These <strong>{monitoringTarget.displayName}</strong> readings are streamed from
                live sensors. Open Live Monitoring to see realtime metrics and visualizations for
                this dataset.
              </p>
            )}
          </div>
        )}

        {/* Description */}
        <div id="dendra-overview-description-block" className="space-y-2">
          <h3 id="dendra-overview-title" className="text-sm font-semibold text-gray-900">
            Feature Service Overview
          </h3>
          {resolvedDescription ? (
            looksLikeHtml(resolvedDescription) ? (
              <SafeHtml
                id="dendra-overview-description"
                html={resolvedDescription}
                className="text-sm leading-relaxed text-gray-600 [&_a]:font-medium [&_a]:text-emerald-700 [&_a]:underline hover:[&_a]:text-emerald-800 [&_p]:mb-3 [&_p:last-child]:mb-0 [&_strong]:font-semibold"
              />
            ) : (
              <p
                id="dendra-overview-description"
                className="whitespace-pre-line text-sm leading-relaxed text-gray-600"
              >
                {resolvedDescription}
              </p>
            )
          ) : (
            <p id="dendra-overview-description" className="text-sm leading-relaxed text-gray-600">
              Real-time and historical sensor data from the Dangermond Preserve.
              {serviceTitle && (
                <>
                  {' '}
                  This layer shows <strong>{serviceTitle}</strong> with station locations and
                  associated datastream measurements.
                </>
              )}
            </p>
          )}
        </div>

        {/* Metadata + REST / table actions (ArcGIS-style) */}
        <div id="dendra-overview-metadata" className="rounded-lg border border-slate-200 bg-slate-50 p-3">
          <dl className="grid grid-cols-2 gap-x-4 gap-y-2.5 text-sm">
            <MetaRow label="Stations" value={countDisplay} />
            <MetaRow label="Service" value={serviceTitle ?? '—'} />
            <MetaRow label="Current layer" value={currentLayerName} />
            <MetaRow label="Source" value={sourceLabel} />
            <MetaRow label="Schema" value="Locations + Latest + Data" />
            <MetaRow label="Update frequency" value="Continuous" />
          </dl>

          <div id="dendra-overview-source-actions" className="mt-3 grid grid-cols-2 gap-2">
            <button
              id="dendra-overview-open-rest-overlay"
              type="button"
              onClick={handleOpenSourceOverlay}
              disabled={!sourceUrl}
              className="rounded-md border border-gray-300 bg-white px-2 py-2 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
            >
              View REST URL
            </button>
            <a
              id="dendra-overview-open-rest-tab"
              href={sourceUrl || '#'}
              target="_blank"
              rel="noopener noreferrer"
              className={`flex items-center justify-center rounded-md border px-2 py-2 text-xs font-medium ${
                sourceUrl
                  ? 'border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100'
                  : 'pointer-events-none border-gray-200 bg-gray-100 text-gray-400'
              }`}
            >
              Open in new tab
            </a>
          </div>

          <button
            id="dendra-overview-open-table"
            type="button"
            onClick={handleToggleTable}
            disabled={!tableTargetLayer?.catalogMeta?.hasFeatureServer}
            className="mt-2 inline-flex w-full items-center justify-center gap-1.5 rounded-md border border-emerald-300 bg-emerald-50 px-2 py-2 text-xs font-semibold text-emerald-800 transition-colors hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Table2 className="h-3.5 w-3.5" />
            {isTableOpen ? 'Close table view' : 'Open table view'}
          </button>
        </div>

        <DendraOverviewPreviewChart />

        <DendraRawDataCaution id="dendra-overview-raw-data-caution" variant="banner" />
      </div>

      <div
        id="dendra-overview-footer"
        className="sticky bottom-0 z-10 -mx-4 -mb-4 mt-auto border-t border-gray-200 bg-white px-4 pt-3 pb-4"
      >
        <button
          id="dendra-browse-cta"
          type="button"
          onClick={onBrowseClick}
          className="w-full min-h-[44px] rounded-lg bg-[#2e7d32] py-3 text-sm font-medium text-white
                     transition-all duration-150 ease-out hover:scale-[1.02] hover:bg-[#256d29]
                     focus:outline-none focus:ring-2 focus:ring-[#2e7d32] focus:ring-offset-2 active:scale-100"
        >
          Browse Data &rarr;
        </button>
      </div>

      {isSourceOverlayOpen && sourceUrl && (
        <OverviewSourceOverlay
          sourceUrl={sourceUrl}
          sourceIframeStatus={sourceIframeStatus}
          onClose={() => {
            setIsSourceOverlayOpen(false);
            setSourceIframeStatus('idle');
          }}
          onLoad={() => setSourceIframeStatus('ready')}
          onError={() => setSourceIframeStatus('blocked')}
          onRetryEmbed={() => setSourceIframeStatus('loading')}
        />
      )}
    </div>
  );
}

function MetaRow({ label, value }: { label: string; value: string }) {
  return (
    <>
      <dt className="text-gray-500">{label}</dt>
      <dd className="truncate text-right font-medium text-gray-900" title={value}>{value}</dd>
    </>
  );
}
