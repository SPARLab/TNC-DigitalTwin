// ============================================================================
// INaturalistFilterContext — Global taxon filter state for iNaturalist layer
// Shared between floating legend widget, right sidebar, and map layer.
// Filters both the sidebar query AND the map graphics.
// ============================================================================

import { createContext, useContext, ReactNode, useState, useCallback } from 'react';

interface INaturalistFilterContextValue {
  taxonCategory: string;
  setTaxonCategory: (category: string) => void;
  clearFilter: () => void;
}

const INaturalistFilterContext = createContext<INaturalistFilterContextValue | null>(null);

export function INaturalistFilterProvider({ children }: { children: ReactNode }) {
  const [taxonCategory, setTaxonCategory] = useState('');

  const clearFilter = useCallback(() => setTaxonCategory(''), []);

  return (
    <INaturalistFilterContext.Provider value={{ taxonCategory, setTaxonCategory, clearFilter }}>
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
