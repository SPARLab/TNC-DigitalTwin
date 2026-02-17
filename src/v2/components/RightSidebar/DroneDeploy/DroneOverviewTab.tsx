import { CalendarRange, FolderKanban, ImageIcon } from 'lucide-react';

interface DroneOverviewTabProps {
  loading: boolean;
  totalProjects: number;
  totalFlights: number;
  dateRangeLabel: string;
  onBrowseClick: () => void;
}

export function DroneOverviewTab({
  loading,
  totalProjects,
  totalFlights,
  dateRangeLabel,
  onBrowseClick,
}: DroneOverviewTabProps) {
  return (
    <div id="drone-overview-tab" className="space-y-4">
      <p id="drone-overview-intro" className="text-sm text-gray-600 leading-relaxed">
        Browse DroneDeploy orthomosaics by project and flight date. Load one or more flights as WMTS
        overlays for side-by-side map comparison.
      </p>

      <div id="drone-overview-summary-cards" className="grid grid-cols-1 gap-2">
        <div id="drone-overview-projects-card" className="rounded-lg border border-gray-200 p-3 bg-gray-50">
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <FolderKanban className="w-3.5 h-3.5" />
            <span>Projects</span>
          </div>
          <p className="text-xl font-semibold text-gray-900 mt-1">{loading ? '...' : totalProjects}</p>
        </div>

        <div id="drone-overview-flights-card" className="rounded-lg border border-gray-200 p-3 bg-gray-50">
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <ImageIcon className="w-3.5 h-3.5" />
            <span>Flights</span>
          </div>
          <p className="text-xl font-semibold text-gray-900 mt-1">{loading ? '...' : totalFlights}</p>
        </div>

        <div id="drone-overview-date-range-card" className="rounded-lg border border-gray-200 p-3 bg-gray-50">
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <CalendarRange className="w-3.5 h-3.5" />
            <span>Date Range</span>
          </div>
          <p className="text-sm font-medium text-gray-900 mt-1">{loading ? 'Loading...' : dateRangeLabel}</p>
        </div>
      </div>

      <button
        id="drone-overview-browse-button"
        onClick={onBrowseClick}
        className="w-full py-3 rounded-lg bg-[#2e7d32] text-white text-sm font-medium hover:bg-[#256d29] transition-colors"
      >
        Browse Imagery &rarr;
      </button>
    </div>
  );
}
