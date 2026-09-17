// ============================================================================
// ServiceGroup — Multi-layer feature service in the left sidebar.
// Matches the DroneDeploy Orthomosaics pattern: caret on the right, expandable
// panel with a layers/tables summary, then selectable child rows.
// ============================================================================

import { ChevronDown, ChevronRight } from 'lucide-react';
import type { KeyboardEvent as ReactKeyboardEvent, MouseEvent as ReactMouseEvent } from 'react';
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

function formatServiceSummary(layerCount: number, tableCount: number): string {
  const layerLabel = `${layerCount} ${layerCount === 1 ? 'layer' : 'layers'}`;
  if (tableCount <= 0) return layerLabel;
  const tableLabel = `${tableCount} ${tableCount === 1 ? 'table' : 'tables'}`;
  return `${layerLabel}, ${tableLabel}`;
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
  const tableCount = service.catalogMeta?.tableCount ?? 0;
  const summaryText = formatServiceSummary(layers.length, tableCount);

  const announceExpandState = (expanded: boolean) => {
    if (expanded) {
      onAnnounce?.(`${service.name} expanded, ${summaryText}`);
      return;
    }
    onAnnounce?.(`${service.name} collapsed`);
  };

  const activateService = () => {
    const selectedSubLayerId = (() => {
      if (isActiveService) return activeLayer?.selectedSubLayerId;
      const activeLayerIsChildOfService = !!activeLayer && layers.some((layer) => layer.id === activeLayer.layerId);
      if (activeLayerIsChildOfService) return activeLayer?.layerId;
      return layers[0]?.id;
    })();
    activateLayer(service.id, undefined, undefined, selectedSubLayerId);
  };

  const handleRowClick = () => {
    // Collapse without re-activating — otherwise CategoryGroup's auto-expand
    // effect immediately opens the group again when a sublayer is selected.
    if (isExpanded) {
      onToggleExpand();
      announceExpandState(false);
      return;
    }
    activateService();
    onToggleExpand();
    announceExpandState(true);
  };

  const handleExpandToggle = (event: ReactMouseEvent) => {
    event.stopPropagation();
    // Allow collapsing even when a sublayer is active. Activating first would
    // change activeLayer and re-trigger CategoryGroup's auto-expand effect.
    if (isExpanded) {
      onToggleExpand();
      announceExpandState(false);
      return;
    }
    activateService();
    onToggleExpand();
    announceExpandState(true);
  };

  const handleHeaderKeyDown = (event: ReactKeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'ArrowRight' && !isExpanded) {
      event.preventDefault();
      activateService();
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
      handleRowClick();
    }
  };

  return (
    <div id={`service-group-${service.id}`} className="space-y-1">
      <div
        id={`service-group-row-${service.id}`}
        role="treeitem"
        aria-expanded={isExpanded}
        aria-controls={childrenGroupId}
        aria-level={ariaLevel}
        aria-current={isActiveService ? 'true' : undefined}
        data-left-sidebar-tree-row="true"
        tabIndex={0}
        onClick={handleRowClick}
        onKeyDown={handleHeaderKeyDown}
        className={`group min-w-0 flex items-center gap-1.5 py-2 px-3 ml-1 mr-1 cursor-pointer
                    text-sm rounded-lg transition-all duration-200
                    focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-1
                    ${
                      isActiveService
                        ? 'bg-amber-50 border border-amber-300 font-semibold text-gray-900 shadow-sm'
                        : isExpanded
                          ? 'bg-amber-50/70 border border-amber-200 text-gray-900'
                          : 'bg-white border border-gray-200 text-gray-700 hover:border-gray-400 hover:shadow-sm'
                    }`}
      >
        <span className={`truncate min-w-0 flex-1 text-left ${isActiveService ? 'font-semibold' : ''}`}>
          {renderHighlightedText(service.name, highlightQuery)}
        </span>

        <button
          id={`service-group-expand-toggle-${service.id}`}
          type="button"
          onClick={handleExpandToggle}
          title={isExpanded ? 'Collapse service layers' : 'Expand service layers'}
          className="flex-shrink-0 p-0.5 rounded hover:bg-gray-100 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
          aria-expanded={isExpanded}
          aria-controls={childrenGroupId}
        >
          {isExpanded ? (
            <ChevronDown className="w-4 h-4 text-gray-600" />
          ) : (
            <ChevronRight className="w-4 h-4 text-gray-600" />
          )}
        </button>
      </div>

      <div
        id={childrenGroupId}
        role="group"
        className={`ml-2 mr-1 border border-slate-200 rounded-lg bg-slate-50/50 transition-all duration-300 ease-in-out ${
          isExpanded
            ? 'max-h-[min(600px,70vh)] opacity-100 mb-2 overflow-y-auto'
            : 'max-h-0 opacity-0 mb-0 border-transparent overflow-hidden'
        }`}
      >
        <div
          id={`service-group-summary-${service.id}`}
          className="px-3 pt-2 pb-1 text-[11px] text-gray-600 border-b border-slate-200"
        >
          {summaryText}
        </div>
        <div id={`service-group-children-inner-${service.id}`} className="py-1 space-y-1">
          {layers.map((layer) => (
            <LayerRow
              key={layer.id}
              layerId={layer.id}
              name={layer.name}
              indented
              ariaLevel={ariaLevel + 1}
              parentTreeItemId={`service-group-row-${service.id}`}
              onAnnounce={onAnnounce}
              highlightQuery={highlightQuery}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
