import { useEffect } from 'react';
import { CalFloraFilterProvider, useCalFloraFilter } from '../../context/CalFloraFilterContext';
import { CalFloraOverviewTab } from '../../components/RightSidebar/CalFlora/CalFloraOverviewTab';
import { CalFloraBrowseTab } from '../../components/RightSidebar/CalFlora/CalFloraBrowseTab';
import type { CacheStatus, DataSourceAdapter, OverviewTabProps } from '../types';

function CalFloraOverviewWithCache({ onBrowseClick }: OverviewTabProps) {
  const { warmCache, dataLoaded, loading, totalObservationCount } = useCalFloraFilter();

  useEffect(() => {
    warmCache();
  }, [warmCache]);

  return (
    <CalFloraOverviewTab
      totalCount={totalObservationCount}
      loading={loading || !dataLoaded}
      onBrowseClick={onBrowseClick}
    />
  );
}

export function useCalFloraCacheStatus(): CacheStatus {
  const { loading, dataLoaded, warmCache } = useCalFloraFilter();
  return { loading, dataLoaded, warmCache };
}

export const calfloraAdapter: DataSourceAdapter = {
  id: 'calflora',
  layerIds: ['calflora-observations'],
  OverviewTab: CalFloraOverviewWithCache,
  BrowseTab: CalFloraBrowseTab,
  CacheProvider: CalFloraFilterProvider,
};
