// ============================================================================
// Data Source Adapter Types — Plugin interface for adding new data sources.
// Each data source implements this interface to integrate with the map,
// right sidebar, and caching system without modifying core components.
//
// To add a new data source: implement DataSourceAdapter, create a
// useMapBehavior hook, then register both in registry.ts.
// ============================================================================

import type { ComponentType, ReactNode } from 'react';

/** Props shared by every data source's OverviewTab */
export interface OverviewTabProps {
  onBrowseClick: () => void;
}

/** Cache/loading status exposed by each data source */
export interface CacheStatus {
  loading: boolean;
  dataLoaded: boolean;
  /** Trigger data fetch. Idempotent — no-op if already loaded or in-flight. */
  warmCache: () => void;
}

/**
 * Data source adapter — defines how a data source plugs into the app.
 *
 * Core components (MapContainer, RightSidebar) read from the registry
 * instead of importing data-source-specific modules. This keeps core
 * files stable across branches — each new data source only touches its
 * own folder + one-line additions to registry.ts.
 */
export interface DataSourceAdapter {
  /** Unique key — matches the `dataSource` field in CatalogLayer */
  id: string;

  /** Catalog layer IDs this adapter manages (e.g., ['inaturalist-obs']) */
  layerIds: string[];

  /** Right sidebar Overview tab (receives only onBrowseClick; fetches own data via hooks) */
  OverviewTab: ComponentType<OverviewTabProps>;

  /** Right sidebar Browse tab (self-contained — uses own hooks/context) */
  BrowseTab: ComponentType;

  /** Floating legend widget — rendered only when this source is the active layer */
  LegendWidget?: ComponentType;

  /** Context provider for caching + filter state. Mounted at app level in V2App. */
  CacheProvider?: ComponentType<{ children: ReactNode }>;
}
