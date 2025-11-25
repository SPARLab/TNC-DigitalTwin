import { useState, useMemo, useEffect, useRef } from 'react';
import type { DendraStation, DendraDatastream, DendraDatastreamWithStation } from '../types';

import { ArrowLeft } from 'lucide-react';

interface DendraSidebarProps {
  stations: DendraStation[];
  datastreams: DendraDatastream[];
  onStationSelect: (station: DendraStation) => void;
  onDatastreamSelect: (datastream: DendraDatastreamWithStation) => void;
  selectedStationId: number | null;
  selectedDatastreamId: number | null;
  onShowDendraWebsite?: () => void;
  onBack?: () => void;
}

export default function DendraSidebar({
  stations,
  datastreams,
  onStationSelect,
  onDatastreamSelect,
  selectedStationId,
  selectedDatastreamId,
  onShowDendraWebsite,
  onBack
}: DendraSidebarProps) {
  const [activeTab, setActiveTab] = useState<'stations' | 'datastreams'>('stations');
  const [stationSearch, setStationSearch] = useState('');
  const [datastreamSearch, setDatastreamSearch] = useState('');
  
  // Collapsible section state
  const [stationsWithDataExpanded, setStationsWithDataExpanded] = useState(true);
  const [stationsWithoutDataExpanded, setStationsWithoutDataExpanded] = useState(true);
  const [datastreamsWithDataExpanded, setDatastreamsWithDataExpanded] = useState(true);
  const [datastreamsWithoutDataExpanded, setDatastreamsWithoutDataExpanded] = useState(true);
  
  // Ref to track previous selectedStationId to avoid triggering on other state changes
  const prevSelectedStationIdRef = useRef<number | null>(null);

  // Create a map of station IDs to station names for quick lookup
  const stationMap = useMemo(() => {
    const map = new Map<number, string>();
    stations.forEach(station => {
      map.set(station.id, station.name);
    });
    return map;
  }, [stations]);

  // Filter and group stations based on search and data availability
  const { stationsWithData, stationsWithoutData } = useMemo(() => {
    // First apply search filter
    let filtered = stations;
    if (stationSearch.trim()) {
      const searchLower = stationSearch.toLowerCase();
      filtered = stations.filter(station =>
        station.name.toLowerCase().includes(searchLower) ||
        (station.description && station.description.toLowerCase().includes(searchLower)) ||
        station.station_type.toLowerCase().includes(searchLower)
      );
    }
    
    // Then group by data availability
    const withData: DendraStation[] = [];
    const withoutData: DendraStation[] = [];
    
    filtered.forEach(station => {
      if (station.description && station.description.includes('NO DATA')) {
        withoutData.push(station);
      } else {
        withData.push(station);
      }
    });
    
    return { stationsWithData: withData, stationsWithoutData: withoutData };
  }, [stations, stationSearch]);
  
  const totalFilteredStations = stationsWithData.length + stationsWithoutData.length;

  // Create datastreams with station names and filter based on search
  const datastreamswithStations = useMemo(() => {
    return datastreams.map(ds => ({
      ...ds,
      stationName: stationMap.get(ds.station_id) || 'Unknown Station',
    }));
  }, [datastreams, stationMap]);

  // Filter and group datastreams based on search and parent station data availability
  const { datastreamsWithData, datastreamsWithoutData } = useMemo(() => {
    // First apply search filter
    let filtered = datastreamswithStations;
    if (datastreamSearch.trim()) {
      const searchLower = datastreamSearch.toLowerCase();
      filtered = datastreamswithStations.filter(ds =>
        ds.name.toLowerCase().includes(searchLower) ||
        ds.stationName.toLowerCase().includes(searchLower) ||
        ds.variable.toLowerCase().includes(searchLower) ||
        ds.medium.toLowerCase().includes(searchLower)
      );
    }
    
    // Then group by parent station's data availability
    const withData: DendraDatastreamWithStation[] = [];
    const withoutData: DendraDatastreamWithStation[] = [];
    
    filtered.forEach(ds => {
      const parentStation = stations.find(s => s.id === ds.station_id);
      if (parentStation?.description && parentStation.description.includes('NO DATA')) {
        withoutData.push(ds);
      } else {
        withData.push(ds);
      }
    });
    
    return { datastreamsWithData: withData, datastreamsWithoutData: withoutData };
  }, [datastreamswithStations, datastreamSearch, stations]);
  
  const totalFilteredDatastreams = datastreamsWithData.length + datastreamsWithoutData.length;

  // Auto-scroll to selected station when clicked from map
  // Only runs when selectedStationId actually changes, not when expansion states change
  useEffect(() => {
    // Only proceed if selectedStationId has actually changed
    if (selectedStationId !== prevSelectedStationIdRef.current) {
      prevSelectedStationIdRef.current = selectedStationId;
      
      if (selectedStationId) {
        // Switch to stations tab if not already there
        if (activeTab !== 'stations') {
          setActiveTab('stations');
        }
        
        // Small delay to ensure DOM is updated
        setTimeout(() => {
          const cardElement = document.getElementById(`station-card-${selectedStationId}`);
          if (cardElement) {
            // Check which section the station is in and expand it if collapsed
            const isInWithData = stationsWithData.some(s => s.id === selectedStationId);
            const isInWithoutData = stationsWithoutData.some(s => s.id === selectedStationId);
            
            if (isInWithData && !stationsWithDataExpanded) {
              setStationsWithDataExpanded(true);
              // Additional delay for expansion animation
              setTimeout(() => {
                cardElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
              }, 350);
            } else if (isInWithoutData && !stationsWithoutDataExpanded) {
              setStationsWithoutDataExpanded(true);
              // Additional delay for expansion animation
              setTimeout(() => {
                cardElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
              }, 350);
            } else {
              // Section is already expanded, just scroll
              cardElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
          }
        }, 100);
      }
    }
  }, [selectedStationId, activeTab, stationsWithData, stationsWithoutData]);

  return (
    <div id="dendra-sidebar" className="h-full flex flex-col bg-white w-96">
      {/* Header with Dendra.science link */}
      <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {onBack && (
              <button
                onClick={onBack}
                className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors text-gray-600"
                title="Back to Data Catalog"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
            )}
            <h2 className="text-sm font-semibold text-gray-700">Dendra Stations</h2>
          </div>
          {onShowDendraWebsite && (
            <button
              onClick={onShowDendraWebsite}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-md transition-colors border border-blue-200"
              title="View full Dendra website"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
              View on Dendra.science
            </button>
          )}
        </div>
      </div>
        
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

      {/* Scrollable List */}
      <div id="dendra-list-container" className="flex-1 overflow-y-auto" style={{ paddingRight: '0px', marginRight: '0px' }}>
        {activeTab === 'stations' ? (
          <div id="stations-list" className="space-y-6">
            {/* Stations With Data Section */}
            {stationsWithData.length > 0 && (
              <div id="stations-with-data-section">
                <button
                  onClick={() => setStationsWithDataExpanded(!stationsWithDataExpanded)}
                  className="sticky top-0 z-10 w-full bg-green-50 border-b border-green-200 px-4 py-2 hover:bg-green-100 transition-colors flex items-center justify-between"
                >
                  <h3 className="text-sm font-semibold text-green-800">
                    With Data ({stationsWithData.length})
                  </h3>
                  <svg
                    className={`w-4 h-4 text-green-800 transition-transform ${stationsWithDataExpanded ? 'rotate-180' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                <div 
                  className={`grid transition-[grid-template-rows] duration-500 ease-in-out ${
                    stationsWithDataExpanded ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
                  }`}
                >
                  <div className="overflow-hidden">
                    <div className="p-4 space-y-3">
                  {stationsWithData.map(station => (
                    <button
                      key={station.id}
                      id={`station-card-${station.id}`}
                      onClick={() => onStationSelect(station)}
                      className={`w-full text-left p-4 rounded-lg border transition-all ${
                        selectedStationId === station.id
                          ? 'border-blue-500 bg-blue-50 shadow-md'
                          : 'border-gray-300 hover:border-gray-400 hover:shadow-sm bg-white'
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
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {/* Stations Without Data Section */}
            {stationsWithoutData.length > 0 && (
              <div id="stations-without-data-section">
                <button
                  onClick={() => setStationsWithoutDataExpanded(!stationsWithoutDataExpanded)}
                  className="sticky top-0 z-10 w-full bg-gray-100 border-b border-gray-300 px-4 py-2 hover:bg-gray-200 transition-colors flex items-center justify-between"
                >
                  <h3 className="text-sm font-semibold text-gray-700">
                    No Data ({stationsWithoutData.length})
                  </h3>
                  <svg
                    className={`w-4 h-4 text-gray-700 transition-transform ${stationsWithoutDataExpanded ? 'rotate-180' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                <div 
                  className={`grid transition-[grid-template-rows] duration-500 ease-in-out ${
                    stationsWithoutDataExpanded ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
                  }`}
                >
                  <div className="overflow-hidden">
                    <div className="p-4 space-y-3">
                  {stationsWithoutData.map(station => (
                    <button
                      key={station.id}
                      id={`station-card-${station.id}`}
                      onClick={() => onStationSelect(station)}
                      className={`w-full text-left p-4 rounded-lg border transition-all ${
                        selectedStationId === station.id
                          ? 'border-blue-500 bg-blue-50 shadow-md'
                          : 'border-gray-300 hover:border-gray-400 hover:shadow-sm bg-gray-50'
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
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {totalFilteredStations === 0 && (
              <div id="no-stations-message" className="text-center py-8 text-gray-500">
                No stations found matching "{stationSearch}"
              </div>
            )}
          </div>
        ) : (
          <div id="datastreams-list" className="space-y-6">
            {/* Datastreams With Data Section */}
            {datastreamsWithData.length > 0 && (
              <div id="datastreams-with-data-section">
                <button
                  onClick={() => setDatastreamsWithDataExpanded(!datastreamsWithDataExpanded)}
                  className="sticky top-0 z-10 w-full bg-green-50 border-b border-green-200 px-4 py-2 hover:bg-green-100 transition-colors flex items-center justify-between"
                >
                  <h3 className="text-sm font-semibold text-green-800">
                    With Data ({datastreamsWithData.length})
                  </h3>
                  <svg
                    className={`w-4 h-4 text-green-800 transition-transform ${datastreamsWithDataExpanded ? 'rotate-180' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                <div 
                  className={`grid transition-[grid-template-rows] duration-500 ease-in-out ${
                    datastreamsWithDataExpanded ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
                  }`}
                >
                  <div className="overflow-hidden">
                    <div className="p-4 space-y-3">
            {datastreamsWithData.map(datastream => (
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
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {/* Datastreams Without Data Section */}
            {datastreamsWithoutData.length > 0 && (
              <div id="datastreams-without-data-section">
                <button
                  onClick={() => setDatastreamsWithoutDataExpanded(!datastreamsWithoutDataExpanded)}
                  className="sticky top-0 z-10 w-full bg-gray-100 border-b border-gray-300 px-4 py-2 hover:bg-gray-200 transition-colors flex items-center justify-between"
                >
                  <h3 className="text-sm font-semibold text-gray-700">
                    No Data ({datastreamsWithoutData.length})
                  </h3>
                  <svg
                    className={`w-4 h-4 text-gray-700 transition-transform ${datastreamsWithoutDataExpanded ? 'rotate-180' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                <div 
                  className={`grid transition-[grid-template-rows] duration-500 ease-in-out ${
                    datastreamsWithoutDataExpanded ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
                  }`}
                >
                  <div className="overflow-hidden">
                    <div className="p-4 space-y-3">
            {datastreamsWithoutData.map(datastream => (
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
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {totalFilteredDatastreams === 0 && (
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

