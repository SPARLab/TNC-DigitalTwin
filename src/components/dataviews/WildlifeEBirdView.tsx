import React from 'react';
import { EBirdObservation } from '../../services/eBirdService';
import LoadingSpinner from '../LoadingSpinner';

interface WildlifeEBirdViewProps {
  observations: EBirdObservation[];
  loading: boolean;
  currentDaysBack?: number;
  startDate?: string;
  endDate?: string;
  onExportCSV?: () => void;
  onExportGeoJSON?: () => void;
  hasSearched?: boolean;
}

const WildlifeEBirdView: React.FC<WildlifeEBirdViewProps> = ({
  observations,
  loading,
  currentDaysBack,
  startDate,
  endDate,
  onExportCSV,
  onExportGeoJSON,
  hasSearched = false
}) => {
  // Group observations by species
  const speciesGroups = React.useMemo(() => {
    const groups = new Map<string, EBirdObservation[]>();
    
    observations.forEach(obs => {
      const key = obs.scientific_name;
      if (!groups.has(key)) {
        groups.set(key, []);
      }
      groups.get(key)!.push(obs);
    });

    // Convert to array and sort by total count
    return Array.from(groups.entries())
      .map(([scientificName, obs]) => ({
        scientific_name: scientificName,
        common_name: obs[0].common_name,
        observations: obs,
        total_count: obs.reduce((sum, o) => sum + o.count_observed, 0)
      }))
      .sort((a, b) => b.total_count - a.total_count);
  }, [observations]);

  // Show empty state if no search has been performed
  if (!hasSearched) {
    return (
      <div id="ebird-wildlife-view" className="w-96 bg-white border-r border-gray-200 flex flex-col">
        <div id="ebird-empty-state" className="flex flex-col items-center justify-center h-full p-8 text-center">
          <div id="search-prompt-icon" className="mb-4">
            <svg className="w-16 h-16 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Start Your Search</h3>
          <p className="text-sm text-gray-600">
            Enter selection criteria and hit search to see results
          </p>
        </div>
      </div>
    );
  }

  return (
    <div id="ebird-wildlife-view" className="w-96 bg-white border-r border-gray-200 flex flex-col">
      {/* Header */}
      <div id="ebird-view-header" className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-lg font-semibold text-gray-900">eBird</h2>
          {loading && (
            <div className="flex items-center space-x-2">
              <LoadingSpinner size="small" />
              <span className="text-sm text-gray-500">Loading...</span>
            </div>
          )}
        </div>
        <p className="text-sm text-gray-600">
          {observations.length} observation{observations.length !== 1 ? 's' : ''}
          {currentDaysBack && ` (Last ${currentDaysBack} days)`}
          {startDate && endDate && ` (${startDate} to ${endDate})`}
        </p>
        <p className="text-sm text-gray-600 mt-1">
          {speciesGroups.length} species
        </p>
      </div>

      {/* Export Controls */}
      {observations.length > 0 && (onExportCSV || onExportGeoJSON) && (
        <div id="ebird-export-controls" className="px-4 py-3 border-b border-gray-200 bg-gray-50">
          <div className="flex space-x-2">
            {onExportCSV && (
              <button
                id="ebird-export-csv-button"
                onClick={onExportCSV}
                className="flex-1 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Export CSV
              </button>
            )}
            {onExportGeoJSON && (
              <button
                id="ebird-export-geojson-button"
                onClick={onExportGeoJSON}
                className="flex-1 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Export GeoJSON
              </button>
            )}
          </div>
        </div>
      )}

      {/* Content */}
      <div id="ebird-observations-list" className="flex-1 overflow-y-auto">
        {loading && observations.length === 0 ? (
          <div className="flex items-center justify-center p-8">
            <LoadingSpinner />
          </div>
        ) : observations.length === 0 ? (
          <div className="flex items-center justify-center p-8 text-center">
            <div>
              <p className="text-gray-500 font-medium">No observations found</p>
              <p className="text-sm text-gray-400 mt-1">Try adjusting your filters</p>
            </div>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {speciesGroups.map((group, index) => (
              <div
                key={`${group.scientific_name}-${index}`}
                id={`ebird-species-group-${index}`}
                className="p-4 hover:bg-gray-50"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900">
                      {group.common_name || group.scientific_name}
                    </h3>
                    {group.common_name && (
                      <p className="text-sm text-gray-600 italic">
                        {group.scientific_name}
                      </p>
                    )}
                  </div>
                  <div className="ml-2 text-right">
                    <div className="text-sm font-medium text-gray-900">
                      {group.total_count} individual{group.total_count !== 1 ? 's' : ''}
                    </div>
                    <div className="text-xs text-gray-500">
                      {group.observations.length} observation{group.observations.length !== 1 ? 's' : ''}
                    </div>
                  </div>
                </div>

                {/* Show sample observations */}
                <div className="mt-2 space-y-1">
                  {group.observations.slice(0, 3).map((obs, obsIndex) => (
                    <div
                      key={`${obs.obs_id}-${obsIndex}`}
                      className="text-xs text-gray-600 pl-2 border-l-2 border-gray-200"
                    >
                      <div className="flex items-center justify-between">
                        <span>{obs.location_name}</span>
                        <span className="text-gray-500">{obs.count_observed}×</span>
                      </div>
                      <div className="text-gray-500">
                        {obs.observation_date} {obs.obstime && `at ${obs.obstime}`}
                      </div>
                    </div>
                  ))}
                  {group.observations.length > 3 && (
                    <div className="text-xs text-gray-500 pl-2">
                      + {group.observations.length - 3} more observation{group.observations.length - 3 !== 1 ? 's' : ''}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default WildlifeEBirdView;


