// ============================================================================
// PinnedLayerChildRow — Child view within nested multi-view structure (DFT-013)
// Row click = expand filter panel. Eye = toggle visibility.
// Filter clauses displayed split by comma when expanded.
// ============================================================================

import { Eye, EyeOff, X } from 'lucide-react';
import type { PinnedLayerView } from '../../../types';
import { FilterIndicator } from './FilterIndicator';

interface PinnedLayerChildRowProps {
  view: PinnedLayerView;
  isLast: boolean;
  isActive: boolean; // NEW: is this view currently active in the right sidebar?
  onToggleVisibility: () => void;
  onActivate?: () => void; // NEW: activate this child view
  onRemove?: () => void;
}

export function PinnedLayerChildRow({
  view,
  isLast,
  isActive,
  onToggleVisibility,
  onActivate,
  onRemove,
}: PinnedLayerChildRowProps) {

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
          isActive
            ? 'bg-amber-50 border-amber-300 shadow-sm'
            : view.isVisible
              ? 'bg-white border-gray-300 shadow-sm'
              : 'bg-white border-gray-200 opacity-60 hover:opacity-80'
        }`}
        onClick={() => {
          // Clicking child row activates it AND makes it visible
          onActivate?.();
          // If not already visible, toggle visibility (will hide others due to mutual exclusivity)
          if (!view.isVisible) {
            onToggleVisibility();
          }
        }}
        role="button"
        tabIndex={0}
        aria-label={`${view.name} — ${view.isVisible ? 'visible' : 'hidden'}. ${view.filterCount} filters. Click to view details.`}
        onKeyDown={e => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onActivate?.();
          }
        }}
      >
        {/* Eye toggle */}
        <button
          onClick={e => { e.stopPropagation(); onToggleVisibility(); }}
          className="flex-shrink-0"
          aria-label={view.isVisible ? 'Hide view' : 'Show view'}
        >
          {view.isVisible ? (
            <Eye className="w-3.5 h-3.5 text-gray-700" />
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
    </div>
  );
}
