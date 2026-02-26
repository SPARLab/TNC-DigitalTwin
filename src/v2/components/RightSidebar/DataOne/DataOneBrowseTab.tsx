// ============================================================================
// DataOneBrowseTab — Search + filter UI for DataOne datasets.
// Orchestration is extracted into useDataOneBrowseOrchestrator.
// ============================================================================

import { Search, X, AlertCircle } from 'lucide-react';
import { InlineLoadingRow, RefreshLoadingRow } from '../../shared/loading/LoadingPrimitives';
import { DatasetListView } from './DatasetListView';
import { DatasetDetailView } from './DatasetDetailView';
import { SpatialQuerySection } from '../shared/SpatialQuerySection';
import { EditFiltersCard } from '../shared/EditFiltersCard';
import { BrowsePaginationControls } from '../shared/BrowsePaginationControls';
import {
  FILE_TYPE_OPTIONS,
  MIN_SEARCH_CHARS,
  TNC_CATEGORY_OPTIONS,
  useDataOneBrowseOrchestrator,
} from './useDataOneBrowseOrchestrator';

function categoryToId(category: string): string {
  return category.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

export function DataOneBrowseTab() {
  const {
    aggregationMode,
    applyKeywordSearch,
    authorFilter,
    clearAllFilters,
    clearCategories,
    clearFileTypes,
    clearSearch,
    closeDatasetDetail,
    currentViewSavedDatasetId,
    datasets,
    endYear,
    error,
    handleSaveDatasetView,
    handleUnsaveDatasetView,
    hasAnyFilter,
    mapLoading,
    mapSelectionDataoneIds,
    openDatasetDetail,
    page,
    runSearchNow,
    savedDataoneIds,
    searchInput,
    selectedCategories,
    selectedDataset,
    selectedFileTypes,
    selectAllCategories,
    selectAllFileTypes,
    selectDatasetVersion,
    setAggregationMode,
    setAuthorFilter,
    setEndYear,
    setMapSelectionDataoneIds,
    setPage,
    setSearchInput,
    setStartYear,
    showInitialLoading,
    showRefreshLoading,
    startYear,
    toggleCategory,
    toggleFileType,
    totalCount,
    totalPages,
    yearOptions,
  } = useDataOneBrowseOrchestrator();

  if (selectedDataset) {
    return (
      <DatasetDetailView
        dataset={selectedDataset}
        onSaveDatasetView={handleSaveDatasetView}
        onUnsaveDatasetView={handleUnsaveDatasetView}
        isDatasetSaved={Boolean(currentViewSavedDatasetId === selectedDataset.dataoneId)}
        onVersionSelect={selectDatasetVersion}
        onBack={closeDatasetDetail}
        onKeywordClick={applyKeywordSearch}
      />
    );
  }

  return (
    <div id="dataone-browse-tab" className="space-y-3">
      <div id="dataone-browse-live-region" className="sr-only" aria-live="polite">
        Showing {datasets.length} of {totalCount} datasets.
      </div>

      <EditFiltersCard id="dataone-edit-filters-card" collapsible defaultExpanded>
        <div id="dataone-aggregation-toggle-section" className="space-y-1">
          <p id="dataone-aggregation-toggle-label" className="text-[11px] font-medium uppercase tracking-wide text-gray-500">
            Map aggregation
          </p>
          <div id="dataone-aggregation-toggle-group" className="grid grid-cols-2 gap-1 rounded-lg border border-gray-200 bg-gray-50 p-1">
            <button
              id="dataone-aggregation-toggle-cluster"
              type="button"
              onClick={() => setAggregationMode('cluster')}
              aria-pressed={aggregationMode === 'cluster'}
              className={`rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors ${
                aggregationMode === 'cluster'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              Clusters
            </button>
            <button
              id="dataone-aggregation-toggle-binning"
              type="button"
              onClick={() => setAggregationMode('binning')}
              aria-pressed={aggregationMode === 'binning'}
              className={`rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors ${
                aggregationMode === 'binning'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              Grid bins
            </button>
          </div>
        </div>

        <div id="dataone-search-row" className="relative">
          <Search id="dataone-search-icon" className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            id="dataone-search-input"
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={(event) => {
              if (event.key !== 'Enter') return;
              event.preventDefault();
              runSearchNow();
            }}
            placeholder="Search title, abstract, or keywords..."
            className="w-full rounded-lg border border-gray-200 bg-white py-2.5 pl-9 pr-9 text-sm
                       placeholder:text-gray-400 focus:outline-none focus:border-gray-300
                       focus:shadow-[0_0_0_1px_rgba(107,114,128,0.3)]"
          />
          {searchInput && (
            <button
              id="dataone-search-clear-button"
              onClick={clearSearch}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              aria-label="Clear search"
            >
              <X id="dataone-search-clear-icon" className="h-4 w-4" />
            </button>
          )}
        </div>

        <div id="dataone-category-checklist-section" className="space-y-1">
          <div id="dataone-category-checklist-header" className="flex items-center justify-between">
            <p id="dataone-category-checklist-label" className="text-[11px] font-medium uppercase tracking-wide text-gray-500">
              Categories
            </p>
          </div>
          <div id="dataone-category-checklist-status-row" className="flex items-center justify-between">
            <p id="dataone-category-checklist-count" className="text-[11px] text-gray-500">
              {selectedCategories.length === 0 ? 'No category filter applied' : `${selectedCategories.length} selected`}
            </p>
            <div id="dataone-category-checklist-actions" className="flex items-center gap-2">
              <button
                id="dataone-category-select-all-button"
                type="button"
                onClick={selectAllCategories}
                className="text-[11px] font-medium text-emerald-700 hover:text-emerald-800 disabled:cursor-not-allowed disabled:text-gray-400"
                disabled={selectedCategories.length === TNC_CATEGORY_OPTIONS.length}
              >
                Select all
              </button>
              <button
                id="dataone-category-clear-all-button"
                type="button"
                onClick={clearCategories}
                className="text-[11px] font-medium text-emerald-700 hover:text-emerald-800 disabled:cursor-not-allowed disabled:text-gray-400"
                disabled={selectedCategories.length === 0}
              >
                Clear all
              </button>
            </div>
          </div>
          <div id="dataone-category-checklist" className="max-h-36 space-y-1 overflow-y-auto rounded-lg border border-gray-200 bg-white px-2.5 py-2">
            {TNC_CATEGORY_OPTIONS.map((category) => {
              const categorySlug = categoryToId(category);
              const checkboxId = `dataone-category-checkbox-${categorySlug}`;
              const isChecked = selectedCategories.includes(category);
              return (
                <label
                  id={`dataone-category-option-${categorySlug}`}
                  key={category}
                  htmlFor={checkboxId}
                  className="flex cursor-pointer items-center gap-2 rounded px-1.5 py-1 text-sm text-gray-700 hover:bg-gray-50"
                >
                  <input
                    id={checkboxId}
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => toggleCategory(category)}
                    className="h-3.5 w-3.5 rounded border-gray-300 text-emerald-700 focus:ring-emerald-600"
                  />
                  <span id={`dataone-category-option-label-${categorySlug}`}>{category}</span>
                </label>
              );
            })}
          </div>
        </div>

        <div id="dataone-file-type-checklist-section" className="space-y-1">
          <div id="dataone-file-type-checklist-header" className="flex items-center justify-between">
            <p id="dataone-file-type-checklist-label" className="text-[11px] font-medium uppercase tracking-wide text-gray-500">
              File types
            </p>
          </div>
          <div id="dataone-file-type-checklist-status-row" className="flex items-center justify-between">
            <p id="dataone-file-type-checklist-count" className="text-[11px] text-gray-500">
              {selectedFileTypes.length === 0 ? 'No file-type filter applied' : `${selectedFileTypes.length} selected`}
            </p>
            <div id="dataone-file-type-checklist-actions" className="flex items-center gap-2">
              <button
                id="dataone-file-type-select-all-button"
                type="button"
                onClick={selectAllFileTypes}
                className="text-[11px] font-medium text-emerald-700 hover:text-emerald-800 disabled:cursor-not-allowed disabled:text-gray-400"
                disabled={selectedFileTypes.length === FILE_TYPE_OPTIONS.length}
              >
                Select all
              </button>
              <button
                id="dataone-file-type-clear-all-button"
                type="button"
                onClick={clearFileTypes}
                className="text-[11px] font-medium text-emerald-700 hover:text-emerald-800 disabled:cursor-not-allowed disabled:text-gray-400"
                disabled={selectedFileTypes.length === 0}
              >
                Clear all
              </button>
            </div>
          </div>
          <div id="dataone-file-type-checklist" className="space-y-1 rounded-lg border border-gray-200 bg-white px-2.5 py-2">
            {FILE_TYPE_OPTIONS.map((option) => {
              const checkboxId = `dataone-file-type-checkbox-${option.value}`;
              const isChecked = selectedFileTypes.includes(option.value);
              return (
                <label
                  id={`dataone-file-type-option-${option.value}`}
                  key={option.value}
                  htmlFor={checkboxId}
                  className="flex cursor-pointer items-center gap-2 rounded px-1.5 py-1 text-sm text-gray-700 hover:bg-gray-50"
                >
                  <input
                    id={checkboxId}
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => toggleFileType(option.value)}
                    className="h-3.5 w-3.5 rounded border-gray-300 text-emerald-700 focus:ring-emerald-600"
                  />
                  <span id={`dataone-file-type-option-label-${option.value}`}>{option.label}</span>
                </label>
              );
            })}
          </div>
        </div>

        <div id="dataone-filter-grid" className="grid grid-cols-2 gap-2">
          <input
            id="dataone-author-filter"
            type="text"
            value={authorFilter}
            onChange={(e) => setAuthorFilter(e.target.value)}
            placeholder="Filter by author..."
            className="rounded-lg border border-gray-200 bg-white px-2.5 py-2 text-sm text-gray-700
                       placeholder:text-gray-400 focus:outline-none focus:border-gray-300
                       focus:shadow-[0_0_0_1px_rgba(107,114,128,0.3)]"
          />

          <select
            id="dataone-start-year-filter"
            value={startYear}
            onChange={(e) => setStartYear(e.target.value)}
            className="rounded-lg border border-gray-200 bg-white px-2.5 py-2 text-sm text-gray-700
                       focus:outline-none focus:border-gray-300 focus:shadow-[0_0_0_1px_rgba(107,114,128,0.3)]"
          >
            <option id="dataone-start-year-filter-any" value="">Start Year</option>
            {yearOptions.map((year) => (
              <option id={`dataone-start-year-filter-${year}`} key={year} value={year}>
                {year}
              </option>
            ))}
          </select>

          <select
            id="dataone-end-year-filter"
            value={endYear}
            onChange={(e) => setEndYear(e.target.value)}
            className="rounded-lg border border-gray-200 bg-white px-2.5 py-2 text-sm text-gray-700
                       focus:outline-none focus:border-gray-300 focus:shadow-[0_0_0_1px_rgba(107,114,128,0.3)]"
          >
            <option id="dataone-end-year-filter-any" value="">End Year</option>
            {yearOptions.map((year) => (
              <option id={`dataone-end-year-filter-${year}`} key={year} value={year}>
                {year}
              </option>
            ))}
          </select>
        </div>

        <SpatialQuerySection id="dataone-spatial-query-section" layerId="dataone-datasets" />

        <div id="dataone-result-summary-row" className="flex items-center justify-between text-xs">
          <p id="dataone-result-summary" className="text-gray-600">
            Showing <span id="dataone-result-summary-visible" className="font-semibold text-gray-800">{datasets.length}</span>
            {' '}of{' '}
            <span id="dataone-result-summary-total" className="font-semibold text-gray-800">{totalCount}</span>
            {' '}datasets
          </p>
          {hasAnyFilter && (
            <button
              id="dataone-clear-all-filters-button"
              onClick={clearAllFilters}
              className="text-emerald-700 hover:text-emerald-800 font-medium"
            >
              Clear all filters
            </button>
          )}
        </div>
        {mapSelectionDataoneIds && mapSelectionDataoneIds.length > 0 && (
          <div id="dataone-map-selection-chip-row" className="flex items-center justify-between rounded-md border border-emerald-200 bg-emerald-50 px-2.5 py-1.5 text-xs text-emerald-800">
            <span id="dataone-map-selection-chip-label">
              Map location filter active ({mapSelectionDataoneIds.length} dataset{mapSelectionDataoneIds.length === 1 ? '' : 's'})
            </span>
            <button
              id="dataone-map-selection-chip-clear-button"
              type="button"
              onClick={() => {
                setMapSelectionDataoneIds(null);
                setPage(0);
              }}
              className="font-medium text-emerald-700 hover:text-emerald-900"
            >
              Clear
            </button>
          </div>
        )}
      </EditFiltersCard>

      {showInitialLoading && (
        <InlineLoadingRow id="dataone-initial-loading" message="Loading datasets..." />
      )}

      {showRefreshLoading && (
        <RefreshLoadingRow id="dataone-refresh-loading" message="Refreshing datasets..." />
      )}
      {mapLoading && (
        <RefreshLoadingRow id="dataone-map-refresh-loading" message="Updating map markers..." />
      )}

      {error && (
        <div id="dataone-browse-error" className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          <AlertCircle id="dataone-browse-error-icon" className="mt-0.5 h-4 w-4 flex-shrink-0" />
          <span id="dataone-browse-error-text">{error}</span>
        </div>
      )}

      {!showInitialLoading && !error && datasets.length > 0 && (
        <DatasetListView
          datasets={datasets}
          loading={showRefreshLoading}
          savedDataoneIds={savedDataoneIds}
          searchTerm={searchInput.trim().length >= MIN_SEARCH_CHARS ? searchInput.trim() : ''}
          onViewDetail={openDatasetDetail}
        />
      )}

      {!showInitialLoading && !error && datasets.length === 0 && (
        <div id="dataone-empty-results" className="rounded-lg border border-dashed border-gray-300 p-5 text-center">
          <p id="dataone-empty-results-text" className="text-sm text-gray-600">No datasets match your filters.</p>
          {hasAnyFilter && (
            <button
              id="dataone-empty-results-clear-filters"
              onClick={clearAllFilters}
              className="mt-2 text-sm font-medium text-emerald-700 hover:text-emerald-800"
            >
              Clear all filters
            </button>
          )}
        </div>
      )}

      {!showInitialLoading && totalPages > 1 && (
        <BrowsePaginationControls
          idPrefix="dataone"
          page={page}
          totalPages={totalPages}
          onPrevious={() => setPage((prev) => Math.max(0, prev - 1))}
          onNext={() => setPage((prev) => Math.min(totalPages - 1, prev + 1))}
        />
      )}
    </div>
  );
}
