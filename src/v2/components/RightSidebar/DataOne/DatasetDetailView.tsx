// ============================================================================
// DatasetDetailView — Full drill-down details for a DataOne dataset.
// Implements Phase 4 task 4.5 acceptance criteria.
// ============================================================================

import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, Copy, ExternalLink, FileText, MapPin, Quote, Save } from 'lucide-react';
import { dataOneService, type DataOneDataset, type DataOneDatasetDetail } from '../../../../services/dataOneService';
import { InlineLoadingRow } from '../../shared/loading/LoadingPrimitives';
import { useMap } from '../../../context/MapContext';

interface DatasetDetailViewProps {
  dataset: DataOneDataset;
  onBack: () => void;
  onSaveDatasetView?: (dataset: DataOneDataset) => string | void;
  // eslint-disable-next-line no-unused-vars
  onKeywordClick?: (...args: [string]) => void;
}

function formatDate(value: Date | null | undefined): string {
  if (!value) return 'Unknown';
  return value.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

function formatDateRange(beginDate: Date | null | undefined, endDate: Date | null | undefined): string {
  if (!beginDate && !endDate) return 'Not specified';
  if (beginDate && endDate) {
    const beginYear = beginDate.getFullYear();
    const endYear = endDate.getFullYear();
    return beginYear === endYear ? String(beginYear) : `${beginYear} to ${endYear}`;
  }
  if (beginDate) return `From ${beginDate.getFullYear()}`;
  return `Until ${endDate?.getFullYear() ?? 'Unknown'}`;
}

function formatFileSize(bytes: number | null | undefined): string {
  if (!bytes || bytes <= 0) return 'Size unavailable';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  let size = bytes;
  let unitIndex = 0;
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex += 1;
  }
  return `${size.toFixed(size >= 10 || unitIndex === 0 ? 0 : 1)} ${units[unitIndex]}`;
}

function extractDoi(dataoneId: string): string | null {
  const trimmed = dataoneId.trim();
  if (!trimmed) return null;
  return trimmed.toLowerCase().startsWith('doi:') ? trimmed.slice(4) : null;
}

function buildDataOneUrl(dataset: DataOneDataset, details: DataOneDatasetDetail | null): string | null {
  return dataset.datasetUrl || details?.dataUrl || null;
}

function buildCitation(dataset: DataOneDataset, details: DataOneDatasetDetail | null): string {
  const authors = details?.authors?.length
    ? details.authors.join(', ')
    : (dataset.authors?.join(', ') || 'Unknown author');
  const year = dataset.dateUploaded?.getFullYear() ?? 'n.d.';
  const doi = extractDoi(dataset.dataoneId);
  const dataOneUrl = buildDataOneUrl(dataset, details);
  const doiOrUrl = doi ? `https://doi.org/${doi}` : (dataOneUrl || dataset.dataoneId);
  return `${authors} (${year}). ${dataset.title}. DataONE. ${doiOrUrl}`;
}

function formatBoundingBox(details: DataOneDatasetDetail | null): string {
  const coverage = details?.spatialCoverage;
  if (!coverage) return 'Not specified';
  const { north, south, east, west } = coverage;
  if ([north, south, east, west].some((value) => value == null)) {
    return 'Not specified';
  }
  return `${south!.toFixed(2)} to ${north!.toFixed(2)} lat, ${west!.toFixed(2)} to ${east!.toFixed(2)} lon`;
}

function describeFileType(ext: string): string {
  const normalized = ext.toLowerCase();
  if (normalized === 'csv') return 'Tabular data for analysis and reuse.';
  if (normalized === 'tsv') return 'Delimiter-separated tabular records.';
  if (normalized === 'json') return 'Structured machine-readable metadata or records.';
  if (normalized === 'xml') return 'Structured metadata or schema-based exchange format.';
  if (normalized === 'pdf') return 'Documentation, reports, or published methods.';
  if (normalized === 'zip') return 'Compressed package of one or more resources.';
  if (normalized === 'nc') return 'NetCDF scientific array data.';
  if (normalized === 'txt') return 'Plain-text notes, logs, or supplementary details.';
  return 'Research dataset files included in this package.';
}

export function DatasetDetailView({ dataset, onBack, onSaveDatasetView, onKeywordClick }: DatasetDetailViewProps) {
  const [details, setDetails] = useState<DataOneDatasetDetail | null>(null);
  const [fileInfoError, setFileInfoError] = useState<string | null>(null);
  const [remoteFileTypes, setRemoteFileTypes] = useState<string[]>([]);
  const [remoteFileCount, setRemoteFileCount] = useState<number | null>(null);
  const [remoteTotalSize, setRemoteTotalSize] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copiedState, setCopiedState] = useState<'idle' | 'doi' | 'cite'>('idle');
  const [viewSaved, setViewSaved] = useState(false);
  const [saveFeedback, setSaveFeedback] = useState<string | null>(null);
  const { viewRef, highlightPoint, showToast, openDataOnePreview } = useMap();

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    setFileInfoError(null);
    setRemoteFileTypes([]);
    setRemoteFileCount(null);
    setRemoteTotalSize(null);
    setViewSaved(false);
    setSaveFeedback(null);

    void dataOneService.getDatasetDetails(dataset.dataoneId)
      .then((value) => {
        if (!cancelled) setDetails(value);
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load dataset details');
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    void dataOneService.getFileInfo(dataset.dataoneId)
      .then((fileInfo) => {
        if (cancelled) return;
        if (fileInfo.error) {
          setFileInfoError(fileInfo.error);
          return;
        }
        setRemoteFileTypes(fileInfo.fileTypes);
        setRemoteFileCount(fileInfo.fileCount);
        setRemoteTotalSize(fileInfo.totalSize);
      })
      .catch((err) => {
        if (!cancelled) {
          setFileInfoError(err instanceof Error ? err.message : 'Unable to load file types');
        }
      });

    return () => { cancelled = true; };
  }, [dataset.dataoneId]);

  useEffect(() => {
    if (copiedState === 'idle') return;
    const timer = window.setTimeout(() => setCopiedState('idle'), 2000);
    return () => window.clearTimeout(timer);
  }, [copiedState]);

  const openDataOneUrl = buildDataOneUrl(dataset, details);
  const doi = extractDoi(dataset.dataoneId);
  const citationText = buildCitation(dataset, details);

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

  const handleSaveDatasetView = () => {
    const feedback = onSaveDatasetView?.(dataset);
    setViewSaved(true);
    setSaveFeedback(feedback || 'Saved view in Map Layers.');
  };

  const handleCopyDoi = async () => {
    const text = doi || dataset.dataoneId;
    try {
      await navigator.clipboard.writeText(text);
      setCopiedState('doi');
    } catch {
      showToast('Unable to copy DOI', 'warning');
    }
  };

  const handleCopyCitation = async () => {
    try {
      await navigator.clipboard.writeText(citationText);
      setCopiedState('cite');
    } catch {
      showToast('Unable to copy citation', 'warning');
    }
  };

  const handleOpenInNewTab = () => {
    if (!openDataOneUrl) return;
    window.open(openDataOneUrl, '_blank', 'noopener,noreferrer');
  };

  const handleOpenInApp = () => {
    if (!openDataOneUrl) return;
    openDataOnePreview(openDataOneUrl, dataset.title);
  };

  const handleViewOnMap = async () => {
    const view = viewRef.current;
    if (!view) return;

    const centerLon = dataset.centerLon;
    const centerLat = dataset.centerLat;

    if (Number.isFinite(centerLon) && Number.isFinite(centerLat)) {
      try {
        await view.goTo({ center: [centerLon as number, centerLat as number], zoom: 11 }, { duration: 800 });
        highlightPoint(centerLon as number, centerLat as number);
        showToast('Centered map on dataset location', 'info');
      } catch {
        showToast('Could not focus map on dataset', 'warning');
      }
      return;
    }

    const bounds = details?.spatialCoverage;
    if (bounds && bounds.west != null && bounds.south != null && bounds.east != null && bounds.north != null) {
      try {
        await view.goTo({
          target: {
            xmin: bounds.west,
            ymin: bounds.south,
            xmax: bounds.east,
            ymax: bounds.north,
            spatialReference: { wkid: 4326 },
          },
        }, { duration: 800 });
        showToast('Centered map on dataset spatial extent', 'info');
      } catch {
        showToast('Could not focus map on dataset extent', 'warning');
      }
      return;
    }

    showToast('No spatial coordinates available for this dataset', 'warning');
  };

  return (
    <div id="dataone-dataset-detail-view" className="space-y-4">
      <button
        id="dataone-detail-back-button"
        onClick={onBack}
        className="inline-flex items-center gap-1 text-sm font-medium text-emerald-700 hover:text-emerald-800"
      >
        <ArrowLeft className="h-4 w-4" />
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
          {(openDataOneUrl || doi) && (
            <section id="dataone-detail-primary-actions-section" className="space-y-2">
              {openDataOneUrl && (
                <div id="dataone-detail-open-mode-button-row" className="flex flex-col gap-2">
                  <button
                    id="dataone-detail-open-new-tab-button"
                    type="button"
                    onClick={handleOpenInNewTab}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-700 px-3 py-2 text-sm font-medium text-white hover:bg-emerald-800"
                  >
                    Open in DataONE (New Tab)
                    <ExternalLink className="h-4 w-4" />
                  </button>
                  <button
                    id="dataone-detail-open-in-app-button"
                    type="button"
                    onClick={handleOpenInApp}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-emerald-300 bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-800 hover:bg-emerald-100"
                  >
                    Open in DataONE (In App)
                  </button>
                </div>
              )}
              <button
                id="dataone-detail-save-view-button"
                type="button"
                onClick={handleSaveDatasetView}
                className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm font-medium text-amber-800 hover:bg-amber-100"
              >
                <Save className="h-4 w-4" />
                {viewSaved ? 'Dataset View Saved' : 'Save Dataset View'}
              </button>
              {viewSaved && (
                <p id="dataone-detail-save-view-feedback" className="text-xs text-emerald-700">
                  {saveFeedback}
                </p>
              )}
              <div id="dataone-detail-secondary-actions-row" className="grid grid-cols-2 gap-2">
                <button
                  id="dataone-detail-copy-doi-button"
                  type="button"
                  onClick={() => { void handleCopyDoi(); }}
                  className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50"
                >
                  <Copy className="h-3.5 w-3.5" />
                  {copiedState === 'doi' ? 'DOI Copied' : 'Copy DOI'}
                </button>
                <button
                  id="dataone-detail-copy-citation-button"
                  type="button"
                  onClick={() => { void handleCopyCitation(); }}
                  className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50"
                >
                  <Quote className="h-3.5 w-3.5" />
                  {copiedState === 'cite' ? 'Citation Copied' : 'Cite'}
                </button>
              </div>
            </section>
          )}

          {details?.abstract && (
            <section id="dataone-detail-abstract-section">
              <h4 id="dataone-detail-abstract-label" className="mb-1 font-semibold text-gray-900">Abstract</h4>
              <p id="dataone-detail-abstract-text" className="leading-relaxed">{details.abstract}</p>
            </section>
          )}

          <section id="dataone-detail-metadata-section" className="rounded bg-slate-50 p-3">
            <dl id="dataone-detail-metadata-grid" className="grid grid-cols-2 gap-x-3 gap-y-2 text-xs">
              <dt id="dataone-detail-uploaded-label" className="text-gray-500">Uploaded</dt>
              <dd id="dataone-detail-uploaded-value" className="text-right text-gray-800">{formatDate(dataset.dateUploaded)}</dd>
              <dt id="dataone-detail-temporal-label" className="text-gray-500">Temporal coverage</dt>
              <dd id="dataone-detail-temporal-value" className="text-right text-gray-800">
                {formatDateRange(dataset.temporalCoverage.beginDate, dataset.temporalCoverage.endDate)}
              </dd>
              <dt id="dataone-detail-category-label" className="text-gray-500">Primary category</dt>
              <dd id="dataone-detail-category-value" className="text-right text-gray-800">{dataset.tncCategory || 'Unspecified'}</dd>
            </dl>
          </section>

          <section id="dataone-detail-spatial-section" className="space-y-2 rounded border border-gray-200 bg-white p-3">
            <div id="dataone-detail-spatial-header" className="flex items-center justify-between">
              <h4 id="dataone-detail-spatial-label" className="inline-flex items-center gap-1.5 font-semibold text-gray-900">
                <MapPin className="h-4 w-4" />
                Spatial Coverage
              </h4>
              <button
                id="dataone-detail-view-on-map-button"
                type="button"
                onClick={() => { void handleViewOnMap(); }}
                className="text-xs font-medium text-emerald-700 hover:text-emerald-800"
              >
                View on Map
              </button>
            </div>
            <p id="dataone-detail-spatial-value" className="text-xs text-gray-600">
              {formatBoundingBox(details)}
            </p>
          </section>

          {details?.authors && details.authors.length > 0 && (
            <section id="dataone-detail-authors-section">
              <h4 id="dataone-detail-authors-label" className="mb-1 font-semibold text-gray-900">Authors</h4>
              <p id="dataone-detail-authors-value">{details.authors.join(', ')}</p>
            </section>
          )}

          <section id="dataone-detail-files-section" className="space-y-2">
            <h4 id="dataone-detail-files-label" className="inline-flex items-center gap-1.5 font-semibold text-gray-900">
              <FileText className="h-4 w-4" />
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
