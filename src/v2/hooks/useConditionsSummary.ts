// ============================================================================
// useConditionsSummary — the headline numbers the Current Conditions panel shows
// before any layer has been turned on.
//
// Each one is the highest reading across the reporting stations rather than an
// average, so the panel answers "how hot, how windy, how humid is it out there
// right now" with the extreme a visitor would care about. The two creek metrics
// come from a single gage, so for those the maximum is simply that gage's latest
// reading, which is what the panel's wording has to accommodate.
//
// This loads independently of the tree selection, which is the whole point: the
// panel is what greets someone on first load, when nothing is selected yet. It
// goes through the same cached fetches the detail panels use, so turning one of
// these layers on afterwards is served from cache rather than refetched.
// ============================================================================

import { useCallback, useEffect, useRef, useState } from 'react';
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
 * The scalars the summary draws on, in the order the tiles appear. Constrained to
 * real variable ids so that renaming one in SENSOR_VARIABLES fails the build here
 * rather than leaving a tile permanently blank.
 */
const SUMMARY_VARIABLES = [
  'temp',
  'humidity',
  'pressure',
  'gaugeHeight',
  'waterTemp',
] as const satisfies readonly SensorVariableId[];

export type SummaryMetricId = (typeof SUMMARY_VARIABLES)[number] | 'wind';

export interface ConditionsReading {
  value: number;
  unit: string;
  decimals: number;
  /** Which station reported this maximum, so the number has a provenance. */
  stationName: string;
  observedAt: number;
}

export type ConditionsReadings = Partial<Record<SummaryMetricId, ConditionsReading>>;

export interface UseConditionsSummaryResult {
  readings: ConditionsReadings;
  isLoading: boolean;
  /** Newest observation across the metrics that did load. */
  observedAt: number | null;
  /** How many of the four could not be loaded, for a quiet partial-failure note. */
  failedCount: number;
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
 * highest station average keeps this tile meaning the same thing as its three
 * neighbours, which is the highest current reading anywhere on the preserve.
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

/**
 * @param isEnabled false while a layer's own readings have taken over the panel,
 *   which stops the poll without discarding what was already loaded.
 */
export function useConditionsSummary(isEnabled: boolean): UseConditionsSummaryResult {
  const [readings, setReadings] = useState<ConditionsReadings>({});
  const [isLoading, setIsLoading] = useState(true);
  const [failedCount, setFailedCount] = useState(0);

  const requestIdRef = useRef(0);
  const hasDataRef = useRef(false);

  const load = useCallback(async (options: { bypassCache: boolean }) => {
    const requestId = ++requestIdRef.current;

    if (options.bypassCache) {
      for (const id of SUMMARY_VARIABLES) clearCacheByPrefix(`sensor-latest-${id}`);
      clearCacheByPrefix('wind-latest');
    }

    /*
     * Only the first fill announces itself. A reload already has numbers on screen,
     * and re-rendering the page for it is not free: this hook wakes up exactly when
     * a layer is being torn down, and the extra render lands while the SDK is
     * mid-teardown, which is when it is prone to failing a queued layer view.
     */
    if (!hasDataRef.current) setIsLoading(true);

    // One metric failing says nothing about the other three, and a summary is
    // more useful three-quarters filled than withheld entirely.
    const settled = await Promise.allSettled([
      ...SUMMARY_VARIABLES.map((id) => fetchSensorSnapshot(id)),
      fetchLatestWind(),
    ]);

    if (requestIdRef.current !== requestId) return;

    const next: ConditionsReadings = {};
    let failures = 0;

    settled.forEach((result, index) => {
      const metricId: SummaryMetricId = index < SUMMARY_VARIABLES.length
        ? SUMMARY_VARIABLES[index]
        : 'wind';

      if (result.status === 'rejected') {
        console.warn(`[useConditionsSummary] ${metricId} failed:`, result.reason);
        failures += 1;
        return;
      }

      const reading =
        metricId === 'wind'
          ? summarizeWind(result.value as WindSnapshot)
          : summarizeScalar(result.value as ScalarSnapshot);

      // A service that answers with no usable stations is a gap, not a failure.
      if (reading) next[metricId] = reading;
      else failures += 1;
    });

    hasDataRef.current = Object.keys(next).length > 0;
    setReadings(next);
    setFailedCount(failures);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    if (!isEnabled) return;

    void load({ bypassCache: false });

    const intervalId = window.setInterval(() => {
      void load({ bypassCache: true });
    }, SENSOR_REFRESH_INTERVAL_MS);

    return () => {
      window.clearInterval(intervalId);
      requestIdRef.current++;
    };
  }, [isEnabled, load]);

  const observed = Object.values(readings).map((reading) => reading.observedAt);

  return {
    readings,
    isLoading,
    observedAt: observed.length ? Math.max(...observed) : null,
    failedCount,
  };
}
