// ============================================================================
// PinnedLayerChildRow — Child view within nested multi-view structure (DFT-013)
// Tree connectors: vertical line + horizontal branch (L-shaped corner)
// ============================================================================

import { Eye, EyeOff } from 'lucide-react';
import type { PinnedLayerView } from '../../../types';
import { FilterIndicator } from './FilterIndicator';

interface PinnedLayerChildRowProps {
  view: PinnedLayerView;
  isLast: boolean;
  onToggle: () => void;
  onEditFilters?: () => void;
}

export function PinnedLayerChildRow({ view, isLast, onToggle, onEditFilters }: PinnedLayerChildRowProps) {
  return (
    <div
      className={`nested-child relative flex items-center gap-1.5 px-3 py-2 ml-6 rounded-lg 
                  cursor-pointer transition-all duration-200 ease-in-out border ${
        view.isVisible
          ? 'bg-emerald-50 border-emerald-200 shadow-sm'
          : 'bg-white border-gray-200 opacity-60 hover:opacity-80'
      }`}
      onClick={onToggle}
      role="button"
      tabIndex={0}
      aria-label={`${view.name} — ${view.isVisible ? 'visible' : 'hidden'}`}
      onKeyDown={e => (e.key === 'Enter' || e.key === ' ') && onToggle()}
    >
      {/* Tree connector: L-shape extending upward into the space-y-1 gap (4px) */}
      <div
        className="absolute w-3"
        style={{
          left: '-12px',
          top: '-4px',              // extend up into the 4px gap
          height: 'calc(50% + 4px)', // from gap top → row center
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
            height: 'calc(50% + 4px)', // extend down into the 4px gap
          }}
          aria-hidden="true"
        />
      )}

      {/* Eye toggle */}
      <button
        onClick={e => { e.stopPropagation(); onToggle(); }}
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
  );
}
