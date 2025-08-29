import React, { useState } from 'react';
import { ChevronDown, ChevronRight, ExternalLink, Calendar, User } from 'lucide-react';
import { ObservationGroup } from '../types';
import { iNaturalistObservation } from '../services/iNaturalistService';

interface ObservationsSidebarProps {
  observations: iNaturalistObservation[];
  loading: boolean;
}

const ObservationsSidebar: React.FC<ObservationsSidebarProps> = ({ observations, loading }) => {
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
      subcategory.observations.push({
        id: obs.id,
        commonName: obs.taxon.preferred_common_name,
        scientificName: obs.taxon.name,
        observedOn: obs.observed_on,
        observer: obs.user.login,
        photoUrl: obs.photos.length > 0 ? obs.photos[0].square_url : null,
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
      <div id="observations-sidebar" className="bg-white w-96 border-r border-gray-200 h-full overflow-hidden">
        <div className="p-4">
          <h2 className="text-base font-medium text-gray-900 mb-4">iNaturalist Observations</h2>
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div id="observations-sidebar" className="bg-white w-96 border-r border-gray-200 h-full overflow-hidden">
      <div className="p-4">
        {/* Header */}
        <div className="mb-4">
          <h2 className="text-base font-medium text-gray-900">iNaturalist Observations</h2>
          <p className="text-sm text-gray-500 mt-1">
            {observations.length} observations from the last 30 days
          </p>
        </div>

        {/* Grouped Observations */}
        <div className="space-y-2 overflow-y-auto max-h-[calc(100vh-200px)]">
          {groupedObservations.map((group) => (
            <div key={group.category} className="border border-gray-200 rounded-lg">
              {/* Category Header */}
              <button
                onClick={() => toggleCategory(group.category)}
                className="w-full flex items-center justify-between p-3 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center space-x-2">
                  <span className="text-lg">
                    {group.category === 'Flora' ? '🌿' : '🐾'}
                  </span>
                  <span className="font-medium text-gray-900">
                    {group.category} ({group.count})
                  </span>
                </div>
                {expandedCategories.has(group.category) ? (
                  <ChevronDown className="w-4 h-4 text-gray-400" />
                ) : (
                  <ChevronRight className="w-4 h-4 text-gray-400" />
                )}
              </button>

              {/* Subcategories */}
              {expandedCategories.has(group.category) && (
                <div className="border-t border-gray-100">
                  {group.subcategories.map((subcategory) => (
                    <div key={subcategory.iconicTaxon}>
                      {/* Subcategory Header */}
                      <button
                        onClick={() => toggleSubcategory(subcategory.iconicTaxon)}
                        className="w-full flex items-center justify-between p-3 pl-8 hover:bg-gray-50 transition-colors border-t border-gray-50 first:border-t-0"
                      >
                        <div className="flex items-center space-x-2">
                          <span className="text-sm">
                            {getIconForTaxon(subcategory.iconicTaxon)}
                          </span>
                          <span className="text-sm font-medium text-gray-700">
                            {subcategory.name} ({subcategory.count})
                          </span>
                        </div>
                        {expandedSubcategories.has(subcategory.iconicTaxon) ? (
                          <ChevronDown className="w-3 h-3 text-gray-400" />
                        ) : (
                          <ChevronRight className="w-3 h-3 text-gray-400" />
                        )}
                      </button>

                      {/* Individual Observations */}
                      {expandedSubcategories.has(subcategory.iconicTaxon) && (
                        <div className="bg-gray-50">
                          {subcategory.observations.map((obs) => (
                            <div key={obs.id} className="p-3 pl-12 border-t border-gray-100 first:border-t-0">
                              <div className="flex space-x-3">
                                {/* Photo */}
                                {obs.photoUrl ? (
                                  <img
                                    src={obs.photoUrl}
                                    alt={obs.commonName || obs.scientificName}
                                    className="w-12 h-12 rounded-lg object-cover flex-shrink-0"
                                  />
                                ) : (
                                  <div className="w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center flex-shrink-0">
                                    <span className="text-gray-400 text-xs">No photo</span>
                                  </div>
                                )}

                                {/* Details */}
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-start justify-between">
                                    <div className="min-w-0 flex-1">
                                      <p className="text-sm font-medium text-gray-900 truncate">
                                        {obs.commonName || 'Unknown'}
                                      </p>
                                      <p className="text-xs text-gray-500 italic truncate">
                                        {obs.scientificName}
                                      </p>
                                    </div>
                                    <a
                                      href={obs.uri}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="ml-2 text-blue-600 hover:text-blue-800"
                                    >
                                      <ExternalLink className="w-3 h-3" />
                                    </a>
                                  </div>
                                  
                                  <div className="mt-1 flex items-center space-x-3 text-xs text-gray-500">
                                    <div className="flex items-center space-x-1">
                                      <Calendar className="w-3 h-3" />
                                      <span>{new Date(obs.observedOn).toLocaleDateString()}</span>
                                    </div>
                                    <div className="flex items-center space-x-1">
                                      <User className="w-3 h-3" />
                                      <span className="truncate">{obs.observer}</span>
                                    </div>
                                  </div>

                                  <div className="mt-1">
                                    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
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
            <div className="text-center py-8">
              <p className="text-gray-500">No observations found</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ObservationsSidebar;

