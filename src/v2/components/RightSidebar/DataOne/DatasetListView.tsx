// ============================================================================
// DatasetListView — DataOne dataset list cards for browse results.
// ============================================================================

import { ExternalLink } from 'lucide-react';
import type { DataOneDataset } from '../../../../services/dataOneService';

interface DatasetListViewProps {
  datasets: DataOneDataset[];
  loading: boolean;
  onViewDetail: (dataset: DataOneDataset) => void;
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

export function DatasetListView({ datasets, loading, onViewDetail }: DatasetListViewProps) {
  return (
    <div id="dataone-dataset-list-view" className={`space-y-2 ${loading ? 'opacity-60' : ''}`}>
      {datasets.map((dataset) => (
        <article
          id={`dataone-dataset-card-${dataset.id}`}
          key={dataset.id}
          className="rounded-lg border border-gray-200 bg-white p-3"
        >
          <h3 id={`dataone-dataset-title-${dataset.id}`} className="text-sm font-semibold text-gray-900 line-clamp-2">
            {dataset.title}
          </h3>

          <div id={`dataone-dataset-meta-${dataset.id}`} className="mt-2 flex flex-wrap gap-1.5 text-xs">
            <span id={`dataone-dataset-year-${dataset.id}`} className="rounded bg-gray-100 px-2 py-0.5 text-gray-700">
              {formatYearRange(dataset)}
            </span>
            {dataset.tncCategory && (
              <span id={`dataone-dataset-category-${dataset.id}`} className="rounded bg-emerald-50 px-2 py-0.5 text-emerald-700">
                {dataset.tncCategory}
              </span>
            )}
            {dataset.filesSummary?.total != null && (
              <span id={`dataone-dataset-file-count-${dataset.id}`} className="rounded bg-blue-50 px-2 py-0.5 text-blue-700">
                {dataset.filesSummary.total} file{dataset.filesSummary.total === 1 ? '' : 's'}
              </span>
            )}
          </div>

          <div id={`dataone-dataset-actions-${dataset.id}`} className="mt-3 flex items-center justify-between gap-2">
            <button
              id={`dataone-dataset-details-button-${dataset.id}`}
              onClick={() => onViewDetail(dataset)}
              className="text-xs font-medium text-emerald-700 hover:text-emerald-800"
            >
              Details &rarr;
            </button>

            {dataset.datasetUrl ? (
              <a
                id={`dataone-dataset-external-link-${dataset.id}`}
                href={dataset.datasetUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs text-gray-600 hover:text-gray-800"
              >
                Open in DataONE
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            ) : (
              <span id={`dataone-dataset-external-link-disabled-${dataset.id}`} className="text-xs text-gray-400">
                DataONE link unavailable
              </span>
            )}
          </div>
        </article>
      ))}
    </div>
  );
}
