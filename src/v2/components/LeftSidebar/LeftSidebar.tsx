// ============================================================================
// LeftSidebar — Persistent layer browser (280px fixed width)
// Dynamically loaded from the Data Catalog FeatureServer via CatalogContext.
// Shows hierarchical categories with subcategories and ~90+ real datasets.
// ============================================================================

import { useState, useCallback, useMemo, useEffect, useRef, type KeyboardEvent as ReactKeyboardEvent } from 'react';
import { useCatalog } from '../../context/CatalogContext';
import { SearchBar } from './SearchBar';
import { CategoryGroup } from './CategoryGroup';
import { Search } from 'lucide-react';
import type { Category, CatalogLayer } from '../../types';
import { InlineLoadingRow } from '../shared/loading/LoadingPrimitives';

interface SearchState {
  filteredLayerIds: Set<string>;
  autoExpandServiceIds: Set<string>;
}

/** Recursively collect all layers from a category and its subcategories. */
function allLayersInCategory(cat: Category): CatalogLayer[] {
  const layers = [...cat.layers];
  if (cat.subcategories) {
    for (const sub of cat.subcategories) {
      layers.push(...allLayersInCategory(sub));
    }
  }
  return layers;
}

export function LeftSidebar() {
  const { categories, loading, error } = useCatalog();
  const [searchQuery, setSearchQuery] = useState('');
  const [liveMessage, setLiveMessage] = useState('');
  const [isScrolling, setIsScrolling] = useState(false);
  const scrollHideTimerRef = useRef<number | null>(null);
  const announceTimerRef = useRef<number | null>(null);
  const scrollAreaRef = useRef<HTMLDivElement | null>(null);
  const [scrollThumbHeight, setScrollThumbHeight] = useState(0);
  const [scrollThumbTop, setScrollThumbTop] = useState(0);

  const handleSearch = useCallback((query: string) => setSearchQuery(query), []);
  const announce = useCallback((message: string) => {
    if (announceTimerRef.current !== null) {
      window.clearTimeout(announceTimerRef.current);
    }
    // Clear first so repeated identical announcements are still read.
    setLiveMessage('');
    announceTimerRef.current = window.setTimeout(() => {
      setLiveMessage(message);
    }, 15);
  }, []);

  const handleTreeKeyDownCapture = useCallback((event: ReactKeyboardEvent<HTMLDivElement>) => {
    const supportedKey = event.key === 'ArrowDown'
      || event.key === 'ArrowUp'
      || event.key === 'Home'
      || event.key === 'End';
    if (!supportedKey) return;

    const target = event.target as HTMLElement | null;
    if (!target) return;

    const currentRow = target.closest('[data-left-sidebar-tree-row="true"]') as HTMLElement | null;
    if (!currentRow) return;

    const rows = Array.from(
      event.currentTarget.querySelectorAll<HTMLElement>('[data-left-sidebar-tree-row="true"]')
    ).filter((row) => {
      const rects = row.getClientRects();
      return Array.from(rects).some((rect) => rect.width > 0 && rect.height > 0);
    });
    if (rows.length === 0) return;

    const currentIndex = rows.indexOf(currentRow);
    if (currentIndex === -1) return;

    let nextIndex = currentIndex;
    if (event.key === 'ArrowDown') {
      nextIndex = Math.min(rows.length - 1, currentIndex + 1);
    } else if (event.key === 'ArrowUp') {
      nextIndex = Math.max(0, currentIndex - 1);
    } else if (event.key === 'Home') {
      nextIndex = 0;
    } else if (event.key === 'End') {
      nextIndex = rows.length - 1;
    }

    if (nextIndex === currentIndex) return;
    event.preventDefault();
    rows[nextIndex]?.focus();
  }, []);
  const updateScrollThumb = useCallback(() => {
    const scrollEl = scrollAreaRef.current;
    if (!scrollEl) return;

    const { scrollTop, scrollHeight, clientHeight } = scrollEl;
    if (scrollHeight <= clientHeight + 1) {
      setScrollThumbHeight(0);
      setScrollThumbTop(0);
      return;
    }

    const thumbHeight = Math.max(28, (clientHeight / scrollHeight) * clientHeight);
    const maxThumbTop = clientHeight - thumbHeight;
    const scrollProgress = scrollTop / (scrollHeight - clientHeight);
    const thumbTop = maxThumbTop * scrollProgress;

    setScrollThumbHeight(thumbHeight);
    setScrollThumbTop(thumbTop);
  }, []);

  const handleScroll = useCallback(() => {
    updateScrollThumb();
    setIsScrolling(true);

    if (scrollHideTimerRef.current !== null) {
      window.clearTimeout(scrollHideTimerRef.current);
    }

    // Keep thumb visible briefly after scroll ends for discoverability.
    scrollHideTimerRef.current = window.setTimeout(() => {
      setIsScrolling(false);
    }, 650);
  }, [updateScrollThumb]);

  useEffect(() => {
    updateScrollThumb();
  }, [categories, loading, error, searchQuery, updateScrollThumb]);

  useEffect(() => {
    const handleResize = () => updateScrollThumb();
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (scrollHideTimerRef.current !== null) {
        window.clearTimeout(scrollHideTimerRef.current);
      }
      if (announceTimerRef.current !== null) {
        window.clearTimeout(announceTimerRef.current);
      }
    };
  }, [updateScrollThumb]);

  // Compute filtered layer IDs when search is active.
  // If a child layer matches, also include + auto-expand the parent service.
  const searchState = useMemo<SearchState | undefined>(() => {
    if (searchQuery.length < 2) return undefined;
    const q = searchQuery.toLowerCase();
    const ids = new Set<string>();
    const autoExpandServiceIds = new Set<string>();
    for (const cat of categories) {
      for (const layer of allLayersInCategory(cat)) {
        if (layer.name.toLowerCase().includes(q)) {
          ids.add(layer.id);
          const parentServiceId = layer.catalogMeta?.parentServiceId;
          if (parentServiceId) {
            ids.add(parentServiceId);
            autoExpandServiceIds.add(parentServiceId);
          }
        }
      }
    }
    return {
      filteredLayerIds: ids,
      autoExpandServiceIds,
    };
  }, [searchQuery, categories]);

  const filteredLayerIds = searchState?.filteredLayerIds;
  const hasResults = !filteredLayerIds || filteredLayerIds.size > 0;

  return (
    <aside
      id="left-sidebar"
      aria-label="Layer browser"
      className="relative w-[280px] flex-shrink-0 bg-white flex flex-col h-full overflow-hidden"
    >
      <div
        id="left-sidebar-right-divider"
        aria-hidden="true"
        className="pointer-events-none absolute inset-y-0 right-0 w-px bg-gray-200 z-10"
      />

      <div id="left-sidebar-content" className="relative flex h-full flex-col">
        <SearchBar onSearch={handleSearch} />
        <div id="left-sidebar-live-region" className="sr-only" aria-live="polite" aria-atomic="true">
          {liveMessage}
        </div>

        <div id="left-sidebar-scroll-wrap" className="relative flex-1 overflow-hidden group">
          <div
            id="left-sidebar-scroll-area"
            ref={scrollAreaRef}
            onScroll={handleScroll}
            className={`h-full overflow-y-auto scroll-area-left-sidebar${isScrolling ? ' is-scrolling' : ''}`}
          >
            {/* Loading skeleton */}
            {loading && (
              <InlineLoadingRow
                id="catalog-loading"
                message="Loading data catalog..."
                containerClassName="flex items-center justify-center py-16 text-gray-400"
              />
            )}

            {/* Error state */}
            {error && !loading && (
              <div id="catalog-error" className="flex flex-col items-center justify-center text-center px-6 py-12">
                <p className="text-sm font-medium text-red-600">Failed to load catalog</p>
                <p className="text-xs text-gray-500 mt-1">{error}</p>
              </div>
            )}

            {/* Category tree */}
            {!loading && !error && hasResults && (
              <div
                id="left-sidebar-tree"
                role="tree"
                aria-label="Data catalog layers"
                onKeyDownCapture={handleTreeKeyDownCapture}
              >
                {categories.map(cat => (
                  <CategoryGroup
                    key={cat.id}
                    category={cat}
                    filteredLayerIds={filteredLayerIds}
                    searchQuery={searchQuery.length >= 2 ? searchQuery : undefined}
                    searchAutoExpandServiceIds={searchState?.autoExpandServiceIds}
                    onAnnounce={announce}
                  />
                ))}
              </div>
            )}

            {/* Empty search results */}
            {!loading && !error && !hasResults && (
              <div className="flex flex-col items-center justify-center text-center px-6 py-12">
                <Search className="w-12 h-12 text-gray-300 mb-3" />
                <p className="text-sm font-medium text-gray-700">
                  No layers match &ldquo;{searchQuery}&rdquo;.
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  Try a different search term.
                </p>
              </div>
            )}
          </div>

          {scrollThumbHeight > 0 && (
            <div
              id="left-sidebar-scrollbar-overlay"
              className="pointer-events-none absolute inset-y-1 right-0.5 w-2"
            >
              <div
                id="left-sidebar-scrollbar-thumb"
                className={`absolute right-0 w-1.5 rounded-full bg-gray-500/55 transition-opacity duration-200 ${
                  isScrolling ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                }`}
                style={{ top: scrollThumbTop, height: scrollThumbHeight }}
              />
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
