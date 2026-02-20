// ============================================================================
// INaturalistLegendWidget — Floating legend over map for taxon filtering
// Uses locally-cached taxon counts from context (no separate API calls).
// Shows loading shimmer while data is being fetched.
// ============================================================================

import { useState } from 'react';
import { ChevronDown, ChevronRight, Loader2 } from 'lucide-react';
import { TAXON_CONFIG, getTaxonEmoji, getTaxonColor } from '../../Map/layers/taxonConfig';
import { useINaturalistFilter } from '../../../context/INaturalistFilterContext';
import { InlineLoadingRow } from '../../shared/loading/LoadingPrimitives';
import { loadingTheme } from '../../shared/loading/loadingTheme';

export function INaturalistLegendWidget() {
  const [isExpanded, setIsExpanded] = useState(true);
  const {
    selectedTaxa, toggleTaxon, selectAll, clearAll, hasFilter,
    taxonCounts, loading, dataLoaded,
  } = useINaturalistFilter();

  // Build legend groups from local counts (sorted by count desc)
  const groups = TAXON_CONFIG
    .map(t => ({ ...t, count: taxonCounts.get(t.value) ?? 0 }))
    .filter(t => t.count > 0)
    .sort((a, b) => b.count - a.count);

  // Loading state — show shimmer while fetching
  if (!dataLoaded) {
    return (
      <div
        id="inat-legend-widget"
        className="absolute bottom-6 right-6 bg-white rounded-lg shadow-lg border border-gray-300 z-30 w-72"
      >
        <InlineLoadingRow
          id="inat-legend-loading"
          message="Loading observations..."
          containerClassName={loadingTheme.legendRow}
          spinnerClassName="w-4 h-4 animate-spin text-gray-400"
          textClassName={loadingTheme.inlineText}
        />
      </div>
    );
  }

  if (groups.length === 0) return null;

  return (
    <div
      id="inat-legend-widget"
      className="absolute bottom-6 right-6 bg-white rounded-lg shadow-lg border border-gray-300 z-30 w-72"
    >
      {/* Header — click anywhere to expand/collapse; caret at far right */}
      <div
        id="inat-legend-header"
        role="button"
        tabIndex={0}
        onClick={() => setIsExpanded(!isExpanded)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            setIsExpanded((v) => !v);
          }
        }}
        className={`flex items-center justify-between px-4 py-3 bg-gray-50 cursor-pointer hover:bg-gray-100 transition-colors ${isExpanded ? 'rounded-t-lg border-b border-gray-200' : 'rounded-lg'}`}
        aria-label={isExpanded ? 'Collapse legend' : 'Expand legend'}
      >
        <div className="flex items-center gap-2 min-w-0">
          <h3 className="text-sm font-semibold text-gray-900">iNaturalist Taxa</h3>
          {loading && dataLoaded && (
            <Loader2 id="inat-legend-refresh-spinner" className={loadingTheme.legendRefreshSpinner} />
          )}
        </div>
        <div id="inat-legend-header-right" className="flex items-center gap-2 flex-shrink-0">
          {hasFilter && (
            <div id="inat-legend-actions" className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
              <button
                id="inat-legend-select-all"
                onClick={selectAll}
                className="text-xs text-emerald-600 hover:text-emerald-700 font-medium"
              >
                Select All
              </button>
              <button
                id="inat-legend-clear-all"
                onClick={clearAll}
                className="text-xs text-emerald-600 hover:text-emerald-700 font-medium"
              >
                Clear All
              </button>
            </div>
          )}
          <button
            id="inat-legend-expand-toggle"
            onClick={(e) => {
              e.stopPropagation();
              setIsExpanded(!isExpanded);
            }}
            className="p-0.5 hover:bg-gray-200 rounded transition-colors"
            aria-label={isExpanded ? 'Collapse legend' : 'Expand legend'}
          >
            {isExpanded
              ? <ChevronDown className="w-4 h-4 text-gray-600" />
              : <ChevronRight className="w-4 h-4 text-gray-600" />}
          </button>
        </div>
      </div>

      {/* Taxon filter list — grid-template-rows drives the expand/collapse animation */}
      <div
        id="inat-legend-content-wrapper"
        className={`grid transition-[grid-template-rows] duration-200 ease-in-out ${
          isExpanded ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
        }`}
      >
        <div className="overflow-hidden">
          <div id="inat-legend-content" className="p-2 max-h-[32rem] overflow-y-auto space-y-1 rounded-b-lg">
            {groups.map(group => {
              const isSelected = hasFilter ? selectedTaxa.has(group.value) : true;
              const bgColor = isSelected
                ? 'bg-emerald-50 hover:bg-emerald-100 border-emerald-200'
                : 'bg-gray-100 hover:bg-gray-150 border-gray-200 opacity-60';

              return (
                <button
                  key={group.value}
                  id={`inat-legend-item-${group.value}`}
                  onClick={() => toggleTaxon(group.value)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded border transition-all ${bgColor}`}
                  title={`${isSelected ? 'Hide' : 'Show'} ${group.label}`}
                >
                  <div className="flex items-center gap-2">
                    <span
                      className="w-3 h-3 rounded-full flex-shrink-0"
                      style={{ backgroundColor: getTaxonColor(group.value) }}
                    />
                    <span className="text-base leading-none">{getTaxonEmoji(group.value)}</span>
                    <span className={`text-sm ${isSelected ? 'text-gray-800 font-medium' : 'text-gray-500'}`}>
                      {group.label}
                    </span>
                  </div>
                  <span className="text-xs text-gray-600">{group.count.toLocaleString()}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
