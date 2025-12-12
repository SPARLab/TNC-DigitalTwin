import React from 'react';
import { ChevronLeft, ChevronRight, X, Loader2, Info } from 'lucide-react';
import type { DroneImageryProject } from '../types/droneImagery';
import DroneIcon from './icons/DroneIcon';

interface DroneImageryCarouselProps {
  project: DroneImageryProject;
  currentLayerIndex: number;
  isLoading?: boolean;
  onPrevious: () => void;
  onNext: () => void;
  onClose: () => void;
  onShowDetails: () => void;
}

/**
 * Format date with ordinal suffix (e.g., "May 14th, 2025")
 */
function formatDateWithOrdinal(date: Date): string {
  const day = date.getDate();
  const month = date.toLocaleDateString('en-US', { month: 'long' });
  const year = date.getFullYear();
  
  const getOrdinal = (n: number): string => {
    if (n > 3 && n < 21) return 'th';
    switch (n % 10) {
      case 1: return 'st';
      case 2: return 'nd';
      case 3: return 'rd';
      default: return 'th';
    }
  };
  
  return `${month} ${day}${getOrdinal(day)}, ${year}`;
}

/**
 * Frame-style carousel overlay for drone imagery
 * Displays date/counter at top, navigation arrows at bottom
 */
const DroneImageryCarousel: React.FC<DroneImageryCarouselProps> = ({
  project,
  currentLayerIndex,
  isLoading = false,
  onPrevious,
  onNext,
  onClose,
  onShowDetails,
}) => {
  const totalLayers = project.layerCount;
  const currentLayer = project.imageryLayers[currentLayerIndex];
  const hasPrevious = currentLayerIndex > 0;
  const hasNext = currentLayerIndex < totalLayers - 1;

  return (
    <>
      {/* Top bar: Project name, Date, Counter, Close */}
      <div
        id="drone-carousel-top-bar"
        className="absolute top-4 left-4 right-16 z-30 flex items-start justify-between pointer-events-none"
      >
        {/* Left: Project info and date */}
        <div
          id="drone-carousel-info"
          className="relative bg-white/95 backdrop-blur-sm rounded-lg shadow-lg px-4 py-3 flex items-center gap-3 pointer-events-auto overflow-visible"
        >
          <DroneIcon className="w-5 h-5 flex-shrink-0 text-blue-600" />
          <div className="flex flex-col">
            <span className="text-sm font-semibold text-gray-900 leading-tight">
              {project.projectName}
            </span>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <span>{formatDateWithOrdinal(currentLayer.dateCaptured)}</span>
              {/* <span className="text-gray-400">•</span> */}
              <span className="font-medium text-blue-600">
                {currentLayerIndex + 1}/{totalLayers}
              </span>
            </div>
          </div>
          {/* Loading spinner - fixed position top right */}
          {isLoading && (
            <Loader2 className="absolute top-2 right-3 w-4 h-4 animate-spin text-blue-600" />
          )}
        </div>

        {/* Right: Details and Close buttons */}
        <div className="flex items-center gap-2 pointer-events-auto">
          <button
            id="drone-carousel-details-btn"
            onClick={onShowDetails}
            className="bg-white/95 backdrop-blur-sm rounded-lg shadow-lg p-2.5 hover:bg-blue-50 transition-colors"
            title="Show details & export"
            aria-label="Show details & export"
          >
            <Info className="w-5 h-5 text-blue-600" />
          </button>
          <button
            id="drone-carousel-close-btn"
            onClick={onClose}
            className="bg-white/95 backdrop-blur-sm rounded-lg shadow-lg p-2.5 hover:bg-gray-100 transition-colors"
            title="Close carousel"
            aria-label="Close carousel"
          >
            <X className="w-5 h-5 text-gray-700" />
          </button>
        </div>
      </div>

      {/* Bottom bar: Navigation arrows */}
      <div
        id="drone-carousel-nav-bar"
        className="absolute bottom-8 left-1/2 -translate-x-1/2 z-30 flex items-center gap-3"
      >
        {/* Previous button */}
        <button
          id="drone-carousel-prev-btn"
          onClick={onPrevious}
          disabled={!hasPrevious || isLoading}
          className={`bg-white/95 backdrop-blur-sm rounded-full shadow-lg p-3 transition-all ${
            hasPrevious && !isLoading
              ? 'hover:bg-gray-100 hover:scale-105 text-gray-700'
              : 'opacity-40 cursor-not-allowed text-gray-400'
          }`}
          title="Previous capture"
          aria-label="Previous capture"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>

        {/* Next button */}
        <button
          id="drone-carousel-next-btn"
          onClick={onNext}
          disabled={!hasNext || isLoading}
          className={`bg-white/95 backdrop-blur-sm rounded-full shadow-lg p-3 transition-all ${
            hasNext && !isLoading
              ? 'hover:bg-gray-100 hover:scale-105 text-gray-700'
              : 'opacity-40 cursor-not-allowed text-gray-400'
          }`}
          title="Next capture"
          aria-label="Next capture"
        >
          <ChevronRight className="w-6 h-6" />
        </button>
      </div>

      {/* Dots indicator (shown above nav buttons if few layers) */}
      {totalLayers <= 6 && (
        <div
          id="drone-carousel-dots"
          className="absolute bottom-24 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2 bg-white/90 backdrop-blur-sm rounded-full px-3 py-1.5 shadow-lg"
        >
          {project.imageryLayers.map((_, idx) => (
            <div
              key={idx}
              className={`w-2.5 h-2.5 rounded-full transition-colors ${
                idx === currentLayerIndex ? 'bg-blue-600' : 'bg-gray-300'
              }`}
            />
          ))}
        </div>
      )}
    </>
  );
};

export default DroneImageryCarousel;
