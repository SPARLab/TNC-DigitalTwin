// ============================================================================
// CatalogContext — Provides the dynamic Data Catalog registry to all
// components. Wraps useCatalogRegistry and exposes categories, layerMap,
// and loading/error state.
//
// Mount <CatalogProvider> above LayerProvider in V2App so that
// LayerContext can read the dynamic layer map.
// ============================================================================

import { createContext, useContext, type ReactNode } from 'react';
import { useCatalogRegistry, type CatalogRegistryState } from '../hooks/useCatalogRegistry';
import type { Category, CatalogLayer } from '../types';

interface CatalogContextValue {
  categories: Category[];
  layerMap: Map<string, CatalogLayer>;
  loading: boolean;
  error: string | null;
}

const CatalogContext = createContext<CatalogContextValue | null>(null);

export function CatalogProvider({ children }: { children: ReactNode }) {
  const registry: CatalogRegistryState = useCatalogRegistry();

  return (
    <CatalogContext.Provider value={registry}>
      {children}
    </CatalogContext.Provider>
  );
}

export function useCatalog(): CatalogContextValue {
  const ctx = useContext(CatalogContext);
  if (!ctx) throw new Error('useCatalog must be used within CatalogProvider');
  return ctx;
}
