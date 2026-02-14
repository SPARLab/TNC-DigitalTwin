// ============================================================================
// PinnedLayerChildRow — Child view within nested multi-view structure (DFT-013)
// Row click = activate + expand filter panel. Eye = toggle visibility.
// Expansion state managed by parent (accordion pattern: only one child expanded).
// ============================================================================

import { useEffect, useState } from 'react';
import { Eye, EyeOff, X, ChevronRight, Pencil, Check } from 'lucide-react';
import type { PinnedLayerView, CountDisplayMode } from '../../../types';
import { FilterIndicator } from './FilterIndicator';

interface PinnedLayerChildRowProps {
  view: PinnedLayerView;
  isLast: boolean;
  isActive: boolean;
  isExpanded: boolean; // CHANGED: now controlled by parent
  countDisplayMode: CountDisplayMode; // NEW: how to display counts
  onToggleExpand: () => void; // CHANGED: now calls parent to manage accordion
  onToggleVisibility: () => void;
  onActivate?: () => void;
  onRemove?: () => void;
  onRename?: (name: string) => void;
  onEditFilters?: () => void;
  onClearFilters?: () => void;
}

export function PinnedLayerChildRow({
  view,
  isLast,
  isActive,
  isExpanded,
  countDisplayMode,
  onToggleExpand,
  onToggleVisibility,
  onActivate,
  onRemove,
  onRename,
  onEditFilters,
  onClearFilters,
}: PinnedLayerChildRowProps) {
  const isPlaceholder = view.name === 'Add Filters';
  const [isRenaming, setIsRenaming] = useState(false);
  const [draftName, setDraftName] = useState(view.name);

  useEffect(() => {
    setDraftName(view.name);
  }, [view.name]);

  const commitRename = () => {
    onRename?.(draftName);
    setIsRenaming(false);
  };

  // Determine what to show based on count display mode
  const shouldShowFilterCount = 
    countDisplayMode === 'filters-only' || countDisplayMode === 'filters-and-results';
  const shouldShowResultCount = 
    (countDisplayMode === 'results-children' || 
     countDisplayMode === 'results-collapsed' || 
     countDisplayMode === 'filters-and-results') && !isExpanded;
  const showResultCountInExpanded =
    (countDisplayMode === 'results-expanded' || 
     countDisplayMode === 'results-children') && isExpanded;

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

      {/* Main container that expands to include filter details */}
      <div
        className={`nested-child relative ml-6 rounded-lg cursor-pointer transition-all duration-200 ease-in-out ${
          isPlaceholder ? 'border-dashed border' : 'border'
        } ${
          isActive
            ? 'bg-amber-50 border-amber-300 shadow-sm'
            : view.isVisible
              ? 'bg-white border-gray-300 shadow-sm'
              : 'bg-white border-gray-200 shadow-sm'
        }`}
      >
        {/* Top row: Eye, Name, Filter Count, Remove */}
        <div
          className="flex items-center gap-1.5 px-3 py-2"
          onClick={() => {
            onActivate?.();
            if (!view.isVisible) onToggleVisibility();
            onToggleExpand();
          }}
          role="button"
          tabIndex={0}
          aria-label={`${view.name} — ${view.isVisible ? 'visible' : 'hidden'}. ${view.filterCount} filters. Click to view details.`}
          aria-expanded={isExpanded}
          onKeyDown={e => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              onActivate?.();
              onToggleExpand();
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
          <div className="flex-1 min-w-0">
            {isRenaming ? (
              <input
                id={`pinned-child-rename-input-${view.id}`}
                type="text"
                value={draftName}
                onChange={(e) => setDraftName(e.target.value)}
                onClick={(e) => e.stopPropagation()}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    commitRename();
                  }
                  if (e.key === 'Escape') {
                    e.preventDefault();
                    setDraftName(view.name);
                    setIsRenaming(false);
                  }
                }}
                onBlur={commitRename}
                className="w-full text-sm px-2 py-1 border border-emerald-300 rounded-md focus:outline-none
                           focus:ring-1 focus:ring-emerald-500"
                autoFocus
              />
            ) : (
              <span className="text-sm block truncate text-gray-800">
                {view.name}
              </span>
            )}
          </div>

          {/* Count indicators based on display mode */}
          {countDisplayMode !== 'none' && (
            <div className="flex items-center gap-1.5">
              {/* Filter count */}
              {shouldShowFilterCount && (
                <FilterIndicator
                  count={view.filterCount}
                  onClick={undefined}
                />
              )}
              
              {/* Result count */}
              {shouldShowResultCount && view.resultCount !== undefined && (
                <span className="text-xs text-gray-500 flex items-center gap-0.5">
                  <span className="font-medium">{view.resultCount}</span>
                  <span className="text-[10px]">results</span>
                </span>
              )}
            </div>
          )}

          {/* Rename button */}
          {!isRenaming && (
            <button
              id={`pinned-child-rename-btn-${view.id}`}
              onClick={e => {
                e.stopPropagation();
                setDraftName(view.name);
                setIsRenaming(true);
              }}
              className="text-gray-300 hover:text-emerald-600 transition-colors flex-shrink-0 p-0.5"
              title="Rename view"
              aria-label="Rename view"
            >
              <Pencil className="w-3 h-3" />
            </button>
          )}

          {/* Save rename button */}
          {isRenaming && (
            <button
              id={`pinned-child-rename-save-btn-${view.id}`}
              onClick={e => { e.stopPropagation(); commitRename(); }}
              className="text-gray-300 hover:text-emerald-600 transition-colors flex-shrink-0 p-0.5"
              title="Save view name"
              aria-label="Save view name"
            >
              <Check className="w-3 h-3" />
            </button>
          )}

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

        {/* Expanded filter details — inside the same container */}
        <div
          className="grid transition-all duration-300 ease-in-out"
          style={{
            gridTemplateRows: isExpanded ? '1fr' : '0fr',
            opacity: isExpanded ? 1 : 0,
          }}
        >
          <div className="overflow-hidden">
            <div id={`child-filter-panel-${view.id}`} className="px-3 pb-2.5">
              {/* Light gray divider */}
              <div className="border-t border-gray-200 mb-2.5" />

              {/* Filter summary with Clear in top right */}
              <div className="flex items-start justify-between gap-2 mb-2">
                {view.filterSummary ? (
                  <ul className="text-[11px] text-gray-500 space-y-0.5 list-none flex-1">
                    {view.filterSummary.split(',').map((s, i) => (
                      <li key={i}>{s.trim()}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-[11px] text-gray-500 leading-relaxed flex-1">No filters applied.</p>
                )}
                {view.filterCount > 0 && (
                  <button
                    onClick={e => { e.stopPropagation(); onClearFilters?.(); }}
                    className="text-[11px] text-gray-400 hover:text-red-500 cursor-pointer transition-colors flex-shrink-0"
                  >
                    Clear
                  </button>
                )}
              </div>

              {/* Result count (if mode includes results in expanded) — appears AFTER filters */}
              {showResultCountInExpanded && view.resultCount !== undefined && (
                <div className="mb-2 pt-1 border-t border-gray-100">
                  <p className="text-xs text-gray-600 mt-2">
                    <span className="font-semibold">{view.resultCount}</span> results match your filters
                  </p>
                </div>
              )}

              {/* Bottom row: Rename (left) + Edit Filters (right) */}
              <div className="flex items-center justify-between">
                <button
                  id={`pinned-child-rename-link-${view.id}`}
                  onClick={e => {
                    e.stopPropagation();
                    setDraftName(view.name);
                    setIsRenaming(true);
                  }}
                  className="text-[11px] font-medium text-emerald-600 hover:text-emerald-700 cursor-pointer flex items-center gap-0.5"
                >
                  Rename
                  <Pencil className="w-3 h-3" />
                </button>
                <button
                  onClick={e => { e.stopPropagation(); onEditFilters?.(); }}
                  className="text-[11px] font-medium text-emerald-600 hover:text-emerald-700 cursor-pointer flex items-center gap-0.5"
                >
                  Edit Filters
                  <ChevronRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
