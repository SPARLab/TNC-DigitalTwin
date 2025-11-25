import React, { useEffect, useState } from 'react';
import { Camera } from 'lucide-react';

interface AnimlLoadingModalProps {
  isOpen: boolean;
}

const AnimlLoadingModal: React.FC<AnimlLoadingModalProps> = ({ isOpen }) => {
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
      className={`fixed inset-0 z-50 flex items-center justify-center bg-black transition-opacity duration-300 ${
        isOpen ? 'bg-opacity-50' : 'bg-opacity-0'
      }`}
      role="dialog"
      aria-modal="true"
      aria-labelledby="animl-loading-modal-title"
    >
      <div
        id="animl-loading-modal-card"
        className={`bg-white rounded-lg shadow-2xl p-8 max-w-md w-full mx-4 transition-all duration-300 ${
          isOpen ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
        }`}
      >
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
        <p id="animl-loading-modal-info" className="text-xs text-gray-500 text-center">
          Please wait while we process your search...
        </p>
      </div>
    </div>
  );
};

export default AnimlLoadingModal;

