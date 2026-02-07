// ============================================================================
// PinnedLayerRow — A single pinned layer row with drag, eye, filter, remove
// Supports expanded panel for filter summary + actions (DFT-003b)
// ============================================================================

import { Eye, EyeOff, GripVertical, X, ChevronRight } from 'lucide-react';
import type { PinnedLayer } from '../../../types';
import { FilterIndicator } from './FilterIndicator';

interface PinnedLayerRowProps {
  layer: PinnedLayer;
  isExpanded: boolean;
  showDragHandle: boolean;
  onToggleExpand: () => void;
  onToggleVisibility: () => void;
  onRemove: () => void;
  onEditFilters?: () => void;
  onClearFilters?: () => void;
}

export function PinnedLayerRow({
  layer,
  isExpanded,
  showDragHandle,
  onToggleExpand,
  onToggleVisibility,
  onRemove,
  onEditFilters,
  onClearFilters,
}: PinnedLayerRowProps) {
  const displayName = layer.distinguisher
    ? `${layer.name} (${layer.distinguisher})`
    : layer.name;

  return (
    <div id={`pinned-row-${layer.id}`}>
      {/* Main row */}
      <div
        className={`flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-colors ${
          layer.isActive ? 'bg-emerald-50 border border-emerald-200' : 'bg-white hover:bg-gray-50'
        }`}
        onClick={onToggleExpand}
      >
        {/* Drag handle */}
        {showDragHandle && (
          <button
            className="cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600 flex-shrink-0"
            aria-label="Drag to reorder"
            onClick={e => e.stopPropagation()}
          >
            <GripVertical className="w-4 h-4" />
          </button>
        )}

        {/* Eye toggle */}
        <button
          onClick={e => { e.stopPropagation(); onToggleVisibility(); }}
          className="flex-shrink-0"
          title={layer.isVisible ? 'Hide on map' : 'Show on map'}
        >
          {layer.isVisible ? (
            <Eye className="w-4 h-4 text-emerald-600" />
          ) : (
            <EyeOff className="w-4 h-4 text-gray-300" />
          )}
        </button>

        {/* Layer name */}
        <span className={`text-sm flex-1 truncate ${
          layer.isVisible ? 'text-gray-700' : 'text-gray-400'
        } ${layer.isActive ? 'font-semibold text-gray-900' : ''}`}>
          {displayName}
        </span>

        {/* Filter indicator */}
        <FilterIndicator count={layer.filterCount} onClick={onEditFilters} />

        {/* Remove button */}
        <button
          onClick={e => { e.stopPropagation(); onRemove(); }}
          className="text-gray-300 hover:text-red-500 transition-colors flex-shrink-0"
          title="Unpin layer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Expanded panel (DFT-003b) */}
      {isExpanded && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg mx-1 px-3 py-2.5 mt-1 transition-all">
          {/* Filter summary */}
          <p className="text-[11px] text-gray-500 leading-relaxed mb-2">
            {layer.filterSummary || 'No filters applied.'}
          </p>

          {/* Action row */}
          <div className="flex items-center justify-between">
            {layer.filterCount > 0 && (
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
      )}
    </div>
  );
}
