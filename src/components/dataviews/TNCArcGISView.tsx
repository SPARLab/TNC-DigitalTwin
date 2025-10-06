import React from 'react';
import TNCArcGISSidebar from '../TNCArcGISSidebar';
import { TNCArcGISItem } from '../../services/tncArcGISService';

interface TNCArcGISViewProps {
  items: TNCArcGISItem[];
  loading: boolean;
  onExportCSV?: () => void;
  onExportGeoJSON?: () => void;
  onItemSelect?: (item: TNCArcGISItem) => void;
  // Map layer management
  activeLayerIds?: string[];
  onLayerToggle?: (itemId: string) => void;
  onLayerOpacityChange?: (itemId: string, opacity: number) => void;
  // Modal management
  selectedModalItem?: TNCArcGISItem | null;
  onModalOpen?: (item: TNCArcGISItem) => void;
  onModalClose?: () => void;
}

const TNCArcGISView: React.FC<TNCArcGISViewProps> = ({
  items,
  loading,
  onExportCSV,
  onExportGeoJSON,
  onItemSelect,
  activeLayerIds = [],
  onLayerToggle,
  onLayerOpacityChange,
  selectedModalItem,
  onModalOpen,
  onModalClose
}) => {
  return (
    <TNCArcGISSidebar
      items={items}
      isLoading={loading}
      onExportCSV={onExportCSV}
      onExportGeoJSON={onExportGeoJSON}
      onItemSelect={onItemSelect}
      activeLayerIds={activeLayerIds}
      onLayerToggle={onLayerToggle}
      onLayerOpacityChange={onLayerOpacityChange}
      selectedModalItem={selectedModalItem}
      onModalOpen={onModalOpen}
      onModalClose={onModalClose}
    />
  );
};

export default TNCArcGISView;