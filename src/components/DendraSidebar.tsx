import { useState, useMemo } from 'react';
import type { DendraStation, DendraDatastream, DendraDatastreamWithStation } from '../types';

interface DendraSidebarProps {
  stations: DendraStation[];
  datastreams: DendraDatastream[];
  onStationSelect: (station: DendraStation) => void;
  onDatastreamSelect: (datastream: DendraDatastreamWithStation) => void;
  selectedStationId: number | null;
  selectedDatastreamId: number | null;
}

export default function DendraSidebar({
  stations,
  datastreams,
  onStationSelect,
  onDatastreamSelect,
  selectedStationId,
  selectedDatastreamId,
}: DendraSidebarProps) {
  const [activeTab, setActiveTab] = useState<'stations' | 'datastreams'>('stations');
  const [stationSearch, setStationSearch] = useState('');
  const [datastreamSearch, setDatastreamSearch] = useState('');

  // Create a map of station IDs to station names for quick lookup
  const stationMap = useMemo(() => {
    const map = new Map<number, string>();
    stations.forEach(station => {
      map.set(station.id, station.name);
    });
    return map;
  }, [stations]);

  // Filter stations based on search
  const filteredStations = useMemo(() => {
    if (!stationSearch.trim()) return stations;
    const searchLower = stationSearch.toLowerCase();
    return stations.filter(station =>
      station.name.toLowerCase().includes(searchLower) ||
      (station.description && station.description.toLowerCase().includes(searchLower)) ||
      station.station_type.toLowerCase().includes(searchLower)
    );
  }, [stations, stationSearch]);

  // Create datastreams with station names and filter based on search
  const datastreamswithStations = useMemo(() => {
    return datastreams.map(ds => ({
      ...ds,
      stationName: stationMap.get(ds.station_id) || 'Unknown Station',
    }));
  }, [datastreams, stationMap]);

  const filteredDatastreams = useMemo(() => {
    if (!datastreamSearch.trim()) return datastreamswithStations;
    const searchLower = datastreamSearch.toLowerCase();
    return datastreamswithStations.filter(ds =>
      ds.name.toLowerCase().includes(searchLower) ||
      ds.stationName.toLowerCase().includes(searchLower) ||
      ds.variable.toLowerCase().includes(searchLower) ||
      ds.medium.toLowerCase().includes(searchLower)
    );
  }, [datastreamswithStations, datastreamSearch]);

  return (
    <div id="dendra-sidebar" className="h-full flex flex-col bg-white w-96">
      {/* Tabs */}
      <div id="dendra-sidebar-tabs" className="flex border-b border-gray-200">
        <button
          id="stations-tab-button"
          className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
            activeTab === 'stations'
              ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
              : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
          }`}
          onClick={() => setActiveTab('stations')}
        >
          By Station ({stations.length})
        </button>
        <button
          id="datastreams-tab-button"
          className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
            activeTab === 'datastreams'
              ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
              : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
          }`}
          onClick={() => setActiveTab('datastreams')}
        >
          By Datastream ({datastreams.length})
        </button>
      </div>

      {/* Search Bar */}
      <div id="dendra-search-container" className="p-4 border-b border-gray-200">
        {activeTab === 'stations' ? (
          <input
            id="station-search-input"
            type="text"
            placeholder="Search stations..."
            value={stationSearch}
            onChange={(e) => setStationSearch(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        ) : (
          <input
            id="datastream-search-input"
            type="text"
            placeholder="Search datastreams..."
            value={datastreamSearch}
            onChange={(e) => setDatastreamSearch(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        )}
      </div>

      {/* Results Count */}
      <div id="dendra-results-count" className="px-4 py-2 text-sm text-gray-600 bg-gray-50">
        {activeTab === 'stations'
          ? `${filteredStations.length} station${filteredStations.length !== 1 ? 's' : ''}`
          : `${filteredDatastreams.length} datastream${filteredDatastreams.length !== 1 ? 's' : ''}`}
      </div>

      {/* Scrollable List */}
      <div id="dendra-list-container" className="flex-1 overflow-y-auto">
        {activeTab === 'stations' ? (
          <div id="stations-list" className="p-4 space-y-3">
            {filteredStations.map(station => (
              <button
                key={station.id}
                id={`station-card-${station.id}`}
                onClick={() => onStationSelect(station)}
                className={`w-full text-left p-4 rounded-lg border transition-all ${
                  selectedStationId === station.id
                    ? 'border-blue-500 bg-blue-50 shadow-md'
                    : 'border-gray-200 hover:border-blue-300 hover:shadow-sm bg-white'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 mb-1">{station.name}</h3>
                    {station.description && (
                      <p className="text-sm text-gray-600 line-clamp-2 mb-2">
                        {station.description}
                      </p>
                    )}
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <span className="px-2 py-1 bg-gray-100 rounded">
                        {station.station_type}
                      </span>
                      <span>•</span>
                      <span>{datastreams.filter(ds => ds.station_id === station.id).length} streams</span>
                    </div>
                  </div>
                  {selectedStationId === station.id && (
                    <div className="ml-2 text-blue-600">
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                  )}
                </div>
              </button>
            ))}
            {filteredStations.length === 0 && (
              <div id="no-stations-message" className="text-center py-8 text-gray-500">
                No stations found matching "{stationSearch}"
              </div>
            )}
          </div>
        ) : (
          <div id="datastreams-list" className="p-4 space-y-3">
            {filteredDatastreams.map(datastream => (
              <button
                key={datastream.id}
                id={`datastream-card-${datastream.id}`}
                onClick={() => onDatastreamSelect(datastream)}
                className={`w-full text-left p-4 rounded-lg border transition-all ${
                  selectedDatastreamId === datastream.id
                    ? 'border-blue-500 bg-blue-50 shadow-md'
                    : 'border-gray-200 hover:border-blue-300 hover:shadow-sm bg-white'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 mb-1">{datastream.name}</h3>
                    <p className="text-sm text-gray-600 mb-2">{datastream.stationName}</p>
                    <div className="flex flex-wrap gap-2 text-xs">
                      <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded">
                        {datastream.variable}
                      </span>
                      <span className="px-2 py-1 bg-green-100 text-green-700 rounded">
                        {datastream.medium}
                      </span>
                    </div>
                  </div>
                  {selectedDatastreamId === datastream.id && (
                    <div className="ml-2 text-blue-600">
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                  )}
                </div>
              </button>
            ))}
            {filteredDatastreams.length === 0 && (
              <div id="no-datastreams-message" className="text-center py-8 text-gray-500">
                No datastreams found matching "{datastreamSearch}"
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

