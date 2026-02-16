// ============================================================================
// DatasetListView — DataOne dataset list cards for browse results.
// ============================================================================

import { Link as LinkIcon } from 'lucide-react';
import type { DataOneDataset } from '../../../../services/dataOneService';

interface DatasetListViewProps {
  datasets: DataOneDataset[];
  loading: boolean;
  onViewDetail: (dataset: DataOneDataset) => void;
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

export function DatasetListView({ datasets, loading, onViewDetail }: DatasetListViewProps) {
  return (
    <div id="dataone-dataset-list-view" className={`space-y-2 ${loading ? 'opacity-60' : ''}`}>
      {datasets.map((dataset) => {
        const doi = getDoi(dataset);
        const fileSummary = formatFileTypes(dataset);

        return (
          <article
            id={`dataone-dataset-card-${dataset.id}`}
            key={dataset.id}
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
            className="cursor-pointer rounded-lg border border-gray-200 bg-white p-3 transition-colors duration-150 hover:border-emerald-300 hover:bg-emerald-50/30 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-1"
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
          </article>
        );
      })}
    </div>
  );
}
