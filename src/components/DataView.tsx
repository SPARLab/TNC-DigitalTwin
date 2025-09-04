import React from 'react';
import { FilterState } from '../types';
import { iNaturalistObservation } from '../services/iNaturalistService';
import { CalFloraPlant } from '../services/calFloraService';

// Import specific data view components
import WildlifeINaturalistView from './dataviews/WildlifeINaturalistView';
import VegetationCalFloraView from './dataviews/VegetationCalFloraView';

interface DataViewProps {
  filters: FilterState;
  // iNaturalist data
  observations: iNaturalistObservation[];
  observationsLoading: boolean;
  onObservationExportCSV?: () => void;
  onObservationExportGeoJSON?: () => void;
  // CalFlora data
  calFloraPlants: CalFloraPlant[];
  calFloraLoading: boolean;
  onCalFloraExportCSV?: () => void;
  onCalFloraExportGeoJSON?: () => void;
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
  calFloraPlants,
  calFloraLoading,
  onCalFloraExportCSV,
  onCalFloraExportGeoJSON,
  lastSearchedDaysBack,
  startDate,
  endDate
}) => {
  // Route to appropriate data view based on category + source combination
  const getDataView = () => {
    const key = `${filters.category}-${filters.source}`;
    
    switch (key) {
      case 'Wildlife-iNaturalist':
      case 'Vegetation-iNaturalist':
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
        
      case 'Vegetation-CalFlora':
        return (
          <VegetationCalFloraView
            plants={calFloraPlants}
            loading={calFloraLoading}
            onExportCSV={onCalFloraExportCSV}
            onExportGeoJSON={onCalFloraExportGeoJSON}
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
