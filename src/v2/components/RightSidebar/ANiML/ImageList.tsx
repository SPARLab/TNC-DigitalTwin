// ============================================================================
// ImageList — Vertical image list with prominent date metadata
// Each row: thumbnail + label + date + time + camera name.
// "Load More" button for client-side pagination.
// ============================================================================

import { Camera } from 'lucide-react';
import type { AnimlImageLabel } from '../../../../services/animlService';

interface ImageListProps {
  images: AnimlImageLabel[];
  totalCount: number;
  hasMore: boolean;
  onLoadMore: () => void;
  loadingMore?: boolean;
  /** Show camera name column (useful in animal-first mode where images span cameras) */
  showCameraName?: boolean;
}

export function ImageList({
  images,
  totalCount,
  hasMore,
  onLoadMore,
  loadingMore = false,
  showCameraName = false,
}: ImageListProps) {
  if (images.length === 0) {
    return (
      <p id="animl-image-list-empty" className="text-sm text-gray-400 text-center py-6">
        No images found.
      </p>
    );
  }

  return (
    <div id="animl-image-list" className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
          Images
        </span>
        <span className="text-xs text-gray-400 tabular-nums">
          {images.length} of {totalCount.toLocaleString()}
        </span>
      </div>

      <div className="space-y-1.5">
        {images.map((img, idx) => {
          const date = parseDate(img.timestamp);

          return (
            <div
              key={`${img.animl_image_id}-${idx}`}
              id={`animl-img-${img.animl_image_id}`}
              className="flex gap-3 p-2 bg-white border border-gray-100 rounded-lg
                         hover:border-gray-200 hover:shadow-sm transition-all cursor-pointer"
            >
              {/* Thumbnail */}
              {img.small_url ? (
                <img
                  src={img.small_url}
                  alt={img.label}
                  className="w-14 h-14 object-cover rounded flex-shrink-0 bg-gray-100"
                  loading="lazy"
                />
              ) : (
                <div className="w-14 h-14 bg-gray-100 rounded flex-shrink-0 flex items-center justify-center">
                  <Camera className="w-5 h-5 text-gray-300" />
                </div>
              )}

              {/* Metadata */}
              <div className="flex-1 min-w-0 py-0.5">
                <p className="text-sm font-medium text-gray-900 truncate">{img.label}</p>
                <p className="text-xs text-gray-600 mt-0.5">
                  {date.dateStr}
                  <span className="text-gray-400 ml-1">{date.timeStr}</span>
                </p>
                {showCameraName && img.deployment_name && (
                  <p className="text-xs text-gray-400 mt-0.5 truncate">
                    {img.deployment_name}
                  </p>
                )}
              </div>
            </div>
          );
        })}
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

function parseDate(timestamp: string): { dateStr: string; timeStr: string } {
  try {
    const d = new Date(timestamp);
    const dateStr = d.toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric',
    });
    const timeStr = d.toLocaleTimeString('en-US', {
      hour: 'numeric', minute: '2-digit',
    });
    return { dateStr, timeStr };
  } catch {
    return { dateStr: '', timeStr: '' };
  }
}
