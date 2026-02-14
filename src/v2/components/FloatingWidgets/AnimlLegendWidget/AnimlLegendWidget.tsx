// ============================================================================
// AnimlLegendWidget — Floating legend over map for animal species filtering.
// Uses locally-cached animal tag counts from AnimlFilterContext.
// Shows loading shimmer while data is being fetched.
// ============================================================================

import { useState } from 'react';
import { ChevronDown, ChevronRight, Loader2 } from 'lucide-react';
import { useAnimlFilter } from '../../../context/AnimlFilterContext';

// Simple color palette for animal categories (distinct, colorblind-friendly)
const ANIMAL_COLORS: string[] = [
  '#2e7d32', '#1565c0', '#c62828', '#f57f17', '#6a1b9a',
  '#00838f', '#d84315', '#4527a0', '#2e7d32', '#ad1457',
  '#00695c', '#ef6c00', '#283593', '#558b2f', '#6d4c41',
];

function getAnimalColor(index: number): string {
  return ANIMAL_COLORS[index % ANIMAL_COLORS.length];
}

export function AnimlLegendWidget() {
  const [isExpanded, setIsExpanded] = useState(true);
  const {
    selectedAnimals, toggleAnimal, selectAll, hasFilter,
    animalTags, loading, dataLoaded,
  } = useAnimlFilter();

  // Sort by count descending, filter out zero-count
  const groups = animalTags
    .filter(t => t.totalObservations > 0)
    .sort((a, b) => b.totalObservations - a.totalObservations);

  // Loading state — show shimmer while fetching
  if (loading || !dataLoaded) {
    return (
      <div
        id="animl-legend-widget"
        className="absolute bottom-6 right-6 bg-white rounded-lg shadow-lg border border-gray-300 z-30 w-72"
      >
        <div id="animl-legend-loading" className="flex items-center gap-2 px-4 py-3">
          <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
          <span className="text-sm text-gray-500">Loading camera trap data...</span>
        </div>
      </div>
    );
  }

  if (groups.length === 0) return null;

  const allVisible = !hasFilter;

  return (
    <div
      id="animl-legend-widget"
      className="absolute bottom-6 right-6 bg-white rounded-lg shadow-lg border border-gray-300 z-30 w-72"
    >
      {/* Header */}
      <div
        id="animl-legend-header"
        className="flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-gray-50 rounded-t-lg"
      >
        <div className="flex items-center gap-2">
          <button
            id="animl-legend-expand-toggle"
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-0.5 hover:bg-gray-200 rounded transition-colors"
            aria-label={isExpanded ? 'Collapse legend' : 'Expand legend'}
          >
            {isExpanded
              ? <ChevronDown className="w-4 h-4 text-gray-600" />
              : <ChevronRight className="w-4 h-4 text-gray-600" />}
          </button>
          <h3 className="text-sm font-semibold text-gray-900">Filter Species</h3>
        </div>
        {!allVisible && (
          <button
            id="animl-legend-show-all"
            onClick={selectAll}
            className="text-xs text-blue-600 hover:text-blue-700 font-medium"
          >
            Show All
          </button>
        )}
      </div>

      {/* Species filter list */}
      {isExpanded && (
        <div id="animl-legend-content" className="p-2 max-h-[32rem] overflow-y-auto space-y-1">
          {groups.map((tag, index) => {
            const isSelected = hasFilter ? selectedAnimals.has(tag.label) : true;
            const bgColor = isSelected
              ? 'bg-emerald-50 hover:bg-emerald-100 border-emerald-200'
              : 'bg-gray-100 hover:bg-gray-150 border-gray-200 opacity-60';

            return (
              <button
                key={tag.label}
                id={`animl-legend-item-${tag.label.replace(/\s+/g, '-').toLowerCase()}`}
                onClick={() => toggleAnimal(tag.label)}
                className={`w-full flex items-center justify-between px-3 py-2 rounded border transition-all ${bgColor}`}
                title={`${isSelected ? 'Hide' : 'Show'} ${tag.label}`}
              >
                <div className="flex items-center gap-2">
                  <span
                    className="w-3 h-3 rounded-full flex-shrink-0"
                    style={{ backgroundColor: getAnimalColor(index) }}
                  />
                  <span className={`text-sm ${isSelected ? 'text-gray-800 font-medium' : 'text-gray-500'}`}>
                    {tag.label}
                  </span>
                </div>
                <span className="text-xs text-gray-600">
                  {tag.totalObservations.toLocaleString()}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
