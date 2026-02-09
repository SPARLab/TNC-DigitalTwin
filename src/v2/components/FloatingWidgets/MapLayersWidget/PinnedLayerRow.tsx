// ============================================================================
// PinnedLayerRow — A single pinned layer row with drag, eye, filter, remove
// Supports: flat (single view) or nested (multi-view parent) structures
// Expanded panel for filter summary + actions (DFT-003b)
// Drag-and-drop powered by @dnd-kit (DFT-034)
// ============================================================================

import { useState, useEffect } from 'react';
import type { KeyboardEvent as ReactKeyboardEvent, CSSProperties } from 'react';
import { Eye, EyeOff, GripVertical, X, ChevronRight, Plus } from 'lucide-react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { PinnedLayer } from '../../../types';
import { FilterIndicator } from './FilterIndicator';
import { PinnedLayerChildRow } from './PinnedLayerChildRow';
import { NewViewButton } from './NewViewButton';

interface PinnedLayerRowProps {
  layer: PinnedLayer;
  isExpanded: boolean;
  showDragHandle: boolean;
  justDropped?: boolean;
  activeViewId?: string; // NEW: which child view is currently active (if nested)
  onToggleExpand: () => void;
  onToggleVisibility: () => void;
  onRemove: () => void;
  onActivate?: () => void; // NEW: activate this layer (show in right sidebar)
  onEditFilters?: () => void;
  onClearFilters?: () => void;
  onKeyReorder?: (direction: 'up' | 'down') => void;
  onToggleChildView?: (viewId: string) => void;
  onEditFiltersForChild?: (viewId: string) => void;
  onClearFiltersForChild?: (viewId: string) => void;
  onCreateNewView?: () => void;
  onRemoveChildView?: (viewId: string) => void;
  onActivateChildView?: (viewId: string) => void; // NEW: activate a specific child view
}

export function PinnedLayerRow({
  layer,
  isExpanded,
  showDragHandle,
  justDropped = false,
  activeViewId,
  onToggleExpand,
  onToggleVisibility,
  onRemove,
  onActivate,
  onEditFilters,
  onClearFilters,
  onKeyReorder,
  onToggleChildView,
  onEditFiltersForChild,
  onClearFiltersForChild,
  onCreateNewView,
  onRemoveChildView,
  onActivateChildView,
}: PinnedLayerRowProps) {
  const isNested = layer.views && layer.views.length > 0;
  const displayName = !isNested && layer.distinguisher
    ? `${layer.name} (${layer.distinguisher})`
    : layer.name;

  // Track which child view is expanded (accordion pattern)
  const [expandedChildId, setExpandedChildId] = useState<string | null>(null);

  // Auto-activate and expand visible child when parent becomes active
  useEffect(() => {
    if (layer.isActive && isNested && isExpanded) {
      // Parent is active and expanded → find visible child and activate it
      const visibleChild = layer.views!.find(v => v.isVisible);
      if (visibleChild && !activeViewId) {
        // No child is active yet, activate the visible one
        onActivateChildView?.(visibleChild.id);
      }
    }
  }, [layer.isActive, isNested, isExpanded, activeViewId, layer.views, onActivateChildView]);

  // Auto-expand active child when parent is expanded from sidebar
  useEffect(() => {
    if (isExpanded && isNested && activeViewId) {
      // Parent just expanded and there's an active child → expand that child
      setExpandedChildId(activeViewId);
    }
  }, [isExpanded, isNested, activeViewId]);

  // Drag-and-drop setup
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: layer.id });

  const handleDragKeyDown = (e: ReactKeyboardEvent) => {
    if (!onKeyReorder) return;
    if (e.key === 'ArrowUp') { e.preventDefault(); onKeyReorder('up'); }
    if (e.key === 'ArrowDown') { e.preventDefault(); onKeyReorder('down'); }
  };

  // For nested: parent eye is ON if any child is visible, OFF if all hidden
  const parentEyeOn = isNested && layer.views!.some(v => v.isVisible);

  // For nested: parent filter count should match the visible child's count
  const parentFilterCount = isNested 
    ? layer.views!.find(v => v.isVisible)?.filterCount ?? 0
    : layer.filterCount;

  // Build drag styles (DFT-034)
  const style: CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div 
      id={`pinned-row-${layer.id}`} 
      ref={setNodeRef} 
      style={style}
      className={isDragging ? 'relative z-50' : ''}
    >
      {/* Main row — wrapped in relative for tree connector stub */}
      <div className="relative">
      <div
        className={`flex items-center gap-1.5 px-3 py-2 rounded-lg cursor-pointer 
                    transition-all duration-200 ease-in-out
                    ${isDragging ? 'border-2' : 'border'} ${
          isDragging
            ? `opacity-60 shadow-[0_12px_40px_-8px_rgba(0,0,0,0.3)] ${
                layer.isActive ? 'border-amber-300 bg-amber-50' : 
                isExpanded ? 'border-gray-300 bg-gray-50' : 
                'border-gray-300 bg-white'
              }`
            : justDropped
              ? 'animate-settle'
              : layer.isActive
                ? 'bg-amber-50 border-amber-300 shadow-sm'
                : isExpanded
                  ? 'bg-gray-50 border-gray-300 shadow-sm'
                  : 'bg-white border-gray-200 hover:border-gray-300 hover:shadow-sm'
        }`}
        onClick={() => {
          // Clicking the row activates this layer (shows in right sidebar)
          // AND expands/collapses the panel to show filters/options
          
          if (isNested) {
            // For nested: activate visible child and toggle expand to show/hide children
            const visibleChild = layer.views!.find(v => v.isVisible);
            if (visibleChild) {
              onActivateChildView?.(visibleChild.id);
            } else {
              onActivate?.();
            }
            // Toggle expand to show/hide children
            onToggleExpand();
          } else {
            // For flat: activate and toggle expand panel
            onActivate?.();
            onToggleExpand();
          }
        }}
      >
        {/* Drag handle */}
        {showDragHandle && (
          <button
            {...attributes}
            {...listeners}
            className="cursor-grab active:cursor-grabbing text-gray-300 hover:text-gray-500 flex-shrink-0 touch-none"
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
            <Eye className="w-4 h-4 text-gray-700" />
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

        {/* Filter indicator — always visible (parent shows visible child's count) */}
        <FilterIndicator 
          count={parentFilterCount} 
          onClick={e => { e?.stopPropagation(); onEditFilters?.(); }} 
        />

        {/* Remove button */}
        <button
          onClick={e => { e.stopPropagation(); onRemove(); }}
          className="text-gray-300 hover:text-red-500 transition-colors flex-shrink-0 p-0.5"
          title={isNested ? "Unpin all views" : "Unpin layer"}
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Tree connector stub — bridges gap from parent row to children */}
      {isNested && isExpanded && (
        <div
          className="absolute pointer-events-none"
          style={{ left: '12px', top: '100%', height: '12px', borderLeft: '1px solid #d1d5db' }}
          aria-hidden="true"
        />
      )}
      </div>{/* close relative wrapper */}

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
                  isActive={activeViewId === view.id}
                  isExpanded={expandedChildId === view.id}
                  onToggleExpand={() => setExpandedChildId(prev => prev === view.id ? null : view.id)}
                  onToggleVisibility={() => onToggleChildView?.(view.id)}
                  onActivate={() => onActivateChildView?.(view.id)}
                  onRemove={() => onRemoveChildView?.(view.id)}
                  onEditFilters={() => onEditFiltersForChild?.(view.id)}
                  onClearFilters={() => onClearFiltersForChild?.(view.id)}
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
            <div id={`flat-filter-panel-${layer.id}`} className="bg-gray-50 border border-gray-200 rounded-lg mx-1 px-3 py-2.5 mt-1">
              {/* Filter summary with Clear in top right */}
              <div className="flex items-start justify-between gap-2 mb-2">
                {layer.filterSummary ? (
                  <ul className="text-[11px] text-gray-500 space-y-0.5 list-none flex-1">
                    {layer.filterSummary.split(',').map((s, i) => (
                      <li key={i}>{s.trim()}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-[11px] text-gray-500 leading-relaxed flex-1">No filters applied.</p>
                )}
                {layer.filterCount > 0 && (
                  <button
                    onClick={onClearFilters}
                    className="text-[11px] text-gray-400 hover:text-red-500 cursor-pointer transition-colors flex-shrink-0"
                  >
                    Clear
                  </button>
                )}
              </div>

              {/* Bottom row: New View (left) + Edit Filters (right) */}
              <div className="flex items-center justify-between gap-2">
                <button
                  onClick={(e) => { e.stopPropagation(); onCreateNewView?.(); }}
                  className="text-[11px] text-emerald-600 hover:text-emerald-700 cursor-pointer transition-colors 
                             flex items-center gap-1 px-0 py-0.5"
                  aria-label="Create new filtered view"
                >
                  <Plus className="w-3 h-3" />
                  New View
                </button>
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
      )}
    </div>
  );
}
