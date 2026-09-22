// ============================================================================
// Pinned multi-series chart panels (browse / overview snapshots on the map).
// ============================================================================

import { useCallback, useRef, useState } from 'react';
import { buildInitialPanelRect } from './chartDataTransforms';
import {
  buildPinnedChartQueryKey,
  type DendraPinnedChartOrigin,
  type DendraPinnedExpandRequest,
  type DendraPinnedMultiChartState,
  type DendraPinnedMultiSeries,
} from './types';

export interface PinMultiChartInput {
  title: string;
  subtitle?: string;
  unit?: string;
  startDate: string;
  endDate: string;
  sourceLayerId: string;
  origin: DendraPinnedChartOrigin;
  selectedStreamNames?: string[];
  selectedStationIds?: number[];
  series: DendraPinnedMultiSeries[];
}

function cloneSeries(series: DendraPinnedMultiSeries[]): DendraPinnedMultiSeries[] {
  return series.map((entry) => ({
    ...entry,
    points: entry.points.map((point) => ({ ...point })),
  }));
}

export function useDendraPinnedMultiCharts() {
  const [pinnedMultiCharts, setPinnedMultiCharts] = useState<DendraPinnedMultiChartState[]>([]);
  const [expandRequest, setExpandRequest] = useState<DendraPinnedExpandRequest | null>(null);
  const nextZIndexRef = useRef(40);

  const pinMultiChart = useCallback((input: PinMultiChartInput) => {
    if (input.series.length === 0) return null;

    const selectedStreamNames = input.selectedStreamNames ?? [];
    const selectedStationIds = input.selectedStationIds ?? [];
    const panelRect = buildInitialPanelRect(pinnedMultiCharts.length);
    const leftAligned = {
      ...panelRect,
      x: 12 + (pinnedMultiCharts.length % 3) * 24,
    };
    const nextZ = ++nextZIndexRef.current;
    const id = `multi-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const panel: DendraPinnedMultiChartState = {
      id,
      x: leftAligned.x,
      y: leftAligned.y,
      width: leftAligned.width,
      height: Math.max(leftAligned.height, 460),
      zIndex: nextZ,
      minimized: false,
      title: input.title,
      subtitle: input.subtitle,
      unit: input.unit ?? '',
      startDate: input.startDate,
      endDate: input.endDate,
      sourceLayerId: input.sourceLayerId,
      origin: input.origin,
      selectedStreamNames,
      selectedStationIds,
      queryKey: buildPinnedChartQueryKey({
        origin: input.origin,
        startDate: input.startDate,
        endDate: input.endDate,
        selectedStreamNames,
        selectedStationIds,
      }),
      series: cloneSeries(input.series),
    };
    setPinnedMultiCharts((prev) => [...prev, panel]);
    return id;
  }, [pinnedMultiCharts.length]);

  const updatePinnedMultiChart = useCallback((panelId: string, input: PinMultiChartInput) => {
    if (input.series.length === 0) return false;
    const selectedStreamNames = input.selectedStreamNames ?? [];
    const selectedStationIds = input.selectedStationIds ?? [];
    let updated = false;
    setPinnedMultiCharts((prev) => prev.map((panel) => {
      if (panel.id !== panelId) return panel;
      updated = true;
      return {
        ...panel,
        title: input.title,
        subtitle: input.subtitle,
        unit: input.unit ?? '',
        startDate: input.startDate,
        endDate: input.endDate,
        sourceLayerId: input.sourceLayerId,
        origin: input.origin,
        selectedStreamNames,
        selectedStationIds,
        queryKey: buildPinnedChartQueryKey({
          origin: input.origin,
          startDate: input.startDate,
          endDate: input.endDate,
          selectedStreamNames,
          selectedStationIds,
        }),
        series: cloneSeries(input.series),
        minimized: false,
      };
    }));
    return updated;
  }, []);

  const closePinnedMultiChart = useCallback((panelId: string) => {
    setPinnedMultiCharts((prev) => prev.filter((panel) => panel.id !== panelId));
    setExpandRequest((prev) => (prev?.panelId === panelId ? null : prev));
  }, []);

  const toggleMinimizePinnedMultiChart = useCallback((panelId: string) => {
    setPinnedMultiCharts((prev) => prev.map((panel) => (
      panel.id === panelId ? { ...panel, minimized: !panel.minimized } : panel
    )));
  }, []);

  const setPinnedMultiChartRect = useCallback((
    panelId: string,
    rect: Partial<Pick<DendraPinnedMultiChartState, 'x' | 'y' | 'width' | 'height'>>,
  ) => {
    setPinnedMultiCharts((prev) => prev.map((panel) => (
      panel.id === panelId ? { ...panel, ...rect } : panel
    )));
  }, []);

  const bringPinnedMultiChartToFront = useCallback((panelId: string) => {
    const nextZ = ++nextZIndexRef.current;
    setPinnedMultiCharts((prev) => prev.map((panel) => (
      panel.id === panelId ? { ...panel, zIndex: nextZ } : panel
    )));
  }, []);

  const requestExpandPinnedMultiChart = useCallback((panelId: string) => {
    setPinnedMultiCharts((prev) => {
      const panel = prev.find((candidate) => candidate.id === panelId);
      if (!panel) return prev;
      setExpandRequest({
        panelId: panel.id,
        origin: panel.origin,
        title: panel.title,
        startDate: panel.startDate,
        endDate: panel.endDate,
        selectedStreamNames: [...panel.selectedStreamNames],
        selectedStationIds: [...panel.selectedStationIds],
        sourceLayerId: panel.sourceLayerId,
      });
      return prev.map((candidate) => (
        candidate.id === panelId ? { ...candidate, minimized: false } : candidate
      ));
    });
  }, []);

  const clearExpandPinnedMultiChartRequest = useCallback(() => {
    setExpandRequest(null);
  }, []);

  return {
    pinnedMultiCharts,
    expandPinnedMultiChartRequest: expandRequest,
    pinMultiChart,
    updatePinnedMultiChart,
    closePinnedMultiChart,
    toggleMinimizePinnedMultiChart,
    setPinnedMultiChartRect,
    bringPinnedMultiChartToFront,
    requestExpandPinnedMultiChart,
    clearExpandPinnedMultiChartRequest,
  };
}
