import React, { useMemo } from 'react';
import { iNaturalistObservation } from '../services/iNaturalistService';
import { formatDateRangeCompact } from '../utils/dateUtils';
import INaturalistSidebar, { INaturalistUnifiedObservation } from './INaturalistSidebar';

interface ObservationsSidebarProps {
  observations: iNaturalistObservation[];
  loading: boolean;
  currentDaysBack?: number;
  startDate?: string;
  endDate?: string;
  onExportCSV?: () => void;
  onExportGeoJSON?: () => void;
  onAddToCart?: () => void;
  hasSearched?: boolean;
  onObservationClick?: (obs: INaturalistUnifiedObservation) => void;
  selectedObservationId?: number | string | null;
  iconicTaxa?: string[]; // Filter by taxonomic groups
}

const ObservationsSidebar: React.FC<ObservationsSidebarProps> = ({ 
  observations, 
  loading, 
  currentDaysBack = 30, 
  startDate, 
  endDate,
  onExportCSV,
  onExportGeoJSON,
  onAddToCart,
  hasSearched = false,
  onObservationClick,
  selectedObservationId,
  iconicTaxa = []
}) => {
  // Generate appropriate date range text
  const dateRangeText = useMemo(() => {
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      return `from ${start.toLocaleDateString()} - ${end.toLocaleDateString()}`;
    }
    return `from ${formatDateRangeCompact(currentDaysBack).toLowerCase()}`;
  }, [startDate, endDate, currentDaysBack]);

  // Transform observations to unified format
  const unifiedObservations = useMemo((): INaturalistUnifiedObservation[] => {
    return observations.map(obs => ({
      id: obs.id,
      observedOn: obs.observed_on,
      observerName: obs.user?.login || 'Unknown',
      commonName: obs.taxon?.preferred_common_name || null,
      scientificName: obs.taxon?.name || 'Unknown',
      photoUrl: obs.photos && obs.photos.length > 0 
        ? obs.photos[0].url.replace('square', 'medium') 
        : null,
      photoAttribution: obs.photos && obs.photos.length > 0 
        ? obs.photos[0].attribution 
        : null,
      iconicTaxon: obs.taxon?.iconic_taxon_name || 'Unknown',
      qualityGrade: obs.quality_grade || null,
      location: obs.place_guess || null,
      uri: obs.uri,
      taxonId: obs.taxon?.id
    }));
  }, [observations]);

  return (
    <INaturalistSidebar
      title="iNaturalist (Public API)"
      observations={unifiedObservations}
      loading={loading}
      dateRangeText={dateRangeText}
      onAddToCart={onAddToCart}
      hasSearched={hasSearched}
      onObservationClick={onObservationClick}
      selectedObservationId={selectedObservationId}
      iconicTaxa={iconicTaxa}
    />
  );
};

export default ObservationsSidebar;
