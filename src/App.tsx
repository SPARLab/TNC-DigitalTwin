import { useState, useRef, useEffect } from 'react';
import Header from './components/Header';
import FilterSubheader from './components/FilterSubheader';
import DataView from './components/DataView';
import FilterSidebar from './components/FilterSidebar';
import MapView from './components/MapView';
import Footer from './components/Footer';
import CalFloraPlantModal from './components/CalFloraPlantModal';
import HubPagePreview from './components/HubPagePreview';
import { FilterState } from './types';
import { iNaturalistObservation } from './services/iNaturalistService';
import { TNCArcGISObservation } from './services/tncINaturalistService';
import { EBirdObservation, eBirdService } from './services/eBirdService';
import { CalFloraPlant } from './services/calFloraService';
import { TNCArcGISItem, tncArcGISAPI } from './services/tncArcGISService';
import { formatDateRangeCompact, getDateRange, formatDateForAPI, formatDateToUS } from './utils/dateUtils';
import { tncINaturalistService } from './services/tncINaturalistService';
import { MapViewRef } from './components/MapView';

function App() {
  const [filters, setFilters] = useState<FilterState>({
    category: 'Wildlife',
    source: 'iNaturalist (Public API)',
    spatialFilter: 'Dangermond + Margin',
    timeRange: formatDateRangeCompact(30),
    daysBack: 30,
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
    category: 'Wildlife',
    source: 'iNaturalist (Public API)',
    spatialFilter: 'Dangermond + Margin',
    timeRange: formatDateRangeCompact(30),
    daysBack: 30,
    startDate: undefined,
    endDate: undefined,
    iconicTaxa: []
  });

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
  const [selectedModalItem, setSelectedModalItem] = useState<TNCArcGISItem | null>(null);

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

  const handleLayerOpacityChange = (itemId: string, opacity: number) => {
    // This would be handled by the map component
    console.log(`Layer ${itemId} opacity changed to ${opacity}%`);
  };

  const handleModalOpen = (item: TNCArcGISItem) => {
    setSelectedModalItem(item);
  };

  const handleModalClose = () => {
    setSelectedModalItem(null);
  };

  const handleTNCArcGISItemSelect = (item: TNCArcGISItem) => {
    console.log('TNC ArcGIS item selected:', item);
  };

  // Set up global function for popup buttons to access
  useEffect(() => {
    (window as any).openCalFloraModal = openCalFloraModal;
    
    return () => {
      delete (window as any).openCalFloraModal;
    };
  }, [calFloraPlants]);

  const handleFilterChange = (newFilters: FilterState) => {
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
    console.log('Polygon stored in filters:', polygonData);
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
    
    // Update the last searched filters to match current filters
    // This will cause the DataView to update to show the appropriate sidebar
    setLastSearchedFilters({ ...filters });
    
    if (filters.source === 'TNC ArcGIS Hub') {
      // Handle TNC ArcGIS Hub search
      const searchTNCArcGIS = async () => {
        setTncArcGISLoading(true);
        try {
          const categoryFilter = filters.category !== 'Wildlife' && filters.category !== 'Vegetation' 
            ? [filters.category] 
            : undefined;
          
          console.log(`🔍 TNC ArcGIS Hub Search:`, {
            category: filters.category,
            categoryFilter,
            spatialFilter: filters.spatialFilter,
            timeRange: filters.timeRange
          });
          
          const response = await tncArcGISAPI.getAllItems({
            maxResults: 1000,
            categoryFilter,
            searchQuery: undefined // Could add search query from filters if needed
            // Note: Not including appAndMap collection for now
          });
          
          console.log(`📊 TNC ArcGIS Hub Results:`, {
            totalItems: response.results.length,
            dataSource: response.dataSource,
            sampleTitles: response.results.slice(0, 3).map(item => item.title)
          });
          
          setTncArcGISItems(response.results);
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
        console.log('🎯 Using custom drawn polygon for CalFlora spatial filtering');
      }
      
      const calFloraFilters = {
        maxResults: 1000,
        plantType: 'all' as 'invasive' | 'native' | 'all',
        customPolygon: customPolygonGeometry
      };
      
      console.log('Searching CalFlora with filters:', calFloraFilters);
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
        console.log('🎯 Using custom drawn polygon for spatial filtering');
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
        onProgress: (current: number, total: number, percentage: number) => {
          console.log(`📊 TNC Progress: ${current}/${total} observations (${percentage}%)`);
          // Could add UI progress indicator here in the future
        }
      };
      
      // Update the last searched time range when search is performed
      setLastSearchedDaysBack(filters.daysBack || 30);
      
      console.log('Searching TNC iNaturalist with filters:', tncSearchFilters);
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
        console.log('🎯 Using custom drawn polygon for spatial filtering');
      }

      const eBirdSearchFilters = {
        startDate,
        endDate,
        maxResults: 2000,
        page: 1,
        pageSize: 500,
        searchMode,
        customPolygon: customPolygonGeometry
      };
      
      // Update the last searched time range when search is performed
      setLastSearchedDaysBack(filters.daysBack || 30);
      
      console.log('Searching eBird with filters:', eBirdSearchFilters);
      
      // Fetch count in parallel to show total records
      eBirdService
        .queryObservationsCount({
          startDate,
          endDate,
          searchMode,
          customPolygon: customPolygonGeometry
        })
        .then((count) => {
          console.log(`eBird: Found ${count} total observations`);
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
        console.log('🎯 Will apply client-side polygon filtering for iNaturalist Public API');
      }
      
      const searchFilters = {
        daysBack: filters.startDate && filters.endDate ? undefined : (filters.daysBack || 30),
        startDate: filters.startDate,
        endDate: filters.endDate,
        qualityGrade: undefined as 'research' | 'needs_id' | 'casual' | undefined,
        iconicTaxa,
        customPolygon: customPolygonGeometry
      };
      
      // Update the last searched time range when search is performed
      setLastSearchedDaysBack(filters.daysBack || 30);
      
      console.log('Searching iNaturalist Public API with filters:', searchFilters);
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
      <Header />
      <FilterSubheader 
        filters={filters}
        onFilterChange={handleFilterChange}
        onSearch={handleSearch}
        resultCount={
          lastSearchedFilters.source === 'TNC ArcGIS Hub' ? tncArcGISItems.length :
          lastSearchedFilters.source === 'CalFlora' ? calFloraPlants.length :
          lastSearchedFilters.source === 'iNaturalist (TNC Layers)' ? tncObservations.length :
          lastSearchedFilters.source === 'eBird' ? eBirdObservations.length :
          observations.length
        }
        isSearching={
          filters.source === 'TNC ArcGIS Hub' ? tncArcGISLoading :
          filters.source === 'CalFlora' ? calFloraLoading :
          filters.source === 'iNaturalist (TNC Layers)' ? tncObservationsLoading :
          filters.source === 'eBird' ? eBirdObservationsLoading :
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
          onLayerToggle={handleLayerToggle}
          onLayerOpacityChange={handleLayerOpacityChange}
          selectedModalItem={selectedModalItem}
          onModalOpen={handleModalOpen}
          onModalClose={handleModalClose}
          lastSearchedDaysBack={lastSearchedDaysBack}
          startDate={filters.startDate}
          endDate={filters.endDate}
        />
        <div id="map-container" className="flex-1 relative flex">
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
            layerOpacities={{}}
            onLayerLoadComplete={handleLayerLoadComplete}
            onLayerLoadError={handleLayerLoadError}
            isDrawMode={isDrawMode}
            onDrawModeChange={setIsDrawMode}
            onPolygonDrawn={handlePolygonDrawn}
            onPolygonCleared={handlePolygonCleared}
          />
          {/* Hub Page Preview Overlay */}
          {selectedModalItem && (
            <HubPagePreview item={selectedModalItem} onClose={handleModalClose} />
          )}
        </div>
        <FilterSidebar 
          filters={filters}
          onFilterChange={handleObservationFilterChange}
          onDownload={handleDownload}
        />
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
