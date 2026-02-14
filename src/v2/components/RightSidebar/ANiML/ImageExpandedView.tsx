// ============================================================================
// ImageExpandedView — Lightbox-style expanded image view within the sidebar.
// Shows large image (medium_url) + metadata. Arrow key navigation between
// images. Escape or close button to dismiss. Receives the current page of
// images and an initial index; navigation stays within that page.
// ============================================================================

import { useState, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight, Camera } from 'lucide-react';
import type { AnimlImageLabel } from '../../../../services/animlService';

interface ImageExpandedViewProps {
  images: AnimlImageLabel[];
  currentIndex: number;
  onPrev: () => void;
  onNext: () => void;
  canGoPrev: boolean;
  canGoNext: boolean;
  onClose: () => void;
  /** Show camera name in metadata (useful in multi-camera result sets). */
  showCameraName?: boolean;
  /** 1-based page offset so the counter reads "Image 23 of 200" not "3 of 20". */
  pageOffset?: number;
  totalCount?: number;
}

export function ImageExpandedView({
  images,
  currentIndex,
  onPrev,
  onNext,
  canGoPrev,
  canGoNext,
  onClose,
  showCameraName = false,
  pageOffset = 0,
  totalCount,
}: ImageExpandedViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [imgLoaded, setImgLoaded] = useState(false);

  const image = images[currentIndex];

  // Safety: if index is out of bounds during a page transition, bail gracefully
  if (!image) return null;

  // Global position for display (e.g. "Image 23 of 200")
  const globalIndex = pageOffset + currentIndex + 1;
  const globalTotal = totalCount ?? images.length;

  // Reset load state when image changes
  useEffect(() => {
    setImgLoaded(false);
  }, [currentIndex]);

  // ── Keyboard handler ──────────────────────────────────────────────────

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      switch (e.key) {
        case 'ArrowLeft':
          e.preventDefault();
          onPrev();
          break;
        case 'ArrowRight':
          e.preventDefault();
          onNext();
          break;
        case 'Escape':
          e.preventDefault();
          onClose();
          break;
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onPrev, onNext, onClose]);

  // Auto-focus container on mount for keyboard accessibility
  useEffect(() => {
    containerRef.current?.focus();
  }, []);

  // ── Parse date ────────────────────────────────────────────────────────

  const date = parseTimestamp(image.timestamp);

  // ── Render ────────────────────────────────────────────────────────────

  return (
    <div
      id="animl-image-expanded"
      ref={containerRef}
      tabIndex={-1}
      className="h-full min-h-0 flex flex-col outline-none focus:outline-none focus:ring-0"
      role="dialog"
      aria-label={`Expanded image: ${image.label}`}
    >
      {/* Header: close button + image counter */}
      <div id="animl-expanded-header" className="flex items-center justify-between pb-2">
        <button
          id="animl-expanded-close"
          onClick={onClose}
          className="flex items-center gap-2 py-2 px-3 text-sm font-medium text-gray-600
                     hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors
                     focus:outline-none focus:ring-0"
          aria-label="Close expanded view"
        >
          <ChevronLeft className="w-4 h-4" />
          Back to list
        </button>
        <span id="animl-expanded-counter" className="text-xs text-gray-400 tabular-nums">
          {globalIndex} of {globalTotal.toLocaleString()}
        </span>
      </div>

      {/* Image area — constrained height so black box doesn't dominate */}
      <div
        id="animl-expanded-image-container"
        className="relative shrink-0 h-64 bg-gray-950 rounded-lg overflow-hidden
                   flex items-center justify-center"
      >
        {/* Loading placeholder */}
        {!imgLoaded && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-100 rounded-lg">
            <Camera className="w-8 h-8 text-gray-300 animate-pulse" />
          </div>
        )}

        {/* Large image — prefer medium_url, fall back to small_url */}
        {(image.medium_url || image.small_url) ? (
          <img
            id="animl-expanded-image"
            src={image.medium_url ?? image.small_url!}
            alt={image.label}
            className={`max-w-full max-h-full object-contain transition-opacity duration-200 ${
              imgLoaded ? 'opacity-100' : 'opacity-0'
            }`}
            onLoad={() => setImgLoaded(true)}
            draggable={false}
          />
        ) : (
          <div className="flex flex-col items-center gap-2 text-gray-400">
            <Camera className="w-10 h-10" />
            <span className="text-sm">No image available</span>
          </div>
        )}

        {/* Overlay prev/next buttons on image (larger touch targets) */}
        <button
          id="animl-expanded-prev-overlay"
          onClick={onPrev}
          disabled={!canGoPrev}
          className="absolute left-1 top-1/2 -translate-y-1/2 p-1.5 rounded-full
                     bg-black/40 text-white hover:bg-black/60 transition-colors
                     disabled:opacity-0 disabled:pointer-events-none
                     focus:outline-none focus:ring-0"
          aria-label="Previous image"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        <button
          id="animl-expanded-next-overlay"
          onClick={onNext}
          disabled={!canGoNext}
          className="absolute right-1 top-1/2 -translate-y-1/2 p-1.5 rounded-full
                     bg-black/40 text-white hover:bg-black/60 transition-colors
                     disabled:opacity-0 disabled:pointer-events-none
                     focus:outline-none focus:ring-0"
          aria-label="Next image"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* Metadata panel */}
      <div id="animl-expanded-metadata" className="pt-3 space-y-1.5">
        <p className="text-base font-semibold text-gray-900">{image.label}</p>
        <p className="text-sm text-gray-600">
          {date.dateStr}
          <span className="text-gray-500 ml-1.5">{date.timeStr}</span>
        </p>
        {showCameraName && image.deployment_name && (
          <p className="text-sm text-gray-500 flex items-center gap-1.5">
            <Camera className="w-4 h-4 text-gray-400" />
            {image.deployment_name}
          </p>
        )}
      </div>

      {/* Bottom navigation bar */}
      <div id="animl-expanded-nav" className="flex items-center justify-between pt-3 border-t border-gray-100 mt-3">
        <button
          id="animl-expanded-prev"
          onClick={onPrev}
          disabled={!canGoPrev}
          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium
                     text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors
                     disabled:opacity-40 disabled:cursor-not-allowed
                     focus:outline-none focus:ring-0"
          aria-label="Previous image"
        >
          <ChevronLeft className="w-3.5 h-3.5" />
          Prev
        </button>

        <span className="text-xs text-gray-400">
          ← → to navigate &middot; Esc to close
        </span>

        <button
          id="animl-expanded-next"
          onClick={onNext}
          disabled={!canGoNext}
          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium
                     text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors
                     disabled:opacity-40 disabled:cursor-not-allowed
                     focus:outline-none focus:ring-0"
          aria-label="Next image"
        >
          Next
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}

function parseTimestamp(timestamp: string): { dateStr: string; timeStr: string } {
  try {
    const d = new Date(timestamp);
    const dateStr = d.toLocaleDateString('en-US', {
      weekday: 'short', month: 'short', day: 'numeric', year: 'numeric',
    });
    const timeStr = d.toLocaleTimeString('en-US', {
      hour: 'numeric', minute: '2-digit',
    });
    return { dateStr, timeStr };
  } catch {
    return { dateStr: '', timeStr: '' };
  }
}
