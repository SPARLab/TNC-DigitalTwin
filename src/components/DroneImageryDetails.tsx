import React from 'react';
import { ExternalLink, Copy, Calendar, Clock, Box, ShoppingCart, X } from 'lucide-react';
import toast from 'react-hot-toast';
import type { DroneImageryProject, DroneImageryMetadata } from '../types/droneImagery';

export type DroneSidebarTab = 'details' | 'export';

interface DroneImagerySidebarProps {
  project: DroneImageryProject;
  currentLayer: DroneImageryMetadata;
  activeTab: DroneSidebarTab;
  onTabChange: (tab: DroneSidebarTab) => void;
  onClose: () => void;
  onAddToCart: () => void;
}

// Format date with ordinal suffix (e.g., "May 14th, 2025")
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

// Format extent from polygon rings to bounding box
function formatExtent(rings?: number[][][]): string {
  if (!rings || rings.length === 0) return 'Not available';
  const coords = rings[0];
  const lons = coords.map(c => c[0]);
  const lats = coords.map(c => c[1]);
  const minLon = Math.min(...lons).toFixed(6);
  const maxLon = Math.max(...lons).toFixed(6);
  const minLat = Math.min(...lats).toFixed(6);
  const maxLat = Math.max(...lats).toFixed(6);
  return `${minLon}, ${minLat} to ${maxLon}, ${maxLat}`;
}

// Copy text to clipboard with toast notification
function copyToClipboard(text: string, label: string) {
  navigator.clipboard.writeText(text).then(() => {
    toast.success(`${label} copied to clipboard`, {
      duration: 2000,
      position: 'bottom-right',
    });
  });
}

const DroneImagerySidebar: React.FC<DroneImagerySidebarProps> = ({
  project,
  currentLayer,
  activeTab,
  onTabChange,
  onClose,
  onAddToCart,
}) => {
  const portalItemUrl = `https://dangermondpreserve-spatial.com/portal/home/item.html?id=${currentLayer.wmts.itemId}`;
  
  // Construct REST service URL from item ID if wmts.link is just the portal page
  // The actual REST endpoint would be something like: /rest/services/Hosted/ServiceName/MapServer
  // For now, use the wmts.link if it looks like a service URL, otherwise show portal page
  const wmtsServiceUrl = currentLayer.wmts.link.includes('/rest/services/') 
    ? currentLayer.wmts.link 
    : portalItemUrl;

  return (
    <aside
      id="drone-sidebar"
      className="w-96 max-w-full h-full bg-white border-l border-gray-200 shadow-xl flex flex-col relative"
    >
      {/* Close button - positioned absolutely */}
      <button
        id="drone-sidebar-close-btn"
        onClick={onClose}
        className="absolute top-2 right-2 p-1.5 hover:bg-gray-100 rounded transition-colors z-20"
        title="Close"
        aria-label="Close"
      >
        <X className="w-5 h-5 text-gray-600" />
      </button>

      {/* Tabs */}
      <div id="drone-details-tabs" className="flex border-b border-gray-200">
        <button
          id="drone-details-tab-button"
          onClick={() => onTabChange('details')}
          className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
            activeTab === 'details'
              ? 'text-blue-600 bg-white border-x border-gray-200 relative z-10 -mb-px'
              : 'text-gray-600 hover:text-gray-900 bg-gray-50 shadow-[inset_-4px_0_6px_-2px_rgba(0,0,0,0.12),inset_0_-4px_6px_-2px_rgba(0,0,0,0.08)]'
          }`}
          role="tab"
          aria-selected={activeTab === 'details'}
        >
          Details
        </button>
        <button
          id="drone-export-tab-button"
          onClick={() => onTabChange('export')}
          className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
            activeTab === 'export'
              ? 'text-blue-600 bg-white border-x border-gray-200 relative z-10 -mb-px'
              : 'text-gray-600 hover:text-gray-900 bg-gray-50 shadow-[inset_4px_0_6px_-2px_rgba(0,0,0,0.12),inset_0_-4px_6px_-2px_rgba(0,0,0,0.08)]'
          }`}
          role="tab"
          aria-selected={activeTab === 'export'}
        >
          Export
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-6" role="tabpanel">
        {activeTab === 'details' ? (
          <>
            {/* Project & Plan Info */}
            <section id="drone-details-project-info">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">Project Information</h3>
              <div className="space-y-2.5 text-sm">
                <div>
                  <div className="text-xs text-gray-500 mb-1">Project</div>
                  <div className="font-medium text-gray-900">{project.projectName}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-500 mb-1">Plan / Flight</div>
                  <div className="font-medium text-gray-900">{currentLayer.planName}</div>
                </div>
                <div>
                  <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-1">
                    <Calendar className="w-3.5 h-3.5" />
                    Capture Date
                  </div>
                  <div className="font-medium text-gray-900">
                    {formatDateWithOrdinal(currentLayer.dateCaptured)}
                  </div>
                </div>
                <div>
                  <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-1">
                    <Clock className="w-3.5 h-3.5" />
                    Last Updated
                  </div>
                  <div className="font-medium text-gray-900">
                    {formatDateWithOrdinal(currentLayer.lastUpdated)}
                  </div>
                </div>
              </div>
            </section>

            {/* Access Links */}
            <section id="drone-details-access-links">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">Access Links</h3>
              <div className="space-y-2">
                {/* ArcGIS Online Portal Link */}
                <a
                  id="drone-details-portal-link"
                  href={portalItemUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-3 py-2 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg text-sm text-blue-700 font-medium transition-colors"
                >
                  <ExternalLink className="w-4 h-4 flex-shrink-0" />
                  <span>View in ArcGIS Online</span>
                </a>

                {/* WMTS Service Link - only show if different from portal URL */}
                {wmtsServiceUrl !== portalItemUrl && (
                  <a
                    id="drone-details-wmts-link"
                    href={wmtsServiceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-3 py-2 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-lg text-sm text-gray-700 font-medium transition-colors"
                  >
                    <ExternalLink className="w-4 h-4 flex-shrink-0" />
                    <span>Open WMTS Service</span>
                  </a>
                )}

                {/* Image Collection Link */}
                {currentLayer.imageCollection && (
                  <a
                    id="drone-details-collection-link"
                    href={currentLayer.imageCollection.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-3 py-2 bg-green-50 hover:bg-green-100 border border-green-200 rounded-lg text-sm text-green-700 font-medium transition-colors"
                  >
                    <ExternalLink className="w-4 h-4 flex-shrink-0" />
                    <span>View Image Collection</span>
                  </a>
                )}
              </div>
            </section>

            {/* Technical Details */}
            <section id="drone-details-technical">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">Technical Details</h3>
              <div className="space-y-2.5 text-sm">
                <div>
                  <div className="text-xs text-gray-500 mb-1">Service Type</div>
                  <div className="font-mono text-xs text-gray-900">WMTS (Web Map Tile Service)</div>
                </div>
                <div>
                  <div className="text-xs text-gray-500 mb-1.5">Portal Item ID</div>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 px-2 py-1 bg-gray-100 rounded text-xs font-mono text-gray-800 truncate">
                      {currentLayer.wmts.itemId}
                    </code>
                    <button
                      id="drone-details-copy-itemid"
                      onClick={() => copyToClipboard(currentLayer.wmts.itemId, 'Item ID')}
                      className="p-1.5 hover:bg-gray-100 rounded transition-colors flex-shrink-0"
                      title="Copy Item ID"
                      aria-label="Copy Item ID"
                    >
                      <Copy className="w-3.5 h-3.5 text-gray-600" />
                    </button>
                  </div>
                </div>
                <div>
                  <div className="text-xs text-gray-500 mb-1">Record Type</div>
                  <div className="font-medium text-gray-900">{currentLayer.recordType}</div>
                </div>
                <div>
                  <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-1">
                    <Box className="w-3.5 h-3.5" />
                    Extent (Bounding Box)
                  </div>
                  <div className="font-mono text-xs text-gray-900 break-words">
                    {formatExtent(currentLayer.planGeometry)}
                  </div>
                </div>
              </div>
            </section>

            {/* Project Summary */}
            <section id="drone-details-project-summary">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">Project Summary</h3>
              <div className="space-y-2.5 text-sm">
                <div>
                  <div className="text-xs text-gray-500 mb-1">Total Captures</div>
                  <div className="font-medium text-gray-900">
                    {project.layerCount} {project.layerCount === 1 ? 'capture' : 'captures'}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-gray-500 mb-1">Date Range</div>
                  <div className="font-medium text-gray-900">
                    {formatDateWithOrdinal(project.dateRangeStart)}
                    {project.layerCount > 1 && (
                      <>
                        {' '}<span className="text-gray-400">to</span>{' '}
                        {formatDateWithOrdinal(project.dateRangeEnd)}
                      </>
                    )}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-gray-500 mb-1">Image Collections</div>
                  <div className="font-medium text-gray-900">
                    {project.hasImageCollections ? 'Available' : 'Not available'}
                  </div>
                </div>
              </div>
            </section>

            <div className="pt-2">
              <button
                id="drone-details-go-export"
                onClick={() => onTabChange('export')}
                className="w-full text-sm font-semibold text-blue-600 hover:text-blue-700 hover:underline"
              >
                Go to Export
              </button>
            </div>
          </>
        ) : (
          <section id="drone-export-panel" className="space-y-4">
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-900">
              Exports a metadata manifest (CSV/JSON/GeoJSON) with extents, dates, and access links for all captures in this project.
            </div>

            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Project</span>
                <span className="font-medium text-gray-900">{project.projectName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Captures</span>
                <span className="font-medium text-gray-900">{project.layerCount}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Date range</span>
                <span className="font-medium text-gray-900">
                  {formatDateWithOrdinal(project.dateRangeStart)}
                  {project.layerCount > 1 && (
                    <>
                      {' '}<span className="text-gray-400">to</span>{' '}
                      {formatDateWithOrdinal(project.dateRangeEnd)}
                    </>
                  )}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Image collections</span>
                <span className="font-medium text-gray-900">{project.hasImageCollections ? 'Included if available' : 'None'}</span>
              </div>
            </div>

            <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg text-xs text-gray-700 space-y-1">
              <p>Manifest columns include:</p>
              <ul className="list-disc list-inside space-y-0.5">
                <li>Project & plan names</li>
                <li>Capture & last-updated dates</li>
                <li>WMTS item IDs + service URLs</li>
                <li>Portal URLs for download</li>
                <li>Extent as bbox + WKT</li>
                <li>Image collection links (when available)</li>
              </ul>
            </div>

            <button
              id="drone-export-add-to-cart"
              onClick={onAddToCart}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors shadow-sm"
            >
              <ShoppingCart className="w-5 h-5" />
              <span>Add Project to Cart</span>
            </button>
            <p className="text-xs text-gray-500 text-center">
              Export queue downloads a manifest; imagery is fetched via provided links.
            </p>
          </section>
        )}
      </div>
    </aside>
  );
};

export default DroneImagerySidebar;

