import React from 'react';
import ObservationsSidebar from '../ObservationsSidebar';
import { iNaturalistObservation } from '../../services/iNaturalistService';
import { INaturalistUnifiedObservation } from '../INaturalistSidebar';

interface WildlifeINaturalistViewProps {
  observations: iNaturalistObservation[];
  loading: boolean;
  currentDaysBack?: number;
  startDate?: string;
  endDate?: string;
  onExportCSV?: () => void;
  onExportGeoJSON?: () => void;
  hasSearched?: boolean;
  onObservationClick?: (obs: INaturalistUnifiedObservation) => void;
  selectedObservationId?: number | string | null;
}

const WildlifeINaturalistView: React.FC<WildlifeINaturalistViewProps> = ({
  observations,
  loading,
  currentDaysBack,
  startDate,
  endDate,
  onExportCSV,
  onExportGeoJSON,
  hasSearched = false,
  onObservationClick,
  selectedObservationId
}) => {
  return (
    <ObservationsSidebar
      observations={observations}
      loading={loading}
      currentDaysBack={currentDaysBack}
      startDate={startDate}
      endDate={endDate}
      hasSearched={hasSearched}
      onExportCSV={onExportCSV}
      onExportGeoJSON={onExportGeoJSON}
      onObservationClick={onObservationClick}
      selectedObservationId={selectedObservationId}
    />
  );
};

export default WildlifeINaturalistView;
