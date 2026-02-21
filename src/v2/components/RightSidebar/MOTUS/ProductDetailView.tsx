import type { MotusBrowseItem } from './ProductListView';

interface ProductDetailViewProps {
  item: MotusBrowseItem;
  onBack: () => void;
}

export function ProductDetailView({ item, onBack }: ProductDetailViewProps) {
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
            {item.title}
          </h3>
          <p id="motus-detail-scientific-name" className="text-sm text-gray-600 italic">
            {item.scientificName}
          </p>
        </div>

        <dl id="motus-detail-metadata-grid" className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
          <dt id="motus-detail-tag-count-label" className="text-gray-500">Tag summary</dt>
          <dd id="motus-detail-tag-count-value" className="text-right font-medium text-gray-900">
            {item.tagCountLabel}
          </dd>

          <dt id="motus-detail-data-type-label" className="text-gray-500">Data type</dt>
          <dd id="motus-detail-data-type-value" className="text-right font-medium text-gray-900">
            Detection runs
          </dd>

          <dt id="motus-detail-notes-label" className="text-gray-500">Notes</dt>
          <dd id="motus-detail-notes-value" className="text-right font-medium text-gray-900">
            {item.notes}
          </dd>
        </dl>

        <div id="motus-detail-disclaimer" className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2">
          <p id="motus-detail-disclaimer-text" className="text-xs text-amber-800 leading-relaxed">
            Flight lines are inferred representations and should not be treated as exact animal paths.
          </p>
        </div>

        <button
          id="motus-detail-load-map-button"
          type="button"
          className="w-full rounded-lg bg-[#2e7d32] text-white text-sm font-medium py-2.5
                     hover:bg-[#256d29] transition-colors"
        >
          Load on Map
        </button>
      </div>
    </div>
  );
}
