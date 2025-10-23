import React, { useState, useEffect } from 'react';
import { X, Calendar, User, MapPin, ExternalLink, Download, ShoppingCart, Filter } from 'lucide-react';
import { INaturalistUnifiedObservation } from './INaturalistSidebar';

interface INaturalistDetailsSidebarProps {
  dataSourceLabel: string;
  selectedObservation: INaturalistUnifiedObservation | null;
  observations: INaturalistUnifiedObservation[];
  dateRangeText: string;
  qualityGrade?: 'research' | 'needs_id' | 'casual' | undefined;
  onQualityGradeChange: (grade: 'research' | 'needs_id' | 'casual' | undefined) => void;
  // Custom filter props
  iconicTaxa?: string[];
  onIconicTaxaChange?: (taxa: string[]) => void;
  taxonName?: string;
  onTaxonNameChange?: (name: string) => void;
  hasPhotos?: boolean;
  onHasPhotosChange?: (value: boolean) => void;
  geoprivacy?: 'open' | 'obscured' | 'private' | undefined;
  onGeoprivacyChange?: (value: 'open' | 'obscured' | 'private' | undefined) => void;
  accBelow?: number;
  onAccBelowChange?: (value: number) => void;
  // Export & cart actions
  onExportCSV: () => void;
  onExportGeoJSON: () => void;
  onAddToCart?: () => void;
  onClose: () => void;
  hasSearched: boolean;
}

type TabType = 'details' | 'export';

const INaturalistDetailsSidebar: React.FC<INaturalistDetailsSidebarProps> = ({
  dataSourceLabel,
  selectedObservation,
  observations,
  dateRangeText,
  qualityGrade,
  onQualityGradeChange,
  iconicTaxa = [],
  onIconicTaxaChange,
  taxonName = '',
  onTaxonNameChange,
  hasPhotos = false,
  onHasPhotosChange,
  geoprivacy,
  onGeoprivacyChange,
  accBelow = 1000,
  onAccBelowChange,
  onExportCSV,
  onExportGeoJSON,
  onAddToCart,
  onClose,
  hasSearched
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('export');

  // Switch to details tab when an observation is selected
  useEffect(() => {
    if (selectedObservation) {
      setActiveTab('details');
    }
  }, [selectedObservation]);

  // Helper function to format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  // Render tab buttons
  const renderTabButtons = () => (
    <div id="inaturalist-details-tabs" className="flex border-b border-gray-200">
      <button
        id="details-tab-button"
        onClick={() => setActiveTab('details')}
        className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
          activeTab === 'details'
            ? 'text-blue-600 bg-white border-x border-gray-200 relative z-10 -mb-px'
            : 'text-gray-600 hover:text-gray-900 bg-gray-50 shadow-[inset_-4px_0_6px_-2px_rgba(0,0,0,0.12),inset_0_-4px_6px_-2px_rgba(0,0,0,0.08)]'
        }`}
      >
        Details
      </button>
      <button
        id="export-tab-button"
        onClick={() => setActiveTab('export')}
        className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
          activeTab === 'export'
            ? 'text-blue-600 bg-white border-x border-gray-200 relative z-10 -mb-px'
            : 'text-gray-600 hover:text-gray-900 bg-gray-50 shadow-[inset_4px_0_6px_-2px_rgba(0,0,0,0.12),inset_0_-4px_6px_-2px_rgba(0,0,0,0.08)]'
        }`}
      >
        Export
      </button>
    </div>
  );

  // Render Details Tab
  const renderDetailsTab = () => {
    if (!selectedObservation) {
      return (
        <div id="details-empty-state" className="flex flex-col items-center justify-center h-full p-8 text-center">
          <div id="details-empty-icon" className="mb-4">
            <svg className="w-16 h-16 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Observation Selected</h3>
          <p className="text-sm text-gray-600">
            Click an observation card in the left sidebar to view detailed information
          </p>
        </div>
      );
    }

    return (
      <div id="details-content" className="flex-1 overflow-y-auto">
        {/* Header with close button */}
        <div id="details-header" className="p-4 border-b border-gray-200 bg-white">
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-medium text-gray-600">{dataSourceLabel}</span>
              </div>
              <h2 className="text-lg font-semibold text-gray-900 break-words">
                {selectedObservation.commonName || selectedObservation.scientificName}
              </h2>
              {selectedObservation.commonName && selectedObservation.scientificName && (
                <p className="text-sm text-gray-600 italic mt-1">
                  {selectedObservation.scientificName}
                </p>
              )}
            </div>
            <button
              id="close-details-button"
              onClick={onClose}
              className="p-2 hover:bg-gray-200 rounded-full transition-colors ml-2 flex-shrink-0"
              aria-label="Close details"
            >
              <X className="w-5 h-5 text-gray-600" />
            </button>
          </div>
        </div>

        {/* Photo */}
        {selectedObservation.photoUrl && (
          <div id="details-photo-section" className="p-4 border-b border-gray-200">
            <img
              id="details-photo"
              src={selectedObservation.photoUrl}
              alt={selectedObservation.commonName || selectedObservation.scientificName}
              className="w-full rounded-lg"
              loading="lazy"
            />
            {selectedObservation.photoAttribution && (
              <p className="mt-2 text-xs text-gray-500">
                {selectedObservation.photoAttribution}
              </p>
            )}
          </div>
        )}

        {/* Metadata */}
        <div id="details-metadata" className="p-4 space-y-4">
          {/* Observer */}
          <div id="observer-info" className="flex items-start gap-3">
            <User className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Observer</p>
              <p className="text-sm text-gray-900">{selectedObservation.observerName}</p>
            </div>
          </div>

          {/* Date */}
          <div id="date-info" className="flex items-start gap-3">
            <Calendar className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Observed On</p>
              <p className="text-sm text-gray-900">{formatDate(selectedObservation.observedOn)}</p>
            </div>
          </div>

          {/* Location */}
          {selectedObservation.location && (
            <div id="location-info" className="flex items-start gap-3">
              <MapPin className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Location</p>
                <p className="text-sm text-gray-900 break-words">{selectedObservation.location}</p>
              </div>
            </div>
          )}

          {/* Quality Grade */}
          {selectedObservation.qualityGrade && (
            <div id="quality-grade-info" className="flex items-start gap-3">
              <div className="w-5 h-5 flex items-center justify-center flex-shrink-0 mt-0.5">
                <div className={`w-3 h-3 rounded-full ${
                  selectedObservation.qualityGrade === 'research' ? 'bg-green-500' :
                  selectedObservation.qualityGrade === 'needs_id' ? 'bg-yellow-500' :
                  'bg-gray-400'
                }`} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Quality Grade</p>
                <p className={`text-sm font-medium capitalize ${
                  selectedObservation.qualityGrade === 'research' ? 'text-green-600' :
                  selectedObservation.qualityGrade === 'needs_id' ? 'text-yellow-600' :
                  'text-gray-600'
                }`}>
                  {selectedObservation.qualityGrade.replace('_', ' ')}
                </p>
              </div>
            </div>
          )}

          {/* Taxon ID */}
          {selectedObservation.taxonId && (
            <div id="taxon-id-info" className="flex items-start gap-3">
              <div className="w-5 h-5 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-gray-400 text-xs">#</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Taxon ID</p>
                <p className="text-sm text-gray-900">{selectedObservation.taxonId}</p>
              </div>
            </div>
          )}

          {/* Iconic Taxon */}
          <div id="iconic-taxon-info" className="flex items-start gap-3">
            <div className="w-5 h-5 flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-lg">🔬</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Iconic Taxon</p>
              <p className="text-sm text-gray-900">{selectedObservation.iconicTaxon}</p>
            </div>
          </div>

          {/* External Link */}
          <div id="external-link-section" className="pt-4 border-t border-gray-200">
            <a
              id="view-on-inaturalist-link"
              href={selectedObservation.uri}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full px-4 py-3 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors"
            >
              <ExternalLink className="w-4 h-4" />
              View on iNaturalist
            </a>
          </div>
        </div>
      </div>
    );
  };

  // Render Export Tab
  const renderExportTab = () => {
    if (!hasSearched) {
      return (
        <div id="export-empty-state" className="flex flex-col items-center justify-center h-full p-8 text-center">
          <div id="export-empty-icon" className="mb-4">
            <svg className="w-16 h-16 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Search Yet</h3>
          <p className="text-sm text-gray-600">
            Perform a search to see export options
          </p>
        </div>
      );
    }

    return (
      <div id="export-content" className="flex flex-col h-full">
        {/* Header */}
        <div id="export-header" className="p-4 border-b border-gray-200 bg-white">
          <h3 className="text-sm font-medium text-gray-900 mb-2">{dataSourceLabel}</h3>
          <p className="text-sm text-gray-600">
            {observations.length} observations {dateRangeText}
          </p>
        </div>

        {/* Filters Section */}
        <div id="export-filters" className="flex-1 overflow-y-auto p-4 space-y-6">
          {/* Quality Grade Filter */}
          <div id="quality-grade-filter-section" className="space-y-3">
            <h4 className="text-sm font-medium text-gray-900 flex items-center">
              <Filter className="w-4 h-4 mr-2" />
              Quality Grade
            </h4>
            <div className="space-y-2">
              {[
                { value: undefined, label: 'All Grades' },
                { value: 'research' as const, label: 'Research Grade' },
                { value: 'needs_id' as const, label: 'Needs ID' },
                { value: 'casual' as const, label: 'Casual' }
              ].map((option) => (
                <label key={option.label} id={`quality-grade-option-${option.label.toLowerCase().replace(/\s+/g, '-')}`} className="flex items-center">
                  <input
                    type="radio"
                    name="qualityGrade"
                    checked={qualityGrade === option.value}
                    onChange={() => onQualityGradeChange(option.value)}
                    className="mr-2"
                  />
                  <span className="text-sm text-gray-700">{option.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Iconic Taxa Filter */}
          {onIconicTaxaChange && (
            <div id="iconic-taxa-filter-section" className="space-y-3">
              <h4 className="text-sm font-medium text-gray-900 flex items-center">
                <Filter className="w-4 h-4 mr-2" />
                Taxonomic Groups
              </h4>
              <div className="space-y-2">
                {[
                  { value: 'Aves', label: 'Birds', icon: '🐦' },
                  { value: 'Mammalia', label: 'Mammals', icon: '🦌' },
                  { value: 'Reptilia', label: 'Reptiles', icon: '🦎' },
                  { value: 'Amphibia', label: 'Amphibians', icon: '🐸' },
                  { value: 'Actinopterygii', label: 'Fish', icon: '🐟' },
                  { value: 'Insecta', label: 'Insects', icon: '🦋' },
                  { value: 'Plantae', label: 'Plants', icon: '🌱' },
                  { value: 'Fungi', label: 'Fungi', icon: '🍄' }
                ].map((taxon) => (
                  <label key={taxon.value} id={`iconic-taxon-option-${taxon.value.toLowerCase()}`} className="flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={iconicTaxa.includes(taxon.value)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          onIconicTaxaChange([...iconicTaxa, taxon.value]);
                        } else {
                          onIconicTaxaChange(iconicTaxa.filter(t => t !== taxon.value));
                        }
                      }}
                      className="mr-2 cursor-pointer"
                    />
                    <span className="text-lg mr-2">{taxon.icon}</span>
                    <span className="text-sm text-gray-700">{taxon.label}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Taxon Name Search */}
          {onTaxonNameChange && (
            <div id="taxon-name-filter-section" className="space-y-3">
              <h4 className="text-sm font-medium text-gray-900 flex items-center">
                <Filter className="w-4 h-4 mr-2" />
                Species Search
              </h4>
              <input
                id="taxon-name-input"
                type="text"
                value={taxonName}
                onChange={(e) => onTaxonNameChange(e.target.value)}
                placeholder="e.g., Quercus agrifolia"
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-xs text-gray-500">
                Search by scientific or common name
              </p>
            </div>
          )}

          {/* Observation Attributes */}
          {onHasPhotosChange && (
            <div id="observation-attrs-filter-section" className="space-y-3">
              <h4 className="text-sm font-medium text-gray-900 flex items-center">
                <Filter className="w-4 h-4 mr-2" />
                Observation Attributes
              </h4>
              <label className="flex items-center cursor-pointer">
                <input
                  id="has-photos-checkbox"
                  type="checkbox"
                  checked={hasPhotos}
                  onChange={(e) => onHasPhotosChange(e.target.checked)}
                  className="mr-2 cursor-pointer"
                />
                <span className="text-sm text-gray-700">Has photos</span>
              </label>
            </div>
          )}

          {/* Geoprivacy */}
          {onGeoprivacyChange && (
            <div id="geoprivacy-filter-section" className="space-y-3">
              <h4 className="text-sm font-medium text-gray-900 flex items-center">
                <Filter className="w-4 h-4 mr-2" />
                Location Privacy
              </h4>
              <select
                id="geoprivacy-select"
                value={geoprivacy || 'any'}
                onChange={(e) => onGeoprivacyChange(e.target.value === 'any' ? undefined : e.target.value as 'open' | 'obscured' | 'private')}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="any">Any</option>
                <option value="open">Open</option>
                <option value="obscured">Obscured</option>
                <option value="private">Private</option>
              </select>
            </div>
          )}

          {/* Accuracy Threshold */}
          {onAccBelowChange && (
            <div id="accuracy-filter-section" className="space-y-3">
              <h4 className="text-sm font-medium text-gray-900 flex items-center">
                <Filter className="w-4 h-4 mr-2" />
                Location Accuracy
              </h4>
              <select
                id="accuracy-select"
                value={accBelow}
                onChange={(e) => onAccBelowChange(Number(e.target.value))}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value={100}>Within 100m</option>
                <option value={500}>Within 500m</option>
                <option value={1000}>Within 1km (default)</option>
                <option value={5000}>Within 5km</option>
              </select>
            </div>
          )}
        </div>

        {/* Export Actions Footer */}
        <div id="export-actions" className="p-4 border-t border-gray-200 space-y-3">
          {/* Export Buttons */}
          <div id="export-buttons-section">
            <h4 className="text-sm font-medium text-gray-900 flex items-center mb-2">
              <Download className="w-4 h-4 mr-2" />
              Export Data
            </h4>
            <div className="grid grid-cols-3 gap-2">
              <button
                id="export-csv-button"
                onClick={onExportCSV}
                className="px-3 py-2 text-xs font-medium bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors border border-gray-300"
                disabled={observations.length === 0}
              >
                CSV
              </button>
              <button
                id="export-json-button"
                onClick={() => {
                  // JSON export not wired yet, using CSV handler as placeholder
                  console.log('JSON export requested');
                }}
                className="px-3 py-2 text-xs font-medium bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors border border-gray-300"
                disabled={observations.length === 0}
              >
                JSON
              </button>
              <button
                id="export-geojson-button"
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
            <div id="add-to-cart-section">
              <button
                id="add-to-cart-button"
                onClick={onAddToCart}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
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
    <div id="inaturalist-details-sidebar" className="w-96 bg-white border-l border-gray-200 flex flex-col h-full">
      {/* Tab Buttons */}
      {renderTabButtons()}

      {/* Tab Content */}
      <div className="flex-1 flex flex-col min-h-0">
        {activeTab === 'details' ? renderDetailsTab() : renderExportTab()}
      </div>
    </div>
  );
};

export default INaturalistDetailsSidebar;

