// ============================================================================
// PinnedLayerChildRow — Child view within nested multi-view structure (DFT-013)
// Row click = expand filter panel. Eye = toggle visibility.
// Filter clauses displayed split by comma when expanded.
// ============================================================================

import { Eye, EyeOff, ChevronRight } from 'lucide-react';
import type { PinnedLayerView } from '../../../types';
import { FilterIndicator } from './FilterIndicator';

interface PinnedLayerChildRowProps {
  view: PinnedLayerView;
  isLast: boolean;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onToggleVisibility: () => void;
  onEditFilters?: () => void;
  onClearFilters?: () => void;
}

/** Split filterSummary into individual clauses (comma-separated) for display */
function filterClauses(summary: string | undefined): string[] {
  if (!summary?.trim()) return [];
  return summary.split(',').map(s => s.trim()).filter(Boolean);
}

export function PinnedLayerChildRow({
  view,
  isLast,
  isExpanded,
  onToggleExpand,
  onToggleVisibility,
  onEditFilters,
  onClearFilters,
}: PinnedLayerChildRowProps) {
  const clauses = filterClauses(view.filterSummary);

  return (
    <div id={`pinned-child-row-${view.id}`}>
      <div
        className={`nested-child relative flex items-center gap-1.5 px-3 py-2 ml-6 rounded-lg 
                    cursor-pointer transition-all duration-200 ease-in-out border ${
          view.isVisible
            ? 'bg-emerald-50 border-emerald-200 shadow-sm'
            : 'bg-white border-gray-200 opacity-60 hover:opacity-80'
        }`}
        onClick={onToggleExpand}
        role="button"
        tabIndex={0}
        aria-label={`${view.name} — ${view.isVisible ? 'visible' : 'hidden'}. ${view.filterCount} filters. Click to expand.`}
        aria-expanded={isExpanded}
        onKeyDown={e => (e.key === 'Enter' || e.key === ' ') && onToggleExpand()}
      >
        {/* Tree connector: L-shape extending upward into the space-y-1 gap (4px) */}
        <div
          className="absolute w-3"
          style={{
            left: '-12px',
            top: '-4px',
            height: 'calc(50% + 4px)',
            borderLeft: '1px solid rgb(209 213 219)',
            borderBottom: '1px solid rgb(209 213 219)',
          }}
          aria-hidden="true"
        />

        {/* Vertical line continuation into gap below (only for non-last items) */}
        {!isLast && (
          <div
            className="absolute w-px bg-gray-300"
            style={{
              left: '-12px',
              top: '50%',
              height: 'calc(50% + 4px)',
            }}
            aria-hidden="true"
          />
        )}

        {/* Expand chevron */}
        <ChevronRight
          className={`w-3.5 h-3.5 flex-shrink-0 text-gray-400 transition-transform duration-200 ${
            isExpanded ? 'rotate-90' : ''
          }`}
        />

        {/* Eye toggle */}
        <button
          onClick={e => { e.stopPropagation(); onToggleVisibility(); }}
          className="flex-shrink-0"
          aria-label={view.isVisible ? 'Hide view' : 'Show view'}
        >
          {view.isVisible ? (
            <Eye className="w-3.5 h-3.5 text-emerald-600" />
          ) : (
            <EyeOff className="w-3.5 h-3.5 text-gray-300" />
          )}
        </button>

        {/* View name (distinguisher) */}
        <span className={`text-sm flex-1 truncate ${
          view.isVisible ? 'text-gray-800' : 'text-gray-400'
        }`}>
          {view.name}
        </span>

        {/* Filter indicator */}
        <FilterIndicator
          count={view.filterCount}
          onClick={e => { e?.stopPropagation(); onEditFilters?.(); }}
        />
      </div>

      {/* Expanded filter panel — filter clauses + Clear + Edit Filters */}
      <div
        className="grid transition-all duration-300 ease-in-out"
        style={{
          gridTemplateRows: isExpanded ? '1fr' : '0fr',
          opacity: isExpanded ? 1 : 0,
        }}
      >
        <div className="overflow-hidden">
          <div
            id={`child-filter-panel-${view.id}`}
            className="bg-gray-50 border border-gray-200 rounded-lg mx-1 px-3 py-2.5 mt-1 ml-6"
          >
            {clauses.length > 0 ? (
              <ul className="text-[11px] text-gray-500 space-y-0.5 mb-2 list-none">
                {clauses.map((clause, i) => (
                  <li key={i}>{clause}</li>
                ))}
              </ul>
            ) : (
              <p className="text-[11px] text-gray-500 leading-relaxed mb-2">
                No filters applied.
              </p>
            )}

            <div className="flex items-center justify-between">
              {view.filterCount > 0 && (
                <button
                  onClick={onClearFilters}
                  className="text-[11px] text-gray-400 hover:text-red-500 cursor-pointer transition-colors"
                >
                  Clear
                </button>
              )}
              <button
                onClick={onEditFilters}
                className="text-[11px] font-medium text-emerald-600 hover:text-emerald-700 cursor-pointer
                           flex items-center gap-0.5 ml-auto"
              >
                Edit Filters
                <ChevronRight className="w-3 h-3" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
