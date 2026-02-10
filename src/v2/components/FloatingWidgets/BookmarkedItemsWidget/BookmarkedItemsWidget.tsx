// ============================================================================
// BookmarkedItemsWidget — Floating widget showing bookmarked items (top-right)
// Grouped by parent layer. Closeable (unlike MapLayersWidget).
// ============================================================================

import { useState, useEffect, useRef } from 'react';
import { Bookmark } from 'lucide-react';
import { useBookmarks } from '../../../context/BookmarkContext';
import { WidgetShell } from '../shared/WidgetShell';
import { WidgetHeader } from '../shared/WidgetHeader';
import { LayerGroupHeader } from './LayerGroupHeader';
import { BookmarkRow } from './BookmarkRow';

export function BookmarkedItemsWidget() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isClosed, setIsClosed] = useState(false);
  const [justAddedId, setJustAddedId] = useState<string | null>(null);
  const [exitingId, setExitingId] = useState<string | null>(null);
  const [prevBookmarkIds, setPrevBookmarkIds] = useState<Set<string>>(new Set());
  const exitTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  const { bookmarks, bookmarksByLayer, removeBookmark, hasEverBookmarked, undoStack, undo } = useBookmarks();

  const EXIT_DURATION_MS = 400;

  if (isClosed) return null;

  const canUndo = undoStack.length > 0;

  // Detect newly added bookmarks and trigger entrance animation
  useEffect(() => {
    const currentIds = new Set(bookmarks.map(b => b.id));
    
    // Find new bookmark IDs (present in current but not in previous)
    const newIds = bookmarks.filter(b => !prevBookmarkIds.has(b.id)).map(b => b.id);
    
    if (newIds.length > 0) {
      // New bookmark(s) were added - trigger animation for the first one
      const newId = newIds[0];
      setJustAddedId(newId);
      setTimeout(() => setJustAddedId(null), 400); // Match animation duration
    }
    
    // Update previous IDs for next comparison
    setPrevBookmarkIds(currentIds);
  }, [bookmarks, prevBookmarkIds]);

  // Remove with exit animation: collapse + fade, then actually remove
  const handleRemove = (bookmarkId: string) => {
    setExitingId(bookmarkId);
    if (exitTimeoutRef.current) {
      clearTimeout(exitTimeoutRef.current);
    }
    exitTimeoutRef.current = setTimeout(() => {
      removeBookmark(bookmarkId);
      setExitingId(null);
      exitTimeoutRef.current = null;
    }, EXIT_DURATION_MS);
  };

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (exitTimeoutRef.current) {
        clearTimeout(exitTimeoutRef.current);
      }
    };
  }, []);

  return (
    <WidgetShell id="bookmarked-items-widget" position="top-right">
      <WidgetHeader
        icon={<Bookmark className="w-4 h-4" />}
        title="Saved Items"
        count={bookmarks.length}
        isCollapsed={isCollapsed}
        onToggleCollapse={() => setIsCollapsed(prev => !prev)}
        canUndo={canUndo}
        undoDescription={undoStack[0]?.description}
        onUndo={undo}
        onClose={() => setIsClosed(true)}
      />

      <div 
        className="grid transition-all duration-300 ease-in-out"
        style={{
          gridTemplateRows: isCollapsed ? '0fr' : '1fr',
          opacity: isCollapsed ? 0 : 1,
        }}
      >
        <div id="bookmarked-items-body" className="overflow-hidden">
          <div className="scroll-area-widget max-h-[calc(50vh-6rem)] overflow-y-auto">
            {bookmarks.length > 0 ? (
              // Render grouped bookmarks
              <>
                {Array.from(bookmarksByLayer.entries()).map(([layerName, layerBookmarks]) => (
                  <div key={layerName} id={`bookmark-group-${layerName.toLowerCase().replace(/\s+/g, '-')}`} className="mb-2">
                    <LayerGroupHeader layerName={layerName} />
                    <div className="space-y-1.5">
                      {layerBookmarks.map((bm, index) => {
                        const isJustAdded = justAddedId === bm.id;
                        const isExiting = exitingId === bm.id;
                        const row = (
                          <BookmarkRow
                            key={bm.id}
                            bookmark={bm}
                            isLast={index === layerBookmarks.length - 1}
                            onView={() => {/* Phase 1+: navigate to item */}}
                            onEditFilter={bm.type === 'pointer-filtered' ? () => {/* Phase 1+ */} : undefined}
                            onRemove={() => handleRemove(bm.id)}
                          />
                        );
                        const collapseWrapper = (
                          <div
                            key={bm.id}
                            id={isExiting ? undefined : `bookmark-row-collapse-wrapper-${bm.id}`}
                            className={`bookmark-row-wrapper${isExiting ? ' bookmark-row-exit' : ''}`}
                          >
                            {row}
                          </div>
                        );
                        if (isJustAdded) {
                          return (
                            <div
                              key={bm.id}
                              id={`bookmark-row-expand-wrapper-${bm.id}`}
                              className="overflow-hidden animate-bookmark-row-expand"
                            >
                              {collapseWrapper}
                            </div>
                          );
                        }
                        return collapseWrapper;
                      })}
                    </div>
                  </div>
                ))}

                {/* Tip for populated widget */}
                <div className="px-3 py-1.5 bg-slate-50 rounded-b-xl">
                  <p className="text-[11px] text-gray-600">
                    Save items from layers using the right sidebar. If an item has related data, filters for that data are saved as well.
                  </p>
                </div>
              </>
            ) : hasEverBookmarked ? (
              // Returning user — laconic empty state
              <p className="text-sm text-gray-500 px-3 py-4">Bookmarked items appear here.</p>
            ) : (
              // First visit — educational empty state
              <div className="flex flex-col items-center justify-center text-center px-6 py-8">
                <Bookmark className="w-12 h-12 text-gray-300 mb-3" />
                <p className="text-sm font-medium text-gray-700">No items bookmarked.</p>
                <p className="text-sm text-gray-500 mt-1">
                  Bookmarks save specific items within layers (cameras, sensors, observations).
                  Bookmark items from the right sidebar.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </WidgetShell>
  );
}
