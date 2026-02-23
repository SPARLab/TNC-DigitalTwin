import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import * as reactiveUtils from '@arcgis/core/core/reactiveUtils';
import type { CatalogLayer } from '../types';
import { useCatalog } from './CatalogContext';
import { useLayers } from './LayerContext';
import { useMap } from './MapContext';
import { buildServiceUrl, fetchLayerSchema, type LayerSchema } from '../services/tncArcgisService';

type LayerKind = 'feature' | 'map-image' | 'imagery' | null;

interface TNCArcGISContextValue {
  schemas: Map<string, LayerSchema>;
  loading: boolean;
  dataLoaded: boolean;
  isLayerRendering: boolean;
  renderPhase: 'idle' | 'fetching-data' | 'rendering-features' | 'updating-view';
  layerKind: LayerKind;
  warmCache: () => void;
  loadSchema: (layer: CatalogLayer) => Promise<LayerSchema | null>;
  getSchema: (layerId: string) => LayerSchema | undefined;
  tableOverlayLayerId: string | null;
  isTableOverlayOpen: boolean;
  openTableOverlay: (layerId: string) => void;
  closeTableOverlay: () => void;
}

const TNCArcGISContext = createContext<TNCArcGISContextValue | null>(null);

function getTargetLayer(activeLayerId: string | null, layerMap: Map<string, CatalogLayer>): CatalogLayer | null {
  if (!activeLayerId) return null;
  const layer = layerMap.get(activeLayerId);
  if (!layer) return null;

  const isServiceParent = !!(
    layer.catalogMeta?.isMultiLayerService &&
    !layer.catalogMeta?.parentServiceId &&
    layer.catalogMeta?.siblingLayers &&
    layer.catalogMeta.siblingLayers.length > 0
  );

  if (!isServiceParent) return layer;
  return layer.catalogMeta?.siblingLayers?.[0] ?? null;
}

export function TNCArcGISProvider({ children }: { children: ReactNode }) {
  const { layerMap } = useCatalog();
  const { activeLayer } = useLayers();
  const { viewRef, mapReady } = useMap();
  const [schemas, setSchemas] = useState<Map<string, LayerSchema>>(new Map());
  const [loadingByLayerId, setLoadingByLayerId] = useState<Set<string>>(new Set());
  const [failedByLayerId, setFailedByLayerId] = useState<Set<string>>(new Set());
  const [tableOverlayLayerId, setTableOverlayLayerId] = useState<string | null>(null);
  const [isTableOverlayOpen, setIsTableOverlayOpen] = useState(false);
  const [isLayerRendering, setIsLayerRendering] = useState(false);
  const [renderPhase, setRenderPhase] = useState<'idle' | 'fetching-data' | 'rendering-features' | 'updating-view'>('idle');

  const activeLayerId = activeLayer?.dataSource === 'tnc-arcgis' ? activeLayer.layerId : null;
  const targetLayer = useMemo(
    () => getTargetLayer(activeLayerId, layerMap),
    [activeLayerId, layerMap],
  );
  const targetLayerId = targetLayer?.id;

  const loadSchema = useCallback(async (layer: CatalogLayer): Promise<LayerSchema | null> => {
    if (layer.dataSource !== 'tnc-arcgis' || !layer.catalogMeta) return null;
    if (schemas.has(layer.id)) return schemas.get(layer.id) ?? null;

    setLoadingByLayerId(prev => {
      const next = new Set(prev);
      next.add(layer.id);
      return next;
    });

    try {
      const serviceUrl = buildServiceUrl(layer.catalogMeta);
      const schema = await fetchLayerSchema(serviceUrl);
      setSchemas(prev => {
        const next = new Map(prev);
        next.set(layer.id, schema);
        return next;
      });
      setFailedByLayerId(prev => {
        if (!prev.has(layer.id)) return prev;
        const next = new Set(prev);
        next.delete(layer.id);
        return next;
      });
      return schema;
    } catch (error) {
      setFailedByLayerId(prev => {
        const next = new Set(prev);
        next.add(layer.id);
        return next;
      });
      const message = error instanceof Error ? error.message : String(error);
      if (/token required/i.test(message)) {
        console.warn('[TNCArcGIS] Schema warm skipped: ArcGIS token required for this layer.');
      } else {
        console.warn('[TNCArcGIS] Failed to warm schema cache:', error);
      }
      return null;
    } finally {
      setLoadingByLayerId(prev => {
        const next = new Set(prev);
        next.delete(layer.id);
        return next;
      });
    }
  }, [schemas]);

  const warmCache = useCallback(() => {
    if (!targetLayer || targetLayer.dataSource !== 'tnc-arcgis') return;
    if (failedByLayerId.has(targetLayer.id)) return;
    if (schemas.has(targetLayer.id) || loadingByLayerId.has(targetLayer.id)) return;
    void loadSchema(targetLayer);
  }, [targetLayer, schemas, loadingByLayerId, failedByLayerId, loadSchema]);

  // Derive the actual runtime layer type using the same priority as createTNCArcGISLayer.
  const runtimeLayerKind: 'feature' | 'map-image' | 'imagery' | null = useMemo(() => {
    const meta = targetLayer?.catalogMeta;
    if (!meta) return null;
    if (meta.hasFeatureServer) return 'feature';
    if (meta.hasMapServer) return 'map-image';
    if (meta.hasImageServer) return 'imagery';
    return null;
  }, [targetLayer]);

  const isImagery = runtimeLayerKind === 'imagery';

  // Track ArcGIS draw lifecycle for the currently targeted TNC layer.
  // Watches layerView.updating, FeatureLayerView.dataUpdating, and view.updating.
  useEffect(() => {
    const view = viewRef.current;
    if (!view || !targetLayerId) {
      setIsLayerRendering(false);
      setRenderPhase('idle');
      return undefined;
    }

    let disposed = false;
    let layerWatchHandle: { remove: () => void } | null = null;
    let viewWatchHandle: { remove: () => void } | null = null;
    let settleTimeoutId: ReturnType<typeof setTimeout> | null = null;
    let trackedLayerView: __esri.LayerView | null = null;
    let hasSeenBusySignal = false;
    const startedAtMs = Date.now();

    const quietWindowMs = 450;
    const initialHoldMs = 1200;
    const expectedLayerId = `v2-${targetLayerId}`;

    const clearSettleTimeout = () => {
      if (!settleTimeoutId) return;
      clearTimeout(settleTimeoutId);
      settleTimeoutId = null;
    };

    const readLayerBusy = (lv: __esri.LayerView | null): boolean => {
      if (!lv) return false;
      if (lv.updating) return true;
      if ('dataUpdating' in lv && (lv as __esri.FeatureLayerView).dataUpdating) return true;
      return false;
    };

    const syncRenderingState = () => {
      if (disposed) return;
      const layerUpdating = trackedLayerView?.updating === true;
      const dataUpdating = trackedLayerView && 'dataUpdating' in trackedLayerView
        ? (trackedLayerView as __esri.FeatureLayerView).dataUpdating === true
        : false;
      const viewUpdating = view.updating === true;
      const isBusy = layerUpdating || dataUpdating || viewUpdating;

      if (isBusy) {
        hasSeenBusySignal = true;
        clearSettleTimeout();
        setIsLayerRendering(true);
        if (dataUpdating) {
          setRenderPhase('fetching-data');
        } else if (layerUpdating) {
          setRenderPhase(isImagery ? 'fetching-data' : 'rendering-features');
        } else {
          setRenderPhase('updating-view');
        }
        return;
      }

      if (!hasSeenBusySignal) {
        const elapsedMs = Date.now() - startedAtMs;
        if (elapsedMs < initialHoldMs) {
          clearSettleTimeout();
          setIsLayerRendering(true);
          setRenderPhase('updating-view');
          settleTimeoutId = setTimeout(syncRenderingState, Math.min(250, initialHoldMs - elapsedMs));
          return;
        }
      }

      clearSettleTimeout();
      settleTimeoutId = setTimeout(() => {
        if (disposed) return;
        if (readLayerBusy(trackedLayerView) || view.updating) return;
        setIsLayerRendering(false);
        setRenderPhase('idle');
      }, quietWindowMs);
    };

    const attachLayerViewWatch = (layerView: __esri.LayerView) => {
      trackedLayerView = layerView;
      layerWatchHandle?.remove();

      const hasDataUpdating = 'dataUpdating' in layerView;

      layerWatchHandle = reactiveUtils.watch(
        () => [
          layerView.updating,
          hasDataUpdating
            ? (layerView as __esri.FeatureLayerView).dataUpdating
            : false,
        ],
        () => syncRenderingState(),
        { initial: true },
      );
    };

    const layerviewCreateHandle = view.on('layerview-create', (event) => {
      if (event.layer?.id !== expectedLayerId) return;
      attachLayerViewWatch(event.layerView);
    });

    const layerviewCreateErrorHandle = view.on('layerview-create-error', (event) => {
      if (event.layer?.id !== expectedLayerId) return;
      trackedLayerView = null;
      syncRenderingState();
    });

    viewWatchHandle = reactiveUtils.watch(
      () => view.updating,
      () => syncRenderingState(),
      { initial: true },
    );

    const existingLayer = view.map?.findLayerById(expectedLayerId);
    if (existingLayer) {
      void view.whenLayerView(existingLayer).then((layerView) => {
        if (disposed) return;
        attachLayerViewWatch(layerView);
      }).catch(() => {
        if (disposed) return;
        setIsLayerRendering(false);
        setRenderPhase('idle');
      });
    } else {
      setIsLayerRendering(true);
      setRenderPhase('updating-view');
    }

    return () => {
      disposed = true;
      clearSettleTimeout();
      layerWatchHandle?.remove();
      viewWatchHandle?.remove();
      layerviewCreateHandle.remove();
      layerviewCreateErrorHandle.remove();
    };
  }, [targetLayerId, isImagery, mapReady, viewRef]);

  const openTableOverlay = useCallback((layerId: string) => {
    if (!layerId) return;
    setTableOverlayLayerId(layerId);
    setIsTableOverlayOpen(true);
  }, []);

  const closeTableOverlay = useCallback(() => {
    setIsTableOverlayOpen(false);
  }, []);

  const value = useMemo<TNCArcGISContextValue>(() => ({
    schemas,
    loading: !!targetLayerId && loadingByLayerId.has(targetLayerId),
    dataLoaded: !!targetLayerId && (schemas.has(targetLayerId) || failedByLayerId.has(targetLayerId)),
    isLayerRendering,
    renderPhase,
    layerKind: runtimeLayerKind,
    warmCache,
    loadSchema,
    getSchema: (layerId: string) => schemas.get(layerId),
    tableOverlayLayerId,
    isTableOverlayOpen,
    openTableOverlay,
    closeTableOverlay,
  }), [
    schemas,
    loadingByLayerId,
    targetLayerId,
    failedByLayerId,
    isLayerRendering,
    renderPhase,
    runtimeLayerKind,
    warmCache,
    loadSchema,
    tableOverlayLayerId,
    isTableOverlayOpen,
    openTableOverlay,
    closeTableOverlay,
  ]);

  return (
    <TNCArcGISContext.Provider value={value}>
      {children}
    </TNCArcGISContext.Provider>
  );
}

export function useTNCArcGIS() {
  const ctx = useContext(TNCArcGISContext);
  if (!ctx) throw new Error('useTNCArcGIS must be used within TNCArcGISProvider');
  return ctx;
}
