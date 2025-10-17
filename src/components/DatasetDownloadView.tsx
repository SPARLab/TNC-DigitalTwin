import React from 'react';
import { X, ExternalLink, Download, ArrowRight } from 'lucide-react';
import { TNCArcGISItem } from '../services/tncArcGISService';


interface DatasetDownloadViewProps {
  item: TNCArcGISItem;
  onClose: () => void;
}

const DatasetDownloadView: React.FC<DatasetDownloadViewProps> = ({ item, onClose }) => {
  // Helper to create slug from title (e.g., "Coastal and Marine Data" → "coastal-and-marine-data")
  const createSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')  // Replace non-alphanumeric with hyphens
      .replace(/^-+|-+$/g, '');      // Remove leading/trailing hyphens
  };

  // Helper to extract organization ID from owner field
  // e.g., "dangermond_preserve@tnc.org_TNC" → "TNC"
  const extractOrgId = (owner: string) => {
    // If owner contains underscore followed by org ID, extract it
    if (owner.includes('_')) {
      const parts = owner.split('_');
      return parts[parts.length - 1]; // Get last part (e.g., "TNC")
    }
    return owner; // Return as-is if no underscore
  };

  // Construct the TNC Hub dataset download/explore page URL
  // Multi-layer Feature Services use explore format, others use direct datasets format
  const downloadPageUrl = (() => {
    const isMultiLayerService = item.availableLayers && item.availableLayers.length > 1;
    const isFeatureService = item.type === 'Feature Service' || 
                            item.type === 'Map Service' || 
                            item.type === 'Image Service';
    
    if (isFeatureService && isMultiLayerService) {
      // Multi-layer Feature Service: Use explore page with layer selector
      // Format: https://dangermondpreserve-tnc.hub.arcgis.com/datasets/{orgId}::{slug}/explore?layer={layerId}
      const orgId = extractOrgId(item.owner);
      const slug = createSlug(item.title);
      const layerId = item.selectedLayerId ?? 0;
      const url = `https://dangermondpreserve-tnc.hub.arcgis.com/datasets/${orgId}::${slug}/explore?layer=${layerId}`;
      console.log(`🔗 Multi-layer service URL: ${url}`, {
        title: item.title,
        orgId,
        slug,
        layerId,
        totalLayers: item.availableLayers?.length,
        rawOwner: item.owner
      });
      return url;
    } else {
      // Single-layer or non-service dataset: Use direct download page
      // Format: https://dangermondpreserve-tnc.hub.arcgis.com/datasets/{itemId}
      const url = `https://dangermondpreserve-tnc.hub.arcgis.com/datasets/${item.id}`;
      console.log(`🔗 Single-layer dataset URL: ${url}`, {
        title: item.title,
        type: item.type
      });
      return url;
    }
  })();
  
  return (
    <div 
      id="dataset-download-view-container" 
      className="absolute top-0 left-0 right-0 bottom-0 bg-white z-30 flex flex-col"
      style={{ margin: 0, padding: 0 }}
      role="dialog"
      aria-labelledby="dataset-download-title"
      aria-modal="true"
    >
      {/* Header with controls */}
      <div 
        id="dataset-download-view-header" 
        className="bg-white border-b border-gray-300 px-4 py-3 flex items-center justify-between shadow-sm"
      >
        <div id="dataset-download-view-title-section" className="flex items-center gap-3">
          <Download id="dataset-download-icon" className="w-5 h-5 text-blue-600" />
          <div className="flex flex-col">
            <h2 id="dataset-download-title" className="text-lg font-semibold text-gray-900">
              {item.title}
            </h2>
            <p className="text-xs text-gray-600">
              Preview of the download page
            </p>
          </div>
          <span id="dataset-type-badge" className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-700">
            {item.type}
          </span>
        </div>
        
        <div id="dataset-download-view-actions" className="flex items-center gap-2">
          <button
            id="dataset-download-close-button"
            onClick={onClose}
            className="px-4 py-2 bg-gray-100 text-gray-700 text-sm rounded-lg hover:bg-gray-200 transition-colors flex items-center gap-2"
            aria-label="Close download view"
          >
            Close
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
      
      {/* Prominent instruction banner with arrow */}
      <div 
        id="dataset-download-instructions" 
        className="bg-gradient-to-r from-green-500 to-green-600 border-b border-green-700 px-6 py-6 flex items-start gap-4 relative"
        role="status"
        aria-live="polite"
      >
        <div className="flex-shrink-0 mt-1">
          <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-lg">
            <Download className="w-6 h-6 text-green-600" aria-hidden="true" />
          </div>
        </div>
        <div className="flex-1">
          <h3 className="text-xl font-bold text-white mb-2">
            {item.availableLayers && item.availableLayers.length > 1 
              ? 'Explore & Download Layers'
              : 'Download This Dataset'
            }
          </h3>
          <p className="text-base text-green-50 mb-4 leading-relaxed">
            Due to browser security, downloads must open in a new tab. 
            <strong className="text-white"> Click the button below to open the {
              item.availableLayers && item.availableLayers.length > 1 ? 'explore' : 'download'
            } page</strong>
            {item.availableLayers && item.availableLayers.length > 1 ? (
              <>, where you can browse layers and download individual layers in various formats.</>
            ) : (
              <>, then look for the <strong className="text-white">"Download"</strong> button to export your data 
              in formats like Shapefile, KML, CSV, or GeoJSON.</>
            )}
          </p>
          {item.availableLayers && item.availableLayers.length > 1 && (
            <p className="text-sm text-green-100 italic">
              💡 This service has {item.availableLayers.length} layers. Each layer can be downloaded separately.
            </p>
          )}
        </div>
        <div className="flex-shrink-0">
          {/* Big prominent "Open" button */}
          <a
            id="dataset-open-in-hub-button-prominent"
            href={downloadPageUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="px-8 py-4 bg-white text-green-700 text-lg font-bold rounded-lg hover:bg-green-50 transition-all flex items-center gap-3 shadow-xl hover:shadow-2xl hover:scale-105 transform"
            aria-label={`Open ${item.title} download page in new tab`}
          >
            <span>Open in New Tab</span>
            <ArrowRight className="w-6 h-6" />
            <ExternalLink className="w-5 h-5" />
          </a>
        </div>
      </div>
      
      {/* Visual guide overlay pointing to where button is */}
      <div 
        id="dataset-download-guide-overlay"
        className="bg-blue-50 border-b border-blue-200 px-6 py-3 flex items-center justify-center gap-3"
        role="note"
      >
        <svg 
          className="w-5 h-5 text-blue-600" 
          fill="none" 
          viewBox="0 0 24 24" 
          stroke="currentColor"
          aria-hidden="true"
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={2} 
            d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" 
          />
        </svg>
        <p className="text-sm font-medium text-blue-900">
          The page below is a preview. To actually download data, use the 
          <strong> "Open in New Tab" </strong> button above ☝️
        </p>
      </div>
      
      {/* Content Area - Iframe showing TNC Hub dataset page (preview only) */}
      <div id="dataset-download-iframe-wrapper" className="flex-1 relative bg-gray-100">
        <iframe
          id="dataset-download-iframe"
          src={downloadPageUrl}
          className="absolute inset-0 w-full h-full border-0"
          title={`Preview of download page for ${item.title}`}
          sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
          aria-label={`Preview of dataset download page for ${item.title}`}
        />
        
        {/* Subtle overlay reminder */}
        <div 
          className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-yellow-500 text-yellow-900 px-4 py-2 rounded-lg shadow-lg border-2 border-yellow-600 flex items-center gap-2 z-10 pointer-events-none"
          role="note"
          aria-hidden="true"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <span className="text-sm font-semibold">Preview Only - Must Open in New Tab to Download</span>
        </div>
      </div>
    </div>
  );
};

export default DatasetDownloadView;
