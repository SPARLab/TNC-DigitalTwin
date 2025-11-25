import React from 'react';
import CalFloraSidebar from '../CalFloraSidebar';
import { CalFloraPlant } from '../../services/calFloraService';

interface VegetationCalFloraViewProps {
  plants: CalFloraPlant[];
  loading: boolean;
  onExportCSV?: () => void;
  onExportGeoJSON?: () => void;
  onPlantSelect?: (plant: CalFloraPlant) => void;
  hasSearched?: boolean;
  onBack?: () => void;
}

const VegetationCalFloraView: React.FC<VegetationCalFloraViewProps> = ({
  plants,
  loading,
  onExportCSV,
  onExportGeoJSON,
  onPlantSelect,
  hasSearched = false,
  onBack
}) => {
  return (
    <CalFloraSidebar
      plants={plants}
      isLoading={loading}
      onExportCSV={onExportCSV}
      onExportGeoJSON={onExportGeoJSON}
      onPlantSelect={onPlantSelect}
      hasSearched={hasSearched}
      onBack={onBack}
    />
  );
};

export default VegetationCalFloraView;
