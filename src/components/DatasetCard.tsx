import React from 'react';
import { Dataset } from '../types';

interface DatasetCardProps {
  dataset: Dataset;
}

const DatasetCard: React.FC<DatasetCardProps> = ({ dataset }) => {
  return (
    <div 
      id={`dataset-card-${dataset.id}`}
      className="border border-gray-200 rounded-lg p-3 hover:shadow-sm transition-shadow"
    >
      <div className="flex space-x-3">
        {/* Icon */}
        <div className="flex-shrink-0 mt-0.5">
          <div className="w-4 h-4 flex items-center justify-center text-gray-400">
            <span className="text-sm">{dataset.icon}</span>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-medium text-gray-900 mb-1.5 leading-5">
            {dataset.title}
          </h3>
          <p className="text-xs text-gray-600 mb-3 leading-4">
            {dataset.description}
          </p>
          
          {/* Footer */}
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-500">
              {dataset.source} • {dataset.date}
            </span>
            <button 
              id={`preview-btn-${dataset.id}`}
              className="text-xs text-blue-600 hover:text-blue-800"
            >
              Preview
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DatasetCard;
