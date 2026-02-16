import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import type { CatalogLayer } from '../types';
import { useCatalog } from './CatalogContext';
import { useLayers } from './LayerContext';
import { buildServiceUrl, fetchLayerSchema, type LayerSchema } from '../services/tncArcgisService';

interface TNCArcGISContextValue {
  schemas: Map<string, LayerSchema>;
  loading: boolean;
  dataLoaded: boolean;
  warmCache: () => void;
  loadSchema: (layer: CatalogLayer) => Promise<LayerSchema | null>;
  getSchema: (layerId: string) => LayerSchema | undefined;
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
  const [schemas, setSchemas] = useState<Map<string, LayerSchema>>(new Map());
  const [loadingByLayerId, setLoadingByLayerId] = useState<Set<string>>(new Set());

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
      return schema;
    } catch (error) {
      console.error('[TNCArcGIS] Failed to warm schema cache:', error);
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
    if (schemas.has(targetLayer.id) || loadingByLayerId.has(targetLayer.id)) return;
    void loadSchema(targetLayer);
  }, [targetLayer, schemas, loadingByLayerId, loadSchema]);

  const value = useMemo<TNCArcGISContextValue>(() => ({
    schemas,
    loading: !!targetLayerId && loadingByLayerId.has(targetLayerId),
    dataLoaded: !!targetLayerId && schemas.has(targetLayerId),
    warmCache,
    loadSchema,
    getSchema: (layerId: string) => schemas.get(layerId),
  }), [schemas, loadingByLayerId, targetLayerId, warmCache, loadSchema]);

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
