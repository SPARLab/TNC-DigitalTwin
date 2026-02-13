// ============================================================================
// CameraDetailView — Drill-down view for a single camera (camera-first mode)
// Shows: camera header → compact species list → image list with dates.
// Species filter uses AnimlFilterContext (syncs with legend widget + map).
// ============================================================================

import { useState, useEffect, useCallback, useMemo } from 'react';
import { ArrowLeft, Camera, Loader2, Bookmark, ChevronRight } from 'lucide-react';
import {
  animlService,
  type AnimlDeployment,
  type AnimlImageLabel,
} from '../../../../services/animlService';
import { useAnimlFilter } from '../../../context/AnimlFilterContext';
import { ImageList } from './ImageList';

const PAGE_SIZE = 20;

interface CameraDetailViewProps {
  deployment: AnimlDeployment;
  onBack: () => void;
}

export function CameraDetailView({ deployment, onBack }: CameraDetailViewProps) {
  const { animalTags, countLookups } = useAnimlFilter();

  const [allImages, setAllImages] = useState<AnimlImageLabel[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedLabel, setSelectedLabel] = useState<string | null>(null);

  // Species at this camera, sorted by count descending
  const speciesAtCamera = useMemo(() => {
    if (!countLookups) return [];
    const labelsAtCamera = countLookups.labelsByDeployment.get(deployment.id);
    if (!labelsAtCamera) return [];
    return animalTags
      .filter(t => labelsAtCamera.has(t.label))
      .map(t => ({
        label: t.label,
        count: countLookups.countsByDeploymentAndLabel.get(`${deployment.id}:${t.label}`) ?? 0,
      }))
      .sort((a, b) => b.count - a.count);
  }, [animalTags, countLookups, deployment.id]);

  // Build query labels
  const queryLabels = useMemo(
    () => selectedLabel ? [selectedLabel] : undefined,
    [selectedLabel],
  );

  // Fetch images
  const fetchImages = useCallback(async () => {
    setLoading(true);
    setError(null);
    setCurrentPage(1);
    try {
      const [labels, count] = await Promise.all([
        animlService.queryImageLabelsCached({
          deploymentIds: [deployment.id],
          labels: queryLabels,
          maxResults: 200,
        }),
        animlService.getImageLabelsCount({
          deploymentIds: [deployment.id],
          labels: queryLabels,
        }),
      ]);
      setAllImages(labels);
      setTotalCount(count);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load images');
    } finally {
      setLoading(false);
    }
  }, [deployment.id, queryLabels]);

  useEffect(() => { fetchImages(); }, [fetchImages]);

  const totalPages = Math.max(1, Math.ceil(allImages.length / PAGE_SIZE));
  const visibleImages = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return allImages.slice(start, start + PAGE_SIZE);
  }, [allImages, currentPage]);

  const handlePrevPage = useCallback(() => {
    setCurrentPage(prev => Math.max(1, prev - 1));
  }, []);

  const handleNextPage = useCallback(() => {
    setCurrentPage(prev => Math.min(totalPages, prev + 1));
  }, [totalPages]);
  const coords = deployment.geometry?.coordinates;

  return (
    <div id="animl-camera-detail" className="space-y-4">
      {/* Back navigation */}
      <button
        id="animl-camera-detail-back"
        onClick={onBack}
        className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Cameras
      </button>

      {/* Camera header */}
      <div id="animl-camera-detail-header" className="bg-slate-50 rounded-lg p-4 space-y-1">
        <div className="flex items-center gap-2">
          <Camera className="w-5 h-5 text-emerald-600" />
          <h3 className="text-base font-semibold text-gray-900">{deployment.name}</h3>
        </div>
        {coords && (
          <p className="text-xs text-gray-500">
            {coords[1].toFixed(5)}°N, {Math.abs(coords[0]).toFixed(5)}°W
          </p>
        )}
        <p className="text-xs text-gray-500">
          ID: {deployment.animl_dp_id}
          <span className="text-gray-300 mx-1">•</span>
          <span className="text-emerald-600 font-medium">
            {totalCount.toLocaleString()} {selectedLabel ? 'matching' : 'total'} images
          </span>
        </p>
      </div>

      {/* Species filter — compact list, click to filter */}
      {speciesAtCamera.length > 0 && (
        <div id="animl-camera-species" className="space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
              Species ({speciesAtCamera.length})
            </span>
            {selectedLabel && (
              <button
                id="animl-camera-species-clear"
                onClick={() => setSelectedLabel(null)}
                className="text-xs text-emerald-600 hover:text-emerald-700 font-medium"
              >
                Show All
              </button>
            )}
          </div>

          <div className="divide-y divide-gray-100 border border-gray-100 rounded-lg overflow-hidden">
            {speciesAtCamera.map(sp => {
              const isActive = selectedLabel === sp.label;
              return (
                <button
                  key={sp.label}
                  id={`animl-camera-sp-${sp.label.toLowerCase().replace(/\s+/g, '-')}`}
                  onClick={() => setSelectedLabel(isActive ? null : sp.label)}
                  className={`w-full flex items-center gap-2 px-2.5 py-1.5 text-left transition-colors ${
                    isActive ? 'bg-emerald-50' : 'hover:bg-gray-50'
                  }`}
                >
                  <span className={`text-sm flex-1 truncate ${isActive ? 'text-emerald-700 font-medium' : 'text-gray-700'}`}>
                    {sp.label}
                  </span>
                  <span className="text-xs text-gray-400 tabular-nums flex-shrink-0">
                    {sp.count.toLocaleString()}
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
        id="animl-camera-bookmark"
        className="w-full flex items-center justify-center gap-2 py-2.5 text-sm font-medium
                   text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200
                   rounded-lg transition-colors"
      >
        <Bookmark className="w-4 h-4" />
        {selectedLabel ? 'Bookmark Camera + Species' : 'Bookmark Camera'}
      </button>

      {/* Loading / Error / Images */}
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
          currentPage={currentPage}
          pageSize={PAGE_SIZE}
          totalPages={totalPages}
          onPrevPage={handlePrevPage}
          onNextPage={handleNextPage}
        />
      )}
    </div>
  );
}
