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
}

const WildlifeINaturalistView: React.FC<WildlifeINaturalistViewProps> = ({
  observations,
  loading,
  currentDaysBack,
  startDate,
  endDate,
  onExportCSV,
  onExportGeoJSON
}) => {
  return (
    <ObservationsSidebar
      observations={observations}
      loading={loading}
      currentDaysBack={currentDaysBack}
      startDate={startDate}
      endDate={endDate}
      onExportCSV={onExportCSV}
      onExportGeoJSON={onExportGeoJSON}
    />
  );
};

export default WildlifeINaturalistView;
