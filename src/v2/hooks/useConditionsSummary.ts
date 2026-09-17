// ============================================================================
// useConditionsSummary — the headline numbers the Current Conditions panel shows
// before any layer has been turned on.
//
// Each tile mounts immediately and fills in as its own fetch completes. A hung
// terrain lookup on one metric cannot block the others; failed tiles offer a
// per-card retry.
// ============================================================================

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { clearCacheByPrefix } from '../../services/cacheService';
import { fetchLatestWind, type WindSnapshot } from '../services/windService';
import {
  fetchSensorSnapshot,
  SENSOR_VARIABLES,
  type ScalarSnapshot,
  type SensorVariableId,
} from '../services/sensorService';
import { SENSOR_REFRESH_INTERVAL_MS } from './useSensorData';

/**
 * Scalars the summary draws on, in tile order. Every live scalar except cameras
 * (cameras have no single headline reading). Wind is fetched separately and
 * appended as the `wind` metric.
 */
const SUMMARY_VARIABLES = [
  'temp',
  'humidity',
  'pressure',
  'precip',
  'solar',
  'soilTemp',
  'soilMoisture',
  'groundwater',
  'gaugeHeight',
  'waterTemp',
  'streamLevel',
  'discharge',
  'conductivity',
] as const satisfies readonly SensorVariableId[];

export type SummaryMetricId = (typeof SUMMARY_VARIABLES)[number] | 'wind';

export const SUMMARY_METRIC_IDS: readonly SummaryMetricId[] = [...SUMMARY_VARIABLES, 'wind'];

/** How many metrics the summary attempts to load (scalars + wind). */
export const CONDITIONS_SUMMARY_METRIC_COUNT = SUMMARY_METRIC_IDS.length;

/** Cap per-metric wait so a hung elevation sample cannot block a card forever. */
const METRIC_FETCH_TIMEOUT_MS = 20_000;

export type SummaryMetricStatus = 'loading' | 'ready' | 'error';

export interface ConditionsReading {
  value: number;
  unit: string;
  decimals: number;
  /** Which station reported this maximum, so the number has a provenance. */
  stationName: string;
  observedAt: number;
}

export interface SummaryMetricState {
  status: SummaryMetricStatus;
  reading: ConditionsReading | null;
  error: string | null;
}

export type SummaryMetricsState = Record<SummaryMetricId, SummaryMetricState>;

/** @deprecated Prefer `metrics` — kept for call sites that only need values. */
export type ConditionsReadings = Partial<Record<SummaryMetricId, ConditionsReading>>;

export interface UseConditionsSummaryResult {
  metrics: SummaryMetricsState;
  /** Convenience map of successful readings only. */
  readings: ConditionsReadings;
  /** True while any metric is still loading. */
  isLoading: boolean;
  /** Newest observation across metrics that have loaded. */
  observedAt: number | null;
  /** How many metrics are currently in an error state. */
  failedCount: number;
  /** Re-fetch a single card after a timeout or failure. */
  refreshMetric: (metricId: SummaryMetricId) => void;
}

function emptyMetric(status: SummaryMetricStatus = 'loading'): SummaryMetricState {
  return { status, reading: null, error: null };
}

function createInitialMetrics(): SummaryMetricsState {
  return Object.fromEntries(
    SUMMARY_METRIC_IDS.map((id) => [id, emptyMetric('loading')]),
  ) as SummaryMetricsState;
}

function summarizeScalar(snapshot: ScalarSnapshot): ConditionsReading | null {
  if (snapshot.readings.length === 0) return null;

  let peak = snapshot.readings[0];
  for (const reading of snapshot.readings) {
    if (reading.value > peak.value) peak = reading;
  }

  const config = SENSOR_VARIABLES[snapshot.variableId];
  return {
    value: peak.value,
    unit: config.unit,
    decimals: config.decimals,
    stationName: peak.stationName,
    observedAt: peak.observedAt,
  };
}

/**
 * The strongest sustained wind, not the strongest gust. Gust comes from a
 * separate field and is already the headline on the wind panel; taking the
 * highest station average keeps this tile meaning the same thing as its
 * neighbours.
 */
function summarizeWind(snapshot: WindSnapshot): ConditionsReading | null {
  if (snapshot.readings.length === 0) return null;

  let peak = snapshot.readings[0];
  for (const reading of snapshot.readings) {
    if (reading.windSpeedAvg > peak.windSpeedAvg) peak = reading;
  }

  return {
    value: peak.windSpeedAvg,
    unit: 'm/s',
    decimals: 1,
    stationName: peak.stationName,
    observedAt: peak.observedAt,
  };
}

function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = window.setTimeout(() => {
      reject(new Error(`${label} timed out after ${Math.round(ms / 1000)}s`));
    }, ms);

    promise.then(
      (value) => {
        window.clearTimeout(timer);
        resolve(value);
      },
      (error) => {
        window.clearTimeout(timer);
        reject(error);
      },
    );
  });
}

function errorMessage(caught: unknown): string {
  if (caught instanceof Error && caught.message) return caught.message;
  return 'Failed to load';
}

async function fetchMetricReading(metricId: SummaryMetricId): Promise<ConditionsReading | null> {
  if (metricId === 'wind') {
    return summarizeWind(
      await withTimeout(fetchLatestWind(), METRIC_FETCH_TIMEOUT_MS, 'wind'),
    );
  }

  return summarizeScalar(
    await withTimeout(fetchSensorSnapshot(metricId), METRIC_FETCH_TIMEOUT_MS, metricId),
  );
}

function clearMetricCache(metricId: SummaryMetricId): void {
  if (metricId === 'wind') {
    clearCacheByPrefix('wind-latest');
    return;
  }
  clearCacheByPrefix(`sensor-latest-${metricId}`);
}

/**
 * Always keeps the headline numbers warm in the background. Each card owns its
 * own load state so the panel paints labels immediately and fills values in as
 * services answer.
 */
export function useConditionsSummary(): UseConditionsSummaryResult {
  const [metrics, setMetrics] = useState<SummaryMetricsState>(createInitialMetrics);
  const requestIdByMetricRef = useRef<Partial<Record<SummaryMetricId, number>>>({});

  const applyMetricResult = useCallback(
    (metricId: SummaryMetricId, requestId: number, result: SummaryMetricState) => {
      if (requestIdByMetricRef.current[metricId] !== requestId) return;
      setMetrics((previous) => ({ ...previous, [metricId]: result }));
    },
    [],
  );

  const loadMetric = useCallback(
    async (metricId: SummaryMetricId, options: { bypassCache: boolean; showLoading: boolean }) => {
      const requestId = (requestIdByMetricRef.current[metricId] ?? 0) + 1;
      requestIdByMetricRef.current[metricId] = requestId;

      if (options.bypassCache) clearMetricCache(metricId);

      if (options.showLoading) {
        setMetrics((previous) => ({
          ...previous,
          [metricId]: {
            status: 'loading',
            // Keep the last good reading under the spinner on manual retry.
            reading: previous[metricId]?.reading ?? null,
            error: null,
          },
        }));
      }

      try {
        const reading = await fetchMetricReading(metricId);
        if (!reading) {
          applyMetricResult(metricId, requestId, {
            status: 'error',
            reading: null,
            error: 'No stations reporting',
          });
          return;
        }

        applyMetricResult(metricId, requestId, {
          status: 'ready',
          reading,
          error: null,
        });
      } catch (caught) {
        console.warn(`[useConditionsSummary] ${metricId} failed:`, caught);
        applyMetricResult(metricId, requestId, {
          status: 'error',
          reading: null,
          error: errorMessage(caught),
        });
      }
    },
    [applyMetricResult],
  );

  const loadAll = useCallback(
    (options: { bypassCache: boolean; showLoading: boolean }) => {
      for (const metricId of SUMMARY_METRIC_IDS) {
        void loadMetric(metricId, options);
      }
    },
    [loadMetric],
  );

  const refreshMetric = useCallback(
    (metricId: SummaryMetricId) => {
      void loadMetric(metricId, { bypassCache: true, showLoading: true });
    },
    [loadMetric],
  );

  useEffect(() => {
    loadAll({ bypassCache: false, showLoading: true });

    const intervalId = window.setInterval(() => {
      // Background refresh keeps existing values on screen until new ones land.
      loadAll({ bypassCache: true, showLoading: false });
    }, SENSOR_REFRESH_INTERVAL_MS);

    return () => {
      window.clearInterval(intervalId);
      for (const metricId of SUMMARY_METRIC_IDS) {
        requestIdByMetricRef.current[metricId] =
          (requestIdByMetricRef.current[metricId] ?? 0) + 1;
      }
    };
  }, [loadAll]);

  const readings = useMemo(() => {
    const next: ConditionsReadings = {};
    for (const metricId of SUMMARY_METRIC_IDS) {
      const reading = metrics[metricId]?.reading;
      if (reading) next[metricId] = reading;
    }
    return next;
  }, [metrics]);

  const failedCount = SUMMARY_METRIC_IDS.filter(
    (metricId) => metrics[metricId]?.status === 'error',
  ).length;

  const isLoading = SUMMARY_METRIC_IDS.some(
    (metricId) => metrics[metricId]?.status === 'loading',
  );

  const observed = Object.values(readings).map((reading) => reading.observedAt);

  return {
    metrics,
    readings,
    isLoading,
    observedAt: observed.length ? Math.max(...observed) : null,
    failedCount,
    refreshMetric,
  };
}
