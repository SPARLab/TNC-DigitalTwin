// ============================================================================
// MonitoringMap — a standalone MapView for the Live Monitoring page.
//
// Deliberately separate from the catalog's map: monitoring has no 2D/3D toggle,
// LiDAR, sketch tools, or catalog layer plumbing, and the particle overlay needs
// a north-up Web Mercator view to project onto.
// ============================================================================

import { useEffect, useRef, useState } from 'react';
import ArcGISMap from '@arcgis/core/Map';
import MapView from '@arcgis/core/views/MapView';
import { Loader2 } from 'lucide-react';

const PRESERVE_CENTER: [number, number] = [-120.45, 34.49];
const INITIAL_ZOOM = 12;

interface MonitoringMapProps {
  /** Called once the view is usable. Layers are added by the page, not here. */
  onViewReady: (view: MapView) => void;
  /** Called before the view is destroyed so owners can tear down overlays. */
  onViewDestroy?: () => void;
}

export function MonitoringMap({ onViewReady, onViewDestroy }: MonitoringMapProps) {
  const mapDivRef = useRef<HTMLDivElement | null>(null);
  const [isReady, setIsReady] = useState(false);

  // Held in refs so changing callback identities never rebuilds the view.
  const onViewReadyRef = useRef(onViewReady);
  const onViewDestroyRef = useRef(onViewDestroy);
  onViewReadyRef.current = onViewReady;
  onViewDestroyRef.current = onViewDestroy;

  useEffect(() => {
    if (!mapDivRef.current) return;

    const view = new MapView({
      container: mapDivRef.current,
      map: new ArcGISMap({ basemap: 'satellite' }),
      center: PRESERVE_CENTER,
      zoom: INITIAL_ZOOM,
      ui: { components: ['zoom', 'attribution'] },
      // The particle overlay maps Mercator metres to pixels with an axis-aligned
      // transform, which only holds while the view stays north-up.
      constraints: { rotationEnabled: false },
    });

    let isCancelled = false;

    view.when(() => {
      if (isCancelled) return;
      if (view.popup) view.popup.dockEnabled = false;
      setIsReady(true);
      onViewReadyRef.current(view);
    });

    // Layer views fail silently: the SDK emits this and swallows the cause, so a
    // layer that never draws leaves no trace in the console without it.
    const layerViewErrorHandle = view.on('layerview-create-error', (event) => {
      console.error(
        `[monitoring] layer view failed for "${event.layer?.title ?? 'untitled'}"`,
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
    <div id="monitoring-map-area" className="relative min-w-0 flex-1 bg-gray-100">
      <div ref={mapDivRef} className="absolute inset-0" />

      {!isReady && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-gray-100">
          <div className="flex items-center gap-2 text-xs font-medium text-gray-500">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading map
          </div>
        </div>
      )}
    </div>
  );
}
