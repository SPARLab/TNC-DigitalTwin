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
import DroneImageryView from './dataviews/DroneImageryView';
import DendraSidebar from './DendraSidebar';
import WildlifeAnimlView from './dataviews/WildlifeAnimlView';
import DataONEView from './dataviews/DataONEView';
import { AnimlDeployment, AnimlImageLabel, AnimlAnimalTag, AnimlCountLookups } from '../services/animlService';
import { AnimlViewMode } from './AnimlSidebar';
import { AnimlCustomFilters } from '../types';
import DataCatalog from './DataCatalog';
import type { DroneImageryProject } from '../types/droneImagery';
import type { DataOneDataset } from '../services/dataOneService';

interface DataViewProps {
  filters: FilterState;
  draftFilters?: FilterState;
  onSelectSource?: (source: string) => void;
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
  onEBirdObservationSelect?: (observation: EBirdObservation) => void;
  onEBirdAddToCart?: () => void;
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
  onBack?: () => void; // Back button callback for all views
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
  onAnimlDeploymentClick?: (deployment: AnimlDeployment | null) => void;
  onAnimlAnimalTagClick?: (tag: AnimlAnimalTag | null) => void;
  onAnimlObservationClick?: (observation: AnimlImageLabel) => void;
  onAnimlDetailsClose?: () => void;
  onAnimlExportCSV?: () => void;
  onAnimlExportGeoJSON?: () => void;
  onAnimlAddToCart?: (filteredCount: number) => void;
  animlDateRangeText?: string;
  animlCustomFilters?: AnimlCustomFilters;
  onAnimlCustomFiltersChange?: (filters: AnimlCustomFilters) => void;
  animlCountLookups?: AnimlCountLookups | null;
  animlCountsLoading?: boolean;
  // Drone Imagery props
  activeDroneImageryIds?: string[];
  loadingDroneImageryIds?: string[];
  onDroneImageryLayerToggle?: (wmtsItemId: string) => void;
  onDroneCarouselOpen?: (project: DroneImageryProject) => void;
  activeDroneProjectName?: string;
  // DataONE props
  onDataOneDatasetSelect?: (dataset: DataOneDataset) => void;
  selectedDataOneDatasetId?: number;
  dataOneSearchText?: string;
  onDataOneSearchTextChange?: (text: string) => void;
  onDataOneDatasetsLoaded?: (datasets: DataOneDataset[]) => void;
}

const DataView: React.FC<DataViewProps> = ({
  filters,
  draftFilters,
  onSelectSource,
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
  onEBirdObservationSelect,
  onEBirdAddToCart,
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
  onBack,
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
  animlCountLookups = null,
  animlCountsLoading: _animlCountsLoading = false,
  onAnimlCustomFiltersChange,
  // Drone Imagery props
  activeDroneImageryIds = [],
  loadingDroneImageryIds = [],
  onDroneImageryLayerToggle,
  onDroneCarouselOpen,
  activeDroneProjectName,
  // DataONE props
  onDataOneDatasetSelect,
  selectedDataOneDatasetId,
  dataOneSearchText = '',
  onDataOneSearchTextChange,
  onDataOneDatasetsLoaded
}) => {
  // Route to appropriate data view based on category + source combination
  const getDataView = () => {
    // Show Data Catalog if no source selected (Home View)
    // Use draftFilters if available to show grayed-out states correctly based on subheader interactions
    if (!filters.source) {
      return (
        <div className="w-96 bg-white border-r border-gray-200 flex flex-col h-full shadow-xl z-10">
           <DataCatalog 
             filters={draftFilters || filters} 
             onSelectSource={onSelectSource!} 
           />
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
            onBack={onBack}
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
            onBack={onBack}
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
            onAddToCart={onEBirdAddToCart}
            hasSearched={hasSearched}
            onBack={onBack}
            onObservationSelect={onEBirdObservationSelect}
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
            onBack={onBack}
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
            onBack={onBack}
          />
        );

      // LiDAR case
      case 'Land use and land (geography?)-LiDAR':
        return (
          <LiDARView
            hasSearched={hasSearched}
            onModeChange={onLiDARModeChange}
            onBack={onBack}
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
            onBack={onBack}
          />
        );

      // Drone Imagery case
      case 'Real-time & Remote Sensing-Drone Imagery':
        return (
          <DroneImageryView
            hasSearched={hasSearched}
            onBack={onBack}
            activeLayerIds={activeDroneImageryIds}
            loadingLayerIds={loadingDroneImageryIds}
            onLayerToggle={onDroneImageryLayerToggle}
            onProjectCarouselOpen={onDroneCarouselOpen}
            activeProjectName={activeDroneProjectName}
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
            countLookups={animlCountLookups}
            onBack={onBack}
          />
        );

      // DataONE cases - Research Datasets
      case 'Ecological / Biological (Species?)-DataONE':
      case 'Vegetation / habitat-DataONE':
      case 'Marine-DataONE':
      case 'Climate / weather-DataONE':
      case 'Hydrological-DataONE':
        return (
          <DataONEView
            hasSearched={hasSearched}
            onBack={onBack}
            onDatasetSelect={onDataOneDatasetSelect}
            selectedDatasetId={selectedDataOneDatasetId}
            searchText={dataOneSearchText}
            onSearchTextChange={onDataOneSearchTextChange}
            onDatasetsLoaded={onDataOneDatasetsLoaded}
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
