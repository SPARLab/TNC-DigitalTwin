// ============================================================================
// BookmarkContext — Bookmarked items state management
// Provides: addBookmark, removeBookmark, undo, grouped access
// ============================================================================

import { createContext, useContext, useCallback, useState, useMemo, type ReactNode } from 'react';
import type { BookmarkedItem, UndoAction } from '../types';
import { DUMMY_BOOKMARKS } from '../data/dummyBookmarks';

interface BookmarkContextValue {
  bookmarks: BookmarkedItem[];
  bookmarksByLayer: Map<string, BookmarkedItem[]>;
  addBookmark: (bookmark: Omit<BookmarkedItem, 'id' | 'createdAt'>) => void;
  removeBookmark: (bookmarkId: string) => void;
  hasEverBookmarked: boolean;
  totalCount: number;
  undoStack: UndoAction[];
  undo: () => void;
}

const BookmarkContext = createContext<BookmarkContextValue | null>(null);

export function BookmarkProvider({ children }: { children: ReactNode }) {
  const [bookmarks, setBookmarks] = useState<BookmarkedItem[]>(DUMMY_BOOKMARKS);
  const [hasEverBookmarked, setHasEverBookmarked] = useState(true);
  const [undoStack, setUndoStack] = useState<UndoAction[]>([]);

  const pushUndo = useCallback((description: string, undoFn: () => void) => {
    setUndoStack(prev => [
      { id: crypto.randomUUID(), description, undo: undoFn, timestamp: Date.now() },
      ...prev,
    ].slice(0, 5));
  }, []);

  const addBookmark = useCallback((partial: Omit<BookmarkedItem, 'id' | 'createdAt'>) => {
    const bookmark: BookmarkedItem = {
      ...partial,
      id: crypto.randomUUID(),
      createdAt: Date.now(),
    };
    setBookmarks(prev => [...prev, bookmark]);
    setHasEverBookmarked(true);
  }, []);

  const removeBookmark = useCallback((bookmarkId: string) => {
    const target = bookmarks.find(b => b.id === bookmarkId);
    if (!target) return;
    setBookmarks(prev => prev.filter(b => b.id !== bookmarkId));
    pushUndo(`Removed ${target.itemName}`, () => {
      setBookmarks(prev => [...prev, target]);
    });
  }, [bookmarks, pushUndo]);

  const undo = useCallback(() => {
    if (undoStack.length === 0) return;
    const [action, ...rest] = undoStack;
    action.undo();
    setUndoStack(rest);
  }, [undoStack]);

  // Group bookmarks by layer (DFT-007)
  const bookmarksByLayer = useMemo(() => {
    const map = new Map<string, BookmarkedItem[]>();
    for (const bm of bookmarks) {
      const group = map.get(bm.layerName) ?? [];
      group.push(bm);
      map.set(bm.layerName, group);
    }
    return map;
  }, [bookmarks]);

  return (
    <BookmarkContext.Provider
      value={{
        bookmarks,
        bookmarksByLayer,
        addBookmark,
        removeBookmark,
        hasEverBookmarked,
        totalCount: bookmarks.length,
        undoStack,
        undo,
      }}
    >
      {children}
    </BookmarkContext.Provider>
  );
}

export function useBookmarks() {
  const ctx = useContext(BookmarkContext);
  if (!ctx) throw new Error('useBookmarks must be used within BookmarkProvider');
  return ctx;
}
