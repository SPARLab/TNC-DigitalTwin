// ============================================================================
// StationDetailView — Drill-down view for a single Dendra sensor station.
// Shows: back nav, station info header, datastream summary table.
// Time series chart deferred to task 3.5.
// ============================================================================

import { useMemo, useState, type ReactNode } from 'react';
import { ChevronLeft, MapPin, Radio, Activity, Calendar, TrendingUp, TrendingDown, BarChart3, Bookmark } from 'lucide-react';
import type { DendraStation, DendraSummary } from '../../../services/dendraStationService';
import { formatTimestamp, formatValue } from '../../../services/dendraStationService';
import { useDendra } from '../../../context/DendraContext';
import { useLayers } from '../../../context/LayerContext';

const DENDRA_LOCAL_BOOKMARKS_KEY = 'v2-dendra-bookmarks';

interface DendraLocalBookmark {
  id: string;
  itemId: string;
  itemName: string;
  layerId: string;
  layerName: string;
  type: 'pointer-unfiltered' | 'pointer-filtered';
  filterDescription?: string;
  resultCount?: number;
  geometry: { type: 'Point'; coordinates: [number, number] };
  createdAt: number;
}

function saveDendraBookmark(bookmark: Omit<DendraLocalBookmark, 'id' | 'createdAt'>): void {
  const nextBookmark: DendraLocalBookmark = {
    ...bookmark,
    id: crypto.randomUUID(),
    createdAt: Date.now(),
  };
  try {
    const raw = localStorage.getItem(DENDRA_LOCAL_BOOKMARKS_KEY);
    const current: DendraLocalBookmark[] = raw ? JSON.parse(raw) : [];
    localStorage.setItem(DENDRA_LOCAL_BOOKMARKS_KEY, JSON.stringify([...current, nextBookmark]));
  } catch (error) {
    console.error('[Dendra] Failed to save bookmark:', error);
  }
}

interface StationDetailViewProps {
  station: DendraStation;
  summaries: DendraSummary[];
  onBack: () => void;
  onViewOnMap: () => void;
  onViewChart?: (summary: DendraSummary) => void;
}

export function StationDetailView({ station, summaries, onBack, onViewOnMap, onViewChart }: StationDetailViewProps) {
  const isActive = station.is_active === 1;
  const displayName = station.station_name?.replace(/^Dangermond_/, '').replace(/_/g, ' ') ?? 'Unknown';
  const [selectedDatastreamId, setSelectedDatastreamId] = useState<number | null>(null);
  const [bookmarkMessage, setBookmarkMessage] = useState<string | null>(null);
  const { chart, setChartFilter } = useDendra();
  const { activeLayer } = useLayers();

  const selectedSummary = useMemo(
    () => summaries.find(summary => summary.datastream_id === selectedDatastreamId) ?? null,
    [summaries, selectedDatastreamId],
  );

  const chartMatchesSelectedDatastream = Boolean(
    selectedSummary && chart.summary?.datastream_id === selectedSummary.datastream_id,
  );

  const chartMinDate = chart.rawData.length > 0
    ? new Date(chart.rawData[0].timestamp).toISOString().slice(0, 10)
    : undefined;
  const chartMaxDate = chart.rawData.length > 0
    ? new Date(chart.rawData[chart.rawData.length - 1].timestamp).toISOString().slice(0, 10)
    : undefined;

  const handleSelectDatastream = (summary: DendraSummary) => {
    setSelectedDatastreamId(summary.datastream_id);
    setBookmarkMessage(null);
    onViewChart?.(summary);
  };

  const handleBookmarkSensor = () => {
    saveDendraBookmark({
      itemId: String(station.station_id),
      itemName: displayName,
      layerId: activeLayer?.layerId ?? 'dendra',
      layerName: activeLayer?.name ?? 'Dendra',
      type: 'pointer-unfiltered',
      geometry: {
        type: 'Point',
        coordinates: [station.longitude, station.latitude],
      },
    });
    setBookmarkMessage('Saved sensor bookmark.');
  };

  const handleBookmarkWithTimeRange = () => {
    if (!selectedSummary) return;
    saveDendraBookmark({
      itemId: `${station.station_id}-${selectedSummary.datastream_id}`,
      itemName: `${displayName} - ${selectedSummary.datastream_name}`,
      layerId: activeLayer?.layerId ?? 'dendra',
      layerName: activeLayer?.name ?? 'Dendra',
      type: 'pointer-filtered',
      filterDescription: `${chart.filter.startDate} to ${chart.filter.endDate} (${chart.filter.aggregation})`,
      resultCount: chart.data.length,
      geometry: {
        type: 'Point',
        coordinates: [station.longitude, station.latitude],
      },
    });
    setBookmarkMessage('Saved bookmark with time range.');
  };

  return (
    <div id="dendra-station-detail" className="space-y-4">
      {/* Back nav */}
      <button
        id="dendra-back-to-stations"
        onClick={onBack}
        className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800
                   transition-colors -ml-1"
      >
        <ChevronLeft className="w-4 h-4" />
        Back to Stations
      </button>

      {/* Station header */}
      <div id="dendra-station-header" className="bg-slate-50 rounded-lg p-4 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-base font-semibold text-gray-900 leading-tight">
            {displayName}
          </h3>
          <span
            className={`flex items-center gap-1 text-xs font-medium shrink-0 px-2 py-0.5 rounded-full ${
              isActive
                ? 'bg-emerald-100 text-emerald-700'
                : 'bg-gray-100 text-gray-500'
            }`}
          >
            <span className={`inline-block w-1.5 h-1.5 rounded-full ${
              isActive ? 'bg-emerald-500' : 'bg-gray-400'
            }`} />
            {isActive ? 'Active' : 'Inactive'}
          </span>
        </div>

        {/* Station metadata grid */}
        <dl className="grid grid-cols-2 gap-y-2 gap-x-3 text-xs">
          <DetailRow icon={<Radio className="w-3 h-3" />} label="Sensor" value={station.sensor_name ?? '—'} />
          <DetailRow
            icon={<MapPin className="w-3 h-3" />}
            label="Location"
            value={`${station.latitude.toFixed(4)}, ${station.longitude.toFixed(4)}`}
          />
          {station.elevation != null && !isNaN(Number(station.elevation)) && (
            <DetailRow icon={<TrendingUp className="w-3 h-3" />} label="Elevation" value={`${Number(station.elevation).toFixed(0)} m`} />
          )}
          <DetailRow icon={<Activity className="w-3 h-3" />} label="Datastreams" value={String(summaries.length || station.datastream_count)} />
        </dl>

        {/* View on Map button */}
        <button
          id="dendra-detail-view-on-map"
          onClick={onViewOnMap}
          className="w-full py-2 text-sm text-emerald-700 bg-emerald-50 rounded-md
                     hover:bg-emerald-100 transition-colors flex items-center justify-center gap-1.5"
        >
          <MapPin className="w-3.5 h-3.5" />
          View on Map
        </button>
      </div>

      {/* Datastream summaries */}
      <div id="dendra-datastream-summaries">
        <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
          Datastreams ({summaries.length})
        </h4>

        {summaries.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-4">
            No datastream summaries available.
          </p>
        ) : (
          <div className="space-y-2">
            {summaries.map(summary => (
              <DatastreamSummaryCard
                key={summary.datastream_id}
                summary={summary}
                isSelected={selectedDatastreamId === summary.datastream_id}
                onViewChart={() => handleSelectDatastream(summary)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Level 3 datastream filter controls */}
      {selectedSummary && (
        <div id="dendra-datastream-filter-section" className="bg-slate-50 rounded-lg p-3 space-y-3">
          <div id="dendra-datastream-filter-header" className="flex items-center justify-between gap-2">
            <h4 id="dendra-datastream-filter-title" className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
              Filter Datastream
            </h4>
            <span id="dendra-datastream-filter-name" className="text-xs text-gray-500 truncate">
              {selectedSummary.datastream_name}
            </span>
          </div>

          <div id="dendra-datastream-filter-grid" className="grid grid-cols-2 gap-2">
            <label id="dendra-filter-start-label" className="text-xs text-gray-600">
              From
              <input
                id="dendra-filter-start-date"
                type="date"
                value={chart.filter.startDate}
                min={chartMinDate}
                max={chartMaxDate}
                disabled={!chartMatchesSelectedDatastream || chart.loading}
                onChange={(event) => {
                  setChartFilter({ startDate: event.target.value });
                  setBookmarkMessage(null);
                }}
                className="mt-1 w-full rounded-md border border-gray-300 px-2 py-1.5 text-sm
                           focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500
                           disabled:bg-gray-100 disabled:text-gray-400"
              />
            </label>

            <label id="dendra-filter-end-label" className="text-xs text-gray-600">
              To
              <input
                id="dendra-filter-end-date"
                type="date"
                value={chart.filter.endDate}
                min={chartMinDate}
                max={chartMaxDate}
                disabled={!chartMatchesSelectedDatastream || chart.loading}
                onChange={(event) => {
                  setChartFilter({ endDate: event.target.value });
                  setBookmarkMessage(null);
                }}
                className="mt-1 w-full rounded-md border border-gray-300 px-2 py-1.5 text-sm
                           focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500
                           disabled:bg-gray-100 disabled:text-gray-400"
              />
            </label>

            <label id="dendra-filter-aggregation-label" className="text-xs text-gray-600 col-span-2">
              Aggregation
              <select
                id="dendra-filter-aggregation-select"
                value={chart.filter.aggregation}
                disabled={!chartMatchesSelectedDatastream || chart.loading}
                onChange={(event) => {
                  setChartFilter({ aggregation: event.target.value as 'hourly' | 'daily' | 'weekly' });
                  setBookmarkMessage(null);
                }}
                className="mt-1 w-full rounded-md border border-gray-300 px-2 py-1.5 text-sm bg-white
                           focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500
                           disabled:bg-gray-100 disabled:text-gray-400"
              >
                <option id="dendra-filter-aggregation-hourly" value="hourly">Hourly</option>
                <option id="dendra-filter-aggregation-daily" value="daily">Daily</option>
                <option id="dendra-filter-aggregation-weekly" value="weekly">Weekly</option>
              </select>
            </label>
          </div>

          <div id="dendra-filter-summary-row" className="flex items-center justify-between text-xs">
            <span id="dendra-filter-point-count" className="text-gray-600">
              {chartMatchesSelectedDatastream ? `${chart.data.length.toLocaleString()} data points` : 'Open chart to load points'}
            </span>
            {chart.loading && (
              <span id="dendra-filter-loading-indicator" className="text-gray-400">Updating...</span>
            )}
          </div>

          <div id="dendra-bookmark-actions" className="grid grid-cols-2 gap-2">
            <button
              id="dendra-bookmark-sensor"
              type="button"
              onClick={handleBookmarkSensor}
              className="rounded-md border border-gray-300 bg-white text-gray-700 text-sm font-medium py-2
                         hover:bg-gray-50 transition-colors flex items-center justify-center gap-1.5"
            >
              <Bookmark className="w-3.5 h-3.5" />
              Bookmark Sensor
            </button>
            <button
              id="dendra-bookmark-time-range"
              type="button"
              onClick={handleBookmarkWithTimeRange}
              disabled={!chartMatchesSelectedDatastream || chart.loading}
              className="rounded-md bg-emerald-600 text-white text-sm font-medium py-2
                         hover:bg-emerald-700 transition-colors disabled:bg-emerald-300
                         flex items-center justify-center gap-1.5"
            >
              <Bookmark className="w-3.5 h-3.5" />
              Bookmark With Time Range
            </button>
          </div>

          {bookmarkMessage && (
            <p id="dendra-bookmark-feedback" className="text-xs text-emerald-700">
              {bookmarkMessage}
            </p>
          )}
        </div>
      )}

      {/* Chart hint */}
      <div
        id="dendra-chart-hint"
        className="bg-teal-50 border border-teal-100 rounded-lg p-3 text-center"
      >
        <BarChart3 className="w-5 h-5 text-teal-400 mx-auto mb-1" />
        <p className="text-xs text-teal-700">
          Click <strong>View Chart</strong> on any datastream to see the interactive
          time series on the map panel below.
        </p>
      </div>
    </div>
  );
}

// ── Sub-components ───────────────────────────────────────────────────────────

function DetailRow({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="text-gray-400">{icon}</span>
      <dt className="text-gray-500">{label}:</dt>
      <dd className="text-gray-800 font-medium truncate">{value}</dd>
    </div>
  );
}

function DatastreamSummaryCard({
  summary, onViewChart, isSelected,
}: {
  summary: DendraSummary;
  onViewChart: () => void;
  isSelected: boolean;
}) {
  return (
    <button
      id={`dendra-ds-${summary.datastream_id}`}
      onClick={onViewChart}
      type="button"
      className={`w-full text-left bg-white border rounded-md p-3 transition-colors cursor-pointer group ${
        isSelected
          ? 'border-teal-400 bg-teal-50/40'
          : 'border-gray-100 hover:border-teal-300 hover:bg-teal-50/30'
      }`}
    >
      {/* Top row: name + unit + chart icon */}
      <div className="flex items-center justify-between mb-1.5">
        <h5 className="text-sm font-medium text-gray-900 flex items-center gap-1.5">
          <BarChart3 className="w-3.5 h-3.5 text-teal-400 group-hover:text-teal-600 transition-colors shrink-0" />
          {summary.datastream_name}
        </h5>
        {summary.unit && (
          <span className="text-[10px] text-gray-400 bg-gray-50 px-1.5 py-0.5 rounded shrink-0">
            {summary.unit}
          </span>
        )}
      </div>

      {/* Compact inline stats */}
      <div className="flex items-center gap-3 text-xs text-gray-500 mb-1.5">
        <span className="flex items-center gap-0.5">
          <TrendingDown className="w-3 h-3 text-blue-400" />
          {formatValue(summary.min_value)}
        </span>
        <span className="flex items-center gap-0.5">
          <Activity className="w-3 h-3 text-amber-500" />
          {formatValue(summary.avg_value)}
        </span>
        <span className="flex items-center gap-0.5">
          <TrendingUp className="w-3 h-3 text-red-400" />
          {formatValue(summary.max_value)}
        </span>
        <span className="ml-auto text-gray-400">
          {summary.total_records?.toLocaleString() ?? '—'} pts
        </span>
      </div>

      {/* Date range */}
      <div className="flex items-center gap-1 text-[10px] text-gray-400">
        <Calendar className="w-3 h-3" />
        {formatTimestamp(summary.first_reading_time)} — {formatTimestamp(summary.last_reading_time)}
      </div>
    </button>
  );
}

