// ============================================================================
// ImageGrid — 3-column thumbnail grid for camera trap images
// Used in CameraDetailView for both browse modes.
// Shows thumbnail + overlay text (label + date). "Load More" pagination.
// ============================================================================

import { Camera } from 'lucide-react';
import type { AnimlImageLabel } from '../../../../services/animlService';

interface ImageGridProps {
  images: AnimlImageLabel[];
  totalCount: number;
  hasMore: boolean;
  onLoadMore: () => void;
  loadingMore?: boolean;
  /** When true, show camera name in overlay (animal-first mode, images span cameras) */
  showCameraName?: boolean;
}

export function ImageGrid({
  images,
  totalCount,
  hasMore,
  onLoadMore,
  loadingMore = false,
  showCameraName = false,
}: ImageGridProps) {
  if (images.length === 0) {
    return (
      <p id="animl-image-grid-empty" className="text-sm text-gray-400 text-center py-6">
        No images found.
      </p>
    );
  }

  return (
    <div id="animl-image-grid" className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
          Images
        </span>
        <span className="text-xs text-gray-400 tabular-nums">
          {images.length} of {totalCount.toLocaleString()}
        </span>
      </div>

      <div className="grid grid-cols-3 gap-1.5">
        {images.map((img, idx) => (
          <div
            key={`${img.animl_image_id}-${idx}`}
            id={`animl-grid-img-${img.animl_image_id}`}
            className="aspect-square rounded overflow-hidden relative cursor-pointer
                       bg-gray-100 hover:ring-2 hover:ring-emerald-400 transition-all group"
          >
            {img.small_url ? (
              <img
                src={img.small_url}
                alt={img.label}
                className="w-full h-full object-cover"
                loading="lazy"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
                <Camera className="w-6 h-6 text-gray-300" />
              </div>
            )}

            {/* Overlay — label + date (or camera name) */}
            <div className="absolute bottom-0 inset-x-0 bg-black/60 px-1.5 py-1">
              <p className="text-[10px] text-white font-medium truncate">{img.label}</p>
              <p className="text-[9px] text-white/70 truncate">
                {showCameraName && img.deployment_name
                  ? img.deployment_name
                  : formatDate(img.timestamp)}
              </p>
            </div>

            {/* Hover overlay */}
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
          </div>
        ))}
      </div>

      {hasMore && (
        <button
          id="animl-load-more"
          onClick={onLoadMore}
          disabled={loadingMore}
          className="w-full py-2.5 text-sm font-medium text-emerald-600 bg-emerald-50
                     hover:bg-emerald-100 rounded-lg transition-colors disabled:opacity-50"
        >
          {loadingMore ? 'Loading...' : `Load More (${(totalCount - images.length).toLocaleString()} remaining)`}
        </button>
      )}
    </div>
  );
}

function formatDate(timestamp: string): string {
  try {
    return new Date(timestamp).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  } catch {
    return '';
  }
}
