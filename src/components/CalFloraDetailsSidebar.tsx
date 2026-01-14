import React, { useState, useEffect, useMemo } from 'react';
import { X, Calendar, User, MapPin, ExternalLink, Download, ShoppingCart, Filter } from 'lucide-react';
import { CalFloraPlant } from '../services/calFloraService';

interface CalFloraDetailsSidebarProps {
  dataSourceLabel: string;
  selectedPlant: CalFloraPlant | null;
  plants: CalFloraPlant[];
  dateRangeText: string;
  // Filter props
  nativeStatusFilter?: 'native' | 'invasive' | 'non-native' | 'unknown' | 'all';
  onNativeStatusFilterChange?: (status: 'native' | 'invasive' | 'non-native' | 'unknown' | 'all') => void;
  plantNameFilter?: string;
  onPlantNameFilterChange?: (name: string) => void;
  photoFilter?: 'any' | 'with' | 'without';
  onPhotoFilterChange?: (value: 'any' | 'with' | 'without') => void;
  // Export & cart actions
  onExportCSV: () => void;
  onExportGeoJSON: () => void;
  onAddToCart?: (filteredCount: number) => void;
  onClose: () => void;
  hasSearched: boolean;
}

type TabType = 'details' | 'export';

const CalFloraDetailsSidebar: React.FC<CalFloraDetailsSidebarProps> = ({
  dataSourceLabel,
  selectedPlant,
  plants,
  dateRangeText,
  nativeStatusFilter = 'all',
  onNativeStatusFilterChange: _onNativeStatusFilterChange,
  plantNameFilter = '',
  onPlantNameFilterChange,
  photoFilter = 'any',
  onPhotoFilterChange,
  onExportCSV,
  onExportGeoJSON,
  onAddToCart,
  onClose,
  hasSearched
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('export');

  // Calculate filtered plants based on filters
  const filteredPlants = useMemo(() => {
    let filtered = plants;

    // Apply native status filter
    if (nativeStatusFilter && nativeStatusFilter !== 'all') {
      filtered = filtered.filter(plant => plant.nativeStatus === nativeStatusFilter);
    }

    // Apply plant name filter
    if (plantNameFilter && plantNameFilter.trim()) {
      const searchTerm = plantNameFilter.toLowerCase();
      filtered = filtered.filter(plant =>
        plant.commonName?.toLowerCase().includes(searchTerm) ||
        plant.scientificName?.toLowerCase().includes(searchTerm) ||
        plant.family?.toLowerCase().includes(searchTerm)
      );
    }

    // Apply photo filter
    if (photoFilter === 'with') {
      filtered = filtered.filter(plant => plant.attributes?.photo);
    } else if (photoFilter === 'without') {
      filtered = filtered.filter(plant => !plant.attributes?.photo);
    }

    return filtered;
  }, [plants, nativeStatusFilter, plantNameFilter, photoFilter]);

  // Check if filters are active
  const hasFiltersActive = useMemo(() => {
    return (
      (nativeStatusFilter && nativeStatusFilter !== 'all') ||
      (plantNameFilter && plantNameFilter.trim()) ||
      (photoFilter && photoFilter !== 'any')
    );
  }, [nativeStatusFilter, plantNameFilter, photoFilter]);

  // Switch to details tab when a plant is selected
  useEffect(() => {
    if (selectedPlant) {
      setActiveTab('details');
    }
  }, [selectedPlant]);

  // Helper to format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };


  // Render tab buttons
  const renderTabButtons = () => (
    <div id="calflora-details-tabs" className="flex border-b border-gray-200">
      <button
        id="calflora-details-tab-button"
        onClick={() => setActiveTab('details')}
        className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
          activeTab === 'details'
            ? 'text-green-600 bg-white border-x border-gray-200 relative z-10 -mb-px'
            : 'text-gray-600 hover:text-gray-900 bg-gray-50 shadow-[inset_-4px_0_6px_-2px_rgba(0,0,0,0.12),inset_0_-4px_6px_-2px_rgba(0,0,0,0.08)]'
        }`}
      >
        Details
      </button>
      <button
        id="calflora-export-tab-button"
        onClick={() => setActiveTab('export')}
        className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
          activeTab === 'export'
            ? 'text-green-600 bg-white border-x border-gray-200 relative z-10 -mb-px'
            : 'text-gray-600 hover:text-gray-900 bg-gray-50 shadow-[inset_4px_0_6px_-2px_rgba(0,0,0,0.12),inset_0_-4px_6px_-2px_rgba(0,0,0,0.08)]'
        }`}
      >
        Export All
      </button>
    </div>
  );

  // Render Details Tab
  const renderDetailsTab = () => {
    if (!selectedPlant) {
      return (
        <div id="calflora-details-empty-state" className="flex flex-col items-center justify-center h-full p-8 text-center">
          <div id="calflora-details-empty-icon" className="mb-4">
            <span className="text-6xl">🌸</span>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Plant Selected</h3>
          <p className="text-sm text-gray-600">
            Click a plant card in the left sidebar or a map marker to view detailed information
          </p>
        </div>
      );
    }

    return (
      <div id="calflora-details-content" className="flex-1 overflow-y-auto">
        {/* Header with close button */}
        <div id="calflora-details-header" className="p-4 border-b border-gray-200 bg-gradient-to-r from-green-50 to-emerald-50">
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-lg">🌸</span>
                <span className="text-xs font-medium text-gray-600">{dataSourceLabel}</span>
              </div>
              <h2 className="text-lg font-semibold text-gray-900 break-words">
                {selectedPlant.commonName || selectedPlant.scientificName}
              </h2>
              {selectedPlant.commonName && selectedPlant.scientificName && (
                <p className="text-sm text-gray-600 italic mt-1">
                  {selectedPlant.scientificName}
                </p>
              )}
              {selectedPlant.family && (
                <p className="text-xs text-gray-500 mt-1">
                  Family: {selectedPlant.family}
                </p>
              )}
            </div>
            <button
              id="calflora-close-details-button"
              onClick={onClose}
              className="p-2 hover:bg-gray-200 rounded-full transition-colors ml-2 flex-shrink-0"
              aria-label="Close details"
              title="Close details"
            >
              <X className="w-5 h-5 text-gray-600" />
            </button>
          </div>
        </div>

        {/* Photo */}
        {selectedPlant.attributes?.photo && (
          <div id="calflora-details-photo-section" className="p-4 border-b border-gray-200">
            <img
              id="calflora-details-photo"
              src={selectedPlant.attributes.photo}
              alt={selectedPlant.commonName || selectedPlant.scientificName}
              className="w-full rounded-lg"
              loading="lazy"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
              }}
            />
            <p className="mt-2 text-xs text-gray-500 italic">
              Photo courtesy of CalFlora.org
            </p>
          </div>
        )}

        {/* Metadata */}
        <div id="calflora-details-metadata" className="p-4 space-y-4">
          {/* Observer */}
          {selectedPlant.attributes?.observer && (
            <div id="calflora-observer-info" className="flex items-start gap-3">
              <User className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Observer</p>
                <p className="text-sm text-gray-900">{selectedPlant.attributes.observer}</p>
              </div>
            </div>
          )}

          {/* Date */}
          {selectedPlant.observationDate && (
            <div id="calflora-date-info" className="flex items-start gap-3">
              <Calendar className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Observed On</p>
                <p className="text-sm text-gray-900">{formatDate(selectedPlant.observationDate)}</p>
              </div>
            </div>
          )}

          {/* County/Location */}
          {selectedPlant.county && (
            <div id="calflora-county-info" className="flex items-start gap-3">
              <MapPin className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">County</p>
                <p className="text-sm text-gray-900">{selectedPlant.county}</p>
              </div>
            </div>
          )}

          {/* Elevation */}
          {selectedPlant.elevation && (
            <div id="calflora-elevation-info" className="flex items-start gap-3">
              <div className="w-5 h-5 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-gray-400 text-sm">⛰️</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Elevation</p>
                <p className="text-sm text-gray-900">{selectedPlant.elevation} feet</p>
              </div>
            </div>
          )}

          {/* Habitat */}
          {selectedPlant.attributes?.habitat && (
            <div id="calflora-habitat-info" className="flex items-start gap-3">
              <div className="w-5 h-5 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-gray-400 text-sm">🌿</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Habitat</p>
                <p className="text-sm text-gray-900">{selectedPlant.attributes.habitat}</p>
              </div>
            </div>
          )}

          {/* Associated Species */}
          {selectedPlant.attributes?.associatedSpecies && (
            <div id="calflora-associated-species-info" className="flex items-start gap-3">
              <div className="w-5 h-5 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-gray-400 text-sm">🌱</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Associated Species</p>
                <p className="text-sm text-gray-900">{selectedPlant.attributes.associatedSpecies}</p>
              </div>
            </div>
          )}

          {/* Notes */}
          {selectedPlant.attributes?.notes && (
            <div id="calflora-notes-info" className="pt-4 border-t border-gray-200">
              <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">Notes</p>
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-sm text-gray-700 whitespace-pre-wrap">{selectedPlant.attributes.notes}</p>
              </div>
            </div>
          )}

          {/* Citation */}
          {selectedPlant.attributes?.citation && (
            <div id="calflora-citation-info" className="pt-4 border-t border-gray-200">
              <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">Citation</p>
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-sm text-gray-700">{selectedPlant.attributes.citation}</p>
              </div>
            </div>
          )}

          {/* External Links */}
          <div id="calflora-external-links-section" className="pt-4 border-t border-gray-200 space-y-2">
            {selectedPlant.attributes?.id && (
              <a
                id="view-on-calflora-link"
                href={`https://www.calflora.org/occ/entry/${selectedPlant.attributes.id}.html`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full px-4 py-3 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors"
              >
                <ExternalLink className="w-4 h-4" />
                View on CalFlora
              </a>
            )}
            {selectedPlant.scientificName && (
              <a
                id="calflora-all-observations-link"
                href={`https://www.calflora.org/occurrences/search.html?taxon=${encodeURIComponent(selectedPlant.scientificName)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-lg transition-colors text-sm"
              >
                <ExternalLink className="w-4 h-4" />
                All Observations of This Species
              </a>
            )}
          </div>
        </div>
      </div>
    );
  };

  // Render Export Tab
  const renderExportTab = () => {
    if (!hasSearched) {
      return (
        <div id="calflora-export-empty-state" className="flex flex-col items-center justify-center h-full p-8 text-center">
          <div id="calflora-export-empty-icon" className="mb-4">
            <span className="text-6xl">🌸</span>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Search Yet</h3>
          <p className="text-sm text-gray-600">
            Perform a search to see export options
          </p>
        </div>
      );
    }

    return (
      <div id="calflora-export-content" className="flex flex-col h-full">
        {/* Header */}
        <div id="calflora-export-header" className="p-4 border-b border-gray-200 bg-white">
          <h3 className="text-sm font-medium text-gray-900 mb-2 flex items-center gap-2">
            <span>🌸</span> {dataSourceLabel}
          </h3>
          <p className="text-sm">
            {hasFiltersActive && filteredPlants.length !== plants.length ? (
              <>
                <span className="font-semibold text-green-600">{filteredPlants.length} filtered</span>
                <span className="text-gray-400 mx-1">/</span>
                <span className="text-gray-600">{plants.length} total plants</span>
                <span className="text-gray-600"> {dateRangeText}</span>
              </>
            ) : (
              <span className="text-gray-600">{plants.length} total plants {dateRangeText}</span>
            )}
          </p>
        </div>

        {/* Filters Section */}
        <div id="calflora-export-filters" className="flex-1 overflow-y-auto p-4 space-y-6">
          {/* Plant Name Search */}
          {onPlantNameFilterChange && (
            <div id="calflora-plant-name-filter-section" className="space-y-3">
              <h4 className="text-sm font-medium text-gray-900 flex items-center">
                <Filter className="w-4 h-4 mr-2" />
                Plant Search
              </h4>
              <input
                id="calflora-plant-name-input"
                type="text"
                value={plantNameFilter}
                onChange={(e) => onPlantNameFilterChange(e.target.value)}
                placeholder="e.g., Quercus agrifolia"
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              />
              <p className="text-xs text-gray-500">
                Search by scientific name, common name, or family
              </p>
            </div>
          )}

          {/* Photo Filter */}
          {onPhotoFilterChange && (
            <div id="calflora-photo-filter-section" className="space-y-3">
              <h4 className="text-sm font-medium text-gray-900 flex items-center">
                <Filter className="w-4 h-4 mr-2" />
                Photos
              </h4>
              <div className="space-y-2">
                <label className="flex items-center cursor-pointer">
                  <input
                    type="radio"
                    name="photoFilter"
                    checked={photoFilter === 'any'}
                    onChange={() => onPhotoFilterChange('any')}
                    className="mr-2 cursor-pointer"
                  />
                  <span className="text-sm text-gray-700">Any (with or without photos)</span>
                </label>
                <label className="flex items-center cursor-pointer">
                  <input
                    type="radio"
                    name="photoFilter"
                    checked={photoFilter === 'with'}
                    onChange={() => onPhotoFilterChange('with')}
                    className="mr-2 cursor-pointer"
                  />
                  <span className="text-sm text-gray-700">Has photos</span>
                </label>
                <label className="flex items-center cursor-pointer">
                  <input
                    type="radio"
                    name="photoFilter"
                    checked={photoFilter === 'without'}
                    onChange={() => onPhotoFilterChange('without')}
                    className="mr-2 cursor-pointer"
                  />
                  <span className="text-sm text-gray-700">No photos</span>
                </label>
              </div>
            </div>
          )}
        </div>

        {/* Export Actions Footer */}
        <div id="calflora-export-actions" className="p-4 border-t border-gray-200 space-y-3">
          {/* Export Buttons */}
          <div id="calflora-export-buttons-section">
            <h4 className="text-sm font-medium text-gray-900 flex items-center mb-2">
              <Download className="w-4 h-4 mr-2" />
              Export Data
            </h4>
            <div className="grid grid-cols-2 gap-2">
              <button
                id="calflora-export-csv-button"
                onClick={onExportCSV}
                className="px-3 py-2 text-xs font-medium bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors border border-gray-300"
                disabled={plants.length === 0}
              >
                CSV
              </button>
              <button
                id="calflora-export-geojson-button"
                onClick={onExportGeoJSON}
                className="px-3 py-2 text-xs font-medium bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors border border-gray-300"
                disabled={plants.length === 0}
              >
                GeoJSON
              </button>
            </div>
          </div>

          {/* Add to Cart Button */}
          {onAddToCart && (
            <div id="calflora-add-to-cart-section" className="space-y-3">
              {/* Summary message */}
              <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-sm font-medium text-green-900">
                  {hasFiltersActive && filteredPlants.length !== plants.length ? (
                    <>
                      <span className="text-lg font-bold">{filteredPlants.length}</span> plants will be saved after applying filters
                    </>
                  ) : (
                    <>
                      <span className="text-lg font-bold">{plants.length}</span> plants will be saved
                    </>
                  )}
                </p>
                {hasFiltersActive && filteredPlants.length !== plants.length && (
                  <p className="text-xs text-green-700 mt-1">
                    Filtered from {plants.length} total plants
                  </p>
                )}
              </div>
              
              <button
                id="calflora-add-to-cart-button"
                onClick={() => onAddToCart(filteredPlants.length)}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={plants.length === 0}
              >
                <ShoppingCart className="w-4 h-4" />
                Add to Cart
              </button>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div id="calflora-details-sidebar" className="w-sidebar-right-lg xl:w-sidebar-right-xl 2xl:w-sidebar-right-2xl bg-white border-l border-gray-200 flex flex-col h-full">
      {/* Tab Buttons */}
      {renderTabButtons()}

      {/* Tab Content */}
      <div className="flex-1 flex flex-col min-h-0">
        {activeTab === 'details' ? renderDetailsTab() : renderExportTab()}
      </div>
    </div>
  );
};

export default CalFloraDetailsSidebar;

