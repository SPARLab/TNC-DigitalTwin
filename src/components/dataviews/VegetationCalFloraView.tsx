import React from 'react';
import CalFloraSidebar from '../CalFloraSidebar';
import { CalFloraPlant } from '../../services/calFloraService';

interface VegetationCalFloraViewProps {
  plants: CalFloraPlant[];
  loading: boolean;
  onExportCSV?: () => void;
  onExportGeoJSON?: () => void;
}

const VegetationCalFloraView: React.FC<VegetationCalFloraViewProps> = ({
  plants,
  loading,
  onExportCSV,
  onExportGeoJSON
}) => {
  return (
    <CalFloraSidebar
      plants={plants}
      isLoading={loading}
      onExportCSV={onExportCSV}
      onExportGeoJSON={onExportGeoJSON}
    />
  );
};

export default VegetationCalFloraView;
