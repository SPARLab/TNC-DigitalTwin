import { useCallback, useEffect, useRef, useState } from 'react';
import type { ActiveLayer, PinnedLayer } from '../../../types';
import {
  fetchTimeSeries,
  type DendraStation,
  type DendraSummary,
} from '../../../services/dendraStationService';
import type { DendraChartFilter, DendraChartPanelState } from './types';
import {
  applyChartFilter,
  buildInitialPanelRect,
  DEFAULT_CHART_FILTER,
  toDateInputValue,
} from './chartDataTransforms';

interface UseDendraChartPanelsParams {
  activeLayer: ActiveLayer | null;
  pinnedLayers: PinnedLayer[];
  activeServiceUrl: string | null;
}

export function useDendraChartPanels({
  activeLayer,
  pinnedLayers,
  activeServiceUrl,
}: UseDendraChartPanelsParams) {
  const [chartPanels, setChartPanels] = useState<DendraChartPanelState[]>([]);
  const nextChartZIndexRef = useRef(20);
  const requestVersionRef = useRef<Map<string, number>>(new Map());
  const INITIAL_RENDER_DAYS = 30;
  const BACKFILL_CHUNK_DAYS = 120;

  const parseDateUtc = (date: string): number | null => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return null;
    return Date.parse(`${date}T00:00:00.000Z`);
  };

  const toDateUtc = (epochMs: number): string => new Date(epochMs).toISOString().slice(0, 10);

  const mergePoints = (
    base: DendraChartPanelState['rawData'],
    extra: DendraChartPanelState['rawData'],
  ): DendraChartPanelState['rawData'] => {
    if (extra.length === 0) return base;
    const map = new Map<number, number>();
    for (const point of base) map.set(point.timestamp, point.value);
    for (const point of extra) map.set(point.timestamp, point.value);
    return Array.from(map.entries())
      .sort(([a], [b]) => a - b)
      .map(([timestamp, value]) => ({ timestamp, value }));
  };

  const requestPanelData = useCallback((
    panelId: string,
    panel: Pick<DendraChartPanelState, 'station' | 'summary' | 'sourceServiceUrl'>,
    filter: DendraChartFilter,
  ) => {
    if (!panel.station || !panel.summary) return;

    const nextVersion = (requestVersionRef.current.get(panelId) ?? 0) + 1;
    requestVersionRef.current.set(panelId, nextVersion);
    setChartPanels((prev) => prev.map((candidate) => (
      candidate.id === panelId
        ? { ...candidate, loading: true, progressiveLoading: false, error: null }
        : candidate
    )));

    const rangeStartMs = filter.startDate ? parseDateUtc(filter.startDate) : null;
    const rangeEndMs = filter.endDate ? parseDateUtc(filter.endDate) : null;
    const canProgressivelyBackfill = rangeStartMs != null && rangeEndMs != null && rangeEndMs >= rangeStartMs;
    const initialStartMs = canProgressivelyBackfill
      ? Math.max(rangeStartMs, rangeEndMs - (INITIAL_RENDER_DAYS - 1) * 24 * 60 * 60 * 1000)
      : null;
    const initialStartDate = initialStartMs != null ? toDateUtc(initialStartMs) : filter.startDate;
    const initialEndDate = filter.endDate;

    fetchTimeSeries(
      panel.sourceServiceUrl,
      panel.station.station_id,
      panel.summary.datastream_name,
      panel.summary.dendra_ds_id,
      {
        startDate: initialStartDate || undefined,
        endDate: initialEndDate || undefined,
      },
    )
      .then((result) => {
        if (requestVersionRef.current.get(panelId) !== nextVersion) return;
        const shouldBackfill =
          canProgressivelyBackfill
          && initialStartMs != null
          && rangeStartMs != null
          && initialStartMs > rangeStartMs;

        setChartPanels((prev) => prev.map((candidate) => (
          candidate.id === panelId
            ? {
              ...candidate,
              rawData: result.points,
              data: applyChartFilter(result.points, filter),
              loading: false,
              progressiveLoading: shouldBackfill,
              error: null,
            }
            : candidate
        )));

        if (!shouldBackfill || initialStartMs == null || rangeStartMs == null) return;

        let cursorEndMs = initialStartMs - 24 * 60 * 60 * 1000;
        const backfill = async () => {
          while (cursorEndMs >= rangeStartMs) {
            if (requestVersionRef.current.get(panelId) !== nextVersion) return;
            const chunkStartMs = Math.max(
              rangeStartMs,
              cursorEndMs - (BACKFILL_CHUNK_DAYS - 1) * 24 * 60 * 60 * 1000,
            );
            const chunkStartDate = toDateUtc(chunkStartMs);
            const chunkEndDate = toDateUtc(cursorEndMs);

            try {
              const chunk = await fetchTimeSeries(
                panel.sourceServiceUrl,
                panel.station.station_id,
                panel.summary.datastream_name,
                panel.summary.dendra_ds_id,
                {
                  startDate: chunkStartDate,
                  endDate: chunkEndDate,
                },
              );
              if (requestVersionRef.current.get(panelId) !== nextVersion) return;
              setChartPanels((prev) => prev.map((candidate) => {
                if (candidate.id !== panelId) return candidate;
                const mergedRaw = mergePoints(candidate.rawData, chunk.points);
                return {
                  ...candidate,
                  rawData: mergedRaw,
                  data: applyChartFilter(mergedRaw, candidate.filter),
                  progressiveLoading: true,
                };
              }));
            } catch (err) {
              if (requestVersionRef.current.get(panelId) !== nextVersion) return;
              console.warn('[Dendra Chart] ⚠️ Progressive backfill chunk failed:', err);
              break;
            }

            cursorEndMs = chunkStartMs - 24 * 60 * 60 * 1000;
          }

          if (requestVersionRef.current.get(panelId) !== nextVersion) return;
          setChartPanels((prev) => prev.map((candidate) => (
            candidate.id === panelId
              ? { ...candidate, progressiveLoading: false }
              : candidate
          )));
        };

        void backfill();
      })
      .catch((err) => {
        if (requestVersionRef.current.get(panelId) !== nextVersion) return;
        console.error('[Dendra Chart] ❌ Time series fetch failed:', err);
        setChartPanels((prev) => prev.map((candidate) => (
          candidate.id === panelId
            ? {
              ...candidate,
              loading: false,
              progressiveLoading: false,
              error: err instanceof Error ? err.message : 'Failed to load time series',
            }
            : candidate
        )));
      });
  }, []);

  const openChart = useCallback((station: DendraStation, summary: DendraSummary) => {
    if (!activeServiceUrl) return;
    if (!activeLayer || activeLayer.dataSource !== 'dendra') return;

    const resolvedSourceViewId = activeLayer.viewId
      ?? pinnedLayers.find((pinned) => pinned.layerId === activeLayer.layerId)
        ?.views?.find((view) => view.isVisible)?.id;

    const existingPanel = chartPanels.find((panel) =>
      panel.station?.station_id === station.station_id
      && panel.summary?.datastream_id === summary.datastream_id
      && panel.sourceLayerId === activeLayer.layerId
      && panel.sourceViewId === resolvedSourceViewId
    );
    if (existingPanel) {
      const nextZ = ++nextChartZIndexRef.current;
      setChartPanels((prev) => prev.map((panel) => (
        panel.id === existingPanel.id
          ? { ...panel, minimized: false, zIndex: nextZ }
          : panel
      )));
      return;
    }

    const panelId = `${station.station_id}-${summary.datastream_id}-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const panelRect = buildInitialPanelRect(chartPanels.length);
    const nextZ = ++nextChartZIndexRef.current;
    const newPanel: DendraChartPanelState = {
      id: panelId,
      x: panelRect.x,
      y: panelRect.y,
      width: panelRect.width,
      height: panelRect.height,
      zIndex: nextZ,
      sourceLayerId: activeLayer.layerId,
      sourceServiceUrl: activeServiceUrl,
      sourceViewId: resolvedSourceViewId,
      sourceLayerName: activeLayer.name,
      minimized: false,
      station,
      summary,
      rawData: [],
      data: [],
      filter: DEFAULT_CHART_FILTER,
      loading: true,
      progressiveLoading: false,
      error: null,
    };

    setChartPanels((prev) => [...prev, newPanel]);

    const summaryStartDate = summary.first_reading_time ? toDateInputValue(summary.first_reading_time) : '';
    const summaryEndDate = summary.last_reading_time ? toDateInputValue(summary.last_reading_time) : '';
    const filter: DendraChartFilter = {
      startDate: summaryStartDate,
      endDate: summaryEndDate,
      aggregation: 'hourly',
    };

    setChartPanels((prev) => prev.map((panel) => (
      panel.id === panelId
        ? { ...panel, filter }
        : panel
    )));
    requestPanelData(panelId, newPanel, filter);
  }, [activeServiceUrl, chartPanels, activeLayer, pinnedLayers, requestPanelData]);

  const setChartFilter = useCallback((panelId: string, partial: Partial<DendraChartFilter>) => {
    const panel = chartPanels.find((candidate) => candidate.id === panelId);
    if (!panel) return;

    const nextFilter: DendraChartFilter = { ...panel.filter, ...partial };
    const hasDatePatch = Object.prototype.hasOwnProperty.call(partial, 'startDate')
      || Object.prototype.hasOwnProperty.call(partial, 'endDate');
    const startChanged = partial.startDate !== undefined && partial.startDate !== panel.filter.startDate;
    const endChanged = partial.endDate !== undefined && partial.endDate !== panel.filter.endDate;
    const shouldRefetch = hasDatePatch && (startChanged || endChanged);

    setChartPanels((prev) => prev.map((candidate) => (
      candidate.id === panelId
        ? {
          ...candidate,
          filter: nextFilter,
          data: shouldRefetch ? candidate.data : applyChartFilter(candidate.rawData, nextFilter),
          loading: shouldRefetch ? true : candidate.loading,
          progressiveLoading: shouldRefetch ? false : candidate.progressiveLoading,
          error: shouldRefetch ? null : candidate.error,
        }
        : candidate
    )));

    if (shouldRefetch) {
      requestPanelData(panelId, panel, nextFilter);
    }
  }, [chartPanels, requestPanelData]);

  const closeChart = useCallback((panelId: string) => {
    setChartPanels((prev) => prev.filter((panel) => panel.id !== panelId));
  }, []);

  const toggleMinimizeChart = useCallback((panelId: string) => {
    const nextZ = ++nextChartZIndexRef.current;
    setChartPanels((prev) => prev.map((panel) => (
      panel.id === panelId
        ? { ...panel, minimized: !panel.minimized, zIndex: nextZ }
        : panel
    )));
  }, []);

  const setChartPanelRect = useCallback((
    panelId: string,
    rect: Partial<Pick<DendraChartPanelState, 'x' | 'y' | 'width' | 'height'>>,
  ) => {
    setChartPanels((prev) => prev.map((panel) => (
      panel.id === panelId
        ? { ...panel, ...rect }
        : panel
    )));
  }, []);

  const bringChartToFront = useCallback((panelId: string) => {
    const nextZ = ++nextChartZIndexRef.current;
    setChartPanels((prev) => prev.map((panel) => (
      panel.id === panelId
        ? { ...panel, zIndex: nextZ }
        : panel
    )));
  }, []);

  const getChartPanel = useCallback((
    stationId: number,
    datastreamId: number,
    sourceLayerId?: string,
    sourceViewId?: string,
  ) => {
    const matches = chartPanels.filter((panel) =>
      panel.station?.station_id === stationId
      && panel.summary?.datastream_id === datastreamId
    );
    const sourceMatches = sourceLayerId
      ? matches.filter((panel) =>
        panel.sourceLayerId === sourceLayerId
        && (sourceViewId == null || panel.sourceViewId === sourceViewId)
      )
      : matches;
    if (sourceMatches.length === 0) return null;
    return sourceMatches.reduce((top, panel) => (panel.zIndex > top.zIndex ? panel : top), sourceMatches[0]);
  }, [chartPanels]);

  useEffect(() => {
    setChartPanels((prev) => prev.filter((panel) => {
      const pinned = pinnedLayers.find((pinnedLayer) => pinnedLayer.layerId === panel.sourceLayerId);
      if (pinned) return true;
      return activeLayer?.dataSource === 'dendra' && activeLayer.layerId === panel.sourceLayerId;
    }));
  }, [pinnedLayers, activeLayer?.dataSource, activeLayer?.layerId]);

  return {
    chartPanels,
    getChartPanel,
    openChart,
    setChartFilter,
    closeChart,
    toggleMinimizeChart,
    setChartPanelRect,
    bringChartToFront,
  };
}
