import React from 'react';
import { ZoomIn, ZoomOut, Maximize2 } from 'lucide-react';
import { DataLayer } from '../types';
import DataLayersPanel from './DataLayersPanel';

interface MapViewProps {
  dataLayers: DataLayer[];
  onLayerToggle: (layerId: string) => void;
}

const MapView: React.FC<MapViewProps> = ({ dataLayers, onLayerToggle }) => {
  return (
    <div id="map-view" className="flex-1 relative bg-gray-100">
      {/* Map Background - Using a placeholder for now */}
      <div className="w-full h-full bg-gradient-to-br from-green-100 to-blue-100 relative">
        {/* Placeholder map content */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center text-gray-500">
            <div className="text-6xl mb-4">🗺️</div>
            <p className="text-lg font-medium">Interactive Map</p>
            <p className="text-sm">Dangermond Preserve Data Visualization</p>
          </div>
        </div>

        {/* Map Controls */}
        <div id="map-controls" className="absolute top-4 right-4 flex flex-col space-y-2">
          <button 
            id="zoom-in-btn"
            className="w-10 h-10 bg-white rounded-lg shadow-md flex items-center justify-center hover:bg-gray-50"
          >
            <ZoomIn className="w-3.5 h-3.5 text-gray-600" />
          </button>
          <button 
            id="zoom-out-btn"
            className="w-10 h-10 bg-white rounded-lg shadow-md flex items-center justify-center hover:bg-gray-50"
          >
            <ZoomOut className="w-3.5 h-3.5 text-gray-600" />
          </button>
          <button 
            id="fullscreen-btn"
            className="w-10 h-10 bg-white rounded-lg shadow-md flex items-center justify-center hover:bg-gray-50"
          >
            <Maximize2 className="w-3.5 h-3.5 text-gray-600" />
          </button>
        </div>

        {/* Data Layers Panel */}
        <DataLayersPanel 
          dataLayers={dataLayers}
          onLayerToggle={onLayerToggle}
        />
      </div>
    </div>
  );
};

export default MapView;
