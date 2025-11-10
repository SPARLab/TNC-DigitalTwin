import React, { useState, useEffect, useMemo, useRef } from 'react';
import { X, Calendar, Camera, Tag, Download, ShoppingCart, Filter, MapPin } from 'lucide-react';
import { AnimlDeployment, AnimlImageLabel, AnimlAnimalTag, AnimlCountLookups, animlService } from '../services/animlService';
import { AnimlViewMode } from './AnimlSidebar';

interface AnimlDetailsSidebarProps {
  viewMode: AnimlViewMode;
  
  // Selected items (context-aware)
  selectedDeployment?: AnimlDeployment | null;
  selectedAnimalTag?: AnimlAnimalTag | null;
  selectedObservation?: AnimlImageLabel | null;
  
  // Data for display
  deployments?: AnimlDeployment[];
  animalTags?: AnimlAnimalTag[]; // Not used directly, but kept for compatibility
  observations?: AnimlImageLabel[];
  
  // Count lookups for accurate counts (optimized query)
  countLookups?: AnimlCountLookups | null;
  countsLoading?: boolean;
  
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
  animalTags: _animalTags = [], // Unused but kept for backwards compatibility
  observations = [],
  countLookups,
  countsLoading = false,
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
    
    // Use count lookups if available (preferred - accurate database counts)
    if (countLookups && !countsLoading) {
      const deploymentIdsWithObservations = new Set<number>();
      // Get all deployment IDs that have observations from count lookups
      countLookups.countsByDeployment.forEach((count, deploymentId) => {
        if (count > 0) {
          deploymentIdsWithObservations.add(deploymentId);
        }
      });
      
      // Filter deployments to only include those with observations
      return deployments.filter(dep => deploymentIdsWithObservations.has(dep.id));
    }
    
    // Fallback: use in-memory data (may be incomplete)
    // Get deployment IDs that have at least one animal observation
    const deploymentIdsWithObservations = new Set<number>();
    animalOnlyObservations.forEach(obs => {
      deploymentIdsWithObservations.add(obs.deployment_id);
    });
    
    // Filter deployments to only include those with observations
    return deployments.filter(dep => deploymentIdsWithObservations.has(dep.id));
  }, [viewMode, deployments, animalOnlyObservations, countLookups, countsLoading]);

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
  // In camera-centric mode: ALWAYS use the selected camera (ignore Export tab checkboxes)
  // In animal-centric mode: use selected deployments from Export tab, or all if none selected
  const effectiveDeploymentIds = useMemo(() => {
    console.log('🎯🔢 effectiveDeploymentIds calculation:', {
      viewMode,
      selectedDeploymentIdsLength: selectedDeploymentIds.length,
      selectedDeploymentIds,
      selectedDeploymentId: selectedDeployment?.id,
      deploymentsLength: deployments.length
    });
    
    // In camera-centric mode, ALWAYS use the selected camera (ignore checkboxes)
    if (viewMode === 'camera-centric' && selectedDeployment) {
      console.log('🎯🔢 ✅ Camera-centric FIX: Using ONLY selected camera:', [selectedDeployment.id]);
      return [selectedDeployment.id];
    }
    
    // In animal-centric mode, use checked deployments from Export tab
    if (selectedDeploymentIds.length > 0) {
      console.log('🎯🔢 Using selectedDeploymentIds:', selectedDeploymentIds);
      return selectedDeploymentIds;
    }
    
    // In animal-centric mode, if no cameras selected, default to all cameras with observations
    if (viewMode === 'animal-centric' && deployments.length > 0) {
      const allIds = deployments.map(dep => dep.id);
      console.log('🎯🔢 Animal-centric: defaulting to all cameras:', allIds.length, 'cameras');
      return allIds;
    }
    
    // Otherwise, no filter (show all)
    console.log('🎯🔢 No filter - returning empty array');
    return [];
  }, [selectedDeploymentIds, viewMode, selectedDeployment, deployments]);


  // Compute filtered animal tags for animal-centric mode (species with observations from selected cameras)
  // Uses count lookups for accurate, fast database counts
  const filteredAnimalTags = useMemo(() => {
    if (viewMode !== 'animal-centric') {
      return [];
    }

    // Use count lookups if available (preferred - has ALL species from database via GROUP BY query)
    if (countLookups && !countsLoading) {
      const speciesCountsMap = new Map<string, number>();
      
      // Get all unique labels from count lookups
      const allLabels = new Set<string>(countLookups.countsByLabel.keys());
      
      // Calculate aggregated counts for selected deployments
      if (effectiveDeploymentIds.length > 0) {
        effectiveDeploymentIds.forEach(deploymentId => {
          const labelsForDeployment = countLookups.labelsByDeployment.get(deploymentId);
          if (labelsForDeployment) {
            labelsForDeployment.forEach(label => {
              const key = `${deploymentId}:${label}`;
              const count = countLookups.countsByDeploymentAndLabel.get(key) || 0;
              if (count > 0) {
                const currentTotal = speciesCountsMap.get(label) || 0;
                speciesCountsMap.set(label, currentTotal + count);
              }
            });
          }
        });
      } else {
        // No deployments selected - use total counts per label
        countLookups.countsByLabel.forEach((count, label) => {
          speciesCountsMap.set(label, count);
        });
      }
      
      // Build species list from count lookups
      return Array.from(allLabels)
        .filter(label => {
          // Filter out person/people labels
          const labelLower = label.toLowerCase();
          if (labelLower === 'person' || labelLower === 'people') {
            return false;
          }
          
          // Only show species with count > 0 for selected deployments
          const count = speciesCountsMap.get(label) || 0;
          return count > 0;
        })
        .map(label => ({
          label,
          totalObservations: countLookups.countsByLabel.get(label) || 0,
          aggregatedCount: speciesCountsMap.get(label) || 0,
          uniqueCameras: countLookups.deploymentsByLabel.get(label)?.size || 0,
          firstObservation: '',
          lastObservation: '',
          recentObservations: []
        }))
        .sort((a, b) => a.label.localeCompare(b.label));
    }

    // Fallback: deduplicate in-memory observations (may be incomplete if not all loaded)
    if (observations.length === 0) {
      return [];
    }

    // Calculate aggregated deduplicated counts for each species across selected cameras
    const speciesImageIds = new Map<string, Set<string>>();
    
    // Aggregate unique image IDs from selected cameras
    const deploymentsToUse = effectiveDeploymentIds.length > 0 ? effectiveDeploymentIds : deployments.map(d => d.id);
    
    observations
      .filter(obs => deploymentsToUse.includes(obs.deployment_id))
      .forEach(obs => {
        const labelLower = obs.label?.toLowerCase() || '';
        // Skip person/people
        if (labelLower === 'person' || labelLower === 'people' || !obs.animl_image_id) {
          return;
        }
        
        if (!speciesImageIds.has(obs.label)) {
          speciesImageIds.set(obs.label, new Set<string>());
        }
        speciesImageIds.get(obs.label)!.add(obs.animl_image_id);
      });
    
    // Convert to animal tags format with deduplicated counts
    return Array.from(speciesImageIds.entries())
      .filter(([_, imageIds]) => imageIds.size > 0)
      .map(([label, imageIds]) => ({
        label,
        totalObservations: imageIds.size,
        aggregatedCount: imageIds.size,
        uniqueCameras: 0,
        firstObservation: '',
        lastObservation: '',
        recentObservations: []
      }))
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [viewMode, observations, effectiveDeploymentIds, deployments, countLookups, countsLoading]);

  // Track if we've auto-selected labels in animal-centric mode
  const hasAutoSelectedLabels = useRef(false);
  const lastFilteredAnimalTagsRef = useRef<string>('');
  
  // Get animal species for selected camera(s) (camera-centric mode)
  // Counts reflect unique images per species using count lookups for accuracy
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
    
    // Use count lookups if available (preferred - accurate database counts from GROUP BY query)
    if (countLookups && !countsLoading) {
      const speciesCounts = new Map<string, number>();
      
      // Get all labels that have observations for the selected deployment(s)
      deploymentIdsToUse.forEach(deploymentId => {
        const labelsForDeployment = countLookups.labelsByDeployment.get(deploymentId);
        if (labelsForDeployment) {
          labelsForDeployment.forEach(label => {
            const key = `${deploymentId}:${label}`;
            const count = countLookups.countsByDeploymentAndLabel.get(key) || 0;
            if (count > 0) {
              const currentTotal = speciesCounts.get(label) || 0;
              speciesCounts.set(label, currentTotal + count);
            }
          });
        }
      });
      
      // Build species list from count lookups
      return Array.from(speciesCounts.entries())
        .filter(([label]) => {
          // Filter out person/people
          const labelLower = label.toLowerCase();
          return labelLower !== 'person' && labelLower !== 'people';
        })
        .map(([label, count]) => ({
          label,
          count
        }))
        .sort((a, b) => a.label.localeCompare(b.label));
    }
    
    // Fallback: deduplicate observations by (label, image_id) in memory
    const speciesImageIds = new Map<string, Set<string>>();
    
    observations
      .filter(obs => deploymentIdsToUse.includes(obs.deployment_id))
      .forEach(obs => {
        const label = obs.label?.toLowerCase();
        // Filter out person/people
        if (label && label !== 'person' && label !== 'people' && obs.animl_image_id) {
          if (!speciesImageIds.has(obs.label)) {
            speciesImageIds.set(obs.label, new Set());
          }
          speciesImageIds.get(obs.label)!.add(obs.animl_image_id);
        }
      });
    
    // Convert to array with counts (size of image ID sets)
    return Array.from(speciesImageIds.entries())
      .map(([label, imageIds]) => ({
        label,
        count: imageIds.size // Count of unique images for this species
      }))
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [viewMode, selectedDeployment, observations, effectiveDeploymentIds, countLookups, countsLoading]);

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

  // Auto-select all animal species in camera-centric mode for export tab
  useEffect(() => {
    if (viewMode === 'camera-centric' && onLabelsChange && cameraAnimalSpecies.length > 0) {
      const allCameraLabels = cameraAnimalSpecies.map(species => species.label);
      const cameraLabelsKey = allCameraLabels.sort().join(',');
      
      // Only auto-select if no labels are currently selected
      // This ensures checkboxes match the underlying data (empty labels = all selected)
      const noLabelsSelected = selectedLabels.length === 0;
      const speciesChanged = lastFilteredAnimalTagsRef.current !== cameraLabelsKey;
      
      if (noLabelsSelected) {
        onLabelsChange(allCameraLabels);
        lastFilteredAnimalTagsRef.current = cameraLabelsKey;
      } else if (speciesChanged && !noLabelsSelected) {
        // Species changed but user has selections - update the key but don't override
        lastFilteredAnimalTagsRef.current = cameraLabelsKey;
      }
    }
  }, [viewMode, cameraAnimalSpecies, selectedLabels, onLabelsChange]);

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

  // Calculate total count of animal observations (excluding person/people) from database
  // In camera-centric mode: count for selected camera only
  // In animal-centric mode: count for all cameras
  // Uses count lookups for accuracy (includes ALL observations, not just loaded ones)
  const totalAnimalObservationCount = useMemo(() => {
    console.log(`🔍 totalAnimalObservationCount: countLookups=${!!countLookups}, countsLoading=${countsLoading}, viewMode=${viewMode}, selectedDeployment=${selectedDeployment?.id || 'none'}`);
    
    if (countLookups && !countsLoading) {
      console.log(`✅ Count lookups available! countsByDeployment has ${countLookups.countsByDeployment.size} deployments`);
      try {
        // In camera-centric mode, show count for selected camera only
        if (viewMode === 'camera-centric' && selectedDeployment) {
          // Get the unique image count for this specific deployment from pre-calculated lookups
          const total = countLookups.countsByDeployment.get(selectedDeployment.id) || 0;
          console.log(`📊 [COUNT LOOKUPS] Total count for camera ${selectedDeployment.id}: ${total} unique images`);
          return total;
        }
        
        // In animal-centric mode, sum counts across all deployments
        const total = Array.from(countLookups.countsByDeployment.values()).reduce((sum, count) => sum + count, 0);
        console.log(`📊 [COUNT LOOKUPS] Total count across all cameras: ${total} unique images`);
        return total;
      } catch (error) {
        console.error('❌ Error calculating total count from lookups:', error);
        // Fallback: deduplicate in-memory observations
        const uniqueImageIds = new Set<string>();
        animalOnlyObservations.forEach(obs => {
          if (obs.animl_image_id) uniqueImageIds.add(obs.animl_image_id);
        });
        console.log(`⚠️ FALLBACK: Using in-memory count (${uniqueImageIds.size}) due to error`);
        return uniqueImageIds.size;
      }
    }
    
    // Fallback: deduplicate in-memory observations (may be incomplete if not all loaded)
    const uniqueImageIds = new Set<string>();
    animalOnlyObservations.forEach(obs => {
      if (obs.animl_image_id) uniqueImageIds.add(obs.animl_image_id);
    });
    console.warn(`⚠️ Using in-memory count (${uniqueImageIds.size} from ${animalOnlyObservations.length} loaded) - count lookups not available (countLookups=${!!countLookups}, countsLoading=${countsLoading})`);
    return uniqueImageIds.size;
  }, [countLookups, countsLoading, animalOnlyObservations, viewMode, selectedDeployment]);

  // Calculate accurate filtered count using count lookups
  // Returns either a number (exact) or { floor, ceiling } (range)
  // Falls back to in-memory deduplication if lookups not available
  const filteredObservationCount = useMemo((): number | { floor: number; ceiling: number } => {
    console.log('🎯🔢 filteredObservationCount calculation:', {
      viewMode,
      hasCountLookups: !!countLookups,
      countsLoading,
      effectiveDeploymentIds,
      selectedLabels,
      selectedDeploymentId: selectedDeployment?.id
    });
    
    // If count lookups are available, use them for accurate database counts (fast!)
    if (countLookups && !countsLoading) {
      try {
        // Calculate count based on filters using the efficient lookup structures
        console.log('🎯🔢 Calling getTotalCountForFilters with:', {
          effectiveDeploymentIds,
          selectedLabels
        });
        const result = animlService.getTotalCountForFilters(
          countLookups,
          effectiveDeploymentIds,
          selectedLabels
        );
        
        if (typeof result === 'number') {
          console.log(`🎯🔢 Filtered count result: ${result} observations (exact)`);
          console.log(`🎯🔢 Total count (should be >= filtered): ${totalAnimalObservationCount} observations`);
          console.log(`🎯🔢 BUG CHECK: Filtered (${result}) > Total (${totalAnimalObservationCount})? ${result > totalAnimalObservationCount ? '❌ YES - BUG!' : '✅ No'}`);
        } else {
          console.log(`🎯🔢 Filtered count result: ${result.floor}-${result.ceiling} observations (range)`);
          console.log(`🎯🔢 Total count: ${totalAnimalObservationCount} observations`);
        }
        
        return result;
      } catch (error) {
        console.error('🎯🔢 Error calculating count from lookups:', error);
        // Fall through to in-memory fallback
      }
    }
    
    // Fallback: deduplicate filtered observations in memory (may be incomplete if not all loaded)
    const uniqueImageIds = new Set<string>();
    filteredObservations.forEach(obs => {
      if (obs.animl_image_id) uniqueImageIds.add(obs.animl_image_id);
    });
    console.warn(`⚠️ Using in-memory filtered count (${uniqueImageIds.size}) - count lookups not available`);
    return uniqueImageIds.size;
  }, [countLookups, countsLoading, effectiveDeploymentIds, selectedLabels, filteredObservations, totalAnimalObservationCount]);

  // Helper function to format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  // Helper function to format count (handles both exact numbers and ranges)
  const formatCount = (count: number | { floor: number; ceiling: number }): string => {
    if (typeof count === 'number') {
      return count.toLocaleString();
    } else {
      return `${count.floor.toLocaleString()}-${count.ceiling.toLocaleString()}`;
    }
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

    // Show loading state while counts are being fetched (animal-centric mode)
    if (viewMode === 'animal-centric' && countsLoading && !countLookups) {
      return (
        <div id="animl-export-loading-state" className="flex flex-col items-center justify-center h-full p-8 text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Loading Data</h3>
          <p className="text-sm text-gray-600">
            Fetching observation counts from database...
          </p>
        </div>
      );
    }

    // Check if filters are applied (deployment or label selection)
    const totalAvailableSpecies = viewMode === 'camera-centric' ? cameraAnimalSpecies.length : filteredAnimalTags.length;
    const hasDeploymentFilters = effectiveDeploymentIds.length > 0 && effectiveDeploymentIds.length < deploymentsWithObservations.length;
    const hasLabelFilters = selectedLabels.length > 0 && selectedLabels.length < totalAvailableSpecies;
    const hasActiveFilters = hasDeploymentFilters || hasLabelFilters;
    
    // Check if filtered count actually differs from total (to avoid showing redundant "X filtered / X total")
    const filteredDiffersFromTotal = typeof filteredObservationCount === 'object' 
      ? filteredObservationCount.floor !== totalAnimalObservationCount || filteredObservationCount.ceiling !== totalAnimalObservationCount
      : filteredObservationCount !== totalAnimalObservationCount;
    const showFilteredCount = hasActiveFilters && filteredDiffersFromTotal;

    return (
      <div id="animl-export-content" className="flex flex-col h-full">
        <div id="animl-export-header" className="p-4 border-b border-gray-200 bg-white">
          <h3 className="text-sm font-medium text-gray-900 mb-2">Animl Camera Traps</h3>
          <p className="text-sm">
            {countsLoading ? (
              <span className="text-gray-500 italic">Loading counts...</span>
            ) : showFilteredCount ? (
              <>
                <span className="font-semibold text-blue-600">{formatCount(filteredObservationCount)} filtered</span>
                <span className="text-gray-400 mx-1">/</span>
                <span className="text-gray-600">{totalAnimalObservationCount.toLocaleString()} total observations</span>
                <span className="text-gray-600"> {dateRangeText}</span>
              </>
            ) : (
              <>
                <span className="text-gray-600">{totalAnimalObservationCount.toLocaleString()} total observations</span>
                {viewMode === 'camera-centric' && selectedDeployment && (
                  <span className="text-gray-600"> for this camera</span>
                )}
                <span className="text-gray-600"> {dateRangeText}</span>
              </>
            )}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            View Mode: <span className="font-medium">{viewMode === 'camera-centric' ? 'Camera-Centric' : 'Animal-Centric'}</span>
            {viewMode === 'camera-centric' && selectedDeployment && (
              <span> • Camera: <span className="font-medium">{selectedDeployment.name || selectedDeployment.animl_dp_id}</span></span>
            )}
          </p>
        </div>

        {/* Loading spinner overlay when counts are loading */}
        {countsLoading && (
          <div className="flex-1 flex items-center justify-center p-8">
            <div className="text-center">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
              <p className="text-sm text-gray-600">Loading observation counts...</p>
            </div>
          </div>
        )}

        {/* Only show filters and actions when counts are loaded */}
        {!countsLoading && (
        <>
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
              {onLabelsChange && (() => {
                // Show loading state while counts are loading
                if (countsLoading || !countLookups) {
                  return (
                    <div id="animl-camera-species-loading" className="p-4 text-center text-gray-500">
                      <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-2"></div>
                      <p className="text-sm font-medium">Loading animal species...</p>
                    </div>
                  );
                }
                
                // Only show species filter if there are species for this camera
                if (cameraAnimalSpecies.length === 0) {
                  return null;
                }
                
                return (
            <div id="animl-camera-species-filter-section" className="space-y-3">
              <div className="flex items-center justify-between">
              <h4 className="text-sm font-medium text-gray-900 flex items-center">
                <Filter className="w-4 h-4 mr-2" />
                  Animal Species
              </h4>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      const allLabels = cameraAnimalSpecies.map(s => s.label);
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
                      <span className="text-sm text-gray-700">
                        {species.label} <span className="text-gray-500">({species.count.toLocaleString()})</span>
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>
                );
              })()}
            </>
          )}

          {/* Animal-Centric Mode: Show deployment filter and species filter */}
          {viewMode === 'animal-centric' && (
            <>
              {/* Deployment Filter - Show only deployments with observations */}
              {onDeploymentIdsChange && deployments.length > 0 && (() => {
                // Show loading state while count data is being fetched
                if (countsLoading || !countLookups) {
                  return (
                    <div id="animl-deployments-loading" className="p-4 text-center text-gray-500">
                      <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-2"></div>
                      <p className="text-sm font-medium">Loading camera traps...</p>
                    </div>
                  );
                }
                
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
                        // Get count from count lookups (accurate database count)
                        const deploymentObservationCount = countLookups?.countsByDeployment.get(deployment.id) || 0;
                        
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
                              <span className="text-gray-500 ml-1">({deploymentObservationCount.toLocaleString()})</span>
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
              {onLabelsChange && viewMode === 'animal-centric' && (() => {
                // Check if we have count data (don't need observations for export tab)
                const hasCountData = countLookups && !countsLoading;
                
                // Show loading state while count data is being fetched
                if (countsLoading || !countLookups) {
                  return (
                    <div id="animl-species-loading" className="p-4 text-center text-gray-500">
                      <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-2"></div>
                      <p className="text-sm font-medium">Loading species...</p>
                    </div>
                  );
                }
                
                // If no count data available (shouldn't happen), show message
                if (!hasCountData) {
                  return (
                    <div id="animl-no-observations-message" className="p-4 text-center text-gray-500">
                      <p className="text-sm font-medium mb-1">No data available</p>
                      <p className="text-xs text-gray-400">
                        No observation data found for the selected date range. Try adjusting your search criteria.
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
                  {countsLoading ? (
                    <span className="text-gray-500 italic">Calculating count...</span>
                  ) : showFilteredCount ? (
                    <>
                      <span className="text-lg font-bold">{formatCount(filteredObservationCount)}</span> observations will be saved after applying filters
                    </>
                  ) : (
                    <>
                      <span className="text-lg font-bold">{totalAnimalObservationCount.toLocaleString()}</span> observations will be saved
                    </>
                  )}
                </p>
                {showFilteredCount && !countsLoading && (
                  <p className="text-xs text-blue-700 mt-1">
                    Filtered from {totalAnimalObservationCount.toLocaleString()} total observations
                  </p>
                )}
              </div>
              
              <button
                id="animl-add-to-cart-button"
                onClick={() => {
                  // Pass ceiling if range, exact number otherwise
                  const count = typeof filteredObservationCount === 'number' 
                    ? filteredObservationCount 
                    : filteredObservationCount.ceiling;
                  onAddToCart(count);
                }}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={observations.length === 0 || countsLoading}
              >
                <ShoppingCart className="w-4 h-4" />
                Add to Cart
              </button>
            </div>
          )}
        </div>
        </>
        )}
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
