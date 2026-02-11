// ============================================================================
// INaturalistLegendWidget — Floating legend over map for taxon filtering
// Matches v1 app's MapLegend with collapsible header + taxon filter buttons.
// ============================================================================

import { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { TAXON_CONFIG, getTaxonEmoji, getTaxonColor } from '../../Map/layers/taxonConfig';
import { useINaturalistObservations } from '../../../hooks/useINaturalistObservations';
import { useINaturalistFilter } from '../../../context/INaturalistFilterContext';

export function INaturalistLegendWidget() {
  const [isExpanded, setIsExpanded] = useState(true);
  const { taxonCategory, setTaxonCategory } = useINaturalistFilter();

  // Fetch all observations (no skip) to get counts for legend
  const { allObservations, loading } = useINaturalistObservations({ skip: false });

  // Count observations per taxon
  const counts = new Map<string, number>();
  for (const obs of allObservations) {
    counts.set(obs.taxonCategory, (counts.get(obs.taxonCategory) ?? 0) + 1);
  }

  // Build legend groups (only taxa with observations, sorted by count desc)
  const groups = TAXON_CONFIG
    .map(t => ({ ...t, count: counts.get(t.value) ?? 0 }))
    .filter(t => t.count > 0)
    .sort((a, b) => b.count - a.count);

  if (loading || groups.length === 0) return null;

  const allVisible = !taxonCategory; // No filter = all visible

  return (
    <div
      id="inat-legend-widget"
      className="absolute bottom-6 right-6 bg-white rounded-lg shadow-lg border border-gray-300 z-30 w-72"
    >
      {/* Header */}
      <div
        id="inat-legend-header"
        className="flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-gray-50 rounded-t-lg"
      >
        <div className="flex items-center gap-2">
          <button
            id="inat-legend-expand-toggle"
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-0.5 hover:bg-gray-200 rounded transition-colors"
            aria-label={isExpanded ? 'Collapse legend' : 'Expand legend'}
          >
            {isExpanded ? (
              <ChevronDown className="w-4 h-4 text-gray-600" />
            ) : (
              <ChevronRight className="w-4 h-4 text-gray-600" />
            )}
          </button>
          <h3 className="text-sm font-semibold text-gray-900">Filter Observations</h3>
        </div>
        {!allVisible && (
          <button
            id="inat-legend-show-all"
            onClick={() => setTaxonCategory('')}
            className="text-xs text-blue-600 hover:text-blue-700 font-medium"
          >
            Show All
          </button>
        )}
      </div>

      {/* Content */}
      {isExpanded && (
        <div
          id="inat-legend-content"
          className="p-2 max-h-[32rem] overflow-y-auto space-y-1"
        >
          {groups.map(group => {
            const isActive = taxonCategory === group.value;
            const bgColor = isActive
              ? 'bg-blue-50 hover:bg-blue-100 border-blue-200'
              : 'bg-gray-50 hover:bg-gray-100 border-gray-200';

            return (
              <button
                key={group.value}
                id={`inat-legend-item-${group.value}`}
                onClick={() => setTaxonCategory(isActive ? '' : group.value)}
                className={`w-full flex items-center justify-between px-3 py-2 rounded border transition-all ${bgColor}`}
                title={`${isActive ? 'Show all' : 'Filter to'} ${group.label}`}
              >
                <div className="flex items-center gap-2">
                  <span
                    className="w-3 h-3 rounded-full flex-shrink-0"
                    style={{ backgroundColor: getTaxonColor(group.value) }}
                  />
                  <span className="text-base leading-none">{getTaxonEmoji(group.value)}</span>
                  <span className="text-sm text-gray-800">{group.label}</span>
                </div>
                <span className="text-xs text-gray-600">{group.count}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
