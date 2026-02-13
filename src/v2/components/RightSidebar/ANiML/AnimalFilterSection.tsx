// ============================================================================
// AnimalFilterSection — Shared species checkbox filter used in both browse modes
// Animal-first: rendered at top of browse tab (primary filter)
// Camera-first: rendered inside CameraDetailView (secondary filter)
// Syncs with AnimlFilterContext (legend widget + map also read this state).
// ============================================================================

import type { AnimlAnimalTag, AnimlCountLookups } from '../../../../services/animlService';

interface AnimalFilterSectionProps {
  animalTags: AnimlAnimalTag[];
  selectedAnimals: Set<string>;
  hasFilter: boolean;
  toggleAnimal: (label: string) => void;
  selectAll: () => void;
  /** When set, shows per-camera counts instead of global counts */
  countLookups?: AnimlCountLookups | null;
  deploymentId?: number;
  /** Compact variant omits the tip text */
  compact?: boolean;
}

export function AnimalFilterSection({
  animalTags,
  selectedAnimals,
  hasFilter,
  toggleAnimal,
  selectAll,
  countLookups,
  deploymentId,
  compact = false,
}: AnimalFilterSectionProps) {
  /** Resolve display count: per-camera if deploymentId given, else global. */
  function getCount(tag: AnimlAnimalTag): string {
    if (deploymentId != null && countLookups) {
      const key = `${deploymentId}:${tag.label}`;
      const count = countLookups.countsByDeploymentAndLabel.get(key) ?? 0;
      return count.toLocaleString();
    }
    return tag.totalObservations.toLocaleString();
  }

  return (
    <div id="animl-filter-section" className="bg-slate-50 rounded-lg p-3 space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
          Filter by Species
        </span>
        {hasFilter && (
          <button
            id="animl-filter-show-all"
            onClick={selectAll}
            className="text-xs text-emerald-600 hover:text-emerald-700 font-medium"
          >
            Show All
          </button>
        )}
      </div>

      <div className="space-y-1 max-h-48 overflow-y-auto">
        {animalTags.map(tag => {
          const isSelected = !hasFilter || selectedAnimals.has(tag.label);
          return (
            <label
              key={tag.label}
              id={`animl-filter-${tag.label.toLowerCase().replace(/\s+/g, '-')}`}
              className={`flex items-center gap-2 px-2 py-1.5 rounded cursor-pointer transition-colors ${
                isSelected
                  ? 'bg-emerald-50 hover:bg-emerald-100'
                  : 'bg-gray-50 hover:bg-gray-100 opacity-60'
              }`}
            >
              <input
                type="checkbox"
                checked={isSelected}
                onChange={() => toggleAnimal(tag.label)}
                className="w-4 h-4 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500"
              />
              <span className={`text-sm flex-1 ${isSelected ? 'text-gray-900 font-medium' : 'text-gray-500'}`}>
                {tag.label}
              </span>
              <span className="text-xs text-gray-400 tabular-nums">
                {getCount(tag)}
              </span>
            </label>
          );
        })}
      </div>

      {!compact && (
        <p className="text-xs text-gray-500 italic">
          Tip: You can also filter using the legend widget on the map
        </p>
      )}
    </div>
  );
}
