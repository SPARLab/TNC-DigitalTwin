import type { DendraStation } from '../../../services/dendraStationService';
import { formatStationDisplayName } from '../../../services/dendraStationService';

interface StationCrossStationToolsSectionProps {
  stationId: number;
  streamNameFilter: string;
  onStreamNameFilterChange: (value: string) => void;
  matchingStations: DendraStation[];
  onSelectStation: (station: DendraStation) => void;
}

export function StationCrossStationToolsSection({
  stationId,
  streamNameFilter,
  onStreamNameFilterChange,
  matchingStations,
  onSelectStation,
}: StationCrossStationToolsSectionProps) {
  return (
    <div id="dendra-cross-station-tools" className="rounded-lg border border-gray-200 bg-white p-3 space-y-2">
      <label id="dendra-detail-stream-name-filter" className="block text-xs text-gray-600">
        Stream Name Filter
        <input
          id="dendra-detail-stream-name-filter-input"
          type="text"
          value={streamNameFilter}
          onChange={(event) => onStreamNameFilterChange(event.target.value)}
          placeholder="Filter streams (example: air temp avg)"
          className="mt-1 w-full rounded-md border border-gray-300 px-2 py-1.5 text-sm
                     focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
        />
      </label>

      <label id="dendra-detail-station-switcher" className="block text-xs text-gray-600">
        Switch Station
        <select
          id="dendra-detail-station-switcher-select"
          value={stationId}
          onChange={(event) => {
            const selectedId = Number(event.target.value);
            const nextStation = matchingStations.find((candidate) => candidate.station_id === selectedId);
            if (!nextStation) return;
            onSelectStation(nextStation);
          }}
          className="mt-1 w-full rounded-md border border-gray-300 px-2 py-1.5 text-sm bg-white
                     focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
        >
          {matchingStations.map((candidate) => (
            <option
              key={candidate.station_id}
              id={`dendra-detail-station-switcher-option-${candidate.station_id}`}
              value={candidate.station_id}
            >
              {formatStationDisplayName(candidate.station_name)}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}
