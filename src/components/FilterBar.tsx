import React, { useState } from 'react';
import { ChevronDown, Database, MapPin, Calendar } from 'lucide-react';
import { FilterState } from '../types';

interface FilterBarProps {
  filters: FilterState;
  onFilterChange: (filters: FilterState) => void;
  resultCount: number;
}

const FilterBar: React.FC<FilterBarProps> = ({ filters, onFilterChange, resultCount }) => {
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);

  const categoryOptions = ['Wildlife'];
  const sourceOptions = ['iNaturalist'];

  const handleClearFilters = () => {
    onFilterChange({
      category: 'Wildlife',
      source: 'iNaturalist',
      spatialFilter: 'Draw Area',
      timeRange: '2020-2024'
    });
  };

  const handleDropdownToggle = (dropdown: string) => {
    setOpenDropdown(openDropdown === dropdown ? null : dropdown);
  };

  const handleCategoryChange = (category: string) => {
    onFilterChange({ ...filters, category });
    setOpenDropdown(null);
  };

  const handleSourceChange = (source: string) => {
    onFilterChange({ ...filters, source });
    setOpenDropdown(null);
  };

  return (
    <div id="filter-bar" className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex space-x-6">
          {/* Data Category Filter */}
          <div className="flex flex-col relative">
            <label className="text-xs font-medium text-gray-500 mb-1">
              DATA CATEGORY
            </label>
            <button 
              id="category-filter"
              onClick={() => handleDropdownToggle('category')}
              className="flex items-center space-x-2 px-3 py-2 border border-gray-300 rounded-md bg-white hover:bg-gray-50"
            >
              <Database className="w-4 h-4 text-gray-400" />
              <span className="text-sm text-black">{filters.category}</span>
              <ChevronDown className={`w-3 h-3 text-gray-400 transition-transform ${openDropdown === 'category' ? 'rotate-180' : ''}`} />
            </button>
            {openDropdown === 'category' && (
              <div className="absolute top-full left-0 mt-1 w-full bg-white border border-gray-200 rounded-md shadow-lg z-10">
                {categoryOptions.map((option) => (
                  <button
                    key={option}
                    onClick={() => handleCategoryChange(option)}
                    className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 first:rounded-t-md last:rounded-b-md"
                  >
                    {option}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Data Source Filter */}
          <div className="flex flex-col relative">
            <label className="text-xs font-medium text-gray-500 mb-1">
              DATA SOURCE
            </label>
            <button 
              id="source-filter"
              onClick={() => handleDropdownToggle('source')}
              className="flex items-center space-x-2 px-3 py-2 border border-gray-300 rounded-md bg-white hover:bg-gray-50"
            >
              <Database className="w-4 h-4 text-gray-400" />
              <span className="text-sm text-black">{filters.source}</span>
              <ChevronDown className={`w-3 h-3 text-gray-400 transition-transform ${openDropdown === 'source' ? 'rotate-180' : ''}`} />
            </button>
            {openDropdown === 'source' && (
              <div className="absolute top-full left-0 mt-1 w-full bg-white border border-gray-200 rounded-md shadow-lg z-10">
                {sourceOptions.map((option) => (
                  <button
                    key={option}
                    onClick={() => handleSourceChange(option)}
                    className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 first:rounded-t-md last:rounded-b-md"
                  >
                    {option}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Spatial Filter */}
          <div className="flex flex-col">
            <label className="text-xs font-medium text-gray-500 mb-1">
              SPATIAL FILTER
            </label>
            <button 
              id="spatial-filter"
              className="flex items-center space-x-2 px-3 py-2 border border-gray-300 rounded-md bg-white hover:bg-gray-50"
            >
              <MapPin className="w-4 h-4 text-gray-400" />
              <span className="text-sm text-black">{filters.spatialFilter}</span>
            </button>
          </div>

          {/* Time Range Filter */}
          <div className="flex flex-col">
            <label className="text-xs font-medium text-gray-500 mb-1">
              TIME RANGE
            </label>
            <button 
              id="time-filter"
              className="flex items-center space-x-2 px-3 py-2 border border-gray-300 rounded-md bg-white hover:bg-gray-50"
            >
              <Calendar className="w-4 h-4 text-gray-400" />
              <span className="text-sm text-black">{filters.timeRange}</span>
              <ChevronDown className="w-3 h-3 text-gray-400" />
            </button>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <span className="text-sm text-gray-500">
            {resultCount} datasets found
          </span>
          <button 
            id="clear-filters-btn"
            onClick={handleClearFilters}
            className="text-sm text-blue-600 hover:text-blue-800"
          >
            Clear Filters
          </button>
        </div>
      </div>
    </div>
  );
};

export default FilterBar;
