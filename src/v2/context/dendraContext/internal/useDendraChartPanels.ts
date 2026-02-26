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
        ? { ...candidate, loading: true, error: null }
        : candidate
    )));

    fetchTimeSeries(
      panel.sourceServiceUrl,
      panel.station.station_id,
      panel.summary.datastream_name,
      panel.summary.dendra_ds_id,
      {
        startDate: filter.startDate || undefined,
        endDate: filter.endDate || undefined,
      },
    )
      .then((result) => {
        if (requestVersionRef.current.get(panelId) !== nextVersion) return;
        setChartPanels((prev) => prev.map((candidate) => (
          candidate.id === panelId
            ? {
              ...candidate,
              rawData: result.points,
              data: applyChartFilter(result.points, filter),
              loading: false,
              error: null,
            }
            : candidate
        )));
      })
      .catch((err) => {
        if (requestVersionRef.current.get(panelId) !== nextVersion) return;
        console.error('[Dendra Chart] ❌ Time series fetch failed:', err);
        setChartPanels((prev) => prev.map((candidate) => (
          candidate.id === panelId
            ? {
              ...candidate,
              loading: false,
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
