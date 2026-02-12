// ============================================================================
// ANiML Data Source Adapter — Wires ANiML components into the data source
// plugin system. Components stay in their original locations; this adapter
// provides glue so core files can render ANiML content without importing
// data-source-specific modules.
// ============================================================================

import { useEffect } from 'react';
import {
  AnimlFilterProvider,
  useAnimlFilter,
} from '../../context/AnimlFilterContext';
import { AnimlOverviewTab } from '../../components/RightSidebar/ANiML/AnimlOverviewTab';
import { AnimlBrowseTab } from '../../components/RightSidebar/ANiML/AnimlBrowseTab';
import { AnimlLegendWidget } from '../../components/FloatingWidgets/AnimlLegendWidget/AnimlLegendWidget';
import type { DataSourceAdapter, OverviewTabProps, CacheStatus } from '../types';

// ── Overview tab wrapper (warms cache + fetches data via context) ─────────────

function AnimlOverviewTabWithCache({ onBrowseClick }: OverviewTabProps) {
  const { warmCache, dataLoaded, loading, deployments, totalImageCount } = useAnimlFilter();

  // Warm cache when layer is first activated (lazy fetch trigger)
  useEffect(() => { warmCache(); }, [warmCache]);

  return (
    <AnimlOverviewTab
      totalDeployments={deployments.length}
      totalImageCount={totalImageCount}
      loading={loading || !dataLoaded}
      onBrowseClick={onBrowseClick}
    />
  );
}

// ── Cache status hook (used by useActiveCacheStatus in registry) ─────────────

export function useAnimlCacheStatus(): CacheStatus {
  const { loading, dataLoaded, warmCache } = useAnimlFilter();
  return { loading, dataLoaded, warmCache };
}

// ── Adapter definition ───────────────────────────────────────────────────────

export const animlAdapter: DataSourceAdapter = {
  id: 'animl',
  layerIds: ['animl-camera-traps'],
  OverviewTab: AnimlOverviewTabWithCache,
  BrowseTab: AnimlBrowseTab,
  LegendWidget: AnimlLegendWidget,
  CacheProvider: AnimlFilterProvider,
};
