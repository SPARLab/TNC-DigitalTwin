// ============================================================================
// MonitoringScene — a SceneView used only by the 3D well-column mode.
//
// Kept separate from MonitoringMap rather than adding a toggle to it, because the
// 2D renderers cannot follow into a perspective camera: the interpolated surfaces
// are MediaLayer rasters and the wind particle overlay projects Web Mercator
// metres to pixels with an axis-aligned transform. Swapping the whole view is
// simpler and less fragile than making those two work in both.
//
// The terrain is a semi-transparent satellite drape over world elevation. A
// colorized point cloud was tried here and dropped: its points sit at the same
// height as the ground the columns pass through, so it read as noise across
// exactly the surface the eye needs to follow.
// ============================================================================

import { useEffect, useRef, useState } from 'react';
import ArcGISMap from '@arcgis/core/Map';
import SceneView from '@arcgis/core/views/SceneView';
import { Loader2 } from 'lucide-react';

const PRESERVE_CENTER: [number, number] = [-120.45, 34.52];

/**
 * Ground opacity. Low enough to see the columns below it, high enough that the
 * hill shading still reads as terrain.
 */
const GROUND_OPACITY = 0.42;

/**
 * Shared with the page's "zoom to stations" action, which has to restore a tilt
 * after framing an extent or the columns end up viewed end-on.
 */
export const SCENE_CAMERA_TILT = 62;

interface MonitoringSceneProps {
  onViewReady: (view: SceneView) => void;
  onViewDestroy?: () => void;
}

export function MonitoringScene({ onViewReady, onViewDestroy }: MonitoringSceneProps) {
  const mapDivRef = useRef<HTMLDivElement | null>(null);
  const [isReady, setIsReady] = useState(false);

  const onViewReadyRef = useRef(onViewReady);
  const onViewDestroyRef = useRef(onViewDestroy);
  onViewReadyRef.current = onViewReady;
  onViewDestroyRef.current = onViewDestroy;

  useEffect(() => {
    if (!mapDivRef.current) return;

    const map = new ArcGISMap({ basemap: 'satellite', ground: 'world-elevation' });

    // Without both of these the columns are hidden: an opaque ground occludes
    // anything beneath it, and the default constraint stops the camera from
    // descending below the surface to look along them.
    map.ground.opacity = GROUND_OPACITY;
    map.ground.navigationConstraint = { type: 'none' };

    const view = new SceneView({
      container: mapDivRef.current,
      map,
      camera: {
        position: { longitude: PRESERVE_CENTER[0], latitude: 34.44, z: 6500 },
        tilt: SCENE_CAMERA_TILT,
        heading: 0,
      },
      qualityProfile: 'high',
      ui: { components: ['zoom', 'attribution'] },
    });

    let isCancelled = false;

    view.when(() => {
      if (isCancelled) return;
      if (view.popup) view.popup.dockEnabled = false;
      setIsReady(true);
      onViewReadyRef.current(view);
    });

    const layerViewErrorHandle = view.on('layerview-create-error', (event) => {
      console.error(
        `[monitoring3d] layer view failed for "${event.layer?.title ?? 'untitled'}"`,
        event.error,
      );
    });

    return () => {
      isCancelled = true;
      layerViewErrorHandle.remove();
      onViewDestroyRef.current?.();
      view.destroy();
    };
  }, []);

  return (
    <div id="monitoring-scene-area" className="relative min-w-0 flex-1 bg-gray-100">
      <div ref={mapDivRef} className="absolute inset-0" />

      {!isReady && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-gray-100">
          <div className="flex items-center gap-2 text-xs font-medium text-gray-500">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading 3D scene
          </div>
        </div>
      )}
    </div>
  );
}
