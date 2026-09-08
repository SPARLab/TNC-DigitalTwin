// ============================================================================
// OccurrenceInfo — occurrence count for the selected species, with a toggle
// that plots those points on the experience map.
// ============================================================================

import { useCallback, useEffect, useRef, useState } from 'react';
import { Eye, EyeOff, Loader2, MapPin } from 'lucide-react';
import { fetchOccurrenceFeatures } from '../../services/geoprocessingService';
import type { OccurrenceFeature, PointsAction } from './types';

interface OccurrenceInfoProps {
  species: string;
  onTogglePoints?: (action: PointsAction) => void;
}

export function OccurrenceInfo({ species, onTogglePoints }: OccurrenceInfoProps) {
  const [features, setFeatures] = useState<OccurrenceFeature[] | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [arePointsVisible, setArePointsVisible] = useState(false);
  const previousSpeciesRef = useRef<string | null>(null);

  useEffect(() => {
    if (!species) {
      setFeatures(null);
      setArePointsVisible(false);
      return;
    }
    if (species === previousSpeciesRef.current) return;
    previousSpeciesRef.current = species;

    let isCancelled = false;
    setIsLoading(true);
    setFeatures(null);
    setArePointsVisible(false);

    fetchOccurrenceFeatures(species)
      .then((result) => {
        if (!isCancelled) setFeatures(result);
      })
      .catch(() => {
        if (!isCancelled) setFeatures(null);
      })
      .finally(() => {
        if (!isCancelled) setIsLoading(false);
      });

    return () => {
      isCancelled = true;
    };
  }, [species]);

  const handleToggle = useCallback(() => {
    if (!features) return;
    if (arePointsVisible) {
      onTogglePoints?.({ species, action: 'remove' });
      setArePointsVisible(false);
      return;
    }
    onTogglePoints?.({ species, action: 'add', features });
    setArePointsVisible(true);
  }, [arePointsVisible, features, onTogglePoints, species]);

  if (!species) return null;

  const count = features?.length;

  return (
    <div className="flex items-center justify-between gap-2 rounded-card border border-gray-200 bg-gray-50 px-3 py-2">
      <div className="flex min-w-0 items-center gap-1.5 text-xs text-gray-700">
        <MapPin className="h-3.5 w-3.5 flex-shrink-0 text-emerald-700" />
        <span className="font-medium">Occurrences</span>
        {isLoading ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin text-gray-400" />
        ) : count != null ? (
          <span className="tabular-nums text-gray-500">{count.toLocaleString()}</span>
        ) : (
          <span className="text-gray-400">—</span>
        )}
      </div>

      {count != null && count > 0 && (
        <button
          type="button"
          onClick={handleToggle}
          className={`inline-flex items-center gap-1 rounded-button border px-2 py-1 text-[11px] font-medium transition-colors ${
            arePointsVisible
              ? 'border-emerald-300 bg-emerald-50 text-emerald-800'
              : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
          }`}
        >
          {arePointsVisible ? (
            <>
              <EyeOff className="h-3 w-3" /> Hide
            </>
          ) : (
            <>
              <Eye className="h-3 w-3" /> Show
            </>
          )}
        </button>
      )}
    </div>
  );
}
