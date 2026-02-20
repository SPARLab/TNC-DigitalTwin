import { ChevronDown, ChevronRight } from 'lucide-react';
import type { KeyboardEvent as ReactKeyboardEvent } from 'react';
import type { CatalogLayer } from '../../types';
import { useLayers } from '../../context/LayerContext';
import { LayerRow } from './LayerRow';

interface ServiceGroupProps {
  service: CatalogLayer;
  layers: CatalogLayer[];
  isExpanded: boolean;
  ariaLevel?: number;
  onToggleExpand: () => void;
}

export function ServiceGroup({
  service,
  layers,
  isExpanded,
  ariaLevel = 2,
  onToggleExpand,
}: ServiceGroupProps) {
  const { activeLayer, activateLayer } = useLayers();
  const isActiveService = activeLayer?.layerId === service.id && !!activeLayer.isService;

  const handleHeaderClick = () => {
    const selectedSubLayerId = (() => {
      if (isActiveService) return activeLayer?.selectedSubLayerId;
      const activeLayerIsChildOfService = !!activeLayer && layers.some(layer => layer.id === activeLayer.layerId);
      if (activeLayerIsChildOfService) return activeLayer?.layerId;
      return layers[0]?.id;
    })();
    activateLayer(service.id, undefined, undefined, selectedSubLayerId);
    onToggleExpand();
  };

  const handleHeaderKeyDown = (event: ReactKeyboardEvent<HTMLButtonElement>) => {
    if (event.key === 'ArrowRight' && !isExpanded) {
      event.preventDefault();
      onToggleExpand();
      return;
    }
    if (event.key === 'ArrowLeft' && isExpanded) {
      event.preventDefault();
      onToggleExpand();
      return;
    }
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handleHeaderClick();
    }
  };

  return (
    <div id={`service-group-${service.id}`} role="group" className="space-y-1">
      <div
        id={`service-group-row-${service.id}`}
        className={`mx-1 min-w-0 flex items-center gap-2 py-1.5 px-1 rounded-lg border transition-colors
          ${
            isActiveService
              ? 'border-amber-300 bg-amber-50 shadow-sm'
              : isExpanded
              ? 'border-amber-300 bg-amber-50'
              : 'border-gray-200 bg-gray-50 hover:bg-gray-100 hover:border-gray-300'
          }`}
      >
        <button
          id={`service-group-header-${service.id}`}
          type="button"
          role="treeitem"
          aria-expanded={isExpanded}
          aria-level={ariaLevel}
          onClick={handleHeaderClick}
          onKeyDown={handleHeaderKeyDown}
          className="w-full min-w-0 flex items-center gap-2 py-1 px-2 text-sm text-gray-800 font-medium rounded-md"
        >
          {isExpanded ? (
            <ChevronDown id={`service-group-caret-${service.id}`} className="w-4 h-4 text-gray-600 flex-shrink-0" />
          ) : (
            <ChevronRight id={`service-group-caret-${service.id}`} className="w-4 h-4 text-gray-600 flex-shrink-0" />
          )}
          <span className="truncate flex-1 min-w-0 text-left">{service.name}</span>
          <span
            id={`service-group-count-${service.id}`}
            className="text-xs text-gray-600 bg-white border border-gray-200 rounded-full px-1.5 py-0.5 flex-shrink-0"
          >
            {layers.length}
          </span>
          <span
            id={`service-group-kind-${service.id}`}
            className="text-[10px] uppercase tracking-wide text-gray-500 rounded border border-gray-200 bg-white px-1.5 py-0.5 flex-shrink-0"
            title="Feature service container"
          >
            Service
          </span>
        </button>
      </div>

      <div
        id={`service-group-children-${service.id}`}
        role="group"
        className="grid transition-all duration-300 ease-out"
        style={{
          gridTemplateRows: isExpanded ? '1fr' : '0fr',
          opacity: isExpanded ? 1 : 0,
        }}
      >
        <div className="overflow-hidden">
          <div id={`service-group-children-inner-${service.id}`} className="pl-2 pr-1 space-y-1 pt-1">
            {layers.map(layer => (
              <LayerRow
                key={layer.id}
                layerId={layer.id}
                name={layer.name}
                indented
                ariaLevel={ariaLevel + 1}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
