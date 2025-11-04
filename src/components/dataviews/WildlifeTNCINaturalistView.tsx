import React, { useMemo } from 'react';
import { TNCArcGISObservation } from '../../services/tncINaturalistService';
import { tncINaturalistService } from '../../services/tncINaturalistService';
import INaturalistSidebar, { INaturalistUnifiedObservation } from '../INaturalistSidebar';

interface WildlifeTNCINaturalistViewProps {
  observations: TNCArcGISObservation[];
  loading: boolean;
  currentDaysBack?: number;
  startDate?: string;
  endDate?: string;
  onExportCSV?: () => void;
  onExportGeoJSON?: () => void;
  selectedObservation?: TNCArcGISObservation | null;
  onObservationSelect?: (observation: TNCArcGISObservation | null) => void;
  hasSearched?: boolean;
  onObservationClick?: (obs: INaturalistUnifiedObservation) => void;
  selectedObservationId?: number | string | null;
  iconicTaxa?: string[]; // Filter by taxonomic groups
  onIconicTaxaChange?: (taxa: string[]) => void; // Callback to change filter
}

const WildlifeTNCINaturalistView: React.FC<WildlifeTNCINaturalistViewProps> = ({
  observations,
  loading,
  currentDaysBack,
  startDate,
  endDate,
  onExportCSV: _onExportCSV,
  onExportGeoJSON: _onExportGeoJSON,
  selectedObservation,
  onObservationSelect,
  hasSearched = false,
  onObservationClick,
  selectedObservationId,
  iconicTaxa = [],
  onIconicTaxaChange
}) => {
  // Helper function to format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  // Generate appropriate date range text
  const dateRangeText = useMemo(() => {
    if (startDate && endDate) {
      return `(${formatDate(startDate)} - ${formatDate(endDate)})`;
    }
    if (currentDaysBack) {
      return `(last ${currentDaysBack} days)`;
    }
    return '';
  }, [startDate, endDate, currentDaysBack]);

  // Helper to normalize category name
  const normalizeTaxonCategory = (category: string | null): string => {
    if (!category || category === 'Other') {
      return 'Unknown';
    }
    return category;
  };

  // Transform observations to unified format
  const unifiedObservations = useMemo((): INaturalistUnifiedObservation[] => {
    return observations.map(obs => ({
      id: obs.observation_id,
      observedOn: obs.observed_on,
      observerName: obs.user_name || 'Unknown',
      commonName: obs.common_name || null,
      scientificName: obs.scientific_name || 'Unknown',
      photoUrl: tncINaturalistService.getPrimaryImageUrl(obs) || null,
      photoAttribution: tncINaturalistService.getPhotoAttribution(obs) || null,
      iconicTaxon: normalizeTaxonCategory(obs.taxon_category_name),
      qualityGrade: null, // TNC data doesn't have quality grade
      location: null, // TNC data doesn't have place_guess
      uri: `https://www.inaturalist.org/observations/${obs.observation_uuid}`,
      taxonId: obs.taxon_id
    }));
  }, [observations]);

  // Handle observation selection
  const handleObservationClick = (obs: INaturalistUnifiedObservation) => {
    // Find the original TNC observation
    const tncObs = observations.find(o => o.observation_id === obs.id);
    if (tncObs && onObservationSelect) {
      onObservationSelect(tncObs);
    }
    // Also call the unified observation click handler if provided
    if (onObservationClick) {
      onObservationClick(obs);
    }
  };

  return (
    <INaturalistSidebar
      title="iNaturalist (TNC Layers)"
      observations={unifiedObservations}
      loading={loading}
      dateRangeText={dateRangeText}
      onObservationClick={handleObservationClick}
      selectedObservationId={selectedObservationId || selectedObservation?.observation_id}
      hasSearched={hasSearched}
      iconicTaxa={iconicTaxa}
      onIconicTaxaChange={onIconicTaxaChange}
    />
  );
};

export default WildlifeTNCINaturalistView;
