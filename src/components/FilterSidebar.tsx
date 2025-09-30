import React, { useCallback, useMemo } from 'react';
import { Download, Filter, Calendar } from 'lucide-react';
import { formatDateToUS } from '../utils/dateUtils';
import { FilterState } from '../types';

interface FilterSidebarProps {
  filters: FilterState;
  onFilterChange: (filters: FilterState) => void;
  onDownload: (format: 'csv' | 'json' | 'geojson') => void;
}

const FilterSidebar: React.FC<FilterSidebarProps> = ({ 
  filters, 
  onFilterChange, 
  onDownload 
}) => {

  // Note: Taxa visibility state removed as it wasn't being used

  // Memoized derived state - only recalculates when filters change
  // Check if we're in custom date mode by looking at daysBack being undefined
  const isCustomDateRange = useMemo(() => {
    return filters.daysBack === undefined;
  }, [filters.daysBack]);

  // Memoized date validation
  const isDateRangeValid = useMemo(() => {
    if (!filters.startDate || !filters.endDate) return true;
    return new Date(filters.endDate) >= new Date(filters.startDate);
  }, [filters.startDate, filters.endDate]);

  // Handle date changes with proper validation
  const handleDateChange = useCallback((field: 'startDate' | 'endDate', value: string) => {
    
    const newFilters: FilterState = {
      ...filters,
      [field]: value,
      daysBack: undefined // Ensure custom date mode
    };

    // Basic validation before propagating
    if (field === 'startDate' && filters.endDate && value && new Date(value) > new Date(filters.endDate)) {
      // Optionally provide user feedback here
      return;
    }
    
    if (field === 'endDate' && filters.startDate && value && new Date(value) < new Date(filters.startDate)) {
      // Optionally provide user feedback here
      return;
    }

    onFilterChange(newFilters);
  }, [filters, onFilterChange]);

  // Handle time range changes
  const handleTimeRangeChange = useCallback((days: number | string) => {
    
    if (days === 'custom') {
      // Switch to custom mode by clearing daysBack
      onFilterChange({ 
        ...filters, 
        daysBack: undefined
      });
    } else {
      // Switch to a preset day range
      onFilterChange({
        ...filters,
        daysBack: days as number,
        startDate: undefined,
        endDate: undefined
      });
    }
  }, [filters, onFilterChange]);

  // Handle quality grade changes
  const handleQualityGradeChange = useCallback((grade: 'research' | 'needs_id' | 'casual' | undefined) => {
    onFilterChange({ ...filters, qualityGrade: grade });
  }, [filters, onFilterChange]);

  // Note: Taxa change handler removed as it wasn't being used in the UI

  // Clear all filters
  const clearAllFilters = useCallback(() => {
    // We need a default state to reset to. 
    // The parent should be responsible for this, but for now we can define a sensible default.
    onFilterChange({
      ...filters, // Keep existing properties
      qualityGrade: undefined,
      iconicTaxa: [],
      daysBack: 30, // Default to 30 days
      startDate: undefined,
      endDate: undefined
    });
  }, [onFilterChange, filters]);

  // Note: Taxa visibility toggle removed as it wasn't being used

  return (
    <div id="filter-sidebar" className="bg-white w-80 border-l border-gray-200 flex flex-col h-full">
      <div id="filter-sidebar-content" className="flex flex-col h-full">
        {/* Header */}
        <div id="filter-sidebar-header" className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center">
              <Filter className="w-5 h-5 mr-2" />
              Filters
            </h2>
            <div className="flex space-x-2">
              <button
                onClick={clearAllFilters}
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                Clear All
              </button>
              <button
                onClick={() => {
                  onFilterChange({ ...filters, daysBack: undefined });
                }}
                className="text-sm text-green-600 hover:text-green-800"
              >
                Test Custom
              </button>
            </div>
          </div>
        </div>

        {/* Filter Content */}
        <div id="filter-sidebar-body" className="flex-1 overflow-y-auto p-4 space-y-6">
          
          {/* Time Range Filter */}
          <div id="time-range-filter" className="space-y-3">
            <h3 className="text-sm font-medium text-gray-900 flex items-center">
              <Calendar className="w-4 h-4 mr-2" />
              Time Range
            </h3>
            
            <div className="space-y-2">
              {[7, 30, 90, 365].map((days) => (
                <label key={days} className="flex items-center">
                  <input
                    type="radio"
                    name="timeRange"
                    checked={filters.daysBack === days && !isCustomDateRange}
                    onChange={() => handleTimeRangeChange(days)}
                    className="mr-2"
                  />
                  <span className="text-sm text-gray-700">Last {days} days</span>
                </label>
              ))}
              
              <label className="flex items-center">
                <input
                  type="radio"
                  name="timeRange"
                  checked={isCustomDateRange}
                  onChange={() => {
                    handleTimeRangeChange('custom');
                  }}
                  className="mr-2"
                />
                <span className="text-sm text-gray-700">Custom Range</span>
              </label>
            </div>

            {/* Custom Date Range Inputs */}
            {isCustomDateRange && (
              <div id="custom-date-inputs" className="mt-3 p-3 bg-gray-50 rounded-md border border-gray-200">
                <div className="space-y-3">
                  <div>
                    <label htmlFor="start-date-input" className="block text-xs font-medium text-gray-700 mb-1">
                      Start Date
                    </label>
                    <input
                      id="start-date-input"
                      type="date"
                      value={filters.startDate || ''}
                      onInput={(e) => handleDateChange('startDate', e.currentTarget.value)}
                      className="w-full px-2 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label htmlFor="end-date-input" className="block text-xs font-medium text-gray-700 mb-1">
                      End Date
                    </label>
                    <input
                      id="end-date-input"
                      type="date"
                      value={filters.endDate || ''}
                      onInput={(e) => handleDateChange('endDate', e.currentTarget.value)}
                      className="w-full px-2 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  {filters.startDate && filters.endDate && (
                    <div id="date-range-summary" className={`text-xs p-2 rounded border ${
                      isDateRangeValid 
                        ? 'text-gray-600 bg-white border-gray-200' 
                        : 'text-red-600 bg-red-50 border-red-200'
                    }`}>
                      {isDateRangeValid 
                        ? `${formatDateToUS(new Date(filters.startDate))} - ${formatDateToUS(new Date(filters.endDate))}`
                        : 'Invalid date range: end date must be after start date'
                      }
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Quality Grade Filter */}
          <div id="quality-grade-filter" className="space-y-3">
            <h3 className="text-sm font-medium text-gray-900">Quality Grade</h3>
            <div className="space-y-2">
              {[
                { value: undefined, label: 'All Grades' },
                { value: 'research' as const, label: 'Research Grade' },
                { value: 'needs_id' as const, label: 'Needs ID' },
                { value: 'casual' as const, label: 'Casual' }
              ].map((option) => (
                <label key={option.label} className="flex items-center">
                  <input
                    type="radio"
                    name="qualityGrade"
                    checked={filters.qualityGrade === option.value}
                    onChange={() => handleQualityGradeChange(option.value)}
                    className="mr-2"
                  />
                  <span className="text-sm text-gray-700">{option.label}</span>
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div id="filter-sidebar-footer" className="p-4 border-t border-gray-200">
          <div className="space-y-2">
            <h3 className="text-sm font-medium text-gray-900 flex items-center">
              <Download className="w-4 h-4 mr-2" />
              Export Data
            </h3>
            <div className="flex space-x-2">
              {(['csv', 'json', 'geojson'] as const).map((format) => (
                <button
                  key={format}
                  onClick={() => onDownload(format)}
                  className="px-3 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded border"
                >
                  {format.toUpperCase()}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FilterSidebar;