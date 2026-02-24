// ============================================================================
// ViewModeToggle — 2D / 3D toggle button floating over the map
// Position: bottom-left to avoid MapLayersWidget (top-left) and legends (bottom-right)
// ============================================================================

import { Globe, Map as MapIcon } from 'lucide-react';
import { useMap, type ViewMode } from '../../context/MapContext';

const labels: Record<ViewMode, { icon: typeof Globe; text: string; title: string }> = {
  '2d': { icon: Globe, text: '3D', title: 'Switch to 3D view' },
  '3d': { icon: MapIcon, text: '2D', title: 'Switch to 2D view' },
};

export function ViewModeToggle() {
  const { viewMode, toggleViewMode } = useMap();
  const { icon: Icon, text, title } = labels[viewMode];

  return (
    <button
      id="view-mode-toggle"
      type="button"
      onClick={toggleViewMode}
      title={title}
      className="absolute right-4 top-4 z-40 flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs font-semibold text-gray-700 shadow-lg transition-colors hover:bg-gray-50 active:bg-gray-100"
    >
      <Icon className="h-4 w-4" />
      {text}
    </button>
  );
}
