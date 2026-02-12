// ============================================================================
// iNaturalist Data Source Adapter — Wires existing iNaturalist components into
// the data source plugin system. Components stay in their original locations;
// this adapter provides glue so core files (MapContainer, RightSidebar) can
// render iNaturalist content without importing data-source-specific modules.
// ============================================================================

import { useEffect } from 'react';
import {
  INaturalistFilterProvider,
  useINaturalistFilter,
} from '../../context/INaturalistFilterContext';
import { INaturalistOverviewTab } from '../../components/RightSidebar/iNaturalist/INaturalistOverviewTab';
import { INaturalistBrowseTab } from '../../components/RightSidebar/iNaturalist/INaturalistBrowseTab';
import { INaturalistLegendWidget } from '../../components/FloatingWidgets/INaturalistLegendWidget/INaturalistLegendWidget';
import type { DataSourceAdapter, OverviewTabProps, CacheStatus } from '../types';

// ── Overview tab wrapper (warms cache + fetches data via context) ─────────────

function INatOverviewTab({ onBrowseClick }: OverviewTabProps) {
  const { warmCache, dataLoaded, loading, totalServiceCount } = useINaturalistFilter();

  // Warm cache when layer is first activated (lazy fetch trigger)
  useEffect(() => { warmCache(); }, [warmCache]);

  return (
    <INaturalistOverviewTab
      totalCount={totalServiceCount}
      loading={loading || !dataLoaded}
      onBrowseClick={onBrowseClick}
    />
  );
}

// ── Cache status hook (used by useActiveCacheStatus in registry) ─────────────

export function useINaturalistCacheStatus(): CacheStatus {
  const { loading, dataLoaded, warmCache } = useINaturalistFilter();
  return { loading, dataLoaded, warmCache };
}

// ── Adapter definition ───────────────────────────────────────────────────────

export const inaturalistAdapter: DataSourceAdapter = {
  id: 'inaturalist',
  layerIds: ['inaturalist-obs'],
  OverviewTab: INatOverviewTab,
  BrowseTab: INaturalistBrowseTab,
  LegendWidget: INaturalistLegendWidget,
  CacheProvider: INaturalistFilterProvider,
};
