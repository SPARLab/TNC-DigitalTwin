import React, { useState, useMemo } from 'react';
import { ChevronDown, ChevronRight, Leaf, AlertTriangle, MapPin, Calendar, Building } from 'lucide-react';
import { CalFloraPlant } from '../services/calFloraService';
import { CalFloraGroup } from '../types';

interface CalFloraSidebarProps {
  plants: CalFloraPlant[];
  isLoading?: boolean;
  onExportCSV?: () => void;
  onExportGeoJSON?: () => void;
}

const CalFloraSidebar: React.FC<CalFloraSidebarProps> = ({
  plants,
  isLoading = false,
  onExportCSV,
  onExportGeoJSON
}) => {
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set(['Native Plants', 'Invasive Plants']));
  const [viewMode, setViewMode] = useState<'recent' | 'grouped'>('recent');

  // Get top 10 most recent plants for display
  const topPlants = useMemo(() => {
    return plants
      .sort((a, b) => {
        // Sort by observation date (most recent first), then by ID
        const dateA = a.observationDate ? new Date(a.observationDate).getTime() : 0;
        const dateB = b.observationDate ? new Date(b.observationDate).getTime() : 0;
        if (dateA !== dateB) return dateB - dateA;
        return b.id.localeCompare(a.id);
      })
      .slice(0, 10);
  }, [plants]);

  // Group plants by native status for the full view
  const groupedPlants = useMemo((): CalFloraGroup[] => {
    const groups: { [key: string]: CalFloraPlant[] } = {
      'Native Plants': [],
      'Invasive Plants': [],
      'Unknown Status': []
    };

    plants.forEach(plant => {
      if (plant.nativeStatus === 'native') {
        groups['Native Plants'].push(plant);
      } else if (plant.nativeStatus === 'invasive') {
        groups['Invasive Plants'].push(plant);
      } else {
        groups['Unknown Status'].push(plant);
      }
    });

    return Object.entries(groups).map(([category, categoryPlants]) => {
      // Group by family within each category
      const familyGroups: { [family: string]: CalFloraPlant[] } = {};
      
      categoryPlants.forEach(plant => {
        const family = plant.family || 'Unknown Family';
        if (!familyGroups[family]) {
          familyGroups[family] = [];
        }
        familyGroups[family].push(plant);
      });

      const subcategories = Object.entries(familyGroups).map(([family, familyPlants]) => ({
        name: family,
        nativeStatus: familyPlants[0]?.nativeStatus || 'unknown' as const,
        count: familyPlants.length,
        plants: familyPlants.map(plant => ({
          id: plant.id,
          commonName: plant.commonName,
          scientificName: plant.scientificName,
          family: plant.family,
          nativeStatus: plant.nativeStatus,
          calIpcRating: plant.calIpcRating,
          county: plant.county,
          observationDate: plant.observationDate,
          dataSource: plant.dataSource,
          photoUrl: plant.attributes?.photo || null
        }))
      }));

      return {
        category: category as 'Native Plants' | 'Invasive Plants',
        count: categoryPlants.length,
        subcategories: subcategories.sort((a, b) => b.count - a.count) // Sort by count descending
      };
    }).filter(group => group.count > 0);
  }, [plants]);

  const toggleGroup = (groupName: string) => {
    const newExpanded = new Set(expandedGroups);
    if (newExpanded.has(groupName)) {
      newExpanded.delete(groupName);
    } else {
      newExpanded.add(groupName);
    }
    setExpandedGroups(newExpanded);
  };

  const getNativeStatusColor = (status: string) => {
    switch (status) {
      case 'native': return 'text-green-600 bg-green-50';
      case 'invasive': return 'text-red-600 bg-red-50';
      case 'non-native': return 'text-yellow-600 bg-yellow-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getNativeStatusIcon = (status: string) => {
    switch (status) {
      case 'native': return <Leaf className="w-4 h-4" />;
      case 'invasive': return <AlertTriangle className="w-4 h-4" />;
      default: return <Leaf className="w-4 h-4" />;
    }
  };

  if (isLoading) {
    return (
      <div id="calflora-sidebar" className="w-80 bg-white border-r border-gray-200 flex flex-col">
        <div id="calflora-header" className="p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">CalFlora Plant Data</h2>
          <p className="text-sm text-gray-600">Loading plant observations...</p>
        </div>
        <div id="loading-content" className="flex-1 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div id="calflora-sidebar" className="w-80 bg-white border-r border-gray-200 flex flex-col">
      {/* Header */}
      <div id="calflora-header" className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Leaf className="w-5 h-5 text-green-600" />
            CalFlora Plants
          </h2>
          <div className="flex gap-1">
            <button
              id="recent-view-btn"
              onClick={() => setViewMode('recent')}
              className={`px-2 py-1 text-xs rounded ${
                viewMode === 'recent' ? 'bg-green-100 text-green-700' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Recent
            </button>
            <button
              id="grouped-view-btn"
              onClick={() => setViewMode('grouped')}
              className={`px-2 py-1 text-xs rounded ${
                viewMode === 'grouped' ? 'bg-green-100 text-green-700' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Grouped
            </button>
          </div>
        </div>
        <p className="text-sm text-gray-600">
          {plants.length} plant records from CalFlora database
        </p>
        
        {/* Export buttons */}
        {plants.length > 0 && (
          <div id="export-buttons" className="flex gap-2 mt-3">
            <button
              id="export-csv-btn"
              onClick={onExportCSV}
              className="flex-1 px-3 py-1.5 text-xs bg-green-50 text-green-700 rounded hover:bg-green-100 transition-colors"
            >
              Export CSV
            </button>
            <button
              id="export-geojson-btn"
              onClick={onExportGeoJSON}
              className="flex-1 px-3 py-1.5 text-xs bg-green-50 text-green-700 rounded hover:bg-green-100 transition-colors"
            >
              Export GeoJSON
            </button>
          </div>
        )}
      </div>

      {/* Content */}
      <div id="calflora-content" className="flex-1 overflow-y-auto">
        {plants.length === 0 ? (
          <div id="no-data" className="p-4 text-center text-gray-500">
            <Leaf className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p>No plant data available</p>
            <p className="text-xs mt-1">Try adjusting your search filters</p>
          </div>
        ) : viewMode === 'recent' ? (
          <div id="recent-plants" className="p-4">
            <div className="mb-3">
              <h3 className="text-sm font-medium text-gray-700 mb-1">Recent Observations</h3>
              <p className="text-xs text-gray-500">Showing top {Math.min(topPlants.length, 10)} most recent plant records</p>
            </div>
            <div className="space-y-3">
              {topPlants.map((plant, index) => (
                <div key={plant.id} id={`recent-plant-${plant.id}`} className="border border-gray-200 rounded-lg p-3 hover:bg-gray-50 transition-colors">
                  <div className="flex gap-3">
                    {/* Plant Image */}
                    <div className="flex-shrink-0">
                      {plant.attributes?.photo ? (
                        <img
                          src={plant.attributes.photo}
                          alt={plant.commonName || plant.scientificName}
                          className="w-16 h-16 rounded-lg object-cover bg-gray-100"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.style.display = 'none';
                            const placeholder = target.nextElementSibling as HTMLElement;
                            if (placeholder) placeholder.style.display = 'flex';
                          }}
                        />
                      ) : null}
                      <div 
                        className={`w-16 h-16 rounded-lg bg-gray-100 flex items-center justify-center ${
                          plant.attributes?.photo ? 'hidden' : 'flex'
                        }`}
                      >
                        <Leaf className="w-6 h-6 text-gray-400" />
                      </div>
                    </div>
                    
                    {/* Plant Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-sm text-gray-900 truncate">
                            {plant.commonName || plant.scientificName}
                          </h4>
                          {plant.commonName && (
                            <p className="text-xs text-gray-600 italic mt-0.5 truncate">
                              {plant.scientificName}
                            </p>
                          )}
                        </div>
                        <div className={`ml-2 px-2 py-1 text-xs rounded-full ${getNativeStatusColor(plant.nativeStatus)}`}>
                          {plant.nativeStatus}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                        {plant.county && (
                          <div className="flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            <span>{plant.county}</span>
                          </div>
                        )}
                        {plant.observationDate && (
                          <div className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            <span>{new Date(plant.observationDate).toLocaleDateString()}</span>
                          </div>
                        )}
                      </div>

                      {plant.attributes?.observer && (
                        <div className="mt-1 text-xs text-gray-500">
                          Observer: {plant.attributes.observer}
                        </div>
                      )}

                      {plant.attributes?.habitat && (
                        <div className="mt-1 text-xs text-gray-600 truncate">
                          Habitat: {plant.attributes.habitat}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            {plants.length > 10 && (
              <div className="mt-4 p-3 bg-gray-50 rounded-lg text-center">
                <p className="text-xs text-gray-600">
                  Showing 10 of {plants.length} total records
                </p>
                <button
                  onClick={() => setViewMode('grouped')}
                  className="mt-1 text-xs text-green-600 hover:text-green-700 font-medium"
                >
                  View all grouped by category →
                </button>
              </div>
            )}
          </div>
        ) : (
          <div id="plant-groups" className="p-4 space-y-4">
            {groupedPlants.map((group) => (
              <div key={group.category} id={`group-${group.category.toLowerCase().replace(' ', '-')}`} className="border border-gray-200 rounded-lg">
                <button
                  onClick={() => toggleGroup(group.category)}
                  className="w-full p-3 text-left flex items-center justify-between hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    {getNativeStatusIcon(group.category === 'Native Plants' ? 'native' : 'invasive')}
                    <span className="font-medium text-gray-900">{group.category}</span>
                    <span className={`px-2 py-0.5 text-xs rounded-full ${
                      group.category === 'Native Plants' ? 'bg-green-100 text-green-700' : 
                      group.category === 'Invasive Plants' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-700'
                    }`}>
                      {group.count}
                    </span>
                  </div>
                  {expandedGroups.has(group.category) ? (
                    <ChevronDown className="w-4 h-4 text-gray-400" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-gray-400" />
                  )}
                </button>

                {expandedGroups.has(group.category) && (
                  <div id={`${group.category.toLowerCase().replace(' ', '-')}-content`} className="border-t border-gray-200">
                    {group.subcategories.map((subcategory) => (
                      <div key={subcategory.name} id={`family-${subcategory.name.toLowerCase().replace(' ', '-')}`} className="border-b border-gray-100 last:border-b-0">
                        <div className="p-3 bg-gray-50 flex items-center justify-between">
                          <span className="font-medium text-sm text-gray-700">{subcategory.name}</span>
                          <span className="text-xs text-gray-500">{subcategory.count} species</span>
                        </div>
                        <div className="divide-y divide-gray-100">
                          {subcategory.plants.slice(0, 10).map((plant) => (
                            <div key={plant.id} id={`plant-${plant.id}`} className="p-3 hover:bg-gray-50 transition-colors">
                              <div className="flex items-start gap-3">
                                {/* Small thumbnail for grouped view */}
                                {plant.photoUrl && (
                                  <img
                                    src={plant.photoUrl}
                                    alt={plant.commonName || plant.scientificName}
                                    className="w-10 h-10 rounded object-cover bg-gray-100 flex-shrink-0"
                                    onError={(e) => {
                                      (e.target as HTMLImageElement).style.display = 'none';
                                    }}
                                  />
                                )}
                                
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-start justify-between">
                                    <div className="flex-1 min-w-0">
                                      <h4 className="font-medium text-sm text-gray-900 truncate">
                                        {plant.commonName || plant.scientificName}
                                      </h4>
                                      {plant.commonName && (
                                        <p className="text-xs text-gray-600 italic mt-0.5 truncate">
                                          {plant.scientificName}
                                        </p>
                                      )}
                                    </div>
                                    <div className={`ml-2 px-2 py-1 text-xs rounded-full ${getNativeStatusColor(plant.nativeStatus)}`}>
                                      {plant.nativeStatus}
                                    </div>
                                  </div>
                                  
                                  <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                                    {plant.county && (
                                      <div className="flex items-center gap-1">
                                        <MapPin className="w-3 h-3" />
                                        <span>{plant.county}</span>
                                      </div>
                                    )}
                                    {plant.observationDate && (
                                      <div className="flex items-center gap-1">
                                        <Calendar className="w-3 h-3" />
                                        <span>{new Date(plant.observationDate).getFullYear()}</span>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                          
                          {subcategory.plants.length > 10 && (
                            <div className="p-2 text-center">
                              <span className="text-xs text-gray-500">
                                +{subcategory.plants.length - 10} more species
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default CalFloraSidebar;
