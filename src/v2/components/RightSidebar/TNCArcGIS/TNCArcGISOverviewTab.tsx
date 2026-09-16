import { useEffect, useMemo, useState, type MouseEvent as ReactMouseEvent } from 'react';
import { useCatalog } from '../../../context/CatalogContext';
import { useLayers } from '../../../context/LayerContext';
import { buildServiceUrl, fetchServiceDescription } from '../../../services/tncArcgisService';
import type { CatalogLayer } from '../../../types';
import { formatCatalogSourcePath } from '../../../utils/catalogSourceLabel';
import {
  OverviewContextCard,
  OverviewDescriptionSection,
  OverviewInspectAction,
  OverviewMetadataSection,
  OverviewOpacityControl,
  OverviewSourceOverlay,
  ServiceLayerListSection,
} from './TNCArcGISOverviewSections';

type LayerKind = 'feature' | 'map-image' | 'imagery' | null;
type SourceIframeStatus = 'idle' | 'loading' | 'ready' | 'blocked';

interface TNCArcGISOverviewTabProps {
  loading: boolean;
  isLayerRendering: boolean;
  renderPhase: 'idle' | 'fetching-data' | 'rendering-features' | 'updating-view';
  layerKind: LayerKind;
  onBrowseClick: () => void;
  onInspectBrowseClick?: () => void;
}

function getTargetLayer(activeLayer: CatalogLayer | undefined, selectedSubLayerId: string | undefined): CatalogLayer | null {
  if (!activeLayer) return null;
  const isServiceParent = !!(
    activeLayer.catalogMeta?.isMultiLayerService
    && !activeLayer.catalogMeta?.parentServiceId
    && activeLayer.catalogMeta?.siblingLayers
    && activeLayer.catalogMeta.siblingLayers.length > 0
  );

  if (!isServiceParent) return activeLayer;
  const siblings = activeLayer.catalogMeta?.siblingLayers ?? [];
  return siblings.find(layer => layer.id === selectedSubLayerId) ?? siblings[0] ?? null;
}

function getRenderStatusLabel(
  loading: boolean,
  isLayerRendering: boolean,
  renderPhase: 'idle' | 'fetching-data' | 'rendering-features' | 'updating-view',
  layerKind: LayerKind,
): string {
  if (loading) return 'Loading metadata...';
  if (!isLayerRendering) return 'Ready';
  const isImg = layerKind === 'imagery';
  if (renderPhase === 'fetching-data') return isImg ? 'Fetching imagery...' : 'Fetching features...';
  if (renderPhase === 'rendering-features') return 'Rendering features...';
  return 'Updating map view...';
}

export function TNCArcGISOverviewTab({
  loading,
  isLayerRendering,
  renderPhase,
  layerKind,
  onBrowseClick,
  onInspectBrowseClick,
}: TNCArcGISOverviewTabProps) {
  const {
    activeLayer,
    activateLayer,
    setActiveServiceSubLayer,
    isLayerPinned,
    isLayerVisible,
    getLayerOpacity,
    setLayerOpacity,
  } = useLayers();
  const { layerMap } = useCatalog();
  const [isSourceOverlayOpen, setIsSourceOverlayOpen] = useState(false);
  const [sourceIframeStatus, setSourceIframeStatus] = useState<SourceIframeStatus>('idle');
  const activeCatalogLayer = activeLayer ? layerMap.get(activeLayer.layerId) : undefined;
  const targetLayer = useMemo(
    () => getTargetLayer(activeCatalogLayer, activeLayer?.selectedSubLayerId),
    [activeCatalogLayer, activeLayer?.selectedSubLayerId],
  );
  const serviceContextLayer = useMemo(() => {
    if (!activeCatalogLayer) return undefined;
    if (activeCatalogLayer.catalogMeta?.isMultiLayerService && !activeCatalogLayer.catalogMeta?.parentServiceId) {
      return activeCatalogLayer;
    }
    const parentServiceId = activeCatalogLayer.catalogMeta?.parentServiceId;
    if (!parentServiceId) return activeCatalogLayer;
    return layerMap.get(parentServiceId) ?? activeCatalogLayer;
  }, [activeCatalogLayer, layerMap]);

  const siblingLayers = useMemo(
    () => serviceContextLayer?.catalogMeta?.siblingLayers ?? [],
    [serviceContextLayer],
  );
  const isUnifiedServiceWorkspace = siblingLayers.length > 0;

  const catalogDescription = serviceContextLayer?.catalogMeta?.description?.trim() || '';
  const [resolvedDescription, setResolvedDescription] = useState(catalogDescription);
  const description = resolvedDescription || 'No description available yet.';
  const featureServiceName = serviceContextLayer?.name || activeCatalogLayer?.name || 'Unknown service';
  const currentLayerName = targetLayer?.name || activeCatalogLayer?.name || 'Unknown layer';
  const sourceLabel = formatCatalogSourcePath(serviceContextLayer ?? targetLayer);
  const targetLayerCanPin = !!targetLayer;
  const sliderOpacityPercent = targetLayer ? Math.round(getLayerOpacity(targetLayer.id) * 100) : 100;
  const pinnedLayerCount = siblingLayers.filter(layer => isLayerPinned(layer.id)).length;
  const visibleLayerCount = siblingLayers.filter(layer => isLayerVisible(layer.id)).length;
  const sourceUrl = useMemo(() => {
    if (!targetLayer?.catalogMeta) return '';
    try {
      return buildServiceUrl(targetLayer.catalogMeta);
    } catch {
      return '';
    }
  }, [targetLayer?.catalogMeta]);
  const renderStatusLabel = getRenderStatusLabel(loading, isLayerRendering, renderPhase, layerKind);

  useEffect(() => {
    if (!isSourceOverlayOpen || !sourceUrl || sourceIframeStatus !== 'loading') return undefined;
    // CSP/X-Frame-Options failures often do not emit a reliable iframe error event.
    const timeoutId = window.setTimeout(() => {
      setSourceIframeStatus((currentStatus) => (
        currentStatus === 'loading' ? 'blocked' : currentStatus
      ));
    }, 4500);
    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [isSourceOverlayOpen, sourceUrl, sourceIframeStatus]);

  useEffect(() => {
    let cancelled = false;
    setResolvedDescription(catalogDescription);

    const serviceMeta = serviceContextLayer?.catalogMeta;
    if (!serviceMeta?.hasFeatureServer) return () => { cancelled = true; };

    fetchServiceDescription(serviceMeta)
      .then((serviceDescription) => {
        if (cancelled || !serviceDescription) return;
        setResolvedDescription(serviceDescription);
      })
      .catch(() => {
        // Keep catalog description fallback when metadata fetch fails.
      });

    return () => {
      cancelled = true;
    };
  }, [serviceContextLayer, catalogDescription]);

  const formatLayerLabel = (layerName: string, layerIdInService?: number) => (
    typeof layerIdInService === 'number'
      ? `${layerName} (Layer ${layerIdInService})`
      : layerName
  );

  const handleLayerListSelect = (layerId: string) => {
    if (activeLayer?.isService) {
      setActiveServiceSubLayer(layerId);
      return;
    }
    activateLayer(layerId);
  };
  const handleInspectLayer = (event: ReactMouseEvent, layerId: string) => {
    event.stopPropagation();
    handleLayerListSelect(layerId);
    if (onInspectBrowseClick) {
      onInspectBrowseClick();
      return;
    }
    onBrowseClick();
  };
  const handleOpenSourceOverlay = () => {
    if (!sourceUrl) return;
    setSourceIframeStatus('loading');
    setIsSourceOverlayOpen(true);
  };
  const handleCloseSourceOverlay = () => {
    setIsSourceOverlayOpen(false);
    setSourceIframeStatus('idle');
  };

  const handleInspectCurrentLayer = () => {
    if (onInspectBrowseClick) {
      onInspectBrowseClick();
      return;
    }
    onBrowseClick();
  };

  return (
    <div id="tnc-arcgis-overview-tab" className="flex min-h-full flex-col">
      <div className="flex min-h-0 flex-1 flex-col gap-5">
        <OverviewContextCard
          featureServiceName={featureServiceName}
          currentLayerName={currentLayerName}
          compactCurrentLayer={!isUnifiedServiceWorkspace}
        />

        <OverviewDescriptionSection description={description} />

        {isUnifiedServiceWorkspace && (
          <ServiceLayerListSection
            siblingLayers={siblingLayers}
            targetLayerId={targetLayer?.id}
            pinnedLayerCount={pinnedLayerCount}
            visibleLayerCount={visibleLayerCount}
            onLayerSelect={handleLayerListSelect}
            onInspectLayer={handleInspectLayer}
            formatLayerLabel={formatLayerLabel}
            isLayerVisible={isLayerVisible}
          />
        )}

        <OverviewMetadataSection
          sourceLabel={sourceLabel}
          renderStatusLabel={renderStatusLabel}
          sourceUrl={sourceUrl}
          onOpenOverlay={handleOpenSourceOverlay}
        />

        {targetLayerCanPin && (
          <OverviewOpacityControl
            sliderOpacityPercent={sliderOpacityPercent}
            onChangeOpacity={(nextPercent) => {
              if (!targetLayer) return;
              setLayerOpacity(targetLayer.id, nextPercent / 100);
            }}
          />
        )}
      </div>

      <div className="sticky bottom-0 z-10 -mx-4 mt-5 border-t border-gray-200 bg-white px-4 pt-3">
        <OverviewInspectAction
          isUnifiedServiceWorkspace={isUnifiedServiceWorkspace}
          onInspectCurrentLayer={handleInspectCurrentLayer}
        />
      </div>

      {isSourceOverlayOpen && sourceUrl && (
        <OverviewSourceOverlay
          sourceUrl={sourceUrl}
          sourceIframeStatus={sourceIframeStatus}
          onClose={handleCloseSourceOverlay}
          onLoad={() => setSourceIframeStatus('ready')}
          onError={() => setSourceIframeStatus('blocked')}
          onRetryEmbed={() => setSourceIframeStatus('loading')}
        />
      )}
    </div>
  );
}
