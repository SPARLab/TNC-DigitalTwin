// ============================================================================
// ImageList — Vertical image list with prominent date metadata.
// Each row: thumbnail + label + date + time + camera name.
// Uses page-based navigation (Prev/Next) with indicator.
// Click any image to open an expanded lightbox view (ImageExpandedView)
// with arrow key navigation.
// ============================================================================

import { useState, useEffect, useCallback } from 'react';
import { Camera, ChevronLeft, ChevronRight } from 'lucide-react';
import type { AnimlImageLabel } from '../../../../services/animlService';
import { ImageExpandedView } from './ImageExpandedView';

interface ImageListProps {
  images: AnimlImageLabel[];
  totalCount: number;
  currentPage: number;
  pageSize: number;
  totalPages: number;
  onPrevPage: () => void;
  onNextPage: () => void;
  /** Fill available parent height (used by Browse tab results panel). */
  expandToFill?: boolean;
  /** Show camera name column (useful in animal-first mode where images span cameras) */
  showCameraName?: boolean;
}

export function ImageList({
  images,
  totalCount,
  currentPage,
  pageSize,
  totalPages,
  onPrevPage,
  onNextPage,
  expandToFill = false,
  showCameraName = false,
}: ImageListProps) {
  // Expanded image state: null = list view, number = index into `images`
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);
  const [pendingPageJump, setPendingPageJump] = useState<'next' | 'prev' | null>(null);

  const handleImageClick = useCallback((index: number) => {
    setExpandedIndex(index);
  }, []);

  const handleCloseExpanded = useCallback(() => {
    setExpandedIndex(null);
    setPendingPageJump(null);
  }, []);

  const handleExpandedPrev = useCallback(() => {
    if (expandedIndex === null) return;

    // Resolve pending jump index first (in case we're mid-transition)
    const effectiveIdx = pendingPageJump === 'next' ? 0
      : pendingPageJump === 'prev' ? images.length - 1
      : expandedIndex;

    if (effectiveIdx > 0) {
      setExpandedIndex(effectiveIdx - 1);
      setPendingPageJump(null);
      return;
    }

    if (currentPage > 1) {
      setPendingPageJump('prev');
      onPrevPage();
    }
  }, [expandedIndex, pendingPageJump, images.length, currentPage, onPrevPage]);

  const handleExpandedNext = useCallback(() => {
    if (expandedIndex === null) return;

    const effectiveIdx = pendingPageJump === 'next' ? 0
      : pendingPageJump === 'prev' ? images.length - 1
      : expandedIndex;

    if (effectiveIdx < images.length - 1) {
      setExpandedIndex(effectiveIdx + 1);
      setPendingPageJump(null);
      return;
    }

    if (currentPage < totalPages) {
      setPendingPageJump('next');
      onNextPage();
    }
  }, [expandedIndex, pendingPageJump, images.length, currentPage, totalPages, onNextPage]);

  // After a page jump, commit the resolved index to state
  useEffect(() => {
    if (pendingPageJump === null || images.length === 0) return;

    if (pendingPageJump === 'next') {
      setExpandedIndex(0);
    } else {
      setExpandedIndex(images.length - 1);
    }
    setPendingPageJump(null);
  }, [pendingPageJump, images]);

  if (images.length === 0) {
    return (
      <p id="animl-image-list-empty" className="text-sm text-gray-400 text-center py-6">
        No images found.
      </p>
    );
  }

  // ── Expanded view ───────────────────────────────────────────────────────

  if (expandedIndex !== null) {
    // Compute safe index synchronously — prevents crash during page transitions
    // where expandedIndex (e.g. 19) may exceed new page's length (e.g. 13).
    const safeIndex = pendingPageJump === 'next' ? 0
      : pendingPageJump === 'prev' ? images.length - 1
      : Math.min(expandedIndex, images.length - 1);

    const pageOffset = (currentPage - 1) * pageSize;
    const canGoPrev = currentPage > 1 || safeIndex > 0;
    const canGoNext = currentPage < totalPages || safeIndex < images.length - 1;

    return (
      <ImageExpandedView
        images={images}
        currentIndex={safeIndex}
        onPrev={handleExpandedPrev}
        onNext={handleExpandedNext}
        canGoPrev={canGoPrev}
        canGoNext={canGoNext}
        onClose={handleCloseExpanded}
        showCameraName={showCameraName}
        pageOffset={pageOffset}
        totalCount={totalCount}
      />
    );
  }

  // ── List view ─────────────────────────────────────────────────────────

  return (
    <div
      id="animl-image-list"
      className={expandToFill ? 'h-full min-h-0 flex flex-col gap-2' : 'space-y-2'}
    >
      <div id="animl-image-list-header" className="flex items-center justify-between">
        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
          Images
        </span>
        <span className="text-xs text-gray-400 tabular-nums">
          {getPageRangeStart(currentPage, pageSize)}-{getPageRangeEnd(currentPage, pageSize, totalCount)} of {totalCount.toLocaleString()}
        </span>
      </div>

      <div
        id="animl-image-list-scrollable"
        className={expandToFill
          ? 'space-y-1.5 flex-1 min-h-0 overflow-y-auto pr-1 scroll-area-animl-images'
          : 'space-y-1.5 max-h-96 overflow-y-auto pr-1 scroll-area-animl-images'}
      >
        {images.map((img, idx) => {
          const date = parseDate(img.timestamp);

          return (
            <button
              key={`${img.animl_image_id}-${idx}`}
              id={`animl-img-${img.animl_image_id}`}
              type="button"
              onClick={() => handleImageClick(idx)}
              className="w-full flex gap-3 p-2 bg-white border border-gray-100 rounded-lg
                         hover:border-emerald-300 hover:shadow-sm transition-all cursor-pointer
                         text-left focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:ring-offset-1"
              aria-label={`View ${img.label}, ${date.dateStr} ${date.timeStr}`}
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
            </button>
          );
        })}
      </div>

      <div id="animl-image-pagination" className="flex items-center justify-between border-t border-gray-100 pt-2">
        <button
          id="animl-pagination-prev"
          onClick={onPrevPage}
          disabled={currentPage <= 1}
          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium
                     text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors
                     disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <ChevronLeft className="w-3.5 h-3.5" />
          Prev Page
        </button>

        <span id="animl-pagination-indicator" className="text-xs text-gray-500 tabular-nums">
          Page {currentPage} of {totalPages}
        </span>

        <button
          id="animl-pagination-next"
          onClick={onNextPage}
          disabled={currentPage >= totalPages}
          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium
                     text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors
                     disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Next Page
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}

function getPageRangeStart(currentPage: number, pageSize: number): number {
  return ((currentPage - 1) * pageSize) + 1;
}

function getPageRangeEnd(currentPage: number, pageSize: number, totalCount: number): number {
  return Math.min(currentPage * pageSize, totalCount);
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
