import React, { useState, useMemo, useRef, useEffect } from 'react';
import { 
  ChevronDown, 
  Database, 
  MapPin, 
  Calendar, 
  Search,
  TreeDeciduous,
  Bug,
  Radio,
  Globe,
  CloudRain,
  Droplets,
  Mountain,
  Waves,
  Flame,
  Truck,
  ShieldAlert,
  Tag,
  Satellite,
  TriangleRight
} from 'lucide-react';
import { FilterState } from '../types';
import { formatDateRange, formatDateRangeCompact, getTimeRangeOptions, formatDateToUS } from '../utils/dateUtils';
import { DATA_CATEGORIES, SPATIAL_FILTERS, ENABLE_TAGS_FILTER } from '../utils/constants';
import { THEMES } from '../utils/themes';
import categoryMappings from '../data-sources/tnc-arcgis/category_mappings.json';

interface FilterSubheaderProps {
  filters: FilterState;
  onFilterChange: (filters: FilterState) => void;
  onSearch?: () => void;
  resultCount: number;
  isSearching?: boolean;
  theme: string;
  /** When true, shows a yellow border animation to prompt user to set filters */
  needsFilterHighlight?: boolean;
}

const FilterSubheader: React.FC<FilterSubheaderProps> = ({ filters, onFilterChange, onSearch, resultCount: _resultCount, isSearching = false, theme, needsFilterHighlight = false }) => {
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const currentTheme = THEMES[theme] || THEMES.coastal;

  // Refs for click-outside detection
  const categoryRef = useRef<HTMLDivElement>(null);
  const tagsRef = useRef<HTMLDivElement>(null);
  const spatialFilterRef = useRef<HTMLDivElement>(null);
  const timeRangeRef = useRef<HTMLDivElement>(null);

  const categoryOptions = DATA_CATEGORIES;
  // Get available tags for the current category
  // @ts-ignore - JSON import types can be tricky, but we know the structure
  const tagsOptions = filters.category && categoryMappings.mappings.tags[filters.category] 
    ? categoryMappings.mappings.tags[filters.category as keyof typeof categoryMappings.mappings.tags] 
    : [];

  const timeRangeOptions = getTimeRangeOptions();

  // Map categories to icons with colors
  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'Boundaries':
        return <Globe className="w-4 h-4 flex-shrink-0 text-purple-600" />;
      case 'Infrastructure':
        return <Truck className="w-4 h-4 flex-shrink-0 text-slate-600" />;
      case 'Research and Sensor Equipment':
        return <Radio className="w-4 h-4 flex-shrink-0 text-indigo-600" />;
      case 'Earth Observations':
        return <Satellite className="w-4 h-4 flex-shrink-0 text-purple-500" />;
      case 'Soils and Geology':
        return <Mountain className="w-4 h-4 flex-shrink-0 text-amber-700" />;
      case 'Land Cover':
        return <TreeDeciduous className="w-4 h-4 flex-shrink-0 text-green-600" />;
      case 'Elevation and Bathymetry':
        return <TriangleRight className="w-4 h-4 flex-shrink-0 text-orange-600" />;
      case 'Weather and Climate':
        return <CloudRain className="w-4 h-4 flex-shrink-0 text-sky-500" />;
      case 'Freshwater':
        return <Droplets className="w-4 h-4 flex-shrink-0 text-blue-600" />;
      case 'Species':
        return <Bug className="w-4 h-4 flex-shrink-0 text-blue-500" />;
      case 'Threats and Hazards':
        return <ShieldAlert className="w-4 h-4 flex-shrink-0 text-yellow-600" />;
      case 'Oceans and Coasts':
        return <Waves className="w-4 h-4 flex-shrink-0 text-teal-600" />;
      case 'Fire':
        return <Flame className="w-4 h-4 flex-shrink-0 text-red-600" />;
      default:
        return <Database className="w-4 h-4 flex-shrink-0 text-gray-400" />;
    }
  };

  // DERIVED STATE: The component is in "custom date range" mode if daysBack is not defined.
  // This is the single source of truth, derived directly from props.
  const isCustomDateRange = useMemo(() => filters.daysBack === undefined, [filters.daysBack]);

  // Handle click outside to close dropdown
  useEffect(() => {
    if (!openDropdown) return;

    const handleClickOutside = (event: MouseEvent) => {
      const refMap = {
        'category': categoryRef,
        'tags': tagsRef,
        'spatialFilter': spatialFilterRef,
        'timeRange': timeRangeRef
      };

      const activeRef = refMap[openDropdown as keyof typeof refMap];
      
      if (activeRef?.current && !activeRef.current.contains(event.target as Node)) {
        setOpenDropdown(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [openDropdown]);

  const handleClearFilters = () => {
    onFilterChange({
      category: '',
      source: '', // Reset source as well
      tags: [],
      spatialFilter: '',
      timeRange: '',
      daysBack: undefined,
      startDate: undefined,
      endDate: undefined,
      // Reset to all taxonomic groups (representing "no filter")
      iconicTaxa: ['Aves', 'Mammalia', 'Reptilia', 'Amphibia', 'Actinopterygii', 'Insecta', 'Plantae', 'Fungi'],
      customPolygon: undefined
    });
  };

  const handleDropdownToggle = (dropdown: string) => {
    setOpenDropdown(openDropdown === dropdown ? null : dropdown);
  };

  const handleCategoryChange = (category: typeof DATA_CATEGORIES[number]) => {
    // Get available tags for the new category and select all by default
    // @ts-ignore - JSON import types can be tricky, but we know the structure
    const categoryTags: string[] = categoryMappings.mappings.tags[category as keyof typeof categoryMappings.mappings.tags] || [];
    
    const newFilters: FilterState = {
      ...filters, 
      category,
      source: '', // Clear source to show Data Catalog
      tags: categoryTags, // Select ALL tags for this category by default
      // Reset iconic taxa to all when category changes
      iconicTaxa: ['Aves', 'Mammalia', 'Reptilia', 'Amphibia', 'Actinopterygii', 'Insecta', 'Plantae', 'Fungi']
    };
    
    onFilterChange(newFilters);
    setOpenDropdown(null);
  };

  const handleTagToggle = (tag: string) => {
    const currentTags = filters.tags || [];
    const newTags = currentTags.includes(tag)
      ? currentTags.filter(t => t !== tag)
      : [...currentTags, tag];
      
    onFilterChange({ ...filters, tags: newTags });
    // Don't close dropdown for multi-select
  };

  const handleSpatialFilterChange = (spatialFilter: string) => {
    onFilterChange({ ...filters, spatialFilter });
    setOpenDropdown(null);
  };

  const handleTimeRangeChange = (daysBack: number | string) => {
    if (daysBack === 'custom') {
      // To enter custom mode, we just need to tell the parent that daysBack is undefined.
      // We don't manage any internal state here.
      onFilterChange({ 
        ...filters, 
        daysBack: undefined 
      });
      // We keep the dropdown open so the user can see the date inputs.
    } else {
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

  const handleDateInputChange = (field: 'startDate' | 'endDate', value: string) => {
    const newFilters = {
      ...filters,
      daysBack: undefined, // Ensure we stay in custom mode
      [field]: value,
    };

    // Update the parent immediately with the partial date change
    onFilterChange(newFilters);

    // If both dates are now present, update the timeRange display string
    const { startDate, endDate } = newFilters;
    if (startDate && endDate && new Date(endDate) >= new Date(startDate)) {
      const customTimeRange = `${formatDateToUS(new Date(startDate))} - ${formatDateToUS(new Date(endDate))}`;
      onFilterChange({
        ...newFilters,
        timeRange: customTimeRange,
      });
    }
  };

  const isDateRangeValid = () => {
    if (!filters.startDate || !filters.endDate) return true;
    return new Date(filters.endDate) >= new Date(filters.startDate);
  };

  return (
    <div id="filter-bar" className={`${currentTheme.subheader} border-b border-gray-200 px-page-base lg:px-page-lg xl:px-page-xl 2xl:px-page-2xl h-header-base lg:h-header-lg xl:h-header-xl 2xl:h-header-2xl transition-colors duration-200`}>
      <div className="flex flex-wrap items-center justify-between gap-gap-large-base lg:gap-gap-large-lg xl:gap-gap-large-xl 2xl:gap-gap-large-2xl h-full">
        <div className="flex flex-wrap items-center gap-gap-small-base lg:gap-gap-small-lg xl:gap-gap-small-xl 2xl:gap-gap-small-2xl">
          {/* Data Category Filter */}
          <div ref={categoryRef} id="category-filter-container" className="relative">
            <button 
              id="category-filter-button"
              onClick={() => handleDropdownToggle('category')}
              className={`flex items-center gap-gap-default-base lg:gap-gap-default-lg 2xl:gap-gap-default-2xl px-btn-x-base lg:px-btn-x-lg 2xl:px-btn-x-2xl py-btn-y-base lg:py-btn-y-lg 2xl:py-btn-y-2xl border border-gray-300 rounded-button bg-white hover:bg-gray-50 w-filter-base lg:w-filter-lg xl:w-filter-xl 2xl:w-filter-2xl ${needsFilterHighlight ? 'filter-highlight-1' : ''}`}
            >
              {filters.category ? getCategoryIcon(filters.category) : <Database className="w-4 h-4 flex-shrink-0 text-gray-400" />}
              <span id="category-filter-text" className={`text-body-base lg:text-body-lg 2xl:text-body-2xl truncate ${filters.category ? 'text-black' : 'text-gray-600'}`}>
                {filters.category || <><span className="hidden xl:inline">Select </span><span className="xl:lowercase">Category</span></>}
              </span>
              <ChevronDown id="category-filter-chevron" className={`w-3 h-3 text-gray-400 transition-transform flex-shrink-0 ml-auto ${openDropdown === 'category' ? 'rotate-180' : ''}`} />
            </button>
            {openDropdown === 'category' && (
              <div id="category-filter-dropdown" className="absolute top-full left-0 mt-1 w-full bg-white border border-gray-200 rounded-card shadow-lg z-50">
                {categoryOptions.map((option) => (
                  <button
                    key={option}
                    id={`category-option-${option.toLowerCase().replace(/\s+/g, '-')}`}
                    onClick={() => handleCategoryChange(option)}
                    className="w-full text-left px-btn-x-base lg:px-btn-x-lg 2xl:px-btn-x-2xl py-btn-y-base lg:py-btn-y-lg 2xl:py-btn-y-2xl text-body-base lg:text-body-lg 2xl:text-body-2xl hover:bg-gray-50 first:rounded-t-card last:rounded-b-card flex items-center gap-gap-default-base lg:gap-gap-default-lg 2xl:gap-gap-default-2xl"
                  >
                    {getCategoryIcon(option)}
                    <span>{option}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Tags Filter - Conditionally rendered based on feature flag */}
          {ENABLE_TAGS_FILTER && (
            <div ref={tagsRef} id="tags-filter-container" className="relative">
              <button 
                id="tags-filter-button"
                onClick={() => handleDropdownToggle('tags')}
                disabled={!filters.category || tagsOptions.length === 0}
                className={`flex items-center gap-gap-default-base lg:gap-gap-default-lg 2xl:gap-gap-default-2xl px-btn-x-base lg:px-btn-x-lg 2xl:px-btn-x-2xl py-btn-y-base lg:py-btn-y-lg 2xl:py-btn-y-2xl border rounded-button w-filter-base lg:w-filter-lg xl:w-filter-xl 2xl:w-filter-2xl ${
                  !filters.category || tagsOptions.length === 0
                    ? 'bg-gray-50 border-gray-200 cursor-not-allowed'
                    : 'bg-white border-gray-300 hover:bg-gray-50'
                } ${needsFilterHighlight ? 'filter-highlight-2' : ''}`}
              >
                <Tag id="tags-filter-icon" className={`w-4 h-4 flex-shrink-0 ${filters.tags?.length ? 'text-blue-600' : 'text-gray-400'}`} />
                <span id="tags-filter-text" className={`text-body-base lg:text-body-lg 2xl:text-body-2xl truncate ${filters.tags?.length ? 'text-black' : 'text-gray-600'}`}>
                  {filters.tags?.length 
                    ? `${filters.tags.length} tag${filters.tags.length > 1 ? 's' : ''} selected` 
                    : <><span className="hidden xl:inline">Select </span><span className="xl:lowercase">Tags</span></>}
                </span>
                <ChevronDown id="tags-filter-chevron" className={`w-3 h-3 text-gray-400 transition-transform flex-shrink-0 ml-auto ${openDropdown === 'tags' ? 'rotate-180' : ''}`} />
              </button>
              {openDropdown === 'tags' && (
                <div id="tags-filter-dropdown" className="absolute top-full left-0 mt-1 w-full bg-white border border-gray-300 rounded-card shadow-lg z-50 max-h-72 flex flex-col">
                  {/* Scrollable tag list */}
                  <div id="tags-filter-list" className="overflow-y-auto flex-1 p-card-compact-base lg:p-card-compact-lg 2xl:p-card-compact-2xl space-y-1">
                    {tagsOptions.map((tag: string) => {
                      const isSelected = filters.tags?.includes(tag);
                      return (
                        <button
                          key={tag}
                          id={`tag-option-${tag.toLowerCase().replace(/\s+/g, '-')}`}
                          onClick={() => handleTagToggle(tag)}
                          className={`w-full flex items-center px-btn-x-base lg:px-btn-x-lg 2xl:px-btn-x-2xl py-btn-y-base lg:py-btn-y-lg 2xl:py-btn-y-2xl rounded-button border transition-all cursor-pointer ${
                            isSelected 
                              ? 'bg-blue-50 border-blue-200 hover:bg-blue-100' 
                              : 'bg-white border-gray-200 hover:bg-gray-50'
                          }`}
                          aria-pressed={isSelected}
                          aria-label={`${isSelected ? 'Deselect' : 'Select'} ${tag}`}
                        >
                          <span className="text-body-base lg:text-body-lg 2xl:text-body-2xl flex-1 text-left font-medium text-gray-900">
                            {tag}
                          </span>
                        </button>
                      );
                    })}
                    {tagsOptions.length === 0 && (
                      <div className="px-btn-x-base lg:px-btn-x-lg 2xl:px-btn-x-2xl py-btn-y-base lg:py-btn-y-lg 2xl:py-btn-y-2xl text-body-base lg:text-body-lg 2xl:text-body-2xl text-gray-400 italic">No tags available for this category</div>
                    )}
                  </div>
                  
                  {/* Select All / Deselect All buttons */}
                  {tagsOptions.length > 0 && (
                    <div id="tags-filter-actions" className="border-t border-gray-200 p-card-compact-base lg:p-card-compact-lg 2xl:p-card-compact-2xl flex gap-gap-default-base lg:gap-gap-default-lg 2xl:gap-gap-default-2xl bg-gray-50">
                      <button
                        id="tags-filter-select-all"
                        onClick={() => onFilterChange({ ...filters, tags: [...tagsOptions] })}
                        className="flex-1 px-btn-compact-x-base lg:px-btn-compact-x-lg 2xl:px-btn-compact-x-2xl py-btn-compact-y-base lg:py-btn-compact-y-lg 2xl:py-btn-compact-y-2xl text-label-base lg:text-label-lg 2xl:text-label-2xl text-blue-600 hover:bg-blue-50 rounded-button transition-colors"
                        aria-label="Select all tags"
                      >
                        Select All
                      </button>
                      <button
                        id="tags-filter-deselect-all"
                        onClick={() => onFilterChange({ ...filters, tags: [] })}
                        className="flex-1 px-btn-compact-x-base lg:px-btn-compact-x-lg 2xl:px-btn-compact-x-2xl py-btn-compact-y-base lg:py-btn-compact-y-lg 2xl:py-btn-compact-y-2xl text-label-base lg:text-label-lg 2xl:text-label-2xl text-gray-600 hover:bg-gray-100 rounded-button transition-colors"
                        aria-label="Deselect all tags"
                      >
                        Deselect All
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Spatial Filter */}
          <div ref={spatialFilterRef} id="spatial-filter-container" className="relative">
            <button 
              id="spatial-filter-button"
              onClick={() => handleDropdownToggle('spatialFilter')}
              className={`flex items-center gap-gap-default-base lg:gap-gap-default-lg 2xl:gap-gap-default-2xl px-btn-x-base lg:px-btn-x-lg 2xl:px-btn-x-2xl py-btn-y-base lg:py-btn-y-lg 2xl:py-btn-y-2xl border rounded-button w-filter-base lg:w-filter-lg xl:w-filter-xl 2xl:w-filter-2xl ${
                filters.customPolygon 
                    ? 'border-blue-500 bg-blue-50 hover:bg-gray-50' 
                    : 'border-gray-300 bg-white hover:bg-gray-50'
              } ${needsFilterHighlight ? 'filter-highlight-3' : ''}`}
            >
              <MapPin id="spatial-filter-icon" className={`w-4 h-4 flex-shrink-0 ${filters.customPolygon ? 'text-blue-600' : 'text-gray-400'}`} />
              <span id="spatial-filter-text" className={`text-body-base lg:text-body-lg 2xl:text-body-2xl truncate ${filters.customPolygon ? 'text-blue-700 font-medium' : filters.spatialFilter ? 'text-black' : 'text-gray-600'}`}>
                {filters.spatialFilter || <><span className="hidden xl:inline">Select </span><span className="xl:lowercase">Spatial Filter</span></>}
                {filters.customPolygon && ' ✓'}
              </span>
              <ChevronDown id="spatial-filter-chevron" className={`w-3 h-3 text-gray-400 transition-transform flex-shrink-0 ml-auto ${openDropdown === 'spatialFilter' ? 'rotate-180' : ''}`} />
            </button>
            
            {/* Spatial Filter Dropdown */}
            {openDropdown === 'spatialFilter' && (
              <div id="spatial-filter-dropdown" className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-300 rounded-card shadow-lg z-50">
                {SPATIAL_FILTERS.map((option) => (
                  <button
                    key={option}
                    id={`spatial-filter-option-${option.toLowerCase().replace(/\s+/g, '-')}`}
                    onClick={() => handleSpatialFilterChange(option)}
                    className={`w-full text-left px-btn-x-base lg:px-btn-x-lg 2xl:px-btn-x-2xl py-btn-y-base lg:py-btn-y-lg 2xl:py-btn-y-2xl text-body-base lg:text-body-lg 2xl:text-body-2xl hover:bg-gray-50 ${
                      filters.spatialFilter === option ? 'bg-blue-50 text-blue-700' : 'text-gray-700'
                    }`}
                  >
                    {option}
                    {option === 'Draw Area' && filters.customPolygon && (
                      <span className="ml-2 text-label-base lg:text-label-lg 2xl:text-label-2xl text-blue-600">✓ Active</span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Time Range Filter with Search Button */}
          <div ref={timeRangeRef} id="time-range-filter-container" className="relative">
            <div id="time-range-controls" className="flex gap-gap-default-base lg:gap-gap-default-lg 2xl:gap-gap-default-2xl">
              <button 
                id="time-range-filter-button"
                onClick={() => handleDropdownToggle('timeRange')}
                className={`flex items-center gap-gap-default-base lg:gap-gap-default-lg 2xl:gap-gap-default-2xl px-btn-x-base lg:px-btn-x-lg 2xl:px-btn-x-2xl py-btn-y-base lg:py-btn-y-lg 2xl:py-btn-y-2xl border rounded-button w-filter-base lg:w-filter-lg xl:w-filter-xl 2xl:w-filter-2xl border-gray-300 bg-white hover:bg-gray-50 ${needsFilterHighlight ? 'filter-highlight-4' : ''}`}
              >
                <Calendar id="time-range-filter-icon" className="w-4 h-4 text-gray-400 flex-shrink-0" />
                <span id="time-range-filter-text" className={`text-body-base lg:text-body-lg 2xl:text-body-2xl truncate ${filters.timeRange ? 'text-black' : 'text-gray-600'}`}>
                  {filters.timeRange || <><span className="hidden xl:inline">Select </span><span className="xl:lowercase">Time Range</span></>}
                </span>
                <ChevronDown id="time-range-filter-chevron" className={`w-3 h-3 text-gray-400 transition-transform flex-shrink-0 ml-auto ${openDropdown === 'timeRange' ? 'rotate-180' : ''}`} />
              </button>
              
              {/* Search Button */}
              <button
                id="observations-search-button"
                onClick={onSearch}
                disabled={isSearching || !filters.source}
                className={`px-btn-x-base lg:px-btn-x-lg 2xl:px-btn-x-2xl py-btn-y-base lg:py-btn-y-lg 2xl:py-btn-y-2xl border border-gray-300 rounded-button transition-colors ${
                  isSearching || !filters.source
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                } ${needsFilterHighlight ? 'filter-highlight-5' : ''}`}
                title={
                  !filters.source
                    ? "Select a data type first"
                    : isSearching 
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
              <div id="time-range-dropdown" className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-card shadow-lg z-50 min-w-full sm:w-80">
                {timeRangeOptions.map((option) => (
                  <button
                    key={option.value}
                    id={`time-range-option-${option.value}-days`}
                    onClick={() => handleTimeRangeChange(option.value)}
                    className={`w-full text-left px-btn-x-base lg:px-btn-x-lg 2xl:px-btn-x-2xl py-btn-y-base lg:py-btn-y-lg 2xl:py-btn-y-2xl text-body-base lg:text-body-lg 2xl:text-body-2xl hover:bg-gray-50 ${
                      filters.daysBack === option.value && !isCustomDateRange ? 'bg-blue-50 text-blue-700' : ''
                    }`}
                    title={formatDateRange(option.value)}
                  >
                    <div id={`time-range-label-${option.value}-days`} className="font-medium">{option.label}</div>
                    <div id={`time-range-dates-${option.value}-days`} className="text-label-base lg:text-label-lg 2xl:text-label-2xl text-gray-500 mt-element-compact-base lg:mt-element-compact-lg 2xl:mt-element-compact-2xl truncate">
                      {formatDateRange(option.value)}
                    </div>
                  </button>
                ))}
                
                {/* Custom Date Range Option */}
                <button
                  id="time-range-option-custom"
                  onClick={() => handleTimeRangeChange('custom')}
                  className={`w-full text-left px-btn-x-base lg:px-btn-x-lg 2xl:px-btn-x-2xl py-btn-y-base lg:py-btn-y-lg 2xl:py-btn-y-2xl text-body-base lg:text-body-lg 2xl:text-body-2xl hover:bg-gray-50 border-t border-gray-100 ${
                    isCustomDateRange ? 'bg-blue-50 text-blue-700' : ''
                  }`}
                >
                  <div id="time-range-label-custom" className="font-medium">Custom date range</div>
                  <div id="time-range-desc-custom" className="text-label-base lg:text-label-lg 2xl:text-label-2xl text-gray-500 mt-element-compact-base lg:mt-element-compact-lg 2xl:mt-element-compact-2xl">Select specific start and end dates</div>
                </button>
                
                {/* Custom Date Range Inputs */}
                {isCustomDateRange && (
                  <div id="custom-date-inputs-header" className="p-card-compact-base lg:p-card-compact-lg 2xl:p-card-compact-2xl bg-gray-50 border-t border-gray-200">
                    <div className="space-y-3">
                      <div>
                        <label htmlFor="header-start-date-input" className="block text-label-base lg:text-label-lg 2xl:text-label-2xl text-gray-700 mb-element-compact-base lg:mb-element-compact-lg 2xl:mb-element-compact-2xl">
                          Start Date
                        </label>
                        <input
                          id="header-start-date-input"
                          type="date"
                          value={filters.startDate || ''}
                          onInput={(e) => handleDateInputChange('startDate', e.currentTarget.value)}
                          className="w-full px-btn-compact-x-base lg:px-btn-compact-x-lg 2xl:px-btn-compact-x-2xl py-btn-compact-y-base lg:py-btn-compact-y-lg 2xl:py-btn-compact-y-2xl text-body-base lg:text-body-lg 2xl:text-body-2xl border border-gray-300 rounded-button focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                      <div>
                        <label htmlFor="header-end-date-input" className="block text-label-base lg:text-label-lg 2xl:text-label-2xl text-gray-700 mb-element-compact-base lg:mb-element-compact-lg 2xl:mb-element-compact-2xl">
                          End Date
                        </label>
                        <input
                          id="header-end-date-input"
                          type="date"
                          value={filters.endDate || ''}
                          onInput={(e) => handleDateInputChange('endDate', e.currentTarget.value)}
                          className="w-full px-btn-compact-x-base lg:px-btn-compact-x-lg 2xl:px-btn-compact-x-2xl py-btn-compact-y-base lg:py-btn-compact-y-lg 2xl:py-btn-compact-y-2xl text-body-base lg:text-body-lg 2xl:text-body-2xl border border-gray-300 rounded-button focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                      {filters.startDate && filters.endDate && (
                        <div id="header-date-range-summary" className={`text-label-base lg:text-label-lg 2xl:text-label-2xl p-card-compact-base lg:p-card-compact-lg 2xl:p-card-compact-2xl rounded-button border ${
                          isDateRangeValid() 
                            ? 'text-gray-600 bg-white' 
                            : 'text-red-600 bg-red-50 border-red-200'
                        }`}>
                          {isDateRangeValid() ? (
                            <>Range: {formatDateToUS(new Date(filters.startDate))} - {formatDateToUS(new Date(filters.endDate))}</>
                          ) : (
                            <>⚠️ End date must be after start date</>
                          )}
                        </div>
                      )}
                      <div className="flex justify-end gap-gap-default-base lg:gap-gap-default-lg 2xl:gap-gap-default-2xl pt-element-base lg:pt-element-lg 2xl:pt-element-2xl">
                        <button
                          id="header-custom-date-cancel"
                          onClick={() => {
                            onFilterChange({ ...filters, daysBack: 30 }); // Revert to default
                            setOpenDropdown(null);
                          }}
                          className="px-btn-x-base lg:px-btn-x-lg 2xl:px-btn-x-2xl py-btn-compact-y-base lg:py-btn-compact-y-lg 2xl:py-btn-compact-y-2xl text-label-base lg:text-label-lg 2xl:text-label-2xl text-gray-600 hover:text-gray-800 border border-gray-300 rounded-button hover:bg-gray-50"
                        >
                          Cancel
                        </button>
                        <button
                          id="header-custom-date-apply"
                          onClick={() => setOpenDropdown(null)}
                          disabled={!isDateRangeValid() || !filters.startDate || !filters.endDate}
                          className="px-btn-x-base lg:px-btn-x-lg 2xl:px-btn-x-2xl py-btn-compact-y-base lg:py-btn-compact-y-lg 2xl:py-btn-compact-y-2xl text-label-base lg:text-label-lg 2xl:text-label-2xl text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed rounded-button"
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

        <div id="filter-bar-right" className="flex items-center h-full gap-section-compact-base lg:gap-section-compact-lg xl:gap-section-compact-xl 2xl:gap-section-compact-2xl">
          <button 
            id="clear-filters-button"
            onClick={handleClearFilters}
            className="text-body-base lg:text-body-lg xl:text-body-xl 2xl:text-body-2xl text-blue-600 hover:text-blue-800 py-btn-y-base lg:py-btn-y-lg xl:py-btn-y-xl 2xl:py-btn-y-2xl"
          >
            Clear Filters
          </button>
        </div>
      </div>
    </div>
  );
};

export default FilterSubheader;
