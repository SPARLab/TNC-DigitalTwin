// ============================================================================
// TaxonLegend — Emoji + color indicators for iNaturalist taxon categories
// Shows a compact 2-column grid of taxon groups with counts from loaded data.
// Clicking a taxon group sets the filter (acts as visual filter shortcut).
// ============================================================================

import { TAXON_CONFIG, getTaxonEmoji, getTaxonColor } from '../../Map/layers/taxonConfig';
import type { INatObservation } from '../../../hooks/useINaturalistObservations';

interface TaxonLegendProps {
  observations: INatObservation[];
  activeTaxon: string;
  onTaxonClick: (taxon: string) => void;
}

export function TaxonLegend({ observations, activeTaxon, onTaxonClick }: TaxonLegendProps) {
  // Count observations per taxon category
  const counts = new Map<string, number>();
  for (const obs of observations) {
    counts.set(obs.taxonCategory, (counts.get(obs.taxonCategory) ?? 0) + 1);
  }

  // Show only taxon groups that have observations, sorted by count desc
  const groups = TAXON_CONFIG
    .map(t => ({ ...t, count: counts.get(t.value) ?? 0 }))
    .filter(t => t.count > 0)
    .sort((a, b) => b.count - a.count);

  if (groups.length === 0) return null;

  return (
    <div id="inat-taxon-legend" className="grid grid-cols-2 gap-x-2 gap-y-1">
      {groups.map(group => {
        const isActive = activeTaxon === group.value;
        return (
          <button
            key={group.value}
            id={`taxon-legend-${group.value}`}
            onClick={() => onTaxonClick(isActive ? '' : group.value)}
            className={`flex items-center gap-1.5 px-1.5 py-1 rounded text-left transition-colors text-xs
              ${isActive
                ? 'bg-emerald-50 ring-1 ring-emerald-200 font-medium'
                : 'hover:bg-gray-50'
              }`}
            title={`${group.label} (${group.count}) — click to filter`}
          >
            <span
              className="w-3 h-3 rounded-full flex-shrink-0 flex items-center justify-center text-[8px] leading-none"
              style={{ backgroundColor: getTaxonColor(group.value) }}
              aria-hidden="true"
            />
            <span className="text-[10px]">{getTaxonEmoji(group.value)}</span>
            <span className="truncate text-gray-700">{group.label}</span>
            <span className="text-gray-400 ml-auto flex-shrink-0">{group.count}</span>
          </button>
        );
      })}
    </div>
  );
}
