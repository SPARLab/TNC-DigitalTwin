// ============================================================================
// StationDetailView — Drill-down view for a single Dendra sensor station.
// Shows: back nav, station info header, datastream summary table.
// Time series chart deferred to task 3.5.
// ============================================================================

import { ChevronLeft, MapPin, Radio, Activity, Calendar, TrendingUp, TrendingDown, BarChart3 } from 'lucide-react';
import type { DendraStation, DendraSummary } from '../../../services/dendraStationService';
import { formatTimestamp, formatValue } from '../../../services/dendraStationService';

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
                onViewChart={onViewChart ? () => onViewChart(summary) : undefined}
              />
            ))}
          </div>
        )}
      </div>

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

function DetailRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="text-gray-400">{icon}</span>
      <dt className="text-gray-500">{label}:</dt>
      <dd className="text-gray-800 font-medium truncate">{value}</dd>
    </div>
  );
}

function DatastreamSummaryCard({
  summary, onViewChart,
}: {
  summary: DendraSummary; onViewChart?: () => void;
}) {
  const Wrapper = onViewChart ? 'button' : 'div';
  return (
    <Wrapper
      id={`dendra-ds-${summary.datastream_id}`}
      {...(onViewChart ? { onClick: onViewChart, type: 'button' as const } : {})}
      className={`w-full text-left bg-white border rounded-md p-3 transition-colors ${
        onViewChart
          ? 'border-gray-100 hover:border-teal-300 hover:bg-teal-50/30 cursor-pointer group'
          : 'border-gray-100'
      }`}
    >
      {/* Top row: name + unit + chart icon */}
      <div className="flex items-center justify-between mb-1.5">
        <h5 className="text-sm font-medium text-gray-900 flex items-center gap-1.5">
          {onViewChart && <BarChart3 className="w-3.5 h-3.5 text-teal-400 group-hover:text-teal-600 transition-colors shrink-0" />}
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
    </Wrapper>
  );
}

