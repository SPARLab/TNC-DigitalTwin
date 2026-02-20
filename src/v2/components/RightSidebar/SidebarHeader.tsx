// ============================================================================
// SidebarHeader — Data source icon + layer name + source badge + close [x]
// Yellow/amber header to coordinate with left sidebar active state
// Flash animation when active layer changes
// ============================================================================

import { PanelRightClose } from 'lucide-react';
import type { ActiveLayer } from '../../types';
import { LucideIcon } from '../shared/LucideIcon';
import { useCatalog } from '../../context/CatalogContext';

interface SidebarHeaderProps {
  activeLayer: ActiveLayer;
  onCollapse: () => void;
  shouldFlash?: boolean;
}

const DATA_SOURCE_LABELS: Record<string, string> = {
  'tnc-arcgis': 'TNC ArcGIS Hub',
  inaturalist: 'iNaturalist API',
  animl: 'ANiML API',
  dendra: 'Dendra API',
  dataone: 'DataOne API',
  ebird: 'eBird API',
  drone: 'Drone Imagery',
  lidar: 'LiDAR Scans',
};

export function SidebarHeader({
  activeLayer,
  onCollapse,
  shouldFlash = false,
}: SidebarHeaderProps) {
  const { layerMap } = useCatalog();
  const layer = layerMap.get(activeLayer.layerId);
  const iconName = layer?.icon ?? 'HelpCircle';
  const sourceLabel = DATA_SOURCE_LABELS[activeLayer.dataSource] ?? activeLayer.dataSource;

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
      <button
        id="right-sidebar-collapse-button"
        type="button"
        onClick={onCollapse}
        className="inline-flex h-8 items-center gap-1.5 rounded-md border border-amber-300 bg-white px-2.5 text-xs font-semibold text-amber-900 shadow-sm transition-colors hover:bg-amber-100"
        title="Collapse sidebar"
        aria-label="Collapse sidebar"
      >
        <PanelRightClose className="h-4 w-4" />
        <span>Collapse</span>
      </button>
    </div>
  );
}
