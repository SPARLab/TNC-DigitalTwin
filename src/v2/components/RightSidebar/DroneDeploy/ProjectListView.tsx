import { useMemo, useState } from 'react';
import { Calendar, ChevronDown, ChevronRight, ImageIcon, Layers, Package, SlidersHorizontal } from 'lucide-react';
import type { DroneImageryMetadata, DroneImageryProject } from '../../../../types/droneImagery';
import type { DroneSortMode } from '../../../context/DroneDeployContext';

interface ProjectListViewProps {
  projects: DroneImageryProject[];
  dateFilter: { startDate: string; endDate: string };
  sortMode: DroneSortMode;
  loadedFlightIds: number[];
  selectedFlightId?: number;
  onDateFilterChange: (_next: { startDate: string; endDate: string }) => void;
  onSortModeChange: (_next: DroneSortMode) => void;
  onOpenDetail: (_flight: DroneImageryMetadata) => void;
  onTogglePinned: (_flight: DroneImageryMetadata) => void;
  onSelectFlight: (_flight: DroneImageryMetadata) => void;
}

function formatDate(date: Date): string {
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function formatDateRange(startDate: Date, endDate: Date): string {
  if (startDate.getTime() === endDate.getTime()) return formatDate(startDate);
  return `${formatDate(startDate)} - ${formatDate(endDate)}`;
}

function flightInRange(flight: DroneImageryMetadata, startDate: string, endDate: string): boolean {
  const time = flight.dateCaptured.getTime();
  if (startDate) {
    const start = new Date(`${startDate}T00:00:00`).getTime();
    if (time < start) return false;
  }
  if (endDate) {
    const end = new Date(`${endDate}T23:59:59`).getTime();
    if (time > end) return false;
  }
  return true;
}

export function ProjectListView({
  projects,
  dateFilter,
  sortMode,
  loadedFlightIds,
  selectedFlightId,
  onDateFilterChange,
  onSortModeChange,
  onOpenDetail,
  onTogglePinned,
  onSelectFlight,
}: ProjectListViewProps) {
  const [expandedProjects, setExpandedProjects] = useState<Record<string, boolean>>({});

  const filteredAndSortedProjects = useMemo(() => {
    const nextProjects = projects
      .map((project) => {
        const filteredFlights = project.imageryLayers
          .filter((flight) => flightInRange(flight, dateFilter.startDate, dateFilter.endDate))
          .sort((a, b) => b.dateCaptured.getTime() - a.dateCaptured.getTime());
        return {
          ...project,
          imageryLayers: filteredFlights,
        };
      })
      .filter((project) => project.imageryLayers.length > 0);

    if (sortMode === 'project') {
      nextProjects.sort((a, b) => a.projectName.localeCompare(b.projectName));
    } else {
      nextProjects.sort((a, b) => b.dateRangeEnd.getTime() - a.dateRangeEnd.getTime());
    }

    return nextProjects;
  }, [projects, dateFilter, sortMode]);

  const filteredFlightCount = useMemo(
    () => filteredAndSortedProjects.reduce((sum, project) => sum + project.imageryLayers.length, 0),
    [filteredAndSortedProjects]
  );

  return (
    <div id="drone-project-list-view" className="space-y-3">
      <div id="drone-browse-controls" className="rounded-lg border border-gray-200 p-3 space-y-3 bg-gray-50">
        <div id="drone-browse-filters-header" className="flex items-center gap-2 text-xs font-semibold text-gray-600 uppercase">
          <SlidersHorizontal className="w-3.5 h-3.5" />
          <span>Filters</span>
        </div>
        <div id="drone-browse-date-filter-row" className="grid grid-cols-2 gap-2">
          <label id="drone-filter-start-label" htmlFor="drone-filter-start" className="text-xs text-gray-600">
            Start Date
          </label>
          <label id="drone-filter-end-label" htmlFor="drone-filter-end" className="text-xs text-gray-600">
            End Date
          </label>
          <input
            id="drone-filter-start"
            type="date"
            value={dateFilter.startDate}
            onChange={(event) => onDateFilterChange({ ...dateFilter, startDate: event.target.value })}
            className="px-2 py-1.5 rounded border border-gray-300 text-xs"
          />
          <input
            id="drone-filter-end"
            type="date"
            value={dateFilter.endDate}
            onChange={(event) => onDateFilterChange({ ...dateFilter, endDate: event.target.value })}
            className="px-2 py-1.5 rounded border border-gray-300 text-xs"
          />
        </div>
        <div id="drone-browse-sort-row" className="space-y-1">
          <label id="drone-sort-label" htmlFor="drone-sort-select" className="text-xs text-gray-600">
            Sort
          </label>
          <select
            id="drone-sort-select"
            value={sortMode}
            onChange={(event) => onSortModeChange(event.target.value as DroneSortMode)}
            className="w-full px-2 py-1.5 rounded border border-gray-300 text-xs bg-white"
          >
            <option value="newest">Newest flight date</option>
            <option value="project">Project name</option>
          </select>
        </div>
      </div>

      <div id="drone-browse-summary" className="text-xs text-gray-600">
        Showing {filteredFlightCount} flights across {filteredAndSortedProjects.length} projects
      </div>

      {filteredAndSortedProjects.length === 0 ? (
        <div id="drone-project-list-empty" className="rounded-lg border border-gray-200 p-4 text-sm text-gray-600">
          No flights match the selected date range.
        </div>
      ) : (
        <div id="drone-project-cards" className="space-y-2">
          {filteredAndSortedProjects.map((project) => {
            const projectId = project.projectName.toLowerCase().replace(/[^a-z0-9]+/g, '-');
            const isExpanded = expandedProjects[projectId] ?? true;
            return (
              <section
                key={project.projectName}
                id={`drone-project-card-${projectId}`}
                className="rounded-lg border border-gray-200 overflow-hidden"
              >
                <button
                  id={`drone-project-toggle-${projectId}`}
                  onClick={() =>
                    setExpandedProjects((prev) => ({ ...prev, [projectId]: !isExpanded }))
                  }
                  className="w-full px-3 py-2.5 bg-gray-50 hover:bg-gray-100 transition-colors text-left"
                >
                  <div id={`drone-project-header-${projectId}`} className="flex items-start gap-2">
                    {isExpanded ? (
                      <ChevronDown className="w-4 h-4 mt-0.5 text-gray-600 flex-shrink-0" />
                    ) : (
                      <ChevronRight className="w-4 h-4 mt-0.5 text-gray-600 flex-shrink-0" />
                    )}
                    <div id={`drone-project-header-content-${projectId}`} className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-gray-900 truncate">{project.projectName}</p>
                      <p className="text-xs text-gray-600 mt-0.5">
                        {project.imageryLayers.length} flights
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {formatDateRange(project.dateRangeStart, project.dateRangeEnd)}
                      </p>
                    </div>
                  </div>
                </button>

                {isExpanded && (
                  <div id={`drone-flight-list-${projectId}`} className="divide-y divide-gray-100">
                    {project.imageryLayers.map((flight) => {
                      const isLoaded = loadedFlightIds.includes(flight.id);
                      const isSelected = selectedFlightId === flight.id;
                      return (
                        <article
                          key={flight.id}
                          id={`drone-flight-card-${flight.id}`}
                          className={`px-3 py-2.5 ${isSelected ? 'bg-amber-50' : 'bg-white'}`}
                        >
                          <div id={`drone-flight-card-top-${flight.id}`} className="flex items-start justify-between gap-2">
                            <div id={`drone-flight-card-text-${flight.id}`} className="min-w-0">
                              <button
                                id={`drone-flight-select-${flight.id}`}
                                type="button"
                                onClick={() => onSelectFlight(flight)}
                                className="max-w-full truncate text-left text-sm font-medium text-gray-900 hover:text-blue-700"
                              >
                                {flight.planName}
                              </button>
                              <p className="text-xs text-gray-600 mt-0.5 flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                <span>{formatDate(flight.dateCaptured)}</span>
                              </p>
                              <div id={`drone-flight-badges-${flight.id}`} className="flex flex-wrap gap-1 mt-1">
                                <span className="text-[11px] rounded-full px-2 py-0.5 bg-blue-50 text-blue-700 border border-blue-200 flex items-center gap-1">
                                  <Layers className="w-3 h-3" />
                                  WMTS
                                </span>
                                {flight.imageCollection && (
                                  <span className="text-[11px] rounded-full px-2 py-0.5 bg-purple-50 text-purple-700 border border-purple-200 flex items-center gap-1">
                                    <Package className="w-3 h-3" />
                                    Collection
                                  </span>
                                )}
                                {isLoaded && (
                                  <span className="text-[11px] rounded-full px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                                    <ImageIcon className="w-3 h-3" />
                                    Loaded
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          <div id={`drone-flight-card-actions-${flight.id}`} className="mt-2 flex gap-2">
                            <button
                              id={`drone-flight-open-detail-${flight.id}`}
                              onClick={() => onOpenDetail(flight)}
                              className="flex-1 px-2.5 py-1.5 text-xs rounded border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors"
                            >
                              View Details
                            </button>
                            <button
                              id={`drone-flight-toggle-pin-${flight.id}`}
                              onClick={() => onTogglePinned(flight)}
                              className={`flex-1 px-2.5 py-1.5 text-xs rounded border transition-colors ${
                                isLoaded
                                  ? 'border-red-200 bg-red-50 text-red-700 hover:bg-red-100'
                                  : 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                              }`}
                            >
                              {isLoaded ? 'Unpin Flight' : 'Pin Flight'}
                            </button>
                          </div>
                        </article>
                      );
                    })}
                  </div>
                )}
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}
