import { useCallback } from 'react';
import { Plus, Minus, Compass } from 'lucide-react';
import { useMap } from '../../context/MapContext';
import LidarIcon from '../../../components/icons/LidarIcon';

const BTN =
  'map-control-btn flex items-center justify-center bg-white text-gray-700 hover:bg-gray-50 active:bg-gray-100 transition-colors';

export function MapControlRail() {
  const { viewRef, viewMode, toggleViewMode, isLidarVisible, toggleLidarVisibility } = useMap();

  const zoomIn = useCallback(() => {
    const view = viewRef.current;
    if (view) view.goTo({ zoom: view.zoom + 1 });
  }, [viewRef]);

  const zoomOut = useCallback(() => {
    const view = viewRef.current;
    if (view) view.goTo({ zoom: view.zoom - 1 });
  }, [viewRef]);

  const resetNorth = useCallback(() => {
    const view = viewRef.current;
    if (!view) return;
    if (view.type === '3d') {
      view.goTo({ heading: 0, tilt: view.camera?.tilt ?? 0 });
    } else {
      (view as __esri.MapView).rotation = 0;
    }
  }, [viewRef]);

  const is3D = viewMode === '3d';

  return (
    <div
      id="map-control-rail"
      className="absolute right-4 top-4 z-40 flex flex-col items-stretch gap-2"
    >
      {/* View mode */}
      <button
        id="view-mode-toggle"
        type="button"
        onClick={toggleViewMode}
        aria-label={is3D ? 'Switch to 2D view' : 'Switch to 3D view'}
        title={is3D ? 'Switch to 2D view' : 'Switch to 3D view'}
        className={`${BTN} text-[11px] font-bold tracking-wide`}
      >
        {is3D ? '2D' : '3D'}
      </button>

      {/* LiDAR — 3D only */}
      {is3D && (
        <button
          id="lidar-visibility-toggle"
          type="button"
          onClick={toggleLidarVisibility}
          aria-pressed={isLidarVisible}
          aria-label={isLidarVisible ? 'Hide LiDAR point cloud' : 'Show LiDAR point cloud'}
          title={isLidarVisible ? 'Hide LiDAR point cloud' : 'Show LiDAR point cloud'}
          className={`${BTN} ${isLidarVisible ? '!text-blue-600' : '!text-gray-400'}`}
        >
          <LidarIcon size={16} />
        </button>
      )}

      {/* Zoom */}
      <div id="map-zoom-group" className="flex flex-col">
        <button
          id="map-zoom-in"
          type="button"
          onClick={zoomIn}
          aria-label="Zoom in"
          title="Zoom in"
          className={`${BTN} rounded-b-none border-b-0`}
        >
          <Plus className="h-4 w-4" />
        </button>
        <button
          id="map-zoom-out"
          type="button"
          onClick={zoomOut}
          aria-label="Zoom out"
          title="Zoom out"
          className={`${BTN} rounded-t-none`}
        >
          <Minus className="h-4 w-4" />
        </button>
      </div>

      {/* Compass — reset north */}
      <button
        id="map-compass"
        type="button"
        onClick={resetNorth}
        aria-label="Reset north"
        title="Reset north"
        className={BTN}
      >
        <Compass className="h-4 w-4" />
      </button>
    </div>
  );
}
