import { useEffect } from 'react';
import { DroneDeployProvider, useDroneDeploy } from '../../context/DroneDeployContext';
import { DroneBrowseTab } from '../../components/RightSidebar/DroneDeploy/DroneBrowseTab';
import { DroneOverviewTab } from '../../components/RightSidebar/DroneDeploy/DroneOverviewTab';
import type { CacheStatus, DataSourceAdapter, OverviewTabProps } from '../types';

function formatDate(date: Date): string {
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function DroneOverviewTabWithCache({ onBrowseClick }: OverviewTabProps) {
  const { warmCache, loading, projects, totalFlightCount, dateRangeStart, dateRangeEnd } = useDroneDeploy();

  useEffect(() => {
    warmCache();
  }, [warmCache]);

  const dateRangeLabel = dateRangeStart && dateRangeEnd
    ? `${formatDate(dateRangeStart)} - ${formatDate(dateRangeEnd)}`
    : 'No data loaded';

  return (
    <DroneOverviewTab
      loading={loading}
      totalProjects={projects.length}
      totalFlights={totalFlightCount}
      dateRangeLabel={dateRangeLabel}
      onBrowseClick={onBrowseClick}
    />
  );
}

export function useDroneDeployCacheStatus(): CacheStatus {
  const { loading, dataLoaded, warmCache } = useDroneDeploy();
  return { loading, dataLoaded, warmCache };
}

export const dronedeployAdapter: DataSourceAdapter = {
  id: 'drone',
  layerIds: ['dataset-193'],
  OverviewTab: DroneOverviewTabWithCache,
  BrowseTab: DroneBrowseTab,
  CacheProvider: DroneDeployProvider,
};
