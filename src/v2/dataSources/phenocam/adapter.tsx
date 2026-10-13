// ============================================================================
// PhenoCam Data Source Adapter
// ============================================================================

import { useEffect, useMemo } from 'react';
import { PhenoCamProvider, usePhenoCam } from '../../context/PhenoCamContext';
import { PhenoCamOverviewTab } from '../../components/RightSidebar/PhenoCam/PhenoCamOverviewTab';
import { PhenoCamBrowseTab } from '../../components/RightSidebar/PhenoCam/PhenoCamBrowseTab';
import { PhenoCamLegendWidget } from '../../components/FloatingWidgets/PhenoCamLegendWidget/PhenoCamLegendWidget';
import type { CacheStatus, DataSourceAdapter, OverviewTabProps } from '../types';

function PhenoCamOverviewWithCache({ onBrowseClick }: OverviewTabProps) {
  const { warmCache, dataLoaded, loading, cameras, latestImages } = usePhenoCam();

  useEffect(() => {
    warmCache();
  }, [warmCache]);

  const totalImageCount = useMemo(
    () => cameras.reduce((sum, camera) => sum + (camera.imageCount || 0), 0),
    [cameras],
  );

  return (
    <PhenoCamOverviewTab
      cameraCount={cameras.length}
      totalImageCount={totalImageCount}
      latestImages={latestImages}
      loading={loading || !dataLoaded}
      onBrowseClick={onBrowseClick}
    />
  );
}

export function usePhenoCamCacheStatus(): CacheStatus {
  const { loading, dataLoaded, warmCache } = usePhenoCam();
  return { loading, dataLoaded, warmCache };
}

export const phenocamAdapter: DataSourceAdapter = {
  id: 'phenocam',
  layerIds: [],
  OverviewTab: PhenoCamOverviewWithCache,
  BrowseTab: PhenoCamBrowseTab,
  LegendWidget: PhenoCamLegendWidget,
  CacheProvider: PhenoCamProvider,
  supportsPinnedFilters: false,
  browseTabLabel: 'Browse Images',
};
