// ============================================================================
// CameraDetailView — Drill-down view for a single camera deployment
// Shows camera metadata, image filter controls, and image grid (stub).
// Follows the Level 3 sidebar layout from the phase-2 plan (DFT-040).
// ============================================================================

import { useState, useEffect, useCallback } from 'react';
import { ArrowLeft, Camera, Loader2 } from 'lucide-react';
import {
  animlService,
  type AnimlDeployment,
  type AnimlImageLabel,
} from '../../../../services/animlService';

interface CameraDetailViewProps {
  deployment: AnimlDeployment;
  onBack: () => void;
}

export function CameraDetailView({ deployment, onBack }: CameraDetailViewProps) {
  const [images, setImages] = useState<AnimlImageLabel[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch images for this camera on mount
  const fetchImages = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [labels, count] = await Promise.all([
        animlService.queryImageLabelsCached({
          deploymentIds: [deployment.id],
          maxResults: 50,
        }),
        animlService.getImageLabelsCount({
          deploymentIds: [deployment.id],
        }),
      ]);
      setImages(labels);
      setTotalCount(count);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load images');
    } finally {
      setLoading(false);
    }
  }, [deployment.id]);

  useEffect(() => { fetchImages(); }, [fetchImages]);

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
      <div id="animl-camera-detail-header" className="bg-slate-50 rounded-lg p-4 space-y-2">
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
        </p>
      </div>

      {/* Loading state */}
      {loading && (
        <div className="flex items-center justify-center py-8 text-gray-400">
          <Loader2 className="w-5 h-5 animate-spin mr-2" />
          <span className="text-sm">Loading images...</span>
        </div>
      )}

      {/* Error state */}
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Image list */}
      {!loading && !error && (
        <>
          <p className="text-xs text-gray-500">
            Showing {images.length} of {totalCount.toLocaleString()} images
          </p>

          <div id="animl-camera-images" className="space-y-2">
            {images.map((img, idx) => (
              <div
                key={`${img.animl_image_id}-${idx}`}
                id={`animl-image-card-${img.animl_image_id}`}
                className="flex gap-3 p-2 bg-white border border-gray-200 rounded-lg"
              >
                {/* Thumbnail */}
                {img.small_url ? (
                  <img
                    src={img.small_url}
                    alt={img.label}
                    className="w-16 h-16 object-cover rounded flex-shrink-0 bg-gray-100"
                    loading="lazy"
                  />
                ) : (
                  <div className="w-16 h-16 bg-gray-100 rounded flex-shrink-0 flex items-center justify-center">
                    <Camera className="w-5 h-5 text-gray-300" />
                  </div>
                )}

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{img.label}</p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {new Date(img.timestamp).toLocaleDateString('en-US', {
                      year: 'numeric', month: 'short', day: 'numeric',
                    })}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {new Date(img.timestamp).toLocaleTimeString('en-US', {
                      hour: '2-digit', minute: '2-digit',
                    })}
                  </p>
                </div>
              </div>
            ))}

            {images.length === 0 && (
              <p className="text-sm text-gray-400 text-center py-6">
                No images found for this camera.
              </p>
            )}
          </div>
        </>
      )}
    </div>
  );
}
