// ============================================================================
// DendraBrowseChartModal — Centered chart workspace with live filters,
// progressive series loading, and per-series visibility toggles.
// ============================================================================

import { useEffect, useMemo, useRef, useState } from 'react';
import { Download, Loader2, RefreshCw, X } from 'lucide-react';
import {
  formatStationDisplayName,
  type DendraDatastreamType,
  type DendraStation,
  type DendraSummary,
} from '../../../services/dendraStationService';
import { DendraMultiSeriesChart } from './DendraMultiSeriesChart';
import {
  useDendraBrowseSeriesLoader,
  type DendraBrowseQuery,
} from './useDendraBrowseSeriesLoader';

export interface DendraBrowseFilterState {
  selectedStreamNames: string[];
  selectedStationIds: number[];
  startDate: string;
  endDate: string;
}

interface DendraBrowseChartModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  serviceUrl: string;
  availableStreamTypes: DendraDatastreamType[];
  stations: DendraStation[];
  summariesByStation: Map<number, DendraSummary[]>;
  initialFilters: DendraBrowseFilterState;
  onFiltersChange?: (filters: DendraBrowseFilterState) => void;
}

function buildQuery(
  serviceUrl: string,
  filters: DendraBrowseFilterState,
  stations: DendraStation[],
  summariesByStation: Map<number, DendraSummary[]>,
  allStreamFieldKeys: string[],
): DendraBrowseQuery {
  const selected = new Set(filters.selectedStationIds);
  return {
    serviceUrl,
    startDate: filters.startDate,
    endDate: filters.endDate,
    streamNames: filters.selectedStreamNames,
    allStreamFieldKeys,
    stations: stations.filter((station) => selected.has(station.station_id)),
    summariesByStation,
  };
}

export function DendraBrowseChartModal({
  open,
  onClose,
  title,
  serviceUrl,
  availableStreamTypes,
  stations,
  summariesByStation,
  initialFilters,
  onFiltersChange,
}: DendraBrowseChartModalProps) {
  const [filters, setFilters] = useState<DendraBrowseFilterState>(initialFilters);
  const wasOpenRef = useRef(false);
  const {
    series,
    loading,
    progressiveLoading,
    error,
    loadQuery,
    clearSeries,
    toggleSeriesVisible,
  } = useDendraBrowseSeriesLoader();

  useEffect(() => {
    if (!open) {
      if (wasOpenRef.current) {
        onFiltersChange?.(filters);
      }
      wasOpenRef.current = false;
      clearSeries();
      return;
    }

    if (!wasOpenRef.current) {
      wasOpenRef.current = true;
      setFilters(initialFilters);
      void loadQuery(buildQuery(
        serviceUrl,
        initialFilters,
        stations,
        summariesByStation,
        availableStreamTypes.map((type) => type.fieldKey),
      ));
    }
    // Seed once per open — filter edits apply via Update chart.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => {
    if (!open) return undefined;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onFiltersChange?.(filters);
        onClose();
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [open, onClose, onFiltersChange, filters]);

  const updateFilters = (patch: Partial<DendraBrowseFilterState>) => {
    setFilters((prev) => ({ ...prev, ...patch }));
  };

  const toggleStream = (streamName: string) => {
    updateFilters({
      selectedStreamNames: filters.selectedStreamNames.includes(streamName)
        ? filters.selectedStreamNames.filter((name) => name !== streamName)
        : [...filters.selectedStreamNames, streamName],
    });
  };

  const toggleStation = (stationId: number) => {
    updateFilters({
      selectedStationIds: filters.selectedStationIds.includes(stationId)
        ? filters.selectedStationIds.filter((id) => id !== stationId)
        : [...filters.selectedStationIds, stationId],
    });
  };

  const handleApply = () => {
    onFiltersChange?.(filters);
    void loadQuery(buildQuery(
      serviceUrl,
      filters,
      stations,
      summariesByStation,
      availableStreamTypes.map((type) => type.fieldKey),
    ));
  };

  const handleClose = () => {
    onFiltersChange?.(filters);
    onClose();
  };

  const chartSeries = useMemo(
    () => series
      .filter((entry) => entry.visible && entry.points.length > 0)
      .map((entry) => ({
        id: entry.id,
        label: entry.stationLabel,
        color: entry.color,
        points: entry.points,
      })),
    [series],
  );

  const unitLabel = useMemo(() => {
    const units = new Set(
      series.filter((entry) => entry.visible && entry.unit).map((entry) => entry.unit),
    );
    if (units.size === 1) return [...units][0];
    if (units.size > 1) return 'mixed units';
    return '';
  }, [series]);

  const handleExportCsv = () => {
    const visible = series.filter((entry) => entry.visible && entry.points.length > 0);
    if (visible.length === 0) return;

    const timestampSet = new Set<number>();
    for (const entry of visible) {
      for (const point of entry.points) timestampSet.add(point.timestamp);
    }
    const timestamps = [...timestampSet].sort((a, b) => a - b);
    const header = ['timestamp_iso', ...visible.map((entry) => entry.stationLabel.replace(/"/g, '""'))];
    const rows = timestamps.map((timestamp) => {
      const cells = [
        new Date(timestamp).toISOString(),
        ...visible.map((entry) => {
          const point = entry.points.find((candidate) => candidate.timestamp === timestamp);
          return point ? String(point.value) : '';
        }),
      ];
      return cells.map((cell) => `"${cell}"`).join(',');
    });
    const blob = new Blob([[header.map((h) => `"${h}"`).join(','), ...rows].join('\n')], {
      type: 'text/csv;charset=utf-8',
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `dendra_${title.replace(/\s+/g, '_').toLowerCase()}_${filters.startDate}_${filters.endDate}.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  if (!open) return null;

  const canApply =
    filters.selectedStreamNames.length > 0
    && filters.selectedStationIds.length > 0
    && Boolean(filters.startDate)
    && Boolean(filters.endDate);

  return (
    <div
      id="dendra-browse-chart-modal-backdrop"
      className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-900/55 p-4 backdrop-blur-sm"
      onClick={handleClose}
      role="presentation"
    >
      <div
        id="dendra-browse-chart-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="dendra-browse-chart-modal-title"
        className="flex h-[min(92vh,900px)] w-full max-w-6xl flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3 border-b border-slate-200 px-4 py-3">
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-teal-700">
              Time series
            </p>
            <h2
              id="dendra-browse-chart-modal-title"
              className="truncate text-base font-semibold text-gray-900"
            >
              {title}
            </h2>
            <p className="text-xs text-gray-500">
              {filters.startDate} → {filters.endDate}
              {(loading || progressiveLoading) && (
                <span className="ml-2 inline-flex items-center gap-1 text-teal-700">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  {loading ? 'Loading…' : 'Loading earlier data…'}
                </span>
              )}
            </p>
          </div>
          <div className="flex items-center gap-1">
            <button
              id="dendra-browse-chart-modal-export"
              type="button"
              onClick={handleExportCsv}
              disabled={chartSeries.length === 0}
              className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100 disabled:opacity-40"
            >
              <Download className="h-3.5 w-3.5" />
              CSV
            </button>
            <button
              id="dendra-browse-chart-modal-close"
              type="button"
              onClick={handleClose}
              className="rounded-md p-1.5 text-gray-500 hover:bg-gray-100 hover:text-gray-800"
              aria-label="Close chart"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="flex min-h-0 flex-1">
          <aside
            id="dendra-browse-chart-modal-filters"
            className="flex w-72 shrink-0 flex-col gap-4 overflow-y-auto border-r border-slate-100 bg-slate-50/80 p-3"
          >
            <section>
              <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                Datastream type
              </p>
              <div className="max-h-36 space-y-1 overflow-y-auto rounded-md border border-slate-200 bg-white p-1.5">
                {availableStreamTypes.map((streamType) => {
                  const checked = filters.selectedStreamNames.includes(streamType.fieldKey);
                  return (
                    <label
                      key={streamType.fieldKey}
                      className={`flex cursor-pointer items-center gap-2 rounded px-2 py-1 text-xs ${
                        checked ? 'bg-teal-50 text-teal-900' : 'text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleStream(streamType.fieldKey)}
                        className="h-3.5 w-3.5 rounded border-slate-300 text-teal-600 focus:ring-teal-500"
                      />
                      <span className="min-w-0 flex-1 truncate">{streamType.label}</span>
                      {streamType.frequencyLabel && (
                        <span className="shrink-0 rounded bg-slate-100 px-1 py-0.5 text-[9px] font-medium uppercase tracking-wide text-slate-500">
                          {streamType.frequencyLabel}
                        </span>
                      )}
                    </label>
                  );
                })}
              </div>
            </section>

            <section>
              <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                Stations
              </p>
              <div className="max-h-40 space-y-1 overflow-y-auto rounded-md border border-slate-200 bg-white p-1.5">
                {stations.map((station) => {
                  const checked = filters.selectedStationIds.includes(station.station_id);
                  return (
                    <label
                      key={station.station_id}
                      className={`flex cursor-pointer items-center gap-2 rounded px-2 py-1 text-xs ${
                        checked ? 'bg-teal-50 text-teal-900' : 'text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleStation(station.station_id)}
                        className="h-3.5 w-3.5 rounded border-slate-300 text-teal-600 focus:ring-teal-500"
                      />
                      <span className="truncate">{formatStationDisplayName(station.station_name)}</span>
                    </label>
                  );
                })}
              </div>
            </section>

            <section className="space-y-2">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                Time frame
              </p>
              <label className="block text-xs text-slate-600">
                Start
                <input
                  type="date"
                  value={filters.startDate}
                  onChange={(event) => updateFilters({ startDate: event.target.value })}
                  className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                />
              </label>
              <label className="block text-xs text-slate-600">
                End
                <input
                  type="date"
                  value={filters.endDate}
                  onChange={(event) => updateFilters({ endDate: event.target.value })}
                  className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                />
              </label>
            </section>

            <button
              id="dendra-browse-chart-modal-apply"
              type="button"
              disabled={!canApply || loading}
              onClick={handleApply}
              className="inline-flex items-center justify-center gap-1.5 rounded-md bg-teal-700 px-3 py-2 text-sm font-medium text-white hover:bg-teal-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
              Update chart
            </button>

            {series.length > 0 && (
              <section>
                <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                  Loaded series
                </p>
                <div className="max-h-44 space-y-1 overflow-y-auto">
                  {series.map((entry) => (
                    <label
                      key={entry.id}
                      className="flex cursor-pointer items-center gap-2 rounded-md border border-slate-200 bg-white px-2 py-1.5 text-xs text-slate-700"
                    >
                      <input
                        type="checkbox"
                        checked={entry.visible}
                        onChange={() => toggleSeriesVisible(entry.id)}
                        className="h-3.5 w-3.5 rounded border-slate-300 text-teal-600 focus:ring-teal-500"
                      />
                      <span
                        className="inline-block h-2 w-2 shrink-0 rounded-full"
                        style={{ backgroundColor: entry.color }}
                      />
                      <span className="min-w-0 flex-1 truncate" title={entry.stationLabel}>
                        {entry.stationLabel}
                      </span>
                      {entry.loading || entry.progressiveLoading ? (
                        <Loader2 className="h-3 w-3 shrink-0 animate-spin text-teal-600" />
                      ) : entry.error ? (
                        <span className="shrink-0 text-[10px] text-amber-600">!</span>
                      ) : null}
                    </label>
                  ))}
                </div>
              </section>
            )}
          </aside>

          <div className="relative min-w-0 flex-1 overflow-auto p-4">
            {error && (
              <div className="mb-3 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
                {error}
              </div>
            )}
            {chartSeries.length > 0 ? (
              <DendraMultiSeriesChart
                series={chartSeries}
                unit={unitLabel === 'mixed units' ? '' : unitLabel}
                height={460}
                showLegend={false}
                showStats
                enableZoom
                showRawDataCaution
              />
            ) : (
              <div className="flex h-[460px] items-center justify-center text-sm text-gray-500">
                {loading
                  ? 'Loading time series…'
                  : 'Adjust filters and click Update chart to plot data.'}
              </div>
            )}
            {unitLabel === 'mixed units' && chartSeries.length > 0 && (
              <p className="mt-2 text-center text-[11px] text-amber-700">
                Selected datastreams use different units — compare series carefully.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
