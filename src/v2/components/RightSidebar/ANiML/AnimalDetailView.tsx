// ============================================================================
// AnimalDetailView — Drill-down view for a selected animal species
// Shows: animal header → compact camera list (for that animal) → image list.
// Optionally filter by camera. Images shown as vertical list with dates.
// ============================================================================

import { useState, useEffect, useCallback, useMemo } from 'react';
import { ArrowLeft, Loader2, Bookmark, ChevronRight } from 'lucide-react';
import {
  animlService,
  type AnimlDeployment,
  type AnimlImageLabel,
} from '../../../../services/animlService';
import { useAnimlFilter } from '../../../context/AnimlFilterContext';
import { ImageList } from './ImageList';

const PAGE_SIZE = 20;

interface AnimalDetailViewProps {
  animalLabel: string;
  onBack: () => void;
}

export function AnimalDetailView({ animalLabel, onBack }: AnimalDetailViewProps) {
  const { deployments, animalTags, countLookups } = useAnimlFilter();

  const [allImages, setAllImages] = useState<AnimlImageLabel[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [displayCount, setDisplayCount] = useState(PAGE_SIZE);
  const [loadingMore, setLoadingMore] = useState(false);
  const [selectedCameraId, setSelectedCameraId] = useState<number | null>(null);

  // Find the animal tag for metadata
  const tag = animalTags.find(t => t.label === animalLabel);

  // Cameras that have this animal (from countLookups)
  const camerasWithAnimal = useMemo((): (AnimlDeployment & { count: number })[] => {
    if (!countLookups) return [];
    const depIds = countLookups.deploymentsByLabel.get(animalLabel);
    if (!depIds) return [];
    return deployments
      .filter(d => depIds.has(d.id))
      .map(d => ({
        ...d,
        count: countLookups.countsByDeploymentAndLabel.get(`${d.id}:${animalLabel}`) ?? 0,
      }))
      .sort((a, b) => b.count - a.count);
  }, [deployments, countLookups, animalLabel]);

  // Build query params
  const queryDeploymentIds = useMemo(
    () => selectedCameraId ? [selectedCameraId] : camerasWithAnimal.map(c => c.id),
    [selectedCameraId, camerasWithAnimal],
  );

  // Fetch images for this animal (optionally filtered by camera)
  const fetchImages = useCallback(async () => {
    setLoading(true);
    setError(null);
    setDisplayCount(PAGE_SIZE);
    try {
      const [labels, count] = await Promise.all([
        animlService.queryImageLabelsCached({
          labels: [animalLabel],
          deploymentIds: queryDeploymentIds.length > 0 ? queryDeploymentIds : undefined,
          maxResults: 200,
        }),
        animlService.getImageLabelsCount({
          labels: [animalLabel],
          deploymentIds: queryDeploymentIds.length > 0 ? queryDeploymentIds : undefined,
        }),
      ]);
      setAllImages(labels);
      setTotalCount(count);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load images');
    } finally {
      setLoading(false);
    }
  }, [animalLabel, queryDeploymentIds]);

  useEffect(() => { fetchImages(); }, [fetchImages]);

  const handleLoadMore = useCallback(() => {
    setLoadingMore(true);
    setTimeout(() => {
      setDisplayCount(prev => Math.min(prev + PAGE_SIZE, allImages.length));
      setLoadingMore(false);
    }, 150);
  }, [allImages.length]);

  const visibleImages = allImages.slice(0, displayCount);
  const hasMore = displayCount < allImages.length;

  return (
    <div id="animl-animal-detail" className="space-y-4">
      {/* Back navigation */}
      <button
        id="animl-animal-detail-back"
        onClick={onBack}
        className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Animals
      </button>

      {/* Animal header */}
      <div id="animl-animal-detail-header" className="bg-slate-50 rounded-lg p-4 space-y-1">
        <h3 className="text-base font-semibold text-gray-900">{animalLabel}</h3>
        <div className="flex items-center gap-2 text-xs text-gray-500">
          {tag && (
            <>
              <span>{tag.totalObservations.toLocaleString()} total images</span>
              <span className="text-gray-300">•</span>
              <span>{tag.uniqueCameras} cameras</span>
            </>
          )}
        </div>
      </div>

      {/* Compact camera filter — click to filter images by camera */}
      {camerasWithAnimal.length > 0 && (
        <div id="animl-animal-camera-filter" className="space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
              Cameras ({camerasWithAnimal.length})
            </span>
            {selectedCameraId && (
              <button
                id="animl-animal-clear-camera"
                onClick={() => setSelectedCameraId(null)}
                className="text-xs text-emerald-600 hover:text-emerald-700 font-medium"
              >
                Show All
              </button>
            )}
          </div>

          <div className="divide-y divide-gray-100 border border-gray-100 rounded-lg overflow-hidden">
            {camerasWithAnimal.map(cam => {
              const isActive = selectedCameraId === cam.id;
              return (
                <button
                  key={cam.id}
                  id={`animl-animal-cam-${cam.id}`}
                  onClick={() => setSelectedCameraId(isActive ? null : cam.id)}
                  className={`w-full flex items-center gap-2 px-2.5 py-1.5 text-left transition-colors ${
                    isActive ? 'bg-emerald-50' : 'hover:bg-gray-50'
                  }`}
                >
                  <span className={`text-sm flex-1 truncate ${isActive ? 'text-emerald-700 font-medium' : 'text-gray-700'}`}>
                    {cam.name}
                  </span>
                  <span className="text-xs text-gray-400 tabular-nums flex-shrink-0">
                    {cam.count.toLocaleString()}
                  </span>
                  <ChevronRight className={`w-3 h-3 flex-shrink-0 ${
                    isActive ? 'text-emerald-500' : 'text-gray-300'
                  }`} />
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Bookmark button */}
      <button
        id="animl-animal-bookmark"
        className="w-full flex items-center justify-center gap-2 py-2.5 text-sm font-medium
                   text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200
                   rounded-lg transition-colors"
      >
        <Bookmark className="w-4 h-4" />
        {selectedCameraId ? 'Bookmark Camera + Species' : 'Bookmark Species'}
      </button>

      {/* Loading / Error / Image list */}
      {loading && (
        <div className="flex items-center justify-center py-8 text-gray-400">
          <Loader2 className="w-5 h-5 animate-spin mr-2" />
          <span className="text-sm">Loading images...</span>
        </div>
      )}

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          {error}
        </div>
      )}

      {!loading && !error && (
        <ImageList
          images={visibleImages}
          totalCount={totalCount}
          hasMore={hasMore}
          onLoadMore={handleLoadMore}
          loadingMore={loadingMore}
          showCameraName
        />
      )}
    </div>
  );
}
