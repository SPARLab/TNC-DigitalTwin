// ============================================================================
// PinnedLayerChildRow — Child view within nested multi-view structure (DFT-013)
// Row click = expand filter panel. Eye = toggle visibility.
// Filter clauses displayed split by comma when expanded.
// ============================================================================

import { Eye, EyeOff, ChevronRight, X } from 'lucide-react';
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
  onRemove?: () => void;
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
  onRemove,
}: PinnedLayerChildRowProps) {
  const clauses = filterClauses(view.filterSummary);

  return (
    <div id={`pinned-child-row-${view.id}`} className="relative">
      {/* L-shape tree connector: vertical from top + horizontal arm to row */}
      <div
        className="absolute pointer-events-none"
        style={{
          left: '12px',
          top: 0,
          height: '19px',
          width: '12px',
          borderLeft: '1px solid #d1d5db',
          borderBottom: '1px solid #d1d5db',
        }}
        aria-hidden="true"
      />

      {/* Vertical continuation: row center to bottom of wrapper + gap (non-last only) */}
      {!isLast && (
        <div
          className="absolute pointer-events-none"
          style={{
            left: '12px',
            top: '19px',
            bottom: '-4px',
            borderLeft: '1px solid #d1d5db',
          }}
          aria-hidden="true"
        />
      )}

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
          onClick={undefined}
        />

        {/* Remove button */}
        <button
          onClick={e => { e.stopPropagation(); onRemove?.(); }}
          className="text-gray-300 hover:text-red-500 transition-colors flex-shrink-0 p-0.5"
          title="Remove this view"
          aria-label="Remove view"
        >
          <X className="w-3 h-3" />
        </button>
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
            {/* Filter summary with Clear in top right */}
            <div className="flex items-start justify-between gap-2 mb-2">
              {clauses.length > 0 ? (
                <ul className="text-[11px] text-gray-500 space-y-0.5 list-none flex-1">
                  {clauses.map((clause, i) => (
                    <li key={i}>{clause}</li>
                  ))}
                </ul>
              ) : (
                <p className="text-[11px] text-gray-500 leading-relaxed flex-1">
                  No filters applied.
                </p>
              )}
              {view.filterCount > 0 && (
                <button
                  onClick={onClearFilters}
                  className="text-[11px] text-gray-400 hover:text-red-500 cursor-pointer transition-colors flex-shrink-0"
                >
                  Clear
                </button>
              )}
            </div>

            {/* Bottom row: Edit Filters (right-aligned) */}
            <div className="flex items-center justify-end">
              <button
                onClick={onEditFilters}
                className="text-[11px] font-medium text-emerald-600 hover:text-emerald-700 cursor-pointer
                           flex items-center gap-0.5"
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
