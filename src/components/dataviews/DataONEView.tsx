import React, { useState, useEffect, useCallback } from 'react';
import {
  Database,
  Loader2,
  Search,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  FileText,
  History,
  Filter,
  ExternalLink,
} from 'lucide-react';
import DataTypeBackHeader from '../DataTypeBackHeader';
import {
  dataOneService,
  DataOneDataset,
  DataOneQueryResponse,
  DataOneVersionEntry,
  FilesSummary,
} from '../../services/dataOneService';

interface DataONEViewProps {
  hasSearched?: boolean;
  onBack?: () => void;
  onDatasetSelect?: (dataset: DataOneDataset) => void;
  selectedDatasetId?: number;
  searchText?: string;
  onSearchTextChange?: (text: string) => void;
  /** Callback when sidebar filters change - triggers map data reload */
  onFiltersChange?: (filters: { searchText: string; repository: string }) => void;
}

const PAGE_SIZE = 20;

/**
 * Format file size in human-readable format
 */
function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  let unitIndex = 0;
  let size = bytes;
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }
  return `${size.toFixed(unitIndex > 0 ? 1 : 0)} ${units[unitIndex]}`;
}

/**
 * Format files summary for display (e.g., "2 CSV, 1 PDF • 22 KB")
 */
function formatFilesSummary(summary: FilesSummary | null): string | null {
  if (!summary || summary.total === 0) return null;
  
  const extParts = Object.entries(summary.byExtension)
    .sort(([, a], [, b]) => b - a) // Sort by count descending
    .slice(0, 3) // Show top 3 extensions
    .map(([ext, count]) => `${count} ${ext.toUpperCase()}`);
  
  const extStr = extParts.join(', ');
  const sizeStr = summary.sizeBytes > 0 ? formatFileSize(summary.sizeBytes) : null;
  
  return sizeStr ? `${extStr} • ${sizeStr}` : extStr;
}

/**
 * Strip "urn:node:" prefix from repository/datasource names
 */
function formatRepository(repo: string | null): string | null {
  if (!repo) return null;
  return repo.replace(/^urn:node:/i, '');
}

/**
 * Version history expansion state for a single dataset
 */
interface VersionHistoryState {
  loading: boolean;
  error: string | null;
  versions: DataOneVersionEntry[];
  showAll: boolean;
}

const DataONEView: React.FC<DataONEViewProps> = ({
  hasSearched = false,
  onBack,
  onDatasetSelect,
  selectedDatasetId,
  searchText = '',
  onSearchTextChange,
  onFiltersChange,
}) => {
  const [datasets, setDatasets] = useState<DataOneDataset[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState(0);
  const [pageNumber, setPageNumber] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [localSearchText, setLocalSearchText] = useState(searchText);
  
  // Repository/node filter state
  const [repositories, setRepositories] = useState<string[]>([]);
  const [selectedRepository, setSelectedRepository] = useState<string>('');
  const [repositoriesLoading, setRepositoriesLoading] = useState(false);
  
  // Track expanded version history per dataset (keyed by seriesId)
  const [expandedVersions, setExpandedVersions] = useState<Record<string, VersionHistoryState>>({});

  // Fetch repositories on mount
  useEffect(() => {
    const loadRepositories = async () => {
      setRepositoriesLoading(true);
      try {
        const repos = await dataOneService.getRepositories();
        setRepositories(repos);
      } catch (err) {
        console.error('Failed to load repositories:', err);
      } finally {
        setRepositoriesLoading(false);
      }
    };
    loadRepositories();
  }, []);

  // Fetch sidebar data (paginated) - does NOT affect map data
  const fetchData = useCallback(async (page: number, search: string, repository?: string) => {
    setLoading(true);
    setError(null);
    try {
      const response: DataOneQueryResponse = await dataOneService.queryDatasets({
        pageSize: PAGE_SIZE,
        pageNumber: page,
        searchText: search || undefined,
        repository: repository || undefined,
        usePreserveRadius: true, // Default 20-mile filter
      });
      setDatasets(response.datasets);
      setTotalCount(response.totalCount);
      setTotalPages(response.totalPages);
      setPageNumber(response.pageNumber);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load datasets');
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial load when hasSearched becomes true - also triggers map data load
  useEffect(() => {
    if (hasSearched) {
      fetchData(0, localSearchText, selectedRepository);
      // Notify parent to load map data with current filters
      onFiltersChange?.({ searchText: localSearchText, repository: selectedRepository });
    }
  }, [hasSearched]); // Only run on initial search, not on filter changes

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    onSearchTextChange?.(localSearchText);
    fetchData(0, localSearchText, selectedRepository);
    // Notify parent to reload map data with new filters
    onFiltersChange?.({ searchText: localSearchText, repository: selectedRepository });
  };
  
  const handleRepositoryChange = (repository: string) => {
    setSelectedRepository(repository);
    // Reset to page 0 when filter changes
    if (hasSearched) {
      fetchData(0, localSearchText, repository);
      // Notify parent to reload map data with new filter
      onFiltersChange?.({ searchText: localSearchText, repository });
    }
  };

  const handlePageChange = (newPage: number) => {
    if (newPage >= 0 && newPage < totalPages) {
      fetchData(newPage, localSearchText, selectedRepository);
      // Clear expanded versions when changing pages
      setExpandedVersions({});
    }
  };

  const formatDate = (date: Date | null) => {
    if (!date) return null;
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  /**
   * Toggle version history expansion for a dataset
   */
  const toggleVersionHistory = async (dataset: DataOneDataset) => {
    const { seriesId } = dataset;
    const current = expandedVersions[seriesId];
    
    // If already loaded, just toggle visibility
    if (current && current.versions.length > 0) {
      setExpandedVersions((prev) => ({
        ...prev,
        [seriesId]: undefined as unknown as VersionHistoryState,
      }));
      return;
    }
    
    // Start loading
    setExpandedVersions((prev) => ({
      ...prev,
      [seriesId]: { loading: true, error: null, versions: [], showAll: false },
    }));
    
    try {
      const versions = await dataOneService.queryVersionHistory(seriesId);
      setExpandedVersions((prev) => ({
        ...prev,
        [seriesId]: { loading: false, error: null, versions, showAll: false },
      }));
    } catch (err) {
      setExpandedVersions((prev) => ({
        ...prev,
        [seriesId]: {
          loading: false,
          error: err instanceof Error ? err.message : 'Failed to load versions',
          versions: [],
          showAll: false,
        },
      }));
    }
  };

  /**
   * Toggle showing all versions vs first 3
   */
  const toggleShowAllVersions = (seriesId: string) => {
    setExpandedVersions((prev) => ({
      ...prev,
      [seriesId]: { ...prev[seriesId], showAll: !prev[seriesId]?.showAll },
    }));
  };

  /**
   * Handle clicking a specific version to view its details
   */
  const handleVersionClick = async (dataoneId: string) => {
    try {
      const details = await dataOneService.getVersionDetails(dataoneId);
      if (details) {
        // Convert to DataOneDataset format for selection
        onDatasetSelect?.(details);
      }
    } catch (err) {
      console.error('Failed to load version details:', err);
    }
  };

  return (
    <div id="dataone-view" className="w-64 md:w-80 lg:w-96 flex-shrink-0 bg-white border-r border-gray-200 flex flex-col h-full">
      {/* Back to Data Types */}
      {onBack && <DataTypeBackHeader onBack={onBack} />}

      {/* Header */}
      <div id="dataone-header" className="p-4 border-b border-gray-200">
        <div id="dataone-title" className="flex items-center space-x-2">
          <Database className="w-5 h-5 text-emerald-600" />
          <h2 className="text-lg font-semibold text-gray-900">Research Datasets</h2>
        </div>
        <p id="dataone-subtitle" className="text-sm text-gray-600 mt-1">
          Scientific datasets from DataONE repositories
        </p>
      </div>

      {/* Search Bar and Filters */}
      {hasSearched && (
        <div id="dataone-search" className="p-3 border-b border-gray-200 space-y-2">
          <form onSubmit={handleSearch} className="flex gap-2">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                id="dataone-search-input"
                type="text"
                value={localSearchText}
                onChange={(e) => setLocalSearchText(e.target.value)}
                placeholder="Search datasets..."
                className="w-full pl-9 pr-3 py-2 text-sm bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              />
            </div>
            <button
              type="submit"
              className="px-3 py-2 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 transition-colors"
            >
              Search
            </button>
          </form>
          
          {/* Repository/Node Filter */}
          <div id="dataone-repository-filter" className="relative">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            <select
              id="dataone-repository-select"
              value={selectedRepository}
              onChange={(e) => handleRepositoryChange(e.target.value)}
              disabled={repositoriesLoading}
              className="w-full pl-9 pr-8 py-2 text-sm border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent appearance-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <option value="">All Repositories</option>
              {repositories.map((repo) => (
                <option key={repo} value={repo}>
                  {formatRepository(repo)}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          </div>
        </div>
      )}

      {/* Summary Bar */}
      {hasSearched && !loading && totalCount > 0 && (
        <div id="dataone-summary" className="px-4 py-2 bg-gray-50 border-b border-gray-200 text-sm text-gray-600">
          <span className="font-medium text-gray-900">{totalCount.toLocaleString()}</span> datasets found
          {localSearchText && (
            <span className="ml-1">
              for "<span className="font-medium">{localSearchText}</span>"
            </span>
          )}
          {selectedRepository && (
            <span className="ml-1">
              in <span className="font-medium">{formatRepository(selectedRepository)}</span>
            </span>
          )}
        </div>
      )}

      {/* Content */}
      <div id="dataone-content" className="flex-1 overflow-y-auto">
        {!hasSearched ? (
          // Pre-search state
          <div id="dataone-search-prompt" className="flex flex-col items-center justify-center h-full text-center px-4">
            <Database className="w-12 h-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Research Datasets</h3>
            <p className="text-sm text-gray-600 mb-4">
              Explore scientific datasets from PISCO, LTER, PANGAEA, and other research repositories
              within 20 miles of the Dangermond Preserve.
            </p>
            <p className="text-xs text-gray-500">
              Click the search button to load available datasets.
            </p>
          </div>
        ) : loading ? (
          // Loading state
          <div id="dataone-loading" className="flex flex-col items-center justify-center h-full">
            <Loader2 className="w-8 h-8 text-emerald-600 animate-spin mb-3" />
            <p className="text-sm text-gray-600">Loading datasets...</p>
          </div>
        ) : error ? (
          // Error state
          <div id="dataone-error" className="flex flex-col items-center justify-center h-full text-center px-4">
            <AlertCircle className="w-8 h-8 text-red-500 mb-3" />
            <p className="text-red-600 mb-2">{error}</p>
            <button
              onClick={() => fetchData(0, localSearchText)}
              className="text-sm text-emerald-600 hover:underline"
            >
              Try again
            </button>
          </div>
        ) : datasets.length === 0 ? (
          // Empty state
          <div id="dataone-empty" className="flex flex-col items-center justify-center h-full text-center px-4">
            <Database className="w-8 h-8 text-gray-400 mb-3" />
            <p className="text-gray-600 mb-2">No datasets found</p>
            {(localSearchText || selectedRepository) && (
              <button
                onClick={() => {
                  setLocalSearchText('');
                  setSelectedRepository('');
                  fetchData(0, '', '');
                }}
                className="text-sm text-emerald-600 hover:underline"
              >
                Clear filters
              </button>
            )}
          </div>
        ) : (
          // Dataset list
          <div id="dataone-list" className="divide-y divide-gray-100">
            {datasets.map((dataset) => {
              const isSelected = selectedDatasetId === dataset.id;
              const versionState = expandedVersions[dataset.seriesId];
              const isExpanded = versionState && versionState.versions.length > 0;
              const hasMultipleVersions = dataset.versionCount > 1;
              const filesSummaryText = formatFilesSummary(dataset.filesSummary);
              const repoName = formatRepository(dataset.repository);
              
              return (
                <div key={dataset.id} id={`dataset-container-${dataset.id}`}>
                  {/* Main dataset row */}
                  <button
                    id={`dataset-${dataset.id}`}
                    onClick={() => onDatasetSelect?.(dataset)}
                    className={`w-full text-left p-4 transition-colors hover:bg-gray-50 ${
                      isSelected ? 'bg-sky-50 border-l-4 border-sky-500' : ''
                    }`}
                  >
                    {/* Title */}
                    <h3
                      className={`text-sm font-medium line-clamp-2 mb-1 ${
                        isSelected ? 'text-sky-900' : 'text-gray-900'
                      }`}
                    >
                      {dataset.title}
                    </h3>

                    {/* Row 1: versions • file info • metadata-only badge */}
                    <div className="flex items-center flex-wrap gap-2 mb-1.5">
                      {/* Version count badge (always shown) */}
                      {hasMultipleVersions ? (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleVersionHistory(dataset);
                          }}
                          className="inline-flex items-center gap-1 px-1.5 py-0.5 text-xs bg-blue-50 text-blue-700 rounded hover:bg-blue-100 transition-colors"
                        >
                          <History className="w-3 h-3" />
                          {dataset.versionCount} versions
                          {isExpanded ? (
                            <ChevronUp className="w-3 h-3" />
                          ) : (
                            <ChevronDown className="w-3 h-3" />
                          )}
                        </button>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 text-xs bg-gray-100 text-gray-500 rounded">
                          <History className="w-3 h-3" />
                          1 version
                        </span>
                      )}

                      {/* Metadata-only badge (with external link indicator) */}
                      {dataset.isMetadataOnly ? (
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 text-xs bg-purple-50 text-purple-700 rounded">
                          <ExternalLink className="w-3 h-3" />
                          Metadata Only
                        </span>
                      ) : filesSummaryText ? (
                        /* Files summary badge (only for non-metadata-only) */
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 text-xs bg-amber-50 text-amber-700 rounded">
                          <FileText className="w-3 h-3" />
                          {filesSummaryText}
                        </span>
                      ) : null}
                    </div>

                    {/* Row 2: date • node source */}
                    <div className="flex items-center flex-wrap gap-2 text-xs text-gray-500 mb-2">
                      {/* Date uploaded */}
                      {dataset.dateUploaded && (
                        <span>{formatDate(dataset.dateUploaded)}</span>
                      )}
                      {/* Repository/node source */}
                      {repoName && (
                        <span className="text-gray-400">• {repoName}</span>
                      )}
                    </div>

                    {/* TNC Categories */}
                    {dataset.tncCategories.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {dataset.tncCategories.slice(0, 3).map((category, i) => (
                          <span
                            key={i}
                            className="text-xs px-1.5 py-0.5 bg-emerald-50 text-emerald-700 rounded"
                          >
                            {category}
                          </span>
                        ))}
                        {dataset.tncCategories.length > 3 && (
                          <span className="text-xs text-gray-400">
                            +{dataset.tncCategories.length - 3} more
                          </span>
                        )}
                      </div>
                    )}
                  </button>

                  {/* Inline version history (when expanded) */}
                  {versionState && (
                    <div
                      id={`version-history-${dataset.id}`}
                      className="bg-gray-50 border-t border-gray-100 px-4 py-3"
                    >
                      {versionState.loading ? (
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Loading version history...
                        </div>
                      ) : versionState.error ? (
                        <div className="text-sm text-red-600">{versionState.error}</div>
                      ) : versionState.versions.length > 0 ? (
                        <div className="space-y-1">
                          <h4 className="text-xs font-medium text-gray-700 mb-2">Version History</h4>
                          {(versionState.showAll
                            ? versionState.versions
                            : versionState.versions.slice(0, 3)
                          ).map((version, index) => {
                            const isLatest = index === 0;
                            const versionNumber = versionState.versions.length - index;
                            const isCurrentlySelected = dataset.dataoneId === version.dataoneId;
                            const versionFilesSummary = formatFilesSummary(version.filesSummary);

                            return (
                              <button
                                key={version.dataoneId}
                                onClick={() => handleVersionClick(version.dataoneId)}
                                className={`w-full text-left px-2 py-1.5 text-xs rounded transition-colors ${
                                  isCurrentlySelected
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : 'hover:bg-gray-100 text-gray-600'
                                }`}
                              >
                                <div className="flex items-center justify-between">
                                  <span className="font-medium">
                                    v{versionNumber}
                                    {isLatest && (
                                      <span className="ml-1 text-emerald-600">(latest)</span>
                                    )}
                                  </span>
                                  <span className="text-gray-400">
                                    {formatDate(version.dateUploaded)}
                                  </span>
                                </div>
                                {versionFilesSummary && (
                                  <div className="mt-0.5 text-gray-500">{versionFilesSummary}</div>
                                )}
                              </button>
                            );
                          })}

                          {/* Show all / Show less toggle */}
                          {versionState.versions.length > 3 && (
                            <button
                              onClick={() => toggleShowAllVersions(dataset.seriesId)}
                              className="w-full text-center text-xs text-emerald-600 hover:underline mt-1 py-1"
                            >
                              {versionState.showAll
                                ? 'Show less'
                                : `Show all ${versionState.versions.length} versions`}
                            </button>
                          )}
                        </div>
                      ) : (
                        <div className="text-sm text-gray-500">No version history available</div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Pagination */}
      {hasSearched && !loading && totalPages > 1 && (
        <div id="dataone-pagination" className="p-3 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between">
            <button
              onClick={() => handlePageChange(pageNumber - 1)}
              disabled={pageNumber === 0}
              className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-4 h-4" />
              Previous
            </button>
            <span className="text-sm text-gray-600">
              Page {pageNumber + 1} of {totalPages}
            </span>
            <button
              onClick={() => handlePageChange(pageNumber + 1)}
              disabled={pageNumber >= totalPages - 1}
              className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Footer Info */}
      {hasSearched && !loading && totalCount > 0 && (
        <div id="dataone-footer" className="p-3 border-t border-gray-200 bg-gray-50 text-xs text-gray-500">
          Showing datasets within ~20 miles of Dangermond Preserve
        </div>
      )}
    </div>
  );
};

export default DataONEView;
