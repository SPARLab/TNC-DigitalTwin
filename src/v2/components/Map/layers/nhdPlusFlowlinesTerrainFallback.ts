import type FeatureLayer from '@arcgis/core/layers/FeatureLayer';
import type Graphic from '@arcgis/core/Graphic';
import * as reactiveUtils from '@arcgis/core/core/reactiveUtils';
import { fetchGroundElevations } from '../../../services/terrainService';
import {
  createNhdPlusFlowlineRenderer,
  NHDPLUS_MISSING_ELEVATION_WHERE,
} from './nhdPlusFlowlinesStyle';

const MAX_TERRAIN_SAMPLES = 200;

function samplePointFromGraphic(feature: Graphic): { longitude: number; latitude: number } | null {
  const center = feature.geometry?.extent?.center;
  if (!center) return null;
  const longitude = center.longitude ?? center.x;
  const latitude = center.latitude ?? center.y;
  if (!Number.isFinite(longitude) || !Number.isFinite(latitude)) return null;
  return { longitude, latitude };
}

function objectIdFromGraphic(feature: Graphic): string | null {
  const raw = feature.attributes?.objectid ?? feature.attributes?.OBJECTID;
  if (raw == null) return null;
  return String(raw);
}

async function fillMissingElevationsFromTerrain(
  layer: FeatureLayer,
  view: __esri.MapView | __esri.SceneView,
): Promise<void> {
  if (!view.extent) return;

  const result = await layer.queryFeatures({
    where: NHDPLUS_MISSING_ELEVATION_WHERE,
    geometry: view.extent,
    spatialRelationship: 'intersects',
    outFields: ['objectid'],
    returnGeometry: true,
    outSpatialReference: { wkid: 4326 },
    num: MAX_TERRAIN_SAMPLES,
  });

  const candidates = (result.features ?? []).flatMap((feature) => {
    const objectId = objectIdFromGraphic(feature);
    const point = samplePointFromGraphic(feature);
    if (!objectId || !point) return [];
    return [{ objectId, point }];
  });
  if (candidates.length === 0) return;

  const elevations = await fetchGroundElevations(candidates.map((candidate) => candidate.point));

  const sampledMetersByObjectId: Record<string, number> = {};
  candidates.forEach((candidate, index) => {
    const meters = elevations[index];
    if (meters == null || !Number.isFinite(meters)) return;
    sampledMetersByObjectId[candidate.objectId] = meters;
  });

  if (Object.keys(sampledMetersByObjectId).length === 0) return;
  layer.renderer = createNhdPlusFlowlineRenderer('3d', sampledMetersByObjectId);
}

/** Sample the preserve LiDAR DTM for reaches with no NHD elevation attributes. */
export function attachNhdPlusTerrainElevationFallback(layer: FeatureLayer): void {
  layer.on('layerview-create', (event) => {
    const view = event.view as __esri.MapView | __esri.SceneView | undefined;
    if (!view) return;
    void reactiveUtils.whenOnce(() => !event.layerView.updating)
      .then(() => fillMissingElevationsFromTerrain(layer, view))
      .catch((error) => {
        if (import.meta.env.DEV) {
          console.debug('[NHDPlus] Terrain elevation fallback failed', error);
        }
      });
  });
}
