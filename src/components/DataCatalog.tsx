import React from 'react';
import { 
  PawPrint, 
  Bird, 
  Flower, 
  Camera, 
  Layers, 
  Activity, 
  ArrowRight,
  Database,
  Info
} from 'lucide-react';
import LidarIcon from './icons/LidarIcon';
import DroneIcon from './icons/DroneIcon';
import { FilterState } from '../types';
import { CATEGORY_DATA_SOURCES } from '../utils/constants';

interface DataCatalogProps {
  filters: FilterState;
  onSelectSource: (source: string, defaults?: Partial<FilterState>) => void;
}

interface DataTypeCardConfig {
  id: string;
  title: string;
  description: string;
  icon: React.ElementType;
  sourceKey: string; // Matches the string used in App state/constants
  sourceBadge: string; // Short data source label for badge
  defaults: {
    category: string;
    spatialFilter: string;
    daysBack: number;
    timeRange: string;
  }
}

const DATA_TYPE_CARDS: DataTypeCardConfig[] = [
  {
    id: 'tnc-arcgis',
    title: 'Map Layers',
    description: 'Curated GIS layers including boundaries, vegetation, fire history, and infrastructure.',
    icon: Layers,
    sourceKey: 'TNC ArcGIS Hub',
    sourceBadge: 'ArcGIS Hub',
    defaults: {
      category: 'Species',
      spatialFilter: 'Dangermond Preserve',
      daysBack: 365,
      timeRange: 'Last year'
    }
  },
  {
    id: 'inaturalist',
    title: 'Wildlife Observations',
    description: 'Community-contributed observations of biodiversity from iNaturalist.',
    icon: PawPrint, 
    sourceKey: 'iNaturalist (Public API)',
    sourceBadge: 'iNaturalist',
    defaults: {
      category: 'Species',
      spatialFilter: 'Dangermond Preserve',
      daysBack: 365,
      timeRange: 'Last year'
    }
  },
  {
    id: 'ebird',
    title: 'Bird Sightings',
    description: 'Checklists and observations of bird species from the eBird database.',
    icon: Bird,
    sourceKey: 'eBird',
    sourceBadge: 'eBird',
    defaults: {
      category: 'Species',
      spatialFilter: 'Dangermond Preserve',
      daysBack: 365,
      timeRange: 'Last year'
    }
  },
  {
    id: 'calflora',
    title: 'Plants',
    description: 'Distribution data of wild California plants from CalFlora.',
    icon: Flower,
    sourceKey: 'CalFlora',
    sourceBadge: 'CalFlora',
    defaults: {
      category: 'Land Cover',
      spatialFilter: 'Dangermond Preserve',
      daysBack: 365,
      timeRange: 'Last year'
    }
  },
  {
    id: 'animl',
    title: 'Camera Traps',
    description: 'Motion-triggered images from wildlife camera traps across the preserve.',
    icon: Camera,
    sourceKey: 'Animl',
    sourceBadge: 'Animl',
    defaults: {
      category: 'Research and Sensor Equipment',
      spatialFilter: 'Dangermond Preserve',
      daysBack: 365,
      timeRange: 'Last year'
    }
  },
  {
    id: 'dendra',
    title: 'Remote Sensors',
    description: 'Real-time environmental monitoring data from weather stations and soil sensors.',
    icon: Activity,
    sourceKey: 'Dendra Stations',
    sourceBadge: 'Dendra',
    defaults: {
      category: 'Research and Sensor Equipment',
      spatialFilter: 'Dangermond Preserve',
      daysBack: 365,
      timeRange: 'Last year'
    }
  },
  {
    id: 'lidar',
    title: 'LiDAR Imagery',
    description: 'High-resolution elevation and terrain models derived from aerial laser scanning.',
    icon: LidarIcon,
    sourceKey: 'LiDAR',
    sourceBadge: 'LiDAR',
    defaults: {
      category: 'Elevation and Bathymetry',
      spatialFilter: 'Dangermond Preserve',
      daysBack: 365, // Not really relevant for LiDAR but needed for type consistency
      timeRange: 'All time'
    }
  },
  {
    id: 'drone-imagery',
    title: 'Drone Imagery',
    description: 'High-resolution aerial imagery from DroneDeploy flights across the preserve.',
    icon: DroneIcon,
    sourceKey: 'Drone Imagery',
    sourceBadge: 'DroneDeploy',
    defaults: {
      category: 'Earth Observations',
      spatialFilter: 'Dangermond Preserve',
      daysBack: 365,
      timeRange: 'All time'
    }
  },
  {
    id: 'dataone',
    title: 'Research Datasets',
    description: 'Scientific datasets from PISCO, LTER, PANGAEA and other research repositories.',
    icon: Database,
    sourceKey: 'DataONE',
    sourceBadge: 'DataONE',
    defaults: {
      category: 'Species',
      spatialFilter: 'Dangermond Preserve',
      daysBack: 365,
      timeRange: 'All time'
    }
  }
];

const DataCatalog: React.FC<DataCatalogProps> = ({ filters, onSelectSource }) => {
  
  const isSourceCompatible = (sourceKey: string) => {
    if (!filters.category) return true; // All sources compatible if no category selected
    
    const compatibleSources = CATEGORY_DATA_SOURCES[filters.category as keyof typeof CATEGORY_DATA_SOURCES] || [];
    
    // Handle special mappings if necessary (e.g. iNaturalist (Public API) vs iNaturalist)
    // The constants use specific strings, we should match them.
    return compatibleSources.includes(sourceKey) || 
           (sourceKey === 'iNaturalist (Public API)' && compatibleSources.includes('iNaturalist'));
  };

  // Sort cards: Compatible first, then incompatible
  const sortedCards = [...DATA_TYPE_CARDS].sort((a, b) => {
    const aCompatible = isSourceCompatible(a.sourceKey);
    const bCompatible = isSourceCompatible(b.sourceKey);
    if (aCompatible === bCompatible) return 0;
    return aCompatible ? -1 : 1;
  });

  const handleCardClick = (card: DataTypeCardConfig) => {
    // If we already have a category selected, we keep it (unless it conflicts? we rely on disabled state for that)
    // If no category is selected, we use the default for this card
    const defaults = !filters.category ? card.defaults : undefined;
    
    // Also if time range is missing, we might want to inject it
    const timeDefaults = !filters.timeRange ? { 
      daysBack: card.defaults.daysBack, 
      timeRange: card.defaults.timeRange 
    } : {};

    // Also spatial filter
    const spatialDefaults = !filters.spatialFilter ? {
      spatialFilter: card.defaults.spatialFilter
    } : {};

    const mergedDefaults = {
      ...(defaults || {}),
      ...timeDefaults,
      ...spatialDefaults
    };

    onSelectSource(card.sourceKey, mergedDefaults);
  };

  return (
    <div id="data-catalog-container" className="px-page-base lg:px-page-lg 2xl:px-page-2xl py-page-y-base lg:py-page-y-lg xl:p-card-compact-xl 2xl:p-card-compact-2xl space-y-2 xl:space-y-3 bg-gray-50 h-full overflow-y-auto">
      <div id="data-catalog-header" className="mb-2 xl:mb-section-compact-xl 2xl:mb-section-compact-2xl">
        <h2 id="data-catalog-title" className="text-label-base lg:text-label-lg xl:text-title-section-xl 2xl:text-title-section-2xl font-semibold text-gray-900">Data Type</h2>
        <p id="data-catalog-description" className="text-micro-base lg:text-micro-lg xl:text-body-xl 2xl:text-body-2xl text-gray-500 mt-0.5 xl:mt-element-compact-xl 2xl:mt-element-compact-2xl">
          Select a data type to explore, or use the filters above to narrow down available data.
        </p>
      </div>

      <div id="data-catalog-grid" className="grid grid-cols-1 gap-1 xl:gap-gap-default-xl 2xl:gap-gap-default-2xl">
        {sortedCards.map((card) => {
          const compatible = isSourceCompatible(card.sourceKey);
          
          return (
            <button
              key={card.id}
              id={`data-card-${card.id}`}
              onClick={() => handleCardClick(card)}
              disabled={!compatible}
              className={`relative flex items-center xl:items-start px-2 py-1.5 xl:p-card-compact-xl 2xl:p-card-compact-2xl rounded-card border text-left transition-all duration-200 group ${
                compatible 
                  ? 'bg-white border-gray-200 shadow-sm hover:shadow-md hover:border-blue-300 cursor-pointer' 
                  : 'bg-gray-100 border-gray-200 opacity-60 cursor-not-allowed grayscale'
              }`}
            >
              <div className={`p-1 xl:p-gap-small-xl 2xl:p-gap-small-2xl rounded-button mr-2 xl:mr-gap-default-xl 2xl:mr-gap-default-2xl flex-shrink-0 ${
                compatible ? 'bg-blue-50 text-blue-600 group-hover:bg-blue-100' : 'bg-gray-200 text-gray-400'
              }`}>
                <card.icon className="w-4 h-4 xl:w-5 xl:h-5" />
              </div>
              
              <div className="flex-1 min-w-0 flex items-center xl:block">
                <h3 
                  className={`text-label-base lg:text-label-lg xl:text-title-card-xl 2xl:text-title-card-2xl font-medium xl:mb-element-compact-xl 2xl:mb-element-compact-2xl ${
                    compatible ? 'text-gray-900 group-hover:text-blue-700' : 'text-gray-500'
                  }`}
                >
                  {card.title}
                </h3>
                <span 
                  className="xl:hidden flex-shrink-0 ml-[.1rem] cursor-help"
                  title={card.description}
                >
                  <Info className="w-3.5 h-3.5 text-gray-400 hover:text-blue-500" />
                </span>
                <p 
                  className="hidden xl:block text-body-base lg:text-body-lg xl:text-body-xl 2xl:text-body-2xl text-gray-500 line-clamp-2"
                >
                  {card.description}
                </p>
              </div>
              
              <span className={`absolute top-1/2 -translate-y-1/2 xl:translate-y-0 xl:top-card-compact-xl 2xl:top-card-compact-2xl right-2 xl:right-card-compact-xl 2xl:right-card-compact-2xl px-1.5 xl:px-gap-small-xl 2xl:px-gap-small-2xl py-0.5 text-micro-base lg:text-micro-lg xl:text-label-xl 2xl:text-label-2xl rounded-badge ${
                compatible ? 'bg-gray-100 text-gray-600' : 'bg-gray-200 text-gray-400'
              }`}>
                {card.sourceBadge}
              </span>

              {compatible && (
                <ArrowRight className="hidden xl:block w-4 h-4 text-gray-300 absolute right-card-compact-xl 2xl:right-card-compact-2xl top-1/2 transform -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity" />
              )}
            </button>
          );
        })}
      </div>
      
      {filters.category && sortedCards.every(c => !isSourceCompatible(c.sourceKey)) && (
        <div id="data-catalog-empty-state" className="text-center p-card-base lg:p-card-lg 2xl:p-card-2xl text-gray-500">
          <p className="text-body-base lg:text-body-lg 2xl:text-body-2xl">No data sources found for the selected category.</p>
          <button 
            id="data-catalog-clear-filters"
            className="mt-element-base lg:mt-element-lg 2xl:mt-element-2xl text-body-base lg:text-body-lg 2xl:text-body-2xl text-blue-600 hover:underline"
            onClick={() => onSelectSource('', {})} // Clear filters
          >
            Clear filters
          </button>
        </div>
      )}
    </div>
  );
};

export default DataCatalog;
