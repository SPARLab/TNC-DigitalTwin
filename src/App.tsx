import React, { useState } from 'react';
import Header from './components/Header';
import FilterBar from './components/FilterBar';
import SearchResults from './components/SearchResults';
import MapView from './components/MapView';
import Footer from './components/Footer';
import { FilterState } from './types';
import { mockDatasets, dataLayers as initialDataLayers } from './data/mockData';

function App() {
  const [filters, setFilters] = useState<FilterState>({
    category: 'Wildlife',
    source: 'All Sources',
    spatialFilter: 'Draw Area',
    timeRange: '2020-2024'
  });

  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [dataLayers, setDataLayers] = useState(initialDataLayers);

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
        resultCount={filteredDatasets.length}
      />
      <div className="flex-1 flex">
        <SearchResults 
          datasets={filteredDatasets}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
        />
        <MapView 
          dataLayers={dataLayers}
          onLayerToggle={handleLayerToggle}
        />
      </div>
      <Footer />
    </div>
  );
}

export default App;
