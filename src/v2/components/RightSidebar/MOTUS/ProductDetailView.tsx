import type { MotusTaggedAnimalDetail } from '../../../../services/motusService';

interface ProductDetailViewProps {
  detail: MotusTaggedAnimalDetail;
  movementDisclaimer: string;
  isLayerPinned: boolean;
  onBack: () => void;
  onLoadOnMap: () => void;
  onChangeWindow: () => void;
}

function formatDate(value: string | null): string {
  if (!value) return 'Unknown';
  const parsed = new Date(`${value}T00:00:00Z`);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function formatRange(start: string | null, end: string | null): string {
  return `${formatDate(start)} to ${formatDate(end)}`;
}

export function ProductDetailView({
  detail,
  movementDisclaimer,
  isLayerPinned,
  onBack,
  onLoadOnMap,
  onChangeWindow,
}: ProductDetailViewProps) {
  return (
    <div id="motus-detail-view" className="space-y-4">
      <button
        id="motus-detail-back-button"
        type="button"
        onClick={onBack}
        className="text-sm font-medium text-gray-700 hover:text-gray-900"
      >
        &larr; Back to species
      </button>

      <div id="motus-detail-card" className="rounded-lg border border-gray-200 bg-white p-4 space-y-3">
        <div id="motus-detail-heading">
          <h3 id="motus-detail-title" className="text-base font-semibold text-gray-900">
            {detail.speciesEnglish}
          </h3>
          <p id="motus-detail-scientific-name" className="text-sm text-gray-600 italic">
            {detail.speciesScientific}
          </p>
          <p id="motus-detail-tag-id" className="text-xs text-gray-500 mt-1">
            Tag ID {detail.tagId}{detail.deployId != null ? ` • Deploy ${detail.deployId}` : ''}
          </p>
        </div>

        <dl id="motus-detail-metadata-grid" className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
          <dt id="motus-detail-deployment-window-label" className="text-gray-500">Deployment window</dt>
          <dd id="motus-detail-deployment-window-value" className="text-right font-medium text-gray-900">
            {formatRange(detail.deploymentStart, detail.deploymentEnd)}
          </dd>

          <dt id="motus-detail-detection-window-label" className="text-gray-500">Detection window</dt>
          <dd id="motus-detail-detection-window-value" className="text-right font-medium text-gray-900">
            {formatRange(detail.detectionWindowStart, detail.detectionWindowEnd)}
          </dd>

          <dt id="motus-detail-detection-count-label" className="text-gray-500">Detections</dt>
          <dd id="motus-detail-detection-count-value" className="text-right font-medium text-gray-900">
            {detail.detectionCount.toLocaleString()}
          </dd>

          <dt id="motus-detail-hit-range-label" className="text-gray-500">Hit count range</dt>
          <dd id="motus-detail-hit-range-value" className="text-right font-medium text-gray-900">
            {detail.minHitCountObserved ?? 0} to {detail.maxHitCountObserved ?? 0}
          </dd>

          <dt id="motus-detail-sex-age-label" className="text-gray-500">Sex / age</dt>
          <dd id="motus-detail-sex-age-value" className="text-right font-medium text-gray-900">
            {(detail.sex || 'U').toUpperCase()} / {detail.age || 'unknown'}
          </dd>
        </dl>

        <div id="motus-detail-quality-summary" className="rounded-md border border-gray-200 bg-slate-50 p-3">
          <p id="motus-detail-quality-summary-title" className="text-xs font-semibold uppercase tracking-wide text-gray-600">
            Detection quality summary
          </p>
          <p id="motus-detail-quality-summary-body" className="mt-1 text-xs text-gray-700">
            {detail.motusFilterBreakdown.length > 0
              ? detail.motusFilterBreakdown.map((entry) => `filter ${entry.filterValue}: ${entry.count}`).join(' • ')
              : 'No detections in the selected date and quality window.'}
          </p>
          <button
            id="motus-detail-change-window-button"
            type="button"
            onClick={onChangeWindow}
            className="mt-2 text-xs font-medium text-emerald-700 hover:text-emerald-800"
          >
            Change window
          </button>
        </div>

        <div id="motus-detail-disclaimer" className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2">
          <p id="motus-detail-disclaimer-text" className="text-xs text-amber-800 leading-relaxed">
            {movementDisclaimer}
          </p>
        </div>

        <button
          id="motus-detail-load-map-button"
          type="button"
          onClick={onLoadOnMap}
          className="w-full rounded-lg bg-[#2e7d32] text-white text-sm font-medium py-2.5
                     hover:bg-[#256d29] transition-colors"
        >
          {isLayerPinned ? 'Remove from Map' : 'Load on Map'}
        </button>

        <div id="motus-detail-attribution-block" className="border-t border-gray-100 pt-3 text-xs text-gray-600 space-y-2">
          <p id="motus-detail-attribution-text">
            Source: Motus Wildlife Tracking System (Birds Canada) and The Nature Conservancy.
          </p>
          <a
            id="motus-detail-methodology-link"
            href="https://docs.motus.org/en/about-motus/how-data-are-processed"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 font-medium text-emerald-700 hover:text-emerald-800"
          >
            Motus methodology documentation
          </a>
        </div>
      </div>
    </div>
  );
}
