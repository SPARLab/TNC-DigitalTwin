import { useEffect } from 'react';
import { TNCArcGISOverviewTab } from '../../components/RightSidebar/TNCArcGIS/TNCArcGISOverviewTab';
import { TNCArcGISBrowseTab } from '../../components/RightSidebar/TNCArcGIS/TNCArcGISBrowseTab';
import { TNCArcGISLegendWidget } from '../../components/FloatingWidgets/TNCArcGISLegendWidget/TNCArcGISLegendWidget';
import { TNCArcGISTableOverlay } from '../../components/FloatingWidgets/TNCArcGISTableOverlay/TNCArcGISTableOverlay';
import { TNCArcGISProvider, useTNCArcGIS } from '../../context/TNCArcGISContext';
import type { CacheStatus, DataSourceAdapter, OverviewTabProps } from '../types';

function TNCArcGISOverviewWithCache({ onBrowseClick }: OverviewTabProps) {
  const { warmCache, loading, dataLoaded } = useTNCArcGIS();

  // Warm schema cache lazily when a TNC ArcGIS layer is activated.
  useEffect(() => { warmCache(); }, [warmCache]);

  return (
    <TNCArcGISOverviewTab
      loading={loading || !dataLoaded}
      onBrowseClick={onBrowseClick}
    />
  );
}

export function useTNCArcGISCacheStatus(): CacheStatus {
  const { loading, dataLoaded, warmCache } = useTNCArcGIS();
  return { loading, dataLoaded, warmCache };
}

export const tncArcgisAdapter: DataSourceAdapter = {
  id: 'tnc-arcgis',
  layerIds: [], // Dynamic catalog layers (dataset-*)
  OverviewTab: TNCArcGISOverviewWithCache,
  BrowseTab: TNCArcGISBrowseTab,
  LegendWidget: TNCArcGISLegendWidget,
  FloatingPanel: TNCArcGISTableOverlay,
  CacheProvider: TNCArcGISProvider,
};
