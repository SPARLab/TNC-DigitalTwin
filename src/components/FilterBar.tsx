import React, { useState } from 'react';
import { ChevronDown, Database, MapPin, Calendar, Search } from 'lucide-react';
import { FilterState } from '../types';
import { formatDateRange, formatDateRangeCompact, getTimeRangeOptions } from '../utils/dateUtils';

interface FilterBarProps {
  filters: FilterState;
  onFilterChange: (filters: FilterState) => void;
  onSearch?: () => void;
  resultCount: number;
  isSearching?: boolean;
}

const FilterBar: React.FC<FilterBarProps> = ({ filters, onFilterChange, onSearch, resultCount, isSearching = false }) => {
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);

  const categoryOptions = ['Wildlife'];
  const sourceOptions = ['iNaturalist'];
  const timeRangeOptions = getTimeRangeOptions();

  const handleClearFilters = () => {
    onFilterChange({
      category: 'Wildlife',
      source: 'iNaturalist',
      spatialFilter: 'Draw Area',
      timeRange: formatDateRangeCompact(30),
      daysBack: 30
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

  const handleTimeRangeChange = (daysBack: number) => {
    onFilterChange({ 
      ...filters, 
      timeRange: formatDateRangeCompact(daysBack),
      daysBack 
    });
    setOpenDropdown(null);
  };

  return (
    <div id="filter-bar" className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex space-x-6">
          {/* Data Category Filter */}
          <div id="category-filter-container" className="flex flex-col relative">
            <label id="category-filter-label" className="text-xs font-medium text-gray-500 mb-1">
              DATA CATEGORY
            </label>
            <button 
              id="category-filter-button"
              onClick={() => handleDropdownToggle('category')}
              className="flex items-center space-x-2 px-3 py-2 border border-gray-300 rounded-md bg-white hover:bg-gray-50"
            >
              <Database id="category-filter-icon" className="w-4 h-4 text-gray-400" />
              <span id="category-filter-text" className="text-sm text-black">{filters.category}</span>
              <ChevronDown id="category-filter-chevron" className={`w-3 h-3 text-gray-400 transition-transform ${openDropdown === 'category' ? 'rotate-180' : ''}`} />
            </button>
            {openDropdown === 'category' && (
              <div id="category-filter-dropdown" className="absolute top-full left-0 mt-1 w-full bg-white border border-gray-200 rounded-md shadow-lg z-10">
                {categoryOptions.map((option) => (
                  <button
                    key={option}
                    id={`category-option-${option.toLowerCase().replace(/\s+/g, '-')}`}
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
          <div id="source-filter-container" className="flex flex-col relative">
            <label id="source-filter-label" className="text-xs font-medium text-gray-500 mb-1">
              DATA SOURCE
            </label>
            <button 
              id="source-filter-button"
              onClick={() => handleDropdownToggle('source')}
              className="flex items-center space-x-2 px-3 py-2 border border-gray-300 rounded-md bg-white hover:bg-gray-50"
            >
              <Database id="source-filter-icon" className="w-4 h-4 text-gray-400" />
              <span id="source-filter-text" className="text-sm text-black">{filters.source}</span>
              <ChevronDown id="source-filter-chevron" className={`w-3 h-3 text-gray-400 transition-transform ${openDropdown === 'source' ? 'rotate-180' : ''}`} />
            </button>
            {openDropdown === 'source' && (
              <div id="source-filter-dropdown" className="absolute top-full left-0 mt-1 w-full bg-white border border-gray-200 rounded-md shadow-lg z-10">
                {sourceOptions.map((option) => (
                  <button
                    key={option}
                    id={`source-option-${option.toLowerCase().replace(/\s+/g, '-')}`}
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
          <div id="spatial-filter-container" className="flex flex-col">
            <label id="spatial-filter-label" className="text-xs font-medium text-gray-500 mb-1">
              SPATIAL FILTER
            </label>
            <button 
              id="spatial-filter-button"
              className="flex items-center space-x-2 px-3 py-2 border border-gray-300 rounded-md bg-white hover:bg-gray-50"
            >
              <MapPin id="spatial-filter-icon" className="w-4 h-4 text-gray-400" />
              <span id="spatial-filter-text" className="text-sm text-black">{filters.spatialFilter}</span>
            </button>
          </div>

          {/* Time Range Filter with Search Button */}
          <div id="time-range-filter-container" className="flex flex-col relative">
            <label id="time-range-filter-label" className="text-xs font-medium text-gray-500 mb-1">
              TIME RANGE
            </label>
            <div id="time-range-controls" className="flex space-x-2">
              <button 
                id="time-range-filter-button"
                onClick={() => handleDropdownToggle('timeRange')}
                className="flex items-center space-x-2 px-3 py-2 border border-gray-300 rounded-md bg-white hover:bg-gray-50 flex-1"
                title={filters.daysBack ? formatDateRange(filters.daysBack) : 'Select time range'}
              >
                <Calendar id="time-range-filter-icon" className="w-4 h-4 text-gray-400" />
                <span id="time-range-filter-text" className="text-sm text-black">{filters.timeRange}</span>
                <ChevronDown id="time-range-filter-chevron" className={`w-3 h-3 text-gray-400 transition-transform ${openDropdown === 'timeRange' ? 'rotate-180' : ''}`} />
              </button>
              
              {/* Search Button */}
              <button
                id="observations-search-button"
                onClick={onSearch}
                disabled={isSearching}
                className={`px-3 py-2 border border-gray-300 rounded-md transition-colors ${
                  isSearching 
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
                title="Search for observations in selected time range"
              >
                {isSearching ? (
                  <div id="search-loading-spinner" className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-400"></div>
                ) : (
                  <Search id="search-button-icon" className="w-4 h-4" />
                )}
              </button>
            </div>
            
            {openDropdown === 'timeRange' && (
              <div id="time-range-dropdown" className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-md shadow-lg z-10 w-64">
                {timeRangeOptions.map((option) => (
                  <button
                    key={option.value}
                    id={`time-range-option-${option.value}-days`}
                    onClick={() => handleTimeRangeChange(option.value)}
                    className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 first:rounded-t-md last:rounded-b-md"
                    title={formatDateRange(option.value)}
                  >
                    <div id={`time-range-option-${option.value}-label`} className="font-medium">{option.label}</div>
                    <div id={`time-range-option-${option.value}-dates`} className="text-xs text-gray-500 mt-0.5 truncate">
                      {formatDateRange(option.value)}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div id="filter-bar-right" className="flex items-center space-x-4">
          <span id="results-count" className="text-sm text-gray-500">
            {resultCount} datasets found
          </span>
          <button 
            id="clear-filters-button"
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
