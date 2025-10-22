import React, { useState, useMemo } from 'react';
import { Calendar, User, ExternalLink, MapPin, Info, Download } from 'lucide-react';
import { TNCArcGISObservation } from '../../services/tncINaturalistService';
import LoadingSpinner from '../LoadingSpinner';
import ThumbnailImage from '../ThumbnailImage';
import { tncINaturalistService } from '../../services/tncINaturalistService';

interface WildlifeTNCINaturalistViewProps {
  observations: TNCArcGISObservation[];
  loading: boolean;
  currentDaysBack?: number;
  startDate?: string;
  endDate?: string;
  onExportCSV?: () => void;
  onExportGeoJSON?: () => void;
  selectedObservation?: TNCArcGISObservation | null;
  onObservationSelect?: (observation: TNCArcGISObservation | null) => void;
  hasSearched?: boolean;
}

const WildlifeTNCINaturalistView: React.FC<WildlifeTNCINaturalistViewProps> = ({
  observations,
  loading,
  currentDaysBack,
  startDate,
  endDate,
  onExportCSV,
  onExportGeoJSON,
  selectedObservation,
  onObservationSelect,
  hasSearched = false
}) => {
  const [expandedObservation, setExpandedObservation] = useState<number | null>(null);
  const [selectedTaxonFilter, setSelectedTaxonFilter] = useState<string>('all');
  const [searchText, setSearchText] = useState<string>('');
  const [page, setPage] = useState<number>(1);
  const pageSize = 25;

  // Group observations by taxon category
  const groupedObservations = useMemo(() => {
    const groups: { [key: string]: TNCArcGISObservation[] } = {};
    
    observations.forEach(obs => {
      // Normalize category name - replace "Other" with "Unknown"
      let category = obs.taxon_category_name || 'Unknown';
      if (category === 'Other') {
        category = 'Unknown';
      }
      if (!groups[category]) {
        groups[category] = [];
      }
      groups[category].push(obs);
    });

    return Object.entries(groups)
      .map(([category, obs]) => ({
        category,
        count: obs.length,
        observations: obs.sort((a, b) => new Date(b.observed_on).getTime() - new Date(a.observed_on).getTime())
      }))
      .sort((a, b) => b.count - a.count);
  }, [observations]);

  // Filter observations based on selected taxon
  const filteredObservations = useMemo(() => {
    const byTaxon = selectedTaxonFilter === 'all' 
      ? observations 
      : observations.filter(obs => {
          // Handle "Unknown" filter - match both null/empty and "Other"
          if (selectedTaxonFilter === 'Unknown') {
            return !obs.taxon_category_name || obs.taxon_category_name === 'Other';
          }
          return obs.taxon_category_name === selectedTaxonFilter;
        });
    if (!searchText.trim()) return byTaxon;
    const q = searchText.toLowerCase();
    return byTaxon.filter(obs => (
      (obs.common_name || '').toLowerCase().includes(q) ||
      (obs.scientific_name || '').toLowerCase().includes(q) ||
      (obs.user_name || '').toLowerCase().includes(q)
    ));
  }, [observations, selectedTaxonFilter, searchText]);

  const paginatedObservations = useMemo(() => {
    const start = (page - 1) * pageSize;
    const end = start + pageSize;
    return filteredObservations.slice(start, end);
  }, [filteredObservations, page]);

  const totalPages = useMemo(() => Math.max(1, Math.ceil(filteredObservations.length / pageSize)), [filteredObservations.length]);

  const resetPagination = () => setPage(1);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getTaxonIcon = (category: string) => {
    const icons: { [key: string]: string } = {
      'Actinopterygii': '🐟',
      'Amphibia': '🐸',
      'Arachnida': '🕷️',
      'Aves': '🐦',
      'Fungi': '🍄',
      'Insecta': '🦋',
      'Mammalia': '🦌',
      'Mollusca': '🐚',
      'Plantae': '🌱',
      'Protozoa': '🦠',
      'Reptilia': '🦎',
      'Unknown': '🔍',
      'Other': '🔍'
    };
    return icons[category] || '🔍';
  };

  const getTaxonColor = (category: string) => {
    const colors: { [key: string]: string } = {
      'Actinopterygii': '#1f77b4',
      'Amphibia': '#ff7f0e',
      'Arachnida': '#2ca02c',
      'Aves': '#d62728',
      'Fungi': '#9467bd',
      'Insecta': '#8c564b',
      'Mammalia': '#e377c2',
      'Mollusca': '#7f7f7f',
      'Plantae': '#bcbd22',
      'Protozoa': '#17becf',
      'Reptilia': '#ff9896',
      'Unknown': '#666666',
      'Other': '#666666'
    };
    return colors[category] || '#666666';
  };

  const handleObservationClick = (observation: TNCArcGISObservation) => {
    if (onObservationSelect) {
      onObservationSelect(observation);
    }
    setExpandedObservation(expandedObservation === observation.observation_id ? null : observation.observation_id);
  };

  const renderTaxonomicHierarchy = (observation: TNCArcGISObservation) => {
    const hierarchy = [
      { label: 'Kingdom', value: observation.taxon_kingdom_name },
      { label: 'Phylum', value: observation.taxon_phylum_name },
      { label: 'Class', value: observation.taxon_class_name },
      { label: 'Order', value: observation.taxon_order_name },
      { label: 'Family', value: observation.taxon_family_name },
      { label: 'Genus', value: observation.taxon_genus_name },
      { label: 'Species', value: observation.taxon_species_name }
    ].filter(item => item.value && item.value.trim() !== '');

    return (
      <div id={`taxonomic-hierarchy-${observation.observation_id}`} className="mt-3 p-3 bg-gray-50 rounded-lg">
        <h4 className="text-sm font-medium text-gray-700 mb-2">Taxonomic Classification</h4>
        <div className="grid grid-cols-2 gap-2 text-xs">
          {hierarchy.map((item, index) => (
            <div key={index} className="flex">
              <span className="font-medium text-gray-600 w-16">{item.label}:</span>
              <span className="text-gray-800">{item.value}</span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderSpatialContext = (observation: TNCArcGISObservation) => {
    return (
      <div id={`spatial-context-${observation.observation_id}`} className="mt-3 p-3 bg-blue-50 rounded-lg">
        <h4 className="text-sm font-medium text-blue-700 mb-2 flex items-center">
          <MapPin className="w-4 h-4 mr-1" />
          Spatial Context
        </h4>
        
        {observation.wdpa_protected_area && (
          <div className="text-xs text-blue-800 mb-2">
            <strong>Protected Area:</strong> {observation.wdpa_protected_area}
          </div>
        )}
        
        {observation.ecosystem_type && (
          <div className="text-xs text-blue-800 mb-2">
            <strong>Ecosystem:</strong> {observation.ecosystem_type}
          </div>
        )}

        {observation.nearby_observations && (
          <div className="mt-2">
            <div className="text-xs font-medium text-blue-700 mb-1">Nearby Observations:</div>
            {Object.entries(observation.nearby_observations.within_100m || {}).length > 0 && (
              <div className="text-xs text-blue-800">
                <strong>Within 100m:</strong> {Object.entries(observation.nearby_observations.within_100m).map(([cat, count]) => `${cat} (${count})`).join(', ')}
              </div>
            )}
            {Object.entries(observation.nearby_observations.within_500m || {}).length > 0 && (
              <div className="text-xs text-blue-800">
                <strong>Within 500m:</strong> {Object.entries(observation.nearby_observations.within_500m).map(([cat, count]) => `${cat} (${count})`).join(', ')}
              </div>
            )}
            {Object.entries(observation.nearby_observations.within_1000m || {}).length > 0 && (
              <div className="text-xs text-blue-800">
                <strong>Within 1000m:</strong> {Object.entries(observation.nearby_observations.within_1000m).map(([cat, count]) => `${cat} (${count})`).join(', ')}
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  // Show empty state if no search has been performed
  if (!hasSearched) {
    return (
      <div id="tnc-inaturalist-view" className="w-96 bg-white border-r border-gray-200 flex flex-col">
        <div id="tnc-inaturalist-empty-state" className="flex flex-col items-center justify-center h-full p-8 text-center">
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
      <div id="tnc-inaturalist-loading" className="w-96 bg-white border-r border-gray-200 flex flex-col">
        <div id="tnc-inaturalist-header" className="p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">iNaturalist (TNC Layers)</h2>
          <p className="text-sm text-gray-600">Loading observations...</p>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <LoadingSpinner />
        </div>
      </div>
    );
  }

  return (
    <div id="tnc-inaturalist-view" className="w-96 bg-white border-r border-gray-200 flex flex-col">
      {/* Header */}
      <div id="tnc-inaturalist-header" className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-lg font-semibold text-gray-900">iNaturalist (TNC Layers)</h2>
          <div className="flex space-x-1">
            {onExportCSV && (
              <button
                id="tnc-export-csv-button"
                onClick={onExportCSV}
                className="p-1 text-gray-400 hover:text-gray-600"
                title="Export CSV"
              >
                <Download className="w-4 h-4" />
              </button>
            )}
            {onExportGeoJSON && (
              <button
                id="tnc-export-geojson-button"
                onClick={onExportGeoJSON}
                className="p-1 text-gray-400 hover:text-gray-600"
                title="Export GeoJSON"
              >
                <Download className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
        
        <div className="text-sm text-gray-600 mb-3">
          {observations.length} observations
          {currentDaysBack && ` (last ${currentDaysBack} days)`}
          {startDate && endDate && ` (${formatDate(startDate)} - ${formatDate(endDate)})`}
        </div>

        {/* Search */}
        <div id="tnc-search" className="mb-3">
          <input
            id="tnc-search-input"
            type="text"
            value={searchText}
            onChange={(e) => { setSearchText(e.target.value); resetPagination(); }}
            placeholder="Search by name or observer..."
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Taxon Filter */}
        <div id="tnc-taxon-filter" className="mb-3">
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
        <div id="tnc-legend" className="grid grid-cols-2 gap-1 text-xs">
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
      <div id="tnc-observations-list" className="flex-1 overflow-y-auto">
        {filteredObservations.length === 0 ? (
          <div id="tnc-no-observations" className="p-4 text-center text-gray-500">
            <Info className="w-8 h-8 mx-auto mb-2 text-gray-400" />
            <p className="text-sm">No observations found</p>
            <p className="text-xs mt-1">Try adjusting your filters or time range</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {paginatedObservations.map((observation) => (
              <div
                key={observation.observation_id}
                id={`tnc-observation-${observation.observation_id}`}
                className={`p-4 cursor-pointer hover:bg-gray-50 transition-colors ${
                  selectedObservation?.observation_id === observation.observation_id ? 'bg-blue-50 border-l-4 border-blue-500' : ''
                }`}
                onClick={() => handleObservationClick(observation)}
              >
                <div className="flex items-start space-x-3">
                  <ThumbnailImage
                    src={tncINaturalistService.getPrimaryImageUrl(observation)}
                    alt={observation.common_name || observation.scientific_name}
                    width={48}
                    height={48}
                    className="flex-shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-medium text-gray-900 truncate">
                        {observation.common_name || observation.scientific_name}
                      </h3>
                      <span className="text-xs text-gray-500">
                        {getTaxonIcon(observation.taxon_category_name)}
                      </span>
                    </div>
                    
                    {observation.common_name && observation.scientific_name && (
                      <p className="text-xs text-gray-600 italic mt-1">
                        {observation.scientific_name}
                      </p>
                    )}
                    
                    <div className="flex items-center mt-2 text-xs text-gray-500 space-x-3">
                      <div className="flex items-center">
                        <Calendar className="w-3 h-3 mr-1" />
                        {formatDate(observation.observed_on)}
                      </div>
                      <div className="flex items-center">
                        <User className="w-3 h-3 mr-1" />
                        {observation.user_name}
                      </div>
                    </div>

                    {/* Expanded Details */}
                    {expandedObservation === observation.observation_id && (
                      <div id={`tnc-expanded-details-${observation.observation_id}`} className="mt-3 space-y-3">
                        {/* Inline photo with attribution if available */}
                        {(tncINaturalistService.getPrimaryImageUrl(observation)) && (
                          <div className="flex flex-col">
                            <img
                              id={`tnc-expanded-photo-${observation.observation_id}`}
                              src={tncINaturalistService.getPrimaryImageUrl(observation) as string}
                              alt={observation.common_name || observation.scientific_name}
                              className="w-full max-w-xs rounded-md"
                              loading="lazy"
                              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                            />
                            {tncINaturalistService.getPhotoAttribution(observation) && (
                              <span className="mt-1 text-xs text-gray-500">
                                {tncINaturalistService.getPhotoAttribution(observation)}
                              </span>
                            )}
                          </div>
                        )}
                        
                        {/* Taxonomic Hierarchy */}
                        {renderTaxonomicHierarchy(observation)}
                        
                        {/* Spatial Context */}
                        {renderSpatialContext(observation)}
                        
                        {/* Additional Info */}
                        <div className="flex items-center justify-between pt-2 border-t border-gray-200">
                          <div className="text-xs text-gray-500">
                            Taxon ID: {observation.taxon_id}
                          </div>
                          <button
                            id={`tnc-more-info-${observation.observation_id}`}
                            className="flex items-center text-xs text-blue-600 hover:text-blue-800"
                            onClick={(e) => {
                              e.stopPropagation();
                              // Open iNaturalist observation page
                              window.open(`https://www.inaturalist.org/observations/${observation.observation_id}`, '_blank');
                            }}
                          >
                            <ExternalLink className="w-3 h-3 mr-1" />
                            More Info
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
      </div>

      {/* Pagination Controls */}
      {filteredObservations.length > pageSize && (
        <div id="tnc-pagination" className="p-3 border-t border-gray-200 flex items-center justify-between text-sm">
          <button
            id="tnc-pagination-prev"
            className="px-3 py-1 border rounded-md disabled:opacity-50"
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            Previous
          </button>
          <span id="tnc-pagination-info" className="text-gray-600">
            Page {page} of {totalPages}
          </span>
          <button
            id="tnc-pagination-next"
            className="px-3 py-1 border rounded-md disabled:opacity-50"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

export default WildlifeTNCINaturalistView;
