// ============================================================================
// LayerRow — A single layer in the left sidebar with pin/eye interactions
// States: default, active, pinned-visible, pinned-hidden, active+pinned
// ============================================================================

import { Eye, EyeOff, Pin } from 'lucide-react';
import { useLayers } from '../../context/LayerContext';

interface LayerRowProps {
  layerId: string;
  name: string;
}

export function LayerRow({ layerId, name }: LayerRowProps) {
  const {
    activeLayer,
    activateLayer,
    isLayerPinned,
    isLayerVisible,
    pinLayer,
    unpinLayer,
    toggleVisibility,
    getPinnedByLayerId,
  } = useLayers();

  const isActive = activeLayer?.layerId === layerId;
  const isPinned = isLayerPinned(layerId);
  const isVisible = isLayerVisible(layerId);
  const pinned = getPinnedByLayerId(layerId);

  const handleClick = () => activateLayer(layerId);

  const handlePinClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isPinned && pinned) {
      unpinLayer(pinned.id);
    } else {
      pinLayer(layerId);
    }
  };

  const handleEyeClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (pinned) toggleVisibility(pinned.id);
  };

  // Active styling
  const activeClasses = isActive
    ? 'bg-emerald-50 border-l-2 border-emerald-600 font-semibold text-gray-900'
    : 'border-l-2 border-transparent text-gray-600 hover:bg-gray-50 hover:text-gray-900';

  // Muted text for hidden pinned layers
  const textMuted = isPinned && !isVisible && !isActive ? 'text-gray-400' : '';

  return (
    <div
      id={`layer-row-${layerId}`}
      role="treeitem"
      tabIndex={0}
      onClick={handleClick}
      onKeyDown={e => (e.key === 'Enter' || e.key === ' ') && handleClick()}
      className={`group flex items-center justify-between py-1.5 px-3 pl-9 cursor-pointer
                  text-sm rounded-sm transition-colors ${activeClasses} ${textMuted}`}
    >
      <span className="truncate flex-1">{name}</span>

      <div className="flex items-center gap-1.5 flex-shrink-0">
        {/* Eye icon — only for pinned layers */}
        {isPinned && (
          <button
            onClick={handleEyeClick}
            title={isVisible ? 'Hide on map' : 'Show on map'}
            className="p-0.5 rounded transition-colors"
          >
            {isVisible ? (
              <Eye className="w-4 h-4 text-blue-500 hover:text-blue-600" />
            ) : (
              <EyeOff className="w-4 h-4 text-gray-400 hover:text-gray-500" />
            )}
          </button>
        )}

        {/* Pin icon — solid when pinned, grayed on hover when not */}
        {isPinned ? (
          <button
            onClick={handlePinClick}
            title="Unpin layer"
            className="p-0.5 rounded transition-colors"
          >
            <Pin className="w-4 h-4 text-emerald-600 fill-emerald-600 hover:text-emerald-700" />
          </button>
        ) : (
          <button
            onClick={handlePinClick}
            title="Pin layer"
            className="p-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <Pin className="w-4 h-4 text-gray-300 hover:text-gray-500" />
          </button>
        )}
      </div>
    </div>
  );
}
