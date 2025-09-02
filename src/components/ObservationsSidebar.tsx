import React, { useState } from 'react';
import { ChevronDown, ChevronRight, ExternalLink, Calendar, User } from 'lucide-react';
import { ObservationGroup } from '../types';
import { iNaturalistObservation } from '../services/iNaturalistService';
import { formatDateRangeCompact } from '../utils/dateUtils';

interface ObservationsSidebarProps {
  observations: iNaturalistObservation[];
  loading: boolean;
  currentDaysBack?: number;
}

const ObservationsSidebar: React.FC<ObservationsSidebarProps> = ({ observations, loading, currentDaysBack = 30 }) => {
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [expandedSubcategories, setExpandedSubcategories] = useState<Set<string>>(new Set());

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
      observations: any[];
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

  const groupedObservations = groupObservations();

  if (loading) {
    return (
      <div id="observations-sidebar-loading" className="bg-white w-96 border-r border-gray-200 h-full overflow-hidden">
        <div id="observations-sidebar-loading-content" className="p-4">
          <h2 id="observations-sidebar-loading-title" className="text-base font-medium text-gray-900 mb-4">iNaturalist Observations</h2>
          <div id="observations-loading-container" className="flex items-center justify-center h-32">
            <div id="observations-loading-spinner" className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div id="observations-sidebar" className="bg-white w-96 border-r border-gray-200 h-full overflow-hidden">
      <div id="observations-sidebar-content" className="p-4">
        {/* Header */}
        <div id="observations-sidebar-header" className="mb-4">
          <h2 id="observations-sidebar-title" className="text-base font-medium text-gray-900">iNaturalist Observations</h2>
          <p id="observations-count-text" className="text-sm text-gray-500 mt-1">
            {observations.length} observations from the {formatDateRangeCompact(currentDaysBack).toLowerCase()}
          </p>
        </div>

        {/* Grouped Observations */}
        <div id="observations-groups-container" className="space-y-2 overflow-y-auto max-h-[calc(100vh-200px)]">
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
                            <div key={obs.id} id={`observation-${obs.id}`} className="p-3 pl-12 border-t border-gray-100 first:border-t-0">
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

                                  <div id={`observation-quality-${obs.id}`} className="mt-1">
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
    </div>
  );
};

export default ObservationsSidebar;

