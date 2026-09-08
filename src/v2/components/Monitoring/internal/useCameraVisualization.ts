// ============================================================================
// useCameraVisualization — keeps camera markers (and the selected viewshed)
// on the monitoring map, and reports which camera was clicked.
// ============================================================================

import { useEffect, useRef, useState } from 'react';
import Point from '@arcgis/core/geometry/Point';
import type MapView from '@arcgis/core/views/MapView';
import type SceneView from '@arcgis/core/views/SceneView';
import {
  createCameraMarkerLayer,
  createCameraViewshedLayer,
} from './cameraGraphicsLayer';
import type { ScreenPoint } from './cameraClustering';
import type { CameraStation, CameraViewshed } from '../../../services/cameraService';

interface UseCameraVisualizationParams {
  view: MapView | SceneView | null;
  cameras: CameraStation[] | null;
  viewsheds: CameraViewshed[] | null;
  selectedObjectId: number | null;
  onSelect: (objectId: number | null) => void;
  isEnabled: boolean;
  /** Bumps popup/preview image URLs when the snapshot is refreshed. */
  imageCacheKey: number;
}

function idsFromHit(hit: unknown): { objectIds: number[]; clusterCount: number } | null {
  if (!hit || typeof hit !== 'object') return null;
  const candidate = hit as {
    type?: string;
    graphic?: { attributes?: { objectIds?: unknown; objectId?: unknown; clusterCount?: unknown } };
  };
  if (candidate.type !== 'graphic') return null;

  const attributes = candidate.graphic?.attributes;
  const fromList = String(attributes?.objectIds ?? '')
    .split(',')
    .map(Number)
    .filter((id) => Number.isFinite(id));
  if (fromList.length > 0) {
    return { objectIds: fromList, clusterCount: Number(attributes?.clusterCount) || fromList.length };
  }

  const objectId = Number(attributes?.objectId);
  return Number.isFinite(objectId)
    ? { objectIds: [objectId], clusterCount: 1 }
    : null;
}

export function useCameraVisualization({
  view,
  cameras,
  viewsheds,
  selectedObjectId,
  onSelect,
  isEnabled,
  imageCacheKey,
}: UseCameraVisualizationParams) {
  const onSelectRef = useRef(onSelect);
  onSelectRef.current = onSelect;

  /**
   * Clustering is screen-space, so it has to rerun after the user finishes a
   * zoom. Incrementing this token rebuilds the marker layer without tearing
   * the view down.
   */
  const [scaleToken, setScaleToken] = useState(0);

  useEffect(() => {
    if (!view || view.destroyed) return;
    const handle = view.watch('stationary', (isStationary) => {
      if (isStationary) setScaleToken((token) => token + 1);
    });
    return () => handle.remove();
  }, [view]);

  useEffect(() => {
    if (!view || view.destroyed || !isEnabled || !cameras?.length) return;

    const screenOf = (point: { longitude: number; latitude: number }): ScreenPoint | null => {
      const screen = view.toScreen(
        new Point({ longitude: point.longitude, latitude: point.latitude }),
      );
      if (!screen) return null;
      return { x: screen.x, y: screen.y };
    };

    const viewshedLayer = createCameraViewshedLayer(viewsheds ?? [], selectedObjectId);
    const markerLayer = createCameraMarkerLayer(
      cameras,
      selectedObjectId,
      imageCacheKey,
      screenOf,
    );

    view.map?.add(viewshedLayer);
    view.map?.add(markerLayer);

    const clickHandle = view.on('click', async (event) => {
      try {
        const response = await view.hitTest(event, { include: [markerLayer, viewshedLayer] });
        const hit = response.results.map(idsFromHit).find((result) => result != null) ?? null;
        if (!hit) {
          onSelectRef.current(null);
          return;
        }

        onSelectRef.current(hit.objectIds[0]);

        if (hit.clusterCount > 1 && view.type === '2d') {
          const mapView = view as MapView;
          void mapView
            .goTo({ target: event.mapPoint, zoom: 17 }, { duration: 600 })
            .catch(() => undefined);
        }
      } catch (caught) {
        console.warn('[useCameraVisualization] hitTest failed:', caught);
      }
    });

    return () => {
      clickHandle.remove();
      if (!view.destroyed) {
        view.map?.remove(markerLayer);
        view.map?.remove(viewshedLayer);
      }
    };
  }, [view, cameras, viewsheds, selectedObjectId, isEnabled, imageCacheKey, scaleToken]);
}
