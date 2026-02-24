import { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { useLayers } from '../../../context/LayerContext';
import { useCalFloraFilter } from '../../../context/CalFloraFilterContext';

export function CalFloraLegendWidget() {
  const [isExpanded, setIsExpanded] = useState(true);
  const { activeLayer } = useLayers();
  const { totalObservationCount } = useCalFloraFilter();

  if (!activeLayer || activeLayer.dataSource !== 'calflora') return null;

  const toggleExpanded = () => setIsExpanded((previous) => !previous);

  return (
    <div
      id="calflora-map-legend-widget"
      className="absolute bottom-6 right-6 z-30 w-72 rounded-lg border border-gray-300 bg-white shadow-lg"
    >
      <div
        id="calflora-map-legend-widget-header"
        role="button"
        tabIndex={0}
        onClick={toggleExpanded}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            toggleExpanded();
          }
        }}
        className={`flex cursor-pointer items-center justify-between bg-gray-50 px-4 py-3 transition-colors hover:bg-gray-100 ${isExpanded ? 'rounded-t-lg border-b border-gray-200' : 'rounded-lg'}`}
        aria-label={isExpanded ? 'Collapse CalFlora legend' : 'Expand CalFlora legend'}
      >
        <h3 id="calflora-map-legend-widget-title" className="text-sm font-semibold text-gray-900">
          CalFlora Map Legend
        </h3>
        <button
          id="calflora-map-legend-widget-expand-toggle"
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            toggleExpanded();
          }}
          className="rounded p-0.5 transition-colors hover:bg-gray-200"
          aria-label={isExpanded ? 'Collapse CalFlora legend' : 'Expand CalFlora legend'}
        >
          {isExpanded ? (
            <ChevronDown id="calflora-map-legend-widget-chevron-down-icon" className="h-4 w-4 text-gray-600" />
          ) : (
            <ChevronRight id="calflora-map-legend-widget-chevron-right-icon" className="h-4 w-4 text-gray-600" />
          )}
        </button>
      </div>

      {isExpanded && (
        <div id="calflora-map-legend-widget-content" className="space-y-3 px-4 py-3 text-xs text-gray-700">
          <div id="calflora-map-legend-widget-item-observation" className="flex items-center gap-2">
            <span
              id="calflora-map-legend-widget-swatch-observation"
              className="inline-block h-3.5 w-3.5 rounded-full border border-white shadow"
              style={{ backgroundColor: '#16a34a' }}
            />
            <span id="calflora-map-legend-widget-label-observation">CalFlora plant observation point</span>
          </div>
          <div id="calflora-map-legend-widget-item-selected" className="flex items-center gap-2">
            <span
              id="calflora-map-legend-widget-swatch-selected"
              className="inline-block h-4 w-4 rounded-full border-2 border-emerald-700 bg-emerald-200"
            />
            <span id="calflora-map-legend-widget-label-selected">Selected observation (after sidebar or map click)</span>
          </div>
          <p id="calflora-map-legend-widget-note" className="leading-relaxed text-[11px] text-gray-500">
            Showing up to {totalObservationCount.toLocaleString()} observations, filtered by your Browse controls.
          </p>
        </div>
      )}
    </div>
  );
}
