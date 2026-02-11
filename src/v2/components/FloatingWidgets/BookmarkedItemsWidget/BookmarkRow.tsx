// ============================================================================
// BookmarkRow — Single bookmark entry (variants A/B/C based on type)
// A: pointer-filtered, B: pointer-unfiltered, C: self-contained
// Full row is clickable (= View action). DFT-036: hover highlights map item.
// Tree connector lines show parent–child relationship with layer header.
// ============================================================================

import { X } from 'lucide-react';
import type { BookmarkedItem } from '../../../types';

interface BookmarkRowProps {
  bookmark: BookmarkedItem;
  isLast: boolean;
  onView: () => void;
  onEditFilter?: () => void;
  onRemove: () => void;
}

export function BookmarkRow({ bookmark, isLast, onView, onEditFilter, onRemove }: BookmarkRowProps) {
  // Check if we have second-line content (count/noun or Edit Filter button)
  const hasSecondLineContent = 
    (bookmark.type === 'pointer-filtered' && bookmark.resultCount !== undefined) ||
    (bookmark.type === 'pointer-unfiltered') ||
    (bookmark.type === 'pointer-filtered' && onEditFilter);

  return (
    <div id={`bookmark-row-wrapper-${bookmark.id}`} className="relative">
      {/* L-shape tree connector: vertical from top + horizontal arm to row */}
      <div
        className="absolute pointer-events-none"
        style={{
          left: '12px',
          top: 0,
          height: '50%',
          width: '12px',
          borderLeft: '1px solid #d1d5db',
          borderBottom: '1px solid #d1d5db',
        }}
        aria-hidden="true"
      />

      {/* Vertical continuation to next sibling (non-last only) */}
      {!isLast && (
        <div
          className="absolute pointer-events-none"
          style={{
            left: '12px',
            top: '50%',
            bottom: '-12px',
            borderLeft: '1px solid #d1d5db',
          }}
          aria-hidden="true"
        />
      )}

      {/* Main row content — indented past tree connectors with left border accent */}
      <div
        id={`bookmark-row-${bookmark.id}`}
        className="group ml-6 pl-2.5 pr-9 py-2 flex flex-col gap-0.5 relative
                   border-l-2 border-l-gray-300
                   cursor-pointer hover:border-l-gray-400 hover:bg-slate-50 
                   active:border-l-gray-500 active:bg-slate-100
                   focus-visible:border-l-gray-400 focus-visible:bg-slate-50
                   transition-colors rounded
                   outline-none ring-0 focus:outline-none focus:ring-0"
        style={{ WebkitTapHighlightColor: 'transparent' }}
        onClick={(e) => { onView(); (e.currentTarget as HTMLElement).blur(); }}
        tabIndex={0}
        role="button"
        aria-label={`View ${bookmark.itemName}${bookmark.filterDescription ? ` — ${bookmark.filterDescription}` : ''}`}
        onKeyDown={e => (e.key === 'Enter' || e.key === ' ') && onView()}
      >
        {/* X button — always vertically centered to row */}
        <button
          onClick={e => { e.stopPropagation(); onRemove(); }}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-300 hover:text-red-500 transition-colors z-10"
          title="Remove bookmark"
        >
          <X className="w-3.5 h-3.5" />
        </button>

        {/* Line 1: item name + optional filter context */}
        <div className="flex items-center gap-1 min-w-0 pr-2">
          <span className="text-sm font-medium text-gray-900 truncate">{bookmark.itemName}</span>
          {bookmark.type === 'pointer-filtered' && bookmark.filterDescription && (
            <>
              <span className="text-gray-400 mx-0.5 flex-shrink-0">&rarr;</span>
              <span className="text-sm text-gray-600 truncate">{bookmark.filterDescription}</span>
            </>
          )}
        </div>

        {/* Line 2: count/noun + action links (only when there's content) */}
        {hasSecondLineContent && (
          <div className="flex items-center gap-1.5 text-xs pr-2">
            {bookmark.type === 'pointer-filtered' && bookmark.resultCount !== undefined && (
              <>
                <span className="text-gray-400">
                  {bookmark.resultCount} {bookmark.resultNoun}
                </span>
                {onEditFilter && (
                  <>
                    <span className="text-gray-400">·</span>
                    <button
                      onClick={e => { e.stopPropagation(); onEditFilter(); }}
                      className="text-emerald-600 hover:text-emerald-700 transition-colors font-medium"
                    >
                      Edit Filters
                    </button>
                  </>
                )}
              </>
            )}
            {bookmark.type === 'pointer-unfiltered' && (
              <span className="text-gray-400">All {bookmark.allNoun}</span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
