import { useEffect } from 'react';
import { MOTUSBrowseTab } from '../../components/RightSidebar/MOTUS/MOTUSBrowseTab';
import { MOTUSOverviewTab } from '../../components/RightSidebar/MOTUS/MOTUSOverviewTab';
import { MOTUSLegendWidget } from '../../components/FloatingWidgets/MOTUSLegendWidget/MOTUSLegendWidget';
import { MotusFilterProvider, useMotusFilter } from '../../context/MotusFilterContext';
import type { CacheStatus, DataSourceAdapter, OverviewTabProps } from '../types';

const NOOP = () => {};

function MOTUSOverviewTabWithCache({ onBrowseClick }: OverviewTabProps) {
  const { warmCache } = useMotusFilter();
  useEffect(() => {
    warmCache();
  }, [warmCache]);
  return <MOTUSOverviewTab onBrowseClick={onBrowseClick} />;
}

export function useMotusCacheStatus(): CacheStatus {
  const { loading, dataLoaded, warmCache } = useMotusFilter();
  return {
    loading,
    dataLoaded,
    warmCache: warmCache ?? NOOP,
  };
}

export const motusAdapter: DataSourceAdapter = {
  id: 'motus',
  layerIds: ['dataset-181', 'service-181', 'service-181-layer-0', 'service-181-layer-1', 'service-181-layer-2'],
  OverviewTab: MOTUSOverviewTabWithCache,
  BrowseTab: MOTUSBrowseTab,
  LegendWidget: MOTUSLegendWidget,
  CacheProvider: MotusFilterProvider,
};
