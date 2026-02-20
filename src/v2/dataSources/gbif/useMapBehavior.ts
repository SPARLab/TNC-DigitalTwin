import { useEffect } from 'react';
import type Layer from '@arcgis/core/layers/Layer';
import type FeatureLayer from '@arcgis/core/layers/FeatureLayer';
import * as webMercatorUtils from '@arcgis/core/geometry/support/webMercatorUtils';
import type { ActiveLayer, PinnedLayer } from '../../types';
import { useGBIFFilter } from '../../context/GBIFFilterContext';
import { useLayers } from '../../context/LayerContext';
import { gbifService } from '../../../services/gbifService';
import { useMap } from '../../context/MapContext';

const LAYER_ID = 'dataset-178';
const MAP_LAYER_ID = 'v2-dataset-178';

type ClusterSizeConfig = {
  radius: string;
  minSize: string;
  maxSize: string;
};

function getClusterConfigForScale(scale: number): ClusterSizeConfig {
  // ArcGIS scale: larger number = farther zoomed out
  if (scale >= 1000000) return { radius: '180px', minSize: '34px', maxSize: '86px' };
  if (scale >= 500000) return { radius: '150px', minSize: '32px', maxSize: '78px' };
  if (scale >= 200000) return { radius: '124px', minSize: '30px', maxSize: '72px' };
  if (scale >= 80000) return { radius: '96px', minSize: '26px', maxSize: '64px' };
  if (scale >= 25000) return { radius: '72px', minSize: '24px', maxSize: '56px' };
  return { radius: '50px', minSize: '20px', maxSize: '46px' };
}

function applyClusterConfig(layer: FeatureLayer, config: ClusterSizeConfig): void {
  const reduction = layer.featureReduction;
  if (!reduction || reduction.type !== 'cluster') return;

  const clusterReduction = reduction as __esri.FeatureReductionCluster;
  if (
    clusterReduction.clusterRadius === config.radius &&
    clusterReduction.clusterMinSize === config.minSize &&
    clusterReduction.clusterMaxSize === config.maxSize
  ) {
    return;
  }

  clusterReduction.clusterRadius = config.radius;
  clusterReduction.clusterMinSize = config.minSize;
  clusterReduction.clusterMaxSize = config.maxSize;
}

function getSamplingModuloForScale(scale: number): number {
  // Coarser sampling when zoomed out keeps cluster rendering responsive at 300k+ records.
  if (scale >= 1000000) return 16;
  if (scale >= 500000) return 8;
  if (scale >= 200000) return 4;
  if (scale >= 80000) return 2;
  return 1;
}

function buildViewportWhereClause(view: __esri.MapView): string | null {
  const extent = view.extent?.clone();
  if (!extent) return null;

  const expanded = extent.expand(1.2);
  let geographicExtent: __esri.Extent = expanded;
  if (expanded.spatialReference?.isWebMercator) {
    const converted = webMercatorUtils.webMercatorToGeographic(expanded);
    if (converted?.type === 'extent') {
      geographicExtent = converted;
    }
  }

  const xmin = Number(geographicExtent.xmin);
  const xmax = Number(geographicExtent.xmax);
  const ymin = Number(geographicExtent.ymin);
  const ymax = Number(geographicExtent.ymax);

  if (![xmin, xmax, ymin, ymax].every(Number.isFinite)) return null;
  if (Math.abs(xmin) > 180 || Math.abs(xmax) > 180 || Math.abs(ymin) > 90 || Math.abs(ymax) > 90) {
    return null;
  }

  if (xmin >= xmax || ymin >= ymax) return null;

  const lonMin = Math.max(-180, xmin);
  const lonMax = Math.min(180, xmax);
  const latMin = Math.max(-90, ymin);
  const latMax = Math.min(90, ymax);
  if (lonMin >= lonMax || latMin >= latMax) return null;

  return `decimal_longitude BETWEEN ${lonMin.toFixed(6)} AND ${lonMax.toFixed(6)} AND decimal_latitude BETWEEN ${latMin.toFixed(6)} AND ${latMax.toFixed(6)}`;
}

function buildPerformanceWhereClause(params: {
  baseWhereClause: string;
  scale: number;
  viewportClause: string | null;
}): string {
  const { baseWhereClause, scale, viewportClause } = params;
  const clauses: string[] = [`(${baseWhereClause})`];
  if (viewportClause) clauses.push(`(${viewportClause})`);

  const modulo = getSamplingModuloForScale(scale);
  if (modulo > 1) clauses.push(`MOD(id, ${modulo}) = 0`);

  return clauses.join(' AND ');
}

export function useGBIFMapBehavior(
  getManagedLayer: (layerId: string) => Layer | undefined,
  pinnedLayers: PinnedLayer[],
  activeLayer: ActiveLayer | null,
  _mapReady: number,
) {
  const { browseFilters, warmCache } = useGBIFFilter();
  const { activateLayer } = useLayers();
  const { viewRef } = useMap();

  const isPinned = pinnedLayers.some((layer) => layer.layerId === LAYER_ID);
  const isActive = activeLayer?.layerId === LAYER_ID;
  const isOnMap = isPinned || isActive;

  useEffect(() => {
    if (isOnMap) warmCache();
  }, [isOnMap, warmCache]);

  useEffect(() => {
    if (!isOnMap) return;
    const layer = getManagedLayer(LAYER_ID) as FeatureLayer | undefined;
    if (!layer || typeof layer.definitionExpression !== 'string') return;

    const baseWhereClause = gbifService.buildWhereClause({
      searchText: browseFilters.searchText || undefined,
      kingdom: browseFilters.kingdom || undefined,
      taxonomicClass: browseFilters.taxonomicClass || undefined,
      family: browseFilters.family || undefined,
      basisOfRecord: browseFilters.basisOfRecord || undefined,
      datasetName: browseFilters.datasetName || undefined,
      startDate: browseFilters.startDate || undefined,
      endDate: browseFilters.endDate || undefined,
    });

    const updateDefinitionExpression = () => {
      const view = viewRef.current;
      const viewportClause = view ? buildViewportWhereClause(view) : null;
      const whereClause = buildPerformanceWhereClause({
        baseWhereClause,
        scale: view?.scale ?? Number.POSITIVE_INFINITY,
        viewportClause,
      });
      if (layer.definitionExpression !== whereClause) {
        layer.definitionExpression = whereClause;
      }
    };

    updateDefinitionExpression();
    const view = viewRef.current;
    if (!view) return;

    const stationaryHandle = view.watch('stationary', (isStationary) => {
      if (isStationary) updateDefinitionExpression();
    });

    return () => stationaryHandle.remove();
  }, [isOnMap, browseFilters, getManagedLayer, viewRef]);

  useEffect(() => {
    if (!isOnMap) return;
    const view = viewRef.current;
    const layer = getManagedLayer(LAYER_ID) as FeatureLayer | undefined;
    if (!view || !layer) return;

    let lastBucket = '';
    const updateFromScale = (scale: number) => {
      if (!Number.isFinite(scale)) return;
      const config = getClusterConfigForScale(scale);
      const bucket = `${config.radius}|${config.minSize}|${config.maxSize}`;
      if (bucket === lastBucket) return;
      lastBucket = bucket;
      applyClusterConfig(layer, config);
    };

    updateFromScale(view.scale);
    const handle = view.watch('scale', (scale) => updateFromScale(scale));
    return () => handle.remove();
  }, [isOnMap, getManagedLayer, viewRef]);

  useEffect(() => {
    if (!isOnMap) return;
    const view = viewRef.current;
    if (!view) return;

    const handler = view.on('click', async (event) => {
      try {
        const response = await view.hitTest(event);
        const graphicHit = response.results.find(
          (result): result is __esri.GraphicHit =>
            result.type === 'graphic' && result.graphic.layer?.id === MAP_LAYER_ID,
        );
        if (!graphicHit) return;

        const occurrenceId = graphicHit.graphic.attributes?.id as number | undefined;
        if (!occurrenceId) return;
        activateLayer(LAYER_ID, undefined, occurrenceId);
      } catch (error) {
        console.error('[GBIF Map Click] Failed to handle marker click', error);
      }
    });

    return () => handler.remove();
  }, [isOnMap, viewRef, activateLayer]);
}
