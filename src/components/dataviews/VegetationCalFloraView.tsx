import React from 'react';
import CalFloraSidebar from '../CalFloraSidebar';
import { CalFloraPlant } from '../../services/calFloraService';

interface VegetationCalFloraViewProps {
  plants: CalFloraPlant[];
  loading: boolean;
  onExportCSV?: () => void;
  onExportGeoJSON?: () => void;
  onPlantSelect?: (plant: CalFloraPlant) => void;
}

const VegetationCalFloraView: React.FC<VegetationCalFloraViewProps> = ({
  plants,
  loading,
  onExportCSV,
  onExportGeoJSON,
  onPlantSelect
}) => {
  return (
    <CalFloraSidebar
      plants={plants}
      isLoading={loading}
      onExportCSV={onExportCSV}
      onExportGeoJSON={onExportGeoJSON}
      onPlantSelect={onPlantSelect}
    />
  );
};

export default VegetationCalFloraView;
