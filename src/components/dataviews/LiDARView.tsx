import React, { useState } from 'react';
import { Database, ExternalLink, Box, Globe } from 'lucide-react';
import DataTypeBackHeader from '../DataTypeBackHeader';

type LiDARViewMode = 'virtual-tour' | 'interactive-3d';

interface LiDARViewProps {
  hasSearched?: boolean;
  onModeChange?: (mode: LiDARViewMode) => void;
  onBack?: () => void;
}

const LiDARView: React.FC<LiDARViewProps> = ({ hasSearched = false, onModeChange, onBack }) => {
  const [viewMode, setViewMode] = useState<LiDARViewMode>('virtual-tour');

  const handleModeChange = (mode: LiDARViewMode) => {
    setViewMode(mode);
    onModeChange?.(mode);
  };
  const lidarDataset = {
    id: 'lidar-2018',
    title: '2018 LiDAR Data',
    description: 'High-resolution 3D point cloud LiDAR data collected in 2018 covering the Jack and Laura Dangermond Preserve. This data provides detailed topographic and vegetation structure information.',
    year: 2018,
    coverage: 'Full Preserve',
    resolution: 'High Resolution',
    format: '3D Point Cloud',
    url: 'https://geoxc-apps.bd.esri.com/DangermondPreserve/VirtualTour/index.html'
  };

  return (
    <div id="lidar-data-view" className="w-sidebar-left-lg xl:w-sidebar-left-xl 2xl:w-sidebar-left-2xl flex-shrink-0 bg-white border-r border-gray-200 flex flex-col">
      {/* Back to Data Types - distinct header bar */}
      {onBack && <DataTypeBackHeader onBack={onBack} />}
      
      {/* Header */}
      <div id="lidar-view-header" className="p-4 border-b border-gray-200">
        <div id="lidar-view-title" className="flex items-center space-x-2">
          <Database className="w-5 h-5 text-blue-600" />
          <h2 className="text-lg font-semibold text-gray-900">LiDAR Data</h2>
        </div>
        <p id="lidar-view-subtitle" className="text-sm text-gray-600 mt-1">
          3D Point Cloud Visualization
        </p>
      </div>

      {/* Mode Toggle */}
      {hasSearched && (
        <div id="lidar-mode-toggle" className="p-4 border-b border-gray-200 bg-gray-50">
          <div className="flex space-x-2">
            <button
              id="virtual-tour-mode-button"
              onClick={() => handleModeChange('virtual-tour')}
              className={`flex-1 flex items-center justify-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                viewMode === 'virtual-tour'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
              }`}
            >
              <Globe className="w-4 h-4" />
              <span>Virtual Tour</span>
            </button>
            <button
              id="interactive-3d-mode-button"
              onClick={() => handleModeChange('interactive-3d')}
              className={`flex-1 flex items-center justify-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                viewMode === 'interactive-3d'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
              }`}
            >
              <Box className="w-4 h-4" />
              <span>Interactive 3D</span>
            </button>
          </div>
          <p id="lidar-mode-description" className="text-xs text-gray-600 mt-2">
            {viewMode === 'virtual-tour' 
              ? 'Explore the preserve with TNC\'s guided virtual tour'
              : 'Interactive 3D map with drawing and measurement tools'}
          </p>
        </div>
      )}

      {/* Content */}
      <div id="lidar-view-content" className="flex-1 overflow-y-auto p-4">
        {!hasSearched ? (
          <div id="lidar-search-prompt" className="flex flex-col items-center justify-center h-full text-center px-4">
            <Database className="w-12 h-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              LiDAR Visualization
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              Click the search button to load the 3D LiDAR viewer and explore high-resolution topographic data.
            </p>
          </div>
        ) : (
          <div id="lidar-dataset-card" className="bg-white border border-gray-200 rounded-lg p-4 hover:border-blue-500 transition-colors">
            {/* Card Header */}
            <div id="lidar-card-header" className="flex items-start justify-between mb-3">
              <div id="lidar-card-title-section" className="flex-1">
                <h3 className="text-base font-semibold text-gray-900 mb-1">
                  {lidarDataset.title}
                </h3>
                <div id="lidar-card-metadata" className="flex items-center space-x-3 text-xs text-gray-600">
                  <span id="lidar-year" className="font-medium">{lidarDataset.year}</span>
                  <span id="lidar-coverage" className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded">
                    {lidarDataset.coverage}
                  </span>
                </div>
              </div>
            </div>

            {/* Card Description */}
            <p id="lidar-card-description" className="text-sm text-gray-700 mb-3 line-clamp-3">
              {lidarDataset.description}
            </p>

            {/* Card Details */}
            <div id="lidar-card-details" className="space-y-2 mb-3">
              <div id="lidar-resolution-row" className="flex items-center justify-between text-xs">
                <span className="text-gray-600">Resolution:</span>
                <span className="text-gray-900 font-medium">{lidarDataset.resolution}</span>
              </div>
              <div id="lidar-format-row" className="flex items-center justify-between text-xs">
                <span className="text-gray-600">Format:</span>
                <span className="text-gray-900 font-medium">{lidarDataset.format}</span>
              </div>
            </div>

            {/* Card Actions */}
            <div id="lidar-card-actions" className="flex space-x-2 pt-3 border-t border-gray-100">
              <a
                id="lidar-external-link"
                href={lidarDataset.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 flex items-center justify-center space-x-2 px-3 py-2 text-sm text-blue-600 border border-blue-600 rounded-md hover:bg-blue-50 transition-colors"
              >
                <ExternalLink className="w-4 h-4" />
                <span>Open in New Tab</span>
              </a>
            </div>

            {/* Info Notice */}
            <div id="lidar-info-notice" className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded text-xs text-blue-800">
              {viewMode === 'virtual-tour' ? (
                <>
                  <strong>Virtual Tour Mode:</strong> Experience TNC's guided tour with pre-defined viewpoints and narration of the preserve's landscape.
                </>
              ) : (
                <>
                  <strong>Interactive 3D Mode:</strong> Full control to navigate, draw geometries, measure distances, and interact with the 3D terrain model.
                </>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Footer Info */}
      {hasSearched && (
        <div id="lidar-view-footer" className="p-4 border-t border-gray-200 bg-gray-50">
          <p className="text-xs text-gray-600 text-center">
            The 3D viewer will load in the map area to the right
          </p>
        </div>
      )}
    </div>
  );
};

export default LiDARView;
export type { LiDARViewMode };

