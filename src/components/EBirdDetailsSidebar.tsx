import React, { useState, useEffect, useMemo } from 'react';
import { X, Calendar, MapPin, ExternalLink, Download, ShoppingCart, Filter, Hash, Clock } from 'lucide-react';
import { EBirdObservation } from '../services/eBirdService';
import { getBirdTaxonInfo, BirdTaxonInfo } from '../services/birdPhotoService';

interface EBirdDetailsSidebarProps {
  dataSourceLabel: string;
  selectedObservation: EBirdObservation | null;
  observations: EBirdObservation[];
  dateRangeText: string;
  // Filter props
  speciesFilter?: string;
  onSpeciesFilterChange?: (name: string) => void;
  // Export & cart actions
  onExportCSV: () => void;
  onExportGeoJSON: () => void;
  onAddToCart?: (filteredCount: number) => void;
  onClose: () => void;
  hasSearched: boolean;
}

type TabType = 'details' | 'export';

const EBirdDetailsSidebar: React.FC<EBirdDetailsSidebarProps> = ({
  dataSourceLabel,
  selectedObservation,
  observations,
  dateRangeText,
  speciesFilter = '',
  onSpeciesFilterChange,
  onExportCSV,
  onExportGeoJSON,
  onAddToCart,
  onClose,
  hasSearched
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('export');
  const [taxonInfo, setTaxonInfo] = useState<BirdTaxonInfo | null>(null);
  const [photoLoading, setPhotoLoading] = useState(false);

  // Calculate filtered observations based on filters
  const filteredObservations = useMemo(() => {
    let filtered = observations;

    // Apply species name filter
    if (speciesFilter && speciesFilter.trim()) {
      const searchTerm = speciesFilter.toLowerCase();
      filtered = filtered.filter(obs =>
        obs.common_name?.toLowerCase().includes(searchTerm) ||
        obs.scientific_name?.toLowerCase().includes(searchTerm)
      );
    }

    return filtered;
  }, [observations, speciesFilter]);

  // Check if filters are active
  const hasFiltersActive = useMemo(() => {
    return speciesFilter && speciesFilter.trim();
  }, [speciesFilter]);

  // Calculate unique species count
  const uniqueSpeciesCount = useMemo(() => {
    const species = new Set(filteredObservations.map(obs => obs.scientific_name));
    return species.size;
  }, [filteredObservations]);

  // Calculate total individuals count
  const totalIndividuals = useMemo(() => {
    return filteredObservations.reduce((sum, obs) => sum + obs.count_observed, 0);
  }, [filteredObservations]);

  // Switch to details tab when an observation is selected
  useEffect(() => {
    if (selectedObservation) {
      setActiveTab('details');
    }
  }, [selectedObservation]);

  // Fetch bird photo when observation changes
  useEffect(() => {
    if (!selectedObservation) {
      setTaxonInfo(null);
      return;
    }

    setPhotoLoading(true);
    getBirdTaxonInfo(selectedObservation.scientific_name)
      .then(info => setTaxonInfo(info))
      .finally(() => setPhotoLoading(false));
  }, [selectedObservation?.scientific_name]);

  // Helper to format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  // Render tab buttons
  const renderTabButtons = () => (
    <div id="ebird-details-tabs" className="flex border-b border-gray-200">
      <button
        id="ebird-details-tab-button"
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
        id="ebird-export-tab-button"
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
    if (!selectedObservation) {
      return (
        <div id="ebird-details-empty-state" className="flex flex-col items-center justify-center h-full p-8 text-center">
          <div id="ebird-details-empty-icon" className="mb-4">
            <span className="text-6xl">🐦</span>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Bird Selected</h3>
          <p className="text-sm text-gray-600">
            Click a bird observation in the left sidebar or on the map to view detailed information
          </p>
        </div>
      );
    }

    return (
      <div id="ebird-details-content" className="flex-1 overflow-y-auto">
        {/* Header with close button */}
        <div id="ebird-details-header" className="p-4 border-b border-gray-200 bg-gradient-to-r from-green-50 to-emerald-50">
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-lg">🐦</span>
                <span className="text-xs font-medium text-gray-600">{dataSourceLabel}</span>
              </div>
              <h2 className="text-lg font-semibold text-gray-900 break-words">
                {selectedObservation.common_name || selectedObservation.scientific_name}
              </h2>
              {selectedObservation.common_name && selectedObservation.scientific_name && (
                <p className="text-sm text-gray-600 italic mt-1">
                  {selectedObservation.scientific_name}
                </p>
              )}
            </div>
            <button
              id="ebird-close-details-button"
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
        <div id="ebird-details-photo-section" className="p-4 border-b border-gray-200">
          {photoLoading ? (
            <div className="w-full h-48 bg-gray-100 rounded-lg flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
            </div>
          ) : taxonInfo?.photoUrl ? (
            <>
              <img
                id="ebird-details-photo"
                src={taxonInfo.photoUrl}
                alt={selectedObservation.common_name || selectedObservation.scientific_name}
                className="w-full rounded-lg"
                loading="lazy"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                }}
              />
              {taxonInfo.photoAttribution && (
                <p className="mt-2 text-xs text-gray-500 italic">
                  Photo: {taxonInfo.photoAttribution}
                </p>
              )}
            </>
          ) : (
            <div className="w-full h-32 bg-gray-100 rounded-lg flex flex-col items-center justify-center">
              <span className="text-4xl mb-2">🐦</span>
              <p className="text-xs text-gray-500">No photo available</p>
            </div>
          )}
        </div>

        {/* Metadata */}
        <div id="ebird-details-metadata" className="p-4 space-y-4">
          {/* Count */}
          <div id="ebird-count-info" className="flex items-start gap-3">
            <Hash className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Count Observed</p>
              <p className="text-sm text-gray-900 font-medium">
                {selectedObservation.count_observed.toLocaleString()} individual{selectedObservation.count_observed !== 1 ? 's' : ''}
              </p>
            </div>
          </div>

          {/* Date */}
          <div id="ebird-date-info" className="flex items-start gap-3">
            <Calendar className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Observed On</p>
              <p className="text-sm text-gray-900">{formatDate(selectedObservation.observation_date)}</p>
            </div>
          </div>

          {/* Time */}
          {selectedObservation.obstime && (
            <div id="ebird-time-info" className="flex items-start gap-3">
              <Clock className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Time</p>
                <p className="text-sm text-gray-900">{selectedObservation.obstime}</p>
              </div>
            </div>
          )}

          {/* Location */}
          <div id="ebird-location-info" className="flex items-start gap-3">
            <MapPin className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Location</p>
              <p className="text-sm text-gray-900">{selectedObservation.location_name}</p>
              <p className="text-xs text-gray-500 mt-1">
                {selectedObservation.county}, {selectedObservation.state}
              </p>
            </div>
          </div>

          {/* Coordinates */}
          <div id="ebird-coords-info" className="flex items-start gap-3">
            <div className="w-5 h-5 flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-gray-400 text-sm">📍</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Coordinates</p>
              <p className="text-sm text-gray-900 font-mono">
                {selectedObservation.lat.toFixed(5)}, {selectedObservation.lng.toFixed(5)}
              </p>
            </div>
          </div>

          {/* Protocol */}
          <div id="ebird-protocol-info" className="flex items-start gap-3">
            <div className="w-5 h-5 flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-gray-400 text-sm">📋</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Protocol</p>
              <p className="text-sm text-gray-900">{selectedObservation.protocol_name}</p>
            </div>
          </div>

          {/* Wikipedia Summary */}
          {taxonInfo?.wikipediaSummary && (
            <div id="ebird-wikipedia-info" className="pt-4 border-t border-gray-200">
              <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">About This Species</p>
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-sm text-gray-700 line-clamp-4">
                  {taxonInfo.wikipediaSummary}
                </p>
                {taxonInfo.wikipediaUrl && (
                  <a
                    href={taxonInfo.wikipediaUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-blue-600 hover:text-blue-700 mt-2 inline-block"
                  >
                    Read more on Wikipedia →
                  </a>
                )}
              </div>
            </div>
          )}

          {/* External Links */}
          <div id="ebird-external-links-section" className="pt-4 border-t border-gray-200 space-y-2">
            <a
              id="view-on-ebird-link"
              href={`https://ebird.org/checklist/${selectedObservation.obsid}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full px-4 py-3 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors"
            >
              <ExternalLink className="w-4 h-4" />
              View on eBird
            </a>
            {taxonInfo?.taxonId && (
              <a
                id="view-on-inaturalist-link"
                href={`https://www.inaturalist.org/taxa/${taxonInfo.taxonId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-lg transition-colors text-sm"
              >
                <ExternalLink className="w-4 h-4" />
                View on iNaturalist
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
        <div id="ebird-export-empty-state" className="flex flex-col items-center justify-center h-full p-8 text-center">
          <div id="ebird-export-empty-icon" className="mb-4">
            <span className="text-6xl">🐦</span>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Search Yet</h3>
          <p className="text-sm text-gray-600">
            Perform a search to see export options
          </p>
        </div>
      );
    }

    return (
      <div id="ebird-export-content" className="flex flex-col h-full">
        {/* Header */}
        <div id="ebird-export-header" className="p-4 border-b border-gray-200 bg-white">
          <h3 className="text-sm font-medium text-gray-900 mb-2 flex items-center gap-2">
            <span>🐦</span> {dataSourceLabel}
          </h3>
          <p className="text-sm">
            {hasFiltersActive && filteredObservations.length !== observations.length ? (
              <>
                <span className="font-semibold text-green-600">{filteredObservations.length.toLocaleString()} filtered</span>
                <span className="text-gray-400 mx-1">/</span>
                <span className="text-gray-600">{observations.length.toLocaleString()} total observations</span>
                <span className="text-gray-600"> {dateRangeText}</span>
              </>
            ) : (
              <span className="text-gray-600">{observations.length.toLocaleString()} observations {dateRangeText}</span>
            )}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            {uniqueSpeciesCount} species • {totalIndividuals.toLocaleString()} total individuals
          </p>
        </div>

        {/* Filters Section */}
        <div id="ebird-export-filters" className="flex-1 overflow-y-auto p-4 space-y-6">
          {/* Species Search */}
          {onSpeciesFilterChange && (
            <div id="ebird-species-filter-section" className="space-y-3">
              <h4 className="text-sm font-medium text-gray-900 flex items-center">
                <Filter className="w-4 h-4 mr-2" />
                Species Search
              </h4>
              <input
                id="ebird-species-input"
                type="text"
                value={speciesFilter}
                onChange={(e) => onSpeciesFilterChange(e.target.value)}
                placeholder="e.g., Pacific Loon, Gavia pacifica"
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              />
              <p className="text-xs text-gray-500">
                Search by common or scientific name
              </p>
            </div>
          )}

          {/* Filter Summary */}
          {hasFiltersActive && (
            <div id="ebird-filter-summary" className="p-3 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-sm text-green-800">
                <strong>Filters applied:</strong>
              </p>
              {speciesFilter && (
                <p className="text-xs text-green-700 mt-1">
                  • Species: "{speciesFilter}"
                </p>
              )}
            </div>
          )}
        </div>

        {/* Export Actions Footer */}
        <div id="ebird-export-actions" className="p-4 border-t border-gray-200 space-y-3">
          {/* Export Buttons */}
          <div id="ebird-export-buttons-section">
            <h4 className="text-sm font-medium text-gray-900 flex items-center mb-2">
              <Download className="w-4 h-4 mr-2" />
              Export Data
            </h4>
            <div className="grid grid-cols-2 gap-2">
              <button
                id="ebird-export-csv-button"
                onClick={onExportCSV}
                className="px-3 py-2 text-xs font-medium bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors border border-gray-300"
                disabled={observations.length === 0}
              >
                CSV
              </button>
              <button
                id="ebird-export-geojson-button"
                onClick={onExportGeoJSON}
                className="px-3 py-2 text-xs font-medium bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors border border-gray-300"
                disabled={observations.length === 0}
              >
                GeoJSON
              </button>
            </div>
          </div>

          {/* Add to Cart Button */}
          {onAddToCart && (
            <div id="ebird-add-to-cart-section" className="space-y-3">
              {/* Summary message */}
              <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-sm font-medium text-green-900">
                  {hasFiltersActive && filteredObservations.length !== observations.length ? (
                    <>
                      <span className="text-lg font-bold">{filteredObservations.length.toLocaleString()}</span> observations will be saved after applying filters
                    </>
                  ) : (
                    <>
                      <span className="text-lg font-bold">{observations.length.toLocaleString()}</span> observations will be saved
                    </>
                  )}
                </p>
                {hasFiltersActive && filteredObservations.length !== observations.length && (
                  <p className="text-xs text-green-700 mt-1">
                    Filtered from {observations.length.toLocaleString()} total observations
                  </p>
                )}
              </div>
              
              <button
                id="ebird-add-to-cart-button"
                onClick={() => onAddToCart(filteredObservations.length)}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={observations.length === 0}
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
    <div id="ebird-details-sidebar" className="w-sidebar-right-lg xl:w-sidebar-right-xl 2xl:w-sidebar-right-2xl bg-white border-l border-gray-200 flex flex-col h-full">
      {/* Tab Buttons */}
      {renderTabButtons()}

      {/* Tab Content */}
      <div className="flex-1 flex flex-col min-h-0">
        {activeTab === 'details' ? renderDetailsTab() : renderExportTab()}
      </div>
    </div>
  );
};

export default EBirdDetailsSidebar;
