import React from 'react';
import { TNCArcGISItem } from '../services/tncArcGISService';
import { X, Eye, EyeOff, Calendar, User, ExternalLink, Layers } from 'lucide-react';

interface TNCArcGISDetailsSidebarProps {
  item: TNCArcGISItem | null;
  isActive: boolean;
  isReloading?: boolean; // Track if layer is being reloaded (prevents button flicker)
  opacity: number;
  onToggleLayer: () => void;
  onOpacityChange: (opacity: number) => void;
  onLayerSelect?: (layerId: number) => void;
  onClose: () => void;
}

const TNCArcGISDetailsSidebar: React.FC<TNCArcGISDetailsSidebarProps> = ({
  item,
  isActive,
  isReloading = false,
  opacity,
  onToggleLayer,
  onOpacityChange,
  onLayerSelect,
  onClose
}) => {
  if (!item) return null;
  
  // Treat reloading layers as active to prevent button flicker
  const effectivelyActive = isActive || isReloading;

  return (
    <div id="tnc-details-sidebar" className="w-96 bg-white border-l border-gray-200 flex flex-col h-full">
      {/* Header */}
      <div id="tnc-details-header" className="p-4 border-b border-gray-200 flex items-start justify-between">
        <div className="flex-1 min-w-0 pr-3">
          <h2 id="tnc-details-title" className="text-lg font-semibold text-gray-900 break-words">
            {item.title}
          </h2>
          <div id="tnc-details-badges" className="flex flex-wrap gap-2 mt-2">
            <span id="tnc-details-type-badge" className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-700">
              {item.type}
            </span>
            {item.mainCategories.slice(0, 2).map((category, idx) => (
              <span 
                key={category} 
                id={`tnc-details-category-badge-${idx}`}
                className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-700"
              >
                {category}
              </span>
            ))}
          </div>
        </div>
        <button
          id="tnc-details-close-btn"
          onClick={onClose}
          className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0"
          title="Close details"
        >
          <X className="w-5 h-5 text-gray-600" />
        </button>
      </div>

      {/* Content - Scrollable */}
      <div id="tnc-details-content" className="flex-1 overflow-y-auto p-2 space-y-4">
        {/* Description */}
        {item.description && (
          <div id="tnc-details-description-section">
            <h3 id="tnc-details-description-label" className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-2">
              Description
            </h3>
            <div 
              id="tnc-details-description-content"
              className="text-sm text-gray-700 prose prose-sm max-w-none break-words"
              dangerouslySetInnerHTML={{ __html: item.description }}
            />
          </div>
        )}

        {item.snippet && !item.description && (
          <div id="tnc-details-snippet-section">
            <h3 id="tnc-details-snippet-label" className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-2">
              Summary
            </h3>
            <p id="tnc-details-snippet-content" className="text-sm text-gray-700 break-words">
              {item.snippet}
            </p>
          </div>
        )}

        {/* Metadata */}
        <div id="tnc-details-metadata-section">
          <h3 id="tnc-details-metadata-label" className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-2">
            Information
          </h3>
          <div id="tnc-details-metadata-grid" className="space-y-2">
            <div id="tnc-details-owner" className="flex items-center gap-2 text-sm">
              <User className="w-4 h-4 text-gray-400 flex-shrink-0" />
              <span className="text-gray-600">Owner:</span>
              <span className="text-gray-900 font-medium truncate">{item.owner}</span>
            </div>
            <div id="tnc-details-modified" className="flex items-center gap-2 text-sm">
              <Calendar className="w-4 h-4 text-gray-400 flex-shrink-0" />
              <span className="text-gray-600">Modified:</span>
              <span className="text-gray-900 font-medium">{new Date(item.modified).toLocaleDateString()}</span>
            </div>
            <div id="tnc-details-views" className="flex items-center gap-2 text-sm">
              <Eye className="w-4 h-4 text-gray-400 flex-shrink-0" />
              <span className="text-gray-600">Views:</span>
              <span className="text-gray-900 font-medium">{item.num_views.toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* Tags */}
        {item.tags.length > 0 && (
          <div id="tnc-details-tags-section">
            <h3 id="tnc-details-tags-label" className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-2">
              Tags
            </h3>
            <div id="tnc-details-tags-list" className="flex flex-wrap gap-1">
              {item.tags.slice(0, 10).map((tag, index) => (
                <span
                  key={index}
                  id={`tnc-details-tag-${index}`}
                  className="px-2 py-0.5 text-xs bg-gray-100 text-gray-700 rounded break-words"
                >
                  {tag}
                </span>
              ))}
              {item.tags.length > 10 && (
                <span id="tnc-details-tags-more" className="px-2 py-0.5 text-xs text-gray-500">
                  +{item.tags.length - 10} more
                </span>
              )}
            </div>
          </div>
        )}

        {/* Map Layer Controls - Only for MAP_LAYER items */}
        {item.uiPattern === 'MAP_LAYER' && (
          <>
            {/* Layer Selector - Show even with 1 layer */}
            {item.availableLayers && item.availableLayers.length > 0 && onLayerSelect && (
              <div id="tnc-details-layers-section" className="pt-4 border-t border-gray-200 w-full">
                <div className="flex items-center gap-2 mb-3">
                  <Layers className="w-4 h-4 text-gray-700" />
                  <h3 id="tnc-details-layers-label" className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
                    Available Layers ({item.availableLayers.length})
                  </h3>
                </div>
                <div id="tnc-details-layers-list" className="space-y-2 max-h-64 overflow-y-auto scrollbar-thin-no-track">
                  {item.availableLayers.map((layer) => {
                    const isSelected = (item.selectedLayerId ?? 0) === layer.id;
                    return (
                      <button
                        key={layer.id}
                        id={`tnc-details-layer-${layer.id}`}
                        onClick={() => onLayerSelect(layer.id)}
                        className={`w-full text-left px-3 py-2.5 rounded-lg text-sm transition-all border-2 ${
                          isSelected 
                            ? 'bg-blue-200 border-blue-700 shadow-md' 
                            : 'bg-gray-50 border-gray-200 hover:bg-gray-100 hover:border-gray-300'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <div className={`font-medium truncate ${isSelected ? 'text-gray-900' : 'text-gray-900'}`}>
                              {layer.name}
                            </div>
                            {layer.type && (
                              <div className={`text-xs mt-0.5 ${isSelected ? 'text-gray-600' : 'text-gray-500'}`}>
                                {layer.type}
                              </div>
                            )}
                            {layer.geometryType && (
                              <div className={`text-xs mt-0.5 ${isSelected ? 'text-gray-500' : 'text-gray-400'}`}>
                                {layer.geometryType.replace('esriGeometry', '')}
                              </div>
                            )}
                          </div>
                          {isSelected && (
                            <div className="flex-shrink-0 text-white font-bold">✓</div>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Opacity Control */}
            <div id="tnc-details-opacity-section" className="pt-4 border-t border-gray-200">
              <div className="flex items-center justify-between mb-2">
                <label id="tnc-details-opacity-label" className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
                  Layer Opacity
                </label>
                <span id="tnc-details-opacity-value" className="text-sm text-gray-600 font-medium">
                  {opacity}%
                </span>
              </div>
              <input
                id="tnc-details-opacity-slider"
                type="range"
                min="0"
                max="100"
                value={opacity}
                onChange={(e) => onOpacityChange(Number(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
              />
            </div>

            {/* Toggle Layer Visibility */}
            <div id="tnc-details-toggle-section" className="pt-4">
              <button
                id="tnc-details-toggle-btn"
                onClick={onToggleLayer}
                className={`w-full px-4 py-3 rounded-lg font-medium text-sm transition-all flex items-center justify-center gap-2 ${
                  effectivelyActive
                    ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-md'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-300'
                }`}
              >
                {effectivelyActive ? (
                  <>
                    <Eye className="w-5 h-5" />
                    Hide from Map
                  </>
                ) : (
                  <>
                    <EyeOff className="w-5 h-5" />
                    Show on Map
                  </>
                )}
              </button>
            </div>
          </>
        )}

        {/* External Link */}
        <div id="tnc-details-link-section" className="pt-4 border-t border-gray-200">
          <a
            id="tnc-details-link-btn"
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full px-4 py-3 bg-gray-50 hover:bg-gray-100 border border-gray-300 rounded-lg font-medium text-sm transition-colors flex items-center justify-center gap-2 text-gray-700"
          >
            Open in ArcGIS Hub
            <ExternalLink className="w-4 h-4" />
          </a>
        </div>
      </div>
    </div>
  );
};

export default TNCArcGISDetailsSidebar;

