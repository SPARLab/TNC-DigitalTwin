import { Activity, MapPin, Radio, TrendingUp } from 'lucide-react';
import type { ReactNode } from 'react';

interface StationHeaderCardProps {
  displayName: string;
  isActive: boolean;
  isHeaderFlashing: boolean;
  sensorName: string | null | undefined;
  latitude: number;
  longitude: number;
  elevation: number | string | null | undefined;
  datastreamCount: number;
  onViewOnMap: () => void;
}

export function StationHeaderCard({
  displayName,
  isActive,
  isHeaderFlashing,
  sensorName,
  latitude,
  longitude,
  elevation,
  datastreamCount,
  onViewOnMap,
}: StationHeaderCardProps) {
  return (
    <div
      id="dendra-station-header"
      className={`rounded-lg border p-4 space-y-3 transition-colors duration-250 ease-in-out ${
        isHeaderFlashing
          ? 'bg-slate-300/90 border-slate-200'
          : 'bg-slate-50 border-slate-200'
      }`}
    >
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

      <dl className="grid grid-cols-2 gap-y-2 gap-x-3 text-xs">
        <DetailRow icon={<Radio className="w-3 h-3" />} label="Sensor" value={sensorName ?? '—'} />
        <DetailRow
          icon={<MapPin className="w-3 h-3" />}
          label="Location"
          value={`${latitude.toFixed(4)}, ${longitude.toFixed(4)}`}
        />
        {elevation != null && !Number.isNaN(Number(elevation)) && (
          <DetailRow icon={<TrendingUp className="w-3 h-3" />} label="Elevation" value={`${Number(elevation).toFixed(0)} m`} />
        )}
        <DetailRow icon={<Activity className="w-3 h-3" />} label="Datastreams" value={String(datastreamCount)} />
      </dl>

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
  );
}

function DetailRow({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="text-gray-400">{icon}</span>
      <dt className="text-gray-500">{label}:</dt>
      <dd className="text-gray-800 font-medium truncate">{value}</dd>
    </div>
  );
}
