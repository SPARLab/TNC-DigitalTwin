// ============================================================================
// DendraOverviewPreviewChart — loads week data for candidate stations, shows
// top 3 in the card, and expands to a modal where more stations can be toggled.
// ============================================================================

import { useEffect, useMemo, useState } from 'react';
import { Loader2, X } from 'lucide-react';
import { useDendra, useSummariesByStation } from '../../../context/DendraContext';
import {
  fetchTimeSeries,
  formatStationDisplayName,
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

function toChartSeries(entries: StationSeries[]) {
  return entries.map((entry, index) => ({
    id: String(entry.station.station_id),
    label: formatStationDisplayName(entry.station.station_name),
    color: DENDRA_SERIES_COLORS[index % DENDRA_SERIES_COLORS.length],
    points: entry.points,
  }));
}

export function DendraOverviewPreviewChart() {
  const { stations, activeServiceUrl, dataLoaded, datastreamTypesLoaded, loadStationSummaries } = useDendra();
  const summariesByStation = useSummariesByStation();

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
        const summary = summariesByStation.get(station.station_id)?.[0];
        return `${station.station_id}:${summary?.dendra_ds_id ?? ''}`;
      })
      .join('|'),
    [candidateStations, summariesByStation],
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

      setLoading(true);
      setError(null);
      const end = new Date();
      const start = new Date(end.getTime() - 7 * 24 * 60 * 60 * 1000);
      const startDate = toYmd(start);
      const endDate = toYmd(end);

      try {
        const fetched = await Promise.all(
          candidateStations.map(async (station) => {
            const summaries = summariesByStation.get(station.station_id) ?? [];
            const summary = summaries[0];
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
  }, [activeServiceUrl, candidatesReady, candidateStreamKey]);

  useEffect(() => {
    if (!isModalOpen) return undefined;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsModalOpen(false);
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [isModalOpen]);

  if (!dataLoaded || stations.length === 0) return null;

  const previewSeries = availableSeries.slice(0, PREVIEW_STATION_COUNT);
  const modalSeries = availableSeries.filter((entry) =>
    selectedStationIds.includes(entry.station.station_id),
  );
  const streamLabel = availableSeries[0]?.summary.datastream_name || 'Datastream';
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
            <button
              id="dendra-overview-preview-open-chart"
              type="button"
              onClick={() => setIsModalOpen(true)}
              className="shrink-0 rounded-md px-2 py-1 text-[11px] font-medium text-teal-700 hover:bg-teal-50"
            >
              Expand
            </button>
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
              No readings in the last 7 days for this datastream.
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
