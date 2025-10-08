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
  loadingLayerIds?: string[];
  selectedDetailsItemId?: string;
  onLayerToggle?: (itemId: string) => void;
  // Modal management
  selectedModalItem?: TNCArcGISItem | null;
  onModalOpen?: (item: TNCArcGISItem) => void;
  onModalClose?: () => void;
  hasSearched?: boolean;
}

const TNCArcGISView: React.FC<TNCArcGISViewProps> = ({
  items,
  loading,
  onItemSelect,
  activeLayerIds = [],
  loadingLayerIds = [],
  selectedDetailsItemId,
  onLayerToggle,
  selectedModalItem,
  onModalOpen,
  onModalClose,
  hasSearched = false
}) => {
  return (
    <TNCArcGISSidebar
      items={items}
      isLoading={loading}
      onItemSelect={onItemSelect}
      activeLayerIds={activeLayerIds}
      loadingLayerIds={loadingLayerIds}
      selectedDetailsItemId={selectedDetailsItemId}
      onLayerToggle={onLayerToggle}
      selectedModalItem={selectedModalItem}
      onModalOpen={onModalOpen}
      onModalClose={onModalClose}
      hasSearched={hasSearched}
    />
  );
};

export default TNCArcGISView;