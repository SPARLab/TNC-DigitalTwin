// ============================================================================
// StationDetailView — Drill-down view for a single Dendra sensor station.
// Shows: back nav, station info header, datastream summary table.
// Time series chart deferred to task 3.5.
// ============================================================================

import { ChevronLeft, MapPin, Radio, Activity, Calendar, TrendingUp, TrendingDown } from 'lucide-react';
import type { DendraStation, DendraSummary } from '../../../services/dendraStationService';
import { formatTimestamp, formatValue } from '../../../services/dendraStationService';

interface StationDetailViewProps {
  station: DendraStation;
  summaries: DendraSummary[];
  onBack: () => void;
  onViewOnMap: () => void;
}

export function StationDetailView({ station, summaries, onBack, onViewOnMap }: StationDetailViewProps) {
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
          {station.elevation != null && (
            <DetailRow icon={<TrendingUp className="w-3 h-3" />} label="Elevation" value={`${station.elevation.toFixed(0)} m`} />
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
              <DatastreamSummaryCard key={summary.datastream_id} summary={summary} />
            ))}
          </div>
        )}
      </div>

      {/* Placeholder for future time series chart (task 3.5) */}
      <div
        id="dendra-chart-placeholder"
        className="border border-dashed border-gray-200 rounded-lg p-4 text-center"
      >
        <Activity className="w-6 h-6 text-gray-300 mx-auto mb-2" />
        <p className="text-xs text-gray-400">
          Time series chart — coming in task 3.5
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

function DatastreamSummaryCard({ summary }: { summary: DendraSummary }) {
  return (
    <div
      id={`dendra-ds-${summary.datastream_id}`}
      className="bg-white border border-gray-100 rounded-md p-3 hover:border-gray-200 transition-colors"
    >
      {/* Datastream name + unit */}
      <div className="flex items-center justify-between mb-2">
        <h5 className="text-sm font-medium text-gray-900">{summary.datastream_name}</h5>
        {summary.unit && (
          <span className="text-xs text-gray-400 bg-gray-50 px-1.5 py-0.5 rounded">
            {summary.unit}
          </span>
        )}
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-3 gap-2 text-xs">
        <StatCell
          icon={<TrendingDown className="w-3 h-3 text-blue-400" />}
          label="Min"
          value={formatValue(summary.min_value)}
        />
        <StatCell
          icon={<Activity className="w-3 h-3 text-amber-500" />}
          label="Avg"
          value={formatValue(summary.avg_value)}
        />
        <StatCell
          icon={<TrendingUp className="w-3 h-3 text-red-400" />}
          label="Max"
          value={formatValue(summary.max_value)}
        />
      </div>

      {/* Date range + record count */}
      <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-50 text-xs text-gray-400">
        <span className="flex items-center gap-1">
          <Calendar className="w-3 h-3" />
          {formatTimestamp(summary.first_reading_time)} — {formatTimestamp(summary.last_reading_time)}
        </span>
        <span>{summary.total_records?.toLocaleString() ?? '—'} records</span>
      </div>
    </div>
  );
}

function StatCell({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex flex-col items-center gap-0.5 py-1 bg-gray-50 rounded">
      {icon}
      <span className="text-gray-400">{label}</span>
      <span className="text-gray-800 font-medium">{value}</span>
    </div>
  );
}
