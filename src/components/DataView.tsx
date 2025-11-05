import React from 'react';
import { FilterState, DendraStation, DendraDatastream, DendraDatastreamWithStation } from '../types';
import { iNaturalistObservation } from '../services/iNaturalistService';
import { TNCArcGISObservation } from '../services/tncINaturalistService';
import { EBirdObservation } from '../services/eBirdService';
import { CalFloraPlant } from '../services/calFloraService';
import { TNCArcGISItem } from '../services/tncArcGISService';
import { INaturalistUnifiedObservation } from './INaturalistSidebar';

// Import specific data view components
import WildlifeINaturalistView from './dataviews/WildlifeINaturalistView';
import WildlifeTNCINaturalistView from './dataviews/WildlifeTNCINaturalistView';
import WildlifeEBirdView from './dataviews/WildlifeEBirdView';
import VegetationCalFloraView from './dataviews/VegetationCalFloraView';
import TNCArcGISView from './dataviews/TNCArcGISView';
import LiDARView, { LiDARViewMode } from './dataviews/LiDARView';
import DendraSidebar from './DendraSidebar';
import WildlifeAnimlView from './dataviews/WildlifeAnimlView';
import { AnimlDeployment, AnimlImageLabel, AnimlAnimalTag } from '../services/animlService';
import { AnimlViewMode } from './AnimlSidebar';
import { AnimlCustomFilters } from '../types';

interface DataViewProps {
  filters: FilterState;
  // Current iconicTaxa (from filters state, not lastSearchedFilters)
  currentIconicTaxa?: string[];
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
  // TNC ArcGIS Hub data
  tncArcGISItems: TNCArcGISItem[];
  tncArcGISLoading: boolean;
  onTNCArcGISExportCSV?: () => void;
  onTNCArcGISExportGeoJSON?: () => void;
  onTNCArcGISItemSelect?: (item: TNCArcGISItem) => void;
  // Map layer management for TNC ArcGIS
  activeLayerIds?: string[];
  loadingLayerIds?: string[];
  selectedDetailsItemId?: string;
  onLayerToggle?: (itemId: string) => void;
  // Modal management for TNC ArcGIS
  selectedModalItem?: TNCArcGISItem | null;
  onModalOpen?: (item: TNCArcGISItem) => void;
  onModalClose?: () => void;
  // LiDAR mode management
  onLiDARModeChange?: (mode: LiDARViewMode) => void;
  // Common props
  lastSearchedDaysBack?: number;
  startDate?: string;
  endDate?: string;
  hasSearched?: boolean;
  // Dendra Stations data
  dendraStations?: DendraStation[];
  dendraDatastreams?: DendraDatastream[];
  dendraLoading?: boolean;
  selectedDendraStationId?: number | null;
  selectedDendraDatastreamId?: number | null;
  onDendraStationSelect?: (station: DendraStation) => void;
  onDendraDatastreamSelect?: (datastream: DendraDatastreamWithStation) => void;
  onShowDendraWebsite?: () => void;
  // iNaturalist observation selection
  selectedINatObservation?: INaturalistUnifiedObservation | null;
  onINatObservationClick?: (obs: INaturalistUnifiedObservation) => void;
  onINatDetailsClose?: () => void;
  qualityGrade?: 'research' | 'needs_id' | 'casual' | undefined;
  onQualityGradeChange?: (grade: 'research' | 'needs_id' | 'casual' | undefined) => void;
  // Iconic taxa filter callback
  onIconicTaxaChange?: (taxa: string[]) => void;
  // Animl props
  animlViewMode?: AnimlViewMode;
  animlDeployments?: AnimlDeployment[];
  animlAnimalTags?: AnimlAnimalTag[];
  animlImageLabels?: AnimlImageLabel[];
  animlLoading?: boolean;
  animlLoadingObservations?: boolean;
  animlLoadingMoreObservations?: boolean;
  animlTotalObservationsCount?: number | null;
  selectedAnimlDeployment?: AnimlDeployment | null;
  selectedAnimlDeploymentId?: number | null;
  selectedAnimlAnimalTag?: AnimlAnimalTag | null;
  selectedAnimlAnimalLabel?: string | null;
  selectedAnimlObservation?: AnimlImageLabel | null;
  selectedAnimlObservationId?: number | null;
  onAnimlViewModeChange?: (mode: AnimlViewMode) => void;
  onAnimlDeploymentClick?: (deployment: AnimlDeployment) => void;
  onAnimlAnimalTagClick?: (tag: AnimlAnimalTag) => void;
  onAnimlObservationClick?: (observation: AnimlImageLabel) => void;
  onAnimlDetailsClose?: () => void;
  onAnimlExportCSV?: () => void;
  onAnimlExportGeoJSON?: () => void;
  onAnimlAddToCart?: (filteredCount: number) => void;
  animlDateRangeText?: string;
  animlCustomFilters?: AnimlCustomFilters;
  onAnimlCustomFiltersChange?: (filters: AnimlCustomFilters) => void;
}

const DataView: React.FC<DataViewProps> = ({
  filters,
  currentIconicTaxa,
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
  tncArcGISItems,
  tncArcGISLoading,
  onTNCArcGISExportCSV: _onTNCArcGISExportCSV,
  onTNCArcGISExportGeoJSON: _onTNCArcGISExportGeoJSON,
  onTNCArcGISItemSelect,
  activeLayerIds,
  loadingLayerIds = [],
  selectedDetailsItemId,
  onLayerToggle,
  selectedModalItem,
  onModalOpen,
  onModalClose,
  onLiDARModeChange,
  lastSearchedDaysBack,
  startDate,
  endDate,
  hasSearched = false,
  dendraStations = [],
  dendraDatastreams = [],
  dendraLoading: _dendraLoading = false,
  selectedDendraStationId,
  selectedDendraDatastreamId,
  onDendraStationSelect,
  onDendraDatastreamSelect,
  onShowDendraWebsite,
  selectedINatObservation,
  onINatObservationClick,
  onINatDetailsClose: _onINatDetailsClose,
  qualityGrade: _qualityGrade,
  onQualityGradeChange: _onQualityGradeChange,
  onIconicTaxaChange,
  // Animl props
  animlViewMode = 'camera-centric',
  animlDeployments = [],
  animlAnimalTags = [],
  animlImageLabels = [],
  animlLoading = false,
  animlLoadingObservations = false,
  animlLoadingMoreObservations = false,
  animlTotalObservationsCount = null,
  selectedAnimlDeployment = null,
  selectedAnimlDeploymentId = null,
  selectedAnimlAnimalTag = null,
  selectedAnimlAnimalLabel = null,
  selectedAnimlObservation = null,
  selectedAnimlObservationId = null,
  onAnimlViewModeChange,
  onAnimlDeploymentClick,
  onAnimlAnimalTagClick,
  onAnimlObservationClick,
  onAnimlDetailsClose,
  onAnimlExportCSV,
  onAnimlExportGeoJSON,
  onAnimlAddToCart,
  animlDateRangeText = '',
  animlCustomFilters,
  onAnimlCustomFiltersChange
}) => {
  // Route to appropriate data view based on category + source combination
  const getDataView = () => {
    // Show blank state if no filters selected OR before first search
    if (!hasSearched || !filters.category || !filters.source) {
      return (
        <div id="no-search-blank-state" className="w-96 bg-white border-r border-gray-200 flex items-center justify-center">
          <div id="blank-state-content" className="text-center p-8">
            <svg className="mx-auto w-16 h-16 text-gray-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Ready to Search</h3>
            <p className="text-sm text-gray-600 max-w-sm">
              Select your data category, source, spatial filter, and time range above, then click the search button to view results.
            </p>
          </div>
        </div>
      );
    }

    const key = `${filters.category}-${filters.source}`;
    
    switch (key) {
      // iNaturalist Public API - supports both Ecological/Biological and Vegetation categories
      case 'Ecological / Biological (Species?)-iNaturalist (Public API)':
      case 'Vegetation / habitat-iNaturalist (Public API)':
        return (
          <WildlifeINaturalistView
            observations={observations}
            loading={observationsLoading}
            currentDaysBack={lastSearchedDaysBack}
            startDate={startDate}
            endDate={endDate}
            onExportCSV={onObservationExportCSV}
            onExportGeoJSON={onObservationExportGeoJSON}
            hasSearched={hasSearched}
            onObservationClick={onINatObservationClick}
            selectedObservationId={selectedINatObservation?.id}
            iconicTaxa={currentIconicTaxa ?? filters.iconicTaxa}
            onIconicTaxaChange={onIconicTaxaChange}
          />
        );

      // iNaturalist TNC Layers - supports both Ecological/Biological and Vegetation categories
      case 'Ecological / Biological (Species?)-iNaturalist (TNC Layers)':
      case 'Vegetation / habitat-iNaturalist (TNC Layers)':
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
            hasSearched={hasSearched}
            onObservationClick={onINatObservationClick}
            selectedObservationId={selectedINatObservation?.id}
            iconicTaxa={currentIconicTaxa ?? filters.iconicTaxa}
            onIconicTaxaChange={onIconicTaxaChange}
          />
        );
        
      // eBird - Ecological/Biological category
      case 'Ecological / Biological (Species?)-eBird':
        return (
          <WildlifeEBirdView
            observations={eBirdObservations}
            loading={eBirdObservationsLoading}
            currentDaysBack={lastSearchedDaysBack}
            startDate={startDate}
            endDate={endDate}
            onExportCSV={onEBirdExportCSV}
            onExportGeoJSON={onEBirdExportGeoJSON}
            hasSearched={hasSearched}
          />
        );
        
      // CalFlora - Vegetation/habitat category
      case 'Vegetation / habitat-CalFlora':
        return (
          <VegetationCalFloraView
            plants={calFloraPlants}
            loading={calFloraLoading}
            onExportCSV={onCalFloraExportCSV}
            onExportGeoJSON={onCalFloraExportGeoJSON}
            onPlantSelect={onCalFloraPlantSelect}
            hasSearched={hasSearched}
          />
        );

      // TNC ArcGIS Hub cases
      case 'Vegetation / habitat-TNC ArcGIS Hub':
      case 'Ecological / Biological (Species?)-TNC ArcGIS Hub':
      case 'Real-time & Remote Sensing-TNC ArcGIS Hub':
      case 'Land use and land (geography?)-TNC ArcGIS Hub':
      case 'Climate / weather-TNC ArcGIS Hub':
      case 'Hydrological-TNC ArcGIS Hub':
      case 'Topographic-TNC ArcGIS Hub':
      case 'Marine-TNC ArcGIS Hub':
      case 'Fire-TNC ArcGIS Hub':
      case 'Infrastructure-TNC ArcGIS Hub':
      case 'Hazards & Resilience-TNC ArcGIS Hub':
        return (
          <TNCArcGISView
            items={tncArcGISItems}
            loading={tncArcGISLoading}
            onItemSelect={onTNCArcGISItemSelect}
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

      // LiDAR case
      case 'Land use and land (geography?)-LiDAR':
        return (
          <LiDARView
            hasSearched={hasSearched}
            onModeChange={onLiDARModeChange}
          />
        );
      
      // Dendra Stations case
      case 'Real-time & Remote Sensing-Dendra Stations':
        return (
          <DendraSidebar
            stations={dendraStations}
            datastreams={dendraDatastreams}
            onStationSelect={onDendraStationSelect!}
            onDatastreamSelect={onDendraDatastreamSelect!}
            selectedStationId={selectedDendraStationId || null}
            selectedDatastreamId={selectedDendraDatastreamId || null}
            onShowDendraWebsite={onShowDendraWebsite}
          />
        );
      
      // Animl cases
      case 'Ecological / Biological (Species?)-Animl':
      case 'Real-time & Remote Sensing-Animl':
        return (
          <WildlifeAnimlView
            viewMode={animlViewMode}
            onViewModeChange={onAnimlViewModeChange || (() => {})}
            deployments={animlDeployments}
            animalTags={animlAnimalTags}
            imageLabels={animlImageLabels || []}
            loading={animlLoading}
            loadingObservations={animlLoadingObservations}
            loadingMoreObservations={animlLoadingMoreObservations}
            totalObservationsCount={animlTotalObservationsCount}
            selectedDeploymentId={selectedAnimlDeploymentId}
            selectedAnimalLabel={selectedAnimlAnimalLabel}
            selectedObservationId={selectedAnimlObservationId}
            onDeploymentClick={onAnimlDeploymentClick}
            onAnimalTagClick={onAnimlAnimalTagClick}
            onObservationClick={onAnimlObservationClick}
            onExportCSV={onAnimlExportCSV}
            onExportGeoJSON={onAnimlExportGeoJSON}
            onAddToCart={onAnimlAddToCart}
            onDetailsClose={onAnimlDetailsClose}
            selectedDeploymentIds={animlCustomFilters?.deploymentIds || []}
            onDeploymentIdsChange={(ids) => onAnimlCustomFiltersChange?.({ ...animlCustomFilters!, deploymentIds: ids })}
            selectedLabels={animlCustomFilters?.labels || []}
            onLabelsChange={(labels) => onAnimlCustomFiltersChange?.({ ...animlCustomFilters!, labels })}
            hasImages={animlCustomFilters?.hasImages}
            onHasImagesChange={(hasImages) => onAnimlCustomFiltersChange?.({ ...animlCustomFilters!, hasImages })}
            hasSearched={hasSearched}
            dateRangeText={animlDateRangeText}
            selectedDeployment={selectedAnimlDeployment}
            selectedAnimalTag={selectedAnimlAnimalTag}
            selectedObservation={selectedAnimlObservation}
          />
        );
        
      default:
        return (
          <div id="unsupported-data-view" className="w-96 bg-white border-r border-gray-200 flex flex-col">
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
