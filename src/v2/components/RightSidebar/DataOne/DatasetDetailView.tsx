// ============================================================================
// DatasetDetailView — Lightweight drill-down details for a DataOne dataset.
// ============================================================================

import { useEffect, useState } from 'react';
import { ExternalLink } from 'lucide-react';
import { dataOneService, type DataOneDataset, type DataOneDatasetDetail } from '../../../../services/dataOneService';
import { InlineLoadingRow } from '../../shared/loading/LoadingPrimitives';

interface DatasetDetailViewProps {
  dataset: DataOneDataset;
  onBack: () => void;
}

function formatDate(value: Date | null | undefined): string {
  if (!value) return 'Unknown';
  return value.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

export function DatasetDetailView({ dataset, onBack }: DatasetDetailViewProps) {
  const [details, setDetails] = useState<DataOneDatasetDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

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

    return () => { cancelled = true; };
  }, [dataset.dataoneId]);

  return (
    <div id="dataone-dataset-detail-view" className="space-y-4">
      <button
        id="dataone-detail-back-button"
        onClick={onBack}
        className="text-sm font-medium text-emerald-700 hover:text-emerald-800"
      >
        &larr; Back to Datasets
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
                {formatDate(dataset.temporalCoverage.beginDate)} to {formatDate(dataset.temporalCoverage.endDate)}
              </dd>
              <dt id="dataone-detail-category-label" className="text-gray-500">Primary category</dt>
              <dd id="dataone-detail-category-value" className="text-right text-gray-800">{dataset.tncCategory || 'Unspecified'}</dd>
            </dl>
          </section>

          {details?.authors && details.authors.length > 0 && (
            <section id="dataone-detail-authors-section">
              <h4 id="dataone-detail-authors-label" className="mb-1 font-semibold text-gray-900">Authors</h4>
              <p id="dataone-detail-authors-value">{details.authors.join(', ')}</p>
            </section>
          )}

          {(dataset.datasetUrl || details?.dataUrl) && (
            <section id="dataone-detail-actions-section" className="pt-1">
              <a
                id="dataone-detail-external-link"
                href={dataset.datasetUrl || details?.dataUrl || '#'}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-sm font-medium text-emerald-700 hover:text-emerald-800"
              >
                Open in DataONE
                <ExternalLink className="h-4 w-4" />
              </a>
            </section>
          )}
        </div>
      )}
    </div>
  );
}
