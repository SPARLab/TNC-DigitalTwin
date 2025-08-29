import React from 'react';
import { DataLayer } from '../types';

interface DataLayersPanelProps {
  dataLayers: DataLayer[];
  onLayerToggle: (layerId: string) => void;
}

const DataLayersPanel: React.FC<DataLayersPanelProps> = ({ 
  dataLayers, 
  onLayerToggle 
}) => {
  return (
    <div 
      id="data-layers-panel"
      className="absolute bottom-4 left-4 bg-white rounded-lg shadow-md p-3 w-36"
    >
      <h4 className="text-sm font-medium text-gray-900 mb-3">Data Layers</h4>
      <div className="space-y-2">
        {dataLayers.map((layer) => (
          <div key={layer.id} className="flex items-center space-x-2">
            <button
              id={`layer-toggle-${layer.id}`}
              onClick={() => onLayerToggle(layer.id)}
              className={`w-3 h-3 rounded-full ${layer.color} ${
                layer.visible ? 'opacity-100' : 'opacity-30'
              }`}
            />
            <span className="text-xs text-gray-600 flex-1">
              {layer.name}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default DataLayersPanel;
