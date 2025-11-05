import React from 'react';
import AnimlSidebar from '../AnimlSidebar';
import { AnimlDeployment, AnimlImageLabel, AnimlAnimalTag } from '../../services/animlService';
import { AnimlViewMode } from '../AnimlSidebar';

interface WildlifeAnimlViewProps {
  // View mode
  viewMode: AnimlViewMode;
  onViewModeChange: (mode: AnimlViewMode) => void;
  
  // Data
  deployments?: AnimlDeployment[];
  animalTags?: AnimlAnimalTag[];
  imageLabels: AnimlImageLabel[];
  loading: boolean;
  loadingObservations?: boolean; // Loading state when category observations are being fetched
  loadingMoreObservations?: boolean; // Loading state for background loading
  totalObservationsCount?: number | null; // Total count for pagination info
  
  // Selected items
  selectedDeploymentId?: number | null;
  selectedAnimalLabel?: string | null;
  selectedObservationId?: number | null;
  
  // Callbacks
  onDeploymentClick?: (deployment: AnimlDeployment) => void;
  onAnimalTagClick?: (tag: AnimlAnimalTag) => void;
  onObservationClick?: (observation: AnimlImageLabel) => void;
  
  // Export & cart (kept for backwards compatibility but not used here)
  onExportCSV?: () => void;
  onExportGeoJSON?: () => void;
  onAddToCart?: (filteredCount: number) => void;
  onDetailsClose?: () => void;
  
  // Filters
  selectedDeploymentIds?: number[];
  onDeploymentIdsChange?: (ids: number[]) => void;
  selectedLabels?: string[];
  onLabelsChange?: (labels: string[]) => void;
  hasImages?: boolean;
  onHasImagesChange?: (hasImages: boolean | undefined) => void;
  
  // Common
  currentDaysBack?: number;
  startDate?: string;
  endDate?: string;
  hasSearched?: boolean;
  dateRangeText: string;
  
  // Selected items for details sidebar (kept for backwards compatibility but not used here)
  selectedDeployment?: AnimlDeployment | null;
  selectedAnimalTag?: AnimlAnimalTag | null;
  selectedObservation?: AnimlImageLabel | null;
}

const WildlifeAnimlView: React.FC<WildlifeAnimlViewProps> = ({
  viewMode,
  onViewModeChange,
  deployments = [],
  animalTags = [],
  imageLabels,
  loading,
  loadingObservations = false,
  loadingMoreObservations = false,
  totalObservationsCount = null,
  selectedDeploymentId,
  selectedAnimalLabel,
  selectedObservationId,
  onDeploymentClick,
  onAnimalTagClick,
  onObservationClick,
  hasSearched = false,
  dateRangeText
}) => {
  // Determine which observations to show based on view mode and selection
  const displayedObservations = React.useMemo(() => {
    if (viewMode === 'camera-centric' && selectedDeploymentId !== null) {
      return imageLabels.filter(obs => obs.deployment_id === selectedDeploymentId);
    } else if (viewMode === 'animal-centric' && selectedAnimalLabel !== null) {
      return imageLabels.filter(obs => obs.label === selectedAnimalLabel);
    }
    return [];
  }, [imageLabels, viewMode, selectedDeploymentId, selectedAnimalLabel]);

  return (
    <AnimlSidebar
      viewMode={viewMode}
      onViewModeChange={onViewModeChange}
      deployments={deployments}
      selectedDeploymentId={selectedDeploymentId}
      onDeploymentClick={onDeploymentClick}
      animalTags={animalTags}
      selectedAnimalLabel={selectedAnimalLabel}
      onAnimalTagClick={onAnimalTagClick}
      loading={loading}
      loadingObservations={loadingObservations}
      loadingMoreObservations={loadingMoreObservations}
      totalObservationsCount={totalObservationsCount}
      dateRangeText={dateRangeText}
      hasSearched={hasSearched}
      observations={displayedObservations}
      selectedObservationId={selectedObservationId}
      onObservationClick={onObservationClick}
    />
  );
};

export default WildlifeAnimlView;
