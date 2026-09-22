// ============================================================================
// Progressive multi-station time-series loader for the Dendra browse chart modal.
// Recent window first (after extent clamp), then a single older backfill fetch.
// ============================================================================

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  datastreamMatchesLatestField,
  fetchTimeSeries,
  formatStationDisplayName,
  normalizeDatastreamTypeName,
  planProgressiveTimeSeries,
  type DendraStation,
  type DendraSummary,
  type DendraTimeSeriesPoint,
} from '../../../services/dendraStationService';
import { DENDRA_SERIES_COLORS } from './DendraMultiSeriesChart';

const FETCH_CONCURRENCY = 3;

export interface DendraBrowseQuery {
  serviceUrl: string;
  startDate: string;
  endDate: string;
  /** Selected Latest-layer field keys (e.g. rainfall_cumulative) */
  streamNames: string[];
  /** Full Latest-column catalog for unambiguous name→field resolution */
  allStreamFieldKeys: string[];
  stations: DendraStation[];
  summariesByStation: Map<number, DendraSummary[]>;
}

export interface DendraBrowseSeries {
  id: string;
  stationId: number;
  stationLabel: string;
  streamName: string;
  unit: string;
  color: string;
  points: DendraTimeSeriesPoint[];
  loading: boolean;
  progressiveLoading: boolean;
  error: string | null;
  visible: boolean;
}

function mergePoints(
  base: DendraTimeSeriesPoint[],
  extra: DendraTimeSeriesPoint[],
): DendraTimeSeriesPoint[] {
  if (extra.length === 0) return base;
  const map = new Map<number, number>();
  for (const point of base) map.set(point.timestamp, point.value);
  for (const point of extra) map.set(point.timestamp, point.value);
  return Array.from(map.entries())
    .sort(([a], [b]) => a - b)
    .map(([timestamp, value]) => ({ timestamp, value }));
}

function seriesId(stationId: number, dendraDsId: string): string {
  return `${stationId}::${dendraDsId}`;
}

function resolveTargets(query: DendraBrowseQuery): Array<{
  id: string;
  station: DendraStation;
  summary: DendraSummary;
  color: string;
  stationLabel: string;
}> {
  const selectedFields = query.streamNames
    .map((name) => name.trim().toLowerCase())
    .filter(Boolean);
  const fieldUniverse = (
    query.allStreamFieldKeys.length > 0
      ? query.allStreamFieldKeys
      : selectedFields
  ).map((field) => field.trim().toLowerCase()).filter(Boolean);
  const targets: Array<{
    id: string;
    station: DendraStation;
    summary: DendraSummary;
    color: string;
    stationLabel: string;
  }> = [];
  let colorIndex = 0;

  for (const station of query.stations) {
    const summaries = query.summariesByStation.get(station.station_id) ?? [];
    for (const summary of summaries) {
      const fieldKey = (summary.dendra_ds_id || summary.variable || '').trim().toLowerCase();
      if (!fieldKey) continue;
      const matches = selectedFields.some((field) =>
        field === fieldKey
        || datastreamMatchesLatestField(summary.datastream_name, field, fieldUniverse),
      );
      if (!matches) continue;
      targets.push({
        id: seriesId(station.station_id, fieldKey),
        station,
        summary: {
          ...summary,
          dendra_ds_id: summary.dendra_ds_id || fieldKey,
          datastream_name: normalizeDatastreamTypeName(summary.datastream_name)
            || summary.datastream_name,
        },
        color: DENDRA_SERIES_COLORS[colorIndex % DENDRA_SERIES_COLORS.length],
        stationLabel: formatStationDisplayName(station.station_name),
      });
      colorIndex += 1;
    }
  }
  return targets;
}

async function runPool<T>(items: T[], concurrency: number, worker: (item: T) => Promise<void>) {
  let index = 0;
  const runners = Array.from({ length: Math.min(concurrency, items.length) }, async () => {
    while (index < items.length) {
      const current = items[index];
      index += 1;
      await worker(current);
    }
  });
  await Promise.all(runners);
}

export function useDendraBrowseSeriesLoader() {
  const [series, setSeries] = useState<DendraBrowseSeries[]>([]);
  const [loading, setLoading] = useState(false);
  const [progressiveLoading, setProgressiveLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const requestVersionRef = useRef(0);

  const toggleSeriesVisible = useCallback((id: string) => {
    setSeries((prev) => prev.map((entry) => (
      entry.id === id ? { ...entry, visible: !entry.visible } : entry
    )));
  }, []);

  const setSeriesVisible = useCallback((id: string, visible: boolean) => {
    setSeries((prev) => prev.map((entry) => (
      entry.id === id ? { ...entry, visible } : entry
    )));
  }, []);

  const clearSeries = useCallback(() => {
    requestVersionRef.current += 1;
    setSeries([]);
    setLoading(false);
    setProgressiveLoading(false);
    setError(null);
  }, []);

  const loadQuery = useCallback(async (query: DendraBrowseQuery) => {
    const version = ++requestVersionRef.current;
    const targets = resolveTargets(query);

    if (targets.length === 0) {
      setSeries([]);
      setLoading(false);
      setProgressiveLoading(false);
      setError('No matching station/datastream combinations to chart.');
      return;
    }

    const multiStream = query.streamNames.length > 1;
    const initial: DendraBrowseSeries[] = targets.map((target) => ({
      id: target.id,
      stationId: target.station.station_id,
      stationLabel: target.stationLabel,
      streamName: target.summary.datastream_name,
      unit: target.summary.unit?.trim() || '',
      color: target.color,
      points: [],
      loading: true,
      progressiveLoading: false,
      error: null,
      visible: true,
    }));

    setSeries(initial);
    setLoading(true);
    setProgressiveLoading(false);
    setError(null);

    await runPool(targets, FETCH_CONCURRENCY, async (target) => {
      if (requestVersionRef.current !== version) return;
      try {
        const plan = await planProgressiveTimeSeries(
          query.serviceUrl,
          target.station.station_id,
          target.summary.dendra_ds_id,
          { startDate: query.startDate, endDate: query.endDate },
        );
        if (requestVersionRef.current !== version) return;

        if (!plan.initial) {
          setSeries((prev) => prev.map((entry) => (
            entry.id === target.id
              ? {
                ...entry,
                points: [],
                loading: false,
                progressiveLoading: false,
                error: 'No readings in range',
                stationLabel: multiStream
                  ? `${target.stationLabel} · ${target.summary.datastream_name}`
                  : target.stationLabel,
              }
              : entry
          )));
          return;
        }

        const result = await fetchTimeSeries(
          query.serviceUrl,
          target.station.station_id,
          target.summary.datastream_name,
          target.summary.dendra_ds_id,
          plan.initial,
        );
        if (requestVersionRef.current !== version) return;

        const shouldBackfill = plan.backfill != null;
        setSeries((prev) => prev.map((entry) => (
          entry.id === target.id
            ? {
              ...entry,
              points: result.points,
              loading: false,
              progressiveLoading: shouldBackfill,
              error: result.points.length === 0 && !shouldBackfill
                ? 'No readings in range'
                : null,
              stationLabel: multiStream
                ? `${target.stationLabel} · ${target.summary.datastream_name}`
                : target.stationLabel,
            }
            : entry
        )));

        if (!plan.backfill) return;

        try {
          const chunk = await fetchTimeSeries(
            query.serviceUrl,
            target.station.station_id,
            target.summary.datastream_name,
            target.summary.dendra_ds_id,
            plan.backfill,
          );
          if (requestVersionRef.current !== version) return;
          setSeries((prev) => prev.map((entry) => {
            if (entry.id !== target.id) return entry;
            const merged = mergePoints(entry.points, chunk.points);
            return {
              ...entry,
              points: merged,
              progressiveLoading: false,
              error: merged.length === 0 ? 'No readings in range' : null,
            };
          }));
        } catch {
          if (requestVersionRef.current !== version) return;
          setSeries((prev) => prev.map((entry) => (
            entry.id === target.id ? { ...entry, progressiveLoading: false } : entry
          )));
        }
      } catch (err) {
        if (requestVersionRef.current !== version) return;
        setSeries((prev) => prev.map((entry) => (
          entry.id === target.id
            ? {
              ...entry,
              loading: false,
              progressiveLoading: false,
              error: err instanceof Error ? err.message : 'Failed to load series',
            }
            : entry
        )));
      }
    });

    if (requestVersionRef.current !== version) return;
    setLoading(false);
  }, []);

  useEffect(() => {
    const anyProgressive = series.some((entry) => entry.progressiveLoading);
    setProgressiveLoading(anyProgressive);
  }, [series]);

  return {
    series,
    loading,
    progressiveLoading,
    error,
    loadQuery,
    clearSeries,
    toggleSeriesVisible,
    setSeriesVisible,
  };
}
