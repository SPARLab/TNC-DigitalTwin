// ============================================================================
// LayerRow — A single layer in the left sidebar with pin/eye interactions
// States: default, active, pinned-visible, pinned-hidden, active+pinned
// ============================================================================

import type { MouseEvent as ReactMouseEvent } from 'react';
import { Eye, EyeOff, Pin } from 'lucide-react';
import { useLayers } from '../../context/LayerContext';

interface LayerRowProps {
  layerId: string;
  name: string;
  ariaLevel?: number;
  controlsOnly?: boolean;
  indented?: boolean;
}

export function LayerRow({
  layerId,
  name,
  ariaLevel = 2,
  controlsOnly = false,
  indented = false,
}: LayerRowProps) {
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

  const isActive = !controlsOnly && activeLayer?.layerId === layerId;
  const isPinned = isLayerPinned(layerId);
  const isVisible = isLayerVisible(layerId);
  const pinned = getPinnedByLayerId(layerId);

  const handleClick = () => {
    if (controlsOnly) return;
    activateLayer(layerId);
  };

  const handlePinClick = (e: ReactMouseEvent) => {
    e.stopPropagation();
    if (isPinned && pinned) {
      unpinLayer(pinned.id);
    } else {
      pinLayer(layerId);
    }
  };

  const handleEyeClick = (e: ReactMouseEvent) => {
    e.stopPropagation();
    if (pinned) toggleVisibility(pinned.id);
  };

  // Active styling: yellow/amber background to match Map Layers widget
  const activeClasses = controlsOnly
    ? 'bg-white border border-gray-200 hover:border-gray-300 hover:shadow-sm'
    : isActive
      ? 'bg-amber-50 border border-amber-300 font-semibold text-gray-900 shadow-sm'
      : 'bg-white border border-gray-200 hover:border-gray-300 hover:shadow-sm';

  // Text color based on visibility and active state
  const textColor = isPinned && !isVisible && !isActive 
    ? 'text-gray-400' 
    : isActive 
      ? 'text-gray-900' 
      : 'text-gray-700';

  return (
    <div
      id={`layer-row-${layerId}`}
      role="treeitem"
      aria-level={ariaLevel}
      tabIndex={controlsOnly ? -1 : 0}
      onClick={handleClick}
      onKeyDown={e => (e.key === 'Enter' || e.key === ' ') && handleClick()}
      className={`w-full group flex items-center gap-1.5 py-2 px-3 ml-1 mr-1 cursor-pointer
                  text-sm rounded-lg transition-all duration-200 ${indented ? 'ml-4' : 'ml-1'} ${activeClasses}
                  ${controlsOnly ? 'cursor-default' : 'cursor-pointer'}`}
    >
      {/* Eye icon — only for pinned layers */}
      {isPinned && (
        <button
          id={`layer-eye-${layerId}`}
          onClick={handleEyeClick}
          title={isVisible ? 'Hide on map' : 'Show on map'}
          className="flex-shrink-0 p-0.5 rounded hover:bg-gray-100 transition-colors"
        >
          {isVisible ? (
            <Eye className="w-4 h-4 text-gray-700" />
          ) : (
            <EyeOff className="w-4 h-4 text-gray-300" />
          )}
        </button>
      )}

      {/* Layer name */}
      <span className={`truncate flex-1 ${textColor} ${isActive ? 'font-semibold' : ''}`}>
        {name}
      </span>

      {/* Pin icon — blue when pinned (matching Pinned Layers section), gray on hover when not */}
      {isPinned ? (
        <button
          id={`layer-unpin-${layerId}`}
          onClick={handlePinClick}
          title="Unpin layer"
          className="flex-shrink-0 p-0.5 rounded transition-colors"
        >
          <Pin className="w-4 h-4 text-blue-500 fill-blue-500 hover:text-blue-600 hover:fill-blue-600" />
        </button>
      ) : (
        <button
          id={`layer-pin-${layerId}`}
          onClick={handlePinClick}
          title="Pin layer"
          className="flex-shrink-0 p-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <Pin className="w-4 h-4 text-gray-300 hover:text-gray-500" />
        </button>
      )}
    </div>
  );
}
