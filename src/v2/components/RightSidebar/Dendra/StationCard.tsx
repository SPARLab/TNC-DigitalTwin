// ============================================================================
// StationCard — Compact card for a Dendra sensor station.
// Shows: name, sensor type, status dot, datastream count, location actions.
// ============================================================================

import { MapPin, Radio, ChevronRight } from 'lucide-react';
import type { DendraStation } from '../../../services/dendraStationService';

interface StationCardProps {
  station: DendraStation;
  summaryCount: number;
  onViewDetail: () => void;
  onViewOnMap: () => void;
}

export function StationCard({ station, summaryCount, onViewDetail, onViewOnMap }: StationCardProps) {
  const isActive = station.is_active === 1;
  const displayName = station.station_name?.replace(/^Dangermond_/, '').replace(/_/g, ' ') ?? 'Unknown';

  return (
    <div
      id={`dendra-station-${station.station_id}`}
      className="bg-white border border-gray-200 rounded-lg p-3 hover:border-gray-300
                 hover:shadow-sm transition-all duration-150 cursor-pointer group"
      onClick={onViewDetail}
      role="button"
      tabIndex={0}
      onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onViewDetail(); } }}
    >
      {/* Top row: name + status */}
      <div className="flex items-start justify-between gap-2 mb-1.5">
        <h4 className="text-sm font-semibold text-gray-900 leading-tight flex-1">
          {displayName}
        </h4>
        <span
          className={`flex items-center gap-1 text-xs font-medium shrink-0 ${
            isActive ? 'text-emerald-600' : 'text-gray-400'
          }`}
        >
          <span className={`inline-block w-2 h-2 rounded-full ${
            isActive ? 'bg-emerald-500 animate-pulse' : 'bg-gray-300'
          }`} />
          {isActive ? 'Active' : 'Inactive'}
        </span>
      </div>

      {/* Sensor type */}
      <p className="text-xs text-gray-500 mb-2 flex items-center gap-1">
        <Radio className="w-3 h-3" />
        {station.sensor_name ?? 'Unknown sensor'}
      </p>

      {/* Stats row */}
      <div className="flex items-center justify-between text-xs text-gray-500">
        <div className="flex items-center gap-3">
          <span>{summaryCount || station.datastream_count} datastreams</span>
          {station.elevation != null && !isNaN(station.elevation) && (
            <span>{station.elevation.toFixed(0)}m elev.</span>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1">
          <button
            id={`dendra-station-${station.station_id}-map`}
            onClick={e => { e.stopPropagation(); onViewOnMap(); }}
            className="p-1 rounded hover:bg-gray-100 transition-colors"
            title="View on map"
          >
            <MapPin className="w-3.5 h-3.5 text-gray-400 hover:text-gray-600" />
          </button>
          <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-gray-500 transition-colors" />
        </div>
      </div>
    </div>
  );
}
