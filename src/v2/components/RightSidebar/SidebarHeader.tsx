// ============================================================================
// SidebarHeader — Data source icon + layer name + source badge + close [x]
// ============================================================================

import { X } from 'lucide-react';
import type { ActiveLayer } from '../../types';
import { LucideIcon } from '../shared/LucideIcon';
import { LAYER_MAP } from '../../data/layerRegistry';

interface SidebarHeaderProps {
  activeLayer: ActiveLayer;
  onClose: () => void;
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

export function SidebarHeader({ activeLayer, onClose }: SidebarHeaderProps) {
  const layer = LAYER_MAP.get(activeLayer.layerId);
  const iconName = layer?.icon ?? 'HelpCircle';
  const sourceLabel = DATA_SOURCE_LABELS[activeLayer.dataSource] ?? activeLayer.dataSource;

  return (
    <div id="right-sidebar-header" className="flex items-start gap-3 px-4 py-3 border-b border-gray-200">
      <LucideIcon name={iconName} className="w-8 h-8 text-gray-600 flex-shrink-0 mt-0.5" />
      <div className="flex-1 min-w-0">
        <h2 className="text-base font-semibold text-gray-900 truncate">{activeLayer.name}</h2>
        <p className="text-xs text-gray-400 mt-0.5">Source: via {sourceLabel}</p>
      </div>
      <button
        onClick={onClose}
        className="w-5 h-5 text-gray-400 hover:text-gray-600 cursor-pointer flex-shrink-0 mt-1"
        title="Close sidebar"
      >
        <X className="w-5 h-5" />
      </button>
    </div>
  );
}
