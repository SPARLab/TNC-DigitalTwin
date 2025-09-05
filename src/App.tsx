import React, { useState, useRef } from 'react';
import Header from './components/Header';
import FilterBar from './components/FilterBar';
import DataView from './components/DataView';
import FilterSidebar from './components/FilterSidebar';
import MapView from './components/MapView';
import Footer from './components/Footer';
import { FilterState } from './types';
import { mockDatasets, dataLayers as initialDataLayers } from './data/mockData';
import { iNaturalistObservation } from './services/iNaturalistService';
import { TNCArcGISObservation } from './services/tncINaturalistService';
import { CalFloraPlant } from './services/calFloraService';
import { formatDateRangeCompact, getDateRange, formatDateForAPI } from './utils/dateUtils';
import { tncINaturalistService } from './services/tncINaturalistService';
import { MapViewRef } from './components/MapView';

function App() {
  const [filters, setFilters] = useState<FilterState>({
    category: 'Wildlife',
    source: 'iNaturalist (Public API)',
    spatialFilter: 'Draw Area',
    timeRange: formatDateRangeCompact(30),
    daysBack: 30,
    startDate: undefined,
    endDate: undefined
  });

  // Track the filters that were actually used for the last search
  // This determines what data is shown in the sidebar/map
  const [lastSearchedFilters, setLastSearchedFilters] = useState<FilterState>({
    category: 'Wildlife',
    source: 'iNaturalist (Public API)',
    spatialFilter: 'Draw Area',
    timeRange: formatDateRangeCompact(30),
    daysBack: 30,
    startDate: undefined,
    endDate: undefined
  });

  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [dataLayers, setDataLayers] = useState(initialDataLayers);
  const [observations, setObservations] = useState<iNaturalistObservation[]>([]);
  const [tncObservations, setTncObservations] = useState<TNCArcGISObservation[]>([]);
  const [selectedTNCObservation, setSelectedTNCObservation] = useState<TNCArcGISObservation | null>(null);
  const [calFloraPlants, setCalFloraPlants] = useState<CalFloraPlant[]>([]);
  const [observationsLoading, setObservationsLoading] = useState(false);
  const [tncObservationsLoading, setTncObservationsLoading] = useState(false);
  const [calFloraLoading, setCalFloraLoading] = useState(false);
  const [lastSearchedDaysBack, setLastSearchedDaysBack] = useState<number>(30); // Track the last searched time range
  const [tncTotalCount, setTncTotalCount] = useState<number>(0);
  const [tncPage, setTncPage] = useState<number>(1);
  const [tncPageSize, setTncPageSize] = useState<number>(250);
  const mapViewRef = useRef<MapViewRef>(null);

  const handleFilterChange = (newFilters: FilterState) => {
    setFilters(newFilters);
  };

  const handleSearch = () => {
    // Update the last searched filters to match current filters
    // This will cause the DataView to update to show the appropriate sidebar
    setLastSearchedFilters({ ...filters });
    
    if (filters.source === 'CalFlora') {
      // Handle CalFlora search
      const calFloraFilters = {
        maxResults: 1000,
        plantType: 'all' as 'invasive' | 'native' | 'all'
      };
      
      console.log('Searching CalFlora with filters:', calFloraFilters);
      mapViewRef.current?.reloadCalFloraData(calFloraFilters);
    } else if (filters.source === 'iNaturalist (TNC Layers)') {
      // Handle TNC iNaturalist search
      let taxonCategories: string[] = [];
      if (filters.category === 'Vegetation') {
        taxonCategories = ['Plantae']; // Only show plant observations for Vegetation category
      }
      // For Wildlife category, don't filter by taxon categories to show all animals
      
      // Compute start/end dates from filters (support daysBack or custom range)
      let startDate = filters.startDate;
      let endDate = filters.endDate;
      if (!startDate || !endDate) {
        const range = getDateRange(filters.daysBack || 30);
        startDate = formatDateForAPI(range.startDate);
        endDate = formatDateForAPI(range.endDate);
      }

      const tncSearchFilters = {
        startDate,
        endDate,
        taxonCategories,
        maxResults: tncPageSize,
        useFilters: true,
        page: tncPage,
        pageSize: tncPageSize
      };
      
      // Update the last searched time range when search is performed
      setLastSearchedDaysBack(filters.daysBack || 30);
      
      console.log('Searching TNC iNaturalist with filters:', tncSearchFilters);
      // Fetch count in parallel to show total records
      tncINaturalistService
        .queryObservationsCount({
          startDate,
          endDate,
          taxonCategories,
          useFilters: true
        })
        .then(setTncTotalCount)
        .catch((e) => {
          console.warn('Failed to fetch TNC total count:', e);
          setTncTotalCount(0);
        });

      mapViewRef.current?.reloadTNCObservations(tncSearchFilters);
    } else {
      // Handle iNaturalist Public API search
      // Filter by iconic taxa based on category
      let iconicTaxa: string[] = [];
      if (filters.category === 'Vegetation') {
        iconicTaxa = ['Plantae']; // Only show Flora observations for Vegetation category
      }
      // For Wildlife category, don't filter by iconic taxa to show all animals
      
      const searchFilters = {
        daysBack: filters.startDate && filters.endDate ? undefined : (filters.daysBack || 30),
        startDate: filters.startDate,
        endDate: filters.endDate,
        qualityGrade: undefined as 'research' | 'needs_id' | 'casual' | undefined,
        iconicTaxa
      };
      
      // Update the last searched time range when search is performed
      setLastSearchedDaysBack(filters.daysBack || 30);
      
      console.log('Searching iNaturalist Public API with filters:', searchFilters);
      mapViewRef.current?.reloadObservations(searchFilters);
    }
  };

  const handleLayerToggle = (layerId: string) => {
    setDataLayers(layers => 
      layers.map(layer => 
        layer.id === layerId 
          ? { ...layer, visible: !layer.visible }
          : layer
      )
    );
  };

  const handleObservationFilterChange = (observationFilters: {
    qualityGrade?: 'research' | 'needs_id' | 'casual';
    iconicTaxa?: string[];
    daysBack?: number;
    startDate?: string;
    endDate?: string;
  }) => {
    // Update the main filter state if daysBack changed
    if (observationFilters.daysBack && observationFilters.daysBack !== filters.daysBack) {
      setFilters(prev => ({
        ...prev,
        timeRange: formatDateRangeCompact(observationFilters.daysBack!),
        daysBack: observationFilters.daysBack
      }));
    }
    
    // Handle custom date range - update timeRange display
    if (observationFilters.startDate && observationFilters.endDate) {
      const startDate = new Date(observationFilters.startDate);
      const endDate = new Date(observationFilters.endDate);
      const customTimeRange = `${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}`;
      
      setFilters(prev => ({
        ...prev,
        timeRange: customTimeRange,
        daysBack: undefined // Clear daysBack when using custom dates
      }));
    }
    
    // Apply category-based iconic taxa filtering if not already specified
    let iconicTaxa = observationFilters.iconicTaxa;
    if (!iconicTaxa && filters.source === 'iNaturalist' && filters.category === 'Vegetation') {
      iconicTaxa = ['Plantae']; // Only show Flora observations for Vegetation category
    }
    
    // Use the current filter's daysBack if not provided in observationFilters and no custom dates
    const finalFilters = {
      ...observationFilters,
      iconicTaxa,
      daysBack: observationFilters.startDate && observationFilters.endDate 
        ? undefined 
        : (observationFilters.daysBack || filters.daysBack || 30)
    };
    
    console.log('Filter change with filters:', finalFilters); // Debug log
    // Note: We don't automatically reload observations here anymore
    // Data will only update when the user clicks the search button
  };

  const handleDownload = (format: 'csv' | 'json' | 'geojson') => {
    if (observations.length === 0) {
      alert('No observations to download');
      return;
    }

    let data: string;
    let filename: string;
    let mimeType: string;

    switch (format) {
      case 'csv':
        data = convertToCSV(observations);
        filename = 'dangermond-observations.csv';
        mimeType = 'text/csv';
        break;
      case 'json':
        data = JSON.stringify(observations, null, 2);
        filename = 'dangermond-observations.json';
        mimeType = 'application/json';
        break;
      case 'geojson':
        data = convertToGeoJSON(observations);
        filename = 'dangermond-observations.geojson';
        mimeType = 'application/geo+json';
        break;
    }

    const blob = new Blob([data], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const convertToCSV = (observations: iNaturalistObservation[]): string => {
    const headers = [
      'ID', 'Common Name', 'Scientific Name', 'Iconic Taxon', 'Quality Grade',
      'Observed On', 'Observer', 'Latitude', 'Longitude', 'iNaturalist URL'
    ];
    
    const rows = observations.map(obs => [
      obs.id,
      obs.taxon?.preferred_common_name || '',
      obs.taxon?.name || '',
      obs.taxon?.iconic_taxon_name || '',
      obs.quality_grade,
      obs.observed_on,
      obs.user.login,
      obs.geojson?.coordinates?.[1] || '',
      obs.geojson?.coordinates?.[0] || '',
      obs.uri
    ]);

    return [headers, ...rows].map(row => 
      row.map(field => `"${String(field).replace(/"/g, '""')}"`).join(',')
    ).join('\n');
  };

  const convertToGeoJSON = (observations: iNaturalistObservation[]): string => {
    const features = observations
      .filter(obs => obs.geojson?.coordinates)
      .map(obs => ({
        type: 'Feature',
        geometry: obs.geojson,
        properties: {
          id: obs.id,
          commonName: obs.taxon?.preferred_common_name,
          scientificName: obs.taxon?.name,
          iconicTaxon: obs.taxon?.iconic_taxon_name,
          qualityGrade: obs.quality_grade,
          observedOn: obs.observed_on,
          observer: obs.user.login,
          uri: obs.uri
        }
      }));

    return JSON.stringify({
      type: 'FeatureCollection',
      features
    }, null, 2);
  };

  // CalFlora export functions
  const convertCalFloraToCSV = (plants: CalFloraPlant[]): string => {
    const headers = [
      'ID', 'Common Name', 'Scientific Name', 'Family', 'Native Status', 
      'Cal-IPC Rating', 'County', 'Observation Date', 'Latitude', 'Longitude', 'Data Source'
    ];
    
    const rows = plants.map(plant => [
      plant.id,
      plant.commonName || '',
      plant.scientificName,
      plant.family || '',
      plant.nativeStatus,
      plant.calIpcRating || '',
      plant.county || '',
      plant.observationDate || '',
      plant.geojson?.coordinates?.[1] || '',
      plant.geojson?.coordinates?.[0] || '',
      plant.dataSource
    ]);

    return [headers, ...rows].map(row => 
      row.map(field => `"${String(field).replace(/"/g, '""')}"`).join(',')
    ).join('\n');
  };

  const convertCalFloraToGeoJSON = (plants: CalFloraPlant[]): string => {
    const features = plants
      .filter(plant => plant.geojson?.coordinates)
      .map(plant => ({
        type: 'Feature',
        geometry: plant.geojson,
        properties: {
          id: plant.id,
          commonName: plant.commonName,
          scientificName: plant.scientificName,
          family: plant.family,
          nativeStatus: plant.nativeStatus,
          calIpcRating: plant.calIpcRating,
          county: plant.county,
          observationDate: plant.observationDate,
          dataSource: plant.dataSource
        }
      }));

    return JSON.stringify({
      type: 'FeatureCollection',
      features
    }, null, 2);
  };

  const handleCalFloraExportCSV = () => {
    const csvData = convertCalFloraToCSV(calFloraPlants);
    downloadFile(csvData, 'calflora-plants.csv', 'text/csv');
  };

  const handleCalFloraExportGeoJSON = () => {
    const geoJsonData = convertCalFloraToGeoJSON(calFloraPlants);
    downloadFile(geoJsonData, 'calflora-plants.geojson', 'application/geo+json');
  };

  const handleExportCSV = () => {
    const csvData = convertToCSV(observations);
    downloadFile(csvData, 'inaturalist-observations.csv', 'text/csv');
  };

  const handleExportGeoJSON = () => {
    const geoJsonData = convertToGeoJSON(observations);
    downloadFile(geoJsonData, 'inaturalist-observations.geojson', 'application/geo+json');
  };

  // TNC export functions
  const convertTNCToCSV = (observations: TNCArcGISObservation[]): string => {
    const headers = [
      'Observation ID', 'UUID', 'Common Name', 'Scientific Name', 'Taxon Category', 'Taxon ID',
      'Observed On', 'Observer', 'User Login', 'Latitude', 'Longitude', 
      'Kingdom', 'Phylum', 'Class', 'Order', 'Family', 'Genus', 'Species'
    ];
    
    const rows = observations.map(obs => [
      obs.observation_id,
      obs.observation_uuid,
      obs.common_name || '',
      obs.scientific_name,
      obs.taxon_category_name,
      obs.taxon_id,
      obs.observed_on,
      obs.user_name,
      obs.user_login,
      obs.geometry?.coordinates?.[1] || '',
      obs.geometry?.coordinates?.[0] || '',
      obs.taxon_kingdom_name || '',
      obs.taxon_phylum_name || '',
      obs.taxon_class_name || '',
      obs.taxon_order_name || '',
      obs.taxon_family_name || '',
      obs.taxon_genus_name || '',
      obs.taxon_species_name || ''
    ]);

    return [headers, ...rows].map(row => 
      row.map(field => `"${String(field).replace(/"/g, '""')}"`).join(',')
    ).join('\n');
  };

  const convertTNCToGeoJSON = (observations: TNCArcGISObservation[]): string => {
    const features = observations
      .filter(obs => obs.geometry?.coordinates)
      .map(obs => ({
        type: 'Feature',
        geometry: obs.geometry,
        properties: {
          observation_id: obs.observation_id,
          observation_uuid: obs.observation_uuid,
          commonName: obs.common_name,
          scientificName: obs.scientific_name,
          taxonCategory: obs.taxon_category_name,
          taxonId: obs.taxon_id,
          observedOn: obs.observed_on,
          observer: obs.user_name,
          userLogin: obs.user_login,
          kingdom: obs.taxon_kingdom_name,
          phylum: obs.taxon_phylum_name,
          class: obs.taxon_class_name,
          order: obs.taxon_order_name,
          family: obs.taxon_family_name,
          genus: obs.taxon_genus_name,
          species: obs.taxon_species_name
        }
      }));

    return JSON.stringify({
      type: 'FeatureCollection',
      features
    }, null, 2);
  };

  const handleTNCExportCSV = () => {
    const csvData = convertTNCToCSV(tncObservations);
    downloadFile(csvData, 'tnc-inaturalist-observations.csv', 'text/csv');
  };

  const handleTNCExportGeoJSON = () => {
    const geoJsonData = convertTNCToGeoJSON(tncObservations);
    downloadFile(geoJsonData, 'tnc-inaturalist-observations.geojson', 'application/geo+json');
  };

  // Helper function to download files
  const downloadFile = (data: string, filename: string, mimeType: string) => {
    const blob = new Blob([data], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Filter datasets based on current filters
  const filteredDatasets = mockDatasets.filter(dataset => {
    if (filters.category !== 'Wildlife' && dataset.category !== filters.category) {
      return false;
    }
    // Add more filtering logic here as needed
    return true;
  });

  return (
    <div id="app" className="h-screen bg-gray-50 flex flex-col">
      <Header />
      <FilterBar 
        filters={filters}
        onFilterChange={handleFilterChange}
        onSearch={handleSearch}
        resultCount={
          lastSearchedFilters.source === 'CalFlora' ? calFloraPlants.length :
          lastSearchedFilters.source === 'iNaturalist (TNC Layers)' ? tncObservations.length :
          observations.length
        }
        isSearching={
          filters.source === 'CalFlora' ? calFloraLoading :
          filters.source === 'iNaturalist (TNC Layers)' ? tncObservationsLoading :
          observationsLoading
        }
      />
      <div id="main-content" className="flex-1 flex min-h-0">
        <DataView
          filters={lastSearchedFilters}
          observations={observations}
          observationsLoading={observationsLoading}
          onObservationExportCSV={handleExportCSV}
          onObservationExportGeoJSON={handleExportGeoJSON}
          tncObservations={tncObservations}
          tncObservationsLoading={tncObservationsLoading}
          onTNCObservationExportCSV={handleTNCExportCSV}
          onTNCObservationExportGeoJSON={handleTNCExportGeoJSON}
          selectedTNCObservation={selectedTNCObservation}
          onTNCObservationSelect={setSelectedTNCObservation}
          calFloraPlants={calFloraPlants}
          calFloraLoading={calFloraLoading}
          onCalFloraExportCSV={handleCalFloraExportCSV}
          onCalFloraExportGeoJSON={handleCalFloraExportGeoJSON}
          lastSearchedDaysBack={lastSearchedDaysBack}
          startDate={filters.startDate}
          endDate={filters.endDate}
        />
        <MapView 
          ref={mapViewRef}
          dataLayers={dataLayers}
          onLayerToggle={handleLayerToggle}
          onObservationsUpdate={setObservations}
          onLoadingChange={setObservationsLoading}
          tncObservations={lastSearchedFilters.source === 'iNaturalist (TNC Layers)' ? tncObservations : []}
          onTNCObservationsUpdate={setTncObservations}
          onTNCLoadingChange={setTncObservationsLoading}
          selectedTNCObservation={selectedTNCObservation}
          onTNCObservationSelect={setSelectedTNCObservation}
          calFloraPlants={filters.source === 'CalFlora' ? calFloraPlants : []}
          onCalFloraUpdate={setCalFloraPlants}
          onCalFloraLoadingChange={setCalFloraLoading}
        />
        <FilterSidebar 
          currentDaysBack={filters.daysBack}
          onFilterChange={handleObservationFilterChange}
          onDownload={handleDownload}
        />
      </div>
      <Footer />
    </div>
  );
}

export default App;
