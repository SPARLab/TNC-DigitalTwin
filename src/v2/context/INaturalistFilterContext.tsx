// ============================================================================
// INaturalistFilterContext — Global taxon filter state for iNaturalist layer
// Shared between floating legend widget, right sidebar, and map layer.
// Filters both the sidebar query AND the map graphics.
// Supports multi-select: empty Set = show all, otherwise show only selected taxa.
// ============================================================================

import { createContext, useContext, ReactNode, useState, useCallback } from 'react';

interface INaturalistFilterContextValue {
  selectedTaxa: Set<string>; // Empty = show all
  toggleTaxon: (taxon: string) => void;
  selectAll: () => void;
  clearAll: () => void;
  hasFilter: boolean;
}

const INaturalistFilterContext = createContext<INaturalistFilterContextValue | null>(null);

export function INaturalistFilterProvider({ children }: { children: ReactNode }) {
  const [selectedTaxa, setSelectedTaxa] = useState<Set<string>>(new Set());

  const toggleTaxon = useCallback((taxon: string) => {
    setSelectedTaxa(prev => {
      const next = new Set(prev);
      if (next.has(taxon)) {
        next.delete(taxon);
      } else {
        next.add(taxon);
      }
      return next;
    });
  }, []);

  const selectAll = useCallback(() => setSelectedTaxa(new Set()), []);
  const clearAll = useCallback(() => setSelectedTaxa(new Set()), []);

  const hasFilter = selectedTaxa.size > 0;

  return (
    <INaturalistFilterContext.Provider value={{ selectedTaxa, toggleTaxon, selectAll, clearAll, hasFilter }}>
      {children}
    </INaturalistFilterContext.Provider>
  );
}

export function useINaturalistFilter() {
  const context = useContext(INaturalistFilterContext);
  if (!context) {
    throw new Error('useINaturalistFilter must be used within INaturalistFilterProvider');
  }
  return context;
}
