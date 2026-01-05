import React, { useState } from 'react';
import { X, ExternalLink, AlertTriangle, Loader2 } from 'lucide-react';

interface DataONEPreviewProps {
  dataoneUrl: string;
  title: string;
  onClose: () => void;
}

const DataONEPreview: React.FC<DataONEPreviewProps> = ({ dataoneUrl, title, onClose }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const handleIframeLoad = () => {
    setLoading(false);
  };

  const handleIframeError = () => {
    setLoading(false);
    setError(true);
  };

  return (
    <div
      id="dataone-preview-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        id="dataone-preview-modal"
        className="relative w-[90vw] h-[85vh] max-w-6xl bg-white rounded-lg shadow-2xl overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          id="dataone-preview-header"
          className="flex items-center justify-between px-4 py-3 bg-emerald-50 border-b border-gray-200"
        >
          <div className="flex items-center gap-3 min-w-0">
            <h3 className="text-sm font-medium text-gray-900 truncate">{title}</h3>
            <a
              href={dataoneUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-xs text-emerald-600 hover:text-emerald-700 hover:underline flex-shrink-0"
            >
              Open in new tab
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Close preview"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div id="dataone-preview-content" className="flex-1 relative bg-gray-100">
          {/* Loading state */}
          {loading && !error && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-white z-10">
              <Loader2 className="w-8 h-8 text-emerald-600 animate-spin mb-3" />
              <p className="text-sm text-gray-600">Loading preview...</p>
            </div>
          )}

          {/* Error state (iframe blocked) */}
          {error && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-white z-10 px-8">
              <AlertTriangle className="w-12 h-12 text-amber-500 mb-4" />
              <h4 className="text-lg font-medium text-gray-900 mb-2">Preview Unavailable</h4>
              <p className="text-sm text-gray-600 text-center mb-4 max-w-md">
                DataONE doesn't allow embedding their pages in other websites. You can view the
                dataset directly on DataONE instead.
              </p>
              <a
                href={dataoneUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 transition-colors"
              >
                <ExternalLink className="w-4 h-4" />
                View on DataONE
              </a>
            </div>
          )}

          {/* Iframe */}
          <iframe
            id="dataone-preview-iframe"
            src={dataoneUrl}
            title={`Preview: ${title}`}
            className={`w-full h-full border-0 ${error ? 'invisible' : ''}`}
            onLoad={handleIframeLoad}
            onError={handleIframeError}
            sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
          />
        </div>

        {/* Footer */}
        <div
          id="dataone-preview-footer"
          className="px-4 py-2 bg-gray-50 border-t border-gray-200 text-xs text-gray-500"
        >
          <span className="flex items-center gap-1">
            <AlertTriangle className="w-3 h-3" />
            Some features may be limited in preview mode
          </span>
        </div>
      </div>
    </div>
  );
};

export default DataONEPreview;

