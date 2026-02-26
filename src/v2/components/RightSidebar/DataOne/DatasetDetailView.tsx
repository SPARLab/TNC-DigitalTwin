// ============================================================================
// DatasetDetailView — Full drill-down details for a DataOne dataset.
// Implements Phase 4 task 4.5 acceptance criteria.
// ============================================================================

import { useMemo } from 'react';
import { ArrowLeft } from 'lucide-react';
import {
  type DataOneDataset,
} from '../../../../services/dataOneService';
import { InlineLoadingRow } from '../../shared/loading/LoadingPrimitives';
import { useDatasetDetailOrchestrator } from './useDatasetDetailOrchestrator';
import {
  DatasetDetailFilesSection,
  DatasetDetailMetadataSection,
  DatasetDetailPrimaryActionsSection,
  DatasetDetailSpatialCoverageSection,
  DatasetDetailVersionHistorySection,
} from './DatasetDetailSections';
import { describeFileType } from './datasetDetailFormatting';

interface DatasetDetailViewProps {
  dataset: DataOneDataset;
  onBack: () => void;
  // eslint-disable-next-line no-unused-vars
  onSaveDatasetView?: (dataset: DataOneDataset) => string | void;
  onUnsaveDatasetView?: () => void;
  isDatasetSaved?: boolean;
  // eslint-disable-next-line no-unused-vars
  onKeywordClick?: (...args: [string]) => void;
  // eslint-disable-next-line no-unused-vars
  onVersionSelect?: (dataset: DataOneDataset) => void;
}

export function DatasetDetailView({
  dataset,
  onBack,
  onSaveDatasetView,
  onUnsaveDatasetView,
  isDatasetSaved,
  onKeywordClick,
  onVersionSelect,
}: DatasetDetailViewProps) {
  const {
    citationText,
    copiedState,
    details,
    doi,
    error,
    fileInfoError,
    handleCopyCitation,
    handleCopyDoi,
    handleOpenInApp,
    handleOpenInNewTab,
    handleRecenter,
    handleSaveOrUnsave,
    handleSelectVersion,
    loading,
    loadingVersionId,
    openDataOneUrl,
    remoteFileCount,
    remoteFileTypes,
    remoteTotalSize,
    saveFeedback,
    toggleVersionHistory,
    versionEntries,
    versionHistoryError,
    versionHistoryLoading,
    versionHistoryOpen,
  } = useDatasetDetailOrchestrator({
    dataset,
    isDatasetSaved,
    onSaveDatasetView,
    onUnsaveDatasetView,
    onVersionSelect,
  });

  const fileRows = useMemo(() => {
    const entries = Object.entries((details?.filesSummary || dataset.filesSummary)?.byExtension || {});
    if (entries.length > 0) {
      return entries
        .sort(([, left], [, right]) => right - left)
        .map(([ext, count]) => ({
          ext: ext.toUpperCase(),
          count,
          description: describeFileType(ext),
        }));
    }
    return remoteFileTypes.map((ext) => ({
      ext: ext.toUpperCase(),
      count: null as number | null,
      description: describeFileType(ext),
    }));
  }, [dataset.filesSummary, details?.filesSummary, remoteFileTypes]);

  const totalFileCount = (details?.filesSummary || dataset.filesSummary)?.total ?? remoteFileCount ?? 0;
  const totalFileSize = (details?.filesSummary || dataset.filesSummary)?.sizeBytes ?? remoteTotalSize ?? details?.sizeBytes ?? null;

  return (
    <div id="dataone-dataset-detail-view" className="space-y-4">
      <button
        id="dataone-detail-back-button"
        onClick={onBack}
        className="inline-flex items-center gap-1 text-sm font-medium text-emerald-700 hover:text-emerald-800"
      >
        <ArrowLeft id="dataone-detail-back-button-icon" className="h-4 w-4" />
        Back to Datasets
      </button>

      <header id="dataone-detail-header" className="space-y-1">
        <h3 id="dataone-detail-title" className="text-base font-semibold text-gray-900 leading-tight">
          {dataset.title}
        </h3>
        <p id="dataone-detail-dataone-id" className="text-xs text-gray-500">
          {dataset.dataoneId}
        </p>
      </header>

      {loading && (
        <InlineLoadingRow id="dataone-detail-loading" message="Loading dataset details..." />
      )}

      {error && (
        <p id="dataone-detail-error" className="rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      {!loading && !error && (
        <div id="dataone-detail-content" className="space-y-4 text-sm text-gray-700">
          <DatasetDetailPrimaryActionsSection
            copiedState={copiedState}
            doi={doi}
            isDatasetSaved={isDatasetSaved}
            openDataOneUrl={openDataOneUrl}
            saveFeedback={saveFeedback}
            onCopyCitation={handleCopyCitation}
            onCopyDoi={handleCopyDoi}
            onOpenInApp={handleOpenInApp}
            onOpenInNewTab={handleOpenInNewTab}
            onSaveOrUnsave={handleSaveOrUnsave}
          />

          {details?.abstract && (
            <section id="dataone-detail-abstract-section">
              <h4 id="dataone-detail-abstract-label" className="mb-1 font-semibold text-gray-900">Abstract</h4>
              <p id="dataone-detail-abstract-text" className="leading-relaxed">{details.abstract}</p>
            </section>
          )}

          <DatasetDetailVersionHistorySection
            dataset={dataset}
            loadingVersionId={loadingVersionId}
            versionEntries={versionEntries}
            versionHistoryError={versionHistoryError}
            versionHistoryLoading={versionHistoryLoading}
            versionHistoryOpen={versionHistoryOpen}
            onSelectVersion={handleSelectVersion}
            onToggleVersionHistory={toggleVersionHistory}
          />

          <DatasetDetailMetadataSection dataset={dataset} />

          <DatasetDetailSpatialCoverageSection details={details} onRecenter={handleRecenter} />

          {details?.authors && details.authors.length > 0 && (
            <section id="dataone-detail-authors-section">
              <h4 id="dataone-detail-authors-label" className="mb-1 font-semibold text-gray-900">Authors</h4>
              <p id="dataone-detail-authors-value">{details.authors.join(', ')}</p>
            </section>
          )}

          <DatasetDetailFilesSection
            fileInfoError={fileInfoError}
            fileRows={fileRows}
            totalFileCount={totalFileCount}
            totalFileSize={totalFileSize}
          />

          {details?.keywords && details.keywords.length > 0 && (
            <section id="dataone-detail-keywords-section" className="space-y-2">
              <h4 id="dataone-detail-keywords-label" className="font-semibold text-gray-900">Keywords</h4>
              <div id="dataone-detail-keywords-wrap" className="flex flex-wrap gap-1.5">
                {details.keywords.map((keyword, index) => (
                  <button
                    id={`dataone-detail-keyword-${index}`}
                    key={`${keyword}-${index}`}
                    type="button"
                    onClick={() => onKeywordClick?.(keyword)}
                    className="rounded-full border border-gray-200 bg-white px-2 py-0.5 text-xs text-gray-700 hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700"
                  >
                    {keyword}
                  </button>
                ))}
              </div>
            </section>
          )}

          <section id="dataone-detail-citation-section" className="rounded bg-slate-50 p-3">
            <h4 id="dataone-detail-citation-label" className="mb-1 font-semibold text-gray-900">Citation</h4>
            <p id="dataone-detail-citation-text" className="text-xs leading-relaxed text-gray-700">
              {citationText}
            </p>
          </section>
        </div>
      )}

      {!loading && !error && !details && (
        <section id="dataone-detail-missing-section" className="rounded border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-700">
          Full detail metadata is unavailable for this record. Showing list-level metadata only.
        </section>
      )}
    </div>
  );
}
