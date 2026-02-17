import type { ExportActionLayer } from './types';
import { formatEstimatedSize } from './utils/sizeEstimator';

interface ExportSummaryProps {
  layers: ExportActionLayer[];
}

export function ExportSummary({ layers }: ExportSummaryProps) {
  const includedLayers = layers.filter((layer) => (
    layer.selectedFormatIds.length > 0 && layer.selectedViews.length > 0
  ));
  const knownLayerEstimates = includedLayers
    .map((layer) => layer.estimatedBytes)
    .filter((bytes): bytes is number => typeof bytes === 'number');
  const hasUnavailableEstimates = includedLayers.some((layer) => typeof layer.estimatedBytes !== 'number');
  const totalEstimatedBytes = knownLayerEstimates.reduce((sum, bytes) => sum + bytes, 0);

  return (
    <section
      id="export-builder-summary-section"
      className="rounded-xl border border-slate-200 bg-slate-50 p-4"
      aria-labelledby="export-builder-summary-title"
    >
      <h3 id="export-builder-summary-title" className="text-sm font-semibold text-slate-800">
        Export summary
      </h3>

      {includedLayers.length === 0 ? (
        <p id="export-builder-summary-empty" className="mt-2 text-sm text-slate-600">
          Select at least one format to build an export.
        </p>
      ) : (
        <>
          <ul id="export-builder-summary-list" className="mt-3 space-y-2">
            {includedLayers.map((layer) => (
              <li
                id={`export-builder-summary-item-${layer.layerId}`}
                key={layer.layerId}
                className="text-sm text-slate-700"
              >
                <span
                  id={`export-builder-summary-item-layer-${layer.layerId}`}
                  className="font-semibold text-slate-800"
                >
                  {layer.layerName}:
                </span>{' '}
                <span id={`export-builder-summary-item-copy-${layer.layerId}`}>
                  {layer.selectedViews.length} {layer.selectedViews.length === 1 ? 'view' : 'views'} •{' '}
                  {layer.selectedFormatLabels.join(' + ')} •{' '}
                  {typeof layer.estimatedBytes === 'number'
                    ? `~${formatEstimatedSize(layer.estimatedBytes)}`
                    : 'Size unavailable'}
                  {layer.includeQueryDefinition ? ' • Query JSON' : ''}
                </span>
              </li>
            ))}
          </ul>

          <div
            id="export-builder-summary-total-row"
            className="mt-4 flex items-center justify-between rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2"
          >
            <span id="export-builder-summary-total-label" className="text-sm font-semibold text-emerald-900">
              Estimated total size
            </span>
            <span id="export-builder-summary-total-value" className="text-sm font-bold text-emerald-800">
              {hasUnavailableEstimates
                ? `~${formatEstimatedSize(totalEstimatedBytes)} + unknown`
                : `~${formatEstimatedSize(totalEstimatedBytes)}`}
            </span>
          </div>
        </>
      )}
    </section>
  );
}
