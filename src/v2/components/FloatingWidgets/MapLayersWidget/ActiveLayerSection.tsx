// ============================================================================
// ActiveLayerSection — Amber-accented section for the currently active layer
// Shows eye icon + layer name + [Pin] button + live filter state (for iNaturalist)
// Hidden when active layer is already pinned (DFT-001)
// ============================================================================

import { Eye, Pin } from 'lucide-react';
import type { ActiveLayer } from '../../../types';
import { useINaturalistFilter } from '../../../context/INaturalistFilterContext';
import { useAnimlFilter } from '../../../context/AnimlFilterContext';
import { TAXON_CONFIG } from '../../Map/layers/taxonConfig';
import { EyeSlotLoadingSpinner } from '../../shared/loading/LoadingPrimitives';

interface ActiveLayerSectionProps {
  activeLayer: ActiveLayer;
  isLoading?: boolean;
  onPin: () => void;
  canPin?: boolean;
}

export function ActiveLayerSection({
  activeLayer,
  isLoading = false,
  onPin,
  canPin = true,
}: ActiveLayerSectionProps) {
  // Don't show if already pinned — it'll appear in the Pinned section instead
  if (activeLayer.isPinned) return null;

  const isINat = activeLayer.layerId === 'inaturalist-obs';
  const isAniml = activeLayer.layerId === 'animl-camera-traps';
  const { selectedTaxa, selectedSpecies, excludeAllSpecies, startDate: inatStartDate, endDate: inatEndDate, hasFilter } = useINaturalistFilter();
  const {
    selectedAnimals,
    selectedCameras,
    startDate,
    endDate,
    deployments,
    hasAnyFilter,
  } = useAnimlFilter();

  // Build filter display for iNaturalist
  const filterDisplay = isINat && hasFilter
    ? (() => {
        const taxaText = Array.from(selectedTaxa)
          .map(taxon => TAXON_CONFIG.find(t => t.value === taxon)?.label ?? taxon)
          .join(', ');
        const speciesText = excludeAllSpecies ? 'No species selected' : Array.from(selectedSpecies).join(', ');
        const dateText = (inatStartDate || inatEndDate) ? `${inatStartDate || 'Any start'} to ${inatEndDate || 'Any end'}` : '';
        return [taxaText, speciesText, dateText].filter(Boolean).join(' • ');
      })()
    : null;

  const animlFilterDisplay = (() => {
    if (!isAniml || !hasAnyFilter) return null;

    const parts: string[] = [];
    if (selectedAnimals.size > 0) {
      const labels = Array.from(selectedAnimals);
      const speciesText = labels.length <= 2 ? labels.join(', ') : `${labels.length} species`;
      parts.push(speciesText);
    }
    if (selectedCameras.size > 0) {
      const names = Array.from(selectedCameras)
        .map(id => deployments.find(d => d.id === id)?.name || `CAM-${id}`)
        .filter(Boolean);
      const cameraText = names.length <= 2
        ? names.join(', ')
        : `${names.length} cameras`;
      parts.push(cameraText);
    }
    if (startDate || endDate) {
      parts.push(`${startDate || 'Any start'} to ${endDate || 'Any end'}`);
    }

    return parts.join(' • ');
  })();

  const activeFilterDisplay = filterDisplay || animlFilterDisplay;

  return (
    <div 
      id="active-layer-section"
    >
      {/* Section header */}
      <div className="px-3 py-1.5 bg-amber-50 border-b border-amber-200 flex items-center gap-1">
        <Eye className="w-3 h-3 text-amber-700" />
        <span className="text-[10px] font-semibold text-amber-700 uppercase tracking-wide">
          Active Layer
        </span>
      </div>

      {/* Active layer row */}
      <div className="px-3 py-2.5 bg-amber-50/50">
        <div className="flex items-center gap-2 mb-1">
          {isLoading ? (
            <EyeSlotLoadingSpinner id="active-layer-loading-spinner" className="flex-shrink-0" />
          ) : (
            <Eye className="w-4 h-4 text-amber-600 flex-shrink-0" />
          )}
          <span className="text-sm text-gray-800 font-medium flex-1 truncate">
            {activeLayer.name}
          </span>
          {canPin ? (
            <button
              id="active-layer-pin-button"
              onClick={onPin}
              className="flex items-center gap-1 px-2 py-1 bg-white border border-amber-300 rounded-md
                         text-amber-700 hover:bg-amber-100 hover:border-amber-400 transition-colors
                         text-[11px] font-medium"
              title="Pin this layer"
            >
              <Pin className="w-3.5 h-3.5" />
              Pin
            </button>
          ) : (
            <span
              id="active-layer-service-hint"
              className="px-2 py-1 text-[10px] font-medium uppercase tracking-wide text-gray-600 bg-white border border-gray-300 rounded-md"
              title="Service selected; choose a child layer to pin"
            >
              Service
            </span>
          )}
        </div>

        {/* Live filter display */}
        {activeFilterDisplay && (
          <div className="mt-2 pt-2 border-t border-amber-200">
            <span className="text-[10px] font-semibold text-amber-700 uppercase tracking-wide">
              Active Filters
            </span>
            <p className="text-xs text-gray-700 mt-1 leading-relaxed">
              {activeFilterDisplay}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
