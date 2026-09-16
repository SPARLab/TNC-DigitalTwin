// ============================================================================
// SidebarHeader — Data source icon + layer name + source badge
// Yellow/amber header to coordinate with left sidebar active state
// Flash animation when active layer changes
// ============================================================================

import type { ActiveLayer } from '../../types';
import { LucideIcon } from '../shared/LucideIcon';
import { useCatalog } from '../../context/CatalogContext';
import { formatCatalogSourceLabel } from '../../utils/catalogSourceLabel';

interface SidebarHeaderProps {
  activeLayer: ActiveLayer;
  shouldFlash?: boolean;
}

export function SidebarHeader({
  activeLayer,
  shouldFlash = false,
}: SidebarHeaderProps) {
  const { layerMap } = useCatalog();
  const layer = layerMap.get(activeLayer.layerId);
  const iconName = layer?.icon ?? 'HelpCircle';
  const sourceLabel = formatCatalogSourceLabel(layer, activeLayer.dataSource);

  // Yellow/amber background to coordinate with left sidebar active state
  // Flash animation when active layer changes
  const headerClasses = `flex items-start gap-3 px-4 py-3 border-b bg-amber-50 border-amber-200 ${
    shouldFlash ? 'animate-header-flash' : ''
  }`;

  return (
    <div id="right-sidebar-header" className={headerClasses}>
      <LucideIcon name={iconName} className="w-8 h-8 text-gray-700 flex-shrink-0 mt-0.5" />
      <div className="flex-1 min-w-0">
        <h2 className="text-base font-semibold text-gray-900 truncate">{activeLayer.name}</h2>
        <p className="text-xs text-gray-500 mt-0.5">Source: via {sourceLabel}</p>
      </div>
    </div>
  );
}
