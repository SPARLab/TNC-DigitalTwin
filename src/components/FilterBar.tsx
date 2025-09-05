import React, { useState, useEffect } from 'react';
import { ChevronDown, Database, MapPin, Calendar, Search } from 'lucide-react';
import { FilterState } from '../types';
import { formatDateRange, formatDateRangeCompact, getTimeRangeOptions } from '../utils/dateUtils';
import { DATA_CATEGORIES, CATEGORY_DATA_SOURCES, SPATIAL_FILTERS } from '../utils/constants';

interface FilterBarProps {
  filters: FilterState;
  onFilterChange: (filters: FilterState) => void;
  onSearch?: () => void;
  resultCount: number;
  isSearching?: boolean;
}

const FilterBar: React.FC<FilterBarProps> = ({ filters, onFilterChange, onSearch, resultCount, isSearching = false }) => {
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [isCustomDateRange, setIsCustomDateRange] = useState(false);

  const categoryOptions = DATA_CATEGORIES;
  // Get available sources for the current category
  const sourceOptions = CATEGORY_DATA_SOURCES[filters.category as keyof typeof CATEGORY_DATA_SOURCES] || [];
  const timeRangeOptions = getTimeRangeOptions();

  // Sync isCustomDateRange with filters state
  useEffect(() => {
    setIsCustomDateRange(!!(filters.startDate && filters.endDate));
  }, [filters.startDate, filters.endDate]);

  const handleClearFilters = () => {
    setIsCustomDateRange(false);
    onFilterChange({
      category: 'Wildlife',
      source: 'iNaturalist (Public API)',
      spatialFilter: 'Dangermond + Margin',
      timeRange: formatDateRangeCompact(30),
      daysBack: 30,
      startDate: undefined,
      endDate: undefined
    });
  };

  const handleDropdownToggle = (dropdown: string) => {
    setOpenDropdown(openDropdown === dropdown ? null : dropdown);
  };

  const handleCategoryChange = (category: string) => {
    // Auto-select the first available source for the new category
    const availableSources = CATEGORY_DATA_SOURCES[category as keyof typeof CATEGORY_DATA_SOURCES] || [];
    const newSource = availableSources[0] || filters.source;
    
    onFilterChange({ 
      ...filters, 
      category,
      source: newSource
    });
    setOpenDropdown(null);
  };

  const handleSourceChange = (source: string) => {
    onFilterChange({ ...filters, source });
    setOpenDropdown(null);
  };

  const handleSpatialFilterChange = (spatialFilter: string) => {
    onFilterChange({ ...filters, spatialFilter });
    setOpenDropdown(null);
  };

  const handleTimeRangeChange = (daysBack: number | string) => {
    if (daysBack === 'custom') {
      setIsCustomDateRange(true);
      // Don't close dropdown for custom range to show date inputs
      return;
    } else {
      setIsCustomDateRange(false);
      onFilterChange({ 
        ...filters, 
        timeRange: formatDateRangeCompact(daysBack as number),
        daysBack: daysBack as number,
        startDate: undefined,
        endDate: undefined
      });
      setOpenDropdown(null);
    }
  };

  const handleCustomDateChange = (startDate?: string, endDate?: string) => {
    // Basic validation: ensure end date is not before start date
    if (startDate && endDate && new Date(endDate) < new Date(startDate)) {
      return;
    }
    
    if (startDate && endDate) {
      const customTimeRange = `${new Date(startDate).toLocaleDateString()} - ${new Date(endDate).toLocaleDateString()}`;
      onFilterChange({
        ...filters,
        timeRange: customTimeRange,
        daysBack: undefined,
        startDate,
        endDate
      });
    } else {
      onFilterChange({
        ...filters,
        startDate,
        endDate
      });
    }
  };

  const isDateRangeValid = () => {
    if (!filters.startDate || !filters.endDate) return true;
    return new Date(filters.endDate) >= new Date(filters.startDate);
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
          <div id="spatial-filter-container" className="flex flex-col relative">
            <label id="spatial-filter-label" className="text-xs font-medium text-gray-500 mb-1">
              SPATIAL FILTER
            </label>
            <button 
              id="spatial-filter-button"
              onClick={() => handleDropdownToggle('spatialFilter')}
              className="flex items-center space-x-2 px-3 py-2 border border-gray-300 rounded-md bg-white hover:bg-gray-50"
            >
              <MapPin id="spatial-filter-icon" className="w-4 h-4 text-gray-400" />
              <span id="spatial-filter-text" className="text-sm text-black">{filters.spatialFilter}</span>
              <ChevronDown id="spatial-filter-chevron" className={`w-3 h-3 text-gray-400 transition-transform ${openDropdown === 'spatialFilter' ? 'rotate-180' : ''}`} />
            </button>
            
            {/* Spatial Filter Dropdown */}
            {openDropdown === 'spatialFilter' && (
              <div id="spatial-filter-dropdown" className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-300 rounded-md shadow-lg z-20">
                {SPATIAL_FILTERS.map((option) => (
                  <button
                    key={option}
                    id={`spatial-filter-option-${option.toLowerCase().replace(/\s+/g, '-')}`}
                    onClick={() => handleSpatialFilterChange(option)}
                    className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-50 ${
                      filters.spatialFilter === option ? 'bg-blue-50 text-blue-700' : 'text-gray-700'
                    }`}
                  >
                    {option}
                  </button>
                ))}
              </div>
            )}
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
                title={isSearching 
                  ? "Searching... This may take time due to API rate limits" 
                  : "Search for data from selected source"
                }
              >
                {isSearching ? (
                  <div id="search-loading-spinner" className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-400"></div>
                ) : (
                  <Search id="search-button-icon" className="w-4 h-4" />
                )}
              </button>
            </div>
            
            {openDropdown === 'timeRange' && (
              <div id="time-range-dropdown" className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-md shadow-lg z-10 w-80">
                {timeRangeOptions.map((option) => (
                  <button
                    key={option.value}
                    id={`time-range-option-${option.value}-days`}
                    onClick={() => handleTimeRangeChange(option.value)}
                    className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-50 ${
                      filters.daysBack === option.value ? 'bg-blue-50 text-blue-700' : ''
                    }`}
                    title={formatDateRange(option.value)}
                  >
                    <div id={`time-range-option-${option.value}-label`} className="font-medium">{option.label}</div>
                    <div id={`time-range-option-${option.value}-dates`} className="text-xs text-gray-500 mt-0.5 truncate">
                      {formatDateRange(option.value)}
                    </div>
                  </button>
                ))}
                
                {/* Custom Date Range Option */}
                <button
                  id="time-range-option-custom"
                  onClick={() => handleTimeRangeChange('custom')}
                  className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-50 border-t border-gray-100 ${
                    isCustomDateRange ? 'bg-blue-50 text-blue-700' : ''
                  }`}
                >
                  <div className="font-medium">Custom date range</div>
                  <div className="text-xs text-gray-500 mt-0.5">Select specific start and end dates</div>
                </button>
                
                {/* Custom Date Range Inputs */}
                {isCustomDateRange && (
                  <div id="custom-date-inputs-header" className="p-3 bg-gray-50 border-t border-gray-200">
                    <div className="space-y-3">
                      <div>
                        <label htmlFor="header-start-date-input" className="block text-xs font-medium text-gray-700 mb-1">
                          Start Date
                        </label>
                        <input
                          id="header-start-date-input"
                          type="date"
                          value={filters.startDate || ''}
                          onChange={(e) => handleCustomDateChange(e.target.value, filters.endDate)}
                          className="w-full px-2 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                      <div>
                        <label htmlFor="header-end-date-input" className="block text-xs font-medium text-gray-700 mb-1">
                          End Date
                        </label>
                        <input
                          id="header-end-date-input"
                          type="date"
                          value={filters.endDate || ''}
                          onChange={(e) => handleCustomDateChange(filters.startDate, e.target.value)}
                          className="w-full px-2 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                      {filters.startDate && filters.endDate && (
                        <div id="header-date-range-summary" className={`text-xs p-2 rounded border ${
                          isDateRangeValid() 
                            ? 'text-gray-600 bg-white' 
                            : 'text-red-600 bg-red-50 border-red-200'
                        }`}>
                          {isDateRangeValid() ? (
                            <>Range: {new Date(filters.startDate).toLocaleDateString()} - {new Date(filters.endDate).toLocaleDateString()}</>
                          ) : (
                            <>⚠️ End date must be after start date</>
                          )}
                        </div>
                      )}
                      <div className="flex justify-end space-x-2 pt-2">
                        <button
                          id="header-custom-date-cancel"
                          onClick={() => {
                            setIsCustomDateRange(false);
                            setOpenDropdown(null);
                          }}
                          className="px-3 py-1 text-xs text-gray-600 hover:text-gray-800 border border-gray-300 rounded hover:bg-gray-50"
                        >
                          Cancel
                        </button>
                        <button
                          id="header-custom-date-apply"
                          onClick={() => setOpenDropdown(null)}
                          disabled={!isDateRangeValid() || !filters.startDate || !filters.endDate}
                          className="px-3 py-1 text-xs text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed rounded"
                        >
                          Apply
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <div id="filter-bar-right" className="flex items-center space-x-4">
          <span id="results-count" className="text-sm text-gray-500">
            {resultCount} records found
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
