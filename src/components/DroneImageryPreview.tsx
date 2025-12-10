import React from 'react';
import { X, ExternalLink } from 'lucide-react';

interface DroneImageryPreviewProps {
  url: string;
  title: string;
  subtitle?: string;
  onClose: () => void;
}

/**
 * Fullscreen iframe overlay for viewing drone imagery portal pages
 * Similar to HubPagePreview but specialized for drone imagery links
 */
const DroneImageryPreview: React.FC<DroneImageryPreviewProps> = ({ 
  url, 
  title, 
  subtitle,
  onClose 
}) => {
  return (
    <div 
      id="drone-preview-container" 
      className="absolute top-0 left-0 right-0 bottom-0 bg-white z-40 flex flex-col"
      style={{ margin: 0, padding: 0 }}
    >
      {/* Header with controls */}
      <div 
        id="drone-preview-header" 
        className="bg-white border-b border-gray-300 px-4 py-3 flex items-center justify-between shadow-sm"
      >
        <div id="drone-preview-title" className="flex flex-col gap-1">
          <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
          {subtitle && (
            <p className="text-sm text-gray-600">{subtitle}</p>
          )}
        </div>
        
        <div id="drone-preview-actions" className="flex items-center gap-2">
          <a
            id="drone-preview-open-in-new-tab"
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            Open in New Tab
            <ExternalLink className="w-4 h-4" />
          </a>
          <button
            id="drone-preview-close-button"
            onClick={onClose}
            className="px-4 py-2 bg-gray-100 text-gray-700 text-sm rounded-lg hover:bg-gray-200 transition-colors flex items-center gap-2"
          >
            Close
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
      
      {/* Content Area */}
      <div id="drone-preview-iframe-wrapper" className="flex-1 relative">
        <iframe
          id="drone-preview-iframe"
          src={url}
          className="absolute inset-0 w-full h-full border-0"
          title={title}
          sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox"
        />
      </div>
    </div>
  );
};

export default DroneImageryPreview;
