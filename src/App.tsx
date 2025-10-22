import { useState, useRef, useEffect, useMemo } from 'react';
import Header from './components/Header';
import FilterSubheader from './components/FilterSubheader';
import DataView from './components/DataView';
import FilterSidebar from './components/FilterSidebar';
import MapView from './components/MapView';
import Scene3DView from './components/Scene3DView';
import Footer from './components/Footer';
import CalFloraPlantModal from './components/CalFloraPlantModal';
import HubPagePreview from './components/HubPagePreview';
import DatasetDownloadView from './components/DatasetDownloadView';
import TNCArcGISDetailsSidebar from './components/TNCArcGISDetailsSidebar';
import DendraDetailsSidebar from './components/DendraDetailsSidebar';
import INaturalistDetailsSidebar from './components/INaturalistDetailsSidebar';
import { INaturalistUnifiedObservation } from './components/INaturalistSidebar';
import { FilterState, DendraStation, DendraDatastream, DendraDatastreamWithStation, DendraDatapoint } from './types';
import { LiDARViewMode } from './components/dataviews/LiDARView';
import { iNaturalistObservation } from './services/iNaturalistService';
import { TNCArcGISObservation } from './services/tncINaturalistService';
import { EBirdObservation, eBirdService } from './services/eBirdService';
import { CalFloraPlant } from './services/calFloraService';
import { TNCArcGISItem, tncArcGISAPI } from './services/tncArcGISService';
import { formatDateRangeCompact, getDateRange, formatDateForAPI, formatDateToUS } from './utils/dateUtils';
import { tncINaturalistService } from './services/tncINaturalistService';
import { MapViewRef } from './components/MapView';
import { DEFAULT_THEME } from './utils/themes';
import { useLocalStorage } from './hooks/useLocalStorage';
import { 
  fetchDendraStations,
  fetchDendraDatastreams,
  fetchDatastreamsForStation,
  fetchDatapointsForDatastream,
} from './services/dendraService';

function App() {
  // Theme state with localStorage persistence
  const [theme, setTheme] = useLocalStorage('dashboard-theme', DEFAULT_THEME);

  const [filters, setFilters] = useState<FilterState>({
    category: '',
    source: '',
    spatialFilter: '',
    timeRange: '',
    daysBack: undefined,
    startDate: undefined,
    endDate: undefined,
    iconicTaxa: []
  });

  // Suppress ArcGIS console errors completely
  useEffect(() => {
    // Store original console methods
    const originalError = console.error;
    const originalWarn = console.warn;

    // Override console.error to filter out ArcGIS basemap errors
    console.error = (...args) => {
      const message = args.join(' ');
      // Suppress specific ArcGIS basemap errors
      if (message.includes('[esri.Basemap]') && 
          (message.includes('Failed to load basemap') || message.includes('AbortError'))) {
        return; // Don't log this error
      }
      originalError.apply(console, args);
    };

    // Override console.warn for similar warnings
    console.warn = (...args) => {
      const message = args.join(' ');
      if (message.includes('[esri.Basemap]') && message.includes('AbortError')) {
        return; // Don't log this warning
      }
      originalWarn.apply(console, args);
    };

    // Handle uncaught promise rejections
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      if (event.reason?.name === 'AbortError' && event.reason?.message === 'Aborted') {
        event.preventDefault();
        return;
      }
    };

    window.addEventListener('unhandledrejection', handleUnhandledRejection);
    
    return () => {
      // Restore original console methods on cleanup
      console.error = originalError;
      console.warn = originalWarn;
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, []);

  // Track the filters that were actually used for the last search
  // This determines what data is shown in the sidebar/map
  const [lastSearchedFilters, setLastSearchedFilters] = useState<FilterState>({
    category: '',
    source: '',
    spatialFilter: '',
    timeRange: '',
    daysBack: undefined,
    startDate: undefined,
    endDate: undefined,
    iconicTaxa: []
  });
  
  // Track whether a search has been performed
  const [hasSearched, setHasSearched] = useState(false);

  // const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [observations, setObservations] = useState<iNaturalistObservation[]>([]);
  const [tncObservations, setTncObservations] = useState<TNCArcGISObservation[]>([]);
  const [selectedTNCObservation, setSelectedTNCObservation] = useState<TNCArcGISObservation | null>(null);
  const [eBirdObservations, setEBirdObservations] = useState<EBirdObservation[]>([]);
  const [calFloraPlants, setCalFloraPlants] = useState<CalFloraPlant[]>([]);
  const [tncArcGISItems, setTncArcGISItems] = useState<TNCArcGISItem[]>([]);
  const [observationsLoading, setObservationsLoading] = useState(false);
  const [tncObservationsLoading, setTncObservationsLoading] = useState(false);
  const [eBirdObservationsLoading, setEBirdObservationsLoading] = useState(false);
  const [calFloraLoading, setCalFloraLoading] = useState(false);
  const [tncArcGISLoading, setTncArcGISLoading] = useState(false);
  const [lastSearchedDaysBack, setLastSearchedDaysBack] = useState<number>(30); // Track the last searched time range
  const [, setTncTotalCount] = useState<number>(0);
  const [tncPage] = useState<number>(1);
  const [tncPageSize] = useState<number>(250);
  const mapViewRef = useRef<MapViewRef>(null);
  const [isDrawMode, setIsDrawMode] = useState(false);

  // CalFlora modal state
  const [selectedCalFloraPlant, setSelectedCalFloraPlant] = useState<CalFloraPlant | null>(null);
  const [isCalFloraModalOpen, setIsCalFloraModalOpen] = useState(false);

  // TNC ArcGIS state
  const [activeLayerIds, setActiveLayerIds] = useState<string[]>([]);
  const [loadingLayerIds, setLoadingLayerIds] = useState<string[]>([]);
  const [reloadingLayerIds, setReloadingLayerIds] = useState<string[]>([]); // Track layers being reloaded
  const [layerOpacities, setLayerOpacities] = useState<Record<string, number>>({});
  const [selectedModalItem, setSelectedModalItem] = useState<TNCArcGISItem | null>(null);
  const [selectedDetailsItem, setSelectedDetailsItem] = useState<TNCArcGISItem | null>(null);
  const [selectedDownloadItem, setSelectedDownloadItem] = useState<TNCArcGISItem | null>(null);

  // LiDAR view mode state
  const [lidarViewMode, setLidarViewMode] = useState<LiDARViewMode>('virtual-tour');

  // Dendra Stations state
  const [dendraStations, setDendraStations] = useState<DendraStation[]>([]);
  const [dendraDatastreams, setDendraDatastreams] = useState<DendraDatastream[]>([]);
  const [dendraLoading, setDendraLoading] = useState(false);
  const [selectedDendraStation, setSelectedDendraStation] = useState<DendraStation | null>(null);
  const [selectedDendraDatastream, setSelectedDendraDatastream] = useState<DendraDatastream | null>(null);
  const [availableDendraDatastreams, setAvailableDendraDatastreams] = useState<DendraDatastream[]>([]);
  const [dendraDatapoints, setDendraDatapoints] = useState<DendraDatapoint[]>([]);
  const [isDendraLoadingDatapoints, setIsDendraLoadingDatapoints] = useState(false);
  const [isDendraLoadingHistorical, setIsDendraLoadingHistorical] = useState(false);
  const [showDendraWebsite, setShowDendraWebsite] = useState(false);
  const [isDendraWebsiteLoading, setIsDendraWebsiteLoading] = useState(false);
  const [dendraWebsiteUrl, setDendraWebsiteUrl] = useState<string>('https://dendra.science/orgs/tnc');
  
  // Ref to track the currently loading datastream (for race condition prevention)
  const currentLoadingDatastreamRef = useRef<number | null>(null);

  // iNaturalist observation selection state
  const [selectedINatObservation, setSelectedINatObservation] = useState<INaturalistUnifiedObservation | null>(null);

  // Compute date range text for iNaturalist sidebar
  const inatDateRangeText = useMemo(() => {
    if (filters.startDate && filters.endDate) {
      const start = new Date(filters.startDate);
      const end = new Date(filters.endDate);
      return `from ${start.toLocaleDateString()} - ${end.toLocaleDateString()}`;
    }
    return `from ${formatDateRangeCompact(lastSearchedDaysBack).toLowerCase()}`;
  }, [filters.startDate, filters.endDate, lastSearchedDaysBack]);

  // CalFlora modal handlers
  const openCalFloraModal = (plantId: string) => {
    const plant = calFloraPlants.find(p => p.id === plantId);
    if (plant) {
      setSelectedCalFloraPlant(plant);
      setIsCalFloraModalOpen(true);
    }
  };

  const closeCalFloraModal = () => {
    setIsCalFloraModalOpen(false);
    setSelectedCalFloraPlant(null);
  };

  // iNaturalist observation selection handlers
  const handleINatObservationClick = (obs: INaturalistUnifiedObservation) => {
    console.log('🖱️ App: Observation clicked in sidebar:', obs.id);
    setSelectedINatObservation(obs);
    // Trigger map highlight immediately
    if (mapViewRef.current) {
      console.log('🗺️ App: Calling highlightObservation');
      mapViewRef.current.highlightObservation(obs.id);
    } else {
      console.warn('⚠️ App: mapViewRef.current is not available');
    }
  };

  const handleINatDetailsClose = () => {
    setSelectedINatObservation(null);
    // Clear map highlight
    mapViewRef.current?.clearObservationHighlight();
  };

  // TNC ArcGIS handlers
  const handleLayerToggle = (itemId: string) => {
    setActiveLayerIds(prev => {
      if (prev.includes(itemId)) {
        // Removing layer - remove from loading state too
        setLoadingLayerIds(loadingPrev => loadingPrev.filter(id => id !== itemId));
        return prev.filter(id => id !== itemId);
      } else {
        // Adding layer - add to loading state
        setLoadingLayerIds(loadingPrev => [...loadingPrev, itemId]);
        return [...prev, itemId];
      }
    });
  };

  const handleLayerLoadComplete = (itemId: string) => {
    // Remove from loading state when layer finishes loading
    setLoadingLayerIds(prev => prev.filter(id => id !== itemId));
  };

  const handleLayerLoadError = (itemId: string) => {
    // Remove from both active and loading states on error
    setLoadingLayerIds(prev => prev.filter(id => id !== itemId));
    setActiveLayerIds(prev => prev.filter(id => id !== itemId));
  };

  const handleLegendDataFetched = (itemId: string, legendData: any) => {
    // Update the item with legend data
    setTncArcGISItems(prev => prev.map(item => 
      item.id === itemId ? { ...item, legendData } : item
    ));
  };

  const handleLayerOpacityChange = (itemId: string, opacity: number) => {
    setLayerOpacities(prev => ({
      ...prev,
      [itemId]: opacity
    }));
  };

  const handleLayerSelect = (itemId: string, layerId: number) => {
    // console.log(`Layer selected for item ${itemId}: layer ${layerId}`);
    
    // Update the item with the selected layer ID
    setTncArcGISItems(prev => {
      const updated = prev.map(item => 
        item.id === itemId ? { ...item, selectedLayerId: layerId } : item
      );
      
      // Also update selectedDetailsItem if this is the item being viewed
      if (selectedDetailsItem?.id === itemId) {
        const updatedItem = updated.find(item => item.id === itemId);
        if (updatedItem) {
          setSelectedDetailsItem(updatedItem);
        }
      }
      
      return updated;
    });
    
    // If the layer is currently active, we need to reload it with the new layer selection
    if (activeLayerIds.includes(itemId)) {
      // Mark as reloading to prevent button flicker
      setReloadingLayerIds(prev => [...prev, itemId]);
      
      // Toggle off and then back on to force reload with new layer
      setActiveLayerIds(prev => prev.filter(id => id !== itemId));
      // Small delay to ensure layer is removed before adding again
      setTimeout(() => {
        setLoadingLayerIds(prev => [...prev, itemId]);
        setActiveLayerIds(prev => [...prev, itemId]);
        // Remove from reloading state after reload starts
        setReloadingLayerIds(prev => prev.filter(id => id !== itemId));
      }, 100);
    }
  };

  const handleModalOpen = (item: TNCArcGISItem) => {
    setSelectedModalItem(item);
  };

  const handleModalClose = () => {
    setSelectedModalItem(null);
  };

  const handleDownloadViewOpen = () => {
    if (selectedDetailsItem) {
      setSelectedDownloadItem(selectedDetailsItem);
    }
  };

  const handleDownloadViewClose = () => {
    setSelectedDownloadItem(null);
  };

  const handleTNCArcGISItemSelect = async (item: TNCArcGISItem) => {
    // console.log('TNC ArcGIS item selected:', item);
    
    // Clear the orange search area rectangle when selecting a data item
    mapViewRef.current?.clearSearchArea();
    
    // Close download view if open
    setSelectedDownloadItem(null);
    
    // Open details sidebar for MAP_LAYER items, otherwise use existing modal behavior
    if (item.uiPattern === 'MAP_LAYER') {
      // IMMEDIATELY show the selected state and loading spinner
      setSelectedDetailsItem(item);
      
      // Auto-show on map when selected - this triggers the loading spinner immediately
      if (!activeLayerIds.includes(item.id)) {
        setLoadingLayerIds(prev => [...prev, item.id]);
        setActiveLayerIds(prev => [...prev, item.id]);
      }
      
      // THEN fetch service layers in background if not already fetched
      if (!item.availableLayers && 
          (item.url.includes('/FeatureServer') || 
           item.url.includes('/MapServer') || 
           item.url.includes('/ImageServer'))) {
        try {
    // console.log(`🔍 Fetching layers for: ${item.title}`);
          const availableLayers = await tncArcGISAPI.fetchServiceLayers(item.url);
          
          if (availableLayers.length > 0) {
    // console.log(`✅ Found ${availableLayers.length} layers for: ${item.title}`);
            const itemWithLayers = {
              ...item,
              availableLayers,
              selectedLayerId: availableLayers[0].id // Default to first layer
            };
            
            // Update the item in the list
            setTncArcGISItems(prev => prev.map(i => i.id === item.id ? itemWithLayers : i));
            
            // Update the selected details item with the fetched layers
            setSelectedDetailsItem(itemWithLayers);
          }
        } catch (err) {
          console.warn(`⚠️ Could not fetch layers for ${item.title}:`, err);
        }
      }
    } else if (item.uiPattern === 'MODAL') {
      handleModalOpen(item);
    }
  };

  const handleDetailsClose = () => {
    setSelectedDetailsItem(null);
  };

  const handleDetailsLayerToggle = () => {
    if (selectedDetailsItem) {
      handleLayerToggle(selectedDetailsItem.id);
    }
  };

  const handleDetailsOpacityChange = (opacity: number) => {
    if (selectedDetailsItem) {
      handleLayerOpacityChange(selectedDetailsItem.id, opacity);
    }
  };

  const handleDetailsLayerSelect = (layerId: number) => {
    if (selectedDetailsItem) {
      // Close download view when switching layers
      setSelectedDownloadItem(null);
      handleLayerSelect(selectedDetailsItem.id, layerId);
    }
  };

  const handleLiDARModeChange = (mode: LiDARViewMode) => {
    // console.log('LiDAR view mode changed to:', mode);
    setLidarViewMode(mode);
  };

  // Dendra Stations handlers
  const handleDendraStationSelect = async (station: DendraStation) => {
    // Close the Dendra iframe if it's showing a different station's dashboard
    setShowDendraWebsite(false);
    
    // Clear the orange search area rectangle when selecting a station
    mapViewRef.current?.clearSearchArea();
    
    // Clear previous state first
    setSelectedDendraDatastream(null);
    setDendraDatapoints([]);
    setIsDendraLoadingDatapoints(false);
    setIsDendraLoadingHistorical(false);
    
    // Set the new station
    setSelectedDendraStation(station);
    
    // Fetch datastreams for this station
    try {
      const datastreams = await fetchDatastreamsForStation(station.id);
      setAvailableDendraDatastreams(datastreams);
      
      // Auto-select the first datastream and load its data
      if (datastreams.length > 0) {
        const firstDatastream = datastreams[0];
        setSelectedDendraDatastream(firstDatastream);
        // Load datapoints immediately (no setTimeout needed)
        await loadDendraDatapoints(firstDatastream.id);
      }
    } catch (error) {
      console.error('Error fetching datastreams:', error);
      setAvailableDendraDatastreams([]);
    }
  };

  const handleDendraDatastreamSelect = async (datastream: DendraDatastreamWithStation) => {
    // Close the Dendra iframe when selecting a new datastream
    setShowDendraWebsite(false);
    
    // Clear the orange search area rectangle when selecting a datastream
    mapViewRef.current?.clearSearchArea();
    
    // Clear previous data
    setDendraDatapoints([]);
    setIsDendraLoadingDatapoints(false);
    setIsDendraLoadingHistorical(false);
    
    // Set the selected datastream
    setSelectedDendraDatastream(datastream);
    
    // Keep the station reference for map highlighting
    const station = dendraStations.find(s => s.id === datastream.station_id);
    setSelectedDendraStation(station || null);
    
    // Fetch all datastreams for this station to populate the dropdown
    try {
      const datastreams = await fetchDatastreamsForStation(datastream.station_id);
      setAvailableDendraDatastreams(datastreams);
    } catch (error) {
      console.error('Error fetching datastreams for station:', error);
      setAvailableDendraDatastreams([]);
    }

    // Load datapoints for this datastream
    await loadDendraDatapoints(datastream.id);
  };

  const handleDendraDatastreamChange = async (datastreamId: number) => {
    // Close the Dendra iframe when changing datastream via dropdown
    setShowDendraWebsite(false);
    
    const datastream = availableDendraDatastreams.find(ds => ds.id === datastreamId);
    if (datastream) {
      setSelectedDendraDatastream(datastream);
      setDendraDatapoints([]);
      await loadDendraDatapoints(datastreamId);
    }
  };

  const loadDendraDatapoints = async (datastreamId: number) => {
    // Set the ref to track this is the current loading operation
    currentLoadingDatastreamRef.current = datastreamId;
    
    setIsDendraLoadingDatapoints(true);
    setIsDendraLoadingHistorical(false);
    setDendraDatapoints([]);

    try {
      // PHASE 1: Load last 30 days FIRST for immediate display
      const recentPoints = await fetchDatapointsForDatastream(
        datastreamId,
        30, // Last 30 days only
        2000, // Batch size
        undefined, // No callback during initial load
        true // From most recent timestamp
      );
      
      // SAFETY CHECK: Only update if this is still the current loading operation
      if (currentLoadingDatastreamRef.current !== datastreamId) {
    // console.log(`⚠️ Datastream changed during Phase 1 load. Discarding results for DS ${datastreamId}`);
        return; // User switched to a different datastream, discard these results
      }
      
      // Show the initial data immediately and stop initial loading
      setDendraDatapoints([...recentPoints]);
      setIsDendraLoadingDatapoints(false); // Chart can render now!
      
      // If no data in Phase 1, don't bother with Phase 2
      if (recentPoints.length === 0) {
        setIsDendraLoadingHistorical(false);
        return;
      }
      
      // PHASE 2: Load all remaining data in background
      setIsDendraLoadingHistorical(true); // Show background loading indicator
      const allPoints = await fetchDatapointsForDatastream(
        datastreamId,
        undefined, // All available data
        2000, // Batch size
        undefined, // No progressive updates to avoid jitter
        false // Don't use most recent timestamp filter
      );
      
      // SAFETY CHECK: Only update if this is still the current loading operation
      if (currentLoadingDatastreamRef.current !== datastreamId) {
    // console.log(`⚠️ Datastream changed during Phase 2 load. Discarding results for DS ${datastreamId}`);
        return; // User switched to a different datastream, discard these results
      }
      
      // Combine with recent data and deduplicate
      const combinedPoints = [...recentPoints, ...allPoints];
      const uniquePoints = Array.from(
        new Map(combinedPoints.map(p => [p.id, p])).values()
      ).sort((a, b) => a.timestamp_utc - b.timestamp_utc);
      
      // Final update with all data
      setDendraDatapoints(uniquePoints);
      setIsDendraLoadingHistorical(false); // Hide background loading indicator
      
    } catch (error) {
      console.error('Error loading datapoints:', error);
      setIsDendraLoadingDatapoints(false);
      setIsDendraLoadingHistorical(false);
    }
  };

  // Set up global function for popup buttons to access
  useEffect(() => {
    (window as any).openCalFloraModal = openCalFloraModal;
    
    return () => {
      delete (window as any).openCalFloraModal;
    };
  }, [calFloraPlants]);

  const handleFilterChange = (newFilters: FilterState) => {
    // Clear the orange search area rectangle if spatial filter changes away from "Dangermond + Margin"
    if (filters.spatialFilter === 'Dangermond + Margin' && newFilters.spatialFilter !== 'Dangermond + Margin') {
      mapViewRef.current?.clearSearchArea();
    }
    
    setFilters(newFilters);
    
    // If user selects "Draw Area" spatial filter, activate draw mode
    if (newFilters.spatialFilter === 'Draw Area' && filters.spatialFilter !== 'Draw Area') {
      // Small delay to ensure dropdown closes first
      setTimeout(() => {
        mapViewRef.current?.activateDrawMode();
      }, 100);
    }
  };

  const handlePolygonDrawn = (polygon: __esri.Polygon) => {
    // Store polygon in filters for search
    const polygonData = {
      rings: polygon.rings,
      spatialReference: { wkid: polygon.spatialReference.wkid || 4326 }
    };
    setFilters(prev => ({ ...prev, customPolygon: polygonData }));
    // console.log('Polygon stored in filters:', polygonData);
  };

  const handlePolygonCleared = () => {
    setIsDrawMode(false);
    // Clear polygon from filters and reset to default spatial filter
    setFilters(prev => ({ 
      ...prev, 
      customPolygon: undefined,
      spatialFilter: 'Dangermond + Margin' 
    }));
  };

  const handleSearch = () => {
    // Clear all active TNC ArcGIS layers when searching
    setActiveLayerIds([]);
    
    // Clear all data from previous searches to prevent old map icons from showing
    setObservations([]);
    setTncObservations([]);
    setEBirdObservations([]);
    setCalFloraPlants([]);
    setDendraStations([]);
    setDendraDatastreams([]);
    setTncArcGISItems([]);
    
    // Clear any selected items
    setSelectedTNCObservation(null);
    setSelectedDetailsItem(null);
    setSelectedDownloadItem(null);
    setSelectedModalItem(null);
    setSelectedDendraStation(null);
    setSelectedDendraDatastream(null);
    
    // Clear all map layers (removes all observation icons from map)
    mapViewRef.current?.clearAllObservationLayers();
    
    // Mark that a search has been performed
    setHasSearched(true);
    
    // Update the last searched filters to match current filters
    // This will cause the DataView to update to show the appropriate sidebar
    setLastSearchedFilters({ ...filters });
    
    if (filters.source === 'Dendra Stations') {
      // Handle Dendra Stations search
      const searchDendra = async () => {
        setDendraLoading(true);
        try {
          const [stationsData, datastreamsData] = await Promise.all([
            fetchDendraStations(),
            fetchDendraDatastreams(),
          ]);
          
          // Sort alphabetically for now (metadata fields needed on backend for better sorting)
          const sortedStations = [...stationsData].sort((a, b) => a.name.localeCompare(b.name));
          const sortedDatastreams = [...datastreamsData].sort((a, b) => a.name.localeCompare(b.name));
          
          setDendraStations(sortedStations);
          setDendraDatastreams(sortedDatastreams);
    // console.log(`✅ Loaded ${stationsData.length} Dendra stations and ${datastreamsData.length} datastreams`);
        } catch (error) {
          console.error('❌ Error loading Dendra data:', error);
          setDendraStations([]);
          setDendraDatastreams([]);
        } finally {
          setDendraLoading(false);
        }
      };
      
      searchDendra();
    } else if (filters.source === 'TNC ArcGIS Hub') {
      // Handle TNC ArcGIS Hub search
      const searchTNCArcGIS = async () => {
        setTncArcGISLoading(true);
        try {
          const categoryFilter = filters.category !== 'Wildlife' && filters.category !== 'Vegetation' 
            ? [filters.category] 
            : undefined;
          
          // Calculate date range for filtering
          let startDate = filters.startDate;
          let endDate = filters.endDate;
          if (!startDate || !endDate) {
            const range = getDateRange(filters.daysBack || 30);
            startDate = formatDateForAPI(range.startDate);
            endDate = formatDateForAPI(range.endDate);
          }
          
          // Convert to timestamps for comparison
          const startTimestamp = new Date(startDate).getTime();
          const endTimestamp = new Date(endDate).getTime() + (24 * 60 * 60 * 1000 - 1); // End of day
          
          // console.log(`🔍 TNC ArcGIS Hub Search:`, {
          //   category: filters.category,
          //   categoryFilter,
          //   spatialFilter: filters.spatialFilter,
          //   timeRange: filters.timeRange,
          //   dateFilter: `${startDate} to ${endDate}`
          // });
          
          const response = await tncArcGISAPI.getAllItems({
            maxResults: 1000,
            categoryFilter,
            searchQuery: undefined // Could add search query from filters if needed
            // Note: Not including appAndMap collection for now
          });
          
          // Filter by date range (using modified timestamp)
          const dateFilteredResults = response.results.filter(item => {
            const itemModified = item.modified;
            return itemModified >= startTimestamp && itemModified <= endTimestamp;
          });
          
          // console.log(`📊 TNC ArcGIS Hub Results:`, {
          //   totalItems: response.results.length,
          //   afterDateFilter: dateFilteredResults.length,
          //   dataSource: response.dataSource,
          //   dateRange: `${startDate} to ${endDate}`,
          //   sampleTitles: dateFilteredResults.slice(0, 3).map(item => item.title)
          // });
          
          // Set items immediately without fetching service layers
          // This ensures fast search results display
          setTncArcGISItems(dateFilteredResults);
          
          // Start background prefetching of service layers (non-blocking)
          // This makes clicking "View" potentially instant if prefetch succeeds
    // console.log(`🚀 Starting background prefetch for ${dateFilteredResults.length} items...`);
          
          // Prefetch in background - don't await
          Promise.allSettled(
            dateFilteredResults.map(async (item) => {
              if (item.uiPattern === 'MAP_LAYER' && 
                  (item.url.includes('/FeatureServer') || 
                   item.url.includes('/MapServer') || 
                   item.url.includes('/ImageServer'))) {
                try {
                  // Use prefetch method with shorter timeout (4s)
                  const availableLayers = await tncArcGISAPI.prefetchServiceLayers(item.url);
                  
                  if (availableLayers.length > 0) {
    // console.log(`✨ Prefetched ${availableLayers.length} layers for: ${item.title}`);
                    // Update the item in state with prefetched layers
                    setTncArcGISItems(prev => prev.map(i => 
                      i.id === item.id 
                        ? { ...i, availableLayers, selectedLayerId: availableLayers[0].id }
                        : i
                    ));
                  }
                } catch (err) {
                  // Silently fail - user can still fetch on-demand
    // console.log(`⏭️ Prefetch skipped for ${item.title} - will fetch on-demand`);
                }
              }
            })
          ).then(() => {
    // console.log(`✅ Background prefetch complete`);
          });
        } catch (error) {
          console.error('❌ Error loading TNC ArcGIS data:', error);
          setTncArcGISItems([]);
        } finally {
          setTncArcGISLoading(false);
        }
      };
      
      searchTNCArcGIS();
    } else if (filters.source === 'CalFlora') {
      // Handle CalFlora search
      // Check for custom polygon
      let customPolygonGeometry: string | undefined = undefined;
      if (filters.customPolygon && filters.spatialFilter === 'Draw Area') {
        customPolygonGeometry = JSON.stringify({
          rings: filters.customPolygon.rings,
          spatialReference: filters.customPolygon.spatialReference
        });
    // console.log('🎯 Using custom drawn polygon for CalFlora spatial filtering');
      }
      
      const calFloraFilters = {
        maxResults: 1000,
        plantType: 'all' as 'invasive' | 'native' | 'all',
        customPolygon: customPolygonGeometry,
        showSearchArea: filters.spatialFilter === 'Dangermond + Margin'
      };
      
    // console.log('Searching CalFlora with filters:', calFloraFilters);
      mapViewRef.current?.reloadCalFloraData(calFloraFilters);
    } else if (filters.source === 'iNaturalist (TNC Layers)') {
      // Handle TNC iNaturalist search
      let taxonCategories: string[] = [];
      if (filters.category === 'Vegetation') {
        taxonCategories = ['Plantae']; // Only show plant observations for Vegetation category
      }
      // For Wildlife category, don't filter by taxon categories to show all animals
      
      // Compute start/end dates from filters (support daysBack or custom range)
      let startDate = filters.startDate;
      let endDate = filters.endDate;
      if (!startDate || !endDate) {
        const range = getDateRange(filters.daysBack || 30);
        startDate = formatDateForAPI(range.startDate);
        endDate = formatDateForAPI(range.endDate);
      }

      // Map spatial filter to search mode
      let searchMode: 'preserve-only' | 'expanded' | 'custom' = filters.spatialFilter === 'Dangermond Preserve' ? 'preserve-only' : 'expanded';
      const showSearchArea = filters.spatialFilter === 'Dangermond + Margin';
      
      // If custom polygon exists, use it
      let customPolygonGeometry: string | undefined = undefined;
      if (filters.customPolygon && filters.spatialFilter === 'Draw Area') {
        searchMode = 'custom';
        // Convert polygon to ArcGIS geometry format (JSON string)
        customPolygonGeometry = JSON.stringify({
          rings: filters.customPolygon.rings,
          spatialReference: filters.customPolygon.spatialReference
        });
    // console.log('🎯 Using custom drawn polygon for spatial filtering');
      }

      const tncSearchFilters = {
        startDate,
        endDate,
        taxonCategories,
        maxResults: 10000, // Allow up to 10,000 total results with pagination
        useFilters: true,
        page: tncPage,
        pageSize: tncPageSize, // Keep page size at 250 for reasonable loading
        searchMode,
        showSearchArea,
        customPolygon: customPolygonGeometry,
        onProgress: (/* current: number, total: number, percentage: number */) => {
          // console.log(`📊 TNC Progress: ${current}/${total} observations (${percentage}%)`);
          // Could add UI progress indicator here in the future
        }
      };
      
      // Update the last searched time range when search is performed
      setLastSearchedDaysBack(filters.daysBack || 30);
      
    // console.log('Searching TNC iNaturalist with filters:', tncSearchFilters);
      // Fetch count in parallel to show total records
      tncINaturalistService
        .queryObservationsCount({
          startDate,
          endDate,
          taxonCategories,
          useFilters: true,
          searchMode,
          customPolygon: customPolygonGeometry
        })
        .then(setTncTotalCount)
        .catch((e) => {
          console.warn('Failed to fetch TNC total count:', e);
          setTncTotalCount(0);
        });

      mapViewRef.current?.reloadTNCObservations(tncSearchFilters);
    } else if (filters.source === 'eBird') {
      // Handle eBird search
      // Compute start/end dates from filters (support daysBack or custom range)
      let startDate = filters.startDate;
      let endDate = filters.endDate;
      if (!startDate || !endDate) {
        const range = getDateRange(filters.daysBack || 30);
        startDate = formatDateForAPI(range.startDate);
        endDate = formatDateForAPI(range.endDate);
      }

      // Map spatial filter to search mode
      let searchMode: 'preserve-only' | 'expanded' | 'custom' = filters.spatialFilter === 'Dangermond Preserve' ? 'preserve-only' : 'expanded';
      
      // If custom polygon exists, use it
      let customPolygonGeometry: string | undefined = undefined;
      if (filters.customPolygon && filters.spatialFilter === 'Draw Area') {
        searchMode = 'custom';
        // Convert polygon to ArcGIS geometry format (JSON string)
        customPolygonGeometry = JSON.stringify({
          rings: filters.customPolygon.rings,
          spatialReference: filters.customPolygon.spatialReference
        });
    // console.log('🎯 Using custom drawn polygon for spatial filtering');
      }

      const eBirdSearchFilters = {
        startDate,
        endDate,
        maxResults: 2000,
        page: 1,
        pageSize: 500,
        searchMode,
        customPolygon: customPolygonGeometry,
        showSearchArea: filters.spatialFilter === 'Dangermond + Margin'
      };
      
      // Update the last searched time range when search is performed
      setLastSearchedDaysBack(filters.daysBack || 30);
      
    // console.log('Searching eBird with filters:', eBirdSearchFilters);
      
      // Fetch count in parallel to show total records
      eBirdService
        .queryObservationsCount({
          startDate,
          endDate,
          searchMode,
          customPolygon: customPolygonGeometry
        })
        .then((/* count */) => {
          // console.log(`eBird: Found ${count} total observations`);
        })
        .catch((e) => {
          console.warn('Failed to fetch eBird total count:', e);
        });

      mapViewRef.current?.reloadEBirdObservations(eBirdSearchFilters);
    } else {
      // Handle iNaturalist Public API search
      // Filter by iconic taxa based on category
      let iconicTaxa: string[] = [];
      if (filters.category === 'Vegetation') {
        iconicTaxa = ['Plantae']; // Only show Flora observations for Vegetation category
      }
      // For Wildlife category, don't filter by iconic taxa to show all animals
      
      // Check for custom polygon (client-side filtering for iNaturalist Public API)
      let customPolygonGeometry: string | undefined = undefined;
      if (filters.customPolygon && filters.spatialFilter === 'Draw Area') {
        customPolygonGeometry = JSON.stringify({
          rings: filters.customPolygon.rings,
          spatialReference: filters.customPolygon.spatialReference
        });
    // console.log('🎯 Will apply client-side polygon filtering for iNaturalist Public API');
      }
      
      const searchFilters = {
        daysBack: filters.startDate && filters.endDate ? undefined : (filters.daysBack || 30),
        startDate: filters.startDate,
        endDate: filters.endDate,
        qualityGrade: undefined as 'research' | 'needs_id' | 'casual' | undefined,
        iconicTaxa,
        customPolygon: customPolygonGeometry,
        showSearchArea: filters.spatialFilter === 'Dangermond + Margin'
      };
      
      // Update the last searched time range when search is performed
      setLastSearchedDaysBack(filters.daysBack || 30);
      
    // console.log('Searching iNaturalist Public API with filters:', searchFilters);
      mapViewRef.current?.reloadObservations(searchFilters);
    }
  };

  const handleObservationFilterChange = (observationFilters: Partial<FilterState>) => {
    // Merge the new filter changes into the existing filter state
    const newFilters = { ...filters, ...observationFilters };

    // Handle special logic for time range display
    if (newFilters.daysBack) {
      // If a preset day range is selected, clear custom dates and update timeRange string
      newFilters.startDate = undefined;
      newFilters.endDate = undefined;
      newFilters.timeRange = formatDateRangeCompact(newFilters.daysBack);
    } else if (newFilters.startDate && newFilters.endDate) {
      // If a custom date range is complete, update the timeRange string
      const startDate = new Date(newFilters.startDate);
      const endDate = new Date(newFilters.endDate);
      newFilters.timeRange = `${formatDateToUS(startDate)} - ${formatDateToUS(endDate)}`;
    }
    // Note: if only one custom date is set, we don't update the timeRange string yet.

    setFilters(newFilters);
    
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

  // TNC export functions
  const convertTNCToCSV = (observations: TNCArcGISObservation[]): string => {
    const headers = [
      'Observation ID', 'UUID', 'Common Name', 'Scientific Name', 'Taxon Category', 'Taxon ID',
      'Observed On', 'Observer', 'User Login', 'Latitude', 'Longitude', 
      'Kingdom', 'Phylum', 'Class', 'Order', 'Family', 'Genus', 'Species'
    ];
    
    const rows = observations.map(obs => [
      obs.observation_id,
      obs.observation_uuid,
      obs.common_name || '',
      obs.scientific_name,
      obs.taxon_category_name,
      obs.taxon_id,
      obs.observed_on,
      obs.user_name,
      obs.user_login,
      obs.geometry?.coordinates?.[1] || '',
      obs.geometry?.coordinates?.[0] || '',
      obs.taxon_kingdom_name || '',
      obs.taxon_phylum_name || '',
      obs.taxon_class_name || '',
      obs.taxon_order_name || '',
      obs.taxon_family_name || '',
      obs.taxon_genus_name || '',
      obs.taxon_species_name || ''
    ]);

    return [headers, ...rows].map(row => 
      row.map(field => `"${String(field).replace(/"/g, '""')}"`).join(',')
    ).join('\n');
  };

  const convertTNCToGeoJSON = (observations: TNCArcGISObservation[]): string => {
    const features = observations
      .filter(obs => obs.geometry?.coordinates)
      .map(obs => ({
        type: 'Feature',
        geometry: obs.geometry,
        properties: {
          observation_id: obs.observation_id,
          observation_uuid: obs.observation_uuid,
          commonName: obs.common_name,
          scientificName: obs.scientific_name,
          taxonCategory: obs.taxon_category_name,
          taxonId: obs.taxon_id,
          observedOn: obs.observed_on,
          observer: obs.user_name,
          userLogin: obs.user_login,
          kingdom: obs.taxon_kingdom_name,
          phylum: obs.taxon_phylum_name,
          class: obs.taxon_class_name,
          order: obs.taxon_order_name,
          family: obs.taxon_family_name,
          genus: obs.taxon_genus_name,
          species: obs.taxon_species_name
        }
      }));

    return JSON.stringify({
      type: 'FeatureCollection',
      features
    }, null, 2);
  };

  // TNC ArcGIS export functions
  const convertTNCArcGISToCSV = (items: TNCArcGISItem[]): string => {
    const headers = [
      'ID', 'Title', 'Type', 'Description', 'Snippet', 'URL', 'Owner',
      'Collection', 'Views', 'Size', 'Created', 'Modified', 'UI Pattern',
      'Main Categories', 'Tags', 'Categories'
    ];
    
    const rows = items.map(item => [
      item.id,
      item.title,
      item.type,
      item.description,
      item.snippet,
      item.url,
      item.owner,
      item.collection,
      item.num_views,
      item.size,
      new Date(item.created).toISOString(),
      new Date(item.modified).toISOString(),
      item.uiPattern,
      item.mainCategories.join('; '),
      item.tags.join('; '),
      item.categories.join('; ')
    ]);

    return [headers, ...rows].map(row => 
      row.map(field => `"${String(field).replace(/"/g, '""')}"`).join(',')
    ).join('\n');
  };

  const convertTNCArcGISToGeoJSON = (items: TNCArcGISItem[]): string => {
    // For TNC ArcGIS items, we don't have direct geometry, but we can create a point
    // at the Dangermond Preserve center for visualization purposes
    const dangermondCenter = [-120.0707, 34.4669]; // [lng, lat]
    
    const features = items.map(item => ({
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: dangermondCenter
      },
      properties: {
        id: item.id,
        title: item.title,
        type: item.type,
        description: item.description,
        snippet: item.snippet,
        url: item.url,
        owner: item.owner,
        collection: item.collection,
        views: item.num_views,
        size: item.size,
        created: new Date(item.created).toISOString(),
        modified: new Date(item.modified).toISOString(),
        uiPattern: item.uiPattern,
        mainCategories: item.mainCategories,
        tags: item.tags,
        categories: item.categories
      }
    }));

    return JSON.stringify({
      type: 'FeatureCollection',
      features
    }, null, 2);
  };

  const handleTNCExportCSV = () => {
    const csvData = convertTNCToCSV(tncObservations);
    downloadFile(csvData, 'tnc-inaturalist-observations.csv', 'text/csv');
  };

  const handleTNCExportGeoJSON = () => {
    const geoJsonData = convertTNCToGeoJSON(tncObservations);
    downloadFile(geoJsonData, 'tnc-inaturalist-observations.geojson', 'application/geo+json');
  };

  const handleTNCArcGISExportCSV = () => {
    const csvData = convertTNCArcGISToCSV(tncArcGISItems);
    downloadFile(csvData, 'tnc-arcgis-items.csv', 'text/csv');
  };

  const handleTNCArcGISExportGeoJSON = () => {
    const geoJsonData = convertTNCArcGISToGeoJSON(tncArcGISItems);
    downloadFile(geoJsonData, 'tnc-arcgis-items.geojson', 'application/geo+json');
  };

  // Dendra export functions
  const convertDendraToCSV = (datapoints: DendraDatapoint[], datastream: DendraDatastream | null, station: DendraStation | null): string => {
    if (datapoints.length === 0) return '';
    
    // CSV headers
    const headers = ['Timestamp', 'Value', 'Variable', 'Unit', 'Medium'];
    if (station) {
      headers.push('Station Name', 'Station ID', 'Latitude', 'Longitude');
    }
    if (datastream) {
      headers.push('Datastream Name', 'Datastream ID');
    }
    
    // CSV rows
    const rows = datapoints.map(dp => {
      const row = [
        new Date(dp.timestamp_utc).toISOString(),
        dp.value != null ? dp.value.toString() : '',
        datastream?.variable || '',
        datastream?.unit || '',
        datastream?.medium || ''
      ];
      
      if (station) {
        row.push(
          station.name,
          station.id.toString(),
          station.latitude.toFixed(6),
          station.longitude.toFixed(6)
        );
      }
      
      if (datastream) {
        row.push(
          datastream.name,
          datastream.id.toString()
        );
      }
      
      return row.map(field => `"${field}"`).join(',');
    });
    
    return [headers.join(','), ...rows].join('\n');
  };

  const handleDendraExportCSV = () => {
    const csvData = convertDendraToCSV(dendraDatapoints, selectedDendraDatastream, selectedDendraStation);
    const filename = selectedDendraDatastream 
      ? `dendra-${selectedDendraDatastream.variable}-data.csv`
      : 'dendra-data.csv';
    downloadFile(csvData, filename, 'text/csv');
  };

  const handleDendraExportExcel = () => {
    const csvData = convertDendraToCSV(dendraDatapoints, selectedDendraDatastream, selectedDendraStation);
    const filename = selectedDendraDatastream 
      ? `dendra-${selectedDendraDatastream.variable}-data.xlsx`
      : 'dendra-data.xlsx';
    // Excel can open CSV files, so we use CSV format with .xlsx extension
    // For true Excel format, we would need the 'xlsx' library
    downloadFile(csvData, filename, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  };

  // Helper function to download files
  const downloadFile = (data: string, filename: string, mimeType: string) => {
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

  // Filter datasets based on current filters (currently unused but may be needed later)
  // const filteredDatasets = mockDatasets.filter(dataset => {
  //   if (filters.category !== 'Wildlife' && dataset.category !== filters.category) {
  //     return false;
  //   }
  //   // Add more filtering logic here as needed
  //   return true;
  // });

  return (
    <div id="app" className="h-screen bg-gray-50 flex flex-col">
      <Header theme={theme} onThemeChange={setTheme} />
      <FilterSubheader 
        filters={filters}
        onFilterChange={handleFilterChange}
        onSearch={handleSearch}
        theme={theme}
        resultCount={
          lastSearchedFilters.source === 'TNC ArcGIS Hub' ? tncArcGISItems.length :
          lastSearchedFilters.source === 'CalFlora' ? calFloraPlants.length :
          lastSearchedFilters.source === 'iNaturalist (TNC Layers)' ? tncObservations.length :
          lastSearchedFilters.source === 'eBird' ? eBirdObservations.length :
          lastSearchedFilters.source === 'Dendra Stations' ? dendraStations.length :
          observations.length
        }
        isSearching={
          filters.source === 'TNC ArcGIS Hub' ? tncArcGISLoading :
          filters.source === 'CalFlora' ? calFloraLoading :
          filters.source === 'iNaturalist (TNC Layers)' ? tncObservationsLoading :
          filters.source === 'eBird' ? eBirdObservationsLoading :
          filters.source === 'Dendra Stations' ? dendraLoading :
          observationsLoading
        }
      />
      <div id="main-content" className="flex-1 flex min-h-0">
        <DataView
          filters={lastSearchedFilters}
          observations={observations}
          observationsLoading={observationsLoading}
          onObservationExportCSV={handleExportCSV}
          onObservationExportGeoJSON={handleExportGeoJSON}
          tncObservations={tncObservations}
          tncObservationsLoading={tncObservationsLoading}
          onTNCObservationExportCSV={handleTNCExportCSV}
          onTNCObservationExportGeoJSON={handleTNCExportGeoJSON}
          selectedTNCObservation={selectedTNCObservation}
          onTNCObservationSelect={setSelectedTNCObservation}
          eBirdObservations={eBirdObservations}
          eBirdObservationsLoading={eBirdObservationsLoading}
          calFloraPlants={calFloraPlants}
          calFloraLoading={calFloraLoading}
          onCalFloraExportCSV={handleCalFloraExportCSV}
          onCalFloraExportGeoJSON={handleCalFloraExportGeoJSON}
          onCalFloraPlantSelect={(plant) => {
            setSelectedCalFloraPlant(plant);
            setIsCalFloraModalOpen(true);
          }}
          tncArcGISItems={tncArcGISItems}
          tncArcGISLoading={tncArcGISLoading}
          onTNCArcGISExportCSV={handleTNCArcGISExportCSV}
          onTNCArcGISExportGeoJSON={handleTNCArcGISExportGeoJSON}
          onTNCArcGISItemSelect={handleTNCArcGISItemSelect}
          activeLayerIds={activeLayerIds}
          loadingLayerIds={loadingLayerIds}
          selectedDetailsItemId={selectedDetailsItem?.id}
          onLayerToggle={handleLayerToggle}
          selectedModalItem={selectedModalItem}
          onModalOpen={handleModalOpen}
          onModalClose={handleModalClose}
          onLiDARModeChange={handleLiDARModeChange}
          lastSearchedDaysBack={lastSearchedDaysBack}
          startDate={filters.startDate}
          endDate={filters.endDate}
          hasSearched={hasSearched}
          dendraStations={dendraStations}
          dendraDatastreams={dendraDatastreams}
          dendraLoading={dendraLoading}
          selectedDendraStationId={selectedDendraStation?.id}
          selectedDendraDatastreamId={selectedDendraDatastream?.id}
          onDendraStationSelect={handleDendraStationSelect}
          onDendraDatastreamSelect={handleDendraDatastreamSelect}
          onShowDendraWebsite={() => {
            setDendraWebsiteUrl('https://dendra.science/orgs/tnc');
            setShowDendraWebsite(true);
            setIsDendraWebsiteLoading(true);
          }}
          selectedINatObservation={selectedINatObservation}
          onINatObservationClick={handleINatObservationClick}
          onINatDetailsClose={handleINatDetailsClose}
          qualityGrade={filters.qualityGrade}
          onQualityGradeChange={(grade) => setFilters(prev => ({ ...prev, qualityGrade: grade }))}
        />
        <div id="map-container" className="flex-1 relative flex">
          {/* Conditionally render based on data source and LiDAR mode */}
          {lastSearchedFilters.source === 'LiDAR' && hasSearched ? (
            <>
              {/* LiDAR Virtual Tour Mode */}
              {lidarViewMode === 'virtual-tour' && (
                <div id="lidar-3d-viewer-container" className="flex-1 relative">
                  <iframe
                    id="lidar-3d-viewer-iframe"
                    src="https://geoxc-apps.bd.esri.com/DangermondPreserve/VirtualTour/index.html"
                    title="Jack & Laura Dangermond Preserve - 3D LiDAR Virtual Tour"
                    className="w-full h-full border-0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
              )}
              
              {/* LiDAR Interactive 3D Mode */}
              {lidarViewMode === 'interactive-3d' && (
                <Scene3DView 
                  onViewReady={(view) => console.log('Scene3DView ready', view)}
                />
              )}
            </>
          ) : (
            <>
              {/* Regular 2D MapView for all other data sources */}
              <MapView 
                ref={mapViewRef}
                onObservationsUpdate={setObservations}
                onLoadingChange={setObservationsLoading}
                tncObservations={lastSearchedFilters.source === 'iNaturalist (TNC Layers)' ? tncObservations : []}
                onTNCObservationsUpdate={setTncObservations}
                onTNCLoadingChange={setTncObservationsLoading}
                selectedTNCObservation={selectedTNCObservation}
                onTNCObservationSelect={setSelectedTNCObservation}
                eBirdObservations={lastSearchedFilters.source === 'eBird' ? eBirdObservations : []}
                onEBirdObservationsUpdate={setEBirdObservations}
                onEBirdLoadingChange={setEBirdObservationsLoading}
                calFloraPlants={filters.source === 'CalFlora' ? calFloraPlants : []}
                onCalFloraUpdate={setCalFloraPlants}
                onCalFloraLoadingChange={setCalFloraLoading}
                tncArcGISItems={tncArcGISItems}
                activeLayerIds={activeLayerIds}
                loadingLayerIds={loadingLayerIds}
                layerOpacities={layerOpacities}
                onLayerLoadComplete={handleLayerLoadComplete}
                onLayerLoadError={handleLayerLoadError}
                onLayerOpacityChange={handleLayerOpacityChange}
                onLegendDataFetched={handleLegendDataFetched}
                dendraStations={lastSearchedFilters.source === 'Dendra Stations' ? dendraStations : []}
                selectedDendraStationId={selectedDendraStation?.id}
                onDendraStationClick={handleDendraStationSelect}
                isDrawMode={isDrawMode}
                onDrawModeChange={setIsDrawMode}
                onPolygonDrawn={handlePolygonDrawn}
                onPolygonCleared={handlePolygonCleared}
              />
              {/* Hub Page Preview Overlay */}
              {selectedModalItem && (
                <HubPagePreview item={selectedModalItem} onClose={handleModalClose} />
              )}
              
              {/* Dataset Download View Overlay */}
              {selectedDownloadItem && (
                <DatasetDownloadView item={selectedDownloadItem} onClose={handleDownloadViewClose} />
              )}
              
              {/* Dendra.science Website Iframe Overlay */}
              {showDendraWebsite && (
                <div className="absolute inset-0 z-40 bg-white flex flex-col">
                  {/* Header */}
                  <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gray-50">
                    <div className="flex items-center gap-3">
                      <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                      </svg>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">Dendra.science</h3>
                        <p className="text-xs text-gray-500">
                          {selectedDendraStation 
                            ? `${selectedDendraStation.name} ${dendraWebsiteUrl.includes('/status/') ? '- Dashboard' : '- Details'}`
                            : 'The Nature Conservancy Stations'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <a
                        href={dendraWebsiteUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded transition-colors"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                        Open in New Tab
                      </a>
                      <button
                        id="dendra-iframe-close-button"
                        onClick={() => {
                          setShowDendraWebsite(false);
                          setIsDendraWebsiteLoading(false);
                        }}
                        className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded transition-colors"
                        title="Close"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  </div>
                  
                  {/* Iframe Container with Loading Spinner */}
                  <div className="flex-1 overflow-hidden relative">
                    {/* Loading Spinner Overlay */}
                    {isDendraWebsiteLoading && (
                      <div className="absolute inset-0 flex items-center justify-center bg-gray-50 z-10">
                        <div className="flex flex-col items-center gap-4">
                          <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
                          <p className="text-sm text-gray-600 font-medium">Loading Dendra.science...</p>
                        </div>
                      </div>
                    )}
                    {/* Iframe */}
                    <iframe
                      src={dendraWebsiteUrl}
                      className="w-full h-full border-0"
                      title="Dendra.science - The Nature Conservancy"
                      allow="fullscreen"
                      onLoad={() => setIsDendraWebsiteLoading(false)}
                    />
                  </div>
                </div>
              )}
            </>
          )}
        </div>
        {/* Conditionally show appropriate right sidebar */}
        {selectedDetailsItem && lastSearchedFilters.source === 'TNC ArcGIS Hub' ? (
          <TNCArcGISDetailsSidebar
            item={selectedDetailsItem}
            isActive={activeLayerIds.includes(selectedDetailsItem.id)}
            isReloading={reloadingLayerIds.includes(selectedDetailsItem.id)}
            opacity={layerOpacities[selectedDetailsItem.id] ?? 80}
            onToggleLayer={handleDetailsLayerToggle}
            onOpacityChange={handleDetailsOpacityChange}
            onLayerSelect={handleDetailsLayerSelect}
            onClose={handleDetailsClose}
            onDownloadDataset={handleDownloadViewOpen}
          />
        ) : lastSearchedFilters.source === 'Dendra Stations' ? (
          <DendraDetailsSidebar
            station={selectedDendraStation}
            selectedDatastream={selectedDendraDatastream}
            availableDatastreams={availableDendraDatastreams}
            datapoints={dendraDatapoints}
            isLoadingDatapoints={isDendraLoadingDatapoints}
            isLoadingHistorical={isDendraLoadingHistorical}
            onDatastreamChange={handleDendraDatastreamChange}
            hasSearched={hasSearched}
            isLoading={dendraLoading}
            onShowStationDashboard={() => {
              if (selectedDendraStation) {
                // Use the slug field for the status/dashboard page
                setDendraWebsiteUrl(`https://dendra.science/orgs/tnc/status/${selectedDendraStation.slug}`);
                setShowDendraWebsite(true);
                setIsDendraWebsiteLoading(true);
              }
            }}
            onShowStationDetails={() => {
              if (selectedDendraStation) {
                // Use the dendra_st_id for the station details page
                setDendraWebsiteUrl(`https://dendra.science/orgs/tnc/stations/${selectedDendraStation.dendra_st_id}`);
                setShowDendraWebsite(true);
                setIsDendraWebsiteLoading(true);
              }
            }}
            onExportCSV={handleDendraExportCSV}
            onExportExcel={handleDendraExportExcel}
          />
        ) : (lastSearchedFilters.source === 'iNaturalist (Public API)' || 
            lastSearchedFilters.source === 'iNaturalist (TNC Layers)') ? (
          <INaturalistDetailsSidebar
            dataSourceLabel={lastSearchedFilters.source}
            selectedObservation={selectedINatObservation}
            observations={lastSearchedFilters.source === 'iNaturalist (TNC Layers)' 
              ? tncObservations.map(obs => ({
                  id: obs.observation_id,
                  observedOn: obs.observed_on,
                  observerName: obs.user_name || 'Unknown',
                  commonName: obs.common_name || null,
                  scientificName: obs.scientific_name || 'Unknown',
                  photoUrl: tncINaturalistService.getPrimaryImageUrl(obs) || null,
                  photoAttribution: tncINaturalistService.getPhotoAttribution(obs) || null,
                  iconicTaxon: obs.taxon_category_name || 'Unknown',
                  qualityGrade: null,
                  location: null,
                  uri: `https://www.inaturalist.org/observations/${obs.observation_id}`,
                  taxonId: obs.taxon_id
                }))
              : observations.map(obs => ({
                  id: obs.id,
                  observedOn: obs.observed_on,
                  observerName: obs.user?.login || 'Unknown',
                  commonName: obs.taxon?.preferred_common_name || null,
                  scientificName: obs.taxon?.name || 'Unknown',
                  photoUrl: obs.photos && obs.photos.length > 0 
                    ? obs.photos[0].url.replace('square', 'medium') 
                    : null,
                  photoAttribution: obs.photos && obs.photos.length > 0 
                    ? obs.photos[0].attribution 
                    : null,
                  iconicTaxon: obs.taxon?.iconic_taxon_name || 'Unknown',
                  qualityGrade: obs.quality_grade || null,
                  location: obs.place_guess || null,
                  uri: obs.uri,
                  taxonId: obs.taxon?.id
                }))
            }
            dateRangeText={inatDateRangeText}
            qualityGrade={filters.qualityGrade}
            onQualityGradeChange={(grade) => setFilters(prev => ({ ...prev, qualityGrade: grade }))}
            onExportCSV={lastSearchedFilters.source === 'iNaturalist (TNC Layers)' ? handleTNCExportCSV : handleExportCSV}
            onExportGeoJSON={lastSearchedFilters.source === 'iNaturalist (TNC Layers)' ? handleTNCExportGeoJSON : handleExportGeoJSON}
            onAddToCart={() => {
              // TODO: Implement shopping cart functionality
              console.log('Add to cart clicked');
            }}
            onClose={handleINatDetailsClose}
            hasSearched={hasSearched}
          />
        ) : (
          <FilterSidebar 
            filters={filters}
            onFilterChange={handleObservationFilterChange}
            onDownload={handleDownload}
            hasSearched={hasSearched}
            hasResults={
              lastSearchedFilters.source === 'TNC ArcGIS Hub' ? tncArcGISItems.length > 0 :
              lastSearchedFilters.source === 'CalFlora' ? calFloraPlants.length > 0 :
              lastSearchedFilters.source === 'iNaturalist (TNC Layers)' ? tncObservations.length > 0 :
              lastSearchedFilters.source === 'eBird' ? eBirdObservations.length > 0 :
              lastSearchedFilters.source === 'Dendra Stations' ? dendraStations.length > 0 :
              observations.length > 0
            }
            dataSource={lastSearchedFilters.source}
          />
        )}
      </div>
      <Footer />
      
      {/* CalFlora Plant Modal */}
      <CalFloraPlantModal
        plant={selectedCalFloraPlant}
        isOpen={isCalFloraModalOpen}
        onClose={closeCalFloraModal}
      />
    </div>
  );
}

export default App;
