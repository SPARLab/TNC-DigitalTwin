import React, { useState, useEffect, useMemo, useRef } from 'react';
import { X, Calendar, Camera, Tag, Download, ShoppingCart, Filter, MapPin } from 'lucide-react';
import { AnimlDeployment, AnimlImageLabel, AnimlAnimalTag } from '../services/animlService';
import { AnimlViewMode } from './AnimlSidebar';

interface AnimlDetailsSidebarProps {
  viewMode: AnimlViewMode;
  
  // Selected items (context-aware)
  selectedDeployment?: AnimlDeployment | null;
  selectedAnimalTag?: AnimlAnimalTag | null;
  selectedObservation?: AnimlImageLabel | null;
  
  // Data for display
  deployments?: AnimlDeployment[];
  animalTags?: AnimlAnimalTag[];
  observations?: AnimlImageLabel[];
  
  // Export & cart
  onExportCSV: () => void;
  onExportGeoJSON: () => void;
  onAddToCart?: (filteredCount: number) => void;
  onClose: () => void;
  hasSearched: boolean;
  dateRangeText: string;
  
  // Filter callbacks (for export tab)
  selectedDeploymentIds?: number[];
  onDeploymentIdsChange?: (ids: number[]) => void;
  selectedLabels?: string[];
  onLabelsChange?: (labels: string[]) => void;
  hasImages?: boolean;
  onHasImagesChange?: (hasImages: boolean | undefined) => void;
  
  // For keyboard navigation
  onObservationSelect?: (observation: AnimlImageLabel | null) => void;
}

type TabType = 'details' | 'export';

const AnimlDetailsSidebar: React.FC<AnimlDetailsSidebarProps> = ({
  viewMode,
  selectedDeployment,
  selectedAnimalTag,
  selectedObservation,
  deployments = [],
  animalTags = [],
  observations = [],
  onExportCSV,
  onExportGeoJSON,
  onAddToCart,
  onClose,
  hasSearched,
  dateRangeText,
  selectedDeploymentIds = [],
  onDeploymentIdsChange,
  selectedLabels = [],
  onLabelsChange,
  hasImages,
  onHasImagesChange,
  onObservationSelect
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('details');
  const sidebarRef = useRef<HTMLDivElement>(null);
  const isSidebarFocusedRef = useRef(false);

  // Switch to details tab when an item is selected
  useEffect(() => {
    if (selectedDeployment || selectedAnimalTag || selectedObservation) {
      setActiveTab('details');
    }
  }, [selectedDeployment, selectedAnimalTag, selectedObservation]);

  // Calculate filtered observations for export
  const filteredObservations = useMemo(() => {
    let filtered = observations;

    // Apply deployment filter (camera-centric)
    if (selectedDeploymentIds.length > 0) {
      filtered = filtered.filter(obs => selectedDeploymentIds.includes(obs.deployment_id));
    }

    // Apply label filter (animal-centric)
    if (selectedLabels.length > 0) {
      filtered = filtered.filter(obs => selectedLabels.includes(obs.label));
    }

    // Apply image filter
    if (hasImages === true) {
      filtered = filtered.filter(obs => obs.small_url || obs.medium_url);
    } else if (hasImages === false) {
      filtered = filtered.filter(obs => !obs.small_url && !obs.medium_url);
    }

    return filtered;
  }, [observations, selectedDeploymentIds, selectedLabels, hasImages]);

  // Helper function to format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  // Keyboard navigation handler for details sidebar
  useEffect(() => {
    // Only enable keyboard nav when viewing observations (either selected observation or in camera-centric with deployment)
    const hasObservations = observations.length > 0;
    const shouldEnableNav = (selectedObservation || (viewMode === 'camera-centric' && selectedDeployment)) && hasObservations;
    
    if (!onObservationSelect || !shouldEnableNav) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      // Only handle if sidebar is focused or mouse is over it
      if (!isSidebarFocusedRef.current && !sidebarRef.current?.matches(':hover')) {
        return;
      }
      
      if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
        event.preventDefault();
        
        // If no observation selected, select first
        if (!selectedObservation && observations.length > 0) {
          onObservationSelect(observations[0]);
          return;
        }
        
        if (!selectedObservation) return;
        
        const currentIndex = observations.findIndex(obs => obs.id === selectedObservation.id);
        if (currentIndex === -1 && observations.length > 0) {
          // If current observation not in list, select first
          onObservationSelect(observations[0]);
          return;
        }
        
        const direction = event.key === 'ArrowRight' ? 1 : -1;
        const newIndex = currentIndex + direction;
        
        if (newIndex >= 0 && newIndex < observations.length) {
          onObservationSelect(observations[newIndex]);
        }
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [observations, selectedObservation, onObservationSelect, viewMode, selectedDeployment]);

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

  // Render tab buttons
  const renderTabButtons = () => (
    <div id="animl-details-tabs" className="flex border-b border-gray-200">
      <button
        id="animl-details-tab-button"
        onClick={() => setActiveTab('details')}
        className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
          activeTab === 'details'
            ? 'text-blue-600 bg-white border-x border-gray-200 relative z-10 -mb-px'
            : 'text-gray-600 hover:text-gray-900 bg-gray-50 shadow-[inset_-4px_0_6px_-2px_rgba(0,0,0,0.12),inset_0_-4px_6px_-2px_rgba(0,0,0,0.08)]'
        }`}
      >
        Details
      </button>
      <button
        id="animl-export-tab-button"
        onClick={() => setActiveTab('export')}
        className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
          activeTab === 'export'
            ? 'text-blue-600 bg-white border-x border-gray-200 relative z-10 -mb-px'
            : 'text-gray-600 hover:text-gray-900 bg-gray-50 shadow-[inset_4px_0_6px_-2px_rgba(0,0,0,0.12),inset_0_-4px_6px_-2px_rgba(0,0,0,0.08)]'
        }`}
      >
        Export All
      </button>
    </div>
  );

  // Render Details Tab
  const renderDetailsTab = () => {
    // Camera-centric: show deployment details
    if (viewMode === 'camera-centric' && selectedDeployment) {
      return (
        <div id="animl-details-content" className="flex-1 overflow-y-auto">
          <div id="animl-details-header" className="p-4 border-b border-gray-200 bg-white">
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <Camera className="w-4 h-4 text-gray-400" />
                  <span className="text-xs font-medium text-gray-600">Camera Trap</span>
                </div>
                <h2 className="text-lg font-semibold text-gray-900 break-words">
                  {selectedDeployment.name || selectedDeployment.animl_dp_id}
                </h2>
              </div>
              <button
                id="animl-close-details-button"
                onClick={onClose}
                className="p-2 hover:bg-gray-200 rounded-full transition-colors ml-2 flex-shrink-0"
                aria-label="Close details"
              >
                <X className="w-5 h-5 text-gray-600" />
              </button>
            </div>
          </div>

          <div id="animl-details-metadata" className="p-4 space-y-4">
            {selectedDeployment.animl_dp_id && (
              <div id="animl-deployment-id" className="flex items-start gap-3">
                <div className="w-5 h-5 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-gray-400 text-xs">#</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Deployment ID</p>
                  <p className="text-sm text-gray-900">{selectedDeployment.animl_dp_id}</p>
                </div>
              </div>
            )}

            {selectedDeployment.geometry && (
              <div id="animl-deployment-location" className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Location</p>
                  <p className="text-sm text-gray-900">
                    {selectedDeployment.geometry.coordinates[1].toFixed(4)}, {selectedDeployment.geometry.coordinates[0].toFixed(4)}
                  </p>
                </div>
              </div>
            )}

            {selectedDeployment.totalObservations !== undefined && (
              <div id="animl-deployment-stats" className="p-3 bg-blue-50 rounded-lg">
                <p className="text-sm font-medium text-blue-900 mb-2">Statistics</p>
                <div className="space-y-1 text-sm text-blue-800">
                  <p>Total Observations: {selectedDeployment.totalObservations}</p>
                  {selectedDeployment.uniqueAnimals && selectedDeployment.uniqueAnimals.length > 0 && (
                    <p>Unique Animals: {selectedDeployment.uniqueAnimals.length}</p>
                  )}
                  {selectedDeployment.firstObservation && (
                    <p>First Observation: {formatDate(selectedDeployment.firstObservation)}</p>
                  )}
                  {selectedDeployment.lastObservation && (
                    <p>Last Observation: {formatDate(selectedDeployment.lastObservation)}</p>
                  )}
                </div>
              </div>
            )}

            {selectedDeployment.uniqueAnimals && selectedDeployment.uniqueAnimals.length > 0 && (
              <div id="animl-deployment-animals" className="space-y-2">
                <p className="text-xs text-gray-500 uppercase tracking-wide">Animals Detected</p>
                <div className="flex flex-wrap gap-2">
                  {selectedDeployment.uniqueAnimals.map(animal => (
                    <span
                      key={animal}
                      className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded-md"
                    >
                      {animal}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Observation Details Section (when observation is selected) */}
          {selectedObservation && (
            <>
              <div className="border-t border-gray-200 my-4"></div>
              <div id="animl-observation-section" className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Tag className="w-4 h-4 text-gray-400" />
                  <span className="text-xs font-medium text-gray-600">Selected Observation</span>
                </div>

                {/* Photo */}
                {selectedObservation.medium_url && (
                  <div id="animl-observation-photo-section" className="mb-4">
                    <img
                      id="animl-observation-photo"
                      src={selectedObservation.medium_url}
                      alt={selectedObservation.label}
                      className="w-full rounded-lg"
                      loading="lazy"
                    />
                  </div>
                )}

                <div id="animl-observation-details" className="space-y-4">
                  <div>
                    <h3 className="text-base font-semibold text-gray-900 mb-3">
                      {selectedObservation.label}
                    </h3>
                  </div>

                  <div id="animl-observation-date" className="flex items-start gap-3">
                    <Calendar className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Timestamp</p>
                      <p className="text-sm text-gray-900">{formatDate(selectedObservation.timestamp)}</p>
                    </div>
                  </div>

                  {selectedObservation.deployment_name && (
                    <div id="animl-observation-camera" className="flex items-start gap-3">
                      <Camera className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Camera Trap</p>
                        <p className="text-sm text-gray-900">{selectedObservation.deployment_name}</p>
                      </div>
                    </div>
                  )}

                  {selectedObservation.geometry && (
                    <div id="animl-observation-location" className="flex items-start gap-3">
                      <MapPin className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Location</p>
                        <p className="text-sm text-gray-900">
                          {selectedObservation.geometry.coordinates[1].toFixed(4)}, {selectedObservation.geometry.coordinates[0].toFixed(4)}
                        </p>
                      </div>
                    </div>
                  )}

                  {selectedObservation.animl_image_id && (
                    <div id="animl-observation-image-id" className="flex items-start gap-3">
                      <div className="w-5 h-5 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-gray-400 text-xs">#</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Image ID</p>
                        <p className="text-sm text-gray-900">{selectedObservation.animl_image_id}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      );
    }

    // Animal-centric: show animal tag details or observation details
    if (viewMode === 'animal-centric') {
      if (selectedObservation) {
        return (
          <div id="animl-details-content" className="flex-1 overflow-y-auto">
            <div id="animl-details-header" className="p-4 border-b border-gray-200 bg-white">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Tag className="w-4 h-4 text-gray-400" />
                    <span className="text-xs font-medium text-gray-600">Observation</span>
                  </div>
                  <h2 className="text-lg font-semibold text-gray-900 break-words">
                    {selectedObservation.label}
                  </h2>
                </div>
                <button
                  id="animl-close-details-button"
                  onClick={onClose}
                  className="p-2 hover:bg-gray-200 rounded-full transition-colors ml-2 flex-shrink-0"
                  aria-label="Close details"
                >
                  <X className="w-5 h-5 text-gray-600" />
                </button>
              </div>
            </div>

            {/* Photo */}
            {selectedObservation.medium_url && (
              <div id="animl-details-photo-section" className="p-4 border-b border-gray-200">
                <img
                  id="animl-details-photo"
                  src={selectedObservation.medium_url}
                  alt={selectedObservation.label}
                  className="w-full rounded-lg"
                  loading="lazy"
                />
              </div>
            )}

            <div id="animl-details-metadata" className="p-4 space-y-4">
              <div id="animl-observation-date" className="flex items-start gap-3">
                <Calendar className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Timestamp</p>
                  <p className="text-sm text-gray-900">{formatDate(selectedObservation.timestamp)}</p>
                </div>
              </div>

              {selectedObservation.deployment_name && (
                <div id="animl-observation-camera" className="flex items-start gap-3">
                  <Camera className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Camera Trap</p>
                    <p className="text-sm text-gray-900">{selectedObservation.deployment_name}</p>
                  </div>
                </div>
              )}

              {selectedObservation.geometry && (
                <div id="animl-observation-location" className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Location</p>
                    <p className="text-sm text-gray-900">
                      {selectedObservation.geometry.coordinates[1].toFixed(4)}, {selectedObservation.geometry.coordinates[0].toFixed(4)}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        );
      }

      if (selectedAnimalTag) {
        return (
          <div id="animl-details-content" className="flex-1 overflow-y-auto">
            <div id="animl-details-header" className="p-4 border-b border-gray-200 bg-white">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Tag className="w-4 h-4 text-gray-400" />
                    <span className="text-xs font-medium text-gray-600">Animal Species</span>
                  </div>
                  <h2 className="text-lg font-semibold text-gray-900 break-words">
                    {selectedAnimalTag.label}
                  </h2>
                </div>
                <button
                  id="animl-close-details-button"
                  onClick={onClose}
                  className="p-2 hover:bg-gray-200 rounded-full transition-colors ml-2 flex-shrink-0"
                  aria-label="Close details"
                >
                  <X className="w-5 h-5 text-gray-600" />
                </button>
              </div>
            </div>

            <div id="animl-details-metadata" className="p-4 space-y-4">
              <div id="animl-animal-tag-stats" className="p-3 bg-blue-50 rounded-lg">
                <p className="text-sm font-medium text-blue-900 mb-2">Statistics</p>
                <div className="space-y-1 text-sm text-blue-800">
                  <p>Total Observations: {selectedAnimalTag.totalObservations}</p>
                  <p>Cameras Detected: {selectedAnimalTag.uniqueCameras}</p>
                  {selectedAnimalTag.firstObservation && (
                    <p>First Observation: {formatDate(selectedAnimalTag.firstObservation)}</p>
                  )}
                  {selectedAnimalTag.lastObservation && (
                    <p>Last Observation: {formatDate(selectedAnimalTag.lastObservation)}</p>
                  )}
                </div>
              </div>

              {selectedAnimalTag.recentObservations && selectedAnimalTag.recentObservations.length > 0 && (
                <div id="animl-recent-sightings" className="space-y-2">
                  <p className="text-xs text-gray-500 uppercase tracking-wide">Recent Sightings</p>
                  <div className="grid grid-cols-2 gap-2">
                    {selectedAnimalTag.recentObservations.slice(0, 6).map(obs => (
                      obs.small_url || obs.medium_url ? (
                        <img
                          key={obs.id}
                          src={obs.small_url || obs.medium_url || ''}
                          alt={obs.label}
                          className="w-full rounded-lg"
                        />
                      ) : null
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        );
      }
    }

    // Empty state
    return (
      <div id="animl-details-empty-state" className="flex flex-col items-center justify-center h-full p-8 text-center">
        <div id="animl-details-empty-icon" className="mb-4">
          <svg className="w-16 h-16 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">No Item Selected</h3>
        <p className="text-sm text-gray-600">
          Click an item in the left sidebar to view detailed information
        </p>
      </div>
    );
  };

  // Render Export Tab
  const renderExportTab = () => {
    if (!hasSearched) {
      return (
        <div id="animl-export-empty-state" className="flex flex-col items-center justify-center h-full p-8 text-center">
          <div id="animl-export-empty-icon" className="mb-4">
            <svg className="w-16 h-16 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Search Yet</h3>
          <p className="text-sm text-gray-600">
            Perform a search to see export options
          </p>
        </div>
      );
    }

    const hasAdditionalFilters = filteredObservations.length !== observations.length;

    return (
      <div id="animl-export-content" className="flex flex-col h-full">
        <div id="animl-export-header" className="p-4 border-b border-gray-200 bg-white">
          <h3 className="text-sm font-medium text-gray-900 mb-2">Animl Camera Traps</h3>
          <p className="text-sm">
            {hasAdditionalFilters ? (
              <>
                <span className="font-semibold text-blue-600">{filteredObservations.length} filtered</span>
                <span className="text-gray-400 mx-1">/</span>
                <span className="text-gray-600">{observations.length} total observations</span>
                <span className="text-gray-600"> {dateRangeText}</span>
              </>
            ) : (
              <span className="text-gray-600">{observations.length} total observations {dateRangeText}</span>
            )}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            View Mode: <span className="font-medium">{viewMode === 'camera-centric' ? 'Camera-Centric' : 'Animal-Centric'}</span>
          </p>
        </div>

        <div id="animl-export-filters" className="flex-1 overflow-y-auto p-4 space-y-6">
          {/* Deployment Filter (Camera-Centric) */}
          {viewMode === 'camera-centric' && onDeploymentIdsChange && deployments.length > 0 && (
            <div id="animl-deployment-filter-section" className="space-y-3">
              <h4 className="text-sm font-medium text-gray-900 flex items-center">
                <Filter className="w-4 h-4 mr-2" />
                Camera Traps
              </h4>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {deployments.map(deployment => {
                  const isChecked = selectedDeploymentIds.includes(deployment.id);
                  return (
                    <label
                      key={deployment.id}
                      id={`animl-deployment-filter-${deployment.id}`}
                      className="flex items-center cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={(e) => {
                          if (e.target.checked) {
                            onDeploymentIdsChange([...selectedDeploymentIds, deployment.id]);
                          } else {
                            onDeploymentIdsChange(selectedDeploymentIds.filter(id => id !== deployment.id));
                          }
                        }}
                        className="mr-2 cursor-pointer"
                      />
                      <span className="text-sm text-gray-700">{deployment.name || deployment.animl_dp_id}</span>
                    </label>
                  );
                })}
              </div>
            </div>
          )}

          {/* Label Filter (Animal-Centric) */}
          {viewMode === 'animal-centric' && onLabelsChange && animalTags.length > 0 && (
            <div id="animl-label-filter-section" className="space-y-3">
              <h4 className="text-sm font-medium text-gray-900 flex items-center">
                <Filter className="w-4 h-4 mr-2" />
                Animal Species
              </h4>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {animalTags.map(tag => {
                  const isChecked = selectedLabels.includes(tag.label);
                  return (
                    <label
                      key={tag.label}
                      id={`animl-label-filter-${tag.label}`}
                      className="flex items-center cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={(e) => {
                          if (e.target.checked) {
                            onLabelsChange([...selectedLabels, tag.label]);
                          } else {
                            onLabelsChange(selectedLabels.filter(l => l !== tag.label));
                          }
                        }}
                        className="mr-2 cursor-pointer"
                      />
                      <span className="text-sm text-gray-700">{tag.label} ({tag.totalObservations})</span>
                    </label>
                  );
                })}
              </div>
            </div>
          )}

          {/* Image Filter */}
          {onHasImagesChange && (
            <div id="animl-image-filter-section" className="space-y-3">
              <h4 className="text-sm font-medium text-gray-900 flex items-center">
                <Filter className="w-4 h-4 mr-2" />
                Images
              </h4>
              <div className="space-y-2">
                <label className="flex items-center cursor-pointer">
                  <input
                    type="radio"
                    name="hasImages"
                    checked={hasImages === undefined}
                    onChange={() => onHasImagesChange(undefined)}
                    className="mr-2 cursor-pointer"
                  />
                  <span className="text-sm text-gray-700">All (with or without images)</span>
                </label>
                <label className="flex items-center cursor-pointer">
                  <input
                    type="radio"
                    name="hasImages"
                    checked={hasImages === true}
                    onChange={() => onHasImagesChange(true)}
                    className="mr-2 cursor-pointer"
                  />
                  <span className="text-sm text-gray-700">Has images</span>
                </label>
                <label className="flex items-center cursor-pointer">
                  <input
                    type="radio"
                    name="hasImages"
                    checked={hasImages === false}
                    onChange={() => onHasImagesChange(false)}
                    className="mr-2 cursor-pointer"
                  />
                  <span className="text-sm text-gray-700">No images</span>
                </label>
              </div>
            </div>
          )}
        </div>

        {/* Export Actions Footer */}
        <div id="animl-export-actions" className="p-4 border-t border-gray-200 space-y-3">
          <div id="animl-export-buttons-section">
            <h4 className="text-sm font-medium text-gray-900 flex items-center mb-2">
              <Download className="w-4 h-4 mr-2" />
              Export Data
            </h4>
            <div className="grid grid-cols-3 gap-2">
              <button
                id="animl-export-csv-button"
                onClick={onExportCSV}
                className="px-3 py-2 text-xs font-medium bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors border border-gray-300"
                disabled={observations.length === 0}
              >
                CSV
              </button>
              <button
                id="animl-export-json-button"
                onClick={() => {
                  console.log('JSON export requested');
                }}
                className="px-3 py-2 text-xs font-medium bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors border border-gray-300"
                disabled={observations.length === 0}
              >
                JSON
              </button>
              <button
                id="animl-export-geojson-button"
                onClick={onExportGeoJSON}
                className="px-3 py-2 text-xs font-medium bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors border border-gray-300"
                disabled={observations.length === 0}
              >
                GeoJSON
              </button>
            </div>
          </div>

          {/* Add to Cart Button */}
          {onAddToCart && (
            <div id="animl-add-to-cart-section" className="space-y-3">
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm font-medium text-blue-900">
                  {hasAdditionalFilters && filteredObservations.length !== observations.length ? (
                    <>
                      <span className="text-lg font-bold">{filteredObservations.length}</span> observations will be saved after applying additional filters
                    </>
                  ) : (
                    <>
                      <span className="text-lg font-bold">{observations.length}</span> observations will be saved
                    </>
                  )}
                </p>
                {hasAdditionalFilters && filteredObservations.length !== observations.length && (
                  <p className="text-xs text-blue-700 mt-1">
                    Filtered from {observations.length} total observations
                  </p>
                )}
              </div>
              
              <button
                id="animl-add-to-cart-button"
                onClick={() => onAddToCart(filteredObservations.length)}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={observations.length === 0}
              >
                <ShoppingCart className="w-4 h-4" />
                Add to Cart
              </button>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div ref={sidebarRef} id="animl-details-sidebar" className="w-96 bg-white border-l border-gray-200 flex flex-col h-full" tabIndex={0}>
      {/* Tab Buttons */}
      {renderTabButtons()}

      {/* Tab Content */}
      <div className="flex-1 flex flex-col min-h-0">
        {activeTab === 'details' ? renderDetailsTab() : renderExportTab()}
      </div>
    </div>
  );
};

export default AnimlDetailsSidebar;
