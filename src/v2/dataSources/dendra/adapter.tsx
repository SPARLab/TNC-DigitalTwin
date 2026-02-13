// ============================================================================
// Dendra Data Source Adapter — Wires Dendra components into the plugin system.
// Handles all 10 per-type sensor services via a shared adapter.
//
// Unlike iNaturalist (single external layer), Dendra layers come from the
// dynamic Data Catalog (dataset-179 through dataset-189). The adapter's
// layerIds is empty — registration is dynamic via registerDendraLayerId.
// ============================================================================

import { useEffect } from 'react';
import { DendraProvider, useDendra } from '../../context/DendraContext';
import { DendraOverviewTab } from '../../components/RightSidebar/Dendra/DendraOverviewTab';
import { DendraBrowseTab } from '../../components/RightSidebar/Dendra/DendraBrowseTab';
import { DendraTimeSeriesPanel } from '../../components/FloatingWidgets/DendraTimeSeriesPanel/DendraTimeSeriesPanel';
import type { DataSourceAdapter, OverviewTabProps, CacheStatus } from '../types';

// ── Overview tab wrapper (warms cache on activation) ─────────────────────────

function DendraOverview({ onBrowseClick }: OverviewTabProps) {
  const { warmCache, dataLoaded, loading, stationCount, activeLayerTitle } = useDendra();

  // Warm cache when Dendra layer is first activated
  useEffect(() => { warmCache(); }, [warmCache]);

  return (
    <DendraOverviewTab
      stationCount={stationCount}
      loading={loading || !dataLoaded}
      layerTitle={activeLayerTitle}
      onBrowseClick={onBrowseClick}
    />
  );
}

// ── Cache status hook (used by useActiveCacheStatus in registry) ─────────────

export function useDendraCacheStatus(): CacheStatus {
  const { loading, dataLoaded, warmCache } = useDendra();
  return { loading, dataLoaded, warmCache };
}

// ── Adapter definition ───────────────────────────────────────────────────────

export const dendraAdapter: DataSourceAdapter = {
  id: 'dendra',
  layerIds: [], // Dynamic — registered at runtime via registerDendraLayerId
  OverviewTab: DendraOverview,
  BrowseTab: DendraBrowseTab,
  FloatingPanel: DendraTimeSeriesPanel,
  CacheProvider: DendraProvider,
};
