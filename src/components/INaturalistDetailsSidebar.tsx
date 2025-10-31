import React, { useState, useEffect, useMemo } from 'react';
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
  photoFilter?: 'any' | 'with' | 'without';
  onPhotoFilterChange?: (value: 'any' | 'with' | 'without') => void;
  months?: number[];
  onMonthsChange?: (months: number[]) => void;
  // Export & cart actions
  onExportCSV: () => void;
  onExportGeoJSON: () => void;
  onAddToCart?: (filteredCount: number) => void;
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
  photoFilter = 'any',
  onPhotoFilterChange,
  months = [],
  onMonthsChange,
  onExportCSV,
  onExportGeoJSON,
  onAddToCart,
  onClose,
  hasSearched
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('export');

  // Detect if we're using TNC layers (which have limited fields)
  const isTNCLayer = dataSourceLabel?.includes('TNC');
  
  // Compute available taxa from actual observations (filter out empty/null/Unknown)
  const availableTaxaInObservations = useMemo(() => {
    const taxa = new Set<string>();
    observations.forEach(obs => {
      const taxon = obs.iconicTaxon;
      if (taxon && taxon.trim() && taxon.toLowerCase() !== 'unknown') {
        // Capitalize first letter, lowercase the rest
        const normalized = taxon.charAt(0).toUpperCase() + taxon.slice(1).toLowerCase();
        taxa.add(normalized);
      }
    });
    return Array.from(taxa);
  }, [observations]);
  
  
  // Check if iconic taxa is actually filtering (not all selected or empty)
  // Compare against actual available taxa, not hardcoded list
  const isIconicTaxaFiltering = useMemo(() => {
    if (!iconicTaxa || iconicTaxa.length === 0 || availableTaxaInObservations.length === 0) {
      return false;
    }
    // Filtering if selected taxa count is less than available taxa count
    return iconicTaxa.length < availableTaxaInObservations.length;
  }, [iconicTaxa, availableTaxaInObservations]);
  
  // Calculate filtered observations based on custom filters
  const filteredObservations = useMemo(() => {
    let filtered = observations;

    // Apply quality grade filter (only available in Public API)
    if (qualityGrade && !isTNCLayer) {
      filtered = filtered.filter(obs => obs.qualityGrade === qualityGrade);
    }

    // Apply iconic taxa filter (only if specific taxa selected, not if all or none selected)
    // Note: Both Public API and TNC use iconicTaxon in the unified observation format
    // (TNC's taxon_category_name is mapped to iconicTaxon upstream)
    if (isIconicTaxaFiltering) {
      filtered = filtered.filter(obs => 
        iconicTaxa.some(taxon => obs.iconicTaxon?.toLowerCase() === taxon.toLowerCase())
      );
    }

    // Apply taxon name filter (works for both data sources)
    if (taxonName && taxonName.trim()) {
      const searchTerm = taxonName.toLowerCase();
      filtered = filtered.filter(obs =>
        obs.commonName?.toLowerCase().includes(searchTerm) ||
        obs.scientificName?.toLowerCase().includes(searchTerm)
      );
    }

    // Apply photo filter (works for both data sources)
    if (photoFilter === 'with') {
      // Only observations WITH photos
      filtered = filtered.filter(obs => obs.photoUrl !== null && obs.photoUrl !== '');
    } else if (photoFilter === 'without') {
      // Only observations WITHOUT photos
      filtered = filtered.filter(obs => !obs.photoUrl || obs.photoUrl === '');
    }
    // If photoFilter === 'any', don't filter (show all)

    // Apply month filter (works for both data sources - parse from observedOn)
    if (months && months.length > 0 && months.length < 12) {
      filtered = filtered.filter(obs => {
        const date = new Date(obs.observedOn);
        const month = date.getMonth() + 1; // getMonth() returns 0-11, we want 1-12
        return months.includes(month);
      });
    }

    // Note: The following filters can only be applied server-side when fetching data:
    // - photoLicense (not in observation results)
    // - soundFilter (would need soundUrl field)
    // - verifiable (server-side calculation)
    // - captive (would need captive_cultivated field)
    // - hours (would need time of day data)
    // - conservation status (endemic, threatened, introduced, native - server-side only)
    // These are stored for cart queries but don't filter current client-side results.

    return filtered;
  }, [observations, qualityGrade, iconicTaxa, isIconicTaxaFiltering, taxonName, photoFilter, months, isTNCLayer]);
  
  // Check if any additional filters are active (only client-side filters that actually work)
  const hasAdditionalFilters = useMemo(() => {
    const hasMonthFilter = months && months.length > 0 && months.length < 12;
    
    if (isTNCLayer) {
      // TNC layers support: taxonomic groups, taxon name, photo filter, months
      return !!(
        isIconicTaxaFiltering ||
        (taxonName && taxonName.trim()) ||
        (photoFilter && photoFilter !== 'any') ||
        hasMonthFilter
      );
    } else {
      // Public API supports: quality grade, taxonomic groups, taxon name, photo filter, months
      // Note: Other advanced filters are server-side only and stored for cart queries
      return !!(
        qualityGrade ||
        isIconicTaxaFiltering ||
        (taxonName && taxonName.trim()) ||
        (photoFilter && photoFilter !== 'any') ||
        hasMonthFilter
      );
    }
  }, [qualityGrade, isIconicTaxaFiltering, taxonName, photoFilter, months, isTNCLayer]);

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
        Export All
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
          <p className="text-sm">
            {hasAdditionalFilters && filteredObservations.length !== observations.length ? (
              <>
                <span className="font-semibold text-blue-600">{filteredObservations.length} filtered</span>
                <span className="text-gray-400 mx-1">/</span>
                <span className="text-gray-600">{observations.length} total observations</span>
                <span className="text-gray-600"> {dateRangeText}</span>
              </>
            ) : (
              <span className="text-gray-600">{observations.length} total observations {dateRangeText}</span>
            )}
          </p>
        </div>

        {/* Filters Section */}
        <div id="export-filters" className="flex-1 overflow-y-auto p-4 space-y-6">
          {/* Quality Grade Filter - Only show for Public API */}
          {!isTNCLayer && (
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
          )}

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
                ].map((taxon) => {
                  const isAvailable = availableTaxaInObservations.includes(taxon.value);
                  const isChecked = iconicTaxa.includes(taxon.value);
                  return (
                    <label 
                      key={taxon.value} 
                      id={`iconic-taxon-option-${taxon.value.toLowerCase()}`} 
                      className={`flex items-center ${isAvailable ? 'cursor-pointer' : 'cursor-not-allowed opacity-50'}`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        disabled={!isAvailable}
                        onChange={(e) => {
                          if (e.target.checked) {
                            // Add to current selection (preserve other selections)
                            const newTaxa = [...iconicTaxa, taxon.value];
                            onIconicTaxaChange(newTaxa);
                          } else {
                            // Remove from current selection
                            const newTaxa = iconicTaxa.filter(t => t !== taxon.value);
                            onIconicTaxaChange(newTaxa);
                          }
                        }}
                        className="mr-2 cursor-pointer disabled:cursor-not-allowed"
                      />
                      <span className="text-lg mr-2">{taxon.icon}</span>
                      <span className="text-sm text-gray-700">{taxon.label}</span>
                      {!isAvailable && observations.length > 0 && (
                        <span className="text-xs text-gray-400 ml-1">(not in data)</span>
                      )}
                    </label>
                  );
                })}
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

          {/* Photo Filter */}
          {onPhotoFilterChange && (
            <div id="photo-filter-section" className="space-y-3">
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

          {/* Month/Season Filter */}
          {onMonthsChange && (
            <div id="month-filter-section" className="space-y-3">
              <h4 className="text-sm font-medium text-gray-900 flex items-center">
                <Filter className="w-4 h-4 mr-2" />
                Months/Season
              </h4>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { value: 1, label: 'Jan', season: 'winter' },
                  { value: 2, label: 'Feb', season: 'winter' },
                  { value: 3, label: 'Mar', season: 'spring' },
                  { value: 4, label: 'Apr', season: 'spring' },
                  { value: 5, label: 'May', season: 'spring' },
                  { value: 6, label: 'Jun', season: 'summer' },
                  { value: 7, label: 'Jul', season: 'summer' },
                  { value: 8, label: 'Aug', season: 'summer' },
                  { value: 9, label: 'Sep', season: 'fall' },
                  { value: 10, label: 'Oct', season: 'fall' },
                  { value: 11, label: 'Nov', season: 'fall' },
                  { value: 12, label: 'Dec', season: 'winter' }
                ].map((month) => (
                  <label key={month.value} className="flex items-center cursor-pointer text-xs">
                    <input
                      type="checkbox"
                      checked={months.includes(month.value)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          onMonthsChange([...months, month.value].sort((a, b) => a - b));
                        } else {
                          onMonthsChange(months.filter(m => m !== month.value));
                        }
                      }}
                      className="mr-1 cursor-pointer"
                    />
                    <span className="text-gray-700">{month.label}</span>
                  </label>
                ))}
              </div>
              <div className="flex gap-2 mt-2">
                <button
                  onClick={() => onMonthsChange([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12])}
                  className="text-xs px-2 py-1 text-blue-600 hover:bg-blue-50 rounded"
                >
                  Select All
                </button>
                <button
                  onClick={() => onMonthsChange([])}
                  className="text-xs px-2 py-1 text-gray-600 hover:bg-gray-50 rounded"
                >
                  Clear
                </button>
              </div>
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
            <div id="add-to-cart-section" className="space-y-3">
              {/* Summary message */}
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm font-medium text-blue-900">
                  {hasAdditionalFilters && filteredObservations.length !== observations.length ? (
                    <>
                      <span className="text-lg font-bold">{filteredObservations.length}</span> observations will be saved after applying additional filters
                    </>
                  ) : (
                    <>
                      <span className="text-lg font-bold">{observations.length}</span> observations will be saved
                    </>
                  )}
                </p>
                {hasAdditionalFilters && filteredObservations.length !== observations.length && (
                  <p className="text-xs text-blue-700 mt-1">
                    Filtered from {observations.length} total observations
                  </p>
                )}
              </div>
              
              <button
                id="add-to-cart-button"
                onClick={() => onAddToCart(filteredObservations.length)}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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

