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
                  cursor-pointer transition-all duration-150 border ${
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
      {/* Vertical line connector (::before) */}
      <div
        className="absolute left-[-12px] top-0 w-px bg-gray-300"
        style={{ height: isLast ? '50%' : '100%' }}
        aria-hidden="true"
      />
      
      {/* Horizontal branch connector (::after) */}
      <div
        className="absolute left-[-12px] top-1/2 h-px w-3 bg-gray-300 -translate-y-px"
        aria-hidden="true"
      />

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
