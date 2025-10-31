import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Calendar, User, ExternalLink, MapPin, Info, ShoppingCart } from 'lucide-react';
import ThumbnailImage from './ThumbnailImage';

// Define a unified observation interface
export interface INaturalistUnifiedObservation {
  id: number | string;
  observedOn: string;
  observerName: string;
  commonName: string | null;
  scientificName: string;
  photoUrl: string | null;
  photoAttribution?: string | null;
  iconicTaxon: string;
  qualityGrade?: string | null;
  location?: string | null;
  uri: string;
  taxonId?: number | string;
}

interface INaturalistSidebarProps {
  title: string; // e.g., "iNaturalist (Public API)" or "iNaturalist (TNC Layers)"
  observations: INaturalistUnifiedObservation[];
  loading: boolean;
  dateRangeText: string;
  onAddToCart?: () => void;
  onObservationClick?: (obs: INaturalistUnifiedObservation) => void;
  hasSearched?: boolean;
  selectedObservationId?: number | string | null;
  iconicTaxa?: string[]; // Filter by taxonomic groups
  onIconicTaxaChange?: (taxa: string[]) => void; // Callback to change filter
}

const INaturalistSidebar: React.FC<INaturalistSidebarProps> = ({
  title,
  observations,
  loading,
  dateRangeText,
  onAddToCart,
  onObservationClick,
  hasSearched = false,
  selectedObservationId,
  iconicTaxa = [],
  onIconicTaxaChange
}) => {
  const [searchText, setSearchText] = useState('');
  const [selectedTaxonFilter, setSelectedTaxonFilter] = useState('all');
  const [expandedObservation, setExpandedObservation] = useState<number | string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 20;
  
  // Multi-select dropdown state
  const [isTaxonDropdownOpen, setIsTaxonDropdownOpen] = useState(false);
  const taxonDropdownRef = useRef<HTMLDivElement>(null);
  
  // Ref to track previous selectedObservationId
  const prevSelectedObservationIdRef = useRef<number | string | null>(null);
  
  // Ref to track the previous observations to detect when new data loads
  const prevObservationsRef = useRef<INaturalistUnifiedObservation[]>([]);

  // Helper function to format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  // Reset pagination when filters change
  const resetPagination = () => setCurrentPage(1);

  // First, apply search text filter (but NOT iconicTaxa filter)
  // This ensures we only show taxa that exist in the search-filtered results
  const searchFilteredObservations = useMemo(() => {
    if (!searchText.trim()) {
      return observations;
    }
    
    const search = searchText.toLowerCase();
    return observations.filter(obs =>
      obs.commonName?.toLowerCase().includes(search) ||
      obs.scientificName?.toLowerCase().includes(search) ||
      obs.observerName?.toLowerCase().includes(search)
    );
  }, [observations, searchText]);

  // Group observations by iconic taxon (based on search-filtered observations)
  // Filter out empty/null/undefined/Unknown taxa and normalize case
  const groupedObservations = useMemo(() => {
    const groups: Record<string, { count: number; category: string }> = {};
    
    searchFilteredObservations.forEach(obs => {
      const rawCategory = obs.iconicTaxon;
      // Only include valid taxa (not empty, null, undefined, or 'Unknown')
      if (rawCategory && rawCategory.trim() && rawCategory.toLowerCase() !== 'unknown') {
        // Normalize to capitalized format (first letter uppercase, rest lowercase)
        // This ensures consistent comparison with iconicTaxa prop
        const normalizedCategory = rawCategory.charAt(0).toUpperCase() + rawCategory.slice(1).toLowerCase();
        
        if (!groups[normalizedCategory]) {
          groups[normalizedCategory] = { count: 0, category: normalizedCategory };
        }
        groups[normalizedCategory].count++;
      }
    });
    
    return Object.values(groups).sort((a, b) => b.count - a.count);
  }, [searchFilteredObservations]);

  // Get currently selected taxa for the multi-select dropdown
  // Only include taxa that actually exist in the current observations
  const selectedTaxaSet = useMemo(() => {
    const availableGroupsSet = new Set(groupedObservations.map(g => g.category.toLowerCase()));
    
    // If iconicTaxa is provided and has values
    if (iconicTaxa && iconicTaxa.length > 0) {
      const selectedAndAvailable = iconicTaxa
        .map(t => t.toLowerCase())
        .filter(t => availableGroupsSet.has(t));
      
      const selectedSet = new Set(selectedAndAvailable);
      const missing = Array.from(availableGroupsSet).filter(g => !selectedSet.has(g));
      
      if (missing.length > 0) {
        console.log('⚠️ selectedTaxaSet: Some available taxa are missing from iconicTaxa:', missing);
        console.log('  - Available groups:', Array.from(availableGroupsSet));
        console.log('  - iconicTaxa prop:', iconicTaxa);
        console.log('  - Selected set:', Array.from(selectedSet));
      }
      
      return selectedSet;
    }
    
    // If iconicTaxa is empty array (explicitly cleared) or undefined, show all available groups
    // This handles both initial state (undefined) and after observations load
    return availableGroupsSet;
  }, [iconicTaxa, groupedObservations]);

  // Get taxon icon
  const getTaxonIcon = (taxon: string): string => {
    const normalized = taxon?.toLowerCase() || '';
    if (normalized === 'aves') return '🐦';
    if (normalized === 'mammalia') return '🦌';
    if (normalized === 'reptilia') return '🦎';
    if (normalized === 'amphibia') return '🐸';
    if (normalized === 'actinopterygii') return '🐟';
    if (normalized === 'insecta') return '🦋';
    if (normalized === 'arachnida') return '🕷️';
    if (normalized === 'plantae') return '🌱';
    if (normalized === 'mollusca') return '🐚';
    if (normalized === 'animalia') return '🐾';
    if (normalized === 'fungi') return '🍄';
    if (normalized === 'chromista') return '🦠';
    if (normalized === 'protozoa') return '🔬';
    return '🔍';
  };

  // Get taxon color
  const getTaxonColor = (taxon: string): string => {
    const normalized = taxon?.toLowerCase() || '';
    if (normalized === 'aves') return '#4A90E2';
    if (normalized === 'mammalia') return '#8B4513';
    if (normalized === 'reptilia') return '#228B22';
    if (normalized === 'amphibia') return '#32CD32';
    if (normalized === 'actinopterygii') return '#1E90FF';
    if (normalized === 'insecta') return '#FFD700';
    if (normalized === 'arachnida') return '#800080';
    if (normalized === 'plantae') return '#228B22';
    if (normalized === 'mollusca') return '#DDA0DD';
    if (normalized === 'animalia') return '#666666';
    if (normalized === 'fungi') return '#FF6B6B';
    if (normalized === 'chromista') return '#4ECDC4';
    if (normalized === 'protozoa') return '#95E1D3';
    return '#666666';
  };

  // Filter observations (start with searchFilteredObservations, then apply iconicTaxa filter)
  const filteredObservations = useMemo(() => {
    let filtered = searchFilteredObservations;
    
    // Filter by iconicTaxa from parent (takes precedence over local selectedTaxonFilter)
    // Only apply filtering if NOT all available groups are selected
    const availableGroupCount = groupedObservations.length;
    const selectedAvailableCount = Array.from(selectedTaxaSet).filter(taxon =>
      groupedObservations.some(g => g.category.toLowerCase() === taxon)
    ).length;
    const allAvailableSelected = selectedAvailableCount === availableGroupCount && availableGroupCount > 0;
    
    if (!allAvailableSelected && iconicTaxa && iconicTaxa.length > 0) {
      // Only filter if not all available groups are selected
      filtered = filtered.filter(obs => 
        iconicTaxa.some(taxon => obs.iconicTaxon?.toLowerCase() === taxon.toLowerCase())
      );
    } else if (selectedTaxonFilter !== 'all') {
      // Fallback to local taxon filter if iconicTaxa is not filtering
      filtered = filtered.filter(obs => 
        (obs.iconicTaxon || 'Unknown') === selectedTaxonFilter
      );
    }
    
    return filtered;
  }, [searchFilteredObservations, selectedTaxonFilter, iconicTaxa, groupedObservations, selectedTaxaSet]);

  // Get display text for the dropdown trigger button
  const dropdownDisplayText = useMemo(() => {
    const allCategories = groupedObservations.length;
    const selectedCount = Array.from(selectedTaxaSet).filter(taxon =>
      groupedObservations.some(g => g.category.toLowerCase() === taxon)
    ).length;
    
    if (selectedCount === 0) {
      return `No taxa selected (${searchFilteredObservations.length})`;
    } else if (selectedCount === allCategories) {
      return `All Taxa (${searchFilteredObservations.length})`;
    } else {
      return `${selectedCount} group${selectedCount !== 1 ? 's' : ''} selected (${filteredObservations.length})`;
    }
  }, [selectedTaxaSet, groupedObservations, searchFilteredObservations.length, filteredObservations.length]);

  // Handler to toggle a single taxon in the multi-select dropdown
  // Simple toggle: if selected → deselect, if deselected → select
  const handleToggleTaxon = (taxon: string) => {
    console.log('🖱️ [CHANGE] handleToggleTaxon: Clicked on taxon:', taxon);
    console.log('  📍 Current iconicTaxa (BEFORE):', iconicTaxa);
    
    if (!onIconicTaxaChange) {
      console.warn('⚠️ handleToggleTaxon: onIconicTaxaChange not available');
      return;
    }
    
    const taxonNormalized = taxon.charAt(0).toUpperCase() + taxon.slice(1).toLowerCase();
    
    // Get all available groups (normalized, capitalized)
    const availableGroups = groupedObservations.map(g => g.category);
    const allAvailableCount = availableGroups.length;
    
    // Check current state: if iconicTaxa is empty or has all available taxa, everything is selected
    const currentTaxa = iconicTaxa || [];
    const hasAllSelected = currentTaxa.length === 0 || 
      (currentTaxa.length === allAvailableCount && 
       availableGroups.every(g => currentTaxa.includes(g)));
    
    // Determine if this specific taxon is currently selected
    const isCurrentlySelected = hasAllSelected || currentTaxa.includes(taxonNormalized);
    
    let newIconicTaxa: string[];
    
    if (hasAllSelected) {
      // Currently all selected: remove this taxon (select all except this one)
      console.log('  → Logic: All selected, removing this taxon');
      newIconicTaxa = availableGroups
        .filter(g => g !== taxonNormalized)
        .sort();
    } else if (isCurrentlySelected) {
      // This taxon is selected: remove it
      console.log('  → Logic: Taxon is selected, removing it');
      newIconicTaxa = currentTaxa
        .filter(t => t !== taxonNormalized)
        .sort();
    } else {
      // This taxon is not selected: add it
      console.log('  → Logic: Taxon is NOT selected, adding it');
      newIconicTaxa = [...currentTaxa, taxonNormalized].sort();
    }
    
    console.log('  📍 New iconicTaxa (AFTER):', newIconicTaxa);
    console.log('  ✅ Calling onIconicTaxaChange()');
    onIconicTaxaChange(newIconicTaxa);
    resetPagination();
  };

  // Handler to select all taxa
  const handleSelectAllTaxa = () => {
    if (!onIconicTaxaChange) return;
    
    // Select all available groups (only taxa that exist in current observations)
    const availableGroups = groupedObservations.map(g => g.category.toLowerCase());
    const allTaxa = availableGroups.map(t => 
      t.charAt(0).toUpperCase() + t.slice(1)
    );
    
    onIconicTaxaChange(allTaxa);
    resetPagination();
  };

  // Handler to clear all taxa (actually selects all - better UX than showing nothing)
  const handleClearAllTaxa = () => {
    if (!onIconicTaxaChange) return;
    handleSelectAllTaxa();
  };

  // Paginate observations
  const paginatedObservations = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    return filteredObservations.slice(startIndex, endIndex);
  }, [filteredObservations, currentPage, pageSize]);

  const totalPages = Math.ceil(filteredObservations.length / pageSize);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (taxonDropdownRef.current && !taxonDropdownRef.current.contains(event.target as Node)) {
        setIsTaxonDropdownOpen(false);
      }
    };

    if (isTaxonDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isTaxonDropdownOpen]);

  // Reset taxonomic filter when observations change (e.g., new spatial/date filter applied)
  // This ensures we don't preserve filters from a previous dataset and all taxa are selected by default
  useEffect(() => {
    // Only reset when observations actually change (new search performed)
    // Check if first observation ID is different (more reliable than length)
    const firstObsId = observations.length > 0 ? observations[0].id : null;
    const prevFirstObsId = prevObservationsRef.current.length > 0 ? prevObservationsRef.current[0].id : null;
    const observationsChanged = firstObsId !== prevFirstObsId || 
                                observations.length !== prevObservationsRef.current.length ||
                                (observations.length > 0 && prevObservationsRef.current.length === 0); // Handle initial load
    
    if (onIconicTaxaChange && observations.length > 0 && observationsChanged) {
      // Extract unique taxa from observations, filtering out empty/null/undefined/Unknown
      // Normalize to ensure consistent capitalization
      const availableTaxa = Array.from(
        new Set(
          observations
            .map(obs => obs.iconicTaxon)
            .filter(taxon => taxon && taxon.trim() && taxon.toLowerCase() !== 'unknown')
            .map(t => {
              // Normalize to capitalized format (first letter uppercase, rest lowercase)
              return t.charAt(0).toUpperCase() + t.slice(1).toLowerCase();
            })
        )
      )
      .sort(); // Sort for consistency
      
      // Always reset to all available taxa when observations change
      // This ensures we start with all taxa selected on new searches
      if (availableTaxa.length > 0) {
        console.log('🔄 INaturalistSidebar useEffect: Observations changed, setting all available taxa');
        console.log('  - Available taxa found:', availableTaxa);
        console.log('  - Current iconicTaxa (will be replaced):', iconicTaxa);
        console.log('  - Total observations:', observations.length);
        onIconicTaxaChange(availableTaxa);
      } else {
        console.warn('⚠️ INaturalistSidebar useEffect: No available taxa found in observations!');
      }
    }
    
    // Update the ref AFTER processing (for next comparison)
    prevObservationsRef.current = observations;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [observations]); // Only run when observations change, not when callback changes

  // Auto-scroll to selected observation when clicked from map
  useEffect(() => {
    // Only proceed if selectedObservationId has actually changed
    if (selectedObservationId !== prevSelectedObservationIdRef.current) {
      prevSelectedObservationIdRef.current = selectedObservationId ?? null;
      
      if (selectedObservationId) {
        // Find which page the observation is on
        const observationIndex = filteredObservations.findIndex(
          obs => String(obs.id) === String(selectedObservationId)
        );
        
        if (observationIndex !== -1) {
          const targetPage = Math.floor(observationIndex / pageSize) + 1;
          
          // Change to the correct page if needed
          if (currentPage !== targetPage) {
            setCurrentPage(targetPage);
          }
          
          // Small delay to ensure DOM is updated after page change
          setTimeout(() => {
            const cardElement = document.getElementById(`inaturalist-observation-${selectedObservationId}`);
            if (cardElement) {
              cardElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
              // Also expand the card
              setExpandedObservation(selectedObservationId);
            }
          }, currentPage !== targetPage ? 200 : 100); // Longer delay if we changed pages
        }
      }
    }
  }, [selectedObservationId, filteredObservations, currentPage, pageSize]);

  // Handle observation click
  const handleObservationClick = (obs: INaturalistUnifiedObservation) => {
    if (expandedObservation === obs.id) {
      setExpandedObservation(null);
    } else {
      setExpandedObservation(obs.id);
    }
    
    // Call parent callback if provided
    onObservationClick?.(obs);
  };

  // Show empty state if no search has been performed
  if (!hasSearched) {
    return (
      <div id="inaturalist-sidebar" className="w-96 bg-white border-r border-gray-200 flex flex-col h-full">
        <div id="inaturalist-empty-state" className="flex flex-col items-center justify-center h-full p-8 text-center">
          <div id="search-prompt-icon" className="mb-4">
            <svg className="w-16 h-16 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Start Your Search</h3>
          <p className="text-sm text-gray-600">
            Enter selection criteria and hit search to see results
          </p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div id="inaturalist-sidebar-loading" className="w-96 bg-white border-r border-gray-200 flex flex-col h-full">
        <div id="inaturalist-sidebar-loading-content" className="p-4 border-b border-gray-200">
          <h2 id="inaturalist-sidebar-loading-title" className="text-lg font-semibold text-gray-900 mb-4">{title}</h2>
          <div id="inaturalist-loading-container" className="flex flex-col items-center justify-center h-32 space-y-3">
            <div id="inaturalist-loading-spinner" className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <div id="inaturalist-loading-text" className="text-center">
              <p className="text-sm text-gray-600 font-medium">Loading observations...</p>
              <p className="text-xs text-gray-500 mt-1 max-w-xs">
                Fetching data...
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div id="inaturalist-sidebar" className="w-96 bg-white border-r border-gray-200 flex flex-col">
      {/* Header */}
      <div id="inaturalist-sidebar-header" className="p-4 border-b border-gray-200">
        <div className="mb-2">
          <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
        </div>
        
        <div className="text-sm text-gray-600 mb-3">
          {observations.length} observations {dateRangeText}
        </div>

        {/* Search */}
        <div id="inaturalist-search" className="mb-3">
          <input
            id="inaturalist-search-input"
            type="text"
            value={searchText}
            onChange={(e) => { setSearchText(e.target.value); resetPagination(); }}
            placeholder="Search by name or observer..."
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Multi-Select Taxon Filter */}
        <div id="inaturalist-taxon-filter" className="mb-3 relative" ref={taxonDropdownRef}>
          {/* Dropdown Trigger Button */}
          <button
            id="taxon-filter-trigger"
            onClick={() => setIsTaxonDropdownOpen(!isTaxonDropdownOpen)}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md bg-white hover:bg-gray-50 flex items-center justify-between transition-colors"
            disabled={!onIconicTaxaChange}
          >
            <span className="text-gray-700">{dropdownDisplayText}</span>
            <svg 
              className={`w-4 h-4 text-gray-500 transition-transform ${isTaxonDropdownOpen ? 'transform rotate-180' : ''}`}
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {/* Dropdown Panel */}
          {isTaxonDropdownOpen && onIconicTaxaChange && (
            <div 
              id="taxon-filter-dropdown-panel"
              className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-72 flex flex-col"
            >
              {/* Scrollable checkbox list */}
              <div id="taxon-filter-dropdown-list" className="overflow-y-auto flex-1 p-2 space-y-1">
                {groupedObservations.map(group => {
                  const groupLower = group.category.toLowerCase();
                  const isSelected = selectedTaxaSet.has(groupLower);
                  const taxonId = `taxon-filter-option-${groupLower}`;
                  
                  return (
                    <button
                      key={`${group.category}-${isSelected}`}
                      id={taxonId}
                      onClick={() => handleToggleTaxon(group.category)}
                      className={`w-full flex items-center px-3 py-2 rounded border transition-all cursor-pointer ${
                        isSelected 
                          ? 'bg-blue-50 border-blue-200 hover:bg-blue-100' 
                          : 'bg-gray-100 border-gray-200 opacity-50 hover:bg-gray-150 hover:opacity-75'
                      }`}
                      aria-pressed={isSelected}
                      aria-label={`${isSelected ? 'Deselect' : 'Select'} ${group.category} (${group.count} observations)`}
                    >
                      <span className="text-base mr-2">{getTaxonIcon(group.category)}</span>
                      <span className={`text-sm flex-1 text-left font-medium ${isSelected ? 'text-gray-900' : 'text-gray-600'}`}>
                        {group.category}
                      </span>
                      <span className={`text-xs font-medium ${isSelected ? 'text-gray-600' : 'text-gray-500'}`}>
                        ({group.count})
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Action buttons */}
              <div id="taxon-filter-actions" className="border-t border-gray-200 p-2 flex gap-2 bg-gray-50">
                <button
                  id="taxon-filter-select-all"
                  onClick={handleSelectAllTaxa}
                  className="flex-1 px-2 py-1 text-xs font-medium text-blue-600 hover:bg-blue-50 rounded transition-colors"
                  aria-label="Select all taxonomic groups"
                >
                  Select All
                </button>
                <button
                  id="taxon-filter-clear"
                  onClick={handleClearAllTaxa}
                  className="flex-1 px-2 py-1 text-xs font-medium text-gray-600 hover:bg-gray-100 rounded transition-colors"
                  aria-label="Clear all filters and show all taxonomic groups"
                >
                  Clear
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Legend */}
        <div id="inaturalist-legend" className="grid grid-cols-2 gap-1 text-xs">
          {groupedObservations.slice(0, 6).map(group => {
            const legendItemId = `legend-item-${group.category.toLowerCase()}`;
            return (
              <div key={group.category} id={legendItemId} className="flex items-center">
                <div 
                  id={`${legendItemId}-color`}
                  className="w-3 h-3 rounded-full mr-2"
                  style={{ backgroundColor: getTaxonColor(group.category) }}
                  aria-label={`${group.category} color indicator`}
                />
                <span id={`${legendItemId}-label`} className="truncate">{group.category} ({group.count})</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Observations List */}
      <div id="inaturalist-observations-list" className="flex-1 overflow-y-auto">
        {filteredObservations.length === 0 ? (
          <div id="inaturalist-no-results" className="p-4 text-center text-gray-500">
            <Info className="w-8 h-8 mx-auto mb-2 text-gray-400" />
            <p className="text-sm">No observations found</p>
            <p className="text-xs mt-1">Try adjusting your filters or time range</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {paginatedObservations.map((observation) => (
              <div
                key={observation.id}
                id={`inaturalist-observation-${observation.id}`}
                className={`p-4 cursor-pointer hover:bg-gray-50 transition-colors ${
                  (selectedObservationId !== null && selectedObservationId !== undefined && String(selectedObservationId) === String(observation.id)) || expandedObservation === observation.id ? 'bg-blue-50 border-l-4 border-blue-500' : ''
                }`}
                onClick={() => handleObservationClick(observation)}
              >
                <div className="flex items-start space-x-3">
                  {observation.photoUrl ? (
                    <ThumbnailImage
                      src={observation.photoUrl}
                      alt={observation.commonName || observation.scientificName}
                      width={48}
                      height={48}
                      className="flex-shrink-0"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-lg bg-gray-200 flex items-center justify-center flex-shrink-0">
                      <span className="text-gray-400 text-xs">No photo</span>
                    </div>
                  )}
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-medium text-gray-900 truncate">
                        {observation.commonName || observation.scientificName}
                      </h3>
                      <span className="text-xs text-gray-500">
                        {getTaxonIcon(observation.iconicTaxon)}
                      </span>
                    </div>
                    
                    {observation.commonName && observation.scientificName && (
                      <p className="text-xs text-gray-600 italic mt-1">
                        {observation.scientificName}
                      </p>
                    )}
                    
                    <div className="flex items-center mt-2 text-xs text-gray-500 space-x-3">
                      <div className="flex items-center">
                        <Calendar className="w-3 h-3 mr-1" />
                        {formatDate(observation.observedOn)}
                      </div>
                      <div className="flex items-center">
                        <User className="w-3 h-3 mr-1" />
                        {observation.observerName}
                      </div>
                    </div>

                    {/* Expanded Details */}
                    {expandedObservation === observation.id && (
                      <div id={`inaturalist-expanded-details-${observation.id}`} className="mt-3 space-y-3">
                        {/* Quality Grade */}
                        {observation.qualityGrade && (
                          <div className="text-xs">
                            <span className="font-medium text-gray-700">Quality: </span>
                            <span className={`capitalize ${
                              observation.qualityGrade === 'research' ? 'text-green-600' :
                              observation.qualityGrade === 'needs_id' ? 'text-yellow-600' :
                              'text-gray-600'
                            }`}>
                              {observation.qualityGrade.replace('_', ' ')}
                            </span>
                          </div>
                        )}
                        
                        {/* Location */}
                        {observation.location && (
                          <div className="flex items-start text-xs">
                            <MapPin className="w-3 h-3 mr-1 mt-0.5 flex-shrink-0 text-gray-400" />
                            <span className="text-gray-600">{observation.location}</span>
                          </div>
                        )}
                        
                        {/* Additional Info */}
                        <div className="flex items-center justify-between pt-2 border-t border-gray-200">
                          {observation.taxonId && (
                            <div className="text-xs text-gray-500">
                              Taxon ID: {observation.taxonId}
                            </div>
                          )}
                          <button
                            id={`inaturalist-more-info-${observation.id}`}
                            className="flex items-center text-xs text-blue-600 hover:text-blue-800"
                            onClick={(e) => {
                              e.stopPropagation();
                              window.open(observation.uri, '_blank');
                            }}
                          >
                            <ExternalLink className="w-3 h-3 mr-1" />
                            View on iNaturalist
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        
        {/* Pagination */}
        {totalPages > 1 && (
          <div id="inaturalist-pagination" className="flex items-center justify-between p-4 border-t border-gray-200 bg-gray-50">
            <button
              id="inaturalist-prev-page"
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1 text-sm border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
            >
              Previous
            </button>
            <span className="text-sm text-gray-600">
              Page {currentPage} of {totalPages}
            </span>
            <button
              id="inaturalist-next-page"
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-1 text-sm border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default INaturalistSidebar;

