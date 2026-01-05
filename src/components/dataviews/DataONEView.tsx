import React, { useState, useEffect, useCallback } from 'react';
import { Database, Loader2, Search, ChevronLeft, ChevronRight, AlertCircle } from 'lucide-react';
import DataTypeBackHeader from '../DataTypeBackHeader';
import { dataOneService, DataOneDataset, DataOneQueryResponse } from '../../services/dataOneService';

interface DataONEViewProps {
  hasSearched?: boolean;
  onBack?: () => void;
  onDatasetSelect?: (dataset: DataOneDataset) => void;
  selectedDatasetId?: number;
  searchText?: string;
  onSearchTextChange?: (text: string) => void;
  onDatasetsLoaded?: (datasets: DataOneDataset[]) => void;
}

const PAGE_SIZE = 20;

const DataONEView: React.FC<DataONEViewProps> = ({
  hasSearched = false,
  onBack,
  onDatasetSelect,
  selectedDatasetId,
  searchText = '',
  onSearchTextChange,
  onDatasetsLoaded,
}) => {
  const [datasets, setDatasets] = useState<DataOneDataset[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState(0);
  const [pageNumber, setPageNumber] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [localSearchText, setLocalSearchText] = useState(searchText);

  // Fetch data when hasSearched becomes true or page changes
  const fetchData = useCallback(async (page: number, search: string) => {
    setLoading(true);
    setError(null);
    try {
      const response: DataOneQueryResponse = await dataOneService.queryDatasets({
        pageSize: PAGE_SIZE,
        pageNumber: page,
        searchText: search || undefined,
        usePreserveRadius: true, // Default 20-mile filter
      });
      setDatasets(response.datasets);
      setTotalCount(response.totalCount);
      setTotalPages(response.totalPages);
      setPageNumber(response.pageNumber);
      onDatasetsLoaded?.(response.datasets);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load datasets');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (hasSearched) {
      fetchData(0, localSearchText);
    }
  }, [hasSearched, fetchData, localSearchText]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    onSearchTextChange?.(localSearchText);
    fetchData(0, localSearchText);
  };

  const handlePageChange = (newPage: number) => {
    if (newPage >= 0 && newPage < totalPages) {
      fetchData(newPage, localSearchText);
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

  return (
    <div id="dataone-view" className="w-96 bg-white border-r border-gray-200 flex flex-col h-full">
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

      {/* Search Bar */}
      {hasSearched && (
        <div id="dataone-search" className="p-3 border-b border-gray-200">
          <form onSubmit={handleSearch} className="flex gap-2">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                id="dataone-search-input"
                type="text"
                value={localSearchText}
                onChange={(e) => setLocalSearchText(e.target.value)}
                placeholder="Search datasets..."
                className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              />
            </div>
            <button
              type="submit"
              className="px-3 py-2 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 transition-colors"
            >
              Search
            </button>
          </form>
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
            {localSearchText && (
              <button
                onClick={() => {
                  setLocalSearchText('');
                  fetchData(0, '');
                }}
                className="text-sm text-emerald-600 hover:underline"
              >
                Clear search
              </button>
            )}
          </div>
        ) : (
          // Dataset list
          <div id="dataone-list" className="divide-y divide-gray-100">
            {datasets.map((dataset) => {
              const isSelected = selectedDatasetId === dataset.id;
              return (
                <button
                  key={dataset.id}
                  id={`dataset-${dataset.id}`}
                  onClick={() => onDatasetSelect?.(dataset)}
                  className={`w-full text-left p-4 transition-colors hover:bg-gray-50 ${
                    isSelected ? 'bg-emerald-50 border-l-4 border-emerald-500' : ''
                  }`}
                >
                  {/* Title */}
                  <h3
                    className={`text-sm font-medium line-clamp-2 mb-1 ${
                      isSelected ? 'text-emerald-900' : 'text-gray-900'
                    }`}
                  >
                    {dataset.title}
                  </h3>

                  {/* Metadata row */}
                  <div className="flex items-center flex-wrap gap-2 text-xs text-gray-500 mb-2">
                    {/* Repository badge */}
                    {dataset.repository && (
                      <span className="px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded">
                        {dataset.repository}
                      </span>
                    )}
                    {/* Date uploaded */}
                    {dataset.dateUploaded && (
                      <span>{formatDate(dataset.dateUploaded)}</span>
                    )}
                    {/* Temporal coverage */}
                    {dataset.temporalCoverage.beginDate && (
                      <span className="text-gray-400">
                        {formatDate(dataset.temporalCoverage.beginDate)}
                        {dataset.temporalCoverage.endDate && ` - ${formatDate(dataset.temporalCoverage.endDate)}`}
                      </span>
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

