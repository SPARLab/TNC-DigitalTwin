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

function App() {
  const [filters, setFilters] = useState<FilterState>({
    category: 'Wildlife',
    source: 'iNaturalist',
    spatialFilter: 'Draw Area',
    timeRange: '2020-2024'
  });

  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [dataLayers, setDataLayers] = useState(initialDataLayers);
  const [observations, setObservations] = useState<iNaturalistObservation[]>([]);
  const [observationsLoading, setObservationsLoading] = useState(false);
  const mapViewRef = useRef<any>(null);

  const handleFilterChange = (newFilters: FilterState) => {
    setFilters(newFilters);
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

  const handleObservationFilterChange = (filters: {
    qualityGrade?: 'research' | 'needs_id' | 'casual';
    iconicTaxa?: string[];
    daysBack?: number;
  }) => {
    if (mapViewRef.current?.reloadObservations) {
      mapViewRef.current.reloadObservations(filters);
    }
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
    <div id="app" className="min-h-screen bg-gray-50 flex flex-col">
      <Header />
      <FilterBar 
        filters={filters}
        onFilterChange={handleFilterChange}
        resultCount={observations.length}
      />
      <div className="flex-1 flex">
        <ObservationsSidebar 
          observations={observations}
          loading={observationsLoading}
        />
        <MapView 
          ref={mapViewRef}
          dataLayers={dataLayers}
          onLayerToggle={handleLayerToggle}
          onObservationsUpdate={setObservations}
          onLoadingChange={setObservationsLoading}
        />
        <FilterSidebar 
          onFilterChange={handleObservationFilterChange}
          onDownload={handleDownload}
        />
      </div>
      <Footer />
    </div>
  );
}

export default App;
