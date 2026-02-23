import { useEffect } from 'react';
import { TNCArcGISOverviewTab } from '../../components/RightSidebar/TNCArcGIS/TNCArcGISOverviewTab';
import { TNCArcGISBrowseTab } from '../../components/RightSidebar/TNCArcGIS/TNCArcGISBrowseTab';
import { TNCArcGISLegendWidget } from '../../components/FloatingWidgets/TNCArcGISLegendWidget/TNCArcGISLegendWidget';
import { TNCArcGISTableOverlay } from '../../components/FloatingWidgets/TNCArcGISTableOverlay/TNCArcGISTableOverlay';
import { TNCArcGISProvider, useTNCArcGIS } from '../../context/TNCArcGISContext';
import type { CacheStatus, DataSourceAdapter, OverviewTabProps } from '../types';

function getTNCArcGISLoadingMessage(
  layerKind: 'feature' | 'map-image' | 'imagery' | null,
  renderPhase: 'idle' | 'fetching-data' | 'rendering-features' | 'updating-view',
): string {
  const isImagery = layerKind === 'imagery';
  if (renderPhase === 'fetching-data') return isImagery ? 'Fetching imagery...' : 'Fetching features...';
  if (renderPhase === 'rendering-features') return 'Rendering features...';
  return 'Updating map view...';
}

function TNCArcGISOverviewWithCache({ onBrowseClick }: OverviewTabProps) {
  const { warmCache, loading, dataLoaded, isLayerRendering, renderPhase, layerKind } = useTNCArcGIS();

  // Warm schema cache lazily when a TNC ArcGIS layer is activated.
  useEffect(() => { warmCache(); }, [warmCache]);

  return (
    <TNCArcGISOverviewTab
      loading={loading || !dataLoaded}
      isLayerRendering={isLayerRendering}
      renderPhase={renderPhase}
      layerKind={layerKind}
      onBrowseClick={onBrowseClick}
    />
  );
}

export function useTNCArcGISCacheStatus(): CacheStatus {
  const { loading, dataLoaded, warmCache, isLayerRendering, renderPhase, layerKind } = useTNCArcGIS();
  return {
    loading: loading || isLayerRendering,
    dataLoaded: dataLoaded && !isLayerRendering,
    loadingMessage: isLayerRendering ? getTNCArcGISLoadingMessage(layerKind, renderPhase) : undefined,
    warmCache,
  };
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
