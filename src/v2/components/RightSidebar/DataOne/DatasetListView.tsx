// ============================================================================
// DatasetListView — DataOne dataset list cards for browse results.
// ============================================================================

import { useMemo, useState } from 'react';
import { ChevronDown, ChevronUp, History, Link as LinkIcon, Loader2 } from 'lucide-react';
import {
  dataOneService,
  type DataOneDataset,
  type DataOneVersionEntry,
} from '../../../../services/dataOneService';

interface DatasetListViewProps {
  datasets: DataOneDataset[];
  loading: boolean;
  onViewDetail: (dataset: DataOneDataset) => void;
}

interface VersionHistoryState {
  open: boolean;
  loading: boolean;
  error: string | null;
  versions: DataOneVersionEntry[];
  showAll: boolean;
}

function shouldOpenDetailFromClick(target: EventTarget | null, currentTarget: HTMLElement): boolean {
  if (!(target instanceof HTMLElement)) return true;
  const interactiveAncestor = target.closest('a, button, input, select, textarea, [role="button"]');
  return !interactiveAncestor || interactiveAncestor === currentTarget;
}

function formatYearRange(dataset: DataOneDataset): string {
  const beginYear = dataset.temporalCoverage.beginDate?.getFullYear();
  const endYear = dataset.temporalCoverage.endDate?.getFullYear();

  if (beginYear && endYear) {
    return beginYear === endYear ? String(beginYear) : `${beginYear} to ${endYear}`;
  }
  if (beginYear) return `From ${beginYear}`;
  if (endYear) return `Until ${endYear}`;
  return 'Year not specified';
}

function getDoi(dataset: DataOneDataset): string | null {
  const rawId = dataset.dataoneId?.trim();
  if (!rawId) return null;
  if (rawId.toLowerCase().startsWith('doi:')) {
    return rawId.slice(4);
  }
  return null;
}

function getDescriptionSnippet(dataset: DataOneDataset): string {
  const categoryText = dataset.tncCategory || 'research';
  const repositoryText = dataset.repository ? ` from ${dataset.repository}` : '';
  return `Dataset metadata for ${categoryText.toLowerCase()} studies${repositoryText}. Open details to view full abstract and coverage.`;
}

function formatAuthors(dataset: DataOneDataset): string {
  if (!dataset.authors || dataset.authors.length === 0) return 'Author not specified';
  if (dataset.authors.length <= 2) return dataset.authors.join(', ');
  return `${dataset.authors[0]} et al.`;
}

function formatFileTypes(dataset: DataOneDataset): string | null {
  if (!dataset.filesSummary || dataset.filesSummary.total <= 0) return null;

  const extensions = Object.entries(dataset.filesSummary.byExtension)
    .sort(([, a], [, b]) => b - a)
    .map(([ext]) => ext.toUpperCase());

  if (extensions.length === 0) {
    return `${dataset.filesSummary.total} file${dataset.filesSummary.total === 1 ? '' : 's'}`;
  }

  return `${dataset.filesSummary.total} files: ${extensions.slice(0, 3).join(', ')}`;
}

function formatVersionDate(value: Date | null): string {
  if (!value) return 'Unknown date';
  return value.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function formatVersionFileSummary(entry: DataOneVersionEntry): string | null {
  if (!entry.filesSummary || entry.filesSummary.total <= 0) return null;
  const extParts = Object.entries(entry.filesSummary.byExtension)
    .sort(([, left], [, right]) => right - left)
    .slice(0, 3)
    .map(([ext, count]) => `${count} ${ext.toUpperCase()}`);
  if (extParts.length === 0) return `${entry.filesSummary.total} files`;
  return extParts.join(', ');
}

export function DatasetListView({ datasets, loading, onViewDetail }: DatasetListViewProps) {
  const [versionHistoryBySeries, setVersionHistoryBySeries] = useState<Record<string, VersionHistoryState>>({});
  const [loadingVersionId, setLoadingVersionId] = useState<string | null>(null);

  const historyByDatasetId = useMemo(() => {
    const map = new Map<number, VersionHistoryState>();
    for (const dataset of datasets) {
      const state = versionHistoryBySeries[dataset.seriesId];
      if (state) map.set(dataset.id, state);
    }
    return map;
  }, [datasets, versionHistoryBySeries]);

  const loadAndOpenVersionHistory = async (dataset: DataOneDataset) => {
    setVersionHistoryBySeries((prev) => ({
      ...prev,
      [dataset.seriesId]: {
        open: true,
        loading: true,
        error: null,
        versions: prev[dataset.seriesId]?.versions || [],
        showAll: false,
      },
    }));

    try {
      const versions = await dataOneService.queryVersionHistory(dataset.seriesId);
      setVersionHistoryBySeries((prev) => ({
        ...prev,
        [dataset.seriesId]: {
          open: true,
          loading: false,
          error: null,
          versions,
          showAll: false,
        },
      }));
    } catch (err) {
      setVersionHistoryBySeries((prev) => ({
        ...prev,
        [dataset.seriesId]: {
          open: true,
          loading: false,
          error: err instanceof Error ? err.message : 'Failed to load versions',
          versions: [],
          showAll: false,
        },
      }));
    }
  };

  const toggleVersionHistory = (dataset: DataOneDataset) => {
    const current = versionHistoryBySeries[dataset.seriesId];
    if (!current) {
      void loadAndOpenVersionHistory(dataset);
      return;
    }
    if (!current.open) {
      if (current.versions.length > 0 || current.error) {
        setVersionHistoryBySeries((prev) => ({
          ...prev,
          [dataset.seriesId]: { ...current, open: true },
        }));
        return;
      }
      void loadAndOpenVersionHistory(dataset);
      return;
    }
    setVersionHistoryBySeries((prev) => ({
      ...prev,
      [dataset.seriesId]: { ...current, open: false },
    }));
  };

  const toggleShowAllVersions = (seriesId: string) => {
    const current = versionHistoryBySeries[seriesId];
    if (!current) return;
    setVersionHistoryBySeries((prev) => ({
      ...prev,
      [seriesId]: { ...current, showAll: !current.showAll },
    }));
  };

  const handleVersionSelect = async (dataoneId: string) => {
    try {
      setLoadingVersionId(dataoneId);
      const versionDetails = await dataOneService.getVersionDetails(dataoneId);
      if (versionDetails) onViewDetail(versionDetails);
    } finally {
      setLoadingVersionId(null);
    }
  };

  return (
    <div id="dataone-dataset-list-view" className={`space-y-2 ${loading ? 'opacity-60' : ''}`}>
      {datasets.map((dataset) => {
        const doi = getDoi(dataset);
        const fileSummary = formatFileTypes(dataset);
        const hasMultipleVersions = dataset.versionCount > 1;
        const versionState = historyByDatasetId.get(dataset.id);
        const isHistoryOpen = Boolean(versionState?.open);
        const visibleVersions = versionState?.showAll
          ? (versionState?.versions || [])
          : (versionState?.versions || []).slice(0, 3);

        return (
          <article id={`dataone-dataset-wrapper-${dataset.id}`} key={dataset.id} className="rounded-lg border border-gray-200 bg-white overflow-hidden">
            <div
              id={`dataone-dataset-card-${dataset.id}`}
              role="button"
              tabIndex={0}
              aria-label={`Open details for ${dataset.title}`}
              onClick={(event) => {
                if (!shouldOpenDetailFromClick(event.target, event.currentTarget)) return;
                onViewDetail(dataset);
              }}
              onKeyDown={(event) => {
                if (event.target !== event.currentTarget) return;
                if (event.key !== 'Enter' && event.key !== ' ') return;
                event.preventDefault();
                onViewDetail(dataset);
              }}
              className="cursor-pointer p-3 transition-colors duration-150 hover:border-emerald-300 hover:bg-emerald-50/30 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-1"
            >
              <h3 id={`dataone-dataset-title-${dataset.id}`} className="text-sm font-semibold text-gray-900 line-clamp-2">
                {dataset.title}
              </h3>
              <p id={`dataone-dataset-authors-${dataset.id}`} className="mt-1 text-xs text-gray-600">
                {formatAuthors(dataset)}
                <span id={`dataone-dataset-year-inline-${dataset.id}`} className="mx-1 text-gray-300">
                  •
                </span>
                <span id={`dataone-dataset-year-${dataset.id}`} className="font-medium text-gray-700">
                  {formatYearRange(dataset)}
                </span>
              </p>
              <p id={`dataone-dataset-description-${dataset.id}`} className="mt-1.5 text-xs text-gray-500 line-clamp-2 leading-relaxed">
                {getDescriptionSnippet(dataset)}
              </p>

              <div id={`dataone-dataset-meta-${dataset.id}`} className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-gray-500">
                {hasMultipleVersions ? (
                  <button
                    id={`dataone-dataset-versions-toggle-${dataset.id}`}
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      toggleVersionHistory(dataset);
                    }}
                    className="inline-flex items-center gap-1 rounded bg-blue-50 px-1.5 py-0.5 text-xs text-blue-700 hover:bg-blue-100 transition-colors"
                  >
                    <History className="h-3 w-3" />
                    {dataset.versionCount} versions
                    {isHistoryOpen ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                  </button>
                ) : (
                  <span
                    id={`dataone-dataset-versions-single-${dataset.id}`}
                    className="inline-flex items-center gap-1 rounded bg-gray-100 px-1.5 py-0.5 text-xs text-gray-500"
                  >
                    <History className="h-3 w-3" />
                    1 version
                  </span>
                )}
                {dataset.tncCategory && (
                  <span
                    id={`dataone-dataset-category-${dataset.id}`}
                    className="inline-flex items-center rounded-full border border-gray-200 bg-gray-50 px-2 py-0.5 text-gray-600"
                  >
                    {dataset.tncCategory}
                  </span>
                )}
                {fileSummary && (
                  <span id={`dataone-dataset-file-summary-${dataset.id}`} className="text-gray-500">
                    {fileSummary}
                  </span>
                )}
                {doi && (
                  <span id={`dataone-dataset-doi-${dataset.id}`} className="inline-flex items-center gap-1 text-gray-400">
                    <LinkIcon className="h-3 w-3" />
                    DOI: {doi}
                  </span>
                )}
              </div>
            </div>

            {isHistoryOpen && (
              <section
                id={`dataone-dataset-version-history-${dataset.id}`}
                className="bg-gray-50 border-t border-gray-100 px-4 py-3"
              >
                {versionState?.loading ? (
                  <div id={`dataone-dataset-version-history-loading-${dataset.id}`} className="flex items-center gap-2 text-sm text-gray-500">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Loading version history...
                  </div>
                ) : versionState?.error ? (
                  <p id={`dataone-dataset-version-history-error-${dataset.id}`} className="text-sm text-red-700">
                    {versionState.error}
                  </p>
                ) : (
                  <div id={`dataone-dataset-version-history-list-${dataset.id}`} className="space-y-1">
                    <h4 id={`dataone-dataset-version-history-title-${dataset.id}`} className="mb-2 text-xs font-medium text-gray-700">
                      Version History
                    </h4>
                    {visibleVersions.map((version, index) => {
                      const absoluteIndex = index;
                      const versionNumber = (versionState?.versions.length || 0) - absoluteIndex;
                      const isLatest = absoluteIndex === 0;
                      const isCurrent = version.dataoneId === dataset.dataoneId;
                      const summary = formatVersionFileSummary(version);
                      const isLoadingThisVersion = loadingVersionId === version.dataoneId;

                      return (
                        <button
                          id={`dataone-dataset-version-entry-${dataset.id}-${version.dataoneId}`}
                          key={version.dataoneId}
                          type="button"
                          disabled={isLoadingThisVersion}
                          onClick={() => { void handleVersionSelect(version.dataoneId); }}
                          className={`w-full rounded px-2 py-1.5 text-left text-xs transition-colors ${
                            isCurrent
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'text-gray-600 hover:bg-gray-100'
                          } ${isLoadingThisVersion ? 'opacity-70' : ''}`}
                        >
                          <div id={`dataone-dataset-version-entry-header-${dataset.id}-${version.dataoneId}`} className="flex items-center justify-between">
                            <span className="font-medium">
                              v{versionNumber}
                              {isLatest && (
                                <span className="ml-1 text-emerald-600">(latest)</span>
                              )}
                            </span>
                            <span className="text-gray-400">{formatVersionDate(version.dateUploaded)}</span>
                          </div>
                          {summary && (
                            <div id={`dataone-dataset-version-entry-summary-${dataset.id}-${version.dataoneId}`} className="mt-0.5 text-gray-500">
                              {summary}
                            </div>
                          )}
                        </button>
                      );
                    })}

                    {(versionState?.versions.length || 0) > 3 && (
                      <button
                        id={`dataone-dataset-version-history-show-all-${dataset.id}`}
                        type="button"
                        onClick={() => toggleShowAllVersions(dataset.seriesId)}
                        className="mt-1 w-full py-1 text-center text-xs text-emerald-700 hover:underline"
                      >
                        {versionState?.showAll
                          ? 'Show less'
                          : `Show all ${versionState?.versions.length || 0} versions`}
                      </button>
                    )}
                  </div>
                )}
              </section>
            )}
          </article>
        );
      })}
    </div>
  );
}
