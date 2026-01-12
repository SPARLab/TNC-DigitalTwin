import React, { useState, useEffect, useMemo, useRef } from 'react';
import { MapPin, Calendar, ShoppingCart } from 'lucide-react';
import { EBirdObservation } from '../../services/eBirdService';
import { getBirdTaxonInfo, BirdTaxonInfo } from '../../services/birdPhotoService';
import LoadingSpinner from '../LoadingSpinner';
import DataTypeBackHeader from '../DataTypeBackHeader';

interface WildlifeEBirdViewProps {
  observations: EBirdObservation[];
  loading: boolean;
  currentDaysBack?: number;
  startDate?: string;
  endDate?: string;
  onExportCSV?: () => void;
  onExportGeoJSON?: () => void;
  onAddToCart?: () => void;
  hasSearched?: boolean;
  onBack?: () => void;
  onObservationSelect?: (observation: EBirdObservation) => void;
}

interface SpeciesGroup {
  scientific_name: string;
  common_name: string;
  observations: EBirdObservation[];
  total_count: number;
  photoUrl?: string | null;
  photoAttribution?: string | null;
}

const WildlifeEBirdView: React.FC<WildlifeEBirdViewProps> = ({
  observations,
  loading,
  currentDaysBack,
  startDate,
  endDate,
  onExportCSV,
  onExportGeoJSON,
  onAddToCart,
  hasSearched = false,
  onBack,
  onObservationSelect
}) => {
  const [viewMode, setViewMode] = useState<'recent' | 'all' | 'grouped'>('recent');
  const [taxonPhotos, setTaxonPhotos] = useState<Map<string, BirdTaxonInfo | null>>(new Map());
  const [photosLoading, setPhotosLoading] = useState(false);
  const fetchedSpeciesRef = useRef<Set<string>>(new Set());
  const fetchAbortRef = useRef<AbortController | null>(null);

  // Group observations by species
  const speciesGroups = useMemo((): SpeciesGroup[] => {
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
      .map(([scientificName, obs]) => {
        const taxonInfo = taxonPhotos.get(scientificName.toLowerCase());
        return {
          scientific_name: scientificName,
          common_name: obs[0].common_name,
          observations: obs,
          total_count: obs.reduce((sum, o) => sum + o.count_observed, 0),
          photoUrl: taxonInfo?.photoUrl || null,
          photoAttribution: taxonInfo?.photoAttribution || null
        };
      })
      .sort((a, b) => b.total_count - a.total_count);
  }, [observations, taxonPhotos]);

  // Get top 10 species for recent view
  const topSpecies = useMemo(() => speciesGroups.slice(0, 10), [speciesGroups]);

  // All observations sorted by date
  const sortedObservations = useMemo(() => {
    return [...observations].sort((a, b) => {
      const dateA = new Date(a.observation_date).getTime();
      const dateB = new Date(b.observation_date).getTime();
      return dateB - dateA;
    });
  }, [observations]);

  // Memoize unique species names to avoid unnecessary refetches
  const uniqueSpeciesNames = useMemo(() => 
    [...new Set(observations.map(o => o.scientific_name))],
    [observations]
  );

  // Fetch bird photos when new species appear
  useEffect(() => {
    if (uniqueSpeciesNames.length === 0) return;
    
    // Filter to only species we haven't fetched yet
    const namesToFetch = uniqueSpeciesNames.filter(
      name => !fetchedSpeciesRef.current.has(name.toLowerCase())
    );
    
    if (namesToFetch.length === 0) return;
    
    // Mark these as being fetched
    namesToFetch.forEach(name => fetchedSpeciesRef.current.add(name.toLowerCase()));
    
    // Cancel any in-progress fetch
    if (fetchAbortRef.current) {
      fetchAbortRef.current.abort();
    }
    fetchAbortRef.current = new AbortController();
    const { signal } = fetchAbortRef.current;
    
    setPhotosLoading(true);
    
    // Fetch photos in smaller batches with delay to avoid rate limiting
    const processBatches = async () => {
      const batchSize = 5;
      for (let i = 0; i < namesToFetch.length; i += batchSize) {
        if (signal.aborted) return;
        
        const batch = namesToFetch.slice(i, i + batchSize);
        
        // Fetch each bird individually with error handling
        const results = await Promise.all(
          batch.map(async (name) => {
            try {
              const info = await getBirdTaxonInfo(name);
              return { name: name.toLowerCase(), info };
            } catch (err) {
              console.warn(`Failed to fetch photo for ${name}:`, err);
              return { name: name.toLowerCase(), info: null };
            }
          })
        );
        
        if (signal.aborted) return;
        
        setTaxonPhotos(prev => {
          const newMap = new Map(prev);
          results.forEach(({ name, info }) => {
            if (info) newMap.set(name, info);
          });
          return newMap;
        });
        
        // Small delay between batches to avoid rate limiting
        if (i + batchSize < namesToFetch.length) {
          await new Promise(resolve => setTimeout(resolve, 50));
        }
      }
    };
    
    processBatches().finally(() => {
      if (!signal.aborted) {
        setPhotosLoading(false);
      }
    });
    
    return () => {
      fetchAbortRef.current?.abort();
    };
  }, [uniqueSpeciesNames]);

  // Show empty state if no search has been performed
  if (!hasSearched) {
    return (
      <div id="ebird-wildlife-view" className="w-64 md:w-80 lg:w-96 flex-shrink-0 bg-white border-r border-gray-200 flex flex-col">
        <div id="ebird-empty-state" className="flex flex-col items-center justify-center h-full p-8 text-center">
          <div id="search-prompt-icon" className="mb-4">
            <span className="text-6xl">🐦</span>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Start Your Search</h3>
          <p className="text-sm text-gray-600">
            Enter selection criteria and hit search to see bird observations
          </p>
        </div>
      </div>
    );
  }

  // Render species card
  const renderSpeciesCard = (group: SpeciesGroup, isCompact: boolean = false) => (
    <div
      key={group.scientific_name}
      id={`ebird-species-${group.scientific_name.replace(/\s+/g, '-').toLowerCase()}`}
      className="border border-gray-200 rounded-lg p-3 hover:bg-gray-50 transition-colors cursor-pointer"
      onClick={() => {
        // Select the first observation for this species
        console.log('[eBird] Species clicked:', group.common_name, 'onObservationSelect:', !!onObservationSelect);
        if (group.observations.length > 0 && onObservationSelect) {
          console.log('[eBird] Calling onObservationSelect with:', group.observations[0]);
          onObservationSelect(group.observations[0]);
        }
      }}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          if (group.observations.length > 0 && onObservationSelect) {
            onObservationSelect(group.observations[0]);
          }
        }
      }}
    >
      <div className="flex gap-3">
        {/* Bird Photo */}
        <div className="flex-shrink-0">
          {group.photoUrl ? (
            <img
              src={group.photoUrl}
              alt={group.common_name || group.scientific_name}
              className={`${isCompact ? 'w-12 h-12' : 'w-16 h-16'} rounded-lg object-cover bg-gray-100`}
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
                const placeholder = target.nextElementSibling as HTMLElement;
                if (placeholder) placeholder.style.display = 'flex';
              }}
            />
          ) : null}
          <div 
            className={`${isCompact ? 'w-12 h-12' : 'w-16 h-16'} rounded-lg bg-gray-100 flex items-center justify-center ${
              group.photoUrl ? 'hidden' : 'flex'
            }`}
          >
            <span className={`${isCompact ? 'text-xl' : 'text-2xl'}`}>🐦</span>
          </div>
        </div>
        
        {/* Species Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <h4 className="font-medium text-sm text-gray-900 truncate">
                {group.common_name || group.scientific_name}
              </h4>
              {group.common_name && (
                <p className="text-xs text-gray-600 italic mt-0.5 truncate">
                  {group.scientific_name}
                </p>
              )}
            </div>
            <div className="ml-2 text-right flex-shrink-0">
              <div className="text-sm font-medium text-gray-900">
                {group.total_count.toLocaleString()}×
              </div>
              <div className="text-xs text-gray-500">
                {group.observations.length} obs
              </div>
            </div>
          </div>
          
          {/* Sample observations */}
          {!isCompact && (
            <div className="mt-2 space-y-1">
              {group.observations.slice(0, 2).map((obs, idx) => (
                <div
                  key={`${obs.obs_id}-${idx}`}
                  className="text-xs text-gray-600 flex items-center gap-2"
                >
                  <MapPin className="w-3 h-3 flex-shrink-0" />
                  <span className="truncate">{obs.location_name}</span>
                </div>
              ))}
              {group.observations.length > 2 && (
                <div className="text-xs text-gray-500">
                  + {group.observations.length - 2} more locations
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  // Render individual observation card (for "All" view)
  const renderObservationCard = (obs: EBirdObservation) => {
    const taxonInfo = taxonPhotos.get(obs.scientific_name.toLowerCase());
    
    return (
      <div
        key={obs.obs_id}
        id={`ebird-obs-${obs.obs_id}`}
        className="border border-gray-200 rounded-lg p-3 hover:bg-gray-50 transition-colors cursor-pointer"
        onClick={() => onObservationSelect?.(obs)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onObservationSelect?.(obs);
          }
        }}
      >
        <div className="flex gap-3">
          {/* Bird Photo */}
          <div className="flex-shrink-0">
            {taxonInfo?.photoUrl ? (
              <img
                src={taxonInfo.photoUrl}
                alt={obs.common_name || obs.scientific_name}
                className="w-12 h-12 rounded-lg object-cover bg-gray-100"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                  const placeholder = target.nextElementSibling as HTMLElement;
                  if (placeholder) placeholder.style.display = 'flex';
                }}
              />
            ) : null}
            <div 
              className={`w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center ${
                taxonInfo?.photoUrl ? 'hidden' : 'flex'
              }`}
            >
              <span className="text-xl">🐦</span>
            </div>
          </div>
          
          {/* Observation Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <h4 className="font-medium text-sm text-gray-900 truncate">
                  {obs.common_name || obs.scientific_name}
                </h4>
                {obs.common_name && (
                  <p className="text-xs text-gray-600 italic mt-0.5 truncate">
                    {obs.scientific_name}
                  </p>
                )}
              </div>
              <div className="ml-2 text-right flex-shrink-0">
                <div className="text-sm font-medium text-gray-900">
                  {obs.count_observed.toLocaleString()}×
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
              <div className="flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                <span className="truncate max-w-[120px]">{obs.location_name}</span>
              </div>
              <div className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                <span>{new Date(obs.observation_date).toLocaleDateString()}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div id="ebird-wildlife-view" className="w-64 md:w-80 lg:w-96 flex-shrink-0 bg-white border-r border-gray-200 flex flex-col">
      {/* Back to Data Types - distinct header bar */}
      {onBack && <DataTypeBackHeader onBack={onBack} />}
      
      {/* Header */}
      <div id="ebird-view-header" className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <span className="text-xl">🐦</span>
            eBird
          </h2>
          <div className="flex gap-1">
            <button
              id="ebird-recent-view-btn"
              onClick={() => setViewMode('recent')}
              className={`px-2 py-1 text-xs rounded ${
                viewMode === 'recent' ? 'bg-green-100 text-green-700' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Top
            </button>
            <button
              id="ebird-all-view-btn"
              onClick={() => setViewMode('all')}
              className={`px-2 py-1 text-xs rounded ${
                viewMode === 'all' ? 'bg-green-100 text-green-700' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              All
            </button>
            <button
              id="ebird-grouped-view-btn"
              onClick={() => setViewMode('grouped')}
              className={`px-2 py-1 text-xs rounded ${
                viewMode === 'grouped' ? 'bg-green-100 text-green-700' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Species
            </button>
          </div>
        </div>
        
        <p className="text-sm text-gray-600">
          {observations.length.toLocaleString()} observation{observations.length !== 1 ? 's' : ''}
          {currentDaysBack && ` (Last ${currentDaysBack} days)`}
          {startDate && endDate && ` (${startDate} to ${endDate})`}
        </p>
        <p className="text-sm text-gray-600">
          {speciesGroups.length} species detected
        </p>
        
        {/* Export buttons */}
        {observations.length > 0 && (onExportCSV || onExportGeoJSON || onAddToCart) && (
          <div id="ebird-export-buttons" className="flex gap-2 mt-3">
            {onExportCSV && (
              <button
                id="ebird-export-csv-btn"
                onClick={onExportCSV}
                className="flex-1 px-3 py-1.5 text-xs bg-green-50 text-green-700 rounded hover:bg-green-100 transition-colors"
              >
                Export CSV
              </button>
            )}
            {onExportGeoJSON && (
              <button
                id="ebird-export-geojson-btn"
                onClick={onExportGeoJSON}
                className="flex-1 px-3 py-1.5 text-xs bg-green-50 text-green-700 rounded hover:bg-green-100 transition-colors"
              >
                Export GeoJSON
              </button>
            )}
            {onAddToCart && (
              <button
                id="ebird-add-to-cart-btn"
                onClick={onAddToCart}
                className="flex-1 px-3 py-1.5 text-xs bg-blue-50 text-blue-700 rounded hover:bg-blue-100 transition-colors flex items-center justify-center gap-1"
                title="Add current search to export cart"
              >
                <ShoppingCart className="w-3 h-3" />
                Add to Cart
              </button>
            )}
          </div>
        )}
      </div>

      {/* Content */}
      <div id="ebird-observations-list" className="flex-1 overflow-y-auto">
        {loading && observations.length === 0 ? (
          <div className="flex items-center justify-center p-8">
            <LoadingSpinner />
          </div>
        ) : observations.length === 0 ? (
          <div className="flex items-center justify-center p-8 text-center">
            <div>
              <span className="text-4xl block mb-3">🐦</span>
              <p className="text-gray-500 font-medium">No observations found</p>
              <p className="text-sm text-gray-400 mt-1">Try adjusting your filters</p>
            </div>
          </div>
        ) : viewMode === 'all' ? (
          /* All Observations View */
          <div id="ebird-all-observations" className="p-4">
            <div className="mb-3">
              <h3 className="text-sm font-medium text-gray-700 mb-1">All Observations</h3>
              <p className="text-xs text-gray-500">
                Showing all {sortedObservations.length.toLocaleString()} observations (sorted by date)
              </p>
              {photosLoading && (
                <p className="text-xs text-blue-600 mt-1">Loading bird photos...</p>
              )}
            </div>
            <div className="space-y-3">
              {sortedObservations.map(obs => renderObservationCard(obs))}
            </div>
          </div>
        ) : viewMode === 'recent' ? (
          /* Top Species View */
          <div id="ebird-top-species" className="p-4">
            <div className="mb-3">
              <h3 className="text-sm font-medium text-gray-700 mb-1">Top Species</h3>
              <p className="text-xs text-gray-500">
                Top {Math.min(topSpecies.length, 10)} species by total individuals
              </p>
              {photosLoading && (
                <p className="text-xs text-blue-600 mt-1">Loading bird photos...</p>
              )}
            </div>
            <div className="space-y-3">
              {topSpecies.map(group => renderSpeciesCard(group))}
            </div>
            
            {speciesGroups.length > 10 && (
              <div className="mt-4 p-3 bg-gray-50 rounded-lg text-center">
                <p className="text-xs text-gray-600">
                  Showing top 10 of {speciesGroups.length} species
                </p>
                <button
                  onClick={() => setViewMode('grouped')}
                  className="mt-1 text-xs text-green-600 hover:text-green-700 font-medium"
                >
                  View all {speciesGroups.length} species →
                </button>
              </div>
            )}
          </div>
        ) : (
          /* All Species View (grouped) */
          <div id="ebird-all-species" className="p-4">
            <div className="mb-3">
              <h3 className="text-sm font-medium text-gray-700 mb-1">All Species</h3>
              <p className="text-xs text-gray-500">
                {speciesGroups.length} species (sorted by total count)
              </p>
              {photosLoading && (
                <p className="text-xs text-blue-600 mt-1">Loading bird photos...</p>
              )}
            </div>
            <div className="space-y-2">
              {speciesGroups.map(group => renderSpeciesCard(group, true))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default WildlifeEBirdView;
