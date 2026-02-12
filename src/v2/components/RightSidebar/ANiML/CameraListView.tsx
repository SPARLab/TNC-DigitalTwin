// ============================================================================
// CameraListView — Displays camera deployment cards with image counts
// Each card shows camera name, coordinate summary, and species presence.
// Clicking a card navigates to CameraDetailView.
// ============================================================================

import { useMemo } from 'react';
import { Camera, MapPin, ChevronRight } from 'lucide-react';
import type { AnimlDeployment, AnimlAnimalTag } from '../../../../services/animlService';

interface CameraListViewProps {
  deployments: AnimlDeployment[];
  animalTags: AnimlAnimalTag[];
  selectedAnimals: Set<string>;
  onSelectCamera: (deploymentId: number) => void;
}

export function CameraListView({
  deployments,
  animalTags,
  selectedAnimals,
  onSelectCamera,
}: CameraListViewProps) {
  const hasFilter = selectedAnimals.size > 0;

  // Build a set of deployment IDs that have observations for selected animals
  const deploymentRelevance = useMemo(() => {
    if (!hasFilter) return null; // no filter = all relevant

    const relevantIds = new Set<number>();
    for (const tag of animalTags) {
      if (selectedAnimals.has(tag.label)) {
        // Each tag has recentObservations with deployment_id
        for (const obs of tag.recentObservations) {
          relevantIds.add(obs.deployment_id);
        }
      }
    }
    return relevantIds;
  }, [animalTags, selectedAnimals, hasFilter]);

  // Sort deployments: relevant ones first, then by name
  const sortedDeployments = useMemo(() => {
    return [...deployments].sort((a, b) => {
      if (deploymentRelevance) {
        const aRelevant = deploymentRelevance.has(a.id);
        const bRelevant = deploymentRelevance.has(b.id);
        if (aRelevant && !bRelevant) return -1;
        if (!aRelevant && bRelevant) return 1;
      }
      return a.name.localeCompare(b.name);
    });
  }, [deployments, deploymentRelevance]);

  if (deployments.length === 0) {
    return (
      <p id="animl-camera-list-empty" className="text-sm text-gray-400 text-center py-6">
        No camera deployments found.
      </p>
    );
  }

  return (
    <div id="animl-camera-list" className="space-y-2">
      <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
        {deployments.length} Camera{deployments.length !== 1 ? 's' : ''}
      </span>

      {sortedDeployments.map(dep => {
        const isGreyed = hasFilter && deploymentRelevance && !deploymentRelevance.has(dep.id);
        const coords = dep.geometry?.coordinates;

        return (
          <button
            key={dep.id}
            id={`animl-camera-card-${dep.id}`}
            onClick={() => onSelectCamera(dep.id)}
            className={`w-full text-left p-3 rounded-lg border transition-all group ${
              isGreyed
                ? 'bg-gray-50 border-gray-200 opacity-50'
                : 'bg-white border-gray-200 hover:border-emerald-300 hover:shadow-sm'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className={`p-1.5 rounded-md ${isGreyed ? 'bg-gray-100' : 'bg-emerald-50'}`}>
                <Camera className={`w-4 h-4 ${isGreyed ? 'text-gray-400' : 'text-emerald-600'}`} />
              </div>

              <div className="flex-1 min-w-0">
                <h4 className={`text-sm font-medium truncate ${isGreyed ? 'text-gray-400' : 'text-gray-900'}`}>
                  {dep.name}
                </h4>
                {coords && (
                  <div className="flex items-center gap-1 mt-0.5">
                    <MapPin className="w-3 h-3 text-gray-400" />
                    <span className="text-xs text-gray-400 truncate">
                      {coords[1].toFixed(4)}, {coords[0].toFixed(4)}
                    </span>
                  </div>
                )}
              </div>

              <ChevronRight className={`w-4 h-4 flex-shrink-0 ${
                isGreyed ? 'text-gray-300' : 'text-gray-400 group-hover:text-emerald-500'
              }`} />
            </div>

            {isGreyed && (
              <p className="text-xs text-gray-400 mt-1.5 italic">
                No matching images at this location
              </p>
            )}
          </button>
        );
      })}
    </div>
  );
}
