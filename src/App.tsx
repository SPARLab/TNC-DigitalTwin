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
import { CalFloraPlant } from './services/calFloraService';
import { formatDateRangeCompact } from './utils/dateUtils';
import { MapViewRef } from './components/MapView';

function App() {
  const [filters, setFilters] = useState<FilterState>({
    category: 'Wildlife',
    source: 'iNaturalist',
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
    source: 'iNaturalist',
    spatialFilter: 'Draw Area',
    timeRange: formatDateRangeCompact(30),
    daysBack: 30,
    startDate: undefined,
    endDate: undefined
  });

  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [dataLayers, setDataLayers] = useState(initialDataLayers);
  const [observations, setObservations] = useState<iNaturalistObservation[]>([]);
  const [calFloraPlants, setCalFloraPlants] = useState<CalFloraPlant[]>([]);
  const [observationsLoading, setObservationsLoading] = useState(false);
  const [calFloraLoading, setCalFloraLoading] = useState(false);
  const [lastSearchedDaysBack, setLastSearchedDaysBack] = useState<number>(30); // Track the last searched time range
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
    } else {
      // Handle iNaturalist search
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
      
      console.log('Searching iNaturalist with filters:', searchFilters);
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
        resultCount={lastSearchedFilters.source === 'CalFlora' ? calFloraPlants.length : observations.length}
        isSearching={filters.source === 'CalFlora' ? calFloraLoading : observationsLoading}
      />
      <div id="main-content" className="flex-1 flex min-h-0">
        <DataView
          filters={lastSearchedFilters}
          observations={observations}
          observationsLoading={observationsLoading}
          onObservationExportCSV={handleExportCSV}
          onObservationExportGeoJSON={handleExportGeoJSON}
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
