// ============================================================================
// DataOneOverviewTab — Layer context + key stats + Browse CTA (DFT-027).
// ============================================================================

interface DataOneOverviewTabProps {
  totalCount: number;
  loading: boolean;
  onBrowseClick: () => void;
}

export function DataOneOverviewTab({ totalCount, loading, onBrowseClick }: DataOneOverviewTabProps) {
  const totalDisplay = loading ? '...' : totalCount.toLocaleString();

  return (
    <div id="dataone-overview-tab" className="space-y-5">
      <div id="dataone-overview-description" className="space-y-3">
        <p id="dataone-overview-description-primary" className="text-sm text-gray-700 leading-relaxed">
          Research data across all categories from DataONE repositories. Datasets are pointers
          to files and metadata, helping you discover what exists and then open the source record.
        </p>
        <p id="dataone-overview-description-secondary" className="text-sm text-gray-600 leading-relaxed">
          Use Browse to search by title, filter by TNC category, and constrain temporal coverage.
        </p>
      </div>

      <div id="dataone-overview-metadata" className="bg-slate-50 rounded-lg p-4">
        <dl id="dataone-overview-metadata-grid" className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
          <dt id="dataone-overview-total-label" className="text-gray-500">Datasets indexed</dt>
          <dd id="dataone-overview-total-value" className="text-right font-medium text-gray-900">
            {totalDisplay}
          </dd>
          <dt id="dataone-overview-scope-label" className="text-gray-500">Scope</dt>
          <dd id="dataone-overview-scope-value" className="text-right font-medium text-gray-900">
            All categories
          </dd>
          <dt id="dataone-overview-row-type-label" className="text-gray-500">Row type</dt>
          <dd id="dataone-overview-row-type-value" className="text-right font-medium text-gray-900">
            Pointer datasets
          </dd>
          <dt id="dataone-overview-source-label" className="text-gray-500">Source</dt>
          <dd id="dataone-overview-source-value" className="text-right font-medium text-gray-900">
            DataONE FeatureServer
          </dd>
        </dl>
      </div>

      <button
        id="dataone-overview-browse-cta"
        onClick={onBrowseClick}
        className="w-full py-3 bg-[#2e7d32] text-white font-medium rounded-lg
                   hover:bg-[#256d29] hover:scale-[1.02] active:scale-100
                   focus:outline-none focus:ring-2 focus:ring-[#2e7d32] focus:ring-offset-2
                   transition-all duration-150 ease-out text-sm min-h-[44px]"
      >
        Browse Features &rarr;
      </button>
    </div>
  );
}
