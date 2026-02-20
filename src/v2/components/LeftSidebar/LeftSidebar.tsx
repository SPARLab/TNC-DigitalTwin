// ============================================================================
// LeftSidebar — Persistent layer browser (280px fixed width)
// Dynamically loaded from the Data Catalog FeatureServer via CatalogContext.
// Shows hierarchical categories with subcategories and ~90+ real datasets.
// ============================================================================

import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { useCatalog } from '../../context/CatalogContext';
import { SearchBar } from './SearchBar';
import { CategoryGroup } from './CategoryGroup';
import { Search } from 'lucide-react';
import type { Category, CatalogLayer } from '../../types';
import { InlineLoadingRow } from '../shared/loading/LoadingPrimitives';

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
  const [isScrolling, setIsScrolling] = useState(false);
  const scrollHideTimerRef = useRef<number | null>(null);
  const scrollAreaRef = useRef<HTMLDivElement | null>(null);
  const [scrollThumbHeight, setScrollThumbHeight] = useState(0);
  const [scrollThumbTop, setScrollThumbTop] = useState(0);

  const handleSearch = useCallback((query: string) => setSearchQuery(query), []);
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
    };
  }, [updateScrollThumb]);

  // Compute filtered layer IDs when search is active
  const filteredLayerIds = useMemo(() => {
    if (searchQuery.length < 2) return undefined;
    const q = searchQuery.toLowerCase();
    const ids = new Set<string>();
    for (const cat of categories) {
      for (const layer of allLayersInCategory(cat)) {
        if (layer.name.toLowerCase().includes(q)) {
          ids.add(layer.id);
        }
      }
    }
    return ids;
  }, [searchQuery, categories]);

  const hasResults = !filteredLayerIds || filteredLayerIds.size > 0;

  return (
    <aside
      id="left-sidebar"
      role="tree"
      aria-label="Layer browser"
      className="w-[280px] flex-shrink-0 bg-white border-r border-gray-200 flex flex-col h-full overflow-hidden"
    >
      <SearchBar onSearch={handleSearch} />

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
            categories.map(cat => (
              <CategoryGroup
                key={cat.id}
                category={cat}
                filteredLayerIds={filteredLayerIds}
              />
            ))
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
    </aside>
  );
}
