import React, { useState } from 'react';
import { ChevronDown, ChevronRight, ExternalLink, Calendar, User, X } from 'lucide-react';
import { ObservationGroup } from '../types';
import { iNaturalistObservation } from '../services/iNaturalistService';
import { formatDateRangeCompact } from '../utils/dateUtils';

interface ObservationsSidebarProps {
  observations: iNaturalistObservation[];
  loading: boolean;
  currentDaysBack?: number;
  startDate?: string;
  endDate?: string;
  onExportCSV?: () => void;
  onExportGeoJSON?: () => void;
  hasSearched?: boolean;
}

const ObservationsSidebar: React.FC<ObservationsSidebarProps> = ({ 
  observations, 
  loading, 
  currentDaysBack = 30, 
  startDate, 
  endDate,
  onExportCSV,
  onExportGeoJSON,
  hasSearched = false
}) => {
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [expandedSubcategories, setExpandedSubcategories] = useState<Set<string>>(new Set());
  const [selectedObservation, setSelectedObservation] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Generate appropriate date range text
  const getDateRangeText = () => {
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      return `${start.toLocaleDateString()} - ${end.toLocaleDateString()}`;
    }
    return formatDateRangeCompact(currentDaysBack).toLowerCase();
  };

  // Group observations by Flora/Fauna and then by iconic taxon
  const groupObservations = (): ObservationGroup[] => {
    const floraGroup: ObservationGroup = {
      category: 'Flora',
      count: 0,
      subcategories: []
    };

    const faunaGroup: ObservationGroup = {
      category: 'Fauna',
      count: 0,
      subcategories: []
    };

    const subcategoryMap = new Map<string, {
      name: string;
      iconicTaxon: string;
      count: number;
      observations: Array<{
        id: number;
        commonName: string | null;
        scientificName: string;
        observedOn: string;
        observer: string;
        photoUrl: string | null;
        qualityGrade: string;
        geoprivacy?: string | null;
        uri: string;
      }>;
      isFlora: boolean;
    }>();

    observations.forEach(obs => {
      if (!obs.taxon) return;

      const iconicTaxon = obs.taxon.iconic_taxon_name?.toLowerCase() || 'unknown';
      const isFlora = iconicTaxon === 'plantae';
      
      // Map iconic taxon names to display names
      const displayName = getDisplayName(iconicTaxon);
      
      if (!subcategoryMap.has(iconicTaxon)) {
        subcategoryMap.set(iconicTaxon, {
          name: displayName,
          iconicTaxon,
          count: 0,
          observations: [],
          isFlora
        });
      }

      const subcategory = subcategoryMap.get(iconicTaxon)!;
      subcategory.count++;
      // Get the best available photo URL
      let photoUrl = null;
      if (obs.photos && obs.photos.length > 0) {
        // Use the first observation photo
        photoUrl = obs.photos[0].square_url || obs.photos[0].medium_url || obs.photos[0].url;
      } else if (obs.taxon?.default_photo) {
        // Fallback to taxon default photo if no observation photos
        photoUrl = obs.taxon.default_photo.square_url || obs.taxon.default_photo.medium_url;
      }

      subcategory.observations.push({
        id: obs.id,
        commonName: obs.taxon.preferred_common_name,
        scientificName: obs.taxon.name,
        observedOn: obs.observed_on,
        observer: obs.user.login,
        photoUrl,
        qualityGrade: obs.quality_grade,
        geoprivacy: obs.geoprivacy,
        uri: obs.uri
      });
    });

    // Sort subcategories and assign to Flora/Fauna groups
    Array.from(subcategoryMap.values())
      .sort((a, b) => b.count - a.count) // Sort by count descending
      .forEach(subcategory => {
        if (subcategory.isFlora) {
          floraGroup.subcategories.push(subcategory);
          floraGroup.count += subcategory.count;
        } else {
          faunaGroup.subcategories.push(subcategory);
          faunaGroup.count += subcategory.count;
        }
      });

    return [faunaGroup, floraGroup].filter(group => group.count > 0);
  };

  const getDisplayName = (iconicTaxon: string): string => {
    const nameMap: Record<string, string> = {
      'aves': 'Birds',
      'mammalia': 'Mammals',
      'reptilia': 'Reptiles',
      'amphibia': 'Amphibians',
      'actinopterygii': 'Fish',
      'insecta': 'Insects',
      'arachnida': 'Spiders',
      'plantae': 'Plants',
      'mollusca': 'Mollusks',
      'animalia': 'Other Animals',
      'fungi': 'Fungi',
      'chromista': 'Chromista',
      'protozoa': 'Protozoa'
    };
    return nameMap[iconicTaxon] || 'Other';
  };

  const getIconForTaxon = (iconicTaxon: string): string => {
    const iconMap: Record<string, string> = {
      'aves': '🐦',
      'mammalia': '🦌',
      'reptilia': '🦎',
      'amphibia': '🐸',
      'actinopterygii': '🐟',
      'insecta': '🦋',
      'arachnida': '🕷️',
      'plantae': '🌱',
      'mollusca': '🐚',
      'animalia': '🐾',
      'fungi': '🍄',
      'chromista': '🦠',
      'protozoa': '🔬'
    };
    return iconMap[iconicTaxon] || '🔍';
  };

  const toggleCategory = (category: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(category)) {
      newExpanded.delete(category);
    } else {
      newExpanded.add(category);
    }
    setExpandedCategories(newExpanded);
  };

  const toggleSubcategory = (subcategory: string) => {
    const newExpanded = new Set(expandedSubcategories);
    if (newExpanded.has(subcategory)) {
      newExpanded.delete(subcategory);
    } else {
      newExpanded.add(subcategory);
    }
    setExpandedSubcategories(newExpanded);
  };

  const handleObservationClick = (obs: any) => {
    setSelectedObservation(obs);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedObservation(null);
  };

  const groupedObservations = groupObservations();

  // Show empty state if no search has been performed
  if (!hasSearched) {
    return (
      <div id="observations-sidebar" className="bg-white w-96 border-r border-gray-200 flex flex-col h-full">
        <div id="observations-empty-state" className="flex flex-col items-center justify-center h-full p-8 text-center">
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
      <div id="observations-sidebar-loading" className="bg-white w-96 border-r border-gray-200 flex flex-col h-full">
        <div id="observations-sidebar-loading-content" className="p-4">
          <h2 id="observations-sidebar-loading-title" className="text-base font-medium text-gray-900 mb-4">iNaturalist Observations</h2>
          <div id="observations-loading-container" className="flex flex-col items-center justify-center h-32 space-y-3">
            <div id="observations-loading-spinner" className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <div id="observations-loading-text" className="text-center">
              <p className="text-sm text-gray-600 font-medium">Loading observations...</p>
              <p className="text-xs text-gray-500 mt-1 max-w-xs">
                To respect iNaturalist's API rate limits, this process may take some time for large date ranges.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div id="observations-sidebar" className="bg-white w-96 border-r border-gray-200 flex flex-col h-full">
      <div id="observations-sidebar-content" className="flex flex-col h-full">
        {/* Header */}
        <div id="observations-sidebar-header" className="p-4 pb-2 flex-shrink-0">
          <h2 id="observations-sidebar-title" className="text-base font-medium text-gray-900">iNaturalist Observations</h2>
          <p id="observations-count-text" className="text-sm text-gray-500 mt-1">
            {observations.length} observations from {getDateRangeText()}
          </p>
          
          {/* Export buttons */}
          {observations.length > 0 && (onExportCSV || onExportGeoJSON) && (
            <div id="observations-export-buttons" className="flex gap-2 mt-3">
              {onExportCSV && (
                <button
                  id="observations-export-csv-btn"
                  onClick={onExportCSV}
                  className="flex-1 px-3 py-1.5 text-xs bg-blue-50 text-blue-700 rounded hover:bg-blue-100 transition-colors"
                >
                  Export CSV
                </button>
              )}
              {onExportGeoJSON && (
                <button
                  id="observations-export-geojson-btn"
                  onClick={onExportGeoJSON}
                  className="flex-1 px-3 py-1.5 text-xs bg-blue-50 text-blue-700 rounded hover:bg-blue-100 transition-colors"
                >
                  Export GeoJSON
                </button>
              )}
            </div>
          )}
        </div>

        {/* Grouped Observations */}
        <div id="observations-groups-container" className="flex-1 px-4 pb-4 space-y-2 overflow-y-auto">
          {groupedObservations.map((group) => (
            <div key={group.category} id={`observation-group-${group.category.toLowerCase()}`} className="border border-gray-200 rounded-lg">
              {/* Category Header */}
              <button
                id={`category-toggle-${group.category.toLowerCase()}`}
                onClick={() => toggleCategory(group.category)}
                className="w-full flex items-center justify-between p-3 hover:bg-gray-50 transition-colors"
              >
                <div id={`category-header-${group.category.toLowerCase()}`} className="flex items-center space-x-2">
                  <span id={`category-icon-${group.category.toLowerCase()}`} className="text-lg">
                    {group.category === 'Flora' ? '🌿' : '🐾'}
                  </span>
                  <span id={`category-title-${group.category.toLowerCase()}`} className="font-medium text-gray-900">
                    {group.category} ({group.count})
                  </span>
                </div>
                {expandedCategories.has(group.category) ? (
                  <ChevronDown id={`category-chevron-down-${group.category.toLowerCase()}`} className="w-4 h-4 text-gray-400" />
                ) : (
                  <ChevronRight id={`category-chevron-right-${group.category.toLowerCase()}`} className="w-4 h-4 text-gray-400" />
                )}
              </button>

              {/* Subcategories */}
              {expandedCategories.has(group.category) && (
                <div id={`subcategories-${group.category.toLowerCase()}`} className="border-t border-gray-100">
                  {group.subcategories.map((subcategory) => (
                    <div key={subcategory.iconicTaxon} id={`subcategory-${subcategory.iconicTaxon.toLowerCase()}`}>
                      {/* Subcategory Header */}
                      <button
                        id={`subcategory-toggle-${subcategory.iconicTaxon.toLowerCase()}`}
                        onClick={() => toggleSubcategory(subcategory.iconicTaxon)}
                        className="w-full flex items-center justify-between p-3 pl-8 hover:bg-gray-50 transition-colors border-t border-gray-50 first:border-t-0"
                      >
                        <div id={`subcategory-header-${subcategory.iconicTaxon.toLowerCase()}`} className="flex items-center space-x-2">
                          <span id={`subcategory-icon-${subcategory.iconicTaxon.toLowerCase()}`} className="text-sm">
                            {getIconForTaxon(subcategory.iconicTaxon)}
                          </span>
                          <span id={`subcategory-title-${subcategory.iconicTaxon.toLowerCase()}`} className="text-sm font-medium text-gray-700">
                            {subcategory.name} ({subcategory.count})
                          </span>
                        </div>
                        {expandedSubcategories.has(subcategory.iconicTaxon) ? (
                          <ChevronDown id={`subcategory-chevron-down-${subcategory.iconicTaxon.toLowerCase()}`} className="w-3 h-3 text-gray-400" />
                        ) : (
                          <ChevronRight id={`subcategory-chevron-right-${subcategory.iconicTaxon.toLowerCase()}`} className="w-3 h-3 text-gray-400" />
                        )}
                      </button>

                      {/* Individual Observations */}
                      {expandedSubcategories.has(subcategory.iconicTaxon) && (
                        <div id={`observations-list-${subcategory.iconicTaxon.toLowerCase()}`} className="bg-gray-50">
                          {subcategory.observations.map((obs) => (
                            <div 
                              key={obs.id} 
                              id={`observation-${obs.id}`} 
                              className="p-3 pl-12 border-t border-gray-100 first:border-t-0 cursor-pointer hover:bg-gray-100 transition-colors duration-150"
                              onClick={() => handleObservationClick(obs)}
                            >
                              <div id={`observation-content-${obs.id}`} className="flex space-x-3">
                                {/* Photo */}
                                {obs.photoUrl ? (
                                  <img
                                    id={`observation-photo-${obs.id}`}
                                    src={obs.photoUrl}
                                    alt={obs.commonName || obs.scientificName}
                                    className="w-12 h-12 rounded-lg object-cover flex-shrink-0"
                                    onError={(e) => {
                                      // Hide broken images and show placeholder
                                      const target = e.target as HTMLImageElement;
                                      target.style.display = 'none';
                                      const placeholder = target.nextElementSibling as HTMLElement;
                                      if (placeholder) {
                                        placeholder.style.display = 'flex';
                                      }
                                    }}
                                  />
                                ) : null}
                                <div 
                                  id={`observation-no-photo-${obs.id}`} 
                                  className="w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center flex-shrink-0"
                                  style={{ display: obs.photoUrl ? 'none' : 'flex' }}
                                >
                                  <span className="text-gray-400 text-xs">No photo</span>
                                </div>

                                {/* Details */}
                                <div id={`observation-details-${obs.id}`} className="flex-1 min-w-0">
                                  <div id={`observation-header-${obs.id}`} className="flex items-start justify-between">
                                    <div id={`observation-names-${obs.id}`} className="min-w-0 flex-1">
                                      <p id={`observation-common-name-${obs.id}`} className="text-sm font-medium text-gray-900 truncate">
                                        {obs.commonName || 'Unknown'}
                                      </p>
                                      <p id={`observation-scientific-name-${obs.id}`} className="text-xs text-gray-500 italic truncate">
                                        {obs.scientificName}
                                      </p>
                                    </div>
                                    <a
                                      id={`observation-link-${obs.id}`}
                                      href={obs.uri}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="ml-2 text-blue-600 hover:text-blue-800"
                                      onClick={(e) => e.stopPropagation()}
                                    >
                                      <ExternalLink id={`observation-external-icon-${obs.id}`} className="w-3 h-3" />
                                    </a>
                                  </div>
                                  
                                  <div id={`observation-metadata-${obs.id}`} className="mt-1 flex items-center space-x-3 text-xs text-gray-500">
                                    <div id={`observation-date-${obs.id}`} className="flex items-center space-x-1">
                                      <Calendar id={`observation-date-icon-${obs.id}`} className="w-3 h-3" />
                                      <span id={`observation-date-text-${obs.id}`}>{new Date(obs.observedOn).toLocaleDateString()}</span>
                                    </div>
                                    <div id={`observation-observer-${obs.id}`} className="flex items-center space-x-1">
                                      <User id={`observation-observer-icon-${obs.id}`} className="w-3 h-3" />
                                      <span id={`observation-observer-text-${obs.id}`} className="truncate">{obs.observer}</span>
                                    </div>
                                  </div>

                                  <div id={`observation-badges-${obs.id}`} className="mt-1 flex flex-wrap gap-1">
                                    <span id={`observation-quality-badge-${obs.id}`} className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                                      obs.qualityGrade === 'research' 
                                        ? 'bg-green-100 text-green-800'
                                        : obs.qualityGrade === 'needs_id'
                                        ? 'bg-yellow-100 text-yellow-800'
                                        : 'bg-gray-100 text-gray-800'
                                    }`}>
                                      {obs.qualityGrade === 'research' ? 'Research Grade' : 
                                       obs.qualityGrade === 'needs_id' ? 'Needs ID' : 'Casual'}
                                    </span>
                                    {((obs as any).geoprivacy === 'obscured' || (obs as any).geoprivacy === 'private') && (
                                      <span id={`observation-geoprivacy-badge-${obs.id}`} className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800" title="Location obscured for privacy/conservation">
                                        📍 Location Hidden
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}

          {groupedObservations.length === 0 && (
            <div id="no-observations-message" className="text-center py-8">
              <p id="no-observations-text" className="text-gray-500">No observations found</p>
            </div>
          )}
        </div>
      </div>

      {/* Observation Detail Modal */}
      {isModalOpen && selectedObservation && (
        <div 
          id="observation-modal-overlay" 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          onClick={closeModal}
        >
          <div 
            id="observation-modal-content"
            className="bg-white rounded-lg max-w-2xl max-h-[90vh] overflow-y-auto m-4 relative"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div id="observation-modal-header" className="sticky top-0 bg-white border-b border-gray-200 p-4 flex items-center justify-between">
              <h2 id="observation-modal-title" className="text-lg font-semibold text-gray-900 truncate">
                {selectedObservation.commonName || selectedObservation.scientificName || 'Unknown Species'}
              </h2>
              <button
                id="observation-modal-close"
                onClick={closeModal}
                className="p-1 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X id="observation-modal-close-icon" className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            {/* Modal Body */}
            <div id="observation-modal-body" className="p-6">
              {/* Photo */}
              {selectedObservation.photoUrl && (
                <div id="observation-modal-photo-container" className="mb-6">
                  <img
                    id="observation-modal-photo"
                    src={selectedObservation.photoUrl.replace('square', 'medium')} // Try to get larger image
                    alt={selectedObservation.commonName || selectedObservation.scientificName}
                    className="w-full max-w-md mx-auto rounded-lg shadow-sm"
                    onError={(e) => {
                      // Fallback to original URL if medium doesn't work
                      const target = e.target as HTMLImageElement;
                      if (target.src !== selectedObservation.photoUrl) {
                        target.src = selectedObservation.photoUrl;
                      }
                    }}
                  />
                </div>
              )}

              {/* Species Information */}
              <div id="observation-modal-species-info" className="mb-6">
                <h3 id="observation-modal-species-title" className="text-lg font-medium text-gray-900 mb-3">Species Information</h3>
                <div id="observation-modal-species-details" className="space-y-2">
                  {selectedObservation.commonName && (
                    <div id="observation-modal-common-name" className="flex items-start">
                      <span className="font-medium text-gray-700 w-24 flex-shrink-0">Common:</span>
                      <span className="text-gray-900">{selectedObservation.commonName}</span>
                    </div>
                  )}
                  <div id="observation-modal-scientific-name" className="flex items-start">
                    <span className="font-medium text-gray-700 w-24 flex-shrink-0">Scientific:</span>
                    <span className="text-gray-900 italic">{selectedObservation.scientificName}</span>
                  </div>
                </div>
              </div>

              {/* Observation Details */}
              <div id="observation-modal-observation-details" className="mb-6">
                <h3 id="observation-modal-details-title" className="text-lg font-medium text-gray-900 mb-3">Observation Details</h3>
                <div id="observation-modal-details-grid" className="space-y-3">
                  <div id="observation-modal-date" className="flex items-center space-x-2">
                    <Calendar id="observation-modal-date-icon" className="w-4 h-4 text-gray-500" />
                    <span className="font-medium text-gray-700">Observed:</span>
                    <span className="text-gray-900">{new Date(selectedObservation.observedOn).toLocaleDateString('en-US', { 
                      weekday: 'long', 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })}</span>
                  </div>
                  
                  <div id="observation-modal-observer" className="flex items-center space-x-2">
                    <User id="observation-modal-observer-icon" className="w-4 h-4 text-gray-500" />
                    <span className="font-medium text-gray-700">Observer:</span>
                    <span className="text-gray-900">{selectedObservation.observer}</span>
                  </div>

                  <div id="observation-modal-quality" className="flex items-center space-x-2">
                    <span className="font-medium text-gray-700">Quality Grade:</span>
                    <span className={`inline-flex px-2 py-1 rounded-full text-sm font-medium ${
                      selectedObservation.qualityGrade === 'research' 
                        ? 'bg-green-100 text-green-800'
                        : selectedObservation.qualityGrade === 'needs_id'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {selectedObservation.qualityGrade === 'research' ? 'Research Grade' : 
                       selectedObservation.qualityGrade === 'needs_id' ? 'Needs ID' : 'Casual'}
                    </span>
                  </div>

                  {(selectedObservation.geoprivacy === 'obscured' || selectedObservation.geoprivacy === 'private') && (
                    <div id="observation-modal-geoprivacy" className="flex items-start space-x-2">
                      <span className="font-medium text-gray-700">Location:</span>
                      <div className="flex flex-col">
                        <span className="inline-flex px-2 py-1 rounded-full text-sm font-medium bg-orange-100 text-orange-800">
                          📍 Location Hidden
                        </span>
                        <span className="text-xs text-gray-500 mt-1">
                          Exact coordinates obscured for privacy or conservation reasons
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div id="observation-modal-actions" className="flex space-x-3">
                <a
                  id="observation-modal-inaturalist-link"
                  href={selectedObservation.uri}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  <ExternalLink id="observation-modal-external-icon" className="w-4 h-4" />
                  <span>View on iNaturalist</span>
                </a>
                <button
                  id="observation-modal-close-button"
                  onClick={closeModal}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ObservationsSidebar;

