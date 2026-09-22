// ============================================================================
// DendraOverviewPreviewChart — loads week data for candidate stations, shows
// top 3 in the card, and expands to a modal where more stations can be toggled.
// ============================================================================

import { useEffect, useMemo, useState } from 'react';
import { Loader2, Pin, X } from 'lucide-react';
import { useDendra, useSummariesByStation, buildPinnedChartQueryKey } from '../../../context/DendraContext';
import { useCatalog } from '../../../context/CatalogContext';
import { useLayers } from '../../../context/LayerContext';
import {
  fetchTimeSeries,
  formatStationDisplayName,
  prettifyLatestField,
  type DendraStation,
  type DendraSummary,
  type DendraTimeSeriesPoint,
} from '../../../services/dendraStationService';
import {
  DENDRA_SERIES_COLORS,
  DendraMultiSeriesChart,
} from './DendraMultiSeriesChart';

const PREVIEW_STATION_COUNT = 3;
const CANDIDATE_STATION_LIMIT = 10;

function toYmd(date: Date): string {
  return date.toISOString().slice(0, 10);
}

interface StationSeries {
  station: DendraStation;
  summary: DendraSummary;
  points: DendraTimeSeriesPoint[];
  weekMax: number;
}

function pickCandidateStations(stations: DendraStation[]): DendraStation[] {
  const active = stations.filter((station) => station.is_active === 1);
  const pool = active.length > 0 ? active : stations;
  return pool.slice(0, CANDIDATE_STATION_LIMIT);
}

function pickSummaryForField(
  summaries: DendraSummary[] | undefined,
  valueField: string | null,
): DendraSummary | undefined {
  if (!summaries || summaries.length === 0) return undefined;
  if (!valueField) return summaries[0];
  const needle = valueField.trim().toLowerCase();
  return summaries.find((summary) => {
    const key = (summary.dendra_ds_id || summary.variable || '').trim().toLowerCase();
    return key === needle;
  }) ?? summaries[0];
}

function toChartSeries(entries: StationSeries[]) {
  return entries.map((entry, index) => ({
    id: String(entry.station.station_id),
    label: formatStationDisplayName(entry.station.station_name),
    color: DENDRA_SERIES_COLORS[index % DENDRA_SERIES_COLORS.length],
    points: entry.points,
  }));
}

export function DendraOverviewPreviewChart() {
  const {
    stations,
    activeServiceUrl,
    dataLoaded,
    datastreamTypesLoaded,
    loadStationSummaries,
    pinMultiChart,
    updatePinnedMultiChart,
    closePinnedMultiChart,
    pinnedMultiCharts,
    expandPinnedMultiChartRequest,
    clearExpandPinnedMultiChartRequest,
  } = useDendra();
  const summariesByStation = useSummariesByStation();
  const { activeLayer } = useLayers();
  const { layerMap } = useCatalog();
  const [pinFeedback, setPinFeedback] = useState<string | null>(null);
  const [linkedPinnedChartId, setLinkedPinnedChartId] = useState<string | null>(null);
  const activeValueField = useMemo(() => {
    if (activeLayer?.dataSource !== 'dendra') return null;
    const field = layerMap.get(activeLayer.layerId)?.catalogMeta?.valueField?.trim();
    return field || null;
  }, [activeLayer?.dataSource, activeLayer?.layerId, layerMap]);

  const activeMeasureIsInactive = useMemo(() => {
    if (activeLayer?.dataSource !== 'dendra') return false;
    return !!layerMap.get(activeLayer.layerId)?.catalogMeta?.isInactive;
  }, [activeLayer?.dataSource, activeLayer?.layerId, layerMap]);

  const candidateStations = useMemo(() => pickCandidateStations(stations), [stations]);
  const [availableSeries, setAvailableSeries] = useState<StationSeries[]>([]);
  const [selectedStationIds, setSelectedStationIds] = useState<number[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    if (!dataLoaded || !datastreamTypesLoaded) return;
    for (const station of candidateStations) {
      loadStationSummaries(station.station_id);
    }
  }, [candidateStations, dataLoaded, datastreamTypesLoaded, loadStationSummaries]);

  const candidateStreamKey = useMemo(
    () => candidateStations
      .map((station) => {
        const summary = pickSummaryForField(
          summariesByStation.get(station.station_id),
          activeValueField,
        );
        return `${station.station_id}:${summary?.dendra_ds_id ?? ''}`;
      })
      .join('|'),
    [candidateStations, summariesByStation, activeValueField],
  );

  const candidatesReady = useMemo(() => {
    if (candidateStations.length === 0) return false;
    return candidateStations.every((station) => summariesByStation.has(station.station_id));
  }, [candidateStations, summariesByStation]);

  useEffect(() => {
    let cancelled = false;

    async function loadTopStations() {
      if (!activeServiceUrl || !candidatesReady || candidateStations.length === 0) {
        setAvailableSeries([]);
        setSelectedStationIds([]);
        setError(null);
        return;
      }

      // Inactive measures have no recent Latest readings — keep the week chart empty.
      if (activeMeasureIsInactive) {
        setAvailableSeries([]);
        setSelectedStationIds([]);
        setError(null);
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);
      const end = new Date();
      const start = new Date(end.getTime() - 7 * 24 * 60 * 60 * 1000);
      const startDate = toYmd(start);
      const endDate = toYmd(end);

      try {
        const fetched = await Promise.all(
          candidateStations.map(async (station) => {
            const summary = pickSummaryForField(
              summariesByStation.get(station.station_id),
              activeValueField,
            );
            if (!summary?.dendra_ds_id) return null;
            try {
              const result = await fetchTimeSeries(
                activeServiceUrl,
                station.station_id,
                summary.datastream_name,
                summary.dendra_ds_id,
                { startDate, endDate },
              );
              if (result.points.length === 0) return null;
              const weekMax = result.points.reduce(
                (max, point) => (point.value > max ? point.value : max),
                Number.NEGATIVE_INFINITY,
              );
              return {
                station,
                summary,
                points: result.points,
                weekMax,
              } satisfies StationSeries;
            } catch {
              return null;
            }
          }),
        );

        if (cancelled) return;
        const ranked = fetched
          .filter((entry): entry is StationSeries => !!entry)
          .sort((a, b) => b.weekMax - a.weekMax);
        setAvailableSeries(ranked);
        setSelectedStationIds(
          ranked.slice(0, PREVIEW_STATION_COUNT).map((entry) => entry.station.station_id),
        );
      } catch (err) {
        if (cancelled) return;
        setAvailableSeries([]);
        setSelectedStationIds([]);
        setError(err instanceof Error ? err.message : 'Failed to load preview data');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void loadTopStations();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeServiceUrl, candidatesReady, candidateStreamKey, activeValueField, activeMeasureIsInactive]);

  useEffect(() => {
    if (!isModalOpen) return undefined;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsModalOpen(false);
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [isModalOpen]);

  // Expand from a pinned overview chart → open modal with linked pin state.
  useEffect(() => {
    const request = expandPinnedMultiChartRequest;
    if (!request || request.origin !== 'overview') return;
    if (activeLayer?.dataSource === 'dendra' && request.sourceLayerId !== activeLayer.layerId) {
      return;
    }
    if (availableSeries.length === 0) return;
    setSelectedStationIds(
      request.selectedStationIds.length > 0
        ? request.selectedStationIds
        : availableSeries.slice(0, PREVIEW_STATION_COUNT).map((entry) => entry.station.station_id),
    );
    setLinkedPinnedChartId(request.panelId);
    setPinFeedback(null);
    setIsModalOpen(true);
    clearExpandPinnedMultiChartRequest();
  }, [
    expandPinnedMultiChartRequest,
    clearExpandPinnedMultiChartRequest,
    activeLayer?.dataSource,
    activeLayer?.layerId,
    availableSeries,
  ]);

  const previewSeries = useMemo(
    () => availableSeries.slice(0, PREVIEW_STATION_COUNT),
    [availableSeries],
  );
  const previewStationIds = useMemo(
    () => previewSeries.map((entry) => entry.station.station_id),
    [previewSeries],
  );
  const weekRange = useMemo(() => {
    const endDate = toYmd(new Date());
    const startDate = toYmd(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000));
    return { startDate, endDate };
  }, []);

  const previewQueryKey = useMemo(() => buildPinnedChartQueryKey({
    origin: 'overview',
    startDate: weekRange.startDate,
    endDate: weekRange.endDate,
    selectedStreamNames: activeValueField ? [activeValueField] : [],
    selectedStationIds: previewStationIds,
  }), [activeValueField, previewStationIds, weekRange.endDate, weekRange.startDate]);

  const overviewQueryKey = useMemo(() => buildPinnedChartQueryKey({
    origin: 'overview',
    startDate: weekRange.startDate,
    endDate: weekRange.endDate,
    selectedStreamNames: activeValueField ? [activeValueField] : [],
    selectedStationIds,
  }), [activeValueField, selectedStationIds, weekRange.endDate, weekRange.startDate]);

  const matchingPreviewPin = useMemo(() => {
    if (!activeLayer || activeLayer.dataSource !== 'dendra' || previewStationIds.length === 0) {
      return null;
    }
    return pinnedMultiCharts.find((panel) => (
      panel.origin === 'overview'
      && panel.sourceLayerId === activeLayer.layerId
      && panel.queryKey === previewQueryKey
    )) ?? null;
  }, [activeLayer, pinnedMultiCharts, previewQueryKey, previewStationIds.length]);

  const matchingModalPin = useMemo(() => {
    if (!activeLayer || activeLayer.dataSource !== 'dendra' || selectedStationIds.length === 0) {
      return null;
    }
    return pinnedMultiCharts.find((panel) => (
      panel.origin === 'overview'
      && panel.sourceLayerId === activeLayer.layerId
      && panel.queryKey === overviewQueryKey
    )) ?? null;
  }, [activeLayer, overviewQueryKey, pinnedMultiCharts, selectedStationIds.length]);

  // Keep modal link in sync with an existing same-query pin, without
  // overwriting a dirty linked pin while the user is editing stations.
  useEffect(() => {
    if (linkedPinnedChartId) {
      if (!pinnedMultiCharts.some((panel) => panel.id === linkedPinnedChartId)) {
        setLinkedPinnedChartId(null);
      }
      return;
    }
    const match = matchingModalPin ?? matchingPreviewPin;
    if (match) setLinkedPinnedChartId(match.id);
  }, [matchingModalPin, matchingPreviewPin, linkedPinnedChartId, pinnedMultiCharts]);

  if (!dataLoaded || stations.length === 0) return null;

  const modalSeries = availableSeries.filter((entry) =>
    selectedStationIds.includes(entry.station.station_id),
  );
  const streamLabel = availableSeries[0]?.summary.datastream_name
    || (activeValueField ? prettifyLatestField(activeValueField) : 'Datastream');
  const unitLabel = availableSeries[0]?.summary.unit?.trim() || '';
  const stationSubtitle = previewSeries.length > 0
    ? `Top ${previewSeries.length} by week max`
    : 'Comparing stations';

  const toggleStation = (stationId: number) => {
    setSelectedStationIds((previous) => {
      if (previous.includes(stationId)) {
        return previous.filter((id) => id !== stationId);
      }
      return [...previous, stationId];
    });
    setPinFeedback(null);
  };

  const start = weekRange.startDate;
  const end = weekRange.endDate;

  const linkedPanel = linkedPinnedChartId
    ? pinnedMultiCharts.find((panel) => panel.id === linkedPinnedChartId) ?? null
    : null;
  const pinIsDirty = Boolean(linkedPanel && linkedPanel.queryKey !== overviewQueryKey);
  const previewIsPinned = Boolean(matchingPreviewPin);

  const buildOverviewPinPayload = () => {
    if (!activeLayer || activeLayer.dataSource !== 'dendra' || modalSeries.length === 0) return null;
    return {
      title: streamLabel,
      subtitle: 'Last 7 days',
      unit: unitLabel,
      startDate: start,
      endDate: end,
      sourceLayerId: activeLayer.layerId,
      origin: 'overview' as const,
      selectedStreamNames: activeValueField ? [activeValueField] : [],
      selectedStationIds,
      series: modalSeries.map((entry) => {
        const colorIndex = availableSeries.findIndex(
          (candidate) => candidate.station.station_id === entry.station.station_id,
        );
        return {
          id: String(entry.station.station_id),
          label: formatStationDisplayName(entry.station.station_name),
          color: DENDRA_SERIES_COLORS[
            (colorIndex >= 0 ? colorIndex : 0) % DENDRA_SERIES_COLORS.length
          ],
          points: entry.points,
        };
      }),
    };
  };

  const handlePinToMap = (seriesSource: 'preview' | 'modal' = 'modal') => {
    const stationIds = seriesSource === 'preview'
      ? previewSeries.map((entry) => entry.station.station_id)
      : selectedStationIds;
    const seriesEntries = seriesSource === 'preview' ? previewSeries : modalSeries;
    if (!activeLayer || activeLayer.dataSource !== 'dendra' || seriesEntries.length === 0) {
      setPinFeedback('Nothing to pin yet.');
      return;
    }

    const nextQueryKey = buildPinnedChartQueryKey({
      origin: 'overview',
      startDate: start,
      endDate: end,
      selectedStreamNames: activeValueField ? [activeValueField] : [],
      selectedStationIds: stationIds,
    });
    const existing = pinnedMultiCharts.find((panel) => (
      panel.origin === 'overview'
      && panel.sourceLayerId === activeLayer.layerId
      && panel.queryKey === nextQueryKey
    ));
    if (existing) {
      setLinkedPinnedChartId(existing.id);
      setPinFeedback('Already pinned — shown on the map.');
      return;
    }

    const id = pinMultiChart({
      title: streamLabel,
      subtitle: 'Last 7 days',
      unit: unitLabel,
      startDate: start,
      endDate: end,
      sourceLayerId: activeLayer.layerId,
      origin: 'overview',
      selectedStreamNames: activeValueField ? [activeValueField] : [],
      selectedStationIds: stationIds,
      series: seriesEntries.map((entry) => {
        const colorIndex = availableSeries.findIndex(
          (candidate) => candidate.station.station_id === entry.station.station_id,
        );
        return {
          id: String(entry.station.station_id),
          label: formatStationDisplayName(entry.station.station_name),
          color: DENDRA_SERIES_COLORS[
            (colorIndex >= 0 ? colorIndex : 0) % DENDRA_SERIES_COLORS.length
          ],
          points: entry.points,
        };
      }),
    });
    if (id) {
      setLinkedPinnedChartId(id);
      setPinFeedback('Pinned to map — drag, minimize, or close anytime.');
    } else {
      setPinFeedback('Nothing to pin.');
    }
  };

  const handleUnpin = (panelId?: string) => {
    const id = panelId ?? linkedPanel?.id ?? matchingPreviewPin?.id;
    if (!id) return;
    closePinnedMultiChart(id);
    setLinkedPinnedChartId((current) => (current === id ? null : current));
    setPinFeedback('Unpinned from the map.');
  };

  const handleUpdatePin = () => {
    if (!linkedPanel) return;
    const payload = buildOverviewPinPayload();
    if (!payload) return;
    if (updatePinnedMultiChart(linkedPanel.id, payload)) {
      setPinFeedback('Updated the pinned chart on the map.');
    }
  };

  const handlePreviewPinClick = () => {
    if (matchingPreviewPin) {
      handleUnpin(matchingPreviewPin.id);
      return;
    }
    handlePinToMap('preview');
  };

  return (
    <>
      <div
        id="dendra-overview-preview-chart"
        className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm"
      >
        <div className="mb-2 flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-teal-700">
              Last 7 days
            </p>
            <p className="truncate text-sm font-medium text-gray-900" title={streamLabel}>
              {streamLabel}
            </p>
            <p className="truncate text-xs text-gray-500">{stationSubtitle}</p>
          </div>
          {previewSeries.length > 0 && (
            <div className="flex shrink-0 items-center gap-1">
              <button
                id="dendra-overview-preview-pin"
                type="button"
                onClick={handlePreviewPinClick}
                className={`inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-medium ${
                  previewIsPinned
                    ? 'bg-teal-100 text-teal-800 hover:bg-teal-200'
                    : 'text-teal-700 hover:bg-teal-50'
                }`}
                title={previewIsPinned ? 'Unpin preview chart from the map' : 'Pin preview chart to the map'}
                aria-pressed={previewIsPinned}
              >
                <Pin className={`h-3 w-3 ${previewIsPinned ? 'fill-current' : ''}`} />
                {previewIsPinned ? 'Pinned' : 'Pin'}
              </button>
              <button
                id="dendra-overview-preview-open-chart"
                type="button"
                onClick={() => {
                  if (matchingPreviewPin) setLinkedPinnedChartId(matchingPreviewPin.id);
                  setPinFeedback(null);
                  setIsModalOpen(true);
                }}
                className="rounded-md px-2 py-1 text-[11px] font-medium text-teal-700 hover:bg-teal-50"
              >
                Expand
              </button>
            </div>
          )}
        </div>

        <div id="dendra-overview-preview-chart-body" className="relative h-44 w-full">
          {(loading || !candidatesReady) && (
            <div
              id="dendra-overview-preview-loading"
              className="absolute inset-0 z-10 flex items-center justify-center gap-2 bg-white text-xs text-gray-500"
            >
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading top stations…
            </div>
          )}
          {error && !(loading || !candidatesReady) && (
            <div
              id="dendra-overview-preview-error"
              className="absolute inset-0 z-10 flex items-center justify-center bg-white px-2 text-center text-xs text-amber-700"
            >
              {error}
            </div>
          )}
          {!error && !(loading || !candidatesReady) && previewSeries.length === 0 && (
            <div
              id="dendra-overview-preview-empty"
              className="absolute inset-0 z-10 flex items-center justify-center bg-white px-2 text-center text-xs text-gray-500"
            >
              {activeMeasureIsInactive
                ? 'There are no recent readings.'
                : 'No readings in the last 7 days for this datastream.'}
            </div>
          )}
          {previewSeries.length > 0 && (
            <DendraMultiSeriesChart
              series={toChartSeries(previewSeries)}
              unit={unitLabel}
              height={176}
            />
          )}
        </div>
      </div>

      {isModalOpen && availableSeries.length > 0 && (
        <div
          id="dendra-overview-chart-modal-backdrop"
          className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-900/55 p-4 backdrop-blur-sm"
          onClick={() => setIsModalOpen(false)}
          role="presentation"
        >
          <div
            id="dendra-overview-chart-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="dendra-overview-chart-modal-title"
            className="flex max-h-[90vh] w-full max-w-5xl flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3 border-b border-slate-200 px-4 py-3">
              <div className="min-w-0">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-teal-700">
                  Last 7 days
                </p>
                <h2
                  id="dendra-overview-chart-modal-title"
                  className="truncate text-base font-semibold text-gray-900"
                >
                  {streamLabel}
                </h2>
                <p className="text-xs text-gray-500">
                  Showing {modalSeries.length} of {availableSeries.length} stations
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-1">
                {linkedPanel && !pinIsDirty && (
                  <button
                    id="dendra-overview-chart-modal-unpin"
                    type="button"
                    onClick={() => handleUnpin(linkedPanel.id)}
                    className="inline-flex items-center gap-1 rounded-md bg-teal-100 px-2.5 py-1.5 text-xs font-semibold text-teal-800 hover:bg-teal-200"
                    title="Unpin from the map"
                    aria-pressed="true"
                  >
                    <Pin className="h-3.5 w-3.5 fill-current" />
                    Pinned
                  </button>
                )}
                {linkedPanel && pinIsDirty && (
                  <>
                    <button
                      id="dendra-overview-chart-modal-update-pin"
                      type="button"
                      onClick={handleUpdatePin}
                      disabled={modalSeries.length === 0}
                      className="inline-flex items-center gap-1.5 rounded-md bg-teal-700 px-2.5 py-1.5 text-xs font-semibold text-white hover:bg-teal-800 disabled:opacity-40"
                    >
                      <Pin className="h-3.5 w-3.5" />
                      Update pin
                    </button>
                    <button
                      id="dendra-overview-chart-modal-pin-as-new"
                      type="button"
                      onClick={() => handlePinToMap('modal')}
                      disabled={modalSeries.length === 0}
                      className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium text-teal-700 hover:bg-teal-50 disabled:opacity-40"
                    >
                      Pin as new
                    </button>
                    <button
                      id="dendra-overview-chart-modal-unpin-dirty"
                      type="button"
                      onClick={() => handleUnpin(linkedPanel.id)}
                      className="inline-flex items-center gap-1 rounded-md px-2 py-1.5 text-xs font-medium text-slate-500 hover:bg-slate-100"
                    >
                      Unpin
                    </button>
                  </>
                )}
                {!linkedPanel && (
                  <button
                    id="dendra-overview-chart-modal-pin"
                    type="button"
                    onClick={() => handlePinToMap('modal')}
                    disabled={modalSeries.length === 0}
                    className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium text-teal-700 hover:bg-teal-50 disabled:opacity-40"
                    title="Pin this chart to the map"
                  >
                    <Pin className="h-3.5 w-3.5" />
                    Pin to map
                  </button>
                )}
                <button
                  id="dendra-overview-chart-modal-close"
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-md p-1.5 text-gray-500 hover:bg-gray-100 hover:text-gray-800"
                  aria-label="Close chart"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {pinIsDirty && linkedPanel && (
              <p className="border-b border-amber-100 bg-amber-50 px-4 py-2 text-[11px] text-amber-800">
                Station selection differs from your pinned chart. Update the pin or save as a new one.
              </p>
            )}

            {pinFeedback && (
              <p id="dendra-overview-chart-modal-pin-feedback" className="border-b border-slate-100 px-4 py-2 text-xs text-teal-700">
                {pinFeedback}
              </p>
            )}

            <div className="border-b border-slate-100 px-4 py-3">
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                Stations
              </p>
              <div
                id="dendra-overview-chart-modal-station-picker"
                className="flex max-h-28 flex-wrap gap-2 overflow-y-auto"
              >
                {availableSeries.map((entry, index) => {
                  const stationId = entry.station.station_id;
                  const checked = selectedStationIds.includes(stationId);
                  const color = DENDRA_SERIES_COLORS[index % DENDRA_SERIES_COLORS.length];
                  const label = formatStationDisplayName(entry.station.station_name);
                  return (
                    <label
                      key={stationId}
                      id={`dendra-overview-chart-modal-station-${stationId}`}
                      className={`inline-flex cursor-pointer items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs transition-colors ${
                        checked
                          ? 'border-teal-300 bg-teal-50 text-teal-900'
                          : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <input
                        type="checkbox"
                        className="sr-only"
                        checked={checked}
                        onChange={() => toggleStation(stationId)}
                      />
                      <span
                        className="inline-block h-2 w-2 rounded-full"
                        style={{ backgroundColor: checked ? color : '#cbd5e1' }}
                      />
                      {label}
                    </label>
                  );
                })}
              </div>
            </div>

            <div className="min-h-0 flex-1 overflow-auto px-4 py-4">
              {modalSeries.length > 0 ? (
                <DendraMultiSeriesChart
                  series={modalSeries.map((entry) => {
                    const colorIndex = availableSeries.findIndex(
                      (candidate) => candidate.station.station_id === entry.station.station_id,
                    );
                    return {
                      id: String(entry.station.station_id),
                      label: formatStationDisplayName(entry.station.station_name),
                      color: DENDRA_SERIES_COLORS[
                        (colorIndex >= 0 ? colorIndex : 0) % DENDRA_SERIES_COLORS.length
                      ],
                      points: entry.points,
                    };
                  })}
                  unit={unitLabel}
                  height={420}
                  showStats
                  enableZoom
                  showRawDataCaution
                />
              ) : (
                <div className="flex h-[420px] items-center justify-center text-sm text-gray-500">
                  Select at least one station to plot.
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
