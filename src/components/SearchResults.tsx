import React from 'react';
import { List, Grid } from 'lucide-react';
import { Dataset } from '../types';
import DatasetCard from './DatasetCard';

interface SearchResultsProps {
  datasets: Dataset[];
  viewMode: 'list' | 'grid';
  onViewModeChange: (mode: 'list' | 'grid') => void;
}

const SearchResults: React.FC<SearchResultsProps> = ({ 
  datasets, 
  viewMode, 
  onViewModeChange 
}) => {
  return (
    <div id="search-results" className="bg-white w-sidebar-left-lg xl:w-sidebar-left-xl 2xl:w-sidebar-left-2xl border-r border-gray-200 h-full overflow-hidden">
      <div className="p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-medium text-gray-900">Search Results</h2>
          <div className="flex space-x-1">
            <button
              id="list-view-btn"
              onClick={() => onViewModeChange('list')}
              className={`p-2 rounded ${
                viewMode === 'list' 
                  ? 'bg-gray-100 text-gray-900' 
                  : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              <List className="w-3.5 h-3.5" />
            </button>
            <button
              id="grid-view-btn"
              onClick={() => onViewModeChange('grid')}
              className={`p-2 rounded ${
                viewMode === 'grid' 
                  ? 'bg-gray-100 text-gray-900' 
                  : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              <Grid className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Dataset List */}
        <div className="space-y-3 overflow-y-auto max-h-[calc(100vh-200px)]">
          {datasets.map((dataset) => (
            <DatasetCard key={dataset.id} dataset={dataset} />
          ))}
        </div>
      </div>
    </div>
  );
};

export default SearchResults;
