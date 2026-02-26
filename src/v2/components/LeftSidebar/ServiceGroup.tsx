import { ChevronDown, ChevronRight } from 'lucide-react';
import type { KeyboardEvent as ReactKeyboardEvent } from 'react';
import type { CatalogLayer } from '../../types';
import { useLayers } from '../../context/LayerContext';
import { LayerRow } from './LayerRow';

interface ServiceGroupProps {
  service: CatalogLayer;
  layers: CatalogLayer[];
  isExpanded: boolean;
  highlightQuery?: string;
  ariaLevel?: number;
  parentTreeItemId?: string;
  onAnnounce?: (message: string) => void;
  onToggleExpand: () => void;
}

function renderHighlightedText(text: string, query?: string) {
  if (!query || query.length < 2) return text;
  const lowerText = text.toLowerCase();
  const lowerQuery = query.toLowerCase();
  const matchStart = lowerText.indexOf(lowerQuery);
  if (matchStart === -1) return text;

  const matchEnd = matchStart + query.length;
  const before = text.slice(0, matchStart);
  const matched = text.slice(matchStart, matchEnd);
  const after = text.slice(matchEnd);

  return (
    <>
      {before}
      <mark className="bg-amber-200 text-inherit rounded px-0.5">{matched}</mark>
      {after}
    </>
  );
}

function focusFirstVisibleChildRow(childrenGroupId: string) {
  const group = document.getElementById(childrenGroupId);
  if (!group) return;

  const rows = Array.from(group.querySelectorAll<HTMLElement>('[data-left-sidebar-tree-row="true"]'));
  const firstVisible = rows.find((row) => row.offsetParent !== null);
  firstVisible?.focus();
}

export function ServiceGroup({
  service,
  layers,
  isExpanded,
  highlightQuery,
  ariaLevel = 2,
  parentTreeItemId,
  onAnnounce,
  onToggleExpand,
}: ServiceGroupProps) {
  const { activeLayer, activateLayer } = useLayers();
  const isActiveService = activeLayer?.layerId === service.id && !!activeLayer.isService;
  const childrenGroupId = `service-group-children-${service.id}`;

  const announceExpandState = (expanded: boolean) => {
    if (expanded) {
      onAnnounce?.(`${service.name} service expanded, ${layers.length} layers`);
      return;
    }
    onAnnounce?.(`${service.name} service collapsed`);
  };

  const handleHeaderClick = () => {
    // Prioritize toggle semantics so repeated clicks always expand/collapse.
    // Avoid re-activating on collapse, which can trigger auto-expand effects upstream.
    if (isExpanded) {
      onToggleExpand();
      announceExpandState(false);
      return;
    }

    const selectedSubLayerId = (() => {
      if (isActiveService) return activeLayer?.selectedSubLayerId;
      const activeLayerIsChildOfService = !!activeLayer && layers.some(layer => layer.id === activeLayer.layerId);
      if (activeLayerIsChildOfService) return activeLayer?.layerId;
      return layers[0]?.id;
    })();
    activateLayer(service.id, undefined, undefined, selectedSubLayerId);
    onToggleExpand();
    announceExpandState(true);
  };

  const handleHeaderKeyDown = (event: ReactKeyboardEvent<HTMLButtonElement>) => {
    if (event.key === 'ArrowRight' && !isExpanded) {
      event.preventDefault();
      onToggleExpand();
      announceExpandState(true);
      return;
    }
    if (event.key === 'ArrowRight' && isExpanded) {
      event.preventDefault();
      focusFirstVisibleChildRow(childrenGroupId);
      return;
    }
    if (event.key === 'ArrowLeft' && isExpanded) {
      event.preventDefault();
      onToggleExpand();
      announceExpandState(false);
      return;
    }
    if (event.key === 'ArrowLeft' && !isExpanded && parentTreeItemId) {
      event.preventDefault();
      document.getElementById(parentTreeItemId)?.focus();
      return;
    }
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handleHeaderClick();
    }
  };

  return (
    <div id={`service-group-${service.id}`} className="space-y-1">
      <div
        id={`service-group-row-${service.id}`}
        className={`mx-1 min-w-0 flex items-center gap-2 py-1.5 px-1 rounded-lg border transition-colors
          ${
            isActiveService
              ? 'border-amber-300 bg-amber-50 shadow-sm'
              : isExpanded
              ? 'border-amber-300 bg-amber-50'
              : 'border-slate-200 bg-slate-50 hover:bg-slate-100 hover:border-slate-300'
          }`}
      >
        <button
          id={`service-group-header-${service.id}`}
          type="button"
          role="treeitem"
          aria-expanded={isExpanded}
          aria-controls={childrenGroupId}
          aria-level={ariaLevel}
          data-left-sidebar-tree-row="true"
          onClick={handleHeaderClick}
          onKeyDown={handleHeaderKeyDown}
          className="w-full min-w-0 flex items-center gap-2 py-1 px-2 text-sm text-gray-800 font-medium rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-1"
        >
          {isExpanded ? (
            <ChevronDown id={`service-group-caret-${service.id}`} className="w-4 h-4 text-gray-600 flex-shrink-0" />
          ) : (
            <ChevronRight id={`service-group-caret-${service.id}`} className="w-4 h-4 text-gray-600 flex-shrink-0" />
          )}
          <span className="truncate flex-1 min-w-0 text-left">
            {renderHighlightedText(service.name, highlightQuery)}
          </span>
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
        id={childrenGroupId}
        role="group"
        className="grid transition-all duration-300 ease-out"
        style={{
          gridTemplateRows: isExpanded ? '1fr' : '0fr',
          opacity: isExpanded ? 1 : 0,
        }}
      >
        <div className="overflow-hidden">
          <div id={`service-group-children-inner-${service.id}`} className="pl-2 pr-1 space-y-1 pt-1 bg-white">
            {layers.map(layer => (
              <LayerRow
                key={layer.id}
                layerId={layer.id}
                name={layer.name}
                indented
                ariaLevel={ariaLevel + 1}
                parentTreeItemId={`service-group-header-${service.id}`}
                onAnnounce={onAnnounce}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
