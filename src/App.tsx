import React, { useState, useRef } from 'react';
import Header from './components/Header';
import FilterBar from './components/FilterBar';
import ObservationsSidebar from './components/ObservationsSidebar';
import FilterSidebar from './components/FilterSidebar';
import MapView from './components/MapView';
import Footer from './components/Footer';
import { FilterState } from './types';
import { mockDatasets, dataLayers as initialDataLayers } from './data/mockData';
import { iNaturalistObservation } from './services/iNaturalistService';
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

  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [dataLayers, setDataLayers] = useState(initialDataLayers);
  const [observations, setObservations] = useState<iNaturalistObservation[]>([]);
  const [observationsLoading, setObservationsLoading] = useState(false);
  const [lastSearchedDaysBack, setLastSearchedDaysBack] = useState<number>(30); // Track the last searched time range
  const mapViewRef = useRef<MapViewRef>(null);

  const handleFilterChange = (newFilters: FilterState) => {
    setFilters(newFilters);
  };

  const handleSearch = () => {
    // Trigger a new search with current filter settings
    const searchFilters = {
      daysBack: filters.startDate && filters.endDate ? undefined : (filters.daysBack || 30),
      startDate: filters.startDate,
      endDate: filters.endDate,
      qualityGrade: undefined as 'research' | 'needs_id' | 'casual' | undefined,
      iconicTaxa: [] as string[]
    };
    
    // Update the last searched time range when search is performed
    setLastSearchedDaysBack(filters.daysBack || 30);
    
    console.log('Searching with filters:', searchFilters); // Debug log
    mapViewRef.current?.reloadObservations(searchFilters);
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
    
    // Use the current filter's daysBack if not provided in observationFilters and no custom dates
    const finalFilters = {
      ...observationFilters,
      daysBack: observationFilters.startDate && observationFilters.endDate 
        ? undefined 
        : (observationFilters.daysBack || filters.daysBack || 30)
    };
    
    console.log('Filter change with filters:', finalFilters); // Debug log
    mapViewRef.current?.reloadObservations(finalFilters);
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
        resultCount={observations.length}
        isSearching={observationsLoading}
      />
      <div id="main-content" className="flex-1 flex min-h-0">
        <ObservationsSidebar 
          observations={observations}
          loading={observationsLoading}
          currentDaysBack={lastSearchedDaysBack}
          startDate={filters.startDate}
          endDate={filters.endDate}
        />
        <MapView 
          ref={mapViewRef}
          dataLayers={dataLayers}
          onLayerToggle={handleLayerToggle}
          onObservationsUpdate={setObservations}
          onLoadingChange={setObservationsLoading}
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
