import React from 'react';
import { FilterState } from '../types';
import { iNaturalistObservation } from '../services/iNaturalistService';
import { TNCArcGISObservation } from '../services/tncINaturalistService';
import { EBirdObservation } from '../services/eBirdService';
import { CalFloraPlant } from '../services/calFloraService';

// Import specific data view components
import WildlifeINaturalistView from './dataviews/WildlifeINaturalistView';
import WildlifeTNCINaturalistView from './dataviews/WildlifeTNCINaturalistView';
import WildlifeEBirdView from './dataviews/WildlifeEBirdView';
import VegetationCalFloraView from './dataviews/VegetationCalFloraView';

interface DataViewProps {
  filters: FilterState;
  // iNaturalist Public API data
  observations: iNaturalistObservation[];
  observationsLoading: boolean;
  onObservationExportCSV?: () => void;
  onObservationExportGeoJSON?: () => void;
  // TNC iNaturalist data
  tncObservations: TNCArcGISObservation[];
  tncObservationsLoading: boolean;
  onTNCObservationExportCSV?: () => void;
  onTNCObservationExportGeoJSON?: () => void;
  selectedTNCObservation?: TNCArcGISObservation | null;
  onTNCObservationSelect?: (observation: TNCArcGISObservation | null) => void;
  // eBird data
  eBirdObservations?: EBirdObservation[];
  eBirdObservationsLoading?: boolean;
  onEBirdExportCSV?: () => void;
  onEBirdExportGeoJSON?: () => void;
  // CalFlora data
  calFloraPlants: CalFloraPlant[];
  calFloraLoading: boolean;
  onCalFloraExportCSV?: () => void;
  onCalFloraExportGeoJSON?: () => void;
  onCalFloraPlantSelect?: (plant: CalFloraPlant) => void;
  // Common props
  lastSearchedDaysBack?: number;
  startDate?: string;
  endDate?: string;
}

const DataView: React.FC<DataViewProps> = ({
  filters,
  observations,
  observationsLoading,
  onObservationExportCSV,
  onObservationExportGeoJSON,
  tncObservations,
  tncObservationsLoading,
  onTNCObservationExportCSV,
  onTNCObservationExportGeoJSON,
  selectedTNCObservation,
  onTNCObservationSelect,
  eBirdObservations = [],
  eBirdObservationsLoading = false,
  onEBirdExportCSV,
  onEBirdExportGeoJSON,
  calFloraPlants,
  calFloraLoading,
  onCalFloraExportCSV,
  onCalFloraExportGeoJSON,
  onCalFloraPlantSelect,
  lastSearchedDaysBack,
  startDate,
  endDate
}) => {
  // Route to appropriate data view based on category + source combination
  const getDataView = () => {
    const key = `${filters.category}-${filters.source}`;
    
    switch (key) {
      case 'Wildlife-iNaturalist (Public API)':
      case 'Vegetation-iNaturalist (Public API)':
        return (
          <WildlifeINaturalistView
            observations={observations}
            loading={observationsLoading}
            currentDaysBack={lastSearchedDaysBack}
            startDate={startDate}
            endDate={endDate}
            onExportCSV={onObservationExportCSV}
            onExportGeoJSON={onObservationExportGeoJSON}
          />
        );

      case 'Wildlife-iNaturalist (TNC Layers)':
      case 'Vegetation-iNaturalist (TNC Layers)':
        return (
          <WildlifeTNCINaturalistView
            observations={tncObservations}
            loading={tncObservationsLoading}
            currentDaysBack={lastSearchedDaysBack}
            startDate={startDate}
            endDate={endDate}
            onExportCSV={onTNCObservationExportCSV}
            onExportGeoJSON={onTNCObservationExportGeoJSON}
            selectedObservation={selectedTNCObservation}
            onObservationSelect={onTNCObservationSelect}
          />
        );
        
      case 'Wildlife-eBird':
        return (
          <WildlifeEBirdView
            observations={eBirdObservations}
            loading={eBirdObservationsLoading}
            currentDaysBack={lastSearchedDaysBack}
            startDate={startDate}
            endDate={endDate}
            onExportCSV={onEBirdExportCSV}
            onExportGeoJSON={onEBirdExportGeoJSON}
          />
        );
        
      case 'Vegetation-CalFlora':
        return (
          <VegetationCalFloraView
            plants={calFloraPlants}
            loading={calFloraLoading}
            onExportCSV={onCalFloraExportCSV}
            onExportGeoJSON={onCalFloraExportGeoJSON}
            onPlantSelect={onCalFloraPlantSelect}
          />
        );
        
      default:
        return (
          <div id="unsupported-data-view" className="w-80 bg-white border-r border-gray-200 flex flex-col">
            <div id="unsupported-header" className="p-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Data View</h2>
              <p className="text-sm text-gray-600">
                {filters.category} + {filters.source}
              </p>
            </div>
            <div id="unsupported-content" className="flex-1 flex items-center justify-center p-4">
              <div className="text-center text-gray-500">
                <p className="font-medium">Data view not available</p>
                <p className="text-sm mt-1">
                  The combination of {filters.category} + {filters.source} is not yet supported.
                </p>
              </div>
            </div>
          </div>
        );
    }
  };

  return getDataView();
};

export default DataView;
