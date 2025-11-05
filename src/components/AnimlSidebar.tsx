import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Calendar, Camera, Tag, Info, ArrowLeft } from 'lucide-react';
import { AnimlDeployment, AnimlImageLabel, AnimlAnimalTag } from '../services/animlService';
import ThumbnailImage from './ThumbnailImage';

export type AnimlViewMode = 'camera-centric' | 'animal-centric';


interface AnimlSidebarProps {
  viewMode: AnimlViewMode;
  onViewModeChange: (mode: AnimlViewMode) => void;
  
  // Camera-centric data
  deployments?: AnimlDeployment[];
  selectedDeploymentId?: number | null;
  onDeploymentClick?: (deployment: AnimlDeployment) => void;
  
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
  onObservationClick
}) => {
  const [searchText, setSearchText] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [expandedObservation, setExpandedObservation] = useState<number | null>(null);
  const pageSize = 20;
  
  const prevSelectedObservationIdRef = useRef<number | null>(null);

  // Helper function to format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  // Filter deployments by search text (camera-centric mode)
  const filteredDeployments = useMemo(() => {
    if (!searchText.trim()) {
      return deployments;
    }
    
    const search = searchText.toLowerCase();
    return deployments.filter(dep =>
      dep.name?.toLowerCase().includes(search) ||
      dep.animl_dp_id?.toLowerCase().includes(search)
    );
  }, [deployments, searchText]);

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

  // Filter observations by search text
  const filteredObservations = useMemo(() => {
    if (!searchText.trim()) {
      return observations;
    }
    
    const search = searchText.toLowerCase();
    return observations.filter(obs =>
      obs.label?.toLowerCase().includes(search) ||
      obs.deployment_name?.toLowerCase().includes(search)
    );
  }, [observations, searchText]);

  // Reset pagination when filters change
  const resetPagination = () => setCurrentPage(1);

  // Paginate observations
  const paginatedObservations = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    return filteredObservations.slice(startIndex, endIndex);
  }, [filteredObservations, currentPage, pageSize]);

  const totalPages = Math.ceil(filteredObservations.length / pageSize);

  // Auto-scroll to selected observation when clicked from map
  useEffect(() => {
    if (selectedObservationId !== prevSelectedObservationIdRef.current) {
      prevSelectedObservationIdRef.current = selectedObservationId ?? null;
      
      if (selectedObservationId) {
        const observationIndex = filteredObservations.findIndex(
          obs => obs.id === selectedObservationId
        );
        
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
  }, [selectedObservationId, filteredObservations, currentPage, pageSize]);

  // Handle observation click
  const handleObservationClick = (obs: AnimlImageLabel) => {
    if (expandedObservation === obs.id) {
      setExpandedObservation(null);
    } else {
      setExpandedObservation(obs.id);
    }
    
    onObservationClick?.(obs);
  };

  // Show empty state if no search has been performed
  if (!hasSearched) {
    return (
      <div id="animl-sidebar" className="w-96 bg-white border-r border-gray-200 flex flex-col h-full">
        <div id="animl-empty-state" className="flex flex-col items-center justify-center h-full p-8 text-center">
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
      <div id="animl-sidebar-loading" className="w-96 bg-white border-r border-gray-200 flex flex-col h-full">
        <div id="animl-sidebar-loading-content" className="p-4 border-b border-gray-200">
          <h2 id="animl-sidebar-loading-title" className="text-lg font-semibold text-gray-900 mb-4">Animl Camera Traps</h2>
          <div id="animl-loading-container" className="flex flex-col items-center justify-center h-32 space-y-3">
            <div id="animl-loading-spinner" className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <div id="animl-loading-text" className="text-center">
              <p className="text-sm text-gray-600 font-medium">Loading camera trap data...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Determine what to show based on view mode and selection
  const showObservations = (viewMode === 'camera-centric' && selectedDeploymentId !== null) ||
                           (viewMode === 'animal-centric' && selectedAnimalLabel !== null);

  return (
    <div id="animl-sidebar" className="w-96 bg-white border-r border-gray-200 flex flex-col">
      {/* Header */}
      <div id="animl-sidebar-header" className="p-4 border-b border-gray-200">
        <div className="mb-2">
          <h2 className="text-lg font-semibold text-gray-900">Animl Camera Traps</h2>
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
        <div className="text-sm text-gray-600 mb-3">
          {showObservations ? (
            <span>{filteredObservations.length} observations {dateRangeText}</span>
          ) : viewMode === 'camera-centric' ? (
            <span>{filteredDeployments.length} cameras {dateRangeText}</span>
          ) : (
            <span>{filteredAnimalTags.length} animal species {dateRangeText}</span>
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
          filteredObservations.length === 0 ? (
            <div id="animl-no-observations" className="p-4 text-center text-gray-500">
              <Info className="w-8 h-8 mx-auto mb-2 text-gray-400" />
              <p className="text-sm">No observations found</p>
            </div>
          ) : (
            <>
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
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto mb-2"></div>
                  <p className="text-sm text-gray-600">Loading observations...</p>
                </div>
              ) : (
                <>
                <div className="divide-y divide-gray-200">
                {paginatedObservations.map((observation, obsIndex) => (
                  <div
                    key={`observation-${observation.id}-${observation.animl_image_id || 'no-image-id'}-${obsIndex}`}
                    id={`animl-observation-${observation.id}`}
                    className={`p-4 cursor-pointer hover:bg-gray-50 transition-colors ${
                      (selectedObservationId !== null && selectedObservationId === observation.id) || 
                      expandedObservation === observation.id 
                        ? 'bg-blue-50 border-l-4 border-blue-500' 
                        : ''
                    }`}
                    onClick={() => handleObservationClick(observation)}
                  >
                    <div className="flex items-start space-x-3">
                      {observation.small_url || observation.medium_url ? (
                        <ThumbnailImage
                          src={observation.small_url || observation.medium_url || ''}
                          alt={observation.label}
                          width={48}
                          height={48}
                          className="flex-shrink-0"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-lg bg-gray-200 flex items-center justify-center flex-shrink-0">
                          <Camera className="w-6 h-6 text-gray-400" />
                        </div>
                      )}
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h3 className="text-sm font-medium text-gray-900 truncate">
                            {observation.label}
                          </h3>
                        </div>
                        
                        <div className="mt-2 space-y-1">
                          <div className="flex items-center text-xs text-gray-500">
                            <Calendar className="w-3 h-3 mr-1" />
                            {formatDate(observation.timestamp)}
                          </div>
                          {observation.deployment_name && (
                            <div className="flex items-center text-xs text-gray-500">
                              <Camera className="w-3 h-3 mr-1" />
                              {observation.deployment_name}
                            </div>
                          )}
                        </div>

                        {/* Expanded Details */}
                        {expandedObservation === observation.id && (
                          <div id={`animl-expanded-details-${observation.id}`} className="mt-3 space-y-2">
                            {observation.medium_url && (
                              <img
                                src={observation.medium_url}
                                alt={observation.label}
                                className="w-full rounded-lg"
                              />
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
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
                      <span className="text-sm text-gray-600">
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
                      <div className="flex items-center justify-center space-x-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                        <span className="text-sm text-gray-600">Loading more observations...</span>
                      </div>
                    </div>
                  )}
                  
                  {/* Total Count Info */}
                  {totalObservationsCount !== null && (
                    <div id="animl-count-info" className="px-4 pb-4 text-center border-t border-gray-200">
                      <p className="text-xs text-gray-500">
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
          )
        ) : viewMode === 'camera-centric' ? (
          /* Camera-Centric: List of Deployments */
          filteredDeployments.length === 0 ? (
            <div id="animl-no-cameras" className="p-4 text-center text-gray-500">
              <Info className="w-8 h-8 mx-auto mb-2 text-gray-400" />
              <p className="text-sm">No cameras found</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {filteredDeployments.map((deployment, index) => (
                <div
                  key={`deployment-${deployment.id}-${deployment.animl_dp_id}-${index}`}
                  id={`animl-deployment-${deployment.id}`}
                  className={`p-4 cursor-pointer hover:bg-gray-50 transition-colors ${
                    selectedDeploymentId === deployment.id ? 'bg-blue-50 border-l-4 border-blue-500' : ''
                  }`}
                  onClick={() => onDeploymentClick?.(deployment)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-medium text-gray-900">{deployment.name || deployment.animl_dp_id}</h3>
                      {deployment.totalObservations !== undefined && (
                        <p className="text-xs text-gray-600 mt-1">
                          {deployment.totalObservations} observations
                          {deployment.uniqueAnimals && deployment.uniqueAnimals.length > 0 && (
                            <span className="ml-2">
                              • {deployment.uniqueAnimals.length} species
                            </span>
                          )}
                        </p>
                      )}
                      {deployment.firstObservation && deployment.lastObservation && (
                        <p className="text-xs text-gray-500 mt-1">
                          {formatDate(deployment.firstObservation)} - {formatDate(deployment.lastObservation)}
                        </p>
                      )}
                    </div>
                    <Camera className="w-5 h-5 text-gray-400 flex-shrink-0 ml-2" />
                  </div>
                </div>
              ))}
            </div>
          )
        ) : (
          /* Animal-Centric: List of Animal Tags */
          filteredAnimalTags.length === 0 ? (
            <div id="animl-no-animals" className="p-4 text-center text-gray-500">
              <Info className="w-8 h-8 mx-auto mb-2 text-gray-400" />
              <p className="text-sm">No animals found</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {filteredAnimalTags.map((tag) => (
                <div
                  key={tag.label}
                  id={`animl-animal-tag-${tag.label}`}
                  className={`p-4 cursor-pointer hover:bg-gray-50 transition-colors ${
                    selectedAnimalLabel === tag.label ? 'bg-blue-50 border-l-4 border-blue-500' : ''
                  }`}
                  onClick={() => onAnimalTagClick?.(tag)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-medium text-gray-900">
                        {tag.label} ({tag.totalObservations.toLocaleString()})
                      </h3>
                      {tag.firstObservation && tag.lastObservation && (
                        <p className="text-xs text-gray-500 mt-1">
                          {formatDate(tag.firstObservation)} - {formatDate(tag.lastObservation)}
                        </p>
                      )}
                    </div>
                    <Tag className="w-5 h-5 text-gray-400 flex-shrink-0 ml-2" />
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
