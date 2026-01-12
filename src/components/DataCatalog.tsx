import React from 'react';
import { 
  PawPrint, 
  Bird, 
  Flower, 
  Camera, 
  Layers, 
  Activity, 
  ArrowRight,
  Database
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
    <div className="p-3 space-y-3 bg-gray-50 h-full overflow-y-auto">
      <div className="mb-3">
        <h2 className="text-lg font-semibold text-gray-900">Data Type</h2>
        <p className="text-sm text-gray-500 mt-0.5">
          Select a data type to explore, or use the filters above to narrow down available data.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-2">
        {sortedCards.map((card) => {
          const compatible = isSourceCompatible(card.sourceKey);
          
          return (
            <button
              key={card.id}
              onClick={() => handleCardClick(card)}
              disabled={!compatible}
              className={`relative flex items-start p-3 rounded-lg border text-left transition-all duration-200 group ${
                compatible 
                  ? 'bg-white border-gray-200 shadow-sm hover:shadow-md hover:border-blue-300 cursor-pointer' 
                  : 'bg-gray-100 border-gray-200 opacity-60 cursor-not-allowed grayscale'
              }`}
            >
              <div className={`p-1.5 rounded-md mr-3 flex-shrink-0 ${
                compatible ? 'bg-blue-50 text-blue-600 group-hover:bg-blue-100' : 'bg-gray-200 text-gray-400'
              }`}>
                <card.icon className="w-5 h-5" />
              </div>
              
              <div className="flex-1 min-w-0">
                <h3 className={`text-base font-medium mb-0.5 ${
                  compatible ? 'text-gray-900 group-hover:text-blue-700' : 'text-gray-500'
                }`}>
                  {card.title}
                </h3>
                <p className="text-sm text-gray-500 line-clamp-2">
                  {card.description}
                </p>
              </div>
              
              <span className={`absolute top-3 right-3 px-1.5 py-0.5 text-xs font-medium rounded ${
                compatible ? 'bg-gray-100 text-gray-600' : 'bg-gray-200 text-gray-400'
              }`}>
                {card.sourceBadge}
              </span>

              {compatible && (
                <ArrowRight className="w-4 h-4 text-gray-300 absolute right-3 top-1/2 transform -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity" />
              )}
            </button>
          );
        })}
      </div>
      
      {filters.category && sortedCards.every(c => !isSourceCompatible(c.sourceKey)) && (
        <div className="text-center p-8 text-gray-500">
          <p>No data sources found for the selected category.</p>
          <button 
            className="mt-2 text-blue-600 hover:underline"
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
