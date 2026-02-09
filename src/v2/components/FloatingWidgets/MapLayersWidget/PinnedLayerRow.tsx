// ============================================================================
// PinnedLayerRow — A single pinned layer row with drag, eye, filter, remove
// Supports: flat (single view) or nested (multi-view parent) structures
// Expanded panel for filter summary + actions (DFT-003b)
// ============================================================================

import type { KeyboardEvent as ReactKeyboardEvent } from 'react';
import { Eye, EyeOff, GripVertical, X, ChevronRight, ChevronDown } from 'lucide-react';
import type { PinnedLayer } from '../../../types';
import { FilterIndicator } from './FilterIndicator';
import { PinnedLayerChildRow } from './PinnedLayerChildRow';
import { NewViewButton } from './NewViewButton';

interface PinnedLayerRowProps {
  layer: PinnedLayer;
  isExpanded: boolean;
  showDragHandle: boolean;
  onToggleExpand: () => void;
  onToggleVisibility: () => void;
  onRemove: () => void;
  onEditFilters?: () => void;
  onClearFilters?: () => void;
  onKeyReorder?: (direction: 'up' | 'down') => void;
  onCreateNewView?: () => void;
  onToggleChildView?: (viewId: string) => void;
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
  onKeyReorder,
  onCreateNewView,
  onToggleChildView,
}: PinnedLayerRowProps) {
  const isNested = layer.views && layer.views.length > 0;
  const displayName = !isNested && layer.distinguisher
    ? `${layer.name} (${layer.distinguisher})`
    : layer.name;

  const handleDragKeyDown = (e: ReactKeyboardEvent) => {
    if (!onKeyReorder) return;
    if (e.key === 'ArrowUp') { e.preventDefault(); onKeyReorder('up'); }
    if (e.key === 'ArrowDown') { e.preventDefault(); onKeyReorder('down'); }
  };

  // For nested: parent eye is ON if any child is visible, OFF if all hidden
  const parentEyeOn = isNested && layer.views!.some(v => v.isVisible);

  return (
    <div id={`pinned-row-${layer.id}`}>
      {/* Main row */}
      <div
        className={`flex items-center gap-1.5 px-3 py-2 rounded-lg border cursor-pointer 
                    transition-all duration-200 ease-in-out ${
          isExpanded
            ? 'bg-gray-50 border-gray-300 shadow-sm'
            : layer.isActive
              ? 'bg-emerald-50 border-emerald-300 shadow-sm'
              : 'bg-white border-gray-200 hover:border-gray-300 hover:shadow-sm'
        }`}
        onClick={onToggleExpand}
      >
        {/* Drag handle */}
        {showDragHandle && (
          <button
            className="cursor-grab active:cursor-grabbing text-gray-300 hover:text-gray-500 flex-shrink-0"
            aria-label={`Drag to reorder ${layer.name}. Use arrow keys to move.`}
            onClick={e => e.stopPropagation()}
            onKeyDown={handleDragKeyDown}
          >
            <GripVertical className="w-4 h-4" />
          </button>
        )}

        {/* Eye toggle — different behavior for nested vs flat */}
        <button
          onClick={e => { e.stopPropagation(); onToggleVisibility(); }}
          className="flex-shrink-0 p-0.5 rounded hover:bg-gray-100 transition-colors"
          title={layer.isVisible ? 'Hide on map' : 'Show on map'}
          aria-label={`${layer.name} is ${layer.isVisible ? 'visible' : 'hidden'} on map`}
          aria-pressed={layer.isVisible}
        >
          {(isNested ? parentEyeOn : layer.isVisible) ? (
            <Eye className="w-4 h-4 text-emerald-600" />
          ) : (
            <EyeOff className="w-4 h-4 text-gray-300" />
          )}
        </button>

        {/* Layer name */}
        <span className={`text-sm flex-1 truncate ${
          layer.isVisible ? 'text-gray-700' : 'text-gray-400'
        } ${layer.isActive || isNested ? 'font-semibold text-gray-900' : ''}`}>
          {displayName}
        </span>

        {/* Expand/collapse chevron (for nested or when expanded) */}
        {(isNested || isExpanded) && (
          isExpanded
            ? <ChevronDown className="w-3 h-3 text-gray-400 flex-shrink-0 transition-transform duration-200" />
            : <ChevronRight className="w-3 h-3 text-gray-400 flex-shrink-0 transition-transform duration-200" />
        )}

        {/* Filter indicator (only for flat rows) */}
        {!isNested && (
          <FilterIndicator count={layer.filterCount} onClick={e => { e?.stopPropagation(); onEditFilters?.(); }} />
        )}

        {/* Remove button */}
        <button
          onClick={e => { e.stopPropagation(); onRemove(); }}
          className="text-gray-300 hover:text-red-500 transition-colors flex-shrink-0 p-0.5"
          title={isNested ? "Unpin all views" : "Unpin layer"}
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Nested child views (DFT-013) */}
      {isNested && (
        <div 
          className="grid transition-all duration-300 ease-in-out"
          style={{
            gridTemplateRows: isExpanded ? '1fr' : '0fr',
            opacity: isExpanded ? 1 : 0,
          }}
        >
          <div className="overflow-hidden">
            <div className="mt-1 space-y-1">
              {layer.views!.map((view, index) => (
                <PinnedLayerChildRow
                  key={view.id}
                  view={view}
                  isLast={index === layer.views!.length - 1}
                  onToggle={() => onToggleChildView?.(view.id)}
                  onEditFilters={onEditFilters}
                />
              ))}
              <NewViewButton onClick={() => onCreateNewView?.()} />
            </div>
          </div>
        </div>
      )}

      {/* Expanded panel (DFT-003b) — only for flat rows */}
      {!isNested && (
        <div 
          className="grid transition-all duration-300 ease-in-out"
          style={{
            gridTemplateRows: isExpanded ? '1fr' : '0fr',
            opacity: isExpanded ? 1 : 0,
          }}
        >
          <div className="overflow-hidden">
            <div className="bg-gray-50 border border-gray-200 rounded-lg mx-1 px-3 py-2.5 mt-1">
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
          </div>
        </div>
      )}
    </div>
  );
}
