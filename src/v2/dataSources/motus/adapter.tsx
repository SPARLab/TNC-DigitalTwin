import { MOTUSBrowseTab } from '../../components/RightSidebar/MOTUS/MOTUSBrowseTab';
import { MOTUSOverviewTab } from '../../components/RightSidebar/MOTUS/MOTUSOverviewTab';
import type { CacheStatus, DataSourceAdapter, OverviewTabProps } from '../types';

const NOOP = () => {};

function MOTUSOverviewTabWithCache({ onBrowseClick }: OverviewTabProps) {
  return <MOTUSOverviewTab onBrowseClick={onBrowseClick} />;
}

export function useMotusCacheStatus(): CacheStatus {
  return {
    loading: false,
    dataLoaded: true,
    warmCache: NOOP,
  };
}

export const motusAdapter: DataSourceAdapter = {
  id: 'motus',
  layerIds: ['dataset-181', 'service-181', 'service-181-layer-0', 'service-181-layer-1', 'service-181-layer-2'],
  OverviewTab: MOTUSOverviewTabWithCache,
  BrowseTab: MOTUSBrowseTab,
};
