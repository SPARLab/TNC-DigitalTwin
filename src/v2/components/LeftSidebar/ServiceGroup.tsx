import { ChevronDown, ChevronRight } from 'lucide-react';
import type { KeyboardEvent as ReactKeyboardEvent } from 'react';
import type { CatalogLayer } from '../../types';
import { LayerRow } from './LayerRow';

interface ServiceGroupProps {
  service: CatalogLayer;
  layers: CatalogLayer[];
  isExpanded: boolean;
  isActiveService?: boolean;
  ariaLevel?: number;
  onToggleExpand: () => void;
  onActivateService: () => void;
}

export function ServiceGroup({
  service,
  layers,
  isExpanded,
  isActiveService = false,
  ariaLevel = 2,
  onToggleExpand,
  onActivateService,
}: ServiceGroupProps) {
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
      onActivateService();
    }
  };

  return (
    <div id={`service-group-${service.id}`} role="group" className="space-y-1">
      <div
        id={`service-group-row-${service.id}`}
        className={`w-full flex items-center gap-2 py-1.5 px-1 rounded-lg border transition-colors
          ${
            isActiveService
              ? 'border-amber-300 bg-amber-50'
              : 'border-gray-200 bg-gray-50 hover:bg-gray-100 hover:border-gray-300'
          }`}
      >
        <button
          id={`service-group-header-${service.id}`}
          role="treeitem"
          aria-expanded={isExpanded}
          aria-level={ariaLevel}
          onClick={onActivateService}
          onKeyDown={handleHeaderKeyDown}
          className="flex items-center gap-2 flex-1 py-1 px-2 text-sm text-gray-800 font-medium rounded-md"
        >
          <span className="truncate flex-1 text-left">{service.name}</span>
          <span
            id={`service-group-count-${service.id}`}
            className="text-xs text-gray-600 bg-white border border-gray-200 rounded-full px-1.5 py-0.5"
          >
            ({layers.length})
          </span>
        </button>
        <button
          id={`service-group-toggle-${service.id}`}
          type="button"
          onClick={event => {
            event.stopPropagation();
            onToggleExpand();
          }}
          className="p-1 rounded-md hover:bg-white transition-colors"
          aria-label={`${isExpanded ? 'Collapse' : 'Expand'} ${service.name}`}
        >
          {isExpanded ? (
            <ChevronDown className="w-4 h-4 text-gray-600" />
          ) : (
            <ChevronRight className="w-4 h-4 text-gray-600" />
          )}
        </button>
      </div>

      <div
        id={`service-group-children-${service.id}`}
        role="group"
        className="overflow-hidden transition-all duration-300 ease-out"
        style={{
          maxHeight: isExpanded ? `${layers.length * 56}px` : '0px',
          opacity: isExpanded ? 1 : 0,
        }}
      >
        <div id={`service-group-children-inner-${service.id}`} className="pl-4 space-y-1 pt-1">
          {layers.map(layer => (
            <LayerRow
              key={layer.id}
              layerId={layer.id}
              name={layer.name}
              controlsOnly
              indented
              ariaLevel={ariaLevel + 1}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
