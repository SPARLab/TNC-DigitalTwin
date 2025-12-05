import React, { useEffect, useState } from 'react';
import { Camera, X } from 'lucide-react';

interface AnimlLoadingModalProps {
  isOpen: boolean;
  onCancel?: () => void;
}

const AnimlLoadingModal: React.FC<AnimlLoadingModalProps> = ({ isOpen, onCancel }) => {
  const [isVisible, setIsVisible] = useState(false);

  // Control visibility with slight delay for smooth transitions
  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
    } else {
      // Delay hiding to allow fade-out animation
      const timer = setTimeout(() => setIsVisible(false), 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // Don't render if not visible
  if (!isVisible) return null;

  return (
    <div
      id="animl-loading-modal-overlay"
      className={`absolute inset-0 z-30 flex items-center justify-center bg-black transition-opacity duration-300 ${
        isOpen ? 'bg-opacity-50' : 'bg-opacity-0'
      }`}
      role="dialog"
      aria-modal="true"
      aria-labelledby="animl-loading-modal-title"
    >
      <div
        id="animl-loading-modal-card"
        className={`relative bg-white rounded-lg shadow-2xl p-8 max-w-md w-full mx-4 transition-all duration-300 ${
          isOpen ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
        }`}
      >
        {/* Close button */}
        {onCancel && (
          <button
            id="animl-loading-modal-close-btn"
            onClick={onCancel}
            className="absolute top-3 right-3 p-1 rounded-full hover:bg-gray-100 transition-colors"
            title="Cancel and go back"
            aria-label="Cancel loading"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        )}

        {/* Icon and Spinner */}
        <div id="animl-loading-modal-icon-container" className="flex justify-center mb-6">
          <div id="animl-loading-modal-spinner-wrapper" className="relative">
            {/* Spinning ring */}
            <div
              id="animl-loading-modal-spinner"
              className="animate-spin rounded-full h-16 w-16 border-4 border-blue-200 border-t-blue-600"
            />
            {/* Camera icon in center */}
            <div
              id="animl-loading-modal-icon-center"
              className="absolute inset-0 flex items-center justify-center"
            >
              <Camera id="animl-loading-modal-camera-icon" className="w-8 h-8 text-blue-600" />
            </div>
          </div>
        </div>

        {/* Title */}
        <h2
          id="animl-loading-modal-title"
          className="text-xl font-semibold text-gray-900 text-center mb-3"
        >
          Loading Camera Trap Data
        </h2>

        {/* Message */}
        <p id="animl-loading-modal-message" className="text-sm text-gray-600 text-center mb-2">
          This may take <strong>8-15 seconds</strong>. We're fetching camera deployments and
          counting observations across your search area.
        </p>

        {/* Additional info */}
        <p id="animl-loading-modal-info" className="text-xs text-gray-500 text-center mb-4">
          Please wait while we process your search...
        </p>

        {/* Cancel button */}
        {onCancel && (
          <div id="animl-loading-modal-actions" className="flex justify-center">
            <button
              id="animl-loading-modal-cancel-btn"
              onClick={onCancel}
              className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
            >
              Cancel & Go Back
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default AnimlLoadingModal;

