import React, { useState, useMemo } from 'react';
import { Calendar, User, ExternalLink, MapPin, Info, ShoppingCart } from 'lucide-react';
import ThumbnailImage from './ThumbnailImage';

// Define a unified observation interface
export interface INaturalistUnifiedObservation {
  id: number | string;
  observedOn: string;
  observerName: string;
  commonName: string | null;
  scientificName: string;
  photoUrl: string | null;
  photoAttribution?: string | null;
  iconicTaxon: string;
  qualityGrade?: string | null;
  location?: string | null;
  uri: string;
  taxonId?: number | string;
}

interface INaturalistSidebarProps {
  title: string; // e.g., "iNaturalist (Public API)" or "iNaturalist (TNC Layers)"
  observations: INaturalistUnifiedObservation[];
  loading: boolean;
  dateRangeText: string;
  onAddToCart?: () => void;
  onObservationClick?: (obs: INaturalistUnifiedObservation) => void;
  hasSearched?: boolean;
  selectedObservationId?: number | string | null;
}

const INaturalistSidebar: React.FC<INaturalistSidebarProps> = ({
  title,
  observations,
  loading,
  dateRangeText,
  onAddToCart,
  onObservationClick,
  hasSearched = false,
  selectedObservationId
}) => {
  const [searchText, setSearchText] = useState('');
  const [selectedTaxonFilter, setSelectedTaxonFilter] = useState('all');
  const [expandedObservation, setExpandedObservation] = useState<number | string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 20;

  // Helper function to format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  // Reset pagination when filters change
  const resetPagination = () => setCurrentPage(1);

  // Group observations by iconic taxon
  const groupedObservations = useMemo(() => {
    const groups: Record<string, { count: number; category: string }> = {};
    
    observations.forEach(obs => {
      const category = obs.iconicTaxon || 'Unknown';
      if (!groups[category]) {
        groups[category] = { count: 0, category };
      }
      groups[category].count++;
    });
    
    return Object.values(groups).sort((a, b) => b.count - a.count);
  }, [observations]);

  // Get taxon icon
  const getTaxonIcon = (taxon: string): string => {
    const normalized = taxon?.toLowerCase() || '';
    if (normalized === 'aves') return '🐦';
    if (normalized === 'mammalia') return '🦌';
    if (normalized === 'reptilia') return '🦎';
    if (normalized === 'amphibia') return '🐸';
    if (normalized === 'actinopterygii') return '🐟';
    if (normalized === 'insecta') return '🦋';
    if (normalized === 'arachnida') return '🕷️';
    if (normalized === 'plantae') return '🌱';
    if (normalized === 'mollusca') return '🐚';
    if (normalized === 'animalia') return '🐾';
    if (normalized === 'fungi') return '🍄';
    if (normalized === 'chromista') return '🦠';
    if (normalized === 'protozoa') return '🔬';
    return '🔍';
  };

  // Get taxon color
  const getTaxonColor = (taxon: string): string => {
    const normalized = taxon?.toLowerCase() || '';
    if (normalized === 'aves') return '#4A90E2';
    if (normalized === 'mammalia') return '#8B4513';
    if (normalized === 'reptilia') return '#228B22';
    if (normalized === 'amphibia') return '#32CD32';
    if (normalized === 'actinopterygii') return '#1E90FF';
    if (normalized === 'insecta') return '#FFD700';
    if (normalized === 'arachnida') return '#800080';
    if (normalized === 'plantae') return '#228B22';
    if (normalized === 'mollusca') return '#DDA0DD';
    if (normalized === 'animalia') return '#666666';
    if (normalized === 'fungi') return '#FF6B6B';
    if (normalized === 'chromista') return '#4ECDC4';
    if (normalized === 'protozoa') return '#95E1D3';
    return '#666666';
  };

  // Filter observations
  const filteredObservations = useMemo(() => {
    let filtered = observations;
    
    // Filter by taxon
    if (selectedTaxonFilter !== 'all') {
      filtered = filtered.filter(obs => 
        (obs.iconicTaxon || 'Unknown') === selectedTaxonFilter
      );
    }
    
    // Filter by search text
    if (searchText.trim()) {
      const search = searchText.toLowerCase();
      filtered = filtered.filter(obs =>
        obs.commonName?.toLowerCase().includes(search) ||
        obs.scientificName?.toLowerCase().includes(search) ||
        obs.observerName?.toLowerCase().includes(search)
      );
    }
    
    return filtered;
  }, [observations, selectedTaxonFilter, searchText]);

  // Paginate observations
  const paginatedObservations = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    return filteredObservations.slice(startIndex, endIndex);
  }, [filteredObservations, currentPage, pageSize]);

  const totalPages = Math.ceil(filteredObservations.length / pageSize);

  // Handle observation click
  const handleObservationClick = (obs: INaturalistUnifiedObservation) => {
    console.log('📋 INaturalistSidebar: Observation clicked:', obs.id, 'Currently expanded:', expandedObservation);
    
    if (expandedObservation === obs.id) {
      setExpandedObservation(null);
    } else {
      setExpandedObservation(obs.id);
    }
    
    // Call parent callback if provided (should happen on EVERY click)
    console.log('📋 INaturalistSidebar: Calling onObservationClick callback');
    onObservationClick?.(obs);
  };

  // Show empty state if no search has been performed
  if (!hasSearched) {
    return (
      <div id="inaturalist-sidebar" className="w-96 bg-white border-r border-gray-200 flex flex-col h-full">
        <div id="inaturalist-empty-state" className="flex flex-col items-center justify-center h-full p-8 text-center">
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

  if (loading) {
    return (
      <div id="inaturalist-sidebar-loading" className="w-96 bg-white border-r border-gray-200 flex flex-col h-full">
        <div id="inaturalist-sidebar-loading-content" className="p-4 border-b border-gray-200">
          <h2 id="inaturalist-sidebar-loading-title" className="text-lg font-semibold text-gray-900 mb-4">{title}</h2>
          <div id="inaturalist-loading-container" className="flex flex-col items-center justify-center h-32 space-y-3">
            <div id="inaturalist-loading-spinner" className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <div id="inaturalist-loading-text" className="text-center">
              <p className="text-sm text-gray-600 font-medium">Loading observations...</p>
              <p className="text-xs text-gray-500 mt-1 max-w-xs">
                Fetching data...
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div id="inaturalist-sidebar" className="w-96 bg-white border-r border-gray-200 flex flex-col">
      {/* Header */}
      <div id="inaturalist-sidebar-header" className="p-4 border-b border-gray-200">
        <div className="mb-2">
          <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
        </div>
        
        <div className="text-sm text-gray-600 mb-3">
          {observations.length} observations {dateRangeText}
        </div>

        {/* Search */}
        <div id="inaturalist-search" className="mb-3">
          <input
            id="inaturalist-search-input"
            type="text"
            value={searchText}
            onChange={(e) => { setSearchText(e.target.value); resetPagination(); }}
            placeholder="Search by name or observer..."
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Taxon Filter */}
        <div id="inaturalist-taxon-filter" className="mb-3">
          <select
            value={selectedTaxonFilter}
            onChange={(e) => { setSelectedTaxonFilter(e.target.value); resetPagination(); }}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Taxa ({observations.length})</option>
            {groupedObservations.map(group => (
              <option key={group.category} value={group.category}>
                {getTaxonIcon(group.category)} {group.category} ({group.count})
              </option>
            ))}
          </select>
        </div>

        {/* Legend */}
        <div id="inaturalist-legend" className="grid grid-cols-2 gap-1 text-xs">
          {groupedObservations.slice(0, 6).map(group => (
            <div key={group.category} className="flex items-center">
              <div 
                className="w-3 h-3 rounded-full mr-2"
                style={{ backgroundColor: getTaxonColor(group.category) }}
              />
              <span className="truncate">{group.category} ({group.count})</span>
            </div>
          ))}
        </div>
      </div>

      {/* Observations List */}
      <div id="inaturalist-observations-list" className="flex-1 overflow-y-auto">
        {filteredObservations.length === 0 ? (
          <div id="inaturalist-no-results" className="p-4 text-center text-gray-500">
            <Info className="w-8 h-8 mx-auto mb-2 text-gray-400" />
            <p className="text-sm">No observations found</p>
            <p className="text-xs mt-1">Try adjusting your filters or time range</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {paginatedObservations.map((observation) => (
              <div
                key={observation.id}
                id={`inaturalist-observation-${observation.id}`}
                className={`p-4 cursor-pointer hover:bg-gray-50 transition-colors ${
                  (selectedObservationId === observation.id || expandedObservation === observation.id) ? 'bg-blue-50 border-l-4 border-blue-500' : ''
                }`}
                onClick={() => handleObservationClick(observation)}
              >
                <div className="flex items-start space-x-3">
                  {observation.photoUrl ? (
                    <ThumbnailImage
                      src={observation.photoUrl}
                      alt={observation.commonName || observation.scientificName}
                      width={48}
                      height={48}
                      className="flex-shrink-0"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-lg bg-gray-200 flex items-center justify-center flex-shrink-0">
                      <span className="text-gray-400 text-xs">No photo</span>
                    </div>
                  )}
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-medium text-gray-900 truncate">
                        {observation.commonName || observation.scientificName}
                      </h3>
                      <span className="text-xs text-gray-500">
                        {getTaxonIcon(observation.iconicTaxon)}
                      </span>
                    </div>
                    
                    {observation.commonName && observation.scientificName && (
                      <p className="text-xs text-gray-600 italic mt-1">
                        {observation.scientificName}
                      </p>
                    )}
                    
                    <div className="flex items-center mt-2 text-xs text-gray-500 space-x-3">
                      <div className="flex items-center">
                        <Calendar className="w-3 h-3 mr-1" />
                        {formatDate(observation.observedOn)}
                      </div>
                      <div className="flex items-center">
                        <User className="w-3 h-3 mr-1" />
                        {observation.observerName}
                      </div>
                    </div>

                    {/* Expanded Details */}
                    {expandedObservation === observation.id && (
                      <div id={`inaturalist-expanded-details-${observation.id}`} className="mt-3 space-y-3">
                        {/* Large photo */}
                        {observation.photoUrl && (
                          <div className="flex flex-col">
                            <img
                              id={`inaturalist-expanded-photo-${observation.id}`}
                              src={observation.photoUrl}
                              alt={observation.commonName || observation.scientificName}
                              className="w-full max-w-xs rounded-md"
                              loading="lazy"
                            />
                            {observation.photoAttribution && (
                              <span className="mt-1 text-xs text-gray-500">
                                {observation.photoAttribution}
                              </span>
                            )}
                          </div>
                        )}
                        
                        {/* Quality Grade */}
                        {observation.qualityGrade && (
                          <div className="text-xs">
                            <span className="font-medium text-gray-700">Quality: </span>
                            <span className={`capitalize ${
                              observation.qualityGrade === 'research' ? 'text-green-600' :
                              observation.qualityGrade === 'needs_id' ? 'text-yellow-600' :
                              'text-gray-600'
                            }`}>
                              {observation.qualityGrade.replace('_', ' ')}
                            </span>
                          </div>
                        )}
                        
                        {/* Location */}
                        {observation.location && (
                          <div className="flex items-start text-xs">
                            <MapPin className="w-3 h-3 mr-1 mt-0.5 flex-shrink-0 text-gray-400" />
                            <span className="text-gray-600">{observation.location}</span>
                          </div>
                        )}
                        
                        {/* Additional Info */}
                        <div className="flex items-center justify-between pt-2 border-t border-gray-200">
                          {observation.taxonId && (
                            <div className="text-xs text-gray-500">
                              Taxon ID: {observation.taxonId}
                            </div>
                          )}
                          <button
                            id={`inaturalist-more-info-${observation.id}`}
                            className="flex items-center text-xs text-blue-600 hover:text-blue-800"
                            onClick={(e) => {
                              e.stopPropagation();
                              window.open(observation.uri, '_blank');
                            }}
                          >
                            <ExternalLink className="w-3 h-3 mr-1" />
                            View on iNaturalist
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        
        {/* Pagination */}
        {totalPages > 1 && (
          <div id="inaturalist-pagination" className="flex items-center justify-between p-4 border-t border-gray-200 bg-gray-50">
            <button
              id="inaturalist-prev-page"
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1 text-sm border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
            >
              Previous
            </button>
            <span className="text-sm text-gray-600">
              Page {currentPage} of {totalPages}
            </span>
            <button
              id="inaturalist-next-page"
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-1 text-sm border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default INaturalistSidebar;

