// ============================================================================
// LeftSidebar — Persistent layer browser (280px fixed width)
// Shows 13 TNC domain categories + "Research Datasets" with search
// ============================================================================

import { useState, useCallback, useMemo } from 'react';
import { CATEGORIES } from '../../data/layerRegistry';
import { SearchBar } from './SearchBar';
import { CategoryGroup } from './CategoryGroup';
import { Search } from 'lucide-react';

export function LeftSidebar() {
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = useCallback((query: string) => setSearchQuery(query), []);

  // Compute filtered layer IDs when search is active
  const filteredLayerIds = useMemo(() => {
    if (searchQuery.length < 2) return undefined;
    const q = searchQuery.toLowerCase();
    const ids = new Set<string>();
    for (const cat of CATEGORIES) {
      for (const layer of cat.layers) {
        if (layer.name.toLowerCase().includes(q)) {
          ids.add(layer.id);
        }
      }
    }
    return ids;
  }, [searchQuery]);

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
        {hasResults ? (
          CATEGORIES.map(cat => (
            <CategoryGroup
              key={cat.id}
              category={cat}
              filteredLayerIds={filteredLayerIds}
            />
          ))
        ) : (
          <div className="flex flex-col items-center justify-center text-center px-6 py-12">
            <Search className="w-12 h-12 text-gray-300 mb-3" />
            <p className="text-sm font-medium text-gray-700">
              No layers match "{searchQuery}".
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
