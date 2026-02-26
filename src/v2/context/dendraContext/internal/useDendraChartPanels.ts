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

    fetchTimeSeries(activeServiceUrl, station.station_id, summary.datastream_name, summary.dendra_ds_id)
      .then((result) => {
        const startDate = result.points.length > 0 ? toDateInputValue(result.points[0].timestamp) : '';
        const endDate = result.points.length > 0 ? toDateInputValue(result.points[result.points.length - 1].timestamp) : '';
        const filter: DendraChartFilter = {
          startDate,
          endDate,
          aggregation: 'hourly',
        };
        const filteredPoints = applyChartFilter(result.points, filter);
        setChartPanels((prev) => prev.map((panel) => (
          panel.id === panelId
            ? {
              ...panel,
              rawData: result.points,
              data: filteredPoints,
              filter,
              loading: false,
            }
            : panel
        )));
      })
      .catch((err) => {
        console.error('[Dendra Chart] ❌ Time series fetch failed:', err);
        setChartPanels((prev) => prev.map((panel) => (
          panel.id === panelId
            ? {
              ...panel,
              loading: false,
              error: err instanceof Error ? err.message : 'Failed to load time series',
            }
            : panel
        )));
      });
  }, [activeServiceUrl, chartPanels, activeLayer, pinnedLayers]);

  const setChartFilter = useCallback((panelId: string, partial: Partial<DendraChartFilter>) => {
    setChartPanels((prev) => prev.map((panel) => {
      if (panel.id !== panelId) return panel;
      const nextFilter: DendraChartFilter = { ...panel.filter, ...partial };
      return {
        ...panel,
        filter: nextFilter,
        data: applyChartFilter(panel.rawData, nextFilter),
      };
    }));
  }, []);

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
