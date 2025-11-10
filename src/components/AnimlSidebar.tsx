import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Calendar, Camera, Tag, Info, ArrowLeft } from 'lucide-react';
import { AnimlDeployment, AnimlImageLabel, AnimlAnimalTag, AnimlCountLookups } from '../services/animlService';
import ThumbnailImage from './ThumbnailImage';

export type AnimlViewMode = 'camera-centric' | 'animal-centric';

// Grouped observation for camera-centric view (one image with multiple labels)
interface GroupedObservation {
  animl_image_id: string;
  deployment_id: number;
  deployment_name?: string;
  timestamp: string;
  labels: string[]; // All labels for this image
  medium_url: string | null;
  small_url: string | null;
  geometry?: {
    type: 'Point';
    coordinates: [number, number];
  };
  // Use the first observation's ID as the primary ID for selection
  primaryId: number;
}


interface AnimlSidebarProps {
  viewMode: AnimlViewMode;
  onViewModeChange: (mode: AnimlViewMode) => void;
  
  // Camera-centric data
  deployments?: AnimlDeployment[];
  selectedDeploymentId?: number | null;
  onDeploymentClick?: (deployment: AnimlDeployment | null) => void;
  
  // Animal-centric data
  animalTags?: AnimlAnimalTag[];
  selectedAnimalLabel?: string | null;
  onAnimalTagClick?: (tag: AnimlAnimalTag | null) => void;
  
  // Common
  loading: boolean;
  loadingObservations?: boolean; // Loading state for observations when category is clicked
  loadingMoreObservations?: boolean; // Loading state for background loading
  totalObservationsCount?: number | null; // Total count for pagination info
  dateRangeText: string;
  hasSearched?: boolean;
  
  // Observations (filtered by selected camera or animal)
  observations?: AnimlImageLabel[];
  selectedObservationId?: number | null;
  onObservationClick?: (observation: AnimlImageLabel) => void;
  
  // Count lookups for filtering deployments
  countLookups?: AnimlCountLookups | null;
}

const AnimlSidebar: React.FC<AnimlSidebarProps> = ({
  viewMode,
  onViewModeChange,
  deployments = [],
  selectedDeploymentId,
  onDeploymentClick,
  animalTags = [],
  selectedAnimalLabel,
  onAnimalTagClick,
  loading,
  loadingObservations = false,
  loadingMoreObservations = false,
  totalObservationsCount = null,
  dateRangeText,
  hasSearched = false,
  observations = [],
  selectedObservationId,
  onObservationClick,
  countLookups
}) => {
  const [searchText, setSearchText] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [expandedObservation, setExpandedObservation] = useState<number | null>(null);
  const pageSize = 20;
  
  const prevSelectedObservationIdRef = useRef<number | null>(null);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const isSidebarFocusedRef = useRef(false);
  
  // Track previous search context to reset pagination on new searches
  const prevSearchContextRef = useRef<{
    viewMode: AnimlViewMode;
    selectedDeploymentId: number | null;
    selectedAnimalLabel: string | null;
    observationsLength: number;
  } | null>(null);

  // Helper function to format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  // Filter deployments by search text (camera-centric mode) and sort alphabetically
  // Also filter out deployments with 0 observations
  const filteredDeployments = useMemo(() => {
    let filtered = deployments;
    
    // Filter out deployments with 0 observations (using count lookups if available)
    if (countLookups) {
      filtered = filtered.filter(dep => {
        const count = countLookups.countsByDeployment.get(dep.id) || 0;
        return count > 0;
      });
    }
    
    // Apply search filter
    if (searchText.trim()) {
      const search = searchText.toLowerCase();
      filtered = filtered.filter(dep =>
        dep.name?.toLowerCase().includes(search) ||
        dep.animl_dp_id?.toLowerCase().includes(search)
      );
    }
    
    // Sort alphabetically by name
    return filtered.sort((a, b) => {
      const nameA = (a.name || a.animl_dp_id || '').toLowerCase();
      const nameB = (b.name || b.animl_dp_id || '').toLowerCase();
      return nameA.localeCompare(nameB);
    });
  }, [deployments, searchText, countLookups]);

  // Filter animal tags by search text (animal-centric mode) and sort alphabetically
  const filteredAnimalTags = useMemo(() => {
    let filtered = animalTags;
    
    if (searchText.trim()) {
      const search = searchText.toLowerCase();
      filtered = animalTags.filter(tag =>
        tag.label?.toLowerCase().includes(search)
      );
    }
    
    // Sort alphabetically by label name (case-insensitive)
    return [...filtered].sort((a, b) => 
      (a.label || '').toLowerCase().localeCompare((b.label || '').toLowerCase())
    );
  }, [animalTags, searchText]);

  // Determine what to show based on view mode and selection
  const showObservations = (viewMode === 'camera-centric' && selectedDeploymentId !== null) ||
                           (viewMode === 'animal-centric' && selectedAnimalLabel !== null);

  // Group observations by image ID to deduplicate (works for both camera-centric and animal-centric)
  const groupedObservations = useMemo(() => {
    if (!showObservations) {
      return null;
    }
    
    // Filter out person/people observations
    const filteredObs = observations.filter(obs => {
      const labelLower = obs.label?.toLowerCase() || '';
      return labelLower !== 'person' && labelLower !== 'people';
    });
    
    // Group by animl_image_id
    const grouped = new Map<string, GroupedObservation>();
    
    filteredObs.forEach(obs => {
      const imageId = obs.animl_image_id || `unknown-${obs.id}`;
      
      if (grouped.has(imageId)) {
        const existing = grouped.get(imageId)!;
        // Add label if not already present
        if (!existing.labels.includes(obs.label)) {
          existing.labels.push(obs.label);
        }
      } else {
        // Create new grouped observation
        grouped.set(imageId, {
          animl_image_id: imageId,
          deployment_id: obs.deployment_id,
          deployment_name: obs.deployment_name,
          timestamp: obs.timestamp,
          labels: [obs.label],
          medium_url: obs.medium_url,
          small_url: obs.small_url,
          geometry: obs.geometry,
          primaryId: obs.id // Use first observation's ID
        });
      }
    });
    
    // Sort labels: prioritize non-"animal" labels, then alphabetically
    grouped.forEach(group => {
      group.labels.sort((a, b) => {
        const aLower = a.toLowerCase();
        const bLower = b.toLowerCase();
        const aIsAnimal = aLower === 'animal';
        const bIsAnimal = bLower === 'animal';
        
        // If one is "animal" and the other isn't, put non-"animal" first
        if (aIsAnimal && !bIsAnimal) return 1;
        if (!aIsAnimal && bIsAnimal) return -1;
        
        // Otherwise, sort alphabetically
        return a.localeCompare(b);
      });
    });
    
    return Array.from(grouped.values());
  }, [observations, viewMode, showObservations]);

  // Filter observations by search text (for grouped or ungrouped)
  const filteredObservations = useMemo(() => {
    const obsToFilter = groupedObservations || observations;
    
    if (!searchText.trim()) {
      return obsToFilter;
    }
    
    const search = searchText.toLowerCase();
    
    if (groupedObservations) {
      // Filter grouped observations by labels or deployment name
      return (obsToFilter as GroupedObservation[]).filter(group =>
        group.labels.some(label => label.toLowerCase().includes(search)) ||
        group.deployment_name?.toLowerCase().includes(search)
      );
    } else {
      // Filter regular observations
      return (obsToFilter as AnimlImageLabel[]).filter(obs =>
        obs.label?.toLowerCase().includes(search) ||
        obs.deployment_name?.toLowerCase().includes(search)
      );
    }
  }, [observations, groupedObservations, searchText]);

  // Reset pagination when filters change
  const resetPagination = () => setCurrentPage(1);

  // Reset pagination when search context changes (new search/query)
  useEffect(() => {
    const currentContext = {
      viewMode,
      selectedDeploymentId: selectedDeploymentId ?? null,
      selectedAnimalLabel: selectedAnimalLabel ?? null,
      observationsLength: observations.length
    };
    
    const prevContext = prevSearchContextRef.current;
    
    // If this is the first render, just store the context
    if (!prevContext) {
      prevSearchContextRef.current = currentContext;
      return;
    }
    
    // Check if search context has changed (indicating a new search)
    const contextChanged = 
      prevContext.viewMode !== currentContext.viewMode ||
      prevContext.selectedDeploymentId !== currentContext.selectedDeploymentId ||
      prevContext.selectedAnimalLabel !== currentContext.selectedAnimalLabel ||
      // If observations length changed significantly, it's likely a new search
      (prevContext.observationsLength === 0 && currentContext.observationsLength > 0) ||
      (prevContext.observationsLength > 0 && currentContext.observationsLength === 0);
    
    if (contextChanged) {
      setCurrentPage(1);
      prevSearchContextRef.current = currentContext;
    } else {
      // Update observations length in context (but don't reset pagination)
      prevSearchContextRef.current = currentContext;
    }
  }, [viewMode, selectedDeploymentId, selectedAnimalLabel, observations.length]);

  // Paginate observations (works for both grouped and ungrouped)
  const paginatedObservations = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    return filteredObservations.slice(startIndex, endIndex);
  }, [filteredObservations, currentPage, pageSize]);

  const totalPages = Math.ceil(filteredObservations.length / pageSize);

  // Handle observation click (works for both grouped and ungrouped)
  const handleObservationClick = (obs: AnimlImageLabel | GroupedObservation) => {
    const obsId = 'primaryId' in obs ? obs.primaryId : obs.id;
    if (expandedObservation === obsId) {
      setExpandedObservation(null);
    } else {
      setExpandedObservation(obsId);
    }
    
    // Convert to AnimlImageLabel format for onObservationClick
    if ('primaryId' in obs) {
      // It's a grouped observation
      const animlObs: AnimlImageLabel = {
        id: obs.primaryId,
        animl_image_id: obs.animl_image_id,
        deployment_id: obs.deployment_id,
        deployment_name: obs.deployment_name,
        timestamp: obs.timestamp,
        label: obs.labels[0], // Use first (prioritized) label
        medium_url: obs.medium_url,
        small_url: obs.small_url,
        geometry: obs.geometry
      };
      onObservationClick?.(animlObs);
    } else {
      onObservationClick?.(obs);
    }
  };

  // Auto-scroll to selected observation when clicked from map
  useEffect(() => {
    if (selectedObservationId !== prevSelectedObservationIdRef.current) {
      prevSelectedObservationIdRef.current = selectedObservationId ?? null;
      
      if (selectedObservationId) {
        let observationIndex = -1;
        if (groupedObservations) {
          observationIndex = (filteredObservations as GroupedObservation[]).findIndex(
            (obs: GroupedObservation) => obs.primaryId === selectedObservationId
          );
        } else {
          observationIndex = (filteredObservations as AnimlImageLabel[]).findIndex(
            (obs: AnimlImageLabel) => obs.id === selectedObservationId
          );
        }
        
        if (observationIndex !== -1) {
          const targetPage = Math.floor(observationIndex / pageSize) + 1;
          
          if (currentPage !== targetPage) {
            setCurrentPage(targetPage);
          }
          
          setTimeout(() => {
            const cardElement = document.getElementById(`animl-observation-${selectedObservationId}`);
            if (cardElement) {
              cardElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
              setExpandedObservation(selectedObservationId);
            }
          }, currentPage !== targetPage ? 200 : 100);
        }
      }
    }
  }, [selectedObservationId, filteredObservations, currentPage, pageSize, groupedObservations]);

  // Find observation by ID (works for both grouped and ungrouped)
  // Also handles finding by image ID when in grouped mode
  const findObservationById = (id: number): AnimlImageLabel | GroupedObservation | null => {
    if (groupedObservations) {
      // First try to find by primaryId
      let found = groupedObservations.find(group => group.primaryId === id);
      
      // If not found, try to find by matching any observation with the same image ID
      if (!found) {
        const originalObs = observations.find(obs => obs.id === id);
        if (originalObs && originalObs.animl_image_id) {
          found = groupedObservations.find(group => group.animl_image_id === originalObs.animl_image_id);
        }
      }
      
      if (found) {
        // Convert grouped observation back to AnimlImageLabel format for compatibility
        return {
          id: found.primaryId,
          animl_image_id: found.animl_image_id,
          deployment_id: found.deployment_id,
          deployment_name: found.deployment_name,
          timestamp: found.timestamp,
          label: found.labels[0], // Use first (non-"animal" if available) label as primary
          medium_url: found.medium_url,
          small_url: found.small_url,
          geometry: found.geometry
        } as AnimlImageLabel;
      }
    } else {
      return observations.find(obs => obs.id === id) || null;
    }
    return null;
  };

  // Get current observation index for keyboard navigation
  const getCurrentObservationIndex = (): number => {
    if (selectedObservationId === null) return -1;
    if (groupedObservations) {
      // For grouped observations, find by matching image ID
      const selectedObs = observations.find(obs => obs.id === selectedObservationId);
      if (selectedObs?.animl_image_id) {
        return (filteredObservations as GroupedObservation[]).findIndex(
          (obs: GroupedObservation) => obs.animl_image_id === selectedObs.animl_image_id
        );
      }
      // Fallback to primaryId
      return (filteredObservations as GroupedObservation[]).findIndex(
        (obs: GroupedObservation) => obs.primaryId === selectedObservationId
      );
    } else {
      return (filteredObservations as AnimlImageLabel[]).findIndex(
        (obs: AnimlImageLabel) => obs.id === selectedObservationId
      );
    }
  };

  // Keyboard navigation handler
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Only handle if sidebar is focused or mouse is over it
      if (!isSidebarFocusedRef.current && !sidebarRef.current?.matches(':hover')) {
        return;
      }
      
      if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
        event.preventDefault();
        
        const currentIndex = getCurrentObservationIndex();
        if (currentIndex === -1 && filteredObservations.length > 0) {
          // If nothing selected, select first observation
          const firstObs = filteredObservations[0];
          if (groupedObservations) {
            const groupObs = firstObs as GroupedObservation;
            // Use the primaryId to find the original observation
            const originalObs = observations.find(obs => obs.id === groupObs.primaryId);
            if (originalObs) {
              onObservationClick?.(originalObs);
            }
          } else {
            onObservationClick?.(firstObs as AnimlImageLabel);
          }
          return;
        }
        
        const direction = event.key === 'ArrowRight' ? 1 : -1;
        const newIndex = currentIndex + direction;
        
        if (newIndex >= 0 && newIndex < filteredObservations.length) {
          const nextObs = filteredObservations[newIndex];
          if (groupedObservations) {
            const groupObs = nextObs as GroupedObservation;
            // Use the primaryId to find the original observation
            const originalObs = observations.find(obs => obs.id === groupObs.primaryId);
            if (originalObs) {
              onObservationClick?.(originalObs);
            }
          } else {
            onObservationClick?.(nextObs as AnimlImageLabel);
          }
        }
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [filteredObservations, selectedObservationId, groupedObservations, onObservationClick, observations]);

  // Track sidebar focus
  useEffect(() => {
    const sidebar = sidebarRef.current;
    if (!sidebar) return;
    
    const handleFocus = () => { isSidebarFocusedRef.current = true; };
    const handleBlur = () => { isSidebarFocusedRef.current = false; };
    const handleMouseEnter = () => { isSidebarFocusedRef.current = true; };
    const handleMouseLeave = () => { isSidebarFocusedRef.current = false; };
    
    sidebar.addEventListener('focusin', handleFocus);
    sidebar.addEventListener('focusout', handleBlur);
    sidebar.addEventListener('mouseenter', handleMouseEnter);
    sidebar.addEventListener('mouseleave', handleMouseLeave);
    
    return () => {
      sidebar.removeEventListener('focusin', handleFocus);
      sidebar.removeEventListener('focusout', handleBlur);
      sidebar.removeEventListener('mouseenter', handleMouseEnter);
      sidebar.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, []);

  // Show empty state if no search has been performed
  if (!hasSearched) {
    return (
      <div ref={sidebarRef} id="animl-sidebar" className="w-96 bg-white border-r border-gray-200 flex flex-col h-full focus:outline-none" tabIndex={0}>
        <div id="animl-empty-state" className="flex flex-col items-center justify-center h-full p-8 text-center">
          <div id="search-prompt-icon" className="mb-4">
            <svg className="w-16 h-16 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <h3 id="animl-empty-state-title" className="text-lg font-medium text-gray-900 mb-2">Start Your Search</h3>
          <p id="animl-empty-state-description" className="text-sm text-gray-600">
            Enter selection criteria and hit search to see results
          </p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div ref={sidebarRef} id="animl-sidebar-loading" className="w-96 bg-white border-r border-gray-200 flex flex-col h-full focus:outline-none" tabIndex={0}>
        <div id="animl-sidebar-loading-content" className="p-4 border-b border-gray-200">
          <h2 id="animl-sidebar-loading-title" className="text-lg font-semibold text-gray-900 mb-4">Animl Camera Traps</h2>
          <div id="animl-loading-container" className="flex flex-col items-center justify-center h-32 space-y-3">
            <div id="animl-loading-spinner" className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <div id="animl-loading-text" className="text-center">
              <p id="animl-loading-message" className="text-sm text-gray-600 font-medium">Loading camera trap data...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div ref={sidebarRef} id="animl-sidebar" className="w-96 bg-white border-r border-gray-200 flex flex-col focus:outline-none" tabIndex={0}>
      {/* Header */}
      <div id="animl-sidebar-header" className="p-4 border-b border-gray-200">
        <div id="animl-sidebar-title-container" className="mb-2">
          <h2 id="animl-sidebar-title" className="text-lg font-semibold text-gray-900">Animl Camera Traps</h2>
        </div>
        
        {/* View Mode Toggle */}
        <div id="animl-view-mode-toggle" className="mb-3 flex gap-2">
          <button
            id="camera-centric-toggle"
            onClick={() => onViewModeChange('camera-centric')}
            className={`flex-1 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
              viewMode === 'camera-centric'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <Camera className="w-4 h-4 inline mr-1" />
            Cameras
          </button>
          <button
            id="animal-centric-toggle"
            onClick={() => onViewModeChange('animal-centric')}
            className={`flex-1 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
              viewMode === 'animal-centric'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <Tag className="w-4 h-4 inline mr-1" />
            Animals
          </button>
        </div>

        {/* Summary */}
        <div id="animl-sidebar-summary" className="text-sm text-gray-600 mb-3">
          {showObservations ? (
            <span id="animl-summary-observations">
              {totalObservationsCount !== null ? totalObservationsCount.toLocaleString() : filteredObservations.length} observations {dateRangeText}
            </span>
          ) : viewMode === 'camera-centric' ? (
            <span id="animl-summary-cameras">{filteredDeployments.length} cameras {dateRangeText}</span>
          ) : (
            <span id="animl-summary-animals">{filteredAnimalTags.length} animal species {dateRangeText}</span>
          )}
        </div>

        {/* Search */}
        <div id="animl-search" className="mb-3">
          <input
            id="animl-search-input"
            type="text"
            value={searchText}
            onChange={(e) => { setSearchText(e.target.value); resetPagination(); }}
            placeholder={showObservations ? "Search observations..." : viewMode === 'camera-centric' ? "Search cameras..." : "Search animals..."}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Content */}
      <div id="animl-content" className="flex-1 overflow-y-auto">
        {showObservations ? (
          /* Observations List */
          <>
            {/* Back Button + Camera Name - Show when viewing camera observations in camera-centric mode */}
            {viewMode === 'camera-centric' && selectedDeploymentId !== null && (
              <div id="animl-camera-subheader-container" className="p-4 border-b border-gray-200 bg-gray-50 sticky top-0 z-10">
                <button
                  id="animl-back-to-cameras-button"
                  onClick={() => onDeploymentClick?.(null)}
                  className="flex items-center text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors mb-2"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to All Cameras
                </button>
                <div className="flex items-center gap-2">
                  <Camera className="w-4 h-4 text-gray-600" />
                  <h3 id="animl-camera-subheader-name" className="text-sm font-semibold text-gray-900">
                    {deployments.find(dep => dep.id === selectedDeploymentId)?.name || 
                     deployments.find(dep => dep.id === selectedDeploymentId)?.animl_dp_id || 
                     'Selected Camera'}
                  </h3>
                </div>
              </div>
            )}
            
            {/* Back Button - Show when viewing animal category observations */}
            {viewMode === 'animal-centric' && selectedAnimalLabel && (
              <div id="animl-back-button-container" className="p-4 border-b border-gray-200 bg-gray-50 sticky top-0 z-10">
                <button
                  id="animl-back-button"
                  onClick={() => onAnimalTagClick?.(null)}
                  className="flex items-center text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to All
                </button>
              </div>
            )}
            
            {/* Loading indicator for observations */}
            {loadingObservations ? (
              <div id="animl-observations-loading" className="p-4 text-center">
                <div id="animl-observations-loading-spinner" className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto mb-2"></div>
                <p id="animl-observations-loading-message" className="text-sm text-gray-600">Loading observations...</p>
              </div>
            ) : filteredObservations.length === 0 ? (
              <div id="animl-no-observations" className="p-4 text-center text-gray-500">
                <Info id="animl-no-observations-icon" className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                <p id="animl-no-observations-message" className="text-sm">No observations found</p>
              </div>
            ) : (
                <>
                <div id="animl-observations-list" className="divide-y divide-gray-200">
                {paginatedObservations.map((observation, obsIndex) => {
                  // Handle both grouped and ungrouped observations
                  const isGrouped = groupedObservations !== null;
                  const obsId = isGrouped ? (observation as GroupedObservation).primaryId : (observation as AnimlImageLabel).id;
                  const obsLabels = isGrouped ? (observation as GroupedObservation).labels : [(observation as AnimlImageLabel).label];
                  const obsTimestamp = isGrouped ? (observation as GroupedObservation).timestamp : (observation as AnimlImageLabel).timestamp;
                  const obsDeploymentName = isGrouped ? (observation as GroupedObservation).deployment_name : (observation as AnimlImageLabel).deployment_name;
                  const obsSmallUrl = isGrouped ? (observation as GroupedObservation).small_url : (observation as AnimlImageLabel).small_url;
                  const obsMediumUrl = isGrouped ? (observation as GroupedObservation).medium_url : (observation as AnimlImageLabel).medium_url;
                  const obsImageId = isGrouped ? (observation as GroupedObservation).animl_image_id : (observation as AnimlImageLabel).animl_image_id;
                  
                  // Check if this observation should be highlighted
                  // For grouped observations, check if selectedObservationId matches this image ID
                  let isSelected = false;
                  if (selectedObservationId !== null) {
                    if (isGrouped) {
                      // For grouped, check if the selected observation has the same image ID
                      const selectedObs = observations.find(obs => obs.id === selectedObservationId);
                      isSelected = selectedObs?.animl_image_id === obsImageId;
                    } else {
                      isSelected = selectedObservationId === obsId;
                    }
                  }
                  const isExpanded = expandedObservation === obsId;
                  
                  return (
                  <div
                    key={`observation-${obsId}-${obsImageId || 'no-image-id'}-${obsIndex}`}
                    id={`animl-observation-${obsId}`}
                    className={`p-4 cursor-pointer hover:bg-gray-50 transition-colors ${
                      (isSelected || isExpanded)
                        ? 'bg-blue-50 border-l-4 border-blue-500' 
                        : ''
                    }`}
                    onClick={() => handleObservationClick(observation)}
                  >
                    <div id={`animl-observation-wrapper-${obsId}`} className="flex items-start space-x-3">
                      {obsSmallUrl || obsMediumUrl ? (
                        <ThumbnailImage
                          src={obsSmallUrl || obsMediumUrl || ''}
                          alt={obsLabels[0]}
                          width={48}
                          height={48}
                          className="flex-shrink-0"
                        />
                      ) : (
                        <div id={`animl-observation-placeholder-${obsId}`} className="w-12 h-12 rounded-lg bg-gray-200 flex items-center justify-center flex-shrink-0">
                          <Camera id={`animl-observation-placeholder-icon-${obsId}`} className="w-6 h-6 text-gray-400" />
                        </div>
                      )}
                      
                      <div id={`animl-observation-content-${obsId}`} className="flex-1 min-w-0">
                        <div id={`animl-observation-header-${obsId}`} className="flex items-center justify-between">
                          <div className="flex-1 min-w-0">
                            {isGrouped && obsLabels.length > 1 ? (
                              <div className="space-y-1">
                                <h3 id={`animl-observation-primary-label-${obsId}`} className="text-sm font-medium text-gray-900">
                                  {obsLabels[0]}
                                </h3>
                                <div id={`animl-observation-tags-${obsId}`} className="flex flex-wrap gap-1">
                                  {obsLabels.map((label, labelIdx) => (
                                    <span
                                      key={`${obsId}-label-${labelIdx}`}
                                      className="px-1.5 py-0.5 text-xs bg-gray-100 text-gray-700 rounded"
                                    >
                                      {label}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            ) : (
                              <h3 id={`animl-observation-label-${obsId}`} className="text-sm font-medium text-gray-900 truncate">
                                {obsLabels[0]}
                              </h3>
                            )}
                          </div>
                        </div>
                        
                        <div id={`animl-observation-metadata-${obsId}`} className="mt-2 space-y-1">
                          <div id={`animl-observation-date-${obsId}`} className="flex items-center text-xs text-gray-500">
                            <Calendar id={`animl-observation-date-icon-${obsId}`} className="w-3 h-3 mr-1" />
                            {formatDate(obsTimestamp)}
                          </div>
                          {/* Only show camera name in animal-centric mode (redundant in camera-centric mode) */}
                          {obsDeploymentName && viewMode === 'animal-centric' && (
                            <div id={`animl-observation-deployment-${obsId}`} className="flex items-center text-xs text-gray-500">
                              <Camera id={`animl-observation-deployment-icon-${obsId}`} className="w-3 h-3 mr-1" />
                              {obsDeploymentName}
                            </div>
                          )}
                        </div>

                        {/* Expanded Details */}
                        {expandedObservation === obsId && (
                          <div id={`animl-expanded-details-${obsId}`} className="mt-3 space-y-2">
                            {obsMediumUrl && (
                              <img
                                id={`animl-observation-expanded-image-${obsId}`}
                                src={obsMediumUrl}
                                alt={obsLabels[0]}
                                className="w-full rounded-lg"
                              />
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  );
                })}
                </div>
              
                {/* Pagination and Loading More Indicator */}
                <div className="border-t border-gray-200 bg-gray-50">
                  {/* Page Navigation */}
                  {totalPages > 1 && (
                    <div id="animl-pagination" className="flex items-center justify-between p-4">
                      <button
                        id="animl-prev-page"
                        onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                        disabled={currentPage === 1}
                        className="px-3 py-1 text-sm border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
                      >
                        Previous
                      </button>
                      <span id="animl-pagination-info" className="text-sm text-gray-600">
                        Page {currentPage} of {totalPages}
                      </span>
                      <button
                        id="animl-next-page"
                        onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                        disabled={currentPage === totalPages}
                        className="px-3 py-1 text-sm border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
                      >
                        Next
                      </button>
                    </div>
                  )}
                  
                  {/* Loading More Indicator */}
                  {loadingMoreObservations && (
                    <div id="animl-loading-more" className="p-4 text-center border-t border-gray-200">
                      <div id="animl-loading-more-container" className="flex items-center justify-center space-x-2">
                        <div id="animl-loading-more-spinner" className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                        <span id="animl-loading-more-text" className="text-sm text-gray-600">Loading more observations...</span>
                      </div>
                    </div>
                  )}
                  
                  {/* Total Count Info */}
                  {totalObservationsCount !== null && (
                    <div id="animl-count-info" className="px-4 pb-4 text-center border-t border-gray-200">
                      <p id="animl-count-info-text" className="text-xs text-gray-500">
                        {loadingMoreObservations ? (
                          <>
                            Showing {filteredObservations.length.toLocaleString()} of {totalObservationsCount.toLocaleString()} observations (loading more...)
                          </>
                        ) : filteredObservations.length < totalObservationsCount ? (
                          <>
                            Showing {filteredObservations.length.toLocaleString()} of {totalObservationsCount.toLocaleString()} observations
                          </>
                        ) : (
                          <>
                            Showing all {filteredObservations.length.toLocaleString()} observations
                          </>
                        )}
                      </p>
                    </div>
                  )}
                </div>
                </>
              )}
            </>
        ) : viewMode === 'camera-centric' ? (
          /* Camera-Centric: List of Deployments */
          filteredDeployments.length === 0 ? (
            <div id="animl-no-cameras" className="p-4 text-center text-gray-500">
              <Info id="animl-no-cameras-icon" className="w-8 h-8 mx-auto mb-2 text-gray-400" />
              <p id="animl-no-cameras-message" className="text-sm">No cameras found</p>
            </div>
          ) : (
            <div id="animl-deployments-list" className="divide-y divide-gray-200">
              {filteredDeployments.map((deployment, index) => (
                <div
                  key={`deployment-${deployment.id}-${deployment.animl_dp_id}-${index}`}
                  id={`animl-deployment-${deployment.id}`}
                  className={`p-4 cursor-pointer hover:bg-gray-50 transition-colors ${
                    selectedDeploymentId === deployment.id ? 'bg-blue-50 border-l-4 border-blue-500' : ''
                  }`}
                  onClick={() => onDeploymentClick?.(deployment)}
                >
                  <div id={`animl-deployment-content-${deployment.id}`} className="flex items-start justify-between">
                    <div id={`animl-deployment-info-${deployment.id}`} className="flex-1 min-w-0">
                      <h3 id={`animl-deployment-name-${deployment.id}`} className="text-sm font-medium text-gray-900">{deployment.name || deployment.animl_dp_id}</h3>
                      {deployment.totalObservations !== undefined && (
                        <p id={`animl-deployment-observations-${deployment.id}`} className="text-xs text-gray-600 mt-1">
                          {deployment.totalObservations} observations
                          {deployment.uniqueAnimals && deployment.uniqueAnimals.length > 0 && (
                            <span id={`animl-deployment-species-count-${deployment.id}`} className="ml-2">
                              • {deployment.uniqueAnimals.length} species
                            </span>
                          )}
                        </p>
                      )}
                      {deployment.firstObservation && deployment.lastObservation && (
                        <p id={`animl-deployment-date-range-${deployment.id}`} className="text-xs text-gray-500 mt-1">
                          {formatDate(deployment.firstObservation)} - {formatDate(deployment.lastObservation)}
                        </p>
                      )}
                    </div>
                    <Camera id={`animl-deployment-icon-${deployment.id}`} className="w-5 h-5 text-gray-400 flex-shrink-0 ml-2" />
                  </div>
                </div>
              ))}
            </div>
          )
        ) : (
          /* Animal-Centric: List of Animal Tags */
          filteredAnimalTags.length === 0 ? (
            <div id="animl-no-animals" className="p-4 text-center text-gray-500">
              <Info id="animl-no-animals-icon" className="w-8 h-8 mx-auto mb-2 text-gray-400" />
              <p id="animl-no-animals-message" className="text-sm">No animals found</p>
            </div>
          ) : (
            <div id="animl-animal-tags-list" className="divide-y divide-gray-200">
              {filteredAnimalTags.map((tag) => (
                <div
                  key={tag.label}
                  id={`animl-animal-tag-${tag.label}`}
                  className={`py-2 px-4 cursor-pointer hover:bg-gray-50 transition-colors ${
                    selectedAnimalLabel === tag.label ? 'bg-blue-50 border-l-4 border-blue-500' : ''
                  }`}
                  onClick={() => onAnimalTagClick?.(tag)}
                >
                  <div id={`animl-animal-tag-content-${tag.label}`} className="flex items-start justify-between">
                    <div id={`animl-animal-tag-info-${tag.label}`} className="flex-1 min-w-0">
                      <h3 id={`animl-animal-tag-label-${tag.label}`} className="text-sm font-medium text-gray-900">
                        {tag.label} ({tag.totalObservations.toLocaleString()})
                      </h3>
                      {tag.firstObservation && tag.lastObservation && (
                        <p id={`animl-animal-tag-date-range-${tag.label}`} className="text-xs text-gray-500 mt-1">
                          {formatDate(tag.firstObservation)} - {formatDate(tag.lastObservation)}
                        </p>
                      )}
                    </div>
                    <Tag id={`animl-animal-tag-icon-${tag.label}`} className="w-5 h-5 text-gray-400 flex-shrink-0 ml-2" />
                  </div>
                </div>
              ))}
            </div>
          )
        )}
      </div>
    </div>
  );
};

export default AnimlSidebar;
