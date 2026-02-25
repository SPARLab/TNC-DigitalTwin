import { ChevronDown, ChevronUp, Copy, ExternalLink, FileText, History as HistoryIcon, Loader2, MapPin, Quote, Save } from 'lucide-react';
import type {
  DataOneDataset,
  DataOneDatasetDetail,
  DataOneVersionEntry,
} from '../../../../services/dataOneService';
import type { DatasetDetailFileRow } from './datasetDetailFormatting';
import {
  formatBoundingBox,
  formatDate,
  formatDateRange,
  formatFileSize,
  formatVersionSummary,
} from './datasetDetailFormatting';

interface DatasetDetailPrimaryActionsSectionProps {
  copiedState: 'idle' | 'doi' | 'cite';
  doi: string | null;
  isDatasetSaved?: boolean;
  openDataOneUrl: string | null;
  saveFeedback: string | null;
  onCopyCitation: () => Promise<void>;
  onCopyDoi: () => Promise<void>;
  onOpenInApp: () => void;
  onOpenInNewTab: () => void;
  onSaveOrUnsave: () => void;
}

export function DatasetDetailPrimaryActionsSection({
  copiedState,
  doi,
  isDatasetSaved,
  openDataOneUrl,
  saveFeedback,
  onCopyCitation,
  onCopyDoi,
  onOpenInApp,
  onOpenInNewTab,
  onSaveOrUnsave,
}: DatasetDetailPrimaryActionsSectionProps) {
  if (!openDataOneUrl && !doi) return null;

  return (
    <section id="dataone-detail-primary-actions-section" className="space-y-2">
      {openDataOneUrl && (
        <div id="dataone-detail-open-mode-button-row" className="flex flex-col gap-2">
          <button
            id="dataone-detail-open-new-tab-button"
            type="button"
            onClick={onOpenInNewTab}
            className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-700 px-3 py-2 text-sm font-medium text-white hover:bg-emerald-800"
          >
            Open in DataONE (New Tab)
            <ExternalLink id="dataone-detail-open-new-tab-icon" className="h-4 w-4" />
          </button>
          <button
            id="dataone-detail-open-in-app-button"
            type="button"
            onClick={onOpenInApp}
            className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-emerald-300 bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-800 hover:bg-emerald-100"
          >
            Open in DataONE (In App)
          </button>
        </div>
      )}
      <button
        id="dataone-detail-save-view-button"
        type="button"
        onClick={onSaveOrUnsave}
        className={`inline-flex w-full items-center justify-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium ${
          isDatasetSaved
            ? 'border-rose-200 bg-rose-50 text-rose-800 hover:bg-rose-100'
            : 'border-amber-200 bg-amber-50 text-amber-800 hover:bg-amber-100'
        }`}
      >
        <Save id="dataone-detail-save-view-icon" className="h-4 w-4" />
        {isDatasetSaved ? 'Unsave Dataset View' : 'Save Dataset View'}
      </button>
      {saveFeedback && (
        <p id="dataone-detail-save-view-feedback" className="text-xs text-emerald-700">
          {saveFeedback}
        </p>
      )}
      <div id="dataone-detail-secondary-actions-row" className="grid grid-cols-2 gap-2">
        <button
          id="dataone-detail-copy-doi-button"
          type="button"
          onClick={() => { void onCopyDoi(); }}
          className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50"
        >
          <Copy id="dataone-detail-copy-doi-icon" className="h-3.5 w-3.5" />
          {copiedState === 'doi' ? 'DOI Copied' : 'Copy DOI'}
        </button>
        <button
          id="dataone-detail-copy-citation-button"
          type="button"
          onClick={() => { void onCopyCitation(); }}
          className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50"
        >
          <Quote id="dataone-detail-copy-citation-icon" className="h-3.5 w-3.5" />
          {copiedState === 'cite' ? 'Citation Copied' : 'Cite'}
        </button>
      </div>
    </section>
  );
}

interface DatasetDetailVersionHistorySectionProps {
  dataset: DataOneDataset;
  loadingVersionId: string | null;
  versionEntries: DataOneVersionEntry[];
  versionHistoryError: string | null;
  versionHistoryLoading: boolean;
  versionHistoryOpen: boolean;
  onSelectVersion: (entry: DataOneVersionEntry) => Promise<void>;
  onToggleVersionHistory: () => Promise<void>;
}

export function DatasetDetailVersionHistorySection({
  dataset,
  loadingVersionId,
  versionEntries,
  versionHistoryError,
  versionHistoryLoading,
  versionHistoryOpen,
  onSelectVersion,
  onToggleVersionHistory,
}: DatasetDetailVersionHistorySectionProps) {
  if (dataset.versionCount <= 1) return null;

  return (
    <section id="dataone-detail-version-history-section" className="rounded-lg border border-gray-200 overflow-hidden">
      <button
        id="dataone-detail-version-history-toggle"
        type="button"
        onClick={() => { void onToggleVersionHistory(); }}
        className="flex w-full items-center justify-between bg-gray-50 p-3 text-left hover:bg-gray-100 transition-colors"
      >
        <span id="dataone-detail-version-history-toggle-label" className="inline-flex items-center gap-2">
          <HistoryIcon id="dataone-detail-version-history-toggle-icon" className="h-4 w-4 text-blue-600" />
          <span id="dataone-detail-version-history-toggle-text" className="text-sm font-medium text-gray-700">
            Version History ({dataset.versionCount} versions)
          </span>
        </span>
        {versionHistoryOpen ? (
          <ChevronUp id="dataone-detail-version-history-toggle-up" className="h-4 w-4 text-gray-400" />
        ) : (
          <ChevronDown id="dataone-detail-version-history-toggle-down" className="h-4 w-4 text-gray-400" />
        )}
      </button>

      {versionHistoryOpen && (
        <div id="dataone-detail-version-history-panel" className="border-t border-gray-200 bg-white p-3">
          {versionHistoryLoading ? (
            <div id="dataone-detail-version-history-loading" className="flex items-center gap-2 text-sm text-gray-500">
              <Loader2 id="dataone-detail-version-history-loading-icon" className="h-4 w-4 animate-spin" />
              Loading versions...
            </div>
          ) : versionHistoryError ? (
            <p id="dataone-detail-version-history-error" className="text-sm text-red-700">
              {versionHistoryError}
            </p>
          ) : versionEntries.length > 0 ? (
            <div id="dataone-detail-version-history-list" className="space-y-2">
              {versionEntries.map((entry, index) => {
                const isLatest = index === 0;
                const isCurrent = entry.dataoneId === dataset.dataoneId;
                const versionNumber = versionEntries.length - index;
                const summary = formatVersionSummary(entry.filesSummary);
                const hasDifferentFiles = Boolean(
                  dataset.filesSummary &&
                  entry.filesSummary &&
                  (dataset.filesSummary.total !== entry.filesSummary.total ||
                    dataset.filesSummary.sizeBytes !== entry.filesSummary.sizeBytes),
                );
                const selectingThisEntry = loadingVersionId === entry.dataoneId;

                return (
                  <div
                    id={`dataone-detail-version-entry-${entry.dataoneId}`}
                    key={entry.dataoneId}
                    className={`rounded-lg border p-2 ${
                      isCurrent
                        ? 'bg-emerald-50 border-emerald-200'
                        : 'bg-white border-gray-100 hover:border-gray-200'
                    }`}
                  >
                    <div id={`dataone-detail-version-entry-header-${entry.dataoneId}`} className="mb-1 flex items-center justify-between">
                      <div id={`dataone-detail-version-entry-labels-${entry.dataoneId}`} className="flex items-center gap-2">
                        <span id={`dataone-detail-version-entry-number-${entry.dataoneId}`} className={`text-sm font-medium ${isCurrent ? 'text-emerald-700' : 'text-gray-700'}`}>
                          v{versionNumber}
                        </span>
                        {isLatest && (
                          <span
                            id={`dataone-detail-version-entry-latest-${entry.dataoneId}`}
                            className="rounded bg-emerald-100 px-1.5 py-0.5 text-xs text-emerald-700"
                          >
                            latest
                          </span>
                        )}
                        {isCurrent && (
                          <span
                            id={`dataone-detail-version-entry-current-${entry.dataoneId}`}
                            className="rounded bg-blue-100 px-1.5 py-0.5 text-xs text-blue-700"
                          >
                            current
                          </span>
                        )}
                      </div>
                      <span id={`dataone-detail-version-entry-date-${entry.dataoneId}`} className="text-xs text-gray-500">
                        {formatDate(entry.dateUploaded)}
                      </span>
                    </div>

                    {summary && (
                      <p
                        id={`dataone-detail-version-entry-summary-${entry.dataoneId}`}
                        className={`text-xs ${hasDifferentFiles ? 'text-amber-600 font-medium' : 'text-gray-500'}`}
                      >
                        {summary}
                        {hasDifferentFiles ? ' ←' : ''}
                      </p>
                    )}

                    {!isCurrent && (
                      <button
                        id={`dataone-detail-version-entry-view-button-${entry.dataoneId}`}
                        type="button"
                        disabled={selectingThisEntry}
                        onClick={() => { void onSelectVersion(entry); }}
                        className="mt-2 text-xs text-emerald-700 hover:underline disabled:opacity-60"
                      >
                        {selectingThisEntry ? 'Loading version...' : 'View this version →'}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <p id="dataone-detail-version-history-empty" className="text-sm text-gray-500">
              No version history available.
            </p>
          )}
        </div>
      )}
    </section>
  );
}

interface DatasetDetailMetadataSectionProps {
  dataset: DataOneDataset;
}

export function DatasetDetailMetadataSection({ dataset }: DatasetDetailMetadataSectionProps) {
  return (
    <section id="dataone-detail-metadata-section" className="rounded bg-slate-50 p-3">
      <dl id="dataone-detail-metadata-grid" className="grid grid-cols-2 gap-x-3 gap-y-2 text-xs">
        <dt id="dataone-detail-uploaded-label" className="text-gray-500">Uploaded</dt>
        <dd id="dataone-detail-uploaded-value" className="text-right text-gray-800">{formatDate(dataset.dateUploaded)}</dd>
        <dt id="dataone-detail-version-count-label" className="text-gray-500">Versions</dt>
        <dd id="dataone-detail-version-count-value" className="text-right text-gray-800">
          {dataset.versionCount} version{dataset.versionCount === 1 ? '' : 's'}
        </dd>
        <dt id="dataone-detail-temporal-label" className="text-gray-500">Temporal coverage</dt>
        <dd id="dataone-detail-temporal-value" className="text-right text-gray-800">
          {formatDateRange(dataset.temporalCoverage.beginDate, dataset.temporalCoverage.endDate)}
        </dd>
        <dt id="dataone-detail-category-label" className="text-gray-500">Primary category</dt>
        <dd id="dataone-detail-category-value" className="text-right text-gray-800">{dataset.tncCategory || 'Unspecified'}</dd>
      </dl>
    </section>
  );
}

interface DatasetDetailSpatialCoverageSectionProps {
  details: DataOneDatasetDetail | null;
  onRecenter: () => Promise<void>;
}

export function DatasetDetailSpatialCoverageSection({ details, onRecenter }: DatasetDetailSpatialCoverageSectionProps) {
  return (
    <section id="dataone-detail-spatial-section" className="space-y-2 rounded border border-gray-200 bg-white p-3">
      <div id="dataone-detail-spatial-header" className="flex items-center justify-between">
        <h4 id="dataone-detail-spatial-label" className="inline-flex items-center gap-1.5 font-semibold text-gray-900">
          <MapPin id="dataone-detail-spatial-icon" className="h-4 w-4" />
          Spatial Coverage
        </h4>
        <button
          id="dataone-detail-recenter-button"
          type="button"
          onClick={() => { void onRecenter(); }}
          className="text-xs font-medium text-emerald-700 hover:text-emerald-800"
        >
          Recenter
        </button>
      </div>
      <p id="dataone-detail-spatial-value" className="text-xs text-gray-600">
        {formatBoundingBox(details)}
      </p>
    </section>
  );
}

interface DatasetDetailFilesSectionProps {
  fileInfoError: string | null;
  fileRows: DatasetDetailFileRow[];
  totalFileCount: number;
  totalFileSize: number | null;
}

export function DatasetDetailFilesSection({
  fileInfoError,
  fileRows,
  totalFileCount,
  totalFileSize,
}: DatasetDetailFilesSectionProps) {
  return (
    <section id="dataone-detail-files-section" className="space-y-2">
      <h4 id="dataone-detail-files-label" className="inline-flex items-center gap-1.5 font-semibold text-gray-900">
        <FileText id="dataone-detail-files-icon" className="h-4 w-4" />
        Files
      </h4>
      <p id="dataone-detail-files-summary" className="text-xs text-gray-600">
        {totalFileCount > 0 ? `${totalFileCount} files` : 'File count unavailable'}
        {' • '}
        {formatFileSize(totalFileSize)}
      </p>
      {fileRows.length > 0 ? (
        <div id="dataone-detail-files-list" className="space-y-1">
          {fileRows.map((fileRow, index) => (
            <div
              id={`dataone-detail-file-row-${index}`}
              key={`${fileRow.ext}-${index}`}
              className="rounded border border-gray-100 bg-slate-50 px-2.5 py-2"
            >
              <p id={`dataone-detail-file-row-title-${index}`} className="text-xs font-semibold text-gray-800">
                {fileRow.ext}
                {fileRow.count != null ? ` (${fileRow.count})` : ''}
              </p>
              <p id={`dataone-detail-file-row-description-${index}`} className="text-xs text-gray-600">
                {fileRow.description}
              </p>
            </div>
          ))}
        </div>
      ) : (
        <p id="dataone-detail-files-empty" className="text-xs text-gray-500">
          No file details were returned for this dataset.
        </p>
      )}
      {fileInfoError && (
        <p id="dataone-detail-files-error" className="text-xs text-amber-700">
          Additional file details unavailable: {fileInfoError}
        </p>
      )}
    </section>
  );
}
