import React from 'react';
import ObservationsSidebar from '../ObservationsSidebar';
import { iNaturalistObservation } from '../../services/iNaturalistService';

interface WildlifeINaturalistViewProps {
  observations: iNaturalistObservation[];
  loading: boolean;
  currentDaysBack?: number;
  startDate?: string;
  endDate?: string;
  onExportCSV?: () => void;
  onExportGeoJSON?: () => void;
  hasSearched?: boolean;
}

const WildlifeINaturalistView: React.FC<WildlifeINaturalistViewProps> = ({
  observations,
  loading,
  currentDaysBack,
  startDate,
  endDate,
  onExportCSV,
  onExportGeoJSON,
  hasSearched = false
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
    />
  );
};

export default WildlifeINaturalistView;
