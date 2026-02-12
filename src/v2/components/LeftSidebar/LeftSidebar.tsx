// ============================================================================
// LeftSidebar — Persistent layer browser (280px fixed width)
// Dynamically loaded from the Data Catalog FeatureServer via CatalogContext.
// Shows hierarchical categories with subcategories and ~90+ real datasets.
// ============================================================================

import { useState, useCallback, useMemo } from 'react';
import { useCatalog } from '../../context/CatalogContext';
import { SearchBar } from './SearchBar';
import { CategoryGroup } from './CategoryGroup';
import { Search, Loader2 } from 'lucide-react';
import type { Category, CatalogLayer } from '../../types';

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

  const handleSearch = useCallback((query: string) => setSearchQuery(query), []);

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

      <div className="flex-1 overflow-y-auto">
        {/* Loading skeleton */}
        {loading && (
          <div id="catalog-loading" className="flex flex-col items-center justify-center py-16 gap-3">
            <Loader2 className="w-6 h-6 text-gray-400 animate-spin" />
            <p className="text-sm text-gray-500">Loading data catalog…</p>
          </div>
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
    </aside>
  );
}
