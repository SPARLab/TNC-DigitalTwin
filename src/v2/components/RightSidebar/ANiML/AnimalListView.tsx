// ============================================================================
// AnimalListView — Compact clickable animal tag list for animal-first mode
// Each row: animal label + observation count + chevron.
// Clicking drills into AnimalDetailView (cameras + images for that animal).
// ============================================================================

import { ChevronRight } from 'lucide-react';
import type { AnimlAnimalTag } from '../../../../services/animlService';

interface AnimalListViewProps {
  animalTags: AnimlAnimalTag[];
  onSelectAnimal: (label: string) => void;
}

export function AnimalListView({ animalTags, onSelectAnimal }: AnimalListViewProps) {
  // Sort by count descending (most observed first)
  const sorted = [...animalTags]
    .filter(t => t.totalObservations > 0)
    .sort((a, b) => b.totalObservations - a.totalObservations);

  if (sorted.length === 0) {
    return (
      <p id="animl-animal-list-empty" className="text-sm text-gray-400 text-center py-6">
        No animal tags found.
      </p>
    );
  }

  return (
    <div id="animl-animal-list" className="space-y-2">
      <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
        {sorted.length} Species
      </span>

      <div className="divide-y divide-gray-100">
        {sorted.map(tag => (
          <button
            key={tag.label}
            id={`animl-animal-row-${tag.label.toLowerCase().replace(/\s+/g, '-')}`}
            onClick={() => onSelectAnimal(tag.label)}
            className="w-full flex items-center gap-2 px-2 py-2 text-left hover:bg-emerald-50 transition-colors"
          >
            <span className="text-sm text-gray-900 flex-1 truncate">
              {tag.label}
            </span>
            <span className="text-xs text-gray-400 tabular-nums flex-shrink-0">
              {tag.totalObservations.toLocaleString()}
            </span>
            <ChevronRight className="w-3.5 h-3.5 text-gray-300 flex-shrink-0" />
          </button>
        ))}
      </div>
    </div>
  );
}
