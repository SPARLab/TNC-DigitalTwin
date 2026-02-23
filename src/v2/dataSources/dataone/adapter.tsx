// ============================================================================
// DataOne Data Source Adapter — Wires DataOne right-sidebar tabs into v2.
// ============================================================================

import { useEffect } from 'react';
import { DataOneFilterProvider, useDataOneFilter } from '../../context/DataOneFilterContext';
import { DataOneOverviewTab } from '../../components/RightSidebar/DataOne/DataOneOverviewTab';
import { DataOneBrowseTab } from '../../components/RightSidebar/DataOne/DataOneBrowseTab';
import type { CacheStatus, DataSourceAdapter, OverviewTabProps } from '../types';

function DataOneOverviewTabWithCache({ onBrowseClick }: OverviewTabProps) {
  const { warmCache, dataLoaded, loading, totalDatasetCount } = useDataOneFilter();

  useEffect(() => { warmCache(); }, [warmCache]);

  return (
    <DataOneOverviewTab
      totalCount={totalDatasetCount}
      loading={loading || !dataLoaded}
      onBrowseClick={onBrowseClick}
    />
  );
}

export function useDataOneCacheStatus(): CacheStatus {
  const { loading, mapLoading, dataLoaded, warmCache } = useDataOneFilter();
  // Match shared map-layers loading behavior: include background map marker refreshes.
  return { loading: loading || mapLoading, dataLoaded, warmCache };
}

export const dataoneAdapter: DataSourceAdapter = {
  id: 'dataone',
  layerIds: ['dataone-datasets'],
  OverviewTab: DataOneOverviewTabWithCache,
  BrowseTab: DataOneBrowseTab,
  CacheProvider: DataOneFilterProvider,
};
