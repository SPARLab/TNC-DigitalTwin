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
}

const VegetationCalFloraView: React.FC<VegetationCalFloraViewProps> = ({
  plants,
  loading,
  onExportCSV,
  onExportGeoJSON,
  onPlantSelect,
  hasSearched = false
}) => {
  return (
    <CalFloraSidebar
      plants={plants}
      isLoading={loading}
      onExportCSV={onExportCSV}
      onExportGeoJSON={onExportGeoJSON}
      onPlantSelect={onPlantSelect}
      hasSearched={hasSearched}
    />
  );
};

export default VegetationCalFloraView;
