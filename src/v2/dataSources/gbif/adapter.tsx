import { useEffect } from 'react';
import { GBIFFilterProvider, useGBIFFilter } from '../../context/GBIFFilterContext';
import { GBIFOverviewTab } from '../../components/RightSidebar/GBIF/GBIFOverviewTab';
import { GBIFBrowseTab } from '../../components/RightSidebar/GBIF/GBIFBrowseTab';
import type { CacheStatus, DataSourceAdapter, OverviewTabProps } from '../types';

function GBIFOverviewWithCache({ onBrowseClick }: OverviewTabProps) {
  const { warmCache, dataLoaded, loading, totalOccurrenceCount } = useGBIFFilter();

  useEffect(() => {
    warmCache();
  }, [warmCache]);

  return (
    <GBIFOverviewTab
      totalCount={totalOccurrenceCount}
      loading={loading || !dataLoaded}
      onBrowseClick={onBrowseClick}
    />
  );
}

export function useGBIFCacheStatus(): CacheStatus {
  const { loading, dataLoaded, warmCache } = useGBIFFilter();
  return { loading, dataLoaded, warmCache };
}

export const gbifAdapter: DataSourceAdapter = {
  id: 'gbif',
  layerIds: ['dataset-178'],
  OverviewTab: GBIFOverviewWithCache,
  BrowseTab: GBIFBrowseTab,
  CacheProvider: GBIFFilterProvider,
};
