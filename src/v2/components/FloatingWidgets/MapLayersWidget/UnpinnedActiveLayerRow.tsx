// ============================================================================
// UnpinnedActiveLayerRow — the layer being viewed, when it isn't pinned yet.
// Sits at the top of the Map Layers list with the same amber highlight a pinned
// active layer gets, plus a Pin button to keep it. Shows the live iNaturalist /
// ANiML filter summary underneath, since those filters are not saved until pinned.
// ============================================================================

import { Eye, Pin } from 'lucide-react';
import type { ActiveLayer } from '../../../types';
import { useINaturalistFilter } from '../../../context/INaturalistFilterContext';
import { useAnimlFilter } from '../../../context/AnimlFilterContext';
import { TAXON_CONFIG } from '../../Map/layers/taxonConfig';
import { LayerRowLegend } from './LayerRowLegend';
import { EyeSlotLoadingSpinner } from '../../shared/loading/LoadingPrimitives';

interface UnpinnedActiveLayerRowProps {
  activeLayer: ActiveLayer;
  isLoading?: boolean;
  onPin: () => void;
}

export function UnpinnedActiveLayerRow({
  activeLayer,
  isLoading = false,
  onPin,
}: UnpinnedActiveLayerRowProps) {
  const isINat = activeLayer.layerId === 'inaturalist-obs';
  const isAniml = activeLayer.dataSource === 'animl';
  const {
    selectedTaxa,
    selectedSpecies,
    excludeAllSpecies,
    startDate: inatStartDate,
    endDate: inatEndDate,
    hasFilter,
  } = useINaturalistFilter();
  const {
    selectedAnimals,
    selectedCameras,
    startDate,
    endDate,
    deployments,
    hasAnyFilter,
  } = useAnimlFilter();

  const inatFilterDisplay = isINat && hasFilter
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
      parts.push(labels.length <= 2 ? labels.join(', ') : `${labels.length} species`);
    }
    if (selectedCameras.size > 0) {
      const names = Array.from(selectedCameras)
        .map(id => deployments.find(d => d.id === id)?.name || `CAM-${id}`)
        .filter(Boolean);
      parts.push(names.length <= 2 ? names.join(', ') : `${names.length} cameras`);
    }
    if (startDate || endDate) {
      parts.push(`${startDate || 'Any start'} to ${endDate || 'Any end'}`);
    }

    return parts.join(' • ');
  })();

  const filterDisplay = inatFilterDisplay || animlFilterDisplay;

  return (
    <div
      id="unpinned-active-layer-row"
      className="rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 shadow-sm"
    >
      <div className="flex items-center gap-1.5">
        {isLoading ? (
          <EyeSlotLoadingSpinner id="unpinned-active-layer-loading-spinner" className="flex-shrink-0" />
        ) : (
          <span className="flex-shrink-0 p-0.5" aria-hidden>
            <Eye className="h-4 w-4 text-gray-700" />
          </span>
        )}
        <span className="min-w-0 flex-1 break-words text-sm font-semibold leading-snug text-gray-900 line-clamp-2" title={activeLayer.name}>{activeLayer.name}</span>
        <button
          id="unpinned-active-layer-pin-button"
          type="button"
          onClick={onPin}
          className="flex-shrink-0 rounded p-0.5 text-amber-600 transition-colors hover:bg-amber-100 hover:text-amber-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
          title="Pin layer"
          aria-label={`Pin ${activeLayer.name}`}
        >
          <Pin className="h-3.5 w-3.5" />
        </button>
      </div>

      {filterDisplay && (
        <p className="mt-1.5 border-t border-amber-200 pt-1.5 text-xs leading-relaxed text-gray-700">
          {filterDisplay}
        </p>
      )}

      {/* Pulled out to the card edges so the legend's divider spans the row */}
      <div className="-mx-3 -mb-2 mt-1.5 empty:hidden">
        <LayerRowLegend layerId={activeLayer.layerId} isOnMap />
      </div>
    </div>
  );
}
