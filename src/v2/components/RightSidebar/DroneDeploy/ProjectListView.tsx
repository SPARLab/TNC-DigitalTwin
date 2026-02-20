import { useMemo } from 'react';
import { Calendar, Layers, SlidersHorizontal } from 'lucide-react';
import type { DroneImageryMetadata, DroneImageryProject } from '../../../../types/droneImagery';
import type { DroneSortMode } from '../../../context/DroneDeployContext';

interface ProjectListViewProps {
  projects: DroneImageryProject[];
  dateFilter: { startDate: string; endDate: string };
  sortMode: DroneSortMode;
  onDateFilterChange: (_next: { startDate: string; endDate: string }) => void;
  onSortModeChange: (_next: DroneSortMode) => void;
  onOpenProjectDetail: (_project: DroneImageryProject) => void;
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
  onDateFilterChange,
  onSortModeChange,
  onOpenProjectDetail,
}: ProjectListViewProps) {
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
            const wmtsCount = project.imageryLayers.filter((flight) => !!flight.wmts.itemId).length;
            return (
              <button
                key={project.projectName}
                id={`drone-project-card-${projectId}`}
                type="button"
                onClick={() => onOpenProjectDetail(project)}
                className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5 text-left hover:border-gray-300 hover:bg-gray-100 transition-colors"
              >
                <div id={`drone-project-card-header-${projectId}`} className="flex items-center justify-between gap-2">
                  <p className="truncate text-sm font-semibold text-gray-900">{project.projectName}</p>
                  <span
                    id={`drone-project-card-flight-count-${projectId}`}
                    className="rounded-full border border-gray-200 bg-gray-100 px-2 py-0.5 text-[11px] font-medium text-gray-700"
                  >
                    {project.imageryLayers.length} flights
                  </span>
                </div>
                <div
                  id={`drone-project-card-metadata-row-${projectId}`}
                  className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-600"
                >
                  <span id={`drone-project-card-date-${projectId}`} className="inline-flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5" />
                    {formatDateRange(project.dateRangeStart, project.dateRangeEnd)}
                  </span>
                  <span id={`drone-project-card-wmts-${projectId}`} className="inline-flex items-center gap-1">
                    <Layers className="h-3.5 w-3.5" />
                    WMTS {wmtsCount}/{project.imageryLayers.length}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
