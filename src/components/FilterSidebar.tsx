import React, { useState, useEffect } from 'react';
import { Download, Filter, Calendar, Eye, EyeOff } from 'lucide-react';

interface FilterSidebarProps {
  currentDaysBack?: number;
  onFilterChange: (filters: {
    qualityGrade?: 'research' | 'needs_id' | 'casual';
    iconicTaxa?: string[];
    daysBack?: number;
    startDate?: string;
    endDate?: string;
  }) => void;
  onDownload: (format: 'csv' | 'json' | 'geojson') => void;
}

const FilterSidebar: React.FC<FilterSidebarProps> = ({ currentDaysBack = 30, onFilterChange, onDownload }) => {
  const [activeFilters, setActiveFilters] = useState({
    qualityGrade: undefined as 'research' | 'needs_id' | 'casual' | undefined,
    iconicTaxa: [] as string[],
    daysBack: currentDaysBack as number | undefined,
    startDate: undefined as string | undefined,
    endDate: undefined as string | undefined
  });

  const [isCustomDateRange, setIsCustomDateRange] = useState(false);

  const [visibleTaxa, setVisibleTaxa] = useState<Set<string>>(new Set());

  const iconicTaxaOptions = [
    { value: 'Aves', label: 'Birds', icon: '🐦', color: '#4A90E2' },
    { value: 'Mammalia', label: 'Mammals', icon: '🦌', color: '#8B4513' },
    { value: 'Reptilia', label: 'Reptiles', icon: '🦎', color: '#228B22' },
    { value: 'Amphibia', label: 'Amphibians', icon: '🐸', color: '#32CD32' },
    { value: 'Actinopterygii', label: 'Fish', icon: '🐟', color: '#1E90FF' },
    { value: 'Insecta', label: 'Insects', icon: '🦋', color: '#FFD700' },
    { value: 'Arachnida', label: 'Spiders', icon: '🕷️', color: '#800080' },
    { value: 'Plantae', label: 'Plants', icon: '🌱', color: '#228B22' },
    { value: 'Mollusca', label: 'Mollusks', icon: '🐚', color: '#DDA0DD' }
  ];

  const qualityGradeOptions = [
    { value: 'research', label: 'Research Grade', description: 'Verified identifications' },
    { value: 'needs_id', label: 'Needs ID', description: 'Requires identification help' },
    { value: 'casual', label: 'Casual', description: 'All other observations' }
  ];

  const timeRangeOptions = [
    { value: 7, label: 'Last 7 days' },
    { value: 30, label: 'Last 30 days' },
    { value: 90, label: 'Last 3 months' },
    { value: 365, label: 'Last year' },
    { value: 1825, label: 'Last 5 years' }, // 365 * 5 = 1825 days
    { value: 'custom', label: 'Custom date range' }
  ];

  const handleQualityGradeChange = (grade: 'research' | 'needs_id' | 'casual' | undefined) => {
    const newFilters = { ...activeFilters, qualityGrade: grade };
    setActiveFilters(newFilters);
    onFilterChange(newFilters);
  };

  const handleTaxaToggle = (taxon: string) => {
    const newTaxa = activeFilters.iconicTaxa.includes(taxon)
      ? activeFilters.iconicTaxa.filter(t => t !== taxon)
      : [...activeFilters.iconicTaxa, taxon];
    
    const newFilters = { ...activeFilters, iconicTaxa: newTaxa };
    setActiveFilters(newFilters);
    onFilterChange(newFilters);
  };

  const handleTimeRangeChange = (days: number | string) => {
    if (days === 'custom') {
      setIsCustomDateRange(true);
      // Clear daysBack when switching to custom range
      const newFilters = { 
        ...activeFilters, 
        daysBack: undefined,
        startDate: activeFilters.startDate,
        endDate: activeFilters.endDate
      };
      setActiveFilters(newFilters);
      onFilterChange(newFilters);
    } else {
      setIsCustomDateRange(false);
      const newFilters = { 
        ...activeFilters, 
        daysBack: days as number,
        startDate: undefined,
        endDate: undefined
      };
      setActiveFilters(newFilters);
      onFilterChange(newFilters);
    }
  };

  const handleCustomDateChange = (startDate?: string, endDate?: string) => {
    // Basic validation: ensure end date is not before start date
    if (startDate && endDate && new Date(endDate) < new Date(startDate)) {
      // If end date is before start date, don't update
      return;
    }
    
    const newFilters = { 
      ...activeFilters, 
      startDate, 
      endDate,
      daysBack: undefined // Clear daysBack when using custom dates
    };
    setActiveFilters(newFilters);
    onFilterChange(newFilters);
  };

  const isDateRangeValid = () => {
    if (!activeFilters.startDate || !activeFilters.endDate) return true;
    return new Date(activeFilters.endDate) >= new Date(activeFilters.startDate);
  };

  const toggleTaxaVisibility = (taxon: string) => {
    const newVisible = new Set(visibleTaxa);
    if (newVisible.has(taxon)) {
      newVisible.delete(taxon);
    } else {
      newVisible.add(taxon);
    }
    setVisibleTaxa(newVisible);
  };

  // Sync with external daysBack changes
  useEffect(() => {
    if (currentDaysBack !== activeFilters.daysBack) {
      setActiveFilters(prev => ({ ...prev, daysBack: currentDaysBack }));
    }
  }, [currentDaysBack]);

  const clearAllFilters = () => {
    const newFilters = {
      qualityGrade: undefined,
      iconicTaxa: [],
      daysBack: currentDaysBack,
      startDate: undefined,
      endDate: undefined
    };
    setActiveFilters(newFilters);
    setIsCustomDateRange(false);
    onFilterChange(newFilters);
  };

  return (
    <div id="filter-sidebar" className="bg-white w-80 border-l border-gray-200 flex flex-col h-full">
      <div id="filter-sidebar-content" className="flex flex-col h-full">
        {/* Header */}
        <div id="filter-sidebar-header" className="flex items-center justify-between p-4 pb-2 flex-shrink-0">
          <div id="filter-sidebar-title-container" className="flex items-center space-x-2">
            <Filter id="filter-sidebar-icon" className="w-4 h-4 text-gray-600" />
            <h2 id="filter-sidebar-title" className="text-base font-medium text-gray-900">Filters & Export</h2>
          </div>
        </div>

        <div id="filter-sections-container" className="flex-1 px-4 pb-4 space-y-6 overflow-y-auto">
          {/* Quality Grade Filter */}
          <div id="quality-grade-section">
            <h3 id="quality-grade-title" className="text-sm font-medium text-gray-900 mb-3">Quality Grade</h3>
            <div className="space-y-2">
              <button
                onClick={() => handleQualityGradeChange(undefined)}
                className={`w-full text-left p-2 rounded-md text-sm transition-colors ${
                  activeFilters.qualityGrade === undefined
                    ? 'bg-blue-50 text-blue-700 border border-blue-200'
                    : 'hover:bg-gray-50 border border-gray-200'
                }`}
              >
                All Quality Grades
              </button>
              {qualityGradeOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => handleQualityGradeChange(option.value as any)}
                  className={`w-full text-left p-2 rounded-md text-sm transition-colors ${
                    activeFilters.qualityGrade === option.value
                      ? 'bg-blue-50 text-blue-700 border border-blue-200'
                      : 'hover:bg-gray-50 border border-gray-200'
                  }`}
                >
                  <div className="font-medium">{option.label}</div>
                  <div className="text-xs text-gray-500 mt-0.5">{option.description}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Time Range Filter */}
          <div id="time-range-section">
            <h3 id="time-range-title" className="text-sm font-medium text-gray-900 mb-3">Time Range</h3>
            <div className="space-y-2">
              {timeRangeOptions.map((option) => (
                <button
                  key={option.value}
                  id={`time-range-${option.value}`}
                  onClick={() => handleTimeRangeChange(option.value)}
                  className={`w-full text-left p-2 rounded-md text-sm transition-colors flex items-center space-x-2 ${
                    (option.value === 'custom' && isCustomDateRange) || 
                    (option.value !== 'custom' && activeFilters.daysBack === option.value)
                      ? 'bg-blue-50 text-blue-700 border border-blue-200'
                      : 'hover:bg-gray-50 border border-gray-200'
                  }`}
                >
                  <Calendar className="w-3 h-3" />
                  <span>{option.label}</span>
                </button>
              ))}
              
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
                        value={activeFilters.startDate || ''}
                        onChange={(e) => handleCustomDateChange(e.target.value, activeFilters.endDate)}
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
                        value={activeFilters.endDate || ''}
                        onChange={(e) => handleCustomDateChange(activeFilters.startDate, e.target.value)}
                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    {activeFilters.startDate && activeFilters.endDate && (
                      <div id="date-range-summary" className={`text-xs p-2 rounded border ${
                        isDateRangeValid() 
                          ? 'text-gray-600 bg-white' 
                          : 'text-red-600 bg-red-50 border-red-200'
                      }`}>
                        {isDateRangeValid() ? (
                          <>Range: {new Date(activeFilters.startDate).toLocaleDateString()} - {new Date(activeFilters.endDate).toLocaleDateString()}</>
                        ) : (
                          <>⚠️ End date must be after start date</>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Taxonomic Groups */}
          <div>
            <h3 className="text-sm font-medium text-gray-900 mb-3">Taxonomic Groups</h3>
            <div className="space-y-2">
              {iconicTaxaOptions.map((taxon) => (
                <div key={taxon.value} className="flex items-center justify-between">
                  <button
                    onClick={() => handleTaxaToggle(taxon.value)}
                    className={`flex-1 flex items-center space-x-2 p-2 rounded-md text-sm transition-colors ${
                      activeFilters.iconicTaxa.includes(taxon.value)
                        ? 'bg-blue-50 text-blue-700 border border-blue-200'
                        : 'hover:bg-gray-50 border border-gray-200'
                    }`}
                  >
                    <span>{taxon.icon}</span>
                    <span className="flex-1 text-left">{taxon.label}</span>
                    {activeFilters.iconicTaxa.includes(taxon.value) && (
                      <div 
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: taxon.color }}
                      />
                    )}
                  </button>
                  <button
                    onClick={() => toggleTaxaVisibility(taxon.value)}
                    className="ml-2 p-1 text-gray-400 hover:text-gray-600"
                    title={visibleTaxa.has(taxon.value) ? 'Hide on map' : 'Show on map'}
                  >
                    {visibleTaxa.has(taxon.value) ? (
                      <Eye className="w-3 h-3" />
                    ) : (
                      <EyeOff className="w-3 h-3" />
                    )}
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Clear Filters */}
          <div>
            <button
              onClick={clearAllFilters}
              className="w-full p-2 text-sm text-gray-600 hover:text-gray-800 border border-gray-200 rounded-md hover:bg-gray-50 transition-colors"
            >
              Clear All Filters
            </button>
          </div>

          {/* Export Options */}
          <div id="export-section" className="border-t border-gray-200 pt-6">
            <h3 id="export-title" className="text-sm font-medium text-gray-900 mb-3 flex items-center space-x-2">
              <Download id="export-icon" className="w-4 h-4" />
              <span id="export-title-text">Export Data</span>
            </h3>
            <div id="export-buttons-container" className="space-y-2">
              <button
                id="export-csv-button"
                onClick={() => onDownload('csv')}
                className="w-full p-2 text-sm text-left border border-gray-200 rounded-md hover:bg-gray-50 transition-colors"
              >
                <div id="export-csv-title" className="font-medium">CSV Format</div>
                <div id="export-csv-description" className="text-xs text-gray-500">Spreadsheet compatible</div>
              </button>
              <button
                id="export-json-button"
                onClick={() => onDownload('json')}
                className="w-full p-2 text-sm text-left border border-gray-200 rounded-md hover:bg-gray-50 transition-colors"
              >
                <div id="export-json-title" className="font-medium">JSON Format</div>
                <div id="export-json-description" className="text-xs text-gray-500">Raw data structure</div>
              </button>
              <button
                id="export-geojson-button"
                onClick={() => onDownload('geojson')}
                className="w-full p-2 text-sm text-left border border-gray-200 rounded-md hover:bg-gray-50 transition-colors"
              >
                <div id="export-geojson-title" className="font-medium">GeoJSON Format</div>
                <div id="export-geojson-description" className="text-xs text-gray-500">Geographic data for GIS</div>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FilterSidebar;

