import { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';

export function MOTUSLegendWidget() {
  const [isExpanded, setIsExpanded] = useState(true);

  return (
    <div
      id="motus-map-legend-widget"
      className="absolute bottom-6 right-6 bg-white rounded-lg shadow-lg border border-gray-300 z-30 w-80"
    >
      <div
        id="motus-map-legend-widget-header"
        role="button"
        tabIndex={0}
        onClick={() => setIsExpanded((previous) => !previous)}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            setIsExpanded((previous) => !previous);
          }
        }}
        className={`flex items-center justify-between px-4 py-3 bg-gray-50 cursor-pointer hover:bg-gray-100 transition-colors ${isExpanded ? 'rounded-t-lg border-b border-gray-200' : 'rounded-lg'}`}
        aria-label={isExpanded ? 'Collapse MOTUS legend' : 'Expand MOTUS legend'}
      >
        <h3 id="motus-map-legend-widget-title" className="text-sm font-semibold text-gray-900">
          MOTUS Map Legend
        </h3>
        <button
          id="motus-map-legend-widget-expand-toggle"
          type="button"
          className="p-0.5 hover:bg-gray-200 rounded transition-colors"
          onClick={(event) => {
            event.stopPropagation();
            setIsExpanded((previous) => !previous);
          }}
          aria-label={isExpanded ? 'Collapse MOTUS legend' : 'Expand MOTUS legend'}
        >
          {isExpanded
            ? <ChevronDown className="w-4 h-4 text-gray-600" />
            : <ChevronRight className="w-4 h-4 text-gray-600" />}
        </button>
      </div>

      {isExpanded && (
        <div id="motus-map-legend-widget-content" className="px-4 py-3 space-y-3 text-xs text-gray-700">
          <div id="motus-map-legend-widget-item-tag-point" className="flex items-center gap-2">
            <span id="motus-map-legend-widget-swatch-tag-point" className="inline-block h-3 w-3 rotate-45 rounded-[1px] bg-blue-800" />
            <span id="motus-map-legend-widget-label-tag-point">Selected tagged animal deployment point</span>
          </div>
          <div id="motus-map-legend-widget-item-station-point" className="flex items-center gap-2">
            <span id="motus-map-legend-widget-swatch-station-point" className="inline-block h-3 w-3 rounded-full bg-green-600" />
            <span id="motus-map-legend-widget-label-station-point">Receiver station on inferred journey</span>
          </div>
          <div id="motus-map-legend-widget-item-journey-leg" className="flex items-center gap-2">
            <span id="motus-map-legend-widget-swatch-journey-leg" className="inline-block h-0.5 w-5 bg-amber-600" />
            <span id="motus-map-legend-widget-label-journey-leg">Inferred journey leg (not exact flight path)</span>
          </div>
          <p id="motus-map-legend-widget-note" className="text-[11px] text-gray-500 leading-relaxed">
            Only tags with at least one Dangermond preserve detection are shown.
          </p>
        </div>
      )}
    </div>
  );
}
