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
  hasImages: _hasImages,
  onHasImagesChange: _onHasImagesChange,
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

  // Calculate animal-only observations (excluding person/people) for consistent counting
  const animalOnlyObservations = useMemo(() => {
    return observations.filter(obs => {
      const labelLower = obs.label?.toLowerCase() || '';
      return labelLower !== 'person' && labelLower !== 'people';
    });
  }, [observations]);

  // Filter deployments to only show those with observations (for animal-centric export tab)
  const deploymentsWithObservations = useMemo(() => {
    if (viewMode !== 'animal-centric') {
      return deployments;
    }
    
    // Get deployment IDs that have at least one animal observation
    const deploymentIdsWithObservations = new Set<number>();
    animalOnlyObservations.forEach(obs => {
      deploymentIdsWithObservations.add(obs.deployment_id);
    });
    
    // Filter deployments to only include those with observations
    return deployments.filter(dep => deploymentIdsWithObservations.has(dep.id));
  }, [viewMode, deployments, animalOnlyObservations]);

  // Track if we've auto-selected cameras in animal-centric mode
  const hasAutoSelectedCameras = useRef(false);
  
  // Reset auto-select flag when view mode changes
  useEffect(() => {
    if (viewMode !== 'animal-centric') {
      hasAutoSelectedCameras.current = false;
    } else {
      // Reset when entering animal-centric mode so we can auto-select
      hasAutoSelectedCameras.current = false;
    }
  }, [viewMode]);

  // Auto-select all cameras in animal-centric mode for export tab
  // Only do this once when entering animal-centric mode, not on every selection change
  // Only select cameras that have observations
  useEffect(() => {
    if (viewMode === 'animal-centric' && onDeploymentIdsChange && deploymentsWithObservations.length > 0) {
      const allDeploymentIds = deploymentsWithObservations.map(dep => dep.id);
      
      // Only auto-select if we haven't done so yet (first time entering animal-centric mode)
      // This allows users to manually deselect cameras without them being re-selected
      if (!hasAutoSelectedCameras.current && allDeploymentIds.length > 0) {
        onDeploymentIdsChange(allDeploymentIds);
        hasAutoSelectedCameras.current = true;
      }
    }
  }, [viewMode, deploymentsWithObservations, onDeploymentIdsChange]);

  // Get effective deployment IDs for filtering
  // In camera-centric mode, if no deployments selected but a camera is selected, default to that camera
  // In animal-centric mode, default to all cameras if none selected
  const effectiveDeploymentIds = useMemo(() => {
    if (selectedDeploymentIds.length > 0) {
      return selectedDeploymentIds;
    }
    // In camera-centric mode, if a camera is selected but no deployments are selected in export,
    // default to the selected camera
    if (viewMode === 'camera-centric' && selectedDeployment) {
      return [selectedDeployment.id];
    }
    // In animal-centric mode, if no cameras selected, default to all cameras
    if (viewMode === 'animal-centric' && deployments.length > 0) {
      return deployments.map(dep => dep.id);
    }
    // Otherwise, no filter (show all)
    return [];
  }, [selectedDeploymentIds, viewMode, selectedDeployment, deployments]);

  // Calculate species counts per camera (for animal-centric mode)
  // This creates a map of: deployment_id -> { label -> count }
  const speciesCountsPerCamera = useMemo(() => {
    const countsMap = new Map<number, Map<string, number>>();
    
    // Initialize map for all deployments
    deployments.forEach(dep => {
      countsMap.set(dep.id, new Map<string, number>());
    });
    
    // Count observations per deployment per species
    // Handle case where observations might not have deployment_id that matches deployments
    observations.forEach(obs => {
      const labelLower = obs.label?.toLowerCase() || '';
      // Skip person/people
      if (labelLower === 'person' || labelLower === 'people') {
        return;
      }
      
      // Try to find the deployment counts for this observation's deployment_id
      const deploymentCounts = countsMap.get(obs.deployment_id);
      if (deploymentCounts) {
        const currentCount = deploymentCounts.get(obs.label) || 0;
        deploymentCounts.set(obs.label, currentCount + 1);
      } else {
        // If deployment_id doesn't match any deployment in our list, 
        // still count it by creating a new entry (in case of data mismatch)
        // This shouldn't happen normally, but handles edge cases
        if (!countsMap.has(obs.deployment_id)) {
          countsMap.set(obs.deployment_id, new Map<string, number>());
        }
        const newDeploymentCounts = countsMap.get(obs.deployment_id)!;
        const currentCount = newDeploymentCounts.get(obs.label) || 0;
        newDeploymentCounts.set(obs.label, currentCount + 1);
      }
    });
    
    return countsMap;
  }, [observations, deployments]);

  // Compute filtered animal tags for animal-centric mode (species with observations from selected cameras)
  const filteredAnimalTags = useMemo(() => {
    if (viewMode !== 'animal-centric' || animalTags.length === 0 || observations.length === 0) {
      return [];
    }

    // Calculate aggregated counts for each species across selected cameras
    const speciesCountsMap = new Map<string, number>();
    
    // Aggregate counts from selected cameras using observation data
    if (effectiveDeploymentIds.length > 0) {
      effectiveDeploymentIds.forEach(deploymentId => {
        const deploymentCounts = speciesCountsPerCamera.get(deploymentId);
        if (deploymentCounts) {
          deploymentCounts.forEach((count, label) => {
            const currentTotal = speciesCountsMap.get(label) || 0;
            speciesCountsMap.set(label, currentTotal + count);
          });
        }
      });
    }
    
    // Filter animal tags to only show those with observations from selected cameras
    return animalTags.filter(tag => {
      // Filter out person/people labels
      const labelLower = tag.label?.toLowerCase() || '';
      if (labelLower === 'person' || labelLower === 'people') {
        return false;
      }
      
      // If no cameras selected (shouldn't happen in animal-centric mode, but handle it)
      if (effectiveDeploymentIds.length === 0) {
        return true; // Show all species when no cameras selected
      }
      
      // Get aggregated count for this species across selected cameras
      const speciesCount = speciesCountsMap.get(tag.label) || 0;
      
      // Only show species with count > 0 from selected cameras
      return speciesCount > 0;
    }).map(tag => ({
      ...tag,
      aggregatedCount: effectiveDeploymentIds.length > 0
        ? (speciesCountsMap.get(tag.label) || 0)
        : tag.totalObservations
    }));
  }, [viewMode, animalTags, observations.length, effectiveDeploymentIds, speciesCountsPerCamera]);

  // Track if we've auto-selected labels in animal-centric mode
  const hasAutoSelectedLabels = useRef(false);
  const lastFilteredAnimalTagsRef = useRef<string>('');
  
  // Reset auto-select flag when view mode changes
  useEffect(() => {
    if (viewMode !== 'animal-centric') {
      hasAutoSelectedLabels.current = false;
      lastFilteredAnimalTagsRef.current = '';
    } else {
      // Reset when entering animal-centric mode so we can auto-select
      hasAutoSelectedLabels.current = false;
    }
  }, [viewMode]);

  // Auto-select all animal species in animal-centric mode for export tab
  useEffect(() => {
    if (viewMode === 'animal-centric' && onLabelsChange && filteredAnimalTags.length > 0) {
      const allFilteredLabels = filteredAnimalTags.map(tag => tag.label);
      const filteredTagsKey = allFilteredLabels.sort().join(',');
      
      // Determine if we need to auto-select:
      // 1. First time entering animal-centric mode with filtered tags available
      // 2. Filtered tags changed (e.g., cameras finished loading) and no labels selected yet
      // 3. Filtered tags changed and currently selected labels are empty
      const isFirstTime = !hasAutoSelectedLabels.current;
      const tagsChanged = lastFilteredAnimalTagsRef.current !== filteredTagsKey;
      const noLabelsSelected = selectedLabels.length === 0;
      
      // Auto-select if: first time, OR (tags changed AND no labels selected)
      // This ensures we select all by default without overriding user's manual selections
      if (isFirstTime || (tagsChanged && noLabelsSelected)) {
        onLabelsChange(allFilteredLabels);
        hasAutoSelectedLabels.current = true;
        lastFilteredAnimalTagsRef.current = filteredTagsKey;
      } else if (tagsChanged && !noLabelsSelected) {
        // Tags changed but user has selections - update the key but don't override
        lastFilteredAnimalTagsRef.current = filteredTagsKey;
      }
    }
  }, [viewMode, filteredAnimalTags, selectedLabels, onLabelsChange]);

  // Get animal species for selected camera(s) (camera-centric mode)
  // Counts reflect currently selected deployments in export filter
  const cameraAnimalSpecies = useMemo(() => {
    if (viewMode !== 'camera-centric') {
      return [];
    }
    
    // Use effective deployment IDs (which defaults to selected camera if no export filter set)
    const deploymentIdsToUse = effectiveDeploymentIds.length > 0 
      ? effectiveDeploymentIds 
      : (selectedDeployment ? [selectedDeployment.id] : []);
    
    if (deploymentIdsToUse.length === 0) {
      return [];
    }
    
    // Get unique labels from observations for selected camera(s)
    const speciesSet = new Set<string>();
    const speciesCounts = new Map<string, number>();
    
    observations
      .filter(obs => deploymentIdsToUse.includes(obs.deployment_id))
      .forEach(obs => {
        const label = obs.label?.toLowerCase();
        // Filter out person/people
        if (label && label !== 'person' && label !== 'people') {
          speciesSet.add(obs.label);
          speciesCounts.set(obs.label, (speciesCounts.get(obs.label) || 0) + 1);
        }
      });
    
    // Convert to array and sort alphabetically
    return Array.from(speciesSet)
      .map(label => ({
        label,
        count: speciesCounts.get(label) || 0
      }))
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [viewMode, selectedDeployment, observations, effectiveDeploymentIds]);

  // Calculate filtered observations for export
  const filteredObservations = useMemo(() => {
    // Start with animal-only observations (exclude person/people by default)
    let filtered = animalOnlyObservations;

    // Apply deployment filter
    if (effectiveDeploymentIds.length > 0) {
      filtered = filtered.filter(obs => effectiveDeploymentIds.includes(obs.deployment_id));
    }

    // Apply label filter (animal-centric or camera-centric species selection)
    if (selectedLabels.length > 0) {
      filtered = filtered.filter(obs => selectedLabels.includes(obs.label));
    }

    // Note: Image filter removed - all camera trap observations have images by definition

    return filtered;
  }, [animalOnlyObservations, effectiveDeploymentIds, selectedLabels]);

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

    // Compare against animal-only observations (excluding person/people)
    const hasAdditionalFilters = filteredObservations.length !== animalOnlyObservations.length;

    return (
      <div id="animl-export-content" className="flex flex-col h-full">
        <div id="animl-export-header" className="p-4 border-b border-gray-200 bg-white">
          <h3 className="text-sm font-medium text-gray-900 mb-2">Animl Camera Traps</h3>
          <p className="text-sm">
            {hasAdditionalFilters ? (
              <>
                <span className="font-semibold text-blue-600">{filteredObservations.length} filtered</span>
                <span className="text-gray-400 mx-1">/</span>
                <span className="text-gray-600">{animalOnlyObservations.length} total observations</span>
                <span className="text-gray-600"> {dateRangeText}</span>
              </>
            ) : (
              <span className="text-gray-600">{animalOnlyObservations.length} total observations {dateRangeText}</span>
            )}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            View Mode: <span className="font-medium">{viewMode === 'camera-centric' ? 'Camera-Centric' : 'Animal-Centric'}</span>
          </p>
        </div>

        <div id="animl-export-filters" className="flex-1 overflow-y-auto p-4 space-y-6">
          {/* Camera-Centric Mode: Show selected camera info and species filter */}
          {viewMode === 'camera-centric' && selectedDeployment && (
            <>
              {/* Selected Camera Info */}
              <div id="animl-selected-camera-info" className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center gap-2">
                  <Camera className="w-4 h-4 text-blue-600" />
                  <div>
                    <p className="text-xs text-blue-600 uppercase tracking-wide mb-1">Currently Selected Camera Trap</p>
                    <p className="text-sm font-semibold text-blue-900">
                      {selectedDeployment.name || selectedDeployment.animl_dp_id}
                    </p>
                  </div>
                </div>
              </div>

              {/* Animal Species Filter (Camera-Centric) - Show species for selected camera */}
              {onLabelsChange && cameraAnimalSpecies.length > 0 && (
                <div id="animl-camera-species-filter-section" className="space-y-3">
                  <h4 className="text-sm font-medium text-gray-900 flex items-center">
                    <Filter className="w-4 h-4 mr-2" />
                    Animal Species
                  </h4>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {cameraAnimalSpecies.map(species => {
                      const isChecked = selectedLabels.includes(species.label);
                      return (
                        <label
                          key={species.label}
                          id={`animl-camera-species-filter-${species.label}`}
                          className="flex items-center cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={(e) => {
                              if (e.target.checked) {
                                onLabelsChange([...selectedLabels, species.label]);
                              } else {
                                onLabelsChange(selectedLabels.filter(l => l !== species.label));
                              }
                            }}
                            className="mr-2 cursor-pointer"
                          />
                          <span className="text-sm text-gray-700">{species.label} ({species.count})</span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              )}
            </>
          )}

          {/* Animal-Centric Mode: Show deployment filter and species filter */}
          {viewMode === 'animal-centric' && (
            <>
              {/* Deployment Filter - Show only deployments with observations */}
              {onDeploymentIdsChange && deployments.length > 0 && (() => {
                // Show message if no deployments have observations
                if (deploymentsWithObservations.length === 0) {
                  return (
                    <div id="animl-no-deployments-message" className="p-4 text-center text-gray-500">
                      <p className="text-sm font-medium mb-1">No camera traps with observations</p>
                      <p className="text-xs text-gray-400">
                        No camera traps found with observations for the selected date range and spatial filters.
                      </p>
                    </div>
                  );
                }

                return (
                  <div id="animl-deployment-filter-section" className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-medium text-gray-900 flex items-center">
                        <Camera className="w-4 h-4 mr-2" />
                        Camera Traps
                      </h4>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            const allDeploymentIds = deploymentsWithObservations.map(dep => dep.id);
                            onDeploymentIdsChange(allDeploymentIds);
                          }}
                          className="text-xs px-2 py-1 text-blue-600 hover:text-blue-700 hover:underline"
                        >
                          Select All
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            onDeploymentIdsChange([]);
                          }}
                          className="text-xs px-2 py-1 text-blue-600 hover:text-blue-700 hover:underline"
                        >
                          Deselect All
                        </button>
                      </div>
                    </div>
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {[...deploymentsWithObservations]
                        .sort((a, b) => {
                          const nameA = (a.name || a.animl_dp_id || '').toLowerCase();
                          const nameB = (b.name || b.animl_dp_id || '').toLowerCase();
                          return nameA.localeCompare(nameB);
                        })
                        .map(deployment => {
                        const isChecked = selectedDeploymentIds.includes(deployment.id);
                        // Count animal-only observations for this deployment
                        const deploymentObservationCount = animalOnlyObservations.filter(
                          obs => obs.deployment_id === deployment.id
                        ).length;
                        
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
                            <span className="text-sm text-gray-700">
                              {deployment.name || deployment.animl_dp_id}
                              {deploymentObservationCount > 0 && (
                                <span className="text-gray-500 ml-1">({deploymentObservationCount})</span>
                              )}
                            </span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                );
              })()}

              {/* Animal Species Filter (Animal-Centric) - Show all species with Select All/Deselect All */}
              {/* Counts reflect currently selected deployments in export filter */}
              {/* Only show species with observations from selected cameras */}
              {onLabelsChange && viewMode === 'animal-centric' && animalTags.length > 0 && (() => {
                const hasObservations = observations.length > 0;
                
                // If no observations available, show message
                if (!hasObservations) {
                  return (
                    <div id="animl-no-observations-message" className="p-4 text-center text-gray-500">
                      <p className="text-sm font-medium mb-1">No observations available</p>
                      <p className="text-xs text-gray-400">
                        No observations found for the selected date range. Try adjusting your search criteria.
                      </p>
                    </div>
                  );
                }
                
                if (filteredAnimalTags.length === 0) {
                  // Show message if cameras are selected but no species have observations
                  if (effectiveDeploymentIds.length > 0) {
                    // We have observations but none match the selected cameras
                    return (
                      <div id="animl-no-species-message" className="p-4 text-center text-gray-500">
                        <p className="text-sm">No animal species found with observations from selected camera(s).</p>
                        <p className="text-xs text-gray-400 mt-1">
                          {effectiveDeploymentIds.length === 1 
                            ? 'Try selecting different cameras or check if observations exist for this camera.'
                            : 'Try selecting different cameras or check if observations exist for these cameras.'}
                        </p>
                      </div>
                    );
                  }
                  return null;
                }

                return (
                  <div id="animl-label-filter-section" className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-medium text-gray-900 flex items-center">
                        <Filter className="w-4 h-4 mr-2" />
                        Animal Species
                      </h4>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            const allLabels = filteredAnimalTags.map(tag => tag.label);
                            onLabelsChange(allLabels);
                          }}
                          className="text-xs px-2 py-1 text-blue-600 hover:text-blue-700 hover:underline"
                        >
                          Select All
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            onLabelsChange([]);
                          }}
                          className="text-xs px-2 py-1 text-blue-600 hover:text-blue-700 hover:underline"
                        >
                          Deselect All
                        </button>
                      </div>
                    </div>
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {filteredAnimalTags.map(tag => {
                        const isChecked = selectedLabels.includes(tag.label);
                        // Use the pre-calculated aggregated count
                        const speciesCount = tag.aggregatedCount || 0;
                        
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
                            <span className="text-sm text-gray-700">{tag.label} ({speciesCount})</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                );
              })()}
            </>
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
                  {hasAdditionalFilters && filteredObservations.length !== animalOnlyObservations.length ? (
                    <>
                      <span className="text-lg font-bold">{filteredObservations.length}</span> observations will be saved after applying additional filters
                    </>
                  ) : (
                    <>
                      <span className="text-lg font-bold">{animalOnlyObservations.length}</span> observations will be saved
                    </>
                  )}
                </p>
                {hasAdditionalFilters && filteredObservations.length !== animalOnlyObservations.length && (
                  <p className="text-xs text-blue-700 mt-1">
                    Filtered from {animalOnlyObservations.length} total observations
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
    <div ref={sidebarRef} id="animl-details-sidebar" className="w-96 bg-white border-l border-gray-200 flex flex-col h-full focus:outline-none" tabIndex={0}>
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
