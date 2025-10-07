import React from 'react';
import { X, ExternalLink } from 'lucide-react';
import { TNCArcGISItem } from '../services/tncArcGISService';

interface HubPagePreviewProps {
  item: TNCArcGISItem;
  onClose: () => void;
}

const HubPagePreview: React.FC<HubPagePreviewProps> = ({ item, onClose }) => {
  // Check if URL is available and valid
  const hasValidUrl = item.url && item.url.trim() !== '';
  
  return (
    <div 
      id="hub-page-preview-container" 
      className="absolute top-0 left-0 right-0 bottom-0 bg-white z-30 flex flex-col"
      style={{ margin: 0, padding: 0 }}
    >
      {/* Header with controls */}
      <div 
        id="hub-page-preview-header" 
        className="bg-white border-b border-gray-300 px-4 py-3 flex items-center justify-between shadow-sm"
      >
        <div id="hub-page-preview-title" className="flex items-center gap-3">
          <h2 className="text-lg font-semibold text-gray-900">{item.title}</h2>
          <span className="px-2 py-1 text-xs rounded-full bg-purple-100 text-purple-700">
            {item.type}
          </span>
        </div>
        
        <div id="hub-page-preview-actions" className="flex items-center gap-2">
          {hasValidUrl && (
            <a
              id="hub-page-open-in-arcgis-button"
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
            >
              View on ArcGIS Hub
              <ExternalLink className="w-4 h-4" />
            </a>
          )}
          <button
            id="hub-page-close-button"
            onClick={onClose}
            className="px-4 py-2 bg-gray-100 text-gray-700 text-sm rounded-lg hover:bg-gray-200 transition-colors flex items-center gap-2"
          >
            Close
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
      
      {/* Content Area */}
      <div id="hub-page-preview-iframe-wrapper" className="flex-1 relative">
        {hasValidUrl ? (
          <iframe
            id="hub-page-preview-iframe"
            src={item.url}
            className="absolute inset-0 w-full h-full border-0"
            title={item.title}
            sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox"
          />
        ) : (
          <div id="hub-page-no-preview" className="absolute inset-0 flex items-center justify-center p-8">
            <div className="max-w-2xl text-center space-y-4">
              <div className="text-6xl mb-4">📄</div>
              <h3 className="text-xl font-semibold text-gray-900">Preview Not Available</h3>
              <p className="text-gray-600">
                This item doesn't have a preview URL available. It may be a data file that needs to be downloaded or viewed through ArcGIS Online.
              </p>
              <div className="pt-4 space-y-2">
                <p className="text-sm text-gray-500">
                  <strong>Type:</strong> {item.type}
                </p>
                {item.description && (
                  <p className="text-sm text-gray-700 bg-gray-50 p-4 rounded-lg text-left">
                    <strong>Description:</strong><br />
                    <span dangerouslySetInnerHTML={{ __html: item.description }} />
                  </p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default HubPagePreview;
