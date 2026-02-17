// ============================================================================
// Data Source Registry — Central lookup for adapters and composite hooks.
//
// MERGE POINT: When adding a new data source, make these changes here:
//   1. Import the adapter + cache status hook + map behavior hook
//   2. Add adapter to ADAPTER_MAP
//   3. Add hook call to useAllMapBehaviors
//   4. Add hook call + case to useActiveCacheStatus
//
// Each addition is 1-2 lines — trivially auto-mergeable across branches.
// ============================================================================

import type Layer from '@arcgis/core/layers/Layer';
import type { PinnedLayer, ActiveLayer } from '../types';
import type { DataSourceAdapter, CacheStatus } from './types';

// ── Adapter imports (one line per data source) ───────────────────────────────

import { inaturalistAdapter, useINaturalistCacheStatus } from './inaturalist/adapter';
import { useINaturalistMapBehavior } from './inaturalist/useMapBehavior';
import { dendraAdapter, useDendraCacheStatus } from './dendra/adapter';
import { useDendraMapBehavior } from './dendra/useMapBehavior';
import { animlAdapter, useAnimlCacheStatus } from './animl/adapter';
import { useAnimlMapBehavior } from './animl/useMapBehavior';
import { tncArcgisAdapter, useTNCArcGISCacheStatus } from './tnc-arcgis/adapter';
import { useTNCArcGISMapBehavior } from './tnc-arcgis/useMapBehavior';
import { dataoneAdapter, useDataOneCacheStatus } from './dataone/adapter';
import { useDataOneMapBehavior } from './dataone/useMapBehavior';
import { dronedeployAdapter, useDroneDeployCacheStatus } from './dronedeploy/adapter';
import { useDroneDeployMapBehavior } from './dronedeploy/useMapBehavior';

// ── Adapter registry ─────────────────────────────────────────────────────────

const ADAPTER_MAP: Record<string, DataSourceAdapter> = {
  inaturalist: inaturalistAdapter,
  dendra: dendraAdapter,
  animl: animlAdapter,
  'tnc-arcgis': tncArcgisAdapter,
  dataone: dataoneAdapter,
  drone: dronedeployAdapter,
};

/** Look up a data source adapter by its dataSource key */
export function getAdapter(dataSource: string | undefined): DataSourceAdapter | null {
  if (!dataSource) return null;
  return ADAPTER_MAP[dataSource] ?? null;
}

/** Layer-specific adapter overrides for catalog datasets that map to custom UIs */
export function getAdapterForActiveLayer(activeLayer: ActiveLayer | null): DataSourceAdapter | null {
  if (!activeLayer) return null;
  if (activeLayer.layerId === 'dataset-193') return dronedeployAdapter;
  return getAdapter(activeLayer.dataSource);
}

// ── Composite hooks (always called unconditionally — React rules) ────────────

/**
 * Delegates map layer behavior to each data source's hook.
 * Must be called AFTER core useMapLayers effects so adapters can read
 * managed layers added in the same render cycle (declaration order = run order).
 */
export function useAllMapBehaviors(
  getManagedLayer: (_layerId: string) => Layer | undefined,
  pinnedLayers: PinnedLayer[],
  activeLayer: ActiveLayer | null,
  mapReady: number,
): void {
  useINaturalistMapBehavior(getManagedLayer, pinnedLayers, activeLayer, mapReady);
  useDendraMapBehavior(getManagedLayer, pinnedLayers, activeLayer, mapReady);
  useAnimlMapBehavior(getManagedLayer, pinnedLayers, activeLayer, mapReady);
  useTNCArcGISMapBehavior(getManagedLayer, pinnedLayers, activeLayer, mapReady);
  useDataOneMapBehavior(getManagedLayer, pinnedLayers, activeLayer, mapReady);
  useDroneDeployMapBehavior(getManagedLayer, pinnedLayers, activeLayer, mapReady);
}

/**
 * Returns cache/loading status for the specified data source.
 * All hooks are called unconditionally (React rules); only the matching
 * source's result is returned.
 */
export function useActiveCacheStatus(dataSource: string | undefined): CacheStatus | null {
  const inat = useINaturalistCacheStatus();
  const dendra = useDendraCacheStatus();
  const animl = useAnimlCacheStatus();
  const tncArcgis = useTNCArcGISCacheStatus();
  const dataone = useDataOneCacheStatus();
  const dronedeploy = useDroneDeployCacheStatus();

  switch (dataSource) {
    case 'inaturalist': return inat;
    case 'dendra': return dendra;
    case 'animl': return animl;
    case 'tnc-arcgis': return tncArcgis;
    case 'dataone': return dataone;
    case 'drone': return dronedeploy;
    default: return null;
  }
}

/**
 * Returns cache/loading status for all implemented data sources.
 * Used by shared UI (for example, Map Layers row-level loading indicators).
 */
export function useCacheStatusByDataSource(): Record<string, CacheStatus> {
  const inat = useINaturalistCacheStatus();
  const dendra = useDendraCacheStatus();
  const animl = useAnimlCacheStatus();
  const tncArcgis = useTNCArcGISCacheStatus();
  const dataone = useDataOneCacheStatus();
  const dronedeploy = useDroneDeployCacheStatus();

  return {
    inaturalist: inat,
    dendra,
    animl,
    'tnc-arcgis': tncArcgis,
    dataone,
    drone: dronedeploy,
  };
}
