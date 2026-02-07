// ============================================================================
// BookmarkRow — Single bookmark entry (variants A/B/C based on type)
// A: pointer-filtered, B: pointer-unfiltered, C: self-contained
// Full row is clickable (= View action). DFT-036: hover highlights map item.
// ============================================================================

import { X } from 'lucide-react';
import type { BookmarkedItem } from '../../../types';

interface BookmarkRowProps {
  bookmark: BookmarkedItem;
  onView: () => void;
  onEditFilter?: () => void;
  onRemove: () => void;
}

export function BookmarkRow({ bookmark, onView, onEditFilter, onRemove }: BookmarkRowProps) {
  return (
    <div
      id={`bookmark-row-${bookmark.id}`}
      className="group px-3 py-2 flex flex-col gap-0.5 cursor-pointer hover:bg-gray-50 transition-colors
                 focus-within:ring-2 focus-within:ring-emerald-500 focus-within:ring-offset-1 rounded"
      onClick={onView}
      tabIndex={0}
      role="button"
      aria-label={`View ${bookmark.itemName}${bookmark.filterDescription ? ` — ${bookmark.filterDescription}` : ''}`}
      onKeyDown={e => (e.key === 'Enter' || e.key === ' ') && onView()}
    >
      {/* Line 1: item name + optional filter context */}
      <div className="flex items-center gap-1 min-w-0">
        <span className="text-sm font-medium text-gray-900 truncate">{bookmark.itemName}</span>
        {bookmark.type === 'pointer-filtered' && bookmark.filterDescription && (
          <>
            <span className="text-gray-400 mx-0.5 flex-shrink-0">&rarr;</span>
            <span className="text-sm text-gray-600 truncate">{bookmark.filterDescription}</span>
          </>
        )}
      </div>

      {/* Line 2: count/noun + action links */}
      <div className="flex items-center gap-2 text-xs">
        {/* Count info */}
        {bookmark.type === 'pointer-filtered' && bookmark.resultCount !== undefined && (
          <span className="text-gray-400">
            {bookmark.resultCount} {bookmark.resultNoun}
          </span>
        )}
        {bookmark.type === 'pointer-unfiltered' && (
          <span className="text-gray-400">All {bookmark.allNoun}</span>
        )}

        <span className="flex-1" />

        {/* Action links */}
        <button
          onClick={e => { e.stopPropagation(); onView(); }}
          className="text-emerald-600 hover:text-emerald-700 font-medium"
        >
          View
        </button>

        {bookmark.type === 'pointer-filtered' && onEditFilter && (
          <button
            onClick={e => { e.stopPropagation(); onEditFilter(); }}
            className="text-gray-400 hover:text-gray-700 transition-colors"
          >
            Edit Filter
          </button>
        )}

        <button
          onClick={e => { e.stopPropagation(); onRemove(); }}
          className="text-gray-300 hover:text-red-500 transition-colors"
          title="Remove bookmark"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
